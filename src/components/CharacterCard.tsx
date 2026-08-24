import { useState } from "react";
import type { CharacterResult } from "../data/characterMappings";

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
            <small>이미지를 불러오지 못했습니다</small>
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
