// 農曆換算獨立成檔，並以動態匯入載入 lunar-javascript：只給年份時不必下載曆法套件。
import { parseBirthDate } from './fengshui';

// 傳統以農曆新年為界：新年前出生者歸入前一個農曆年。回傳的是農曆年數。
export async function lunarYearOf(birthDate: string, year: number): Promise<number> {
  const parts = parseBirthDate(birthDate);
  if (parts.year !== year) throw new Error('出生日期的年份需與出生年份相同');
  const { Solar } = await import('lunar-javascript');
  return Solar.fromYmd(parts.year, parts.month, parts.day).getLunar().getYear();
}
