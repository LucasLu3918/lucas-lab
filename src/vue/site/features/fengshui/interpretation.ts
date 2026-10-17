// 風水斷語為固定規則的文案：依八宅星與飛星組合組句，以空間布局的建議代替吉凶判語，不做命定或恐嚇的表達。
import { GUA_INFO, PALACE_DIRECTION, type Direction, type FengshuiReport, type Star } from './fengshui';

const STAR_PLACE: Record<Star, string> = {
  生氣: '生機與財丁的能量較為集中',
  天醫: '偏向休養與健康，利於安神與調養',
  延年: '利於情感與家庭和諧，也有助於長久相處',
  伏位: '平穩守成，沒有明顯的起伏',
  絕命: '四星中最需留意，宜減少長時間停留',
  五鬼: '主是非與口舌，宜留意溝通的環境',
  六煞: '感情與財務的波動較多，宜留意',
  禍害: '主疾病與意外，宜留意作息與安全',
};

// 化解以布置為主，不保證結果；沿用傳統五行生剋的常見作法。
const STAR_REMEDY: Record<Star, string> = {
  生氣: '可保持採光與整潔，讓這個方位保持通透。',
  天醫: '可在此處放置綠植或安靜的休息角落。',
  延年: '可放置成對的擺件，象徵和諧與陪伴。',
  伏位: '適合放置備用或收納空間，不必特別調整。',
  絕命: '可擺放金屬器物（屬金，金能剋木），或以燈光提亮此區。',
  五鬼: '可擺放瓷器或陶土類物件（屬土，土能止水）。',
  六煞: '可擺放流水擺件（屬水），以水的流動調和氣場。',
  禍害: '可加強此區域的通風與採光，讓空氣流動。',
};

const DIRECTION_NAME: Record<Direction, string> = {
  北: '北方', 東北: '東北方', 東: '東方', 東南: '東南方', 南: '南方', 西南: '西南方', 西: '西方', 西北: '西北方',
};

export interface FengshuiCopy {
  headline: string;
  natalLine: string;
  bestLines: string[];
  cautionLines: string[];
  spaceLines: Array<{ space: string; text: string }>;
  flyingLines: string[];
  caution: string;
}

function directionOf(report: FengshuiReport, star: Star): Direction {
  const found = report.data.mansions.find(item => item.star === star);
  if (!found) throw new Error(`八宅表缺少 ${star}`);
  return found.direction;
}

function placeLine(report: FengshuiReport, star: Star): string {
  const direction = DIRECTION_NAME[directionOf(report, star)];
  return `${direction}為${star}位，${STAR_PLACE[star]}。${STAR_REMEDY[star]}`;
}

export function interpretFengshui(report: FengshuiReport): FengshuiCopy {
  const { natal, flying } = report.data;
  const info = GUA_INFO[natal.gua];
  const bestStars: Star[] = ['生氣', '天醫', '延年', '伏位'];
  const cautionStars: Star[] = ['絕命', '五鬼', '六煞', '禍害'];
  const groupLine = natal.group === '東四命'
    ? '東四命的吉方集中於北、東、東南與南，布局時可以優先把主要空間放在這幾個方位。'
    : '西四命的吉方集中於西、西北、西南與東北，布局時可以優先把主要空間放在這幾個方位。';

  const flyingLines: string[] = [];
  if (flying) {
    // 向星為九紫時，向首即九紫旺星的方位（中五的向星即入中宮的向星）。
    if (flying.palaces.find(p => p.palace === 5)?.facing === 9) {
      flyingLines.push(`向首（${flying.facing.toward}方）為九紫旺星，當運的生氣較為集中，適合作為主要出入口或書桌朝向。`);
    }
    const nineStars = flying.palaces.filter(p => p.palace !== 5 && (p.mountain === 9 || p.facing === 9));
    if (nineStars.length > 0) {
      flyingLines.push(`九紫星另落在${nineStars.map(p => palaceDirectionName(p.palace)).join('、')}，這些方位的旺氣可以留意。`);
    }
    const ranked = flying.palaces.filter(p => p.palace !== 5).slice().sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    flyingLines.push(`飛星分數最高的是${palaceDirectionName(best.palace)}（${best.matches.map(m => m.meaning).join('；') || '沒有特別組合，屬平穩'}）。`);
    flyingLines.push(`需要留意的是${palaceDirectionName(worst.palace)}（${worst.matches.map(m => m.meaning).join('；') || '沒有特別組合，屬平穩'}），可以用於收納或較少停留的空間。`);
  }

  return {
    headline: `${info.name}卦（${natal.gua}）為${natal.group}，${info.element}的能量特質，下面的方位建議依八宅表整理。`,
    natalLine: groupLine,
    bestLines: bestStars.map(star => placeLine(report, star)),
    cautionLines: cautionStars.map(star => placeLine(report, star)),
    spaceLines: [
      {
        space: '臥室',
        text: `建議安置於${DIRECTION_NAME[directionOf(report, '生氣')]}或${DIRECTION_NAME[directionOf(report, '天醫')]}，床頭靠實牆，避免床位直接對著門。`,
      },
      {
        space: '書房與工作區',
        text: `書桌可朝${DIRECTION_NAME[directionOf(report, '延年')]}或${DIRECTION_NAME[directionOf(report, '生氣')]}，讓視線朝向較吉的方位。`,
      },
      {
        space: '客廳',
        text: `沙發靠實牆，主座朝向${DIRECTION_NAME[directionOf(report, '延年')]}，有助於家人相處的氣氛。`,
      },
      {
        space: '廚房與衛浴',
        text: `若空間條件允許，可安排在${DIRECTION_NAME[directionOf(report, '絕命')]}或${DIRECTION_NAME[directionOf(report, '禍害')]}一帶，並保持通風與乾燥。`,
      },
    ],
    flyingLines,
    caution: '風水建議以八宅與玄空的傳統體系整理，供空間規劃與自我參考。實際布局仍應考慮房屋結構、採光與動線，並可諮詢專業人士。',
  };
}

function palaceDirectionName(palace: number): string {
  const direction = PALACE_DIRECTION[palace];
  if (!direction) throw new Error(`沒有 ${palace} 宮的方位`);
  return DIRECTION_NAME[direction];
}
