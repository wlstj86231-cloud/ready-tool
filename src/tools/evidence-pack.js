import { presets } from "../data/presets.js";
import { readFileFacts, streamCrc, crc32 } from "../lib/checksum.js";
import { readImageInfo } from "../lib/exif.js";
import { FONT_STACK, canvasToBlob, decodeToCanvas, isImageFile, releaseCanvas, thumbnailUrl, toJpeg, wrapText } from "../lib/image.js";
import * as store from "../lib/store.js";
import { $, $all, cleanNamePart, dateTimeLabel, downloadBlob, escapeHtml, extensionOf, formatBytes, loadPdfLib, setStatus, toCsv, ymd } from "../lib/util.js";
import { buildZip, textEntry } from "../lib/zip.js";

const MAX_FILES = 150;
const STORE_LIMIT = 100 * 1024 * 1024; // bigger files are not kept for the next visit
const SHARE_SIDE = 1600;
const BORIBAY_UTM = "utm_source=goatool.com&utm_medium=referral&utm_campaign=support";

const state = {
  type: "machinery",
  tradeName: "",
  files: [],
  pendingItem: "",
  busy: false,
};

const fileInput = $("#fileInput");
const statusLine = $("#status");
const resultLine = $("#result");

init();

async function init() {
  const params = new URLSearchParams(location.search);
  const requested = params.get("type");
  if (presets[requested]) state.type = requested;
  syncTypeRadios();
  bindEvents();
  render();
  await offerRestore(Boolean(presets[requested]));
}

function preset() {
  return presets[state.type];
}

function itemById(id) {
  return preset().items.find((item) => item.id === id) || null;
}

function syncTypeRadios() {
  $all('input[name="tradeType"]').forEach((radio) => {
    radio.checked = radio.value === state.type;
  });
  $("#tradeName").placeholder = `예: ${preset().example}`;
  $("#presetIntro").textContent = preset().intro;
}

function bindEvents() {
  $all('input[name="tradeType"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state.type = radio.value;
      // Items that the other checklist does not have show as "not chosen" but are kept,
      // so switching back restores them.
      syncTypeRadios();
      persistMeta();
      render();
    })
  );
  $("#tradeName").addEventListener("input", (event) => {
    state.tradeName = event.target.value;
    persistMeta();
    renderSummary();
  });
  $("#bulkAdd").addEventListener("click", () => openPicker(""));
  fileInput.addEventListener("change", async () => {
    const files = [...fileInput.files];
    fileInput.value = "";
    if (files.length) await addFiles(files, state.pendingItem);
  });
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("change", onDocumentChange);
  $("#zipOriginal").addEventListener("click", () => runExport(downloadOriginalZip));
  $("#zipShare").addEventListener("click", () => runExport(downloadShareZip));
  $("#printSheet").addEventListener("click", printChecklist);
  $("#photoPdf").addEventListener("click", () => runExport(downloadPhotoPdf));
  $("#listTxt").addEventListener("click", () => downloadBlob(new Blob([listText()], { type: "text/plain;charset=utf-8" }), `${packBaseName()}_증빙목록.txt`));
  $("#clearAll").addEventListener("click", clearEverything);
}

function openPicker(itemId) {
  state.pendingItem = itemId;
  const item = itemById(itemId);
  const accept = !item
    ? ""
    : item.kind === "photo"
      ? "image/*"
      : item.kind === "video"
        ? "video/*,image/*"
        : item.kind === "doc"
          ? "image/*,application/pdf,.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.csv,.txt"
          : "";
  if (accept) fileInput.setAttribute("accept", accept);
  else fileInput.removeAttribute("accept");
  fileInput.click();
}

function onDocumentClick(event) {
  const add = event.target.closest("[data-add]");
  if (add) {
    openPicker(add.dataset.add);
    return;
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    removeFile(remove.dataset.remove);
  }
}

function onDocumentChange(event) {
  const move = event.target.closest("[data-move]");
  if (move) {
    const file = state.files.find((entry) => entry.id === move.dataset.move);
    if (!file) return;
    file.itemId = move.value;
    store.updateFile(file.id, { itemId: file.itemId });
    render();
    return;
  }
  const memo = event.target.closest("[data-memo]");
  if (memo) {
    const file = state.files.find((entry) => entry.id === memo.dataset.memo);
    if (!file) return;
    file.memo = memo.value.slice(0, 80);
    store.updateFile(file.id, { memo: file.memo });
    renderSummary();
  }
}

