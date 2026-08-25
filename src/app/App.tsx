import { Link, NavLink, Route, Routes } from "react-router-dom";
import { AboutPage } from "../pages/AboutPage";
import { ExplorePage } from "../pages/ExplorePage";
import { HomePage } from "../pages/HomePage";
import { ResultPage } from "../pages/ResultPage";
import { StatisticsPage } from "../pages/StatisticsPage";
import { AccountPage } from "../pages/AccountPage";
import { AdminPage } from "../pages/AdminPage";
import { useAuth } from "../features/auth/AuthContext";
import packageInfo from "../../package.json";

export function App() {
  const { user, loading, openAuth } = useAuth();
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="메인으로 가기">
          <strong>SAJUSAJU</strong>
          <span>메인으로 가기</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <NavLink to="/explore">다른 사주 둘러보기</NavLink>
          <NavLink to="/statistics">통계</NavLink>
          {!loading && (user ? <NavLink to="/account">{user.nickname}</NavLink> : <button className="header-login" type="button" onClick={openAuth}>로그인</button>)}
          <NavLink to="/about">소개</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:publicId" element={<ResultPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <span>버전 : {packageInfo.version} · 만든이 : 남도령</span>
      </footer>
    </div>
  );
}

