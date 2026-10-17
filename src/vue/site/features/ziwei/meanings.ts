import pack from './content/ziwei-meanings.json';
import { PALACE_NAMES, type Mutagen } from './ziwei';

export interface ZiweiMeaning {
  keyword: string;
  summary: string;
  guidance: string;
}

export const MAJOR_STAR_NAMES = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
] as const;

const entries = pack.entries as Record<string, ZiweiMeaning>;

function lookup(key: string): ZiweiMeaning {
  const meaning = entries[key];
  if (!meaning) throw new RangeError(`找不到 ${key} 的內容。`);
  return meaning;
}

export function starMeaning(name: string): ZiweiMeaning {
  return lookup(`star:${name}`);
}

export function palaceMeaning(name: (typeof PALACE_NAMES)[number]): ZiweiMeaning {
  return lookup(`palace:${name}`);
}

export function mutagenMeaning(mutagen: Mutagen): ZiweiMeaning {
  return lookup(`mutagen:${mutagen}`);
}
