import { readImageInfo } from "../lib/exif.js";
import { toJpeg } from "../lib/image.js";
import { $, cleanNamePart, downloadBlob, escapeHtml, extensionOf, formatBytes, loadPdfLib, setStatus, ymd } from "../lib/util.js";

const MAX_ITEMS = 60;
const A4 = [595.28, 841.89];
const MARGIN = 28;
const items = [];
let busy = false;
let counter = 0;

const input = $("#fileInput");
const statusLine = $("#status");
const resultLine = $("#result");
$("#outName").value = `${ymd(new Date())}_거래서류`;

$("#pick").addEventListener("click", () => input.click());
input.addEventListener("change", async () => {
  const files = [...input.files];
  input.value = "";
  if (files.length) await addFiles(files);
});
$("#list").addEventListener("click", onListClick);
$("#list").addEventListener("change", (event) => {
  const field = event.target.closest("[data-range]");
  if (!field) return;
  const item = items.find((entry) => entry.id === field.dataset.range);
  if (item) item.range = field.value.trim();
});
$("#make").addEventListener("click", makePdf);
$("#reset").addEventListener("click", () => {
  items.splice(0);
  setStatus(resultLine, "");
  setStatus(statusLine, "목록을 비웠습니다.", "ok");
  render();
});

function kindOf(file) {
  const ext = extensionOf(file.name);
  if (file.type === "application/pdf" || ext === "pdf") return "pdf";
  if (/^image\/(jpeg|png)$/.test(file.type) || ["jpg", "jpeg", "png"].includes(ext)) return "image";
  return "";
}

async function addFiles(files) {
  if (busy) return;
  busy = true;
  const notes = [];
  let added = 0;
  for (const file of files) {
    if (items.length >= MAX_ITEMS) {
      notes.push(`한 번에 ${MAX_ITEMS}개까지 묶을 수 있어 나머지는 넣지 않았습니다.`);
      break;
    }
    const kind = kindOf(file);
    if (!kind) {
      notes.push(`${file.name}: PDF·JPG·PNG만 넣을 수 있습니다. (아이폰 HEIC 사진은 JPG로 바꿔 넣어 주세요)`);
      continue;
    }
    setStatus(statusLine, `${file.name} 확인 중…`, "busy");
    const item = { id: `f${(counter += 1)}`, file, kind, pages: 0, range: "", error: "" };
    if (kind === "pdf") {
      try {
        const { PDFDocument } = await loadPdfLib();
        const doc = await PDFDocument.load(await file.arrayBuffer());
        item.pages = doc.getPageCount();
      } catch (error) {
        item.error = /encrypt/i.test(String(error?.message)) ? "암호가 걸린 PDF라 합칠 수 없습니다. 암호 없는 사본으로 다시 넣어 주세요." : "PDF를 읽지 못했습니다. 손상되었거나 PDF가 아닌 파일일 수 있습니다.";
      }
    } else {
      const head = readImageInfo(await file.slice(0, 512 * 1024).arrayBuffer());
      item.info = { width: head.width, height: head.height, orientation: head.exif?.orientation || 1 };
    }
    items.push(item);
    added += 1;
  }
  busy = false;
  setStatus(statusLine, [`${added}개를 목록에 넣었습니다.`, ...notes].join(" "), notes.length ? "warn" : "ok");
  render();
}

function onListClick(event) {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  const index = items.findIndex((item) => item.id === button.dataset.id);
  if (index < 0) return;
  const act = button.dataset.act;
  if (act === "up" && index > 0) [items[index - 1], items[index]] = [items[index], items[index - 1]];
  if (act === "down" && index < items.length - 1) [items[index + 1], items[index]] = [items[index], items[index + 1]];
  if (act === "remove") items.splice(index, 1);
  render();
  const again = document.querySelector(`button[data-act="${act}"][data-id="${button.dataset.id}"]`);
  if (again) again.focus();
}

