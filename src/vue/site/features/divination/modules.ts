// Display registry for the divination hub. Each entry is the public face of one module; calculation code stays in its own folder.
// The copy and icons live in hub.json, which the build also reads to write the hub's static markup (scripts/site/pages.cjs).
// Icons are constant SVG markup owned by that file, so v-html rendering here is safe.
import hub from './hub.json';

export type DivinationInputNeeds = 'none' | 'birthdate' | 'birth-datetime-place';

export interface DivinationModule {
  id: 'tarot' | 'bazi' | 'astrology' | 'ziwei' | 'numerology' | 'horoscope' | 'meihua' | 'liuyao' | 'qimen' | 'fengshui';
  title: string;
  href: string;
  description: string;
  meta: string;
  inputNeeds: DivinationInputNeeds;
  iconSvg: string;
}

export const DIVINATION_HUB = hub;

export const DIVINATION_MODULES: readonly DivinationModule[] = hub.modules as readonly DivinationModule[];
