// Image utilities for photo compression and handling
// Targets < 50kb WebP for optimal localStorage usage

const MAX_SIZE_BYTES = 50 * 1024; // 50kb target
const MAX_DIMENSION = 200; // Max width/height for avatar

/**
 * Compress and convert image to WebP Base64
 * Uses Offscreen Canvas for resizing
 */
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      let base64: string;
      let quality = 0.8;

      // Iteratively reduce quality until under target size
      do {
        base64 = canvas.toDataURL("image/webp", quality);

        // Check size (Base64 is ~1.37x the binary size)
        const sizeBytes = Math.ceil((base64.length - 22) * 0.75);

        if (sizeBytes <= MAX_SIZE_BYTES) {
          break;
        }

        quality -= 0.1;
      } while (quality > 0.1);

      // If still too large, try JPEG
      if (quality <= 0.1) {
        base64 = canvas.toDataURL("image/jpeg", 0.6);
      }

      resolve(base64);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Get approximate size of Base64 string in bytes
 */
export function getBase64Size(base64: string): number {
  if (!base64) return 0;
  // Remove data URL prefix if present
  const base64Data = base64.split(",")[1] || base64;
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 KB";
  return (bytes / 1024).toFixed(1) + " KB";
}

/**
 * Create circular avatar from image
 */
export async function createCircularAvatar(
  file: File,
  size: number = 100
): Promise<string> {
  const base64 = await compressImage(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image centered
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      resolve(canvas.toDataURL("image/webp", 0.85));
    };

    img.onerror = () => reject(new Error("Failed to process image"));
  });
}
