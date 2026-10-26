import { crc32 } from "../lib/checksum.js";
import { readImageInfo } from "../lib/exif.js";
import { thumbnailUrl, toJpeg } from "../lib/image.js";
import { $, cleanNamePart, dateTimeLabel, downloadBlob, escapeHtml, extensionOf, formatBytes, hm, setStatus, toCsv, ymd } from "../lib/util.js";
import { buildZip, textEntry } from "../lib/zip.js";

const MAX_PHOTOS = 200;
const THUMB_LIMIT = 40;
const photos = [];
let busy = false;
let counter = 0;

const input = $("#photoInput");
const statusLine = $("#status");
const resultLine = $("#result");

$("#pick").addEventListener("click", () => input.click());
input.addEventListener("change", async () => {
  const files = [...input.files];
  input.value = "";
  if (files.length) await addPhotos(files);
});
["#label", "#dateStyle", "#order", "#size"].forEach((id) => $(id).addEventListener("input", renderPreview));
$("#download").addEventListener("click", downloadZip);
$("#mapCsv").addEventListener("click", () => downloadBlob(new Blob([mapCsv(plan())], { type: "text/csv;charset=utf-8" }), `${ymd(new Date())}_사진이름_변경표.csv`));
$("#reset").addEventListener("click", () => {
  photos.splice(0).forEach((photo) => photo.thumb && URL.revokeObjectURL(photo.thumb));
  setStatus(resultLine, "");
  setStatus(statusLine, "목록을 비웠습니다.", "ok");
  renderPreview();
});

async function addPhotos(files) {
  if (busy) return;
  busy = true;
  const room = MAX_PHOTOS - photos.length;
  const accepted = files.slice(0, Math.max(0, room));
  let failed = 0;
  for (const [index, file] of accepted.entries()) {
    setStatus(statusLine, `사진 확인 중 ${index + 1}/${accepted.length}`, "busy");
    try {
      const head = await file.slice(0, 512 * 1024).arrayBuffer();
      const info = readImageInfo(head);
      const photo = {
        file,
        order: (counter += 1),
        date: info.exif?.date || null,
        fallbackDate: new Date(file.lastModified || Date.now()),
        hasGps: Boolean(info.exif?.hasGps),
        info: { width: info.width, height: info.height, orientation: info.exif?.orientation || 1 },
        thumb: "",
      };
      if (photos.length < THUMB_LIMIT) {
        try {
          photo.thumb = await thumbnailUrl(file, photo.info);
        } catch {
          photo.thumb = "";
        }
      }
      photos.push(photo);
    } catch {
      failed += 1;
    }
  }
  busy = false;
  const notes = [`사진 ${accepted.length - failed}장을 넣었습니다.`];
  if (failed) notes.push(`${failed}장은 읽지 못했습니다.`);
  if (files.length > accepted.length) notes.push(`한 번에 ${MAX_PHOTOS}장까지라 ${files.length - accepted.length}장은 넣지 않았습니다.`);
  setStatus(statusLine, notes.join(" "), failed || files.length > accepted.length ? "warn" : "ok");
  renderPreview();
}

function shotDate(photo) {
  return photo.date || photo.fallbackDate;
}

function plan() {
  const label = cleanNamePart($("#label").value, "");
  const style = $("#dateStyle").value;
  const order = $("#order").value;
  const resize = Number($("#size").value);
  const sorted = [...photos].sort((a, b) => {
    if (order === "name") return a.file.name.localeCompare(b.file.name, "ko", { numeric: true });
    if (order === "picked") return a.order - b.order;
    return shotDate(a) - shotDate(b) || a.order - b.order;
  });
  const width = sorted.length >= 100 ? 3 : 2;
  return sorted.map((photo, index) => {
    const date = shotDate(photo);
    const datePart = style === "none" ? "" : style === "compact" ? ymd(date, "") : style === "time" ? `${ymd(date)}_${hm(date, "")}` : ymd(date);
    const ext = resize ? "jpg" : extensionOf(photo.file.name) || "jpg";
    const name = `${[datePart, label, String(index + 1).padStart(width, "0")].filter(Boolean).join("_")}.${ext}`;
    return { photo, name, date, resize };
  });
}

