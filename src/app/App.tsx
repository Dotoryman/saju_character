import { Link, NavLink, Route, Routes } from "react-router-dom";
import { AboutPage } from "../pages/AboutPage";
import { ExplorePage } from "../pages/ExplorePage";
import { HomePage } from "../pages/HomePage";
import { ResultPage } from "../pages/ResultPage";
import packageInfo from "../../package.json";

export function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="메인으로 가기">
          <strong>SAJUSAJU</strong>
          <span>메인으로 가기</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <NavLink to="/explore">다른 사주 둘러보기</NavLink>
          <NavLink to="/about">소개</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:publicId" element={<ResultPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <strong>SAJUSAJU</strong>
          <span>생일로 발견하는 나의 캐릭터</span>
        </div>
        <div className="footer-meta">
          <Link to="/about">서비스 소개 · 권리 안내</Link>
          <span>비공식 팬 콘텐츠 · 버전 v{packageInfo.version} · 만든이 남도령</span>
        </div>
      </footer>
    </div>
  );
}

