import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createResult, trackTodayVisitor } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => { void trackTodayVisitor().then(setVisitorCount).catch(() => undefined); }, []);
  useEffect(() => { if (user && !nickname) setNickname(user.nickname); }, [user, nickname]);

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
        <p className="eyebrow">SAJUSAJU · 60 DAY PILLARS</p>
        <h1>생일로 발견하는<br /><em>나의 캐릭터</em></h1>
        <p className="hero-lede">나의 일주가 가진 분위기를 대표 동물과 네 작품 속 캐릭터로 만나보세요.</p>

        <form className="discovery-form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="form-heading">
            <strong>생년월일을 알려주세요</strong><small>양력 기준 · 출생시간 불필요</small>
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
              <legend><span>생년월일</span></legend>
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
            {!isLoading && <span aria-hidden="true" className="submit-arrow">→</span>}
          </button>
        </form>
        <p className="privacy-note">
          입력한 정보는 결과 생성에만 사용하며,
          <br />
          암호화 처리되어 공개화면에서는 안전하게 가려집니다.
        </p>
        {visitorCount !== null && <p className="visitor-count">오늘 <strong>{visitorCount.toLocaleString("ko-KR")}</strong>명이 캐릭터를 찾으러 왔어요.</p>}
      </section>

      <section className="how-it-works" aria-label="이용 방법">
        <article><span>01</span><strong>생일 입력</strong><p>5초면 충분해요.</p></article>
        <article><span>02</span><strong>일주 발견</strong><p>60가지 원형 중 하나.</p></article>
        <article><span>03</span><strong>캐릭터 공유</strong><p>친구의 결과도 확인해요.</p></article>
      </section>
    </div>
  );
}
