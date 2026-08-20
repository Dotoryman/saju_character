import { describe, expect, it } from "vitest";
import { Solar } from "lunar-javascript";
import { calculateDayPillar, parseCalendarDate } from "./calculateDayPillar";

describe("calculateDayPillar", () => {
  it("uses the verified 甲子 reference date", () => {
    expect(calculateDayPillar("2000-01-07")).toMatchObject({
      cycleIndex: 0,
      dayPillar: "甲子",
      dayPillarKr: "갑자",
    });
  });

  it("advances one cycle position per date", () => {
    expect(calculateDayPillar("2000-01-08").cycleIndex).toBe(1);
    expect(calculateDayPillar("2000-03-07").cycleIndex).toBe(0);
  });

  it("matches an independently checked Korean calendar date", () => {
    expect(calculateDayPillar("1990-05-12")).toMatchObject({
      cycleIndex: 13,
      dayPillar: "丁丑",
      dayPillarKr: "정축",
    });
    expect(calculateDayPillar("1990-05-21").dayPillarKr).toBe("병술");
  });

  it("rejects impossible calendar dates", () => {
    expect(() => parseCalendarDate("2025-02-29")).toThrow();
  });

  it("matches an independent calendar implementation across 144 dates", () => {
    const years = Array.from({ length: 12 }, (_, index) => 1900 + index * 18);

    for (const year of years) {
      for (let month = 1; month <= 12; month += 1) {
        const day = Math.min(3 + month * 2, new Date(Date.UTC(year, month, 0)).getUTCDate());
        const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const expected = Solar.fromYmd(year, month, day).getLunar().getDayInGanZhi();
        expect(calculateDayPillar(date).dayPillar, date).toBe(expected);
      }
    }
  });

  it.each([
    "1900-01-01",
    "1999-12-31",
    "2000-01-01",
    "2000-02-28",
    "2000-02-29",
    "2000-03-01",
    "2024-02-28",
    "2024-02-29",
    "2024-03-01",
    "2025-12-31",
    "2026-01-01",
    "2099-12-31",
    "2100-01-01",
  ])("matches the independent calendar at boundary date %s", (date) => {
    const { year, month, day } = parseCalendarDate(date);
    expect(calculateDayPillar(date).dayPillar).toBe(
      Solar.fromYmd(year, month, day).getLunar().getDayInGanZhi(),
    );
  });
});