async function addFiles(files, itemId) {
  if (state.busy) return;
  const room = MAX_FILES - state.files.length;
  if (room <= 0) {
    setStatus(statusLine, `한 묶음에는 파일을 ${MAX_FILES}개까지 넣을 수 있습니다. 거래를 나눠서 묶어 주세요.`, "warn");
    return;
  }
  const accepted = files.slice(0, room);
  state.busy = true;
  const overLimit = files.length - accepted.length;
  let added = 0;
  let failed = 0;
  let notStored = 0;
  for (const [index, file] of accepted.entries()) {
    setStatus(statusLine, `파일 확인 중 ${index + 1}/${accepted.length}: ${file.name}`, "busy");
    try {
      const record = await describeFile(file, itemId);
      record.stored = file.size <= STORE_LIMIT ? await store.saveFile(storable(record, file)) : false;
      if (!record.stored) notStored += 1;
      state.files.push(record);
      added += 1;
      render();
    } catch (error) {
      console.error(error);
      failed += 1;
    }
  }
  state.busy = false;
  persistMeta();
  const notes = [`${added}개 넣었습니다.`];
  if (failed) notes.push(`${failed}개는 읽지 못해 넣지 못했습니다.`);
  if (overLimit) notes.push(`한 묶음에 ${MAX_FILES}개까지만 넣을 수 있어 ${overLimit}개는 넣지 않았습니다.`);
  if (notStored) notes.push(`${notStored}개는 용량이 커서 다음 방문 때까지 저장되지 않습니다(지금 내려받기는 됩니다).`);
  setStatus(statusLine, notes.join(" "), failed || overLimit ? "warn" : "ok");
  renderSummary();
}

async function describeFile(file, itemId) {
  const record = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    addedOrder: Date.now() + Math.random(),
    blob: file,
    name: file.name,
    mime: file.type,
    size: file.size,
    lastModified: file.lastModified || Date.now(),
    itemId: itemId || "",
    memo: "",
    isImage: isImageFile(file),
    info: null,
    exif: null,
    sha256: "",
    crc: 0,
    hashed: false,
    thumbUrl: "",
    previewable: false,
  };
  const facts = await readFileFacts(file, {
    onBuffer: (buffer) => {
      if (!record.isImage) return;
      const info = readImageInfo(buffer);
      record.info = { format: info.format, width: info.width, height: info.height, orientation: info.exif?.orientation || 1 };
      if (info.exif) {
        record.exif = {
          date: info.exif.date ? info.exif.date.getTime() : 0,
          dateSource: info.exif.dateSource,
          hasGps: info.exif.hasGps,
          model: [info.exif.make, info.exif.model].filter(Boolean).join(" "),
        };
      }
    },
  });
  Object.assign(record, facts);
  if (record.isImage) await attachThumb(record);
  return record;
}

async function attachThumb(record) {
  try {
    record.thumbUrl = await thumbnailUrl(record.blob, record.info);
    record.previewable = true;
  } catch {
    record.previewable = false;
  }
}

function storable(record, blob) {
  const { thumbUrl, blob: _ignored, ...meta } = record;
  return { ...meta, blob };
}

function removeFile(id) {
  const index = state.files.findIndex((file) => file.id === id);
  if (index < 0) return;
  const [file] = state.files.splice(index, 1);
  if (file.thumbUrl) URL.revokeObjectURL(file.thumbUrl);
  store.deleteFile(id);
  render();
}

async function clearEverything() {
  if (state.files.length && !confirm("넣은 사진과 파일을 이 기기에서 모두 지울까요? 이미 내려받은 묶음은 지워지지 않습니다.")) return;
  state.files.forEach((file) => file.thumbUrl && URL.revokeObjectURL(file.thumbUrl));
  state.files = [];
  state.tradeName = "";
  $("#tradeName").value = "";
  await store.clearAll();
  setStatus(statusLine, "넣은 파일을 모두 지웠습니다.", "ok");
  setStatus(resultLine, "");
  render();
}

function persistMeta() {
  store.saveMeta({ type: state.type, tradeName: state.tradeName, savedAt: Date.now() });
}

async function offerRestore(typeFromLink) {
  const [meta, records] = await Promise.all([store.loadMeta(), store.loadFiles()]);
  if (!records.length) {
    if (meta && !typeFromLink && presets[meta.type]) {
      state.type = meta.type;
      syncTypeRadios();
      render();
    }
    return;
  }
  const box = $("#restore");
  const when = meta?.savedAt ? dateTimeLabel(new Date(meta.savedAt)) : "";
  const kind = presets[meta?.type]?.label || "거래";
  box.hidden = false;
  box.innerHTML = `<p><strong>지난번에 넣던 파일이 이 기기에 남아 있습니다.</strong> ${escapeHtml(kind)} · 파일 ${records.length}개${when ? ` · ${escapeHtml(when)} 저장` : ""}</p>
    <div class="btn-row"><button type="button" class="btn primary" id="restoreYes">이어서 하기</button><button type="button" class="btn ghost" id="restoreNo">지우고 새로 시작</button></div>`;
  $("#restoreYes").addEventListener("click", async () => {
    box.hidden = true;
    if (meta && presets[meta.type]) state.type = meta.type;
    state.tradeName = meta?.tradeName || "";
    $("#tradeName").value = state.tradeName;
    syncTypeRadios();
    setStatus(statusLine, "지난번 파일을 불러오는 중입니다…", "busy");
    records.sort((a, b) => (a.addedOrder || 0) - (b.addedOrder || 0));
    for (const record of records) {
      const restored = { ...record, thumbUrl: "" };
      if (restored.isImage && restored.blob) await attachThumb(restored);
      state.files.push(restored);
    }
    setStatus(statusLine, `파일 ${records.length}개를 불러왔습니다.`, "ok");
    render();
  });
  $("#restoreNo").addEventListener("click", async () => {
    box.hidden = true;
    await store.clearAll();
  });
}

