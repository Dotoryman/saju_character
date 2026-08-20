import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResultView } from "../components/ResultView";
import { fetchResult } from "../lib/api";
import type { ResultViewModel } from "../shared/result";

export function ResultPage() {
  const { publicId = "" } = useParams();
  const location = useLocation();
  const initial = location.state as ResultViewModel | null;
  const [result, setResult] = useState<ResultViewModel | null>(initial);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [publicId]);

  useEffect(() => {
    if (result?.resultId === publicId) return;
    void fetchResult(publicId).then(setResult).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "결과를 불러오지 못했습니다.");
    });
  }, [publicId, result?.resultId]);

  if (error) return <div className="state-page"><h1>{error}</h1><Link className="button primary" to="/">내 결과 만들기</Link></div>;
  if (!result) return <div className="state-page"><div className="loading-mark">日</div><p>결과를 불러오는 중입니다.</p></div>;
  return <ResultView result={result} />;
}

