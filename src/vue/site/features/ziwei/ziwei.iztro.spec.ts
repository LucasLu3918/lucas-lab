// Difference test: the standard engine must agree with iztro 2.6.3 (devDependency only, never imported at runtime).
import { astro } from 'iztro';
import { describe, expect, it } from 'vitest';
import { BRANCHES, calculateZiwei, type Gender, type ZiweiChart } from './ziwei';

// Star names as iztro prints them (zh-CN) mapped to this engine's Traditional names.
const IZTRO_STAR: Record<string, string> = {
  紫微: '紫微', 天机: '天機', 太阳: '太陽', 武曲: '武曲', 天同: '天同', 廉贞: '廉貞',
  天府: '天府', 太阴: '太陰', 贪狼: '貪狼', 巨门: '巨門', 天相: '天相', 天梁: '天梁',
  七杀: '七殺', 破军: '破軍', 文昌: '文昌', 文曲: '文曲', 左辅: '左輔', 右弼: '右弼',
  天魁: '天魁', 天钺: '天鉞', 禄存: '祿存', 擎羊: '擎羊', 陀罗: '陀羅',
};
const IZTRO_MUTAGEN: Record<string, string> = { 禄: '祿', 权: '權', 科: '科', 忌: '忌' };
const AUXILIARY = new Set(['文昌', '文曲', '左輔', '右弼', '天魁', '天鉞', '祿存', '擎羊', '陀羅']);

interface Case {
  label: string;
  solar: string;
  birthBranch: number;
  gender: Gender;
}

const SOLAR_CASES: Case[] = [
  { label: '1990 巳時 男', solar: '1990-06-15', birthBranch: 5, gender: 'male' },
  { label: '1985 子時 女', solar: '1985-01-20', birthBranch: 0, gender: 'female' },
  { label: '1992 未時 女', solar: '1992-08-11', birthBranch: 7, gender: 'female' },
  { label: '1988 戌時 男', solar: '1988-03-03', birthBranch: 10, gender: 'male' },
  { label: '2000 寅時 男', solar: '2000-12-31', birthBranch: 2, gender: 'male' },
  { label: '1975 亥時 女', solar: '1975-09-25', birthBranch: 11, gender: 'female' },
  { label: '1968 辰時 男', solar: '1968-07-06', birthBranch: 4, gender: 'male' },
  { label: '2003 酉時 女', solar: '2003-02-14', birthBranch: 9, gender: 'female' },
  // 2025 閏六月: day 4 keeps the leap month, day 17 and day 27 count as the next month (iztro fixLeap).
  { label: '2025 閏六月初四 亥時 男', solar: '2025-07-28', birthBranch: 11, gender: 'male' },
  { label: '2025 閏六月十七 亥時 男', solar: '2025-08-10', birthBranch: 11, gender: 'male' },
  { label: '2025 閏六月廿七 寅時 女', solar: '2025-08-20', birthBranch: 2, gender: 'female' },
  { label: '1990 晚子 男', solar: '1990-06-14', birthBranch: 12, gender: 'male' },
  { label: '1990 五月初八 晚子 女', solar: '1990-05-31', birthBranch: 12, gender: 'female' },
  { label: '2025 閏六月十七 晚子 男', solar: '2025-08-10', birthBranch: 12, gender: 'male' },
  { label: '1979 卯時 男', solar: '1979-11-02', birthBranch: 3, gender: 'male' },
  { label: '1996 午時 女', solar: '1996-05-27', birthBranch: 6, gender: 'female' },
  { label: '2010 申時 男', solar: '2010-04-18', birthBranch: 8, gender: 'male' },
  { label: '1963 丑時 女', solar: '1963-10-30', birthBranch: 1, gender: 'female' },
];

function iztroSolar(solar: string, timeIndex: number, gender: Gender) {
  const [year, month, day] = solar.split('-').map(Number);
  return astro.bySolar(`${year}-${month}-${day}`, timeIndex, gender === 'male' ? '男' : '女', true, 'zh-CN');
}

