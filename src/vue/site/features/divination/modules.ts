// Display registry for the divination hub. Each entry is the public face of one module; calculation code stays in its own folder.
// Icons are constant SVG markup owned by this file, so v-html rendering here is safe.

export type DivinationInputNeeds = 'none' | 'birthdate' | 'birth-datetime-place';

export interface DivinationModule {
  id: 'tarot' | 'bazi' | 'astrology' | 'numerology' | 'horoscope';
  title: string;
  href: string;
  description: string;
  meta: string;
  inputNeeds: DivinationInputNeeds;
  iconSvg: string;
}

export const DIVINATION_MODULES: readonly DivinationModule[] = [
  {
    id: 'tarot',
    title: '星夜塔羅',
    href: '../tarot/',
    description: '隨機快抽、每日一抽或三／五張深入牌陣；問題與主題皆可略過。',
    meta: '不需個資，立即抽牌',
    inputNeeds: 'none',
    iconSvg: '<path d="M18 7a9 9 0 1 0 7 14.5A7.5 7.5 0 0 1 18 7z" />',
  },
  {
    id: 'bazi',
    title: '生辰八字',
    href: '../bazi/',
    description: '簡易模式不需出生時間，排三柱；提供可靠出生時間可查看四柱、十神與五行。',
    meta: '選擇資料完整度',
    inputNeeds: 'birthdate',
    iconSvg: '<path d="M5 10h4v12H5zM11 10h4v12h-4zM17 10h4v12h-4zM23 10h4v12h-4z" />',
  },
  {
    id: 'astrology',
    title: '西洋占星',
    href: '../astrology/',
    description: '出生時間不詳可先查看近似行星落座；補上精確時間和地點才計算上升、天頂與宮位。',
    meta: '選擇資料完整度',
    inputNeeds: 'birthdate',
    iconSvg: '<circle cx="16" cy="16" r="5" /><ellipse cx="16" cy="16" rx="12" ry="5" transform="rotate(-24 16 16)" />',
  },
  {
    id: 'numerology',
    title: '生命靈數',
    href: '../numerology/',
    description: '從出生日期與英文全名，整理生命路徑、表達數，以及目前的年度、月與日循環。',
    meta: '需要出生日期，可選填英文全名',
    inputNeeds: 'birthdate',
    iconSvg: '<path d="M16 6l2.6 6.4L25 13l-5 4.4 1.6 6.6L16 21l-5.6 3 1.6-6.6L7 13l6.4-.6z" />',
  },
  {
    id: 'horoscope',
    title: '星座運勢',
    href: '../horoscope/',
    description: '選擇太陽星座，查看今日的整體、感情、事業、財務與健康五個面向與幸運指引。',
    meta: '不需個資，選擇星座即可',
    inputNeeds: 'none',
    iconSvg: '<path d="M16 4l3.4 7.6 8.2 1-6.1 5.6 1.7 8.2L16 22.3 8.8 26.4l1.7-8.2-6.1-5.6 8.2-1z" />',
  },
];
