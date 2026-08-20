import { mkdir, writeFile } from "node:fs/promises";

const groups = {
  naruto: {
    "3대 라이카게": "A Third Raikage", "4대 라이카게": "A Fourth Raikage", "가아라": "Gaara",
    "나루토": "Naruto Uzumaki", "단조": "Danzou Shimura", "데이다라": "Deidara", "도다이": "Dodai",
    "마이트 가이": "Might Guy", "미나토": "Minato Namikaze", "미츠키": "Mitsuki", "사소리": "Sasori",
    "사스케": "Sasuke Uchiha", "사이": "Sai", "사쿠라": "Sakura Haruno", "사쿠모": "Sakumo Hatake",
    "시노": "Shino Aburame", "시즈네": "Shizune", "야마토": "Yamato", "오로치마루": "Orochimaru",
    "오비토": "Obito", "오오노키": "Onoki", "우타카타": "Utakata", "이노": "Ino Yamanaka",
    "이루카": "Iruka Umino", "이타치": "Itachi Uchiha", "자부자": "Zabuza Momochi", "지라이야": "Jiraiya",
    "초지": "Chouji Akimichi", "쵸지": "Chouji Akimichi", "쵸쵸": "Chouchou Akimichi", "츠나데": "Tsunade",
    "카부토": "Kabuto Yakushi", "카카시": "Kakashi Hatake", "카쿠즈": "Kakuzu", "코난": "Konan",
    "쿠레나이": "Kurenai Yuuhi", "키사메": "Kisame Hoshigaki", "킬러 비": "Killer Bee", "테마리": "Temari",
    "텐텐": "Tenten", "토비라마": "Tobirama Senju", "페인": "Pain", "하시라마": "Hashirama Senju",
    "하쿠": "Haku", "한": "Han", "한조": "Hanzou", "히나타": "Hinata Hyuuga",
    "시카마루": "Shikamaru Nara", "마다라": "Madara Uchiha",
  },
  inuyasha: {
    "고신키": "Goshinki", "나라쿠": "Naraku", "류코츠세이": "Ryukotsusei", "링": "Rin",
    "묘가": "Myoga", "미로쿠": "Miroku", "산고": "Sango", "셋쇼마루": "Sesshomaru",
    "싯포": "Shippo", "이누야샤": "Inuyasha", "쟈코츠": "Jakotsu",
    "카고메": "Kagome Higurashi", "카구라": "Kagura", "카에데": "Kaede", "칸나": "Kanna",
    "코우가": "Kouga", "키쿄우": "Kikyo", "호센키": "Housenki", "투아왕": "Touga",
    "지넨지": "Jinenji", "아야메": "Ayame", "반코츠": "Bankotsu", "하쿠도시": "Hakudoushi",
    "코하쿠": "Kohaku", "토토사이": "Totosai", "쟈켄": "Jaken", "긴코츠": "Ginkotsu", "유라": "Yura",
  },
  "one-piece": {
    "가프": "Garp", "검은수염": "Marshall D. Teach", "나미": "Nami", "돌턴": "Dalton",
    "레베카": "Rebecca", "로빈": "Nico Robin", "로우": "Trafalgar Law", "루피": "Monkey D. Luffy",
    "마르코": "Marco", "몽키 D. 드래곤": "Dragon", "미호크": "Dracule Mihawk",
    "보아 핸콕": "Boa Hancock", "비비": "Nefertari Vivi", "빅 맘": "Charlotte Linlin", "상디": "Sanji",
    "샹크스": "Shanks", "센고쿠": "Sengoku", "시라호시": "Shirahoshi", "시저": "Caesar Clown",
    "아카이누": "Sakazuki", "에이스": "Portgas D. Ace", "우솝": "Usopp", "조로": "Roronoa Zoro",
    "징베": "Jinbe", "쵸파": "Tony Tony Chopper", "카이도": "Kaido", "캐럿": "Carrot",
    "캐번디시": "Cavendish", "코비": "Koby", "코알라": "Koala", "쿠잔": "Kuzan",
    "크로커다일": "Crocodile", "키드": "Eustass Kid", "킹": "King", "타시기": "Tashigi",
    "흰수염": "Edward Newgate", "야마토": "Yamato", "코즈키 오뎅": "Kozuki Oden",
    "사보": "Sabo", "모네": "Monet", "바솔로뮤 쿠마": "Bartholomew Kuma",
    "골 D. 로저": "Roger", "프랑키": "Franky", "카타쿠리": "Charlotte Katakuri",
  },
  ghibli: {
    "가오나시": "No-Face", "나우시카": "Nausicaä", "라퓨타 로봇병": "Robot Soldier", "메이": "Mei Kusakabe",
    "모로": "Moro", "무스카": "Muska", "산": "San", "소피": "Sophie Hatter",
    "쇼우": "Shou", "숲의 신": "Shishigami", "시즈쿠": "Shizuku Tsukishima",
    "시타": "Sheeta", "아리에티": "Arrietty", "아시타카": "Ashitaka", "오소노": "Osono",
    "유바바": "Yubaba", "지로": "Jirou Horikoshi", "치히로": "Chihiro Ogino", "캘시퍼": "Calcifer",
    "키키": "Kiki", "토토로": "Totoro", "포뇨": "Ponyo", "포르코": "Porco Rosso",
    "폰포코 너구리": "Shoukichi", "하울": "Howl",
    "하쿠": "Haku", "지지": "Jiji", "에보시": "Eboshi", "가마 할아범": "Kamaji",
    "남작": "Baron", "파즈": "Pazu", "하루": "Haru Yoshioka",
    "무타": "Muta", "사츠키": "Satsuki Kusakabe", "카구야 공주": "Kaguya-hime",
  },
};