/* ---------- naming and ordering ---------- */

function shotDate(file) {
  return file.exif?.date ? new Date(file.exif.date) : new Date(file.lastModified);
}

function dateKind(file) {
  return file.exif?.date ? "사진 촬영 정보" : "파일 저장 날짜";
}

function tradeLabel() {
  return cleanNamePart(state.tradeName, preset().short);
}

function packBaseName() {
  return `${ymd(new Date())}_${tradeLabel()}`;
}

// Files in checklist order, then by shot time. Unassigned files go last.
function orderedFiles() {
  const order = new Map(preset().items.map((item, index) => [item.id, index]));
  return [...state.files].sort((a, b) => {
    const ai = order.has(a.itemId) ? order.get(a.itemId) : 999;
    const bi = order.has(b.itemId) ? order.get(b.itemId) : 999;
    return ai - bi || shotDate(a) - shotDate(b) || a.name.localeCompare(b.name, "ko");
  });
}

function plannedNames(extOverride = null) {
  const files = orderedFiles();
  const width = files.length >= 100 ? 3 : 2;
  return files.map((file, index) => {
    const item = itemById(file.itemId);
    const ext = (extOverride && extOverride(file)) || extensionOf(file.name) || "bin";
    const number = String(index + 1).padStart(width, "0");
    return { file, item, number, name: `${ymd(shotDate(file))}_${tradeLabel()}_${number}_${item ? item.file : "기타"}.${ext}` };
  });
}

/* ---------- checks ---------- */

function analyse() {
  const p = preset();
  const counts = new Map(p.items.map((item) => [item.id, 0]));
  state.files.forEach((file) => counts.has(file.itemId) && counts.set(file.itemId, counts.get(file.itemId) + 1));
  const missingNeed = p.items.filter((item) => item.need && !counts.get(item.id));
  const missingOptional = p.items.filter((item) => !item.need && !counts.get(item.id));
  const unassigned = state.files.filter((file) => !itemById(file.itemId));
  const warnings = [];

  const noDate = state.files.filter((file) => file.isImage && !file.exif?.date);
  if (noDate.length) warnings.push(`촬영 정보가 없는 사진 ${noDate.length}장: 메신저로 받았거나 캡처·편집한 사진일 수 있습니다. 직접 찍은 원본이 있으면 원본으로 바꿔 넣으세요. (${listNames(noDate)})`);

  const dated = state.files.filter((file) => file.exif?.date).map((file) => ({ file, time: file.exif.date }));
  if (dated.length) {
    const latest = Math.max(...dated.map((entry) => entry.time));
    const old = dated.filter((entry) => latest - entry.time > 60 * 86400000).map((entry) => entry.file);
    if (old.length) warnings.push(`다른 사진보다 두 달 넘게 먼저 찍은 사진 ${old.length}장: 예전 사진이 섞이지 않았는지 확인하세요. (${listNames(old)})`);
    const future = dated.filter((entry) => entry.time > Date.now() + 86400000).map((entry) => entry.file);
    if (future.length) warnings.push(`촬영 날짜가 오늘보다 뒤인 사진 ${future.length}장: 휴대폰 날짜 설정이 틀렸을 수 있습니다. (${listNames(future)})`);
  }

  const byHash = new Map();
  state.files.forEach((file) => {
    if (!file.sha256) return;
    byHash.set(file.sha256, [...(byHash.get(file.sha256) || []), file]);
  });
  const duplicates = [...byHash.values()].filter((group) => group.length > 1);
  if (duplicates.length) warnings.push(`똑같은 파일이 두 번 이상 들어갔습니다: ${duplicates.map((group) => group.map((file) => file.name).join(" = ")).join(", ")}. 하나만 남기세요.`);

  const small = state.files.filter((file) => itemById(file.itemId)?.readable && file.info?.width && Math.min(file.info.width, file.info.height) < 640);
  if (small.length) warnings.push(`글자·숫자가 읽혀야 하는 항목인데 사진이 작습니다(짧은 변 640픽셀 미만): ${listNames(small)}. 확대해서 글자가 읽히는지 확인하고, 안 읽히면 다시 찍으세요.`);

  const gps = state.files.filter((file) => file.exif?.hasGps);
  const notes = [];
  if (gps.length) notes.push(`위치정보(GPS)가 들어 있는 사진 ${gps.length}장: 보관용 원본은 그대로 두고, 남에게 보낼 때는 위치정보를 지운 '보내기용 묶음'을 쓰세요.`);
  const unhashed = state.files.filter((file) => !file.hashed);
  if (unhashed.length) notes.push(`용량이 커서 파일 지문(SHA-256)을 계산하지 않은 파일 ${unhashed.length}개: ${listNames(unhashed)}`);

  return { counts, missingNeed, missingOptional, unassigned, warnings, notes };
}

