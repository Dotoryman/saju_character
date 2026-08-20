const mediaSearch = process.argv[2];
if (!mediaSearch) throw new Error("Pass an AniList media title.");
const nameFilters = process.argv.slice(3).map((value) => value.toLocaleLowerCase());

async function graphql(query, variables) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`AniList request failed: ${response.status}`);
  const payload = await response.json();
  if (payload.errors) throw new Error(JSON.stringify(payload.errors));
  return payload.data;
}

const mediaData = await graphql(`query ($search: String) {
  Page(perPage: 10) { media(search: $search, type: ANIME) { id title { romaji english } } }
}`, { search: mediaSearch });
const candidates = mediaData.Page.media;
console.error("Media candidates:", candidates);
const media = candidates[0];
if (!media) throw new Error("Media not found.");

const characters = [];
for (let page = 1; page <= 20; page += 1) {
  const data = await graphql(`query ($id: Int, $page: Int) {
    Media(id: $id) {
      characters(page: $page, perPage: 50, sort: [ROLE, RELEVANCE, ID]) {
        pageInfo { hasNextPage }
        nodes { id name { full native alternative } image { large } }
      }
    }
  }`, { id: media.id, page });
  characters.push(...data.Media.characters.nodes);
  if (!data.Media.characters.pageInfo.hasNextPage) break;
}

const selected = nameFilters.length === 0 ? characters : characters.filter((character) => {
  const names = [character.name.full, character.name.native, ...character.name.alternative]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return nameFilters.some((filter) => names.includes(filter));
});
console.log(JSON.stringify({ media, characters: selected }, null, 2));
