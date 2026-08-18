import { useState } from "react";
import { Link } from "react-router-dom";
import { createShareImage, shareImageFileName } from "../features/share/createShareImage";
import { downloadImage } from "../features/share/downloadImage";
import { canUseKakaoShare, shareWithKakao } from "../features/share/kakaoShare";
import { nativeShareImage } from "../features/share/nativeShare";
import { trackShare } from "../lib/api";
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
  const [shareStatus, setShareStatus] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  async function makeShareFile(): Promise<{ blob: Blob; file: File }> {
    const blob = await createShareImage(result);
    const file = new File([blob], shareImageFileName(result), { type: "image/png" });
    return { blob, file };
  }

  async function recordShare() {
    await trackShare(result.resultId).catch(() => undefined);
  }

  async function saveImage() {
    setIsSharing(true);
    setShareStatus("공유 이미지를 만드는 중…");
    try {
      const { blob } = await makeShareFile();
      downloadImage(blob, shareImageFileName(result));
      await recordShare();
      setShareStatus("1080×1350 PNG 이미지를 저장했습니다.");
    } catch (caught) {
      setShareStatus(caught instanceof Error ? caught.message : "이미지를 만들지 못했습니다.");
    } finally {
      setIsSharing(false);
    }
  }

  async function shareResult() {
    setIsSharing(true);
    setShareStatus("공유 이미지를 만드는 중…");
    try {
      const { blob, file } = await makeShareFile();
      const text = `나는 ${result.ganjiKr}일주, 대표 동물은 ${result.archetype.animal}입니다.`;
      const shared = await nativeShareImage(file, window.location.href, text);
      if (!shared) {
        downloadImage(blob, file.name);
        setShareStatus("공유 기능이 지원되지 않아 PNG를 저장했습니다.");
      } else {
        setShareStatus("공유 화면을 열었습니다.");
      }
      await recordShare();
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") setShareStatus("");
      else setShareStatus(caught instanceof Error ? caught.message : "공유하지 못했습니다.");
    } finally {
      setIsSharing(false);
    }
  }

  async function shareKakao() {
    const shared = canUseKakaoShare() && shareWithKakao({
      title: `${result.ganjiKr}일주 · ${result.archetype.animal}`,
      description: result.archetype.description,
      url: window.location.href,
    });
    if (shared) {
      await recordShare();
      setShareStatus("카카오톡 공유 화면을 열었습니다.");
      return;
    }
    setShareStatus("카카오 앱 키 연결 전이라 기기의 공유 기능을 사용합니다.");
    await shareResult();
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

      <section className="result-share-section" aria-labelledby="share-title">
        <p className="eyebrow">KEEP &amp; SHARE</p>
        <h2 id="share-title">이제 결과를 간직해보세요.</h2>
        <p>캐릭터까지 모두 확인했다면 세로형 결과 이미지로 저장하거나 친구에게 공유할 수 있어요.</p>
        <div className="result-actions">
          <button className="button primary" disabled={isSharing} type="button" onClick={() => void shareResult()}>공유하기</button>
          <button className="button secondary" disabled={isSharing} type="button" onClick={() => void saveImage()}>이미지 저장</button>
          <button className="button secondary" disabled={isSharing} type="button" onClick={() => void shareKakao()}>카카오톡</button>
          <Link className="button secondary" to="/">다시 찾아보기</Link>
        </div>
        <p className="share-help">Instagram은 이미지를 저장한 뒤 앱에서 선택해 주세요.</p>
        <p className="share-status" aria-live="polite">{shareStatus}</p>
      </section>
    </div>
  );
}