function listNames(files) {
  const names = files.slice(0, 4).map((file) => file.name);
  return files.length > 4 ? `${names.join(", ")} 외 ${files.length - 4}개` : names.join(", ");
}

/* ---------- rendering ---------- */

function render() {
  renderChecklist();
  renderLoose();
  renderSummary();
}

function renderChecklist() {
  const p = preset();
  const { counts } = analyse();
  $("#checklist").innerHTML = p.groups
    .map((group) => {
      const items = p.items.filter((item) => item.group === group.id);
      return `<section class="ck-group"><h3>${escapeHtml(group.label)}</h3><ol class="ck-list">${items
        .map((item) => {
          const count = counts.get(item.id) || 0;
          const files = orderedFiles().filter((file) => file.itemId === item.id);
          const stateName = count ? "done" : item.need ? "missing" : "optional";
          return `<li class="ck-item" data-state="${stateName}">
            <div class="ck-head">
              <span class="ck-mark" aria-hidden="true">${count ? "✓" : ""}</span>
              <h4>${escapeHtml(item.name)}</h4>
              <span class="badge ${item.need ? "need" : "soft"}">${item.need ? "필수" : "있으면 좋음"}</span>
              <span class="ck-count">${count ? `${count}개 넣음` : item.need ? "아직 없음" : "없음"}</span>
            </div>
            <p class="ck-why">${escapeHtml(item.why)}</p>
            <p class="ck-tip"><strong>요령</strong> ${escapeHtml(item.tip)}</p>
            ${files.length ? `<div class="file-cards">${files.map(fileCard).join("")}</div>` : ""}
            <button type="button" class="btn add" data-add="${item.id}">${addLabel(item)}</button>
          </li>`;
        })
        .join("")}</ol></section>`;
    })
    .join("");
}

function addLabel(item) {
  if (item.kind === "video") return "영상 넣기";
  if (item.kind === "doc") return "서류·사진 넣기";
  if (item.kind === "any") return "사진·파일 넣기";
  return "사진 넣기";
}

function renderLoose() {
  const loose = orderedFiles().filter((file) => !itemById(file.itemId));
  $("#loose").innerHTML = loose.length
    ? `<p class="loose-title"><strong>항목을 아직 고르지 않은 파일 ${loose.length}개</strong> — 파일마다 어떤 항목인지 골라 주세요. 고르지 않으면 '기타'로 묶입니다.</p><div class="file-cards">${loose.map(fileCard).join("")}</div>`
    : "";
}

function fileCard(file) {
  const date = shotDate(file);
  const dateLine = file.exif?.date
    ? `<span class="fc-date">촬영 ${escapeHtml(dateTimeLabel(date))}</span>`
    : `<span class="fc-date warn">${file.isImage ? "촬영 정보 없음 · " : ""}파일 날짜 ${escapeHtml(dateTimeLabel(date))}</span>`;
  const size = file.info?.width ? ` · ${file.info.width}×${file.info.height}` : "";
  const thumb = file.thumbUrl
    ? `<img class="fc-thumb" src="${file.thumbUrl}" alt="" width="72" height="72" loading="lazy" />`
    : `<span class="fc-thumb fc-icon" aria-hidden="true">${escapeHtml((extensionOf(file.name) || "파일").toUpperCase().slice(0, 4))}</span>`;
  const options = [`<option value="">항목 고르기</option>`, ...preset().items.map((item) => `<option value="${item.id}"${item.id === file.itemId ? " selected" : ""}>${escapeHtml(item.name)}</option>`)].join("");
  return `<div class="fc">
    ${thumb}
    <div class="fc-body">
      <strong class="fc-name">${escapeHtml(file.name)}</strong>
      ${dateLine}
      <span class="fc-meta">${formatBytes(file.size)}${size}${file.exif?.hasGps ? " · 위치정보 있음" : ""}${file.isImage && !file.previewable ? " · 미리보기 불가" : ""}</span>
      <div class="fc-controls">
        <label><span class="visually-hidden">항목</span><select data-move="${file.id}" aria-label="${escapeHtml(file.name)} 항목">${options}</select></label>
        <label><span class="visually-hidden">메모</span><input data-memo="${file.id}" type="text" maxlength="80" value="${escapeHtml(file.memo)}" placeholder="메모 (예: 왼쪽 뒤 누유)" aria-label="${escapeHtml(file.name)} 메모" /></label>
      </div>
    </div>
    <button type="button" class="fc-remove" data-remove="${file.id}" aria-label="${escapeHtml(file.name)} 빼기">빼기</button>
  </div>`;
}