function renderPreview() {
  const hasPhotos = photos.length > 0;
  ["#download", "#mapCsv", "#reset"].forEach((id) => {
    $(id).disabled = !hasPhotos || busy;
  });
  const box = $("#preview");
  if (!hasPhotos) {
    box.innerHTML = `<p class="muted">사진을 고르면 바뀔 이름을 여기서 미리 보여 드립니다.</p>`;
    return;
  }
  const rows = plan();
  const noDate = photos.filter((photo) => !photo.date).length;
  const gps = photos.filter((photo) => photo.hasGps).length;
  const resize = Number($("#size").value);
  box.innerHTML = `
    ${noDate ? `<div class="notice warn"><p>촬영 정보가 없는 사진 ${noDate}장은 <strong>파일 저장 날짜</strong>로 정렬하고 이름을 붙였습니다. 메신저로 받았거나 캡처한 사진일 수 있으니 순서가 맞는지 확인하세요.</p></div>` : ""}
    ${gps ? `<div class="notice"><p>위치정보가 들어 있는 사진 ${gps}장이 있습니다. ${resize ? "크기를 줄이면 위치정보가 지워집니다." : "원래 크기 그대로 받으면 위치정보도 그대로 남습니다. 남에게 보낼 사진이라면 크기 줄이기를 고르세요."}</p></div>` : ""}
    <div class="table-scroll"><table>
      <thead><tr><th scope="col">새 이름</th><th scope="col">원래 이름</th><th scope="col">찍은 날짜</th></tr></thead>
      <tbody>${rows
        .slice(0, 300)
        .map(
          (row) => `<tr><td>${row.photo.thumb ? `<img src="${row.photo.thumb}" alt="" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px" loading="lazy" />` : ""}<code>${escapeHtml(row.name)}</code></td><td>${escapeHtml(row.photo.file.name)}<br><small class="muted">${formatBytes(row.photo.file.size)}</small></td><td>${escapeHtml(dateTimeLabel(row.date))}${row.photo.date ? "" : `<br><small class="muted">파일 날짜</small>`}</td></tr>`
        )
        .join("")}</tbody>
    </table></div>`;
}

async function downloadZip() {
  if (busy || !photos.length) return;
  busy = true;
  renderPreview();
  try {
    const rows = plan();
    const entries = [];
    for (const [index, row] of rows.entries()) {
      setStatus(resultLine, `${row.resize ? "사진 줄이는 중" : "사진 묶는 중"} ${index + 1}/${rows.length}`, "busy");
      let blob = row.photo.file;
      if (row.resize) {
        try {
          blob = (await toJpeg(row.photo.file, row.resize, 0.86, row.photo.info)).blob;
        } catch {
          // Formats the browser cannot decode (e.g. HEIC on a PC) are kept as they are.
          blob = row.photo.file;
          row.name = row.name.replace(/\.jpg$/, `.${extensionOf(row.photo.file.name) || "jpg"}`);
          row.kept = true;
        }
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      row.newSize = bytes.length;
      entries.push({ name: row.name, data: blob, size: bytes.length, crc: crc32(bytes), date: row.date });
    }
    entries.push(textEntry("00_이름_변경표.csv", mapCsv(rows)));
    const zip = buildZip(entries);
    downloadBlob(zip, `${ymd(new Date())}_사진_${rows.length}장.zip`);
    const kept = rows.filter((row) => row.kept).length;
    setStatus(resultLine, `사진 ${rows.length}장을 묶었습니다 (${formatBytes(zip.size)}).${kept ? ` ${kept}장은 이 브라우저에서 열 수 없는 형식이라 줄이지 않고 그대로 넣었습니다.` : ""} 변경표(00_이름_변경표.csv)가 함께 들어 있습니다.`, kept ? "warn" : "ok");
  } catch (error) {
    console.error(error);
    setStatus(resultLine, error.message || "묶음을 만들지 못했습니다. 사진 수를 줄여 다시 시도해 주세요.", "bad");
  } finally {
    busy = false;
    renderPreview();
  }
}

function mapCsv(rows) {
  return toCsv([
    ["번호", "새 이름", "원래 이름", "찍은 날짜", "날짜 출처", "원래 크기(바이트)", "새 크기(바이트)"],
    ...rows.map((row, index) => [index + 1, row.name, row.photo.file.name, dateTimeLabel(row.date), row.photo.date ? "사진 촬영 정보" : "파일 저장 날짜", row.photo.file.size, row.newSize ?? ""]),
  ]);
}
