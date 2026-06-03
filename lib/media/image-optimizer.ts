import type { MediaPurpose } from "../types/tree";

export type ImageUploadPreset = {
  outputType: "image/webp";
  fallbackType: "image/jpeg";
  maxDimension: number;
  minDimension: number;
  targetBytes: number;
  maxBytes: number;
  initialQuality: number;
  minQuality: number;
};

export type PreparedMediaFile = {
  file: File;
  originalSizeBytes: number;
  optimized: boolean;
};

const SOURCE_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
const QUALITY_STEP = 0.06;
const DIMENSION_STEP = 0.82;
const SERVER_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

const PRESETS: Record<MediaPurpose, ImageUploadPreset> = {
  profile: {
    outputType: "image/webp",
    fallbackType: "image/jpeg",
    maxDimension: 640,
    minDimension: 320,
    targetBytes: 120 * 1024,
    maxBytes: SERVER_MEDIA_MAX_BYTES,
    initialQuality: 0.88,
    minQuality: 0.74,
  },
  gallery: {
    outputType: "image/webp",
    fallbackType: "image/jpeg",
    maxDimension: 1800,
    minDimension: 1100,
    targetBytes: 900 * 1024,
    maxBytes: SERVER_MEDIA_MAX_BYTES,
    initialQuality: 0.88,
    minQuality: 0.76,
  },
};

type LoadedImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

export function getImageUploadPreset(
  purpose: MediaPurpose
): ImageUploadPreset {
  return PRESETS[purpose];
}

export function shouldOptimizeImageType(contentType: string): boolean {
  const type = contentType.toLowerCase();
  return (
    type.startsWith("image/") &&
    type !== "image/gif" &&
    type !== "image/svg+xml"
  );
}

export function resolveImageContentType(
  fileName: string,
  declaredType: string
): string {
  const normalizedType = declaredType.trim().toLowerCase();
  if (normalizedType) return normalizedType;

  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "";
  }
}

export function getOptimizedImageFileName(
  fileName: string,
  contentType: "image/webp" | "image/jpeg" = "image/webp"
): string {
  const extension = contentType === "image/webp" ? "webp" : "jpg";
  const baseName = (fileName.trim() || "photo").replace(/\.[^/.]+$/, "");
  return `${baseName || "photo"}.${extension}`;
}

export async function prepareMediaFileForUpload(
  file: File,
  purpose: MediaPurpose
): Promise<PreparedMediaFile> {
  const contentType = resolveImageContentType(file.name, file.type);
  if (!contentType) {
    throw new Error("Format gambar tidak dikenali.");
  }

  const inputFile = ensureFileContentType(file, contentType);
  if (!shouldOptimizeImageType(contentType)) {
    return {
      file: inputFile,
      originalSizeBytes: file.size,
      optimized: false,
    };
  }

  if (file.size > SOURCE_IMAGE_MAX_BYTES) {
    throw new Error(
      "Foto terlalu besar untuk diproses di browser. Gunakan foto maksimal 25 MB."
    );
  }

  if (contentType === "image/webp") {
    const preset = getImageUploadPreset(purpose);
    if (file.size <= preset.targetBytes) {
      return {
        file: inputFile,
        originalSizeBytes: file.size,
        optimized: false,
      };
    }
  }

  const preset = getImageUploadPreset(purpose);
  const loaded = await loadImageSource(inputFile);

  try {
    const outputType = getSupportedOutputType(preset);
    const blob = await encodeOptimizedImage(loaded, preset, outputType);

    if (file.size <= preset.targetBytes && file.size <= blob.size) {
      return {
        file: inputFile,
        originalSizeBytes: file.size,
        optimized: false,
      };
    }

    if (blob.size > preset.maxBytes) {
      throw new Error(
        "Foto masih terlalu besar setelah optimasi. Coba gunakan foto dengan resolusi lebih kecil."
      );
    }

    const optimizedFile = new File(
      [blob],
      getOptimizedImageFileName(inputFile.name, outputType),
      {
        type: outputType,
        lastModified: Date.now(),
      }
    );

    return {
      file: optimizedFile,
      originalSizeBytes: file.size,
      optimized: true,
    };
  } finally {
    loaded.cleanup();
  }
}

function ensureFileContentType(file: File, contentType: string): File {
  if (file.type === contentType) return file;
  return new File([file], file.name, {
    type: contentType,
    lastModified: file.lastModified,
  });
}

async function loadImageSource(file: File): Promise<LoadedImageSource> {
  if (typeof document === "undefined") {
    throw new Error("Image optimization can only run in the browser.");
  }

  if ("createImageBitmap" in globalThis) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall back to HTMLImageElement below for browsers with partial support.
    }
  }

  return loadHtmlImage(file);
}

function loadHtmlImage(file: File): Promise<LoadedImageSource> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      resolve({
        source: image,
        width,
        height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Format gambar tidak bisa dibaca oleh browser ini."));
    };

    image.decoding = "async";
    image.src = objectUrl;
  });
}

function getSupportedOutputType(
  preset: ImageUploadPreset
): "image/webp" | "image/jpeg" {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const supportsWebp = canvas
    .toDataURL(preset.outputType, preset.initialQuality)
    .startsWith(`data:${preset.outputType}`);
  canvas.width = 0;
  canvas.height = 0;
  return supportsWebp ? preset.outputType : preset.fallbackType;
}

async function encodeOptimizedImage(
  loaded: LoadedImageSource,
  preset: ImageUploadPreset,
  outputType: "image/webp" | "image/jpeg"
): Promise<Blob> {
  validateImageDimensions(loaded);

  let bestBlob: Blob | null = null;
  let maxDimension = preset.maxDimension;

  while (maxDimension >= preset.minDimension) {
    let quality = preset.initialQuality;

    while (quality >= preset.minQuality) {
      const blob = await renderImageBlob(
        loaded,
        maxDimension,
        outputType,
        quality
      );

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (blob.size <= preset.targetBytes) {
        return blob;
      }

      quality -= QUALITY_STEP;
    }

    maxDimension = Math.floor(maxDimension * DIMENSION_STEP);
  }

  if (!bestBlob) {
    throw new Error("Gagal mengoptimalkan gambar.");
  }

  return bestBlob;
}

function validateImageDimensions(loaded: LoadedImageSource) {
  if (
    !Number.isFinite(loaded.width) ||
    !Number.isFinite(loaded.height) ||
    loaded.width <= 0 ||
    loaded.height <= 0
  ) {
    throw new Error("Ukuran gambar tidak valid.");
  }
}

function scaledDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function renderImageBlob(
  loaded: LoadedImageSource,
  maxDimension: number,
  outputType: "image/webp" | "image/jpeg",
  quality: number
): Promise<Blob> {
  const size = scaledDimensions(loaded.width, loaded.height, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas browser tidak tersedia untuk memproses gambar.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(loaded.source, 0, 0, size.width, size.height);

  const blob = await canvasToBlob(canvas, outputType, quality);
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputType: "image/webp" | "image/jpeg",
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Browser gagal membuat file gambar."));
          return;
        }
        resolve(blob);
      },
      outputType,
      quality
    );
  });
}