function renderSummary() {
  const box = $("#summary");
  const hasFiles = state.files.length > 0;
  ["#zipOriginal", "#zipShare", "#printSheet", "#photoPdf", "#listTxt"].forEach((id) => {
    $(id).disabled = !hasFiles || state.busy;
  });
  $("#photoPdf").disabled = !state.files.some((file) => file.previewable) || state.busy;
  renderNextSteps();
  if (!hasFiles) {
    box.innerHTML = `<p class="muted">사진이나 서류를 넣으면 여기에서 빠진 항목과 확인할 점을 알려 드립니다.</p>`;
    return;
  }
  const result = analyse();
  const p = preset();
  const total = state.files.reduce((sum, file) => sum + file.size, 0);
  const done = p.items.filter((item) => result.counts.get(item.id)).length;
  const preview = plannedNames().slice(0, 3);
  box.innerHTML = `
    <div class="stat-row">
      <div><span>넣은 파일</span><strong>${state.files.length}개</strong></div>
      <div><span>채운 항목</span><strong>${done}/${p.items.length}</strong></div>
      <div><span>빠진 필수 항목</span><strong class="${result.missingNeed.length ? "bad" : "good"}">${result.missingNeed.length}개</strong></div>
      <div><span>전체 용량</span><strong>${formatBytes(total)}</strong></div>
    </div>
    ${
      result.missingNeed.length
        ? `<div class="notice bad"><p><strong>꼭 남길 항목이 ${result.missingNeed.length}개 빠졌습니다.</strong></p><ul>${result.missingNeed.map((item) => `<li>${escapeHtml(item.name)} — ${escapeHtml(item.why.split(".")[0])}.</li>`).join("")}</ul><p>지금 내려받아도 되지만, 거래가 끝나기 전에 채워 두는 편이 안전합니다.</p></div>`
        : `<div class="notice ok"><p><strong>꼭 남길 항목을 모두 채웠습니다.</strong> 아래 확인할 점을 보고 내려받으세요.</p></div>`
    }
    ${result.unassigned.length ? `<div class="notice warn"><p>항목을 고르지 않은 파일 ${result.unassigned.length}개는 이름 끝에 '기타'가 붙습니다.</p></div>` : ""}
    ${result.warnings.length ? `<div class="notice warn"><p><strong>확인할 점</strong></p><ul>${result.warnings.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul></div>` : ""}
    ${result.notes.length ? `<div class="notice"><ul>${result.notes.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul></div>` : ""}
    ${result.missingOptional.length ? `<details class="optional-missing"><summary>있으면 좋은 항목 중 비어 있는 것 ${result.missingOptional.length}개</summary><ul>${result.missingOptional.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}</ul></details>` : ""}
    <div class="name-preview"><p><strong>이렇게 이름이 붙습니다</strong> (날짜_거래이름_번호_항목)</p><ul>${preview.map((entry) => `<li><code>${escapeHtml(entry.name)}</code> <small>← ${escapeHtml(entry.file.name)}</small></li>`).join("")}</ul></div>`;
}

function renderNextSteps() {
  const box = $("#nextSteps");
  if (!state.files.length) {
    box.innerHTML = "";
    return;
  }
  const steps = {
    machinery: [
      `판매글에 올릴 사진은 <strong>보내기용 묶음</strong>으로 받고, 명판 제조번호 뒷자리나 번호판은 <a href="/tools/image-redactor/">사진 속 번호 가리기</a>로 가린 뒤 올리세요.`,
      `계약서·정비 영수증이 여러 장이면 <a href="/tools/pdf-organizer/">서류·사진 PDF 하나로 묶기</a>로 한 파일로 만들어 두세요.`,
      `탁송이 필요하면 <a href="https://tripmarking.com/">농기계 탁송 견적 비교</a>에서 견적 받을 때 확인할 항목을 정리할 수 있습니다.`,
      `판매글을 올리거나 매물을 찾는다면 <a href="https://boribay.com/?category=MACHINERY&${BORIBAY_UTM}&utm_content=evidence-pack-machinery">보리장터 농기계 게시판</a>을 이용할 수 있습니다. 보리장터는 이 사이트와 같은 운영사(제이 미디어)의 지역 직거래 장터입니다.`,
    ],
    produce: [
      `운송장이나 입금 화면을 남에게 보여 줄 때는 <a href="/tools/image-redactor/">사진 속 번호 가리기</a>로 이름·주소·전화번호·계좌번호를 가리세요.`,
      `판매가 쌓이면 <a href="/tools/settlement-csv/">정산표 점검</a>으로 수량×단가와 입금액이 맞는지 확인하세요.`,
      `물건이 상해서 도착했다는 연락을 받으면 받은 쪽 사진(상자 겉면 → 개봉 → 내용물)과 대화를 같은 묶음에 넣고, 택배사 사고 접수를 서두르세요. <a href="/agri/guides/produce-shipping-evidence/">자세한 순서 보기</a>`,
      `농산물 직거래 판매글은 <a href="https://boribay.com/?category=PRODUCE&${BORIBAY_UTM}&utm_content=evidence-pack-produce">보리장터 농산물 게시판</a>에 올릴 수 있습니다(같은 운영사의 지역 직거래 장터).`,
    ],
    settlement: [
      `정산표는 먼저 <a href="/tools/settlement-csv/">정산표 점검</a>으로 수량×단가, 받을 돈과 입금액 차이, 빈 칸을 확인한 뒤 묶음에 넣으세요.`,
      `여러 장의 정산서·영수증은 <a href="/tools/pdf-organizer/">서류·사진 PDF 하나로 묶기</a>로 한 파일로 만들 수 있습니다.`,
      `한 해 농사의 손익을 따져 보려면 <a href="https://www.reportools.com/">농가 손익 계산기</a>를 함께 써 보세요.`,
    ],
  };
  box.innerHTML = `<h3>다음에 할 일</h3><ul>${steps[state.type].map((text) => `<li>${text}</li>`).join("")}</ul>`;
}

/* ---------- exports ---------- */

async function runExport(task) {
  if (state.busy) return;
  state.busy = true;
  renderSummary();
  try {
    await task();
  } catch (error) {
    console.error(error);
    setStatus(resultLine, error.message || "파일을 만들지 못했습니다. 파일 수를 줄여 다시 시도해 주세요.", "bad");
  } finally {
    state.busy = false;
    renderSummary();
  }
}

async function ensureCrc(file) {
  if (!file.crc && file.size) file.crc = await streamCrc(file.blob);
  return file.crc;
}

async function downloadOriginalZip() {
  missingBlobCheck();
  setStatus(resultLine, "보관용 묶음을 만드는 중입니다…", "busy");
  const folder = `${packBaseName()}_증빙`;
  const planned = plannedNames();
  const entries = [];
  for (const entry of planned) {
    entries.push({ name: `${folder}/${entry.name}`, data: entry.file.blob, size: entry.file.size, crc: await ensureCrc(entry.file), date: shotDate(entry.file) });
  }
  entries.unshift(textEntry(`${folder}/00_증빙목록.csv`, listCsv(planned)), textEntry(`${folder}/00_증빙목록.txt`, listText(planned)));
  const zip = buildZip(entries);
  downloadBlob(zip, `${packBaseName()}_증빙묶음_원본.zip`);
  setStatus(resultLine, `보관용 묶음을 만들었습니다 (${formatBytes(zip.size)}). 휴대폰과 컴퓨터 등 두 곳 이상에 보관하세요.`, "ok");
}

async function downloadShareZip() {
  missingBlobCheck();
  const folder = `${packBaseName()}_보내기용`;
  const resized = new Map();
  const images = state.files.filter((file) => file.previewable);
  let index = 0;
  for (const file of images) {
    index += 1;
    setStatus(resultLine, `사진 줄이는 중 ${index}/${images.length}…`, "busy");
    const output = await toJpeg(file.blob, SHARE_SIDE, 0.85, file.info);
    const bytes = new Uint8Array(await output.blob.arrayBuffer());
    resized.set(file.id, { blob: output.blob, size: bytes.length, crc: crc32(bytes) });
  }
  const planned = plannedNames((file) => (resized.has(file.id) ? "jpg" : null));
  const entries = [];
  for (const entry of planned) {
    const small = resized.get(entry.file.id);
    entries.push(
      small
        ? { name: `${folder}/${entry.name}`, data: small.blob, size: small.size, crc: small.crc, date: shotDate(entry.file) }
        : { name: `${folder}/${entry.name}`, data: entry.file.blob, size: entry.file.size, crc: await ensureCrc(entry.file), date: shotDate(entry.file) }
    );
  }
  entries.unshift(textEntry(`${folder}/00_목록.txt`, listText(planned, { share: true })));
  const zip = buildZip(entries);
  downloadBlob(zip, `${packBaseName()}_증빙묶음_보내기용.zip`);
  setStatus(resultLine, `보내기용 묶음을 만들었습니다 (${formatBytes(zip.size)}). 사진 ${resized.size}장을 줄이고 촬영 정보를 지웠습니다. 보내기 전에 화면 속 이름·주소·번호가 보이지 않는지 확인하세요.`, "ok");
}

function missingBlobCheck() {
  const missing = state.files.filter((file) => !file.blob);
  if (missing.length) throw new Error(`다시 넣어야 하는 파일이 있습니다: ${listNames(missing)}`);
}

function listRows(planned) {
  return planned.map((entry) => ({
    number: entry.number,
    item: entry.item ? entry.item.name : "기타",
    need: entry.item ? (entry.item.need ? "필수" : "있으면 좋음") : "",
    name: entry.name,
    original: entry.file.name,
    date: dateTimeLabel(shotDate(entry.file)),
    dateKind: dateKind(entry.file),
    size: entry.file.size,
    sha256: entry.file.sha256 || "계산 안 함(큰 파일)",
    memo: entry.file.memo || "",
  }));
}

function listCsv(planned = plannedNames()) {
  return toCsv([
    ["번호", "항목", "구분", "새 파일 이름", "원래 파일 이름", "촬영(파일) 일시", "날짜 출처", "크기(바이트)", "SHA-256", "메모"],
    ...listRows(planned).map((row) => [row.number, row.item, row.need, row.name, row.original, row.date, row.dateKind, row.size, row.sha256, row.memo]),
  ]);
}

function listText(planned = plannedNames(), { share = false } = {}) {
  const p = preset();
  const result = analyse();
  const lines = [
    share ? "거래 증빙 목록 (보내기용 사본)" : "거래 증빙 목록",
    `거래 종류: ${p.label}`,
    `거래 이름: ${tradeLabel()}`,
    `만든 날: ${dateTimeLabel(new Date())} (거래 증빙 도우미로 이 기기에서 작성)`,
    "",
    "[항목별 확인]",
    ...p.items.map((item) => {
      const count = result.counts.get(item.id) || 0;
      return `${count ? "[있음]" : item.need ? "[없음·필수]" : "[없음]"} ${item.name}${count ? ` — ${count}개` : ""}`;
    }),
    "",
    "[파일 목록]",
  ];
  listRows(planned).forEach((row) => {
    lines.push(`${row.number}. ${row.name}`);
    lines.push(`    항목: ${row.item} | 원래 이름: ${row.original} | ${row.dateKind}: ${row.date} | ${row.size.toLocaleString("ko-KR")}바이트`);
    if (!share) lines.push(`    SHA-256: ${row.sha256}`);
    if (row.memo) lines.push(`    메모: ${row.memo}`);
  });
  lines.push(
    "",
    "[알아 둘 점]",
    "- 촬영 날짜는 사진 파일 안의 촬영 정보(EXIF)를 읽은 값입니다. 촬영 정보가 없으면 파일 저장 날짜를 적었습니다. 이 값들은 휴대폰 설정이나 편집으로 바뀔 수 있어 그 자체로 날짜를 증명하지는 않습니다.",
    share
      ? "- 이 묶음의 사진은 크기를 줄이고 촬영 정보를 지운 사본입니다. 원본은 보낸 사람이 따로 보관합니다."
      : "- SHA-256은 파일 지문입니다. 'goatool.com/tools/hash-compare/'에서 이 목록과 파일을 넣으면 지금 묶은 파일과 같은지 대조할 수 있습니다.",
    "- 계약서·입금 내역 같은 서류를 함께 보관하세요. 이 목록은 법적 증명서가 아닙니다."
  );
  return `${lines.join("\r\n")}\r\n`;
}

function printChecklist() {
  const p = preset();
  const result = analyse();
  const planned = plannedNames();
  const isMachinery = state.type === "machinery";
  $("#printArea").innerHTML = `
    <h1>거래 증빙 점검표</h1>
    <p class="print-meta">거래 종류: ${escapeHtml(p.label)} · 거래 이름: ${escapeHtml(tradeLabel())} · 작성: ${escapeHtml(dateTimeLabel(new Date()))}</p>
    <h2>항목별 확인</h2>
    <table><thead><tr><th>확인</th><th>항목</th><th>구분</th><th>넣은 파일</th></tr></thead><tbody>
    ${p.items
      .map((item) => {
        const names = planned.filter((entry) => entry.file.itemId === item.id).map((entry) => entry.name);
        return `<tr><td>${names.length ? "■ 있음" : "□ 없음"}</td><td>${escapeHtml(item.name)}</td><td>${item.need ? "필수" : "선택"}</td><td>${names.map(escapeHtml).join("<br>") || "-"}</td></tr>`;
      })
      .join("")}
    </tbody></table>
    ${result.missingNeed.length ? `<p><strong>빠진 필수 항목:</strong> ${result.missingNeed.map((item) => escapeHtml(item.name)).join(", ")}</p>` : `<p><strong>필수 항목을 모두 채웠습니다.</strong></p>`}
    ${result.warnings.length ? `<h2>확인할 점</h2><ul>${result.warnings.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>` : ""}
    <h2>파일 목록</h2>
    <table><thead><tr><th>번호</th><th>새 파일 이름</th><th>촬영(파일) 일시</th><th>파일 지문(SHA-256 앞 16자리)</th></tr></thead><tbody>
    ${listRows(planned)
      .map((row) => `<tr><td>${row.number}</td><td>${escapeHtml(row.name)}${row.memo ? `<br><small>메모: ${escapeHtml(row.memo)}</small>` : ""}</td><td>${escapeHtml(row.date)}<br><small>${escapeHtml(row.dateKind)}</small></td><td><code>${escapeHtml(row.sha256.slice(0, 16))}</code></td></tr>`)
      .join("")}
    </tbody></table>
    ${
      isMachinery
        ? `<h2>서로 확인(선택)</h2><p>위 사진과 파일로 기계 상태를 함께 확인했습니다.</p><p class="sign">판매자 __________________ (서명) &nbsp;&nbsp; 구매자 __________________ (서명) &nbsp;&nbsp; 날짜 __________</p><p class="small">서명란은 서로 확인했다는 메모용이며 계약서를 대신하지 않습니다.</p>`
        : ""
    }
    <p class="small">거래 증빙 도우미(goatool.com)로 작성한 점검표입니다. 촬영 일시는 사진 촬영 정보 또는 파일 저장 날짜이며 바뀔 수 있습니다. 원본 파일은 따로 보관하세요.</p>`;
  document.body.classList.add("print-sheet");
  window.addEventListener("afterprint", () => document.body.classList.remove("print-sheet"), { once: true });
  window.print();
}

async function downloadPhotoPdf() {
  missingBlobCheck();
  const planned = plannedNames().filter((entry) => entry.file.previewable);
  if (!planned.length) throw new Error("PDF로 만들 수 있는 사진이 없습니다.");
  setStatus(resultLine, "PDF 도구를 불러오는 중입니다…", "busy");
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  pdf.setTitle(`거래 증빙 사진 - ${tradeLabel()}`);
  pdf.setProducer("거래 증빙 도우미 (goatool.com)");
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const addCanvasPage = async (canvas) => {
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.82);
    releaseCanvas(canvas);
    const image = await pdf.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  };
  await addCanvasPage(coverCanvas(planned));
  let index = 0;
  for (const entry of planned) {
    index += 1;
    setStatus(resultLine, `사진 증빙 PDF 만드는 중 ${index}/${planned.length}…`, "busy");
    await addCanvasPage(await photoPageCanvas(entry, index, planned.length));
  }
  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  downloadBlob(blob, `${packBaseName()}_증빙사진.pdf`);
  setStatus(resultLine, `사진 증빙 PDF를 만들었습니다 (사진 ${planned.length}쪽, ${formatBytes(blob.size)}). PDF를 열어 사진 순서와 글자가 맞는지 확인하세요.`, "ok");
}

const PAGE_W = 1240;
const PAGE_H = 1754;

function pageCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, PAGE_W, PAGE_H);
  context.fillStyle = "#1a1f1c";
  context.textBaseline = "top";
  return { canvas, context };
}

