import type { CharacterResult } from "../data/characterMappings";
import type { Element } from "../domain/saju/constants";

export interface ResultViewModel {
  resultId: string;
  cycleIndex: number;
  ganji: string;
  ganjiKr: string;
  element: Element;
  archetype: {
    name: string;
    animal: string;
    description: string;
    imageKey: string;
  };
  characters: CharacterResult[];
  user: {
    displayNickname: string;
    displayBirthDate: string;
  };
  createdAt: string;
}

