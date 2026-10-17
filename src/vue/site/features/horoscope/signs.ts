// Tropical sun signs with fixed day boundaries. Real ingress dates drift by a day from year to year; this table uses the
// conventional boundary days so the result is reproducible and needs no ephemeris. Only month and day are read; the year is ignored.

export const HOROSCOPE_SIGNS = [
  { id: 'aries', name: '牡羊座', symbol: '♈', element: '火' },
  { id: 'taurus', name: '金牛座', symbol: '♉', element: '土' },
  { id: 'gemini', name: '雙子座', symbol: '♊', element: '風' },
  { id: 'cancer', name: '巨蟹座', symbol: '♋', element: '水' },
  { id: 'leo', name: '獅子座', symbol: '♌', element: '火' },
  { id: 'virgo', name: '處女座', symbol: '♍', element: '土' },
  { id: 'libra', name: '天秤座', symbol: '♎', element: '風' },
  { id: 'scorpio', name: '天蠍座', symbol: '♏', element: '水' },
  { id: 'sagittarius', name: '射手座', symbol: '♐', element: '火' },
  { id: 'capricorn', name: '摩羯座', symbol: '♑', element: '土' },
  { id: 'aquarius', name: '水瓶座', symbol: '♒', element: '風' },
  { id: 'pisces', name: '雙魚座', symbol: '♓', element: '水' },
] as const;

export type HoroscopeSignId = typeof HOROSCOPE_SIGNS[number]['id'];

// Each row starts a sign on the given month/day and runs until the next row. Ordered from January; dates before 1/20 fall
// into Capricorn from the previous year, which is why the table begins with Aquarius and the default is Capricorn.
const SIGN_STARTS: ReadonlyArray<readonly [month: number, day: number, id: HoroscopeSignId]> = [
  [1, 20, 'aquarius'],
  [2, 19, 'pisces'],
  [3, 21, 'aries'],
  [4, 20, 'taurus'],
  [5, 21, 'gemini'],
  [6, 21, 'cancer'],
  [7, 23, 'leo'],
  [8, 23, 'virgo'],
  [9, 23, 'libra'],
  [10, 23, 'scorpio'],
  [11, 22, 'sagittarius'],
  [12, 22, 'capricorn'],
];

/** Sun sign for a month/day pair. Feb 29 is accepted because the year is not part of the rule. */
export function sunSignFromMonthDay(month: number, day: number): HoroscopeSignId {
  if (!Number.isInteger(month) || !Number.isInteger(day)) throw new RangeError('月份與日期必須是整數。');
  const probe = new Date(Date.UTC(2000, month - 1, day));
  if (month < 1 || month > 12 || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new RangeError('日期不存在，請重新確認月份與日期。');
  }
  const key = month * 100 + day;
  let sign: HoroscopeSignId = 'capricorn';
  for (const [startMonth, startDay, id] of SIGN_STARTS) {
    if (key >= startMonth * 100 + startDay) sign = id;
  }
  return sign;
}

/** Sun sign from a YYYY-MM-DD string, as produced by an <input type="date">. */
export function sunSignFromBirthDate(isoDate: string): HoroscopeSignId {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new RangeError('請輸入 YYYY-MM-DD 格式的日期。');
  return sunSignFromMonthDay(Number(match[1]), Number(match[2]));
}

export function findHoroscopeSign(id: HoroscopeSignId) {
  const sign = HOROSCOPE_SIGNS.find(item => item.id === id);
  if (!sign) throw new RangeError('未知的星座。');
  return sign;
}
