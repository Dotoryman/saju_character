import { mkdir, readFile, writeFile } from "node:fs/promises";

const pageByAnimal = {
  "검은늑대": "Black_wolf", "고릴라": "Gorilla", "공작": "Indian_peafowl", "꽃사슴": "Sika_deer",
  "너구리": "Raccoon_dog", "늑대": "Wolf", "독수리": "Golden_eagle", "들소": "American_bison",
  "들양": "Bighorn_sheep", "물소": "Water_buffalo", "백공작": "White_peafowl", "백로": "Great_egret",
  "백호": "White_tiger", "범고래": "Orca", "북극여우": "Arctic_fox", "불곰": "Brown_bear",
  "불여우": "Red_fox", "붉은박쥐": "Eastern_red_bat", "붉은여우": "Red_fox", "붉은코브라": "Red_spitting_cobra",
  "붉은판다": "Red_panda", "비버": "North_American_beaver", "사막뱀": "Saharan_horned_viper", "사슴": "Deer",
  "사자": "Lion", "사자개": "Chow_Chow", "사향노루": "Siberian_musk_deer", "산양": "Long-tailed_goral",
  "살무사": "Mamushi", "설표": "Snow_leopard", "수달": "Eurasian_otter", "시베리아호랑이": "Siberian_tiger",
  "앙고라토끼": "Angora_rabbit", "오소리": "Asian_badger", "은빛고릴라": "Gorilla", "재규어": "Jaguar",
  "천산갑": "Chinese_pangolin", "청사": "Smooth_green_snake", "청설모": "Eurasian_red_squirrel", "카피바라": "Capybara",
  "코끼리": "African_bush_elephant", "코모도드래곤": "Komodo_dragon", "코뿔소": "White_rhinoceros", "토끼": "European_rabbit",
  "티베탄 마스티프": "Tibetan_Mastiff", "해달": "Sea_otter", "호랑이": "Tiger", "황조롱이": "Common_kestrel",
  "회색늑대": "Wolf", "흑표범": "Black_panther", "흰담비": "Stoat", "흰돌고래": "Beluga_whale",
  "흰뱀": "Leucism", "흰사슴": "White_stag", "흰여우": "Arctic_fox",
  "용": "Chinese_dragon", "청룡": "Azure_Dragon", "불사조": "Phoenix_(mythology)",
};

const seed = await readFile("src/data/archetypes.ts", "utf8");
const animalNames = [...new Set(seed.split("\n")
  .filter((line) => /^[가-힣]+\|/.test(line))
  .map((line) => line.split("|")[2]))];

const selections = {};
const entries = animalNames.map((animalName) => ({ animalName, pageTitle: pageByAnimal[animalName] }));
for (const { animalName } of entries.filter(({ pageTitle }) => !pageTitle)) console.warn(`UNMAPPED ${animalName}`);

// Wikipedia's Action API accepts many page titles in a single request. Batching keeps
// this audit reproducible without hammering the public endpoint and hitting rate limits.
for (let offset = 0; offset < entries.length; offset += 25) {
  const batch = entries.slice(offset, offset + 25).filter(({ pageTitle }) => pageTitle);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "pageimages|info",
    inprop: "url",
    piprop: "original|thumbnail",
    pithumbsize: "1000",
    redirects: "1",
    titles: batch.map(({ pageTitle }) => pageTitle).join("|"),
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: { accept: "application/json", "user-agent": "SAJUSAJU/0.4.1 image-audit (sajusaju.cloud)" },
  });
  if (!response.ok) throw new Error(`Wikipedia batch failed: ${response.status}`);
  const payload = await response.json();
  const pages = new Map(payload.query.pages.map((page) => [page.title.replaceAll(" ", "_"), page]));
  for (const { animalName, pageTitle } of batch) {
    const normalizedTitle = payload.query.redirects?.find((redirect) => redirect.from.replaceAll(" ", "_") === pageTitle)?.to ?? pageTitle;
    const page = pages.get(normalizedTitle.replaceAll(" ", "_"));
    const url = page?.thumbnail?.source ?? page?.original?.source;
    if (!url) {
      console.warn(`NO IMAGE ${animalName} / ${pageTitle}`);
      continue;
    }
    selections[animalName] = { url, pageTitle, sourcePage: page.fullurl ?? null };
  }
}

selections["백공작"] = {
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/White-peacock.jpg/960px-White-peacock.jpg",
  pageTitle: "File:White-peacock.jpg",
  sourcePage: "https://commons.wikimedia.org/wiki/File:White-peacock.jpg",
  verifiedOverride: true,
};
selections["흰뱀"] = {
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Albino_snakes.jpg/500px-Albino_snakes.jpg",
  pageTitle: "File:Albino snakes.jpg",
  sourcePage: "https://commons.wikimedia.org/wiki/File:Albino_snakes.jpg",
  verifiedOverride: true,
};
selections["불사조"] = {
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/RedPhoenixnb.svg/500px-RedPhoenixnb.svg.png",
  pageTitle: "File:RedPhoenixnb.svg",
  sourcePage: "https://commons.wikimedia.org/wiki/File:RedPhoenixnb.svg",
  verifiedOverride: true,
};
const lines = Object.entries(selections)
  .sort(([left], [right]) => left.localeCompare(right, "ko"))
  .map(([name, value]) => `  ${JSON.stringify(name)}: ${JSON.stringify(value.url)},`);

await mkdir("src/data", { recursive: true });
await writeFile("src/data/animalImageSources.generated.ts", `// Generated from Wikipedia/Wikimedia page images.\nexport const ANIMAL_IMAGE_SOURCES: Record<string, string> = {\n${lines.join("\n")}\n};\n`);
await writeFile("docs/animal-image-audit.json", `${JSON.stringify(selections, null, 2)}\n`);
console.log(`Resolved ${Object.keys(selections).length} of ${animalNames.length} animal image mappings.`);
