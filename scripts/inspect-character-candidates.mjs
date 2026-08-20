const queries = process.argv.slice(2);
if (queries.length === 0) throw new Error("Pass one or more character search queries.");

const fields = queries.map((query, index) => `q${index}: Page(perPage: 30) {
  characters(search: ${JSON.stringify(query)}) {
    id
    name { full native }
    image { large }
    media(perPage: 30) { nodes { title { romaji english } } }
  }
}`).join("\n");

const response = await fetch("https://graphql.anilist.co", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: `query { ${fields} }` }),
});
if (!response.ok) throw new Error(`AniList request failed: ${response.status}`);
const payload = await response.json();
if (payload.errors) throw new Error(JSON.stringify(payload.errors));

queries.forEach((query, index) => {
  console.log(`\n=== ${query} ===`);
  for (const candidate of payload.data?.[`q${index}`]?.characters ?? []) {
    console.log(JSON.stringify({
      id: candidate.id,
      name: candidate.name.full,
      native: candidate.name.native,
      image: candidate.image.large,
      media: candidate.media.nodes.map((node) => node.title.english || node.title.romaji).filter(Boolean),
    }));
  }
});
