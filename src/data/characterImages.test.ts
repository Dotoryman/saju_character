import { describe, expect, it } from "vitest";
import { CHARACTER_IMAGE_SOURCES } from "./characterImageSources.generated";
import { ANIMAL_IMAGE_SOURCES } from "./animalImageSources.generated";
import { ARCHETYPES } from "./archetypes";
import { getCharacterResults } from "./characterMappings";

describe("character image mappings", () => {
  it("provides an image for every character in all 60 results", () => {
    for (let cycleIndex = 0; cycleIndex < 60; cycleIndex += 1) {
      for (const character of getCharacterResults(cycleIndex)) {
        const key = `${character.theme}|${character.characterName}`;
        expect(CHARACTER_IMAGE_SOURCES[key], key).toMatch(/^https:\/\//);
        expect(character.imageKey).toContain(encodeURIComponent(character.characterName));
      }
    }
  });

  it("provides an exact representative-animal image for every result", () => {
    for (const archetype of ARCHETYPES) {
      expect(ANIMAL_IMAGE_SOURCES[archetype.animalName], archetype.animalName).toMatch(/^https:\/\//);
    }
  });
});
