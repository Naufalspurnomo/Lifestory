import { describe, expect, it } from "vitest";
import {
  getImageUploadPreset,
  getOptimizedImageFileName,
  resolveImageContentType,
  shouldOptimizeImageType,
} from "../lib/media/image-optimizer";

describe("media image optimizer configuration", () => {
  it("uses a smaller profile preset and a sharper gallery preset", () => {
    const profile = getImageUploadPreset("profile");
    const gallery = getImageUploadPreset("gallery");

    expect(profile.outputType).toBe("image/webp");
    expect(gallery.outputType).toBe("image/webp");
    expect(profile.maxDimension).toBeLessThan(gallery.maxDimension);
    expect(profile.targetBytes).toBeLessThan(gallery.targetBytes);
    expect(profile.minQuality).toBeGreaterThanOrEqual(0.7);
    expect(gallery.minQuality).toBeGreaterThanOrEqual(0.75);
  });

  it("converts uploaded file names to the encoded image type", () => {
    expect(getOptimizedImageFileName("Ayah ku.JPG", "image/webp")).toBe(
      "Ayah ku.webp"
    );
    expect(getOptimizedImageFileName("archive.photo.png", "image/jpeg")).toBe(
      "archive.photo.jpg"
    );
    expect(getOptimizedImageFileName("", "image/webp")).toBe("photo.webp");
  });

  it("optimizes raster photos while preserving animated or unsafe formats", () => {
    expect(shouldOptimizeImageType("image/jpeg")).toBe(true);
    expect(shouldOptimizeImageType("image/png")).toBe(true);
    expect(shouldOptimizeImageType("image/webp")).toBe(true);
    expect(shouldOptimizeImageType("image/gif")).toBe(false);
    expect(shouldOptimizeImageType("image/svg+xml")).toBe(false);
  });

  it("infers common image types when the browser omits MIME metadata", () => {
    expect(resolveImageContentType("family.JPG", "")).toBe("image/jpeg");
    expect(resolveImageContentType("family.webp", "")).toBe("image/webp");
    expect(resolveImageContentType("family.png", "")).toBe("image/png");
    expect(resolveImageContentType("family.bin", "")).toBe("");
    expect(resolveImageContentType("family.jpg", "image/jpeg")).toBe(
      "image/jpeg"
    );
  });
});
