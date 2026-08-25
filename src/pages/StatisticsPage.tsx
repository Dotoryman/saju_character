import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { fetchStatistics } from "../lib/api";
import type { StatisticsViewModel } from "../shared/statistics";

const NUMBER = new Intl.NumberFormat("ko-KR");

export function StatisticsPage() {
  const [statistics, setStatistics] = useState<StatisticsViewModel | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchStatistics().then(setStatistics).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "통계를 불러오지 못했습니다.");
    });
  }, []);

  const topPillars = useMemo(
    () => statistics?.pillars.filter((pillar) => pillar.count > 0).sort((a, b) => a.rank - b.rank).slice(0, 5) ?? [],
    [statistics],
  );

  if (error) return <div className="state-page"><h1>{error}</h1><Link className="button primary" to="/">메인으로 가기</Link></div>;
  if (!statistics) return <div className="state-page"><div className="loading-mark">統</div><p>통계를 정리하고 있습니다.</p></div>;

  const maxDaily = Math.max(1, ...statistics.daily.map((point) => point.count));
  const maxPillar = Math.max(1, ...statistics.pillars.map((pillar) => pillar.count));

  return (
    <div className="statistics-page">
      <div className="statistics-intro">
        <p className="eyebrow">SAJUSAJU ARCHIVE</p>
        <h1>사주사주<br />통계관</h1>
        <p>개인정보는 제외하고, 지금까지 만들어진 결과의 흐름만 모았습니다.</p>
      </div>

      <section className="statistics-summary" aria-label="주요 통계">
        <SummaryCard label="전체 결과" value={statistics.summary.totalResults} unit="개" />
        <SummaryCard label="오늘 생성" value={statistics.summary.todayResults} unit="개" />
        <SummaryCard label="오늘 방문" value={statistics.summary.todayVisitors} unit="명" />
        <SummaryCard label="등장한 일주" value={statistics.summary.representedPillars} unit="/ 60" />
      </section>

      <section className="statistics-panel trend-panel" aria-labelledby="trend-title">
        <PanelHeading eyebrow="LAST 30 DAYS" title="최근 결과 생성 흐름" description="최근 30일 동안 하루에 만들어진 결과 수입니다." id="trend-title" />
        <div className="daily-chart" role="img" aria-label="최근 30일 결과 생성 막대 그래프">
          {statistics.daily.map((point, index) => (
            <div className="daily-column" key={point.date} title={`${formatDate(point.date)} · ${point.count}개`}>
              <span className="daily-count">{point.count || ""}</span>
              <i style={{ "--bar-height": `${Math.max(point.count ? 8 : 2, (point.count / maxDaily) * 100)}%` } as CSSProperties} />
              <small>{index % 5 === 0 || index === statistics.daily.length - 1 ? formatDate(point.date) : ""}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="statistics-panel" aria-labelledby="element-title">
        <PanelHeading eyebrow="FIVE ELEMENTS" title="오행 분포" description="일간을 기준으로 목·화·토·금·수의 비율을 계산했습니다." id="element-title" />
        <div className="element-stat-grid">
          {statistics.elements.map((element) => (
            <article className={`element-stat element-${element.element}`} key={element.element}>
              <div><span>{element.label}</span><strong>{element.percentage}%</strong></div>
              <p>{NUMBER.format(element.count)}개 결과</p>
              <i><b style={{ width: `${element.percentage}%` }} /></i>
            </article>
          ))}
        </div>
      </section>

      <div className="statistics-split">
        <section className="statistics-panel ranking-panel" aria-labelledby="pillar-ranking-title">
          <PanelHeading eyebrow="TOP PILLARS" title="많이 나온 일주" id="pillar-ranking-title" />
          <ol className="statistics-ranking">
            {topPillars.length ? topPillars.map((pillar) => (
              <li className={`element-${pillar.element}`} key={pillar.cycleIndex}>
                <span>{pillar.rank.toString().padStart(2, "0")}</span>
                <div><strong>{pillar.ganjiKr}일주</strong><small>{pillar.animal}</small></div>
                <b>{NUMBER.format(pillar.count)}</b>
              </li>
            )) : <li className="ranking-empty">첫 번째 결과를 기다리고 있어요.</li>}
          </ol>
        </section>

        <section className="statistics-panel ranking-panel" aria-labelledby="animal-ranking-title">
          <PanelHeading eyebrow="ANIMAL INDEX" title="대표 동물 순위" id="animal-ranking-title" />
          <ol className="animal-ranking">
            {statistics.animals.filter((animal) => animal.count > 0).slice(0, 5).map((animal, index) => (
              <li key={animal.animal}>
                <img alt="" loading="lazy" src={animal.imageKey} />
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{animal.animal}</strong><small>{animal.percentage}%</small></div>
                <b>{NUMBER.format(animal.count)}</b>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="statistics-panel" aria-labelledby="character-title">
        <PanelHeading eyebrow="CHARACTER ENCOUNTERS" title="많이 등장한 캐릭터" description="인기 투표가 아니라 결과에 등장한 횟수를 기준으로 합니다." id="character-title" />
        <div className="character-stat-grid">
          {statistics.characters.slice(0, 8).map((character, index) => (
            <article key={`${character.theme}-${character.characterName}`}>
              <figure>{character.imageKey && <img alt={`${character.characterName} 캐릭터`} loading="lazy" src={character.imageKey} />}</figure>
              <span>{String(index + 1).padStart(2, "0")} · {character.themeName}</span>
              <strong>{character.characterName}</strong>
              <small>{NUMBER.format(character.count)}회 등장</small>
            </article>
          ))}
        </div>
      </section>

      <section className="statistics-panel pillar-map-panel" aria-labelledby="pillar-map-title">
        <PanelHeading eyebrow="ALL 60 PILLARS" title="60일주 분포" description="색은 오행을, 농도는 등장 횟수를 나타냅니다." id="pillar-map-title" />
        <div className="pillar-map">
          {statistics.pillars.map((pillar) => (
            <article
              className={`element-${pillar.element}`}
              key={pillar.cycleIndex}
              style={{ "--pillar-strength": `${Math.max(2, (pillar.count / maxPillar) * 34)}%` } as CSSProperties}
              title={`${pillar.ganjiKr}일주 · ${pillar.count}개 · ${pillar.rank}위`}
            >
              <span>{pillar.ganji}</span><strong>{pillar.ganjiKr}</strong><small>{pillar.count}</small>
            </article>
          ))}
        </div>
      </section>

      <p className="statistics-note">통계는 약 5분 간격으로 갱신되며 닉네임과 생년월일은 집계에 포함하지 않습니다.</p>
    </div>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <article><span>{label}</span><strong>{NUMBER.format(value)}</strong><small>{unit}</small></article>;
}

function PanelHeading({ eyebrow, title, description, id }: { eyebrow: string; title: string; description?: string; id: string }) {
  return <div className="statistics-panel-heading"><p className="eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>;
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}