function render() {
  const usable = items.filter((item) => !item.error);
  $("#make").disabled = busy || !usable.length;
  $("#reset").disabled = busy || !items.length;
  $("#list").innerHTML = items.length
    ? items
        .map(
          (item, index) => `<li class="order-item">
        <div><strong>${index + 1}. ${escapeHtml(item.file.name)}</strong><br><small class="muted">${item.kind === "pdf" ? `PDF${item.pages ? ` · ${item.pages}쪽` : ""}` : "사진"} · ${formatBytes(item.file.size)}</small></div>
        ${item.error ? `<p class="notice bad">${escapeHtml(item.error)}</p>` : ""}
        ${item.kind === "pdf" && !item.error ? `<label class="field" style="margin:0"><span>넣을 쪽 <small>(비우면 전부)</small></span><input type="text" inputmode="numeric" data-range="${item.id}" value="${escapeHtml(item.range)}" placeholder="예: 1-3, 5" /></label>` : ""}
        <div class="btn-row">
          <button type="button" class="btn ghost" data-act="up" data-id="${item.id}" ${index === 0 ? "disabled" : ""} aria-label="${escapeHtml(item.file.name)} 위로">▲ 위로</button>
          <button type="button" class="btn ghost" data-act="down" data-id="${item.id}" ${index === items.length - 1 ? "disabled" : ""} aria-label="${escapeHtml(item.file.name)} 아래로">▼ 아래로</button>
          <button type="button" class="btn ghost danger" data-act="remove" data-id="${item.id}" aria-label="${escapeHtml(item.file.name)} 빼기">빼기</button>
        </div>
      </li>`
        )
        .join("")
    : `<li class="muted">아직 넣은 파일이 없습니다.</li>`;
}

function parsePageRanges(value, maxPage) {
  const text = String(value || "").replace(/\s+/g, "").replace(/[~–]/g, "-");
  if (!text) return [...Array(maxPage).keys()];
  const pages = [];
  for (const part of text.split(",").filter(Boolean)) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) throw new Error(`쪽 번호를 이해하지 못했습니다: "${part}". 예: 1-3, 5`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > maxPage) throw new Error(`"${part}"는 이 PDF의 쪽 범위(1~${maxPage})를 벗어납니다.`);
    for (let page = start; page <= end; page += 1) pages.push(page - 1);
  }
  return [...new Set(pages)];
}

async function makePdf() {
  if (busy) return;
  busy = true;
  render();
  try {
    const { PDFDocument } = await loadPdfLib();
    const output = await PDFDocument.create();
    output.setProducer("거래 증빙 도우미 (goatool.com)");
    const fit = $("#imageFit").value;
    const usable = items.filter((item) => !item.error);
    for (const [index, item] of usable.entries()) {
      setStatus(resultLine, `합치는 중 ${index + 1}/${usable.length}: ${item.file.name}`, "busy");
      if (item.kind === "pdf") {
        const source = await PDFDocument.load(await item.file.arrayBuffer());
        let indices;
        try {
          indices = parsePageRanges(item.range, source.getPageCount());
        } catch (error) {
          throw Object.assign(new Error(`${item.file.name}: ${error.message}`), { userInput: true });
        }
        const copied = await output.copyPages(source, indices);
        copied.forEach((page) => output.addPage(page));
      } else {
        const jpeg = await toJpeg(item.file, 2000, 0.85, item.info);
        const image = await output.embedJpg(new Uint8Array(await jpeg.blob.arrayBuffer()));
        if (fit === "a4") {
          const landscape = image.width > image.height;
          const [pw, ph] = landscape ? [A4[1], A4[0]] : A4;
          const scale = Math.min((pw - MARGIN * 2) / image.width, (ph - MARGIN * 2) / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          output.addPage([pw, ph]).drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        } else {
          const scale = A4[1] / Math.max(image.width, image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          output.addPage([w, h]).drawImage(image, { x: 0, y: 0, width: w, height: h });
        }
      }
    }
    const bytes = await output.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const name = `${cleanNamePart($("#outName").value, `${ymd(new Date())}_거래서류`)}.pdf`;
    downloadBlob(blob, name);
    setStatus(resultLine, `${name} 파일을 만들었습니다 (${output.getPageCount()}쪽, ${formatBytes(blob.size)}). 열어서 쪽 순서와 방향을 확인하세요.`, "ok");
  } catch (error) {
    if (!error.userInput) console.error(error);
    setStatus(resultLine, error.message || "PDF를 만들지 못했습니다.", "bad");
  } finally {
    busy = false;
    render();
  }
}

render();
