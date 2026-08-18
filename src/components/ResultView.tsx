import { Link } from "react-router-dom";
import type { ResultViewModel } from "../shared/result";
import { CharacterCard } from "./CharacterCard";

const ELEMENT_LABEL = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
} as const;

export function ResultView({ result }: { result: ResultViewModel }) {
  async function shareResult() {
    const shareData = {
      title: `${result.ganjiKr}일주 캐릭터`,
      text: `나는 ${result.ganjiKr}일주, 대표 동물은 ${result.archetype.animal}입니다.`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    window.alert("결과 주소를 복사했습니다.");
  }

  return (
    <div className={`result-layout element-${result.element}`}>
      <section className="result-hero">
        <div className="result-meta">
          <span>{result.user.displayNickname}</span>
          <span>{result.user.displayBirthDate}</span>
        </div>
        <div className="ganji-watermark" aria-hidden="true">{result.ganji}</div>
        <p className="eyebrow">YOUR DAY PILLAR</p>
        <h1>당신은 <em>{result.ganjiKr}일주</em>입니다.</h1>
        <div className="element-chip">{ELEMENT_LABEL[result.element]}의 기운</div>
        <p className="archetype-name">{result.archetype.name}</p>
        <div className="animal-block">
          <span>대표 동물</span>
          <strong>{result.archetype.animal}</strong>
        </div>
        <p className="result-description">{result.archetype.description}</p>
        <div className="result-actions">
          <button className="button primary" type="button" onClick={() => void shareResult()}>결과 공유하기</button>
          <Link className="button secondary" to="/">다시 찾아보기</Link>
        </div>
      </section>

      <section className="character-section" aria-labelledby="character-title">
        <div className="section-heading">
          <p className="eyebrow">FOUR WORLDS, ONE YOU</p>
          <h2 id="character-title">네 세계의 닮은 캐릭터</h2>
          <p>공식 생일이 아닌 능력과 분위기, 상징성을 연결한 재미있는 콘텐츠입니다.</p>
        </div>
        <div className="character-grid">
          {result.characters.map((character) => (
            <CharacterCard key={character.theme} character={character} />
          ))}
        </div>
      </section>
    </div>
  );
}

