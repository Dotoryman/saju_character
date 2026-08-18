import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from "./constants";

export interface DayPillar {
  date: string;
  cycleIndex: number;
  dayStem: string;
  dayBranch: string;
  dayPillar: string;
  dayPillarKr: string;
  element: (typeof HEAVENLY_STEMS)[number]["element"];
  yinYang: (typeof HEAVENLY_STEMS)[number]["yinYang"];
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function parseCalendarDate(date: string): { year: number; month: number; day: number } {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    throw new Error("생년월일은 YYYY-MM-DD 형식이어야 합니다.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new Error("실제로 존재하는 날짜를 입력해 주세요.");
  }

  return { year, month, day };
}

export function calculateDayPillar(date: string): DayPillar {
  const { year, month, day } = parseCalendarDate(date);
  const julianDay = toJulianDayNumber(year, month, day);
  // 2000-01-07 is a verified 甲子 day. The offset keeps 甲子 at index 0.
  const cycleIndex = (julianDay + 49) % 60;
  const stem = HEAVENLY_STEMS[cycleIndex % 10];
  const branch = EARTHLY_BRANCHES[cycleIndex % 12];

  if (!stem || !branch) {
    throw new Error("일주 계산에 실패했습니다.");
  }

  return {
    date,
    cycleIndex,
    dayStem: stem.hanja,
    dayBranch: branch.hanja,
    dayPillar: `${stem.hanja}${branch.hanja}`,
    dayPillarKr: `${stem.korean}${branch.korean}`,
    element: stem.element,
    yinYang: stem.yinYang,
  };
}

