// Reads tables from CSV/TSV text (UTF-8 or Korean Excel's CP949) and from the first
// sheet of an .xlsx file, using the browser's own deflate support instead of a big library.

export function decodeText(buffer) {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    try {
      return new TextDecoder("euc-kr").decode(bytes);
    } catch {
      return new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
    }
  }
}

export function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const counts = [",", "\t", ";"].map((delimiter) => [delimiter, firstLine.split(delimiter).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

export function parseDelimited(text, delimiter = detectDelimiter(text)) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((cells) => cells.map((value) => value.trim()));
}

/* ---------- xlsx ---------- */

export async function readXlsxFirstSheet(buffer) {
  if (typeof DecompressionStream !== "function") {
    throw new Error("이 브라우저는 엑셀 파일을 직접 읽지 못합니다. 엑셀에서 CSV로 저장해 넣어 주세요.");
  }
  const entries = listZipEntries(new Uint8Array(buffer));
  const read = async (path) => {
    const entry = entries.get(path);
    return entry ? new TextDecoder("utf-8").decode(await inflateEntry(new Uint8Array(buffer), entry)) : "";
  };
  const workbook = await read("xl/workbook.xml");
  const rels = await read("xl/_rels/workbook.xml.rels");
  if (!workbook) throw new Error("엑셀(.xlsx) 파일 구조를 읽지 못했습니다. CSV로 저장해 넣어 주세요.");
  const parser = new DOMParser();
  const wb = parser.parseFromString(workbook, "application/xml");
  const firstSheet = wb.getElementsByTagName("sheet")[0];
  const relId = firstSheet?.getAttribute("r:id") || firstSheet?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
  let target = "worksheets/sheet1.xml";
  if (relId && rels) {
    const relDoc = parser.parseFromString(rels, "application/xml");
    const rel = [...relDoc.getElementsByTagName("Relationship")].find((node) => node.getAttribute("Id") === relId);
    if (rel) target = rel.getAttribute("Target");
  }
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  const sheetXml = await read(sheetPath);
  if (!sheetXml) throw new Error("엑셀의 첫 번째 시트를 찾지 못했습니다.");
  const shared = parseSharedStrings(await read("xl/sharedStrings.xml"), parser);
  const dateStyles = parseDateStyles(await read("xl/styles.xml"), parser);
  const sheet = parser.parseFromString(sheetXml, "application/xml");
  const rows = [];
  for (const rowNode of sheet.getElementsByTagName("row")) {
    const rowIndex = Number(rowNode.getAttribute("r") || rows.length + 1) - 1;
    const cells = [];
    for (const cellNode of rowNode.getElementsByTagName("c")) {
      const ref = cellNode.getAttribute("r") || "";
      const col = ref ? columnIndex(ref) : cells.length;
      const type = cellNode.getAttribute("t");
      const valueNode = cellNode.getElementsByTagName("v")[0];
      let value = valueNode ? valueNode.textContent : "";
      if (type === "s") value = shared[Number(value)] ?? "";
      else if (type === "inlineStr") value = [...cellNode.getElementsByTagName("t")].map((node) => node.textContent).join("");
      else if (type === "b") value = value === "1" ? "TRUE" : "FALSE";
      else if ((!type || type === "n") && value !== "" && dateStyles.has(Number(cellNode.getAttribute("s") || 0))) value = serialToDate(Number(value)) || value;
      cells[col] = String(value ?? "").trim();
    }
    rows[rowIndex] = Array.from(cells, (value) => value ?? "");
  }
  return Array.from(rows, (row) => row ?? []);
}

function parseSharedStrings(xml, parser) {
  if (!xml) return [];
  const doc = parser.parseFromString(xml, "application/xml");
  return [...doc.getElementsByTagName("si")].map((si) => [...si.getElementsByTagName("t")].map((node) => node.textContent).join(""));
}

// Excel stores dates as day numbers; a cell is a date when its style uses a date format.
// Returns the set of cellXfs indexes that format dates.
function parseDateStyles(xml, parser) {
  const dates = new Set();
  if (!xml) return dates;
  const doc = parser.parseFromString(xml, "application/xml");
  const custom = new Map([...doc.getElementsByTagName("numFmt")].map((node) => [Number(node.getAttribute("numFmtId")), node.getAttribute("formatCode") || ""]));
  const builtinDate = (id) => (id >= 14 && id <= 22) || (id >= 27 && id <= 36) || (id >= 45 && id <= 47) || (id >= 50 && id <= 58);
  const customDate = (code) => /[yd]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, ""));
  const cellXfs = doc.getElementsByTagName("cellXfs")[0];
  if (!cellXfs) return dates;
  [...cellXfs.getElementsByTagName("xf")].forEach((xf, index) => {
    const id = Number(xf.getAttribute("numFmtId") || 0);
    if (builtinDate(id) || (custom.has(id) && customDate(custom.get(id)))) dates.add(index);
  });
  return dates;
}

function serialToDate(serial) {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2958465) return "";
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial * 86400) * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return minutes ? `${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}` : day;
}

function columnIndex(ref) {
  const letters = /^[A-Z]+/.exec(ref)?.[0] || "A";
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

function listZipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("엑셀(.xlsx) 파일이 아니거나 손상된 파일입니다.");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const entries = new Map();
  const decoder = new TextDecoder("utf-8");
  for (let i = 0; i < count && offset + 46 <= bytes.length; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.set(name, { method, compressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateEntry(bytes, entry) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = entry.localOffset;
  const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true);
  const data = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return data;
  if (entry.method !== 8) throw new Error("지원하지 않는 엑셀 압축 방식입니다. CSV로 저장해 넣어 주세요.");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
