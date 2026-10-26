// CRC-32 (needed for ZIP entries) and SHA-256 "file fingerprints".

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32Update(crc, bytes) {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function crc32(bytes) {
  return crc32Update(0, bytes);
}

export async function sha256Hex(buffer) {
  if (!globalThis.crypto?.subtle) return "";
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

// Files up to this size are read whole once (SHA-256 + CRC + metadata). Bigger files
// (usually videos) are streamed for the CRC only, so a 2GB-RAM phone does not run out of memory.
export const HASH_LIMIT = 200 * 1024 * 1024;

export async function readFileFacts(file, { onBuffer } = {}) {
  if (file.size <= HASH_LIMIT) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const facts = { crc: crc32(bytes), sha256: await sha256Hex(buffer), hashed: true };
    if (onBuffer) onBuffer(buffer);
    return facts;
  }
  const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  if (onBuffer) onBuffer(head.buffer);
  return { crc: await streamCrc(file), sha256: "", hashed: false };
}

export async function streamCrc(blob) {
  let crc = 0;
  if (blob.stream) {
    const reader = blob.stream().getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      crc = crc32Update(crc, value);
    }
    return crc;
  }
  const chunk = 8 * 1024 * 1024;
  for (let at = 0; at < blob.size; at += chunk) {
    crc = crc32Update(crc, new Uint8Array(await blob.slice(at, at + chunk).arrayBuffer()));
  }
  return crc;
}
