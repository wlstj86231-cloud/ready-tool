// Reads what the evidence tools need from image bytes, without decoding pixels:
// EXIF shot date, whether GPS coordinates are present, camera make/model, orientation,
// and pixel size (JPEG SOF or PNG IHDR).

export function readImageInfo(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return readJpeg(bytes);
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { format: "png", width: view.getUint32(16), height: view.getUint32(20), exif: null };
  }
  return { format: "", width: 0, height: 0, exif: null };
}

function readJpeg(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const info = { format: "jpeg", width: 0, height: 0, exif: null };
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2;
      continue;
    }
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) break;
    const start = offset + 4;
    if (marker === 0xe1 && !info.exif && isExifHeader(bytes, start)) {
      info.exif = parseTiff(view, start + 6, length - 8);
    } else if (isSofMarker(marker) && !info.width) {
      info.height = view.getUint16(start + 1);
      info.width = view.getUint16(start + 3);
    }
    offset += 2 + length;
  }
  if (info.exif && info.exif.orientation >= 5 && info.exif.orientation <= 8) {
    [info.width, info.height] = [info.height, info.width];
  }
  return info;
}

function isSofMarker(marker) {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function isExifHeader(bytes, start) {
  return bytes[start] === 0x45 && bytes[start + 1] === 0x78 && bytes[start + 2] === 0x69 && bytes[start + 3] === 0x66 && bytes[start + 4] === 0 && bytes[start + 5] === 0;
}

function parseTiff(view, tiff, length) {
  const end = Math.min(view.byteLength, tiff + length);
  if (tiff + 8 > end) return null;
  const order = view.getUint16(tiff);
  const little = order === 0x4949;
  if (!little && order !== 0x4d4d) return null;
  const u16 = (at) => (at + 2 <= end ? view.getUint16(at, little) : 0);
  const u32 = (at) => (at + 4 <= end ? view.getUint32(at, little) : 0);
  if (u16(tiff + 2) !== 42) return null;

  const readIfd = (ifdOffset) => {
    const entries = new Map();
    const at = tiff + ifdOffset;
    if (!ifdOffset || at + 2 > end) return entries;
    const count = Math.min(u16(at), 400);
    for (let i = 0; i < count; i += 1) {
      const entry = at + 2 + i * 12;
      if (entry + 12 > end) break;
      entries.set(u16(entry), { type: u16(entry + 2), count: u32(entry + 4), valueAt: entry + 8 });
    }
    return entries;
  };
  const ascii = (entry) => {
    if (!entry || entry.type !== 2 || !entry.count) return "";
    const at = entry.count <= 4 ? entry.valueAt : tiff + u32(entry.valueAt);
    let text = "";
    for (let i = 0; i < entry.count && at + i < end; i += 1) {
      const code = view.getUint8(at + i);
      if (code === 0) break;
      text += String.fromCharCode(code);
    }
    return text.trim();
  };
  const short = (entry) => (entry && entry.type === 3 ? u16(entry.valueAt) : 0);
  const long = (entry) => (entry && (entry.type === 4 || entry.type === 13) ? u32(entry.valueAt) : 0);

  const ifd0 = readIfd(u32(tiff + 4));
  const exifIfd = readIfd(long(ifd0.get(0x8769)));
  const gpsIfd = readIfd(long(ifd0.get(0x8825)));

  const candidates = [
    ["DateTimeOriginal", ascii(exifIfd.get(0x9003))],
    ["DateTimeDigitized", ascii(exifIfd.get(0x9004))],
    ["DateTime", ascii(ifd0.get(0x0132))],
  ];
  let date = null;
  let dateText = "";
  let dateSource = "";
  for (const [source, text] of candidates) {
    const parsed = parseExifDate(text);
    if (parsed) {
      date = parsed;
      dateText = text;
      dateSource = source;
      break;
    }
  }
  return {
    date,
    dateText,
    dateSource,
    hasGps: gpsIfd.has(0x0002) && gpsIfd.has(0x0004),
    make: ascii(ifd0.get(0x010f)),
    model: ascii(ifd0.get(0x0110)),
    orientation: short(ifd0.get(0x0112)) || 1,
  };
}

// "2026:10:20 14:32:10" -> local Date. Rejects empty or impossible values.
export function parseExifDate(text) {
  const match = /^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(text || "");
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part || 0));
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date;
}
