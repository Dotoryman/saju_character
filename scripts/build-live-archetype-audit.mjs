import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const origin = process.argv[2] ?? "https://sajusaju.cloud";
const source = await readFile("src/data/archetypes.ts", "utf8");
const entries = source.split(/\r?\n/)
  .filter((line) => /^[가-힣]+\|/.test(line))
  .map((line, cycleIndex) => {
    const [ganjiKr, , animalName] = line.split("|");
    return { cycleIndex, ganjiKr, animalName };
  });

const outputDir = ".character-assets/live-archetype-audit";
await mkdir(outputDir, { recursive: true });

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const cards = [];
for (const entry of entries) {
  const imageUrl = new URL(`/media/animals/${encodeURIComponent(entry.animalName)}`, origin);
  const response = await fetch(imageUrl, {
    headers: { accept: "image/avif,image/webp,image/*", "user-agent": "sajusaju-archetype-audit/1.0" },
  });
  if (!response.ok) throw new Error(`${entry.ganjiKr} ${entry.animalName}: ${response.status}`);

  const image = await sharp(Buffer.from(await response.arrayBuffer()))
    .rotate()
    .resize(240, 180, { fit: "cover", position: "centre" })
    .jpeg({ quality: 86 })
    .toBuffer();
  const labelText = escapeXml(`${String(entry.cycleIndex + 1).padStart(2, "0")} ${entry.ganjiKr} · ${entry.animalName}`);
  const label = Buffer.from(`<svg width="240" height="38"><rect width="240" height="38" fill="#171715"/><text x="10" y="25" fill="white" font-family="sans-serif" font-size="15">${labelText}</text></svg>`);
  cards.push(await sharp({ create: { width: 240, height: 218, channels: 3, background: "#eee" } })
    .composite([{ input: image, top: 0, left: 0 }, { input: label, top: 180, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer());
}

const columns = 5;
const perSheet = 20;
for (let offset = 0; offset < cards.length; offset += perSheet) {
  const page = cards.slice(offset, offset + perSheet);
  const rows = Math.ceil(page.length / columns);
  await sharp({ create: { width: columns * 240, height: rows * 218, channels: 3, background: "#ddd" } })
    .composite(page.map((input, index) => ({ input, left: (index % columns) * 240, top: Math.floor(index / columns) * 218 })))
    .jpeg({ quality: 90 })
    .toFile(path.join(outputDir, `archetype-sheet-${Math.floor(offset / perSheet) + 1}.jpg`));
}

console.log(`Created ${Math.ceil(cards.length / perSheet)} sheets for ${cards.length} live archetypes from ${origin}.`);
