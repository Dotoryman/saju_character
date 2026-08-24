import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const generatedDir = process.argv[2];
if (!generatedDir) throw new Error("Generated-image directory argument is required.");

const replacements = {
  "붉은박쥐": "https://www.nps.gov/mnrr/learn/nature/images/Eastern-Red-Bat_NPS-Photo.jpg?autorotate=false&maxwidth=1300",
  "사자개": "https://www.houdenvanhonden.nl/globalassets/rassen/fci-5/chow-chow/cww-ou-0002.jpg",
  "티베탄 마스티프": "https://strapi-petstocknz-prod-media-library.s3.ap-southeast-2.amazonaws.com/Tibetan_Mastiff_f8e9bd4182.jpg",
  "사슴": "https://cdn.myportfolio.com/134cb283-ca4e-4609-b2c9-6b144add5ab1/ddf1e609-7eb7-4d15-af75-11ceefd8dc1c_rw_1920.jpg?h=bf97bd8cdedcafe9e13b1c1d5fcc4298",
  "범고래": "https://i.abcnewsfe.com/a/ab2469aa-1260-4763-953d-8ec1cc5e0d0f/orca-gty-jef-240514_1715711530854_hpMain_16x9.jpg?w=1600",
  "오소리": "https://animaldiversity.org/collections/contributors/david_blank/Mleucurus2/medium.jpg",
  "들양": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Ovis_ammon_%28cropped%29.jpg",
  "실버백고릴라": "https://gardenista.hu/uploads/2018/01/silver-back-707327_1280.jpg",
  "너구리": "https://static.scientificamerican.com/sciam/cache/file/00B89191-204F-4542-B11C449A3E26881D_source.jpg?crop=4%3A3%2Csmart&w=1400",
  "백공작": "https://mir-s3-cdn-cf.behance.net/project_modules/hd_webp/5c411828310275.56372eeec21b4.jpeg",
  "회색늑대": "https://storyworks.scholastic.com/content/dam/classroom-magazines/storyworks/issues/2018-19/100118/saving-america-s-wolves/STW_100118_WolfSnow_PO.jpg",
  "흰여우": "https://img2.akspic.ru/crops/6/6/2/0/6/160266/160266-belaya_lisa-pesec-zhurnal_belaya_lisa-lisa-zima-1280x720.jpg",
  "불여우": "https://petapixel.com/assets/uploads/2025/03/DSC05224-DN-v4-by-Kate-G-Torva-Terra-1600px.jpg",
};

const generated = {
  "청룡": path.join(generatedDir, "azure-dragon.png"),
  "용": path.join(generatedDir, "dragon.png"),
  "불사조": path.join(generatedDir, "phoenix.png"),
};

const outputDir = ".character-assets/animal-hotfix";
await mkdir(outputDir, { recursive: true });

async function fetchBuffer(url) {
  const response = await fetch(url, { headers: { "user-agent": "SAJUSAJU animal-image-review/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

const manifest = {};
const previews = [];
for (const [animalName, source] of [...Object.entries(replacements), ...Object.entries(generated)]) {
  const input = source.startsWith("http") ? await fetchBuffer(source) : await readFile(source);
  const filename = `${animalName}.webp`;
  const outputPath = path.join(outputDir, filename);
  await sharp(input)
    .rotate()
    .resize(1200, 900, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 86, effort: 5 })
    .toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  manifest[animalName] = { source, file: outputPath, width: metadata.width, height: metadata.height };
  const preview = await sharp(outputPath).resize(300, 225, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
  const safeName = animalName.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const label = Buffer.from(`<svg width="300" height="40"><rect width="300" height="40" fill="#171715"/><text x="12" y="27" fill="white" font-family="sans-serif" font-size="17">${safeName}</text></svg>`);
  previews.push(await sharp({ create: { width: 300, height: 265, channels: 3, background: "#eee" } })
    .composite([{ input: preview, top: 0, left: 0 }, { input: label, top: 225, left: 0 }])
    .jpeg({ quality: 90 }).toBuffer());
}

await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const previewRows = Math.ceil(previews.length / 4);
await sharp({ create: { width: 1200, height: previewRows * 265, channels: 3, background: "#ddd" } })
  .composite(previews.map((input, index) => ({ input, left: (index % 4) * 300, top: Math.floor(index / 4) * 265 })))
  .jpeg({ quality: 90 })
  .toFile(path.join(outputDir, "replacement-sheet.jpg"));
console.log(`Prepared ${Object.keys(manifest).length} animal replacements.`);
