// Minimal "stored" (uncompressed) ZIP writer. Photos and PDFs are already compressed, so
// storing them costs little space, and the result is a Blob built from references to the
// original files: the browser never has to hold every photo in memory at once.

import { crc32 } from "./checksum.js";

const encoder = new TextEncoder();

export function textEntry(name, text, date = new Date()) {
  const bytes = encoder.encode(text);
  return { name, data: new Blob([bytes]), size: bytes.length, crc: crc32(bytes), date };
}

export function buildZip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  const used = new Set();
  for (const entry of entries) {
    const name = uniqueName(entry.name, used);
    const nameBytes = encoder.encode(name);
    const { time, day } = dosDateTime(entry.date || new Date());
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, entry.crc >>> 0, true);
    local.setUint32(18, entry.size, true);
    local.setUint32(22, entry.size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    parts.push(local.buffer, nameBytes, entry.data);

    const record = new DataView(new ArrayBuffer(46));
    record.setUint32(0, 0x02014b50, true);
    record.setUint16(4, 20, true);
    record.setUint16(6, 20, true);
    record.setUint16(8, 0x0800, true);
    record.setUint16(10, 0, true);
    record.setUint16(12, time, true);
    record.setUint16(14, day, true);
    record.setUint32(16, entry.crc >>> 0, true);
    record.setUint32(20, entry.size, true);
    record.setUint32(24, entry.size, true);
    record.setUint16(28, nameBytes.length, true);
    record.setUint32(42, offset, true);
    central.push(record.buffer, nameBytes);

    offset += 30 + nameBytes.length + entry.size;
    if (offset > 0xffffffff - 1024) throw new Error("묶음 전체가 4GB를 넘어 ZIP으로 만들 수 없습니다. 파일을 나눠서 묶어 주세요.");
  }
  const centralSize = central.reduce((sum, part) => sum + part.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

function uniqueName(name, used) {
  let candidate = name;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    const dot = name.lastIndexOf(".");
    const slash = name.lastIndexOf("/");
    candidate = dot > slash ? `${name.slice(0, dot)}_${counter}${name.slice(dot)}` : `${name}_${counter}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function dosDateTime(date) {
  const year = Math.max(1980, Math.min(2107, date.getFullYear()));
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}
