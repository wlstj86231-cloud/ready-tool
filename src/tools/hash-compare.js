import { HASH_LIMIT, sha256Hex } from "../lib/checksum.js";
import { decodeText, parseDelimited } from "../lib/table.js";
import { $, escapeHtml, formatBytes, setStatus } from "../lib/util.js";

const listStatus = $("#listStatus");
let listEntries = [];
let listName = "";
const pair = { a: null, b: null };

$("#pickList").addEventListener("click", () => $("#listInput").click());
$("#pickFiles").addEventListener("click", () => $("#filesInput").click());
$("#pickA").addEventListener("click", () => $("#inputA").click());
$("#pickB").addEventListener("click", () => $("#inputB").click());

$("#listInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  listEntries = parseList(decodeText(await file.arrayBuffer()));
  listName = file.name;
  setStatus(
    listStatus,
    listEntries.length ? `${file.name}에서 파일 지문 ${listEntries.length}개를 읽었습니다. 이제 ② 확인할 파일을 넣으세요.` : `${file.name}에서 파일 지문(SHA-256)을 찾지 못했습니다. 거래 증빙 도우미에서 받은 증빙 목록 파일인지 확인하세요.`,
    listEntries.length ? "ok" : "warn"
  );
  $("#listResult").innerHTML = "";
});

$("#filesInput").addEventListener("change", async (event) => {
  const files = [...event.target.files];
  event.target.value = "";
  if (!files.length) return;
  if (!listEntries.length) {
    setStatus(listStatus, "먼저 ① 증빙 목록을 넣어 주세요.", "warn");
    return;
  }
  const rows = [];
  for (const [index, file] of files.entries()) {
    setStatus(listStatus, `파일 지문 계산 중 ${index + 1}/${files.length}: ${file.name}`, "busy");
    rows.push({ file, hash: await hashOf(file) });
  }
  renderListResult(rows);
});

for (const side of ["a", "b"]) {
  $(`#input${side.toUpperCase()}`).addEventListener("change", async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    $("#pairResult").innerHTML = `<p class="status" data-tone="busy">${escapeHtml(file.name)} 지문 계산 중…</p>`;
    pair[side] = { file, hash: await hashOf(file) };
    renderPair();
  });
}

async function hashOf(file) {
  if (file.size > HASH_LIMIT) return "";
  return sha256Hex(await file.arrayBuffer());
}

// Reads the evidence list made by the evidence-pack tool (CSV or TXT). Falls back to any 64-hex value.
function parseList(text) {
  const entries = [];
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  if (firstLine.includes("SHA-256") && firstLine.includes(",")) {
    const rows = parseDelimited(text, ",");
    const header = rows[0];
    const col = (name) => header.findIndex((cell) => cell.includes(name));
    const hashCol = col("SHA-256");
    const nameCol = col("새 파일 이름");
    const itemCol = col("항목");
    const originalCol = col("원래 파일 이름");
    rows.slice(1).forEach((row) => {
      const hash = (row[hashCol] || "").toLowerCase();
      if (/^[0-9a-f]{64}$/.test(hash)) entries.push({ hash, name: row[nameCol] || "", item: row[itemCol] || "", original: row[originalCol] || "" });
    });
    return entries;
  }
  let lastName = "";
  for (const line of text.split(/\r?\n/)) {
    const named = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (named) lastName = named[1].trim();
    const match = /\b([0-9a-fA-F]{64})\b/.exec(line);
    if (match) entries.push({ hash: match[1].toLowerCase(), name: lastName, item: "", original: "" });
  }
  return entries;
}

function renderListResult(rows) {
  const byHash = new Map();
  listEntries.forEach((entry) => byHash.set(entry.hash, [...(byHash.get(entry.hash) || []), entry]));
  const matchedHashes = new Set();
  const matched = rows.filter((row) => row.hash && byHash.has(row.hash));
  matched.forEach((row) => matchedHashes.add(row.hash));
  const notInList = rows.filter((row) => row.hash && !byHash.has(row.hash));
  const tooBig = rows.filter((row) => !row.hash);
  const missing = listEntries.filter((entry) => !matchedHashes.has(entry.hash));
  setStatus(listStatus, `파일 ${rows.length}개 중 ${matched.length}개가 목록(${listName})의 파일과 같습니다.`, notInList.length ? "warn" : "ok");
  $("#listResult").innerHTML = `
    ${matched.length ? `<h3>목록과 같은 파일 ${matched.length}개</h3><div class="table-scroll"><table><thead><tr><th scope="col">지금 넣은 파일</th><th scope="col">목록 속 파일</th></tr></thead><tbody>${matched
      .map((row) => {
        const entries = byHash.get(row.hash);
        return `<tr><td>${escapeHtml(row.file.name)}</td><td>${entries.map((entry) => `✓ ${escapeHtml(entry.name || entry.original || "(이름 없음)")}${entry.item ? ` <small class="muted">(${escapeHtml(entry.item)})</small>` : ""}`).join("<br>")}</td></tr>`;
      })
      .join("")}</tbody></table></div>` : ""}
    ${notInList.length ? `<div class="notice warn"><p><strong>목록에 없는 파일 ${notInList.length}개</strong> — 묶은 뒤 편집했거나, 메신저로 주고받으며 바뀌었거나, 다른 파일일 수 있습니다.</p><ul>${notInList.map((row) => `<li>${escapeHtml(row.file.name)}</li>`).join("")}</ul></div>` : ""}
    ${tooBig.length ? `<div class="notice"><p>용량이 커서(${formatBytes(HASH_LIMIT)} 초과) 지문을 계산하지 않은 파일: ${tooBig.map((row) => escapeHtml(row.file.name)).join(", ")}</p></div>` : ""}
    ${missing.length ? `<details class="faq"><summary>목록에는 있지만 이번에 넣지 않은 파일 ${missing.length}개</summary><ul>${missing.map((entry) => `<li>${escapeHtml(entry.name || entry.original || entry.hash.slice(0, 16))}</li>`).join("")}</ul></details>` : ""}`;
}

function renderPair() {
  const box = $("#pairResult");
  const describe = (entry) => (entry ? `${escapeHtml(entry.file.name)} (${formatBytes(entry.file.size)})<br><code>${entry.hash || "용량이 커서 계산하지 않음"}</code>` : "아직 고르지 않음");
  let verdict = "";
  if (pair.a && pair.b) {
    if (!pair.a.hash || !pair.b.hash) verdict = `<div class="notice"><p>용량이 너무 커서 비교하지 못했습니다.</p></div>`;
    else if (pair.a.hash === pair.b.hash) verdict = `<div class="notice ok"><p><strong>두 파일은 내용이 완전히 같습니다.</strong></p></div>`;
    else verdict = `<div class="notice bad"><p><strong>두 파일은 내용이 다릅니다.</strong> 크기를 줄였거나 편집했거나, 메신저를 거치며 다시 저장된 파일일 수 있습니다.</p></div>`;
  }
  box.innerHTML = `${verdict}<p><strong>첫 번째</strong><br>${describe(pair.a)}</p><p><strong>두 번째</strong><br>${describe(pair.b)}</p>`;
}
