import { useState } from "react";
import type { CharacterResult } from "../data/characterMappings";

const SYMBOLS: Record<CharacterResult["theme"], string> = {
  "one-piece": "☠",
  naruto: "忍",
  inuyasha: "月",
  ghibli: "風",
};

export function CharacterCard({ character, index }: { character: CharacterResult; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className={`character-card theme-${character.theme}`}>
      <div className="character-visual">
        {character.imageKey && !imageFailed ? (
          <img
            alt={`${character.themeName} ${character.characterName} 캐릭터`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={character.imageKey}
          />
        ) : (
          <div className="character-image-fallback" aria-hidden="true">
            <span>{SYMBOLS[character.theme]}</span>
            <small>{character.characterName}</small>
          </div>
        )}
        <span className="image-label">CHARACTER MATCH</span>
      </div>
      <div className="character-copy">
        <div className="character-card-head">
          <p className="eyebrow">{character.themeName}</p>
          <span className="match-index">0{index + 1}</span>
        </div>
        <h3>{character.characterName}</h3>
        <strong>{character.tagline}</strong>
        <p>{character.description}</p>
      </div>
    </article>
  );
}
