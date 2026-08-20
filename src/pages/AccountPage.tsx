import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { changePassword, fetchSavedResults } from "../lib/api";
import type { ResultViewModel } from "../shared/result";

export function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [results, setResults] = useState<ResultViewModel[]>([]);
  const [error, setError] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  useEffect(() => {
    if (user) void fetchSavedResults().then(setResults).catch((caught) => setError(caught instanceof Error ? caught.message : "결과를 불러오지 못했습니다."));
  }, [user]);

  if (loading) return <div className="state-page">계정을 확인하는 중…</div>;
  if (!user) return <Navigate replace to="/" />;

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (newPassword !== confirm) { setPasswordStatus("새 비밀번호가 일치하지 않습니다."); return; }
    try { await changePassword({ currentPassword, newPassword }); await signOut().catch(() => undefined); window.location.href = "/"; }
    catch (caught) { setPasswordStatus(caught instanceof Error ? caught.message : "비밀번호를 바꾸지 못했습니다."); }
  }

  return (
    <article className="account-page dashboard-page">
      <header className="dashboard-heading"><p className="eyebrow">MY SAJUSAJU</p><h1>{user.nickname}님의 사주</h1><p>로그인한 상태에서 새 결과를 찾으면 이곳에 자동으로 저장됩니다.</p></header>
      <div className="account-actions">
        {user.role === "admin" && <Link className="button primary" to="/admin">관리자 페이지</Link>}
        <button className="button secondary" type="button" onClick={() => void signOut()}>로그아웃</button>
      </div>
      {user.forcePasswordChange && <section className="password-change-card"><h2>새 비밀번호를 설정해 주세요</h2><p>초기 비밀번호는 한 번만 사용하고 새 비밀번호로 변경해야 합니다.</p><form onSubmit={(event) => void handlePasswordChange(event)}><input autoComplete="current-password" name="currentPassword" placeholder="현재 비밀번호" required type="password" /><input autoComplete="new-password" minLength={8} name="newPassword" placeholder="새 비밀번호" required type="password" /><input autoComplete="new-password" minLength={8} name="confirm" placeholder="새 비밀번호 확인" required type="password" /><button className="button primary" type="submit">비밀번호 변경</button><p>{passwordStatus}</p></form></section>}
      {error && <p className="form-error">{error}</p>}
      <section className="saved-result-grid">
        {results.map((result) => <Link className={`saved-result-card element-${result.element}`} key={result.resultId} to={`/result/${result.resultId}`}><span>{result.ganji}</span><div><strong>{result.ganjiKr}일주</strong><small>{result.archetype.animal} · {result.user.displayNickname}</small></div></Link>)}
        {!results.length && !error && <div className="empty-state"><h2>저장된 사주가 아직 없어요.</h2><Link className="button primary" to="/">내 캐릭터 찾기</Link></div>}
      </section>
    </article>
  );
}
