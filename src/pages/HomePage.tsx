import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createResult } from "../lib/api";

export function HomePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedNickname = String(formData.get("nickname") ?? "");
    const year = String(formData.get("birthYear") ?? "");
    const month = String(formData.get("birthMonth") ?? "");
    const day = String(formData.get("birthDay") ?? "");
    const submittedBirthDate = year && month && day ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "";
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const dayCount = birthYear && birthMonth
    ? new Date(Number(birthYear), Number(birthMonth), 0).getDate()
    : 31;
  const days = Array.from({ length: dayCount }, (_, index) => index + 1);

  function changeYear(value: string) {
    setBirthYear(value);
    if (birthDay && birthMonth) {
      const nextDayCount = new Date(Number(value), Number(birthMonth), 0).getDate();
      if (Number(birthDay) > nextDayCount) setBirthDay(String(nextDayCount));
    }
  }

  function changeMonth(value: string) {
    setBirthMonth(value);
    if (birthDay && birthYear) {
      const nextDayCount = new Date(Number(birthYear), Number(value), 0).getDate();
      if (Number(birthDay) > nextDayCount) setBirthDay(String(nextDayCount));
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
          <div className="form-heading">
            <span className="form-step">01</span>
            <div><strong>나의 기본 정보</strong><small>두 가지만 알려주세요</small></div>
          </div>
          <div className="form-fields">
            <label className="nickname-field">
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
            <fieldset className="birth-fieldset">
              <legend><span>생년월일</span><small>양력 기준</small></legend>
              <label className="select-field">
                <span>연도</span>
                <select name="birthYear" onChange={(event) => changeYear(event.target.value)} required value={birthYear}>
                  <option value="">YYYY</option>
                  {years.map((year) => <option key={year} value={year}>{year}년</option>)}
                </select>
              </label>
              <label className="select-field">
                <span>월</span>
                <select name="birthMonth" onChange={(event) => changeMonth(event.target.value)} required value={birthMonth}>
                  <option value="">MM</option>
                  {months.map((month) => <option key={month} value={month}>{month}월</option>)}
                </select>
              </label>
              <label className="select-field">
                <span>일</span>
                <select name="birthDay" onChange={(event) => setBirthDay(event.target.value)} required value={birthDay}>
                  <option value="">DD</option>
                  {days.map((day) => <option key={day} value={day}>{day}일</option>)}
                </select>
              </label>
            </fieldset>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary submit-button" disabled={isLoading} type="submit">
            <span>{isLoading ? "캐릭터를 찾는 중…" : "내 캐릭터 찾기"}</span>
            {!isLoading && <span aria-hidden="true">→</span>}
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