function coverCanvas(planned) {
  const p = preset();
  const result = analyse();
  const { canvas, context } = pageCanvas();
  let y = 110;
  context.font = `700 60px ${FONT_STACK}`;
  context.fillText("거래 증빙 사진", 90, y);
  y += 100;
  context.font = `400 30px ${FONT_STACK}`;
  [`거래 종류: ${p.label}`, `거래 이름: ${tradeLabel()}`, `만든 날: ${dateTimeLabel(new Date())}`, `사진 ${planned.length}장 · 사진이 아닌 파일 ${state.files.length - planned.length}개는 이 PDF에 넣지 않았습니다`].forEach((line) => {
    wrapText(context, line, PAGE_W - 180).forEach((part) => {
      context.fillText(part, 90, y);
      y += 46;
    });
  });
  y += 30;
  context.font = `700 34px ${FONT_STACK}`;
  context.fillText("항목별 확인", 90, y);
  y += 60;
  context.font = `400 28px ${FONT_STACK}`;
  p.items.forEach((item) => {
    const count = result.counts.get(item.id) || 0;
    context.fillStyle = count ? "#1d6b3a" : item.need ? "#b3261e" : "#5b6670";
    context.fillText(`${count ? "■" : "□"} ${item.name}${count ? ` (${count})` : item.need ? " — 없음(필수)" : ""}`, 110, y);
    y += 44;
  });
  context.fillStyle = "#4b5560";
  context.font = `400 24px ${FONT_STACK}`;
  y = PAGE_H - 170;
  wrapText(context, "촬영 일시는 사진 촬영 정보(EXIF) 또는 파일 저장 날짜이며 바뀔 수 있습니다. 이 PDF는 확인용 정리본이고 원본 사진은 따로 보관해야 합니다. 거래 증빙 도우미(goatool.com)", PAGE_W - 180).forEach((part) => {
    context.fillText(part, 90, y);
    y += 36;
  });
  return canvas;
}

