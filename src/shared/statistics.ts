import type { Element } from "../domain/saju/constants";

export interface StatisticsDailyPoint {
  date: string;
  count: number;
}

export interface StatisticsElementRow {
  element: Element;
  label: string;
  count: number;
  percentage: number;
}

export interface StatisticsPillarRow {
  cycleIndex: number;
  ganji: string;
  ganjiKr: string;
  animal: string;
  element: Element;
  count: number;
  percentage: number;
  rank: number;
}

export interface StatisticsAnimalRow {
  animal: string;
  count: number;
  percentage: number;
  imageKey: string;
}

export interface StatisticsCharacterRow {
  characterName: string;
  theme: string;
  themeName: string;
  count: number;
  imageKey?: string;
}

export interface StatisticsViewModel {
  generatedAt: string;
  summary: {
    totalResults: number;
    todayResults: number;
    todayVisitors: number;
    representedPillars: number;
  };
  daily: StatisticsDailyPoint[];
  elements: StatisticsElementRow[];
  pillars: StatisticsPillarRow[];
  animals: StatisticsAnimalRow[];
  characters: StatisticsCharacterRow[];
}
