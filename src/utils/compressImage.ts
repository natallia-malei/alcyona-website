const MAX_SIDE = 1600;
const QUALITY = 0.85;

// Анимированные GIF и векторные SVG через canvas испортятся — грузим как есть
const PASSTHROUGH_TYPES = ["image/gif", "image/svg+xml"];

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Уменьшает картинку до MAX_SIDE по длинной стороне и пережимает в WebP
 * (или JPEG, если браузер не умеет кодировать WebP, как Safari).
 * Если результат не меньше исходника — возвращает исходный файл.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (PASSTHROUGH_TYPES.includes(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Браузер не умеет декодировать формат (например, HEIC в Chrome) — грузим как есть
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") {
    // JPEG не поддерживает прозрачность — подкладываем тёмный фон под цвет сайта
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    blob = await canvasToBlob(canvas, "image/jpeg");
  }

  return blob && blob.size < file.size ? blob : file;
}
