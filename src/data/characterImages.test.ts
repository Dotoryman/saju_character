import { describe, expect, it } from "vitest";
import { CHARACTER_IMAGE_SOURCES } from "./characterImageSources.generated";
import { getCharacterResults } from "./characterMappings";

describe("character image mappings", () => {
  it("provides an image for every character in all 60 results", () => {
    for (let cycleIndex = 0; cycleIndex < 60; cycleIndex += 1) {
      for (const character of getCharacterResults(cycleIndex, "테스트 동물")) {
        const key = `${character.theme}|${character.characterName}`;
        expect(CHARACTER_IMAGE_SOURCES[key], key).toMatch(/^https:\/\//);
        expect(character.imageKey).toContain(encodeURIComponent(character.characterName));
      }
    }
  });
});
