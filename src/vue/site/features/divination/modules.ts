// Display registry for the divination hub. Each entry is the public face of one module; calculation code stays in its own folder.
// Icons are constant SVG markup owned by this file, so v-html rendering here is safe.

export type DivinationInputNeeds = 'none' | 'birthdate' | 'birth-datetime-place';

export interface DivinationModule {
  id: 'tarot' | 'bazi' | 'astrology';
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
];