const entries = Object.entries(groups).flatMap(([theme, names]) =>
  Object.entries(names).map(([name, query]) => ({ theme, name, query })),
);

const expectedMedia = {
  naruto: /Naruto|Boruto/i,
  inuyasha: /InuYasha|Hanyou no Yashahime/i,
  "one-piece": /One Piece/i,
  ghibli: /Mononoke|Spirited Away|Howl|Totoro|Kiki|Ponyo|Nausica|Laputa|Castle in the Sky|Whisper of the Heart|Arrietty|Wind Rises|Porco|Pom Poko|Cat Returns|Kaguya/i,
};

const selections = {};
for (let offset = 0; offset < entries.length; offset += 8) {
  const batch = entries.slice(offset, offset + 8);
  const fields = batch.map((entry, index) =>
    `q${index}: Page(perPage: 10) { characters(search: ${JSON.stringify(entry.query)}) { id name { full native } image { large } media(perPage: 6) { nodes { title { romaji english } } } } }`,
  ).join("\n");
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: `query { ${fields} }` }),
  });
  if (!response.ok) throw new Error(`AniList request failed: ${response.status}`);
  const payload = await response.json();
  if (payload.errors) throw new Error(JSON.stringify(payload.errors));

  batch.forEach((entry, index) => {
    const candidates = payload.data[`q${index}`]?.characters ?? [];
    const character = candidates.find((candidate) =>
      candidate.media.nodes.some((node) => expectedMedia[entry.theme].test(node.title.english || node.title.romaji || "")),
    );
    if (!character?.image?.large) {
      console.warn(`UNRESOLVED ${entry.theme} / ${entry.name} / ${entry.query}`);
      return;
    }
    selections[`${entry.theme}|${entry.name}`] = {
      url: character.image.large,
      sourceName: character.name.full,
      sourceId: character.id,
      media: character.media.nodes.map((node) => node.title.english || node.title.romaji).filter(Boolean),
    };
  });
  await new Promise((resolve) => setTimeout(resolve, 650));
}

const fallbacks = {
  "naruto|오비토": "naruto|카카시",
  "naruto|한": "naruto|킬러 비",
  "inuyasha|링": "inuyasha|카고메",
  "inuyasha|카에데": "inuyasha|키쿄우",
  "inuyasha|칸나": "inuyasha|카구라",
  "inuyasha|코우가": "inuyasha|이누야샤",
  "inuyasha|호센키": "inuyasha|류코츠세이",
  "one-piece|몽키 D. 드래곤": "one-piece|가프",
  "one-piece|킹": "one-piece|카이도",
  "ghibli|라퓨타 로봇병": "ghibli|시타",
  "ghibli|쇼우": "ghibli|아리에티",
};

// AniList text search does not reliably expose this movie-only character.
// Keep the verified character record explicit so the Korean display-name rename
// does not break the existing image cache or silently select a different person.
selections["inuyasha|투아왕"] = {
  url: "https://s4.anilist.co/file/anilistcdn/character/large/3167.jpg",
  sourceName: "Inu no Taisho",
  sourceId: 3167,
  media: ["InuYasha the Movie 3: Swords of an Honorable Ruler"],
  verifiedOverride: true,
};
for (const [target, source] of Object.entries(fallbacks)) {
  if (!selections[target] && selections[source]) {
    selections[target] = { ...selections[source], fallbackFrom: source };
  }
}

const lines = Object.entries(selections)
  .sort(([left], [right]) => left.localeCompare(right, "ko"))
  .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value.url)},`);

await mkdir("src/data", { recursive: true });
await writeFile(
  "src/data/characterImageSources.generated.ts",
  `// Generated by scripts/fetch-character-images.mjs from AniList character metadata.\nexport const CHARACTER_IMAGE_SOURCES: Record<string, string> = {\n${lines.join("\n")}\n};\n`,
);
await writeFile("docs/character-image-audit.json", `${JSON.stringify(selections, null, 2)}\n`);
console.log(`Resolved ${Object.keys(selections).length} of ${entries.length} character image mappings.`);
