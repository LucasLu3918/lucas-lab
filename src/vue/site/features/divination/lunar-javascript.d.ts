declare module 'lunar-javascript' {
  export interface EightChar {
    setSect(sect: number): void;
    getYear(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getYearWuXing(): string;
    getYearShiShenGan(): string;
    getYearHideGan(): string[];
    getYearShiShenZhi(): string[];
    getMonth(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getMonthWuXing(): string;
    getMonthShiShenGan(): string;
    getMonthHideGan(): string[];
    getMonthShiShenZhi(): string[];
    getDay(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getDayWuXing(): string;
    getDayHideGan(): string[];
    getDayShiShenZhi(): string[];
    getTime(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getTimeWuXing(): string;
    getTimeHideGan(): string[];
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
  }
  export interface LunarDate {
    getEightChar(): EightChar;
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhiExact2(): string;
  }
  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): { getLunar(): LunarDate };
  };
}
