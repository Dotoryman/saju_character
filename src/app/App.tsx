import { Link, NavLink, Route, Routes } from "react-router-dom";
import { AboutPage } from "../pages/AboutPage";
import { ExplorePage } from "../pages/ExplorePage";
import { HomePage } from "../pages/HomePage";
import { ResultPage } from "../pages/ResultPage";

export function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="일주 캐릭터 찾기 홈">
          <span className="brand-mark">日</span>
          <span>사주사주</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <NavLink to="/explore">둘러보기</NavLink>
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
        <span>sajusaju.cloud</span>
        <span>운세가 아닌, 당신의 일주가 가진 이미지를 찾습니다.</span>
      </footer>
    </div>
  );
}

