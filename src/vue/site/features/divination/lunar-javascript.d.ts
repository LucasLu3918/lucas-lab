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
    getYun(gender: number, sect?: number): Yun;
  }
  export interface Yun {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    getStartSolar(): SolarDate;
    getDaYun(): DaYun[];
  }
  export interface DaYun {
    getStartYear(): number;
    getStartAge(): number;
    getGanZhi(): string;
  }
  export interface SolarDate { toYmd(): string }
  export interface JieQi {
    getName(): string;
    getSolar(): { getYear(): number; getMonth(): number; getDay(): number; getHour(): number; getMinute(): number };
  }
  export interface LunarDate {
    getEightChar(): EightChar;
    getYearInGanZhiExact(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhiExact2(): string;
    /** The most recent solar term (節氣) at or before this moment; wholeDay false keeps the exact time. */
    getPrevJieQi(wholeDay?: boolean): JieQi;
    /** Lunar year as a number. */
    getYear(): number;
    /** Lunar month as a number; negative for a leap month. */
    getMonth(): number;
    getDay(): number;
  }
  export const Solar: {
    fromYmd(year: number, month: number, day: number): { getLunar(): LunarDate };
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): { getLunar(): LunarDate };
  };
}
