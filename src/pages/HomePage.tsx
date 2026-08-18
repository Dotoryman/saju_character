import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createResult } from "../lib/api";

export function HomePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedNickname = String(formData.get("nickname") ?? "");
    const submittedBirthDate = String(formData.get("birthDate") ?? "");
    setError("");
    setIsLoading(true);
    try {
      const result = await createResult({ nickname: submittedNickname, birthDate: submittedBirthDate });
      navigate(`/result/${result.resultId}`, { state: result });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-orbit orbit-one">甲</div>
        <div className="hero-orbit orbit-two">子</div>
        <p className="eyebrow">60 ARCHETYPES · 4 WORLDS</p>
        <h1>나는 어떤<br /><em>캐릭터일까?</em></h1>
        <p className="hero-lede">생년월일 하나로 찾아보는 나의 일주와 대표 동물, 그리고 네 세계의 닮은 캐릭터.</p>

        <form className="discovery-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            <span>닉네임</span>
            <input
              autoComplete="nickname"
              maxLength={20}
              name="nickname"
              onChange={(event) => setNickname(event.target.value)}
              placeholder="어떻게 불러드릴까요?"
              required
              value={nickname}
            />
          </label>
          <label>
            <span>생년월일 · 양력</span>
            <input
              max="2026-08-18"
              min="1900-01-01"
              name="birthDate"
              onChange={(event) => setBirthDate(event.target.value)}
              required
              type="date"
              value={birthDate}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary submit-button" disabled={isLoading} type="submit">
            {isLoading ? "캐릭터를 찾는 중…" : "내 캐릭터 찾기"}
          </button>
        </form>
        <p className="privacy-note">성별과 출생시간은 필요하지 않아요. 공개 결과에는 생일 전체가 표시되지 않습니다.</p>
      </section>

      <section className="how-it-works" aria-label="이용 방법">
        <article><span>01</span><strong>생일 입력</strong><p>5초면 충분해요.</p></article>
        <article><span>02</span><strong>일주 발견</strong><p>60가지 원형 중 하나.</p></article>
        <article><span>03</span><strong>캐릭터 공유</strong><p>친구의 결과도 확인해요.</p></article>
      </section>
    </div>
  );
}
