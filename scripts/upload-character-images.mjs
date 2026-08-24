import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const audit = JSON.parse(await (await import("node:fs/promises")).readFile("docs/character-image-audit.json", "utf8"));
const cacheDirectory = ".character-assets";
const wrangler = join("node_modules", "wrangler", "bin", "wrangler.js");
await mkdir(cacheDirectory, { recursive: true });

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...args], { stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr || `wrangler exited ${code}`)));
  });
}

const entries = Object.entries(audit);
let nextIndex = 0;
let completed = 0;

async function worker() {
  while (nextIndex < entries.length) {
    const index = nextIndex;
    nextIndex += 1;
    const [mappingKey, metadata] = entries[index];
    const [theme, characterName] = mappingKey.split("|");
    const response = await fetch(metadata.url, {
      headers: { accept: "image/avif,image/webp,image/*", "user-agent": "sajusaju-character-assets/0.2" },
    });
    if (!response.ok) throw new Error(`${mappingKey}: download failed ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1_000) throw new Error(`${mappingKey}: image is unexpectedly small`);
    const filePath = join(cacheDirectory, `${String(index).padStart(3, "0")}.img`);
    await writeFile(filePath, bytes);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const objectPath = `ganji-character-assets/characters/${theme}/${characterName}.jpg`;
    await runWrangler([
      "r2", "object", "put", objectPath,
      "--file", filePath,
      "--content-type", contentType,
      "--cache-control", "public, max-age=2592000, immutable",
      "--remote", "--force",
    ]);
    completed += 1;
    if (completed % 10 === 0 || completed === entries.length) console.log(`Uploaded ${completed}/${entries.length}`);
  }
}

// Wrangler's R2 uploader is deliberately run sequentially. Parallel CLI processes
// occasionally uploaded a neighbouring temporary file under the wrong object key.
// A full refresh is slower this way, but each character keeps its verified image.
await worker();
console.log(`Uploaded ${completed} character image objects to R2.`);
