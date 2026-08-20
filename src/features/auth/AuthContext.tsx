import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { fetchSession, login, logout, signup, type SessionUser } from "../../lib/api";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  openAuth: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider가 필요합니다.");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchSession().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "");
    const password = String(data.get("password") ?? "");
    setSubmitting(true);
    setError("");
    try {
      const nextUser = mode === "signup"
        ? await signup({ username, password, nickname: String(data.get("nickname") ?? "") })
        : await login({ username, password });
      setUser(nextUser);
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "요청을 처리하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    await logout();
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(() => ({ user, loading, openAuth: () => { setMode("login"); setError(""); setOpen(true); }, signOut }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {open && (
        <div className="request-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section aria-labelledby="auth-modal-title" aria-modal="true" className="request-modal auth-modal" role="dialog">
            <button aria-label="닫기" className="request-modal-close" disabled={submitting} type="button" onClick={() => setOpen(false)}>×</button>
            <p className="eyebrow">SAJUSAJU ACCOUNT</p>
            <h2 id="auth-modal-title">{mode === "login" ? "로그인" : "회원가입"}</h2>
            <p className="request-modal-description">로그인하면 찾은 사주 결과가 내 계정에 저장됩니다.</p>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label><span>아이디</span><input autoComplete="username" maxLength={20} minLength={4} name="username" pattern="[A-Za-z0-9_]+" required /></label>
              {mode === "signup" && <label><span>닉네임</span><input autoComplete="nickname" maxLength={20} name="nickname" required /></label>}
              <label><span>비밀번호</span><input autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={72} minLength={mode === "login" ? 5 : 8} name="password" required type="password" /></label>
              {mode === "signup" && <label><span>비밀번호 확인</span><input autoComplete="new-password" maxLength={72} minLength={8} name="passwordConfirm" required type="password" onInput={(event) => { const passwordInput = event.currentTarget.form?.elements.namedItem("password"); const passwordValue = passwordInput instanceof HTMLInputElement ? passwordInput.value : ""; event.currentTarget.setCustomValidity(event.currentTarget.value === passwordValue ? "" : "비밀번호가 일치하지 않습니다."); }} /></label>}
              <button className="button primary" disabled={submitting} type="submit">{submitting ? "처리 중…" : mode === "login" ? "로그인" : "가입하고 시작하기"}</button>
              <button className="auth-switch" disabled={submitting} type="button" onClick={() => { setError(""); setMode(mode === "login" ? "signup" : "login"); }}>{mode === "login" ? "처음이신가요? 회원가입" : "이미 계정이 있나요? 로그인"}</button>
              <p className="request-modal-status" role="alert">{error}</p>
            </form>
          </section>
        </div>
      )}
    </AuthContext.Provider>
  );
}
