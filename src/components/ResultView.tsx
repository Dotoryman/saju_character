import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createShareImage, shareImageFileName } from "../features/share/createShareImage";
import { downloadImage } from "../features/share/downloadImage";
import { canUseKakaoShare, shareWithKakao } from "../features/share/kakaoShare";
import { canShareImageFiles, nativeSaveImage, nativeShareImage, nativeShareLink } from "../features/share/nativeShare";
import { ChangeRequestModal } from "../features/changeRequest/ChangeRequestModal";
import { fetchStatistics, trackShare } from "../lib/api";
import type { ResultViewModel } from "../shared/result";
import type { StatisticsPillarRow } from "../shared/statistics";
import { CharacterCard } from "./CharacterCard";

export function ResultView({ result }: { result: ResultViewModel }) {
  const [shareStatus, setShareStatus] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [animalImageFailed, setAnimalImageFailed] = useState(false);
  const [pillarStatistic, setPillarStatistic] = useState<StatisticsPillarRow | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const prefersNativeSave = typeof navigator !== "undefined" && (
    navigator.maxTouchPoints > 0 || /Android|iPhone|iPad/i.test(navigator.userAgent)
  );

  useEffect(() => {
    void fetchStatistics().then((statistics) => {
      setPillarStatistic(statistics.pillars.find((pillar) => pillar.cycleIndex === result.cycleIndex) ?? null);
    }).catch(() => setPillarStatistic(null));
  }, [result.cycleIndex]);

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
      const { blob, file } = await makeShareFile();
      const openedSaveSheet = prefersNativeSave && await nativeSaveImage(file);
      if (!openedSaveSheet) downloadImage(blob, file.name);
      await recordShare();
      setShareStatus(openedSaveSheet
        ? "공유 화면에서 ‘사진에 저장’ 또는 ‘이미지 저장’을 선택해 주세요."
        : "1080×1350 PNG 이미지를 저장했습니다.");
    } catch (caught) {
      setShareStatus(caught instanceof Error ? caught.message : "이미지를 만들지 못했습니다.");
    } finally {
      setIsSharing(false);
    }
  }

  async function shareResult() {
    setIsSharing(true);
    setShareStatus("공유 화면을 준비하는 중…");
    try {
      const text = `나는 ${result.ganjiKr}일주, 대표 동물은 ${result.archetype.animal}입니다.`;
      const shared = canShareImageFiles()
        ? await makeShareFile().then(({ file }) => nativeShareImage(file, window.location.href, text))
        : await nativeShareLink(window.location.href, text);
      if (shared === "unsupported") {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setShareStatus("공유 기능을 사용할 수 없어 결과 링크를 복사했습니다.");
        } catch {
          setShareStatus("이 브라우저에서는 공유할 수 없습니다. 주소창의 링크를 복사해 주세요.");
        }
      } else if (shared === "link") {
        setShareStatus("이미지 공유를 지원하지 않는 브라우저라 결과 링크로 공유합니다.");
      } else setShareStatus("결과 이미지 공유 화면을 열었습니다.");
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
      description: `${result.archetype.name}\n${result.archetype.description.trim()}`,
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
      <section className="result-hero" aria-labelledby="result-title">
        <div className="result-hero-inner">
          <div className="result-hero-copy">
            <p className="eyebrow">YOUR DAY PILLAR</p>
            <p className="result-owner">{result.user.displayNickname} 님의 일주</p>
            <h1 id="result-title"><span>{result.ganji}</span>{result.ganjiKr}일주</h1>
            <p className="archetype-description">{result.archetype.description}</p>
          </div>
          <figure className={`animal-portrait${animalImageFailed ? " image-unavailable" : ""}`}>
            {!animalImageFailed && <img
              alt={`대표 동물 ${result.archetype.animal}`}
              onError={() => setAnimalImageFailed(true)}
              src={result.archetype.imageKey}
            />}
            <figcaption><span>대표 동물</span><strong>{result.archetype.animal}</strong></figcaption>
          </figure>
        </div>
      </section>

      {pillarStatistic && (
        <aside className="result-statistic" aria-label="내 일주 통계">
          <div>
            <p className="eyebrow">MY PLACE IN SAJUSAJU</p>
            <strong>지금까지 {result.ganjiKr}일주는 <em>{pillarStatistic.rank}번째</em>로 많이 나왔어요.</strong>
            <span>전체 결과의 {pillarStatistic.percentage}% · 같은 일주 {pillarStatistic.count}개</span>
          </div>
          <Link to="/statistics">전체 통계 보기 <span aria-hidden="true">→</span></Link>
        </aside>
      )}

      <section className="character-section" id="characters" aria-labelledby="character-title">
        <div className="section-heading">
          <p className="eyebrow">FOUR WORLDS, ONE YOU</p>
          <h2 id="character-title">닮은 캐릭터 네 명</h2>
          <p>각 작품에서 나의 일주와 닮은 성향을 가진 캐릭터를 한 번에 확인해 보세요.</p>
        </div>
        <div className="character-grid">
          {result.characters.map((character, index) => (
            <CharacterCard key={character.theme} character={character} index={index} />
          ))}
        </div>
      </section>

      <section className="result-change-request" aria-labelledby="result-change-request-title">
        <div>
          <p className="eyebrow">CHARACTER FEEDBACK</p>
          <h2 id="result-change-request-title">캐릭터가 마음에 들지 않나요?</h2>
          <p>기죽지 마시고 당당하게 요청하세요.</p>
        </div>
        <button className="button secondary" type="button" onClick={() => setIsRequestOpen(true)}>수정 요청하기</button>
      </section>

      <section className="result-share-section" aria-labelledby="share-title">
        <p className="eyebrow">KEEP &amp; SHARE</p>
        <h2 id="share-title">이제 결과를 간직해보세요.</h2>
        <p>캐릭터까지 모두 확인했다면 세로형 결과 이미지로 저장하거나 친구에게 공유할 수 있어요.</p>
        <div className="result-actions">
          <button className="button primary" disabled={isSharing} type="button" onClick={() => void shareResult()}>공유하기</button>
          <button className="button secondary" disabled={isSharing} type="button" onClick={() => void saveImage()}>{prefersNativeSave ? "앨범에 저장" : "이미지 저장"}</button>
          <button className="button secondary" disabled={isSharing} type="button" onClick={() => void shareKakao()}>카카오톡</button>
          <Link className="button secondary" to="/">다시 찾아보기</Link>
        </div>
        <p className="share-help">Instagram은 이미지를 저장한 뒤 앱에서 선택해 주세요.</p>
        <p className="share-status" aria-live="polite">{shareStatus}</p>
      </section>

      <ChangeRequestModal
        defaultResultUrl={typeof window === "undefined" ? "" : window.location.href}
        description={`${result.ganjiKr}일주 결과 주소는 자동으로 입력했습니다. 바꾸고 싶은 캐릭터나 이미지를 알려주세요.`}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </div>
  );
}
