import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFeed } from "../lib/api";
import type { ResultViewModel } from "../shared/result";

const FEED_SYMBOLS = { "one-piece": "☠", naruto: "忍", inuyasha: "月", ghibli: "風" } as const;

function pickFeedCharacter(item: ResultViewModel) {
  if (item.characters.length === 0) return undefined;
  const hash = [...item.resultId].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0);
  return item.characters[hash % item.characters.length];
}

export function ExplorePage() {
  const [items, setItems] = useState<ResultViewModel[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(next?: string) {
    setLoading(true);
    try {
      const response = await fetchFeed(next);
      setItems((current) => next ? [...current, ...response.items] : response.items);
      setCursor(response.nextCursor);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "피드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="explore-page">
      <div className="page-intro">
        <p className="eyebrow">EXPLORE 60 ARCHETYPES</p>
        <h1>다른 사람들은<br />어떤 캐릭터일까?</h1>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && items.length === 0 ? (
        <div className="empty-state"><span>日</span><h2>아직 첫 번째 결과를 기다리고 있어요.</h2><Link className="button primary" to="/">첫 결과 만들기</Link></div>
      ) : (
        <div className="feed-grid">
          {items.map((item) => {
            const character = pickFeedCharacter(item);
            return (
              <Link className={`feed-card element-${item.element}`} key={item.resultId} to={`/result/${item.resultId}`}>
                <div className="feed-user"><span>{item.user.displayNickname}</span><span>{item.user.displayBirthDate}</span></div>
                <div className="feed-main">
                  <div className="feed-copy">
                    <strong className="feed-ganji">{item.ganji}</strong>
                    <h2>{item.ganjiKr}일주</h2>
                    <p>{item.archetype.name}</p>
                  </div>
                  {character?.imageKey && (
                    <figure className="feed-character-image">
                      <span aria-hidden="true">{FEED_SYMBOLS[character.theme]}</span>
                      <img
                        alt={`${character.characterName} 캐릭터`}
                        loading="lazy"
                        onError={(event) => event.currentTarget.closest("figure")?.classList.add("image-unavailable")}
                        src={character.imageKey}
                      />
                      <figcaption>{character.characterName}</figcaption>
                    </figure>
                  )}
                </div>
                <div className="feed-animal"><span>대표 동물</span><strong>{item.archetype.animal}</strong></div>
              </Link>
            );
          })}
        </div>
      )}
      {cursor && <button className="button secondary load-more" disabled={loading} onClick={() => void load(cursor)}>{loading ? "불러오는 중…" : "더 보기"}</button>}
    </div>
  );
}

