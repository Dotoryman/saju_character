import { useEffect, useState, type FormEvent } from "react";
import { submitCharacterChangeRequest } from "../lib/api";
import packageInfo from "../../package.json";

export function AboutPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [requestText, setRequestText] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, submitting]);

  function openModal() {
    setStatus("");
    setIsOpen(true);
  }

  function closeModal() {
    if (!submitting) setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      await submitCharacterChangeRequest({ resultUrl, requestText });
      setStatus("수정 요청을 받았습니다. 확인 후 반영할게요.");
      setResultUrl("");
      setRequestText("");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "수정 요청을 보내지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="about-page">
      <header className="about-intro">
        <p className="eyebrow">ABOUT SAJUSAJU</p>
        <dl className="about-meta">
          <div><dt>만든이</dt><dd>남도령</dd></div>
          <div><dt>현재 버전</dt><dd>v{packageInfo.version}</dd></div>
        </dl>
      </header>

      <section className="request-card">
        <p className="eyebrow">COMMENT</p>
        <h1>본인 캐릭터가<br />마음에 안드시면 말씀해주세요.<br /><em>바꿔드릴게요.</em></h1>
        <button className="button primary" type="button" onClick={openModal}>수정 요청하기</button>
      </section>

      <section className="rights-notice" aria-labelledby="rights-title">
        <p className="eyebrow">RIGHTS &amp; NOTICE</p>
        <h2 id="rights-title">비공식 팬 콘텐츠 안내</h2>
        <p>SAJUSAJU는 각 작품의 제작사·배급사·권리자와 제휴하거나 공식 승인을 받은 서비스가 아닙니다. 작품명과 캐릭터명 및 관련 이미지는 각 권리자에게 권리가 있으며, 본 서비스에서는 캐릭터를 식별하고 비평적·문화적 맥락의 결과를 전달하기 위해 사용합니다.</p>
        <p>권리 침해 우려가 있거나 이미지·표기 수정을 원하시는 권리자는 수정 요청을 보내주세요. 확인 후 신속히 검토하겠습니다.</p>
      </section>

      {isOpen && (
        <div className="request-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <section aria-labelledby="request-modal-title" aria-modal="true" className="request-modal" role="dialog">
            <button aria-label="닫기" className="request-modal-close" disabled={submitting} type="button" onClick={closeModal}>×</button>
            <p className="eyebrow">CHARACTER CHANGE</p>
            <h2 id="request-modal-title">수정 요청하기</h2>
            <p className="request-modal-description">바꾸고 싶은 결과 주소와 원하는 내용을 알려주세요.</p>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label>
                <span>결과 주소 <small>선택</small></span>
                <input
                  inputMode="url"
                  maxLength={500}
                  placeholder="https://sajusaju.cloud/result/..."
                  type="url"
                  value={resultUrl}
                  onChange={(event) => setResultUrl(event.target.value)}
                />
              </label>
              <label>
                <span>수정 요청 내용</span>
                <textarea
                  autoFocus
                  maxLength={1000}
                  placeholder="어떤 캐릭터로 바꾸고 싶은지 자세히 적어주세요."
                  required
                  rows={6}
                  value={requestText}
                  onChange={(event) => setRequestText(event.target.value)}
                />
              </label>
              <div className="request-modal-actions">
                <button className="button secondary" disabled={submitting} type="button" onClick={closeModal}>취소</button>
                <button className="button primary" disabled={submitting} type="submit">{submitting ? "보내는 중…" : "요청 보내기"}</button>
              </div>
              <p className="request-modal-status" aria-live="polite">{status}</p>
            </form>
          </section>
        </div>
      )}
    </article>
  );
}

