import { describe, expect, it } from "vitest";
import { ARCHETYPES } from "./archetypes";
import { CHARACTER_PROFILES } from "./characterProfiles";
import { PILLAR_CHARACTER_MAPPINGS, THEMES, getCharacterResults, type ThemeSlug } from "./characterMappings";

function occurrences(theme: ThemeSlug): Map<string, number> {
  const counts = new Map<string, number>();
  for (const mapping of PILLAR_CHARACTER_MAPPINGS) {
    const name = mapping[theme];
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

describe("content integrity", () => {
  it("keeps the 60-cycle data aligned", () => {
    expect(ARCHETYPES).toHaveLength(60);
    expect(PILLAR_CHARACTER_MAPPINGS).toHaveLength(60);

    ARCHETYPES.forEach((archetype, cycleIndex) => {
      expect(archetype.cycleIndex).toBe(cycleIndex);
      expect(PILLAR_CHARACTER_MAPPINGS[cycleIndex]?.ganjiKr).toBe(archetype.ganjiKr);
      expect(archetype.animalName.trim()).not.toBe("");
      expect(archetype.description.trim()).not.toBe("");
    });

    expect(new Set(ARCHETYPES.map(({ ganjiKr }) => ganjiKr)).size).toBe(60);
  });

  it("provides four complete, individually described character results per pillar", () => {
    const descriptions = new Set<string>();

    for (let cycleIndex = 0; cycleIndex < 60; cycleIndex += 1) {
      const results = getCharacterResults(cycleIndex);
      expect(results).toHaveLength(4);
      for (const result of results) {
        expect(CHARACTER_PROFILES[result.theme][result.characterName], `${result.theme}|${result.characterName}`).toBeDefined();
        expect(result.tagline.trim()).not.toBe("");
        expect(result.description.trim().length).toBeGreaterThan(35);
        descriptions.add(result.description);
      }
    }

    expect(descriptions.size).toBe(240);
  });

  it("limits repetition while allowing a few strong signature matches", () => {
    const limits: Record<ThemeSlug, number> = {
      "one-piece": 3,
      naruto: 3,
      inuyasha: 4,
      ghibli: 4,
    };

    for (const theme of THEMES) {
      const counts = occurrences(theme.slug);
      expect(Math.max(...counts.values()), theme.slug).toBeLessThanOrEqual(limits[theme.slug]);
    }
  });

  it("keeps user-selected and signature mappings", () => {
    const byGanji = new Map(PILLAR_CHARACTER_MAPPINGS.map((mapping) => [mapping.ganjiKr, mapping]));
    expect(byGanji.get("병술")).toMatchObject({ "one-piece": "에이스", naruto: "데이다라", ghibli: "캘시퍼" });
    expect(byGanji.get("임진")).toMatchObject({ naruto: "토비라마", ghibli: "하쿠" });
    expect(byGanji.get("기축")?.["one-piece"]).toBe("야마토");
    expect([...occurrences("one-piece").keys()]).toEqual(expect.arrayContaining(["시라호시", "모네"]));
    expect([...occurrences("inuyasha").keys()]).toEqual(expect.arrayContaining(["지넨지", "유라", "아야메", "투아왕"]));
    expect([...occurrences("inuyasha").keys()]).not.toContain("이누노타이쇼");
    expect([...occurrences("ghibli").keys()]).not.toContain("하울의 성");
  });
});
