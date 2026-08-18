import { describe, expect, it } from "vitest";
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
});
