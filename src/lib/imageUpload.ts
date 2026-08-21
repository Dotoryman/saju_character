export type AdminImageKind = "character" | "animal";

export const ADMIN_IMAGE_SPECS = {
  character: { width: 1200, height: 1800 },
  animal: { width: 1600, height: 1200 },
} as const;

const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_BYTES = 30_000_000;
const MAX_UPLOAD_BYTES = 5_000_000;

export interface CoverCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function calculateCoverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): CoverCrop {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const sw = sourceHeight * targetRatio;
    return { sx: (sourceWidth - sw) / 2, sy: 0, sw, sh: sourceHeight };
  }

  const sh = sourceWidth / targetRatio;
  return { sx: 0, sy: (sourceHeight - sh) / 2, sw: sourceWidth, sh };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지를 최적화하지 못했습니다."));
    }, "image/webp", quality);
  });
}

async function loadLocalImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } catch {
    throw new Error("이미지 파일을 읽을 수 없습니다.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function optimizeAdminImage(file: File, kind: AdminImageKind): Promise<File> {
  if (!SUPPORTED_TYPES.has(file.type)) throw new Error("JPG, PNG 또는 WebP 이미지를 선택해 주세요.");
  if (file.size < 1 || file.size > MAX_SOURCE_BYTES) throw new Error("원본 이미지는 30MB 이하여야 합니다.");

  const image = await loadLocalImage(file);
  const { width, height } = ADMIN_IMAGE_SPECS[kind];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이 브라우저에서는 이미지 최적화를 사용할 수 없습니다.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const crop = calculateCoverCrop(image.naturalWidth, image.naturalHeight, width, height);
  context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

  let blob = await canvasToBlob(canvas, 0.84);
  if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToBlob(canvas, 0.7);
  if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToBlob(canvas, 0.56);
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("이미지 용량을 5MB 이하로 줄이지 못했습니다. 다른 이미지를 선택해 주세요.");

  const baseName = file.name.replace(/\.[^.]+$/, "") || kind;
  return new File([blob], `${baseName}.webp`, { type: blob.type || "image/webp", lastModified: Date.now() });
}
