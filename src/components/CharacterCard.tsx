import type { CharacterResult } from "../data/characterMappings";

const SYMBOLS: Record<CharacterResult["theme"], string> = {
  "one-piece": "☠",
  naruto: "忍",
  inuyasha: "月",
  ghibli: "風",
};

export function CharacterCard({ character }: { character: CharacterResult }) {
  return (
    <article className={`character-card theme-${character.theme}`}>
      <div className="character-visual" aria-hidden="true">
        <span>{SYMBOLS[character.theme]}</span>
        <small>IMAGE LATER</small>
      </div>
      <div className="character-copy">
        <p className="eyebrow">{character.themeName}</p>
        <h3>{character.characterName}</h3>
        <strong>{character.tagline}</strong>
        <p>{character.description}</p>
      </div>
    </article>
  );
}

