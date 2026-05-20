import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOTS = ["public", "Images"];
const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

async function collectImages(dir, output = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectImages(filePath, output);
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      output.push(filePath);
    }
  }

  return output;
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function convertImage(sourcePath) {
  const parsed = path.parse(sourcePath);
  const targetPath = path.join(parsed.dir, `${parsed.name}.webp`);
  const metadata = await sharp(sourcePath).metadata();
  const sourceStat = await fs.stat(sourcePath);

  const webpOptions = metadata.hasAlpha
    ? { lossless: true, effort: 6 }
    : { quality: 82, effort: 6, smartSubsample: true };

  await sharp(sourcePath).rotate().webp(webpOptions).toFile(targetPath);

  const targetStat = await fs.stat(targetPath);

  return {
    sourcePath,
    targetPath,
    sourceBytes: sourceStat.size,
    targetBytes: targetStat.size,
  };
}

const existingRoots = [];
for (const root of ROOTS) {
  try {
    const stat = await fs.stat(root);
    if (stat.isDirectory()) existingRoots.push(root);
  } catch {
    // Ignore missing optional roots.
  }
}

const images = [];
for (const root of existingRoots) {
  await collectImages(root, images);
}

let sourceTotal = 0;
let targetTotal = 0;

for (const imagePath of images) {
  const result = await convertImage(imagePath);
  sourceTotal += result.sourceBytes;
  targetTotal += result.targetBytes;

  console.log(
    `${result.sourcePath} -> ${result.targetPath} ` +
      `(${formatBytes(result.sourceBytes)} -> ${formatBytes(result.targetBytes)})`
  );
}

console.log(
  `Converted ${images.length} images: ${formatBytes(sourceTotal)} -> ` +
    `${formatBytes(targetTotal)} saved ${formatBytes(sourceTotal - targetTotal)}`
);
