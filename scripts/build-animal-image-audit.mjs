import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const audit = JSON.parse(await readFile("docs/animal-image-audit.json", "utf8"));
const outputDir = ".character-assets/animal-audit-v0.4.1";
await mkdir(outputDir, { recursive: true });

const cards = [];
for (const [name, source] of Object.entries(audit)) {
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(source.url, { headers: { "user-agent": "SAJUSAJU/0.4.1 image-audit (sajusaju.cloud)" } });
    if (response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 1800 * (attempt + 1)));
  }
  if (!response.ok) {
    console.warn(`SKIP ${name}: ${response.status}`);
    continue;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const image = await sharp(buffer).rotate().resize(220, 170, { fit: "cover", position: "centre" }).jpeg({ quality: 84 }).toBuffer();
  const label = Buffer.from(`<svg width="220" height="36"><rect width="220" height="36" fill="#171715"/><text x="10" y="24" fill="white" font-family="sans-serif" font-size="16">${name}</text></svg>`);
  cards.push(await sharp({ create: { width: 220, height: 206, channels: 3, background: "#eee" } })
    .composite([{ input: image, top: 0, left: 0 }, { input: label, top: 170, left: 0 }]).jpeg().toBuffer());
  await new Promise((resolve) => setTimeout(resolve, 120));
}

const columns = 5;
const rowsPerSheet = 4;
const perSheet = columns * rowsPerSheet;
for (let offset = 0; offset < cards.length; offset += perSheet) {
  const page = cards.slice(offset, offset + perSheet);
  const rows = Math.ceil(page.length / columns);
  const sheet = sharp({ create: { width: columns * 220, height: rows * 206, channels: 3, background: "#ddd" } });
  await sheet.composite(page.map((input, index) => ({ input, left: (index % columns) * 220, top: Math.floor(index / columns) * 206 })))
    .jpeg({ quality: 88 }).toFile(path.join(outputDir, `animal-sheet-${Math.floor(offset / perSheet) + 1}.jpg`));
}

console.log(`Created ${Math.ceil(cards.length / perSheet)} sheets for ${cards.length} animal images.`);
