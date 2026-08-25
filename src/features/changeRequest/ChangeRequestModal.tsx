import { useEffect, useState, type FormEvent } from "react";
import { submitCharacterChangeRequest } from "../../lib/api";

interface ChangeRequestModalProps {
  defaultResultUrl?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeRequestModal({
  defaultResultUrl = "",
  description = "바꾸고 싶은 결과 주소와 원하는 내용을 알려주세요.",
  isOpen,
  onClose,
}: ChangeRequestModalProps) {
  const [resultUrl, setResultUrl] = useState(defaultResultUrl);
  const [requestText, setRequestText] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setResultUrl(defaultResultUrl);
    setStatus("");
  }, [defaultResultUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      await submitCharacterChangeRequest({ resultUrl, requestText });
      setStatus("수정 요청을 받았습니다. 확인 후 반영할게요.");
      setRequestText("");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "수정 요청을 보내지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (!submitting) onClose();
  }

  return (
    <div className="request-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeModal();
    }}>
      <section aria-labelledby="request-modal-title" aria-modal="true" className="request-modal" role="dialog">
        <button aria-label="닫기" className="request-modal-close" disabled={submitting} type="button" onClick={closeModal}>×</button>
        <p className="eyebrow">CHARACTER CHANGE</p>
        <h2 id="request-modal-title">수정 요청하기</h2>
        <p className="request-modal-description">{description}</p>
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
  );
}