async function photoPageCanvas(entry, index, total) {
  const { canvas, context } = pageCanvas();
  context.font = `700 40px ${FONT_STACK}`;
  context.fillText(`${entry.number}. ${entry.item ? entry.item.name : "기타"}`, 70, 60);
  const photo = await decodeToCanvas(entry.file.blob, 1600, entry.file.info);
  const boxW = PAGE_W - 140;
  const boxH = 1180;
  const scale = Math.min(boxW / photo.width, boxH / photo.height);
  const w = Math.round(photo.width * scale);
  const h = Math.round(photo.height * scale);
  const x = Math.round((PAGE_W - w) / 2);
  const top = 140;
  context.drawImage(photo, x, top + Math.round((boxH - h) / 2), w, h);
  releaseCanvas(photo);
  context.strokeStyle = "#d9dee3";
  context.lineWidth = 2;
  context.strokeRect(70, top, boxW, boxH);
  let y = top + boxH + 36;
  context.font = `400 28px ${FONT_STACK}`;
  const lines = [
    `${dateKind(entry.file)}: ${dateTimeLabel(shotDate(entry.file))}`,
    `원래 파일 이름: ${entry.file.name}`,
    `새 파일 이름: ${entry.name}`,
    entry.file.sha256 ? `파일 지문(SHA-256 앞 16자리): ${entry.file.sha256.slice(0, 16)}` : "",
    entry.file.memo ? `메모: ${entry.file.memo}` : "",
  ].filter(Boolean);
  for (const line of lines) {
    for (const part of wrapText(context, line, PAGE_W - 140)) {
      context.fillText(part, 70, y);
      y += 40;
    }
  }
  context.fillStyle = "#5b6670";
  context.font = `400 22px ${FONT_STACK}`;
  context.fillText(`거래 증빙 도우미 · ${tradeLabel()} · ${index}/${total}`, 70, PAGE_H - 60);
  return canvas;
}

