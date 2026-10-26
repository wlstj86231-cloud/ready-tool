import { readImageInfo } from "../lib/exif.js";
import { canvasToBlob, decodeToCanvas, releaseCanvas } from "../lib/image.js";
import { $, baseNameOf, cleanNamePart, downloadBlob, formatBytes, setStatus } from "../lib/util.js";

const MAX_SIDE = 3000;
const canvas = $("#canvas");
const context = canvas.getContext("2d");
const input = $("#fileInput");
const statusLine = $("#status");
const resultLine = $("#result");

let base = null; // decoded photo
let fileName = "";
let boxes = [];
let drag = null;

$("#pick").addEventListener("click", () => input.click());
input.addEventListener("change", async () => {
  const file = input.files[0];
  input.value = "";
  if (file) await loadPhoto(file);
});
$("#undo").addEventListener("click", () => {
  boxes.pop();
  draw();
});
$("#clearBoxes").addEventListener("click", () => {
  boxes = [];
  draw();
});
$("#save").addEventListener("click", save);

canvas.addEventListener("pointerdown", (event) => {
  if (!base) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  const point = toCanvas(event);
  drag = { x0: point.x, y0: point.y, x1: point.x, y1: point.y, id: event.pointerId };
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const point = toCanvas(event);
  drag.x1 = point.x;
  drag.y1 = point.y;
  draw();
});
const finish = (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const box = normalise(drag);
  drag = null;
  const minimum = Math.max(6, Math.round(Math.max(canvas.width, canvas.height) / 150));
  if (box.w >= minimum && box.h >= minimum) boxes.push(box);
  draw();
};
canvas.addEventListener("pointerup", finish);
canvas.addEventListener("pointercancel", finish);

async function loadPhoto(file) {
  setStatus(statusLine, "사진을 여는 중입니다…", "busy");
  setStatus(resultLine, "");
  try {
    const head = readImageInfo(await file.slice(0, 512 * 1024).arrayBuffer());
    const decoded = await decodeToCanvas(file, MAX_SIDE, { width: head.width, height: head.height, orientation: head.exif?.orientation || 1 });
    if (base) releaseCanvas(base);
    base = decoded;
    fileName = file.name;
    boxes = [];
    canvas.width = base.width;
    canvas.height = base.height;
    $("#canvasWrap").hidden = false;
    draw();
    setStatus(statusLine, `${file.name} (${formatBytes(file.size)})를 열었습니다. 가릴 곳을 끌어서 칠하세요.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus(statusLine, "이 사진을 열지 못했습니다. JPG나 PNG 사진으로 다시 시도해 주세요. (아이폰 HEIC 사진은 컴퓨터 브라우저에서 열리지 않을 수 있습니다)", "bad");
  }
}

function toCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x: Math.max(0, Math.min(canvas.width, x)), y: Math.max(0, Math.min(canvas.height, y)) };
}

function normalise(d) {
  return { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
}

function draw() {
  if (!base) return;
  context.drawImage(base, 0, 0);
  context.fillStyle = "#000";
  boxes.forEach((box) => context.fillRect(box.x, box.y, box.w, box.h));
  if (drag) {
    const box = normalise(drag);
    context.fillStyle = "rgba(0,0,0,0.6)";
    context.fillRect(box.x, box.y, box.w, box.h);
    context.strokeStyle = "#ffd34d";
    context.lineWidth = Math.max(3, canvas.width / 400);
    context.strokeRect(box.x, box.y, box.w, box.h);
  }
  $("#undo").disabled = !boxes.length;
  $("#clearBoxes").disabled = !boxes.length;
  $("#save").disabled = !boxes.length;
}

async function save() {
  if (!base || !boxes.length) return;
  drag = null;
  draw();
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  const name = `${cleanNamePart(baseNameOf(fileName), "사진")}_가림.jpg`;
  downloadBlob(blob, name);
  setStatus(resultLine, `${name} (${formatBytes(blob.size)})로 저장했습니다. 상자 ${boxes.length}개를 칠했습니다. 크게 열어 가린 글자가 보이지 않는지 확인하세요.`, "ok");
}
