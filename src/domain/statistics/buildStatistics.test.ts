import { describe, expect, it } from "vitest";
import { buildStatistics } from "./buildStatistics";

describe("buildStatistics", () => {
  it("builds ranked, element and daily rollups without reading raw results", () => {
    const statistics = buildStatistics({
      pillarCounts: [
        { cycle_index: 0, result_count: 3 },
        { cycle_index: 2, result_count: 1 },
      ],
      dailyCounts: [
        { stat_date: "2026-08-24", result_count: 2 },
        { stat_date: "2026-08-25", result_count: 2 },
      ],
      today: "2026-08-25",
      todayVisitors: 7,
      generatedAt: "2026-08-25T00:00:00.000Z",
    });

    expect(statistics.summary).toEqual({ totalResults: 4, todayResults: 2, todayVisitors: 7, representedPillars: 2 });
    expect(statistics.pillars.find((pillar) => pillar.cycleIndex === 0)).toMatchObject({ count: 3, rank: 1, percentage: 75 });
    expect(statistics.elements.find((element) => element.element === "wood")).toMatchObject({ count: 3, percentage: 75 });
    expect(statistics.daily).toHaveLength(30);
    expect(statistics.daily.at(-1)).toEqual({ date: "2026-08-25", count: 2 });
    expect(statistics.characters[0]?.count).toBeGreaterThan(0);
  });
});
