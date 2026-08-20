declare module "lunar-javascript" {
  interface LunarDate {
    getDayInGanZhi(): string;
  }

  interface SolarDate {
    getLunar(): LunarDate;
  }

  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate;
  };
}
