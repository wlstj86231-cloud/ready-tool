// Image helpers that keep memory low on small phones: decode one image at a time,
// ask the browser to decode at the target size when it can, and release bitmaps right away.

export const FONT_STACK = '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

export function isImageFile(file) {
  return /^image\//.test(file.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

// Returns a canvas no larger than maxSide (keeps aspect). Applies EXIF orientation.
export async function decodeToCanvas(file, maxSide, knownSize = null) {
  let source = null;
  let width = 0;
  let height = 0;
  // Decode-time resizing is only used for upright photos; rotated ones are scaled on the canvas.
  const upright = !knownSize?.orientation || knownSize.orientation === 1;
  const target = upright && knownSize?.width && knownSize?.height ? fitSize(knownSize.width, knownSize.height, maxSide) : null;
  if (typeof createImageBitmap === "function") {
    try {
      source = target
        ? await createImageBitmap(file, { imageOrientation: "from-image", resizeWidth: target.width, resizeHeight: target.height, resizeQuality: "high" })
        : await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        source = await createImageBitmap(file);
      } catch {
        source = null;
      }
    }
  }
  if (source) {
    width = source.width;
    height = source.height;
  } else {
    source = await loadImageElement(file);
    width = source.naturalWidth;
    height = source.naturalHeight;
  }
  if (!width || !height) throw new Error("이미지를 읽지 못했습니다.");
  const size = fitSize(width, height, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, size.width, size.height);
  if (source.close) source.close();
  if (source.dataset?.objectUrl) URL.revokeObjectURL(source.dataset.objectUrl);
  return canvas;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.dataset.objectUrl = url;
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이 브라우저에서 열 수 없는 이미지 형식입니다."));
    };
    image.src = url;
  });
}

export function fitSize(width, height, maxSide) {
  if (!maxSide || Math.max(width, height) <= maxSide) return { width, height };
  const scale = maxSide / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function canvasToBlob(canvas, type = "image/jpeg", quality = 0.86) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("이미지를 저장하지 못했습니다."))), type, quality);
  });
}

export function releaseCanvas(canvas) {
  canvas.width = 1;
  canvas.height = 1;
}

// Re-encodes an image as JPEG (drops EXIF, including GPS) at most maxSide pixels.
export async function toJpeg(file, maxSide, quality, knownSize) {
  const canvas = await decodeToCanvas(file, maxSide, knownSize);
  const blob = await canvasToBlob(canvas, "image/jpeg", quality);
  const result = { blob, width: canvas.width, height: canvas.height };
  releaseCanvas(canvas);
  return result;
}

export async function thumbnailUrl(file, knownSize) {
  const { blob } = await toJpeg(file, 240, 0.72, knownSize);
  return URL.createObjectURL(blob);
}

// Wraps Korean text by characters so long file names and notes fit the canvas width.
export function wrapText(context, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    let line = "";
    for (const char of paragraph) {
      if (context.measureText(line + char).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}
