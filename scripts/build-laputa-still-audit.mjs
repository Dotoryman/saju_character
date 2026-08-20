import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const outputDir = ".character-assets/laputa-audit-v0.4.1";
await mkdir(outputDir, { recursive: true });
const cards = [];

for (let index = 1; index <= 50; index += 1) {
  const number = String(index).padStart(3, "0");
  const url = `https://www.ghibli.jp/gallery/laputa${number}.jpg`;
  const response = await fetch(url, { headers: { "user-agent": "SAJUSAJU/0.4.1 image-audit" } });
  if (!response.ok) continue;
  const image = await sharp(Buffer.from(await response.arrayBuffer())).resize(240, 135, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
  const label = Buffer.from(`<svg width="240" height="25"><rect width="240" height="25" fill="#171715"/><text x="8" y="18" fill="white" font-family="sans-serif" font-size="14">laputa${number}</text></svg>`);
  cards.push(await sharp({ create: { width: 240, height: 160, channels: 3, background: "#ddd" } })
    .composite([{ input: image }, { input: label, top: 135, left: 0 }]).jpeg().toBuffer());
}

for (let offset = 0; offset < cards.length; offset += 20) {
  const page = cards.slice(offset, offset + 20);
  const sheet = sharp({ create: { width: 1200, height: Math.ceil(page.length / 5) * 160, channels: 3, background: "#ddd" } });
  await sheet.composite(page.map((input, index) => ({ input, left: (index % 5) * 240, top: Math.floor(index / 5) * 160 })))
    .jpeg({ quality: 88 }).toFile(`${outputDir}/laputa-sheet-${Math.floor(offset / 20) + 1}.jpg`);
}

console.log(`Created ${Math.ceil(cards.length / 20)} sheets for ${cards.length} official Laputa stills.`);
