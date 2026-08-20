import { describe, expect, it } from "vitest";
import { CHARACTER_IMAGE_SOURCES } from "./characterImageSources.generated";
import { getCharacterResults } from "./characterMappings";

describe("character image mappings", () => {
  it("provides an image for every character in all 60 results", () => {
    // Ayame is an anime-original InuYasha character without a matching AniList
    // character record. The UI deliberately uses its polished theme fallback
    // instead of displaying a different character under her name.
    const documentedFallbacks = new Set(["inuyasha|아야메"]);
    for (let cycleIndex = 0; cycleIndex < 60; cycleIndex += 1) {
      for (const character of getCharacterResults(cycleIndex)) {
        const key = `${character.theme}|${character.characterName}`;
        if (!documentedFallbacks.has(key)) {
          expect(CHARACTER_IMAGE_SOURCES[key], key).toMatch(/^https:\/\//);
        }
        expect(character.imageKey).toContain(encodeURIComponent(character.characterName));
      }
    }
  });
});
