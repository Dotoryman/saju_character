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
        <span>버젼 : v{packageInfo.version}</span>
        <span>만든이 : 남도령</span>
      </footer>
    </div>
  );
}

