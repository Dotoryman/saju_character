import { ARCHETYPES } from "../../data/archetypes";
import { getCharacterResults } from "../../data/characterMappings";
import type { Element } from "../saju/constants";
import type {
  StatisticsAnimalRow,
  StatisticsCharacterRow,
  StatisticsDailyPoint,
  StatisticsElementRow,
  StatisticsPillarRow,
  StatisticsViewModel,
} from "../../shared/statistics";

export interface PillarCountRow {
  cycle_index: number;
  result_count: number;
}

export interface DailyCountRow {
  stat_date: string;
  result_count: number;
}

const ELEMENT_LABELS: Record<Element, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const ELEMENT_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];

export function buildStatistics(input: {
  pillarCounts: PillarCountRow[];
  dailyCounts: DailyCountRow[];
  today: string;
  todayVisitors: number;
  generatedAt?: string;
}): StatisticsViewModel {
  const countByPillar = new Map(input.pillarCounts.map((row) => [row.cycle_index, Number(row.result_count) || 0]));
  const totalResults = [...countByPillar.values()].reduce((sum, count) => sum + count, 0);
  const rankByPillar = new Map(
    ARCHETYPES
      .map((archetype) => ({ cycleIndex: archetype.cycleIndex, count: countByPillar.get(archetype.cycleIndex) ?? 0 }))
      .sort((left, right) => right.count - left.count || left.cycleIndex - right.cycleIndex)
      .map((row, index) => [row.cycleIndex, index + 1]),
  );

  const pillars: StatisticsPillarRow[] = ARCHETYPES.map((archetype) => {
    const count = countByPillar.get(archetype.cycleIndex) ?? 0;
    return {
      cycleIndex: archetype.cycleIndex,
      ganji: archetype.ganji,
      ganjiKr: archetype.ganjiKr,
      animal: archetype.animalName,
      element: archetype.element,
      count,
      percentage: percent(count, totalResults),
      rank: rankByPillar.get(archetype.cycleIndex) ?? 60,
    };
  });

  const elements = ELEMENT_ORDER.map((element): StatisticsElementRow => {
    const count = pillars.filter((pillar) => pillar.element === element).reduce((sum, pillar) => sum + pillar.count, 0);
    return { element, label: ELEMENT_LABELS[element], count, percentage: percent(count, totalResults) };
  });

  const animals = aggregateAnimals(pillars);
  const characters = aggregateCharacters(pillars);
  const daily = fillDailySeries(input.dailyCounts, input.today, 30);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    summary: {
      totalResults,
      todayResults: daily.at(-1)?.count ?? 0,
      todayVisitors: input.todayVisitors,
      representedPillars: pillars.filter((pillar) => pillar.count > 0).length,
    },
    daily,
    elements,
    pillars,
    animals,
    characters,
  };
}

function aggregateAnimals(pillars: StatisticsPillarRow[]): StatisticsAnimalRow[] {
  const counts = new Map<string, number>();
  for (const pillar of pillars) counts.set(pillar.animal, (counts.get(pillar.animal) ?? 0) + pillar.count);
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([animal, count]) => ({
      animal,
      count,
      percentage: percent(count, total),
      imageKey: `/media/animals/${encodeURIComponent(animal)}?v=20260824-2`,
    }))
    .sort((left, right) => right.count - left.count || left.animal.localeCompare(right.animal, "ko"));
}

function aggregateCharacters(pillars: StatisticsPillarRow[]): StatisticsCharacterRow[] {
  const characters = new Map<string, StatisticsCharacterRow>();
  for (const pillar of pillars) {
    if (pillar.count === 0) continue;
    for (const character of getCharacterResults(pillar.cycleIndex)) {
      const key = `${character.theme}|${character.characterName}`;
      const current = characters.get(key);
      characters.set(key, current
        ? { ...current, count: current.count + pillar.count }
        : {
            characterName: character.characterName,
            theme: character.theme,
            themeName: character.themeName,
            count: pillar.count,
            imageKey: character.imageKey,
          });
    }
  }
  return [...characters.values()]
    .sort((left, right) => right.count - left.count || left.characterName.localeCompare(right.characterName, "ko"));
}

function fillDailySeries(rows: DailyCountRow[], today: string, days: number): StatisticsDailyPoint[] {
  const counts = new Map(rows.map((row) => [row.stat_date, Number(row.result_count) || 0]));
  const end = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - index - 1));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}
