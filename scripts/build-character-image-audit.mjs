import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const audit = JSON.parse(await readFile("docs/character-image-audit.json", "utf8"));
const outputDirectory = ".character-assets/audit-v0.4.1";
const imageDirectory = join(outputDirectory, "images");
const sheetDirectory = join(outputDirectory, "sheets");
await mkdir(imageDirectory, { recursive: true });
await mkdir(sheetDirectory, { recursive: true });

const entries = Object.entries(audit);
const inspected = [];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function download([mappingKey, metadata], index) {
  const response = await fetch(metadata.url, {
    headers: { accept: "image/avif,image/webp,image/*", "user-agent": "sajusaju-image-audit/0.4.1" },
  });
  if (!response.ok) throw new Error(`${mappingKey}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const image = sharp(buffer, { failOn: "warning" });
  const info = await image.metadata();
  const keyLabel = mappingKey.replaceAll("|", " · ");
  const sourceLabel = metadata.fallbackFrom
    ? `WRONG FALLBACK: ${metadata.sourceName}`
    : `source: ${metadata.sourceName}`;
  const label = Buffer.from(`<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="50" fill="#11110f"/>
    <text x="8" y="19" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="700">${escapeXml(keyLabel)}</text>
    <text x="8" y="38" fill="${metadata.fallbackFrom ? "#ff6b55" : "#a9a69e"}" font-family="sans-serif" font-size="9">${escapeXml(sourceLabel)}</text>
  </svg>`);
  const tile = await sharp({
    create: { width: 200, height: 320, channels: 3, background: "#242521" },
  })
    .composite([
      { input: await image.clone().resize(184, 270, { fit: "cover", position: "north" }).jpeg({ quality: 88 }).toBuffer(), left: 8, top: 0 },
      { input: label, left: 0, top: 270 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
  const fileName = `${String(index).padStart(3, "0")}.jpg`;
  await writeFile(join(imageDirectory, fileName), tile);
  inspected.push({
    index,
    mappingKey,
    sourceName: metadata.sourceName,
    sourceId: metadata.sourceId,
    fallbackFrom: metadata.fallbackFrom ?? null,
    width: info.width ?? null,
    height: info.height ?? null,
    format: info.format ?? null,
    bytes: buffer.length,
    tile: fileName,
  });
}

let nextIndex = 0;
async function worker() {
  while (nextIndex < entries.length) {
    const index = nextIndex;
    nextIndex += 1;
    await download(entries[index], index);
  }
}
await Promise.all(Array.from({ length: 6 }, () => worker()));
inspected.sort((left, right) => left.index - right.index);

const columns = 5;
const rows = 4;
const perSheet = columns * rows;
for (let offset = 0; offset < inspected.length; offset += perSheet) {
  const page = inspected.slice(offset, offset + perSheet);
  const composites = await Promise.all(page.map(async (item, pageIndex) => ({
    input: await readFile(join(imageDirectory, item.tile)),
    left: (pageIndex % columns) * 200,
    top: Math.floor(pageIndex / columns) * 320,
  })));
  await sharp({ create: { width: 1000, height: 1280, channels: 3, background: "#ece8df" } })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(join(sheetDirectory, `sheet-${String(offset / perSheet + 1).padStart(2, "0")}.jpg`));
}

await writeFile(join(outputDirectory, "metadata.json"), `${JSON.stringify(inspected, null, 2)}\n`);
console.log(`Audited ${inspected.length} images into ${Math.ceil(inspected.length / perSheet)} sheets.`);
