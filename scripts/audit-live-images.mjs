import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const origin = process.argv[2] ?? "https://sajusaju.cloud";
const mappingSource = await readFile("src/data/characterMappings.ts", "utf8");
const archetypeSource = await readFile("src/data/archetypes.ts", "utf8");
const themes = ["one-piece", "naruto", "inuyasha", "ghibli"];
const targets = new Map();

for (const theme of themes) {
  const pattern = new RegExp(`(?:"${theme}"|${theme}):\\s*"([^"]+)"`, "g");
  for (const match of mappingSource.matchAll(pattern)) {
    const name = match[1];
    targets.set(`character|${theme}|${name}`, `/media/characters/${theme}/${encodeURIComponent(name)}`);
  }
}

for (const line of archetypeSource.split(/\r?\n/)) {
  const fields = line.split("|");
  if (/^[가-힣]+\|/.test(line) && fields.length >= 3 && fields[2]) {
    const name = fields[2].trim();
    targets.set(`animal|${name}`, `/media/animals/${encodeURIComponent(name)}`);
  }
}

const entries = [...targets.entries()];
let cursor = 0;
const results = [];

async function inspect([key, path]) {
  const response = await fetch(new URL(path, origin), {
    headers: { accept: "image/avif,image/webp,image/*", "user-agent": "sajusaju-live-image-audit/1.0" },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());
  let width = null;
  let height = null;
  let format = null;
  let decodeError = null;
  if (response.ok) {
    try {
      ({ width = null, height = null, format = null } = await sharp(buffer).metadata());
    } catch (error) {
      decodeError = error instanceof Error ? error.message : String(error);
    }
  }
  results.push({
    key,
    path,
    status: response.status,
    contentType,
    bytes: buffer.length,
    width,
    height,
    format,
    hash: createHash("sha256").update(buffer).digest("hex"),
    decodeError,
  });
}

async function worker() {
  while (cursor < entries.length) {
    const index = cursor;
    cursor += 1;
    await inspect(entries[index]);
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
results.sort((left, right) => left.key.localeCompare(right.key, "ko"));

const failures = results.filter((item) => !item.status.toString().startsWith("2") || !item.contentType.startsWith("image/") || item.decodeError);
const tiny = results.filter((item) => item.width && item.height && (item.width < 180 || item.height < 180));
const duplicateGroups = Object.values(Object.groupBy(results, (item) => item.hash)).filter((group) => group.length > 1);

console.log(JSON.stringify({
  origin,
  total: results.length,
  failures,
  tiny,
  duplicateGroups: duplicateGroups.map((group) => group.map((item) => item.key)),
}, null, 2));