function starSet(chart: ZiweiChart, palaceBranch: number, kind: 'major' | 'minor'): string[] {
  const palace = chart.palaces.find(item => item.branch === palaceBranch);
  if (!palace) throw new Error('palace missing');
  const stars = kind === 'major' ? palace.majorStars : palace.minorStars.filter(star => AUXILIARY.has(star.name));
  return stars.map(star => `${star.name}${star.mutagen ? `化${star.mutagen}` : ''}`).sort();
}

function iztroStarSet(astrolabe: ReturnType<typeof iztroSolar>, branchName: string, kind: 'major' | 'minor'): string[] {
  const palace = astrolabe.palaces.find(item => item.earthlyBranch === branchName);
  if (!palace) throw new Error('iztro palace missing');
  const source = kind === 'major' ? palace.majorStars : palace.minorStars.filter(star => AUXILIARY.has(IZTRO_STAR[star.name]));
  return source
    .map(star => `${IZTRO_STAR[star.name]}${star.mutagen ? `化${IZTRO_MUTAGEN[star.mutagen]}` : ''}`)
    .sort();
}

function compareChart(astrolabe: ReturnType<typeof iztroSolar>, chart: ZiweiChart) {
  expect(chart.fiveElementsClass).toBe(astrolabe.fiveElementsClass);
  expect(chart.soulBranch).toBe(astrolabe.earthlyBranchOfSoulPalace);
  expect(chart.bodyBranch).toBe(astrolabe.earthlyBranchOfBodyPalace);
  for (const palace of chart.palaces) {
    const branchName = BRANCHES[palace.branch];
    expect(starSet(chart, palace.branch, 'major'), `${branchName} major`).toEqual(iztroStarSet(astrolabe, branchName, 'major'));
    expect(starSet(chart, palace.branch, 'minor'), `${branchName} auxiliary`).toEqual(iztroStarSet(astrolabe, branchName, 'minor'));
    const iztroPalace = astrolabe.palaces.find(item => item.earthlyBranch === branchName);
    expect(palace.decadal.startAge, `${branchName} decadal start`).toBe(iztroPalace?.decadal.range[0]);
    expect(palace.decadal.endAge, `${branchName} decadal end`).toBe(iztroPalace?.decadal.range[1]);
    expect(palace.isBody, `${branchName} body flag`).toBe(iztroPalace?.isBodyPalace);
  }
}

describe('ziwei standard engine against iztro 2.6.3', () => {
  it.each(SOLAR_CASES)('agrees on solar birth chart: $label', ({ solar, birthBranch, gender }) => {
    const result = calculateZiwei({ birthDate: solar, birthBranch, gender });
    compareChart(iztroSolar(solar, birthBranch, gender), result.data);
  });

  it('agrees on 晚子時 (iztro timeIndex 12) for every day of 2024, including lunar day 30', () => {
    // 晚子時 uses the same 命宮 as 子 but places 紫微 by the next lunar day. Sweep the whole year to reach lunar day 29–30 too.
    for (let day = new Date('2024-01-01T00:00:00Z'); day.getUTCFullYear() === 2024; day = new Date(day.getTime() + 86_400_000)) {
      const solar = day.toISOString().slice(0, 10);
      const result = calculateZiwei({ birthDate: solar, birthBranch: 12, gender: 'male' });
      compareChart(iztroSolar(solar, 12, 'male'), result.data);
    }
  });

  it('agrees on a chart given as a lunar date (1990 五月初八 亥時 男)', () => {
    const astrolabe = astro.byLunar('1990-5-8', 11, '男', false, true, 'zh-CN');
    const [year, month, day] = astrolabe.solarDate.split('-').map(Number);
    const solar = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const result = calculateZiwei({ birthDate: solar, birthBranch: 11, gender: 'male' });
    compareChart(astrolabe, result.data);
    expect(result.data.lunar).toMatchObject({ year: 1990, month: 5, day: 8 });
  });
});
