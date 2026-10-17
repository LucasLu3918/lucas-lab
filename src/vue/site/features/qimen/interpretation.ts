// 奇門斷語為固定規則的文案：依吉凶分數、門星神組合與問題方向組句，不做命定或絕對化的預測。
import { PALACE_NAMES, TOPIC_LABELS, type QimenChart, type QimenPalace, type Topic } from './qimen';

export const DOOR_MEANING: Record<string, string> = {
  生: '生機與積累，利於求財、置產與開源',
  休: '休養與平和，利於協調、談判與靜守',
  開: '開拓與通達，利於謀事、出行與拓展',
  景: '文書與宣傳，利於提案、考試與發表',
  杜: '隱伏與收斂，利於守成、觀察與低調行事',
  傷: '競爭與摩擦，宜先評估風險再行動',
  驚: '變動與消息，宜留意突發狀況與口舌',
  死: '收束與整理，利於結案與清點，不宜開新局',
};

export const STAR_MEANING: Record<string, string> = {
  天蓬: '隱憂與暗流，宜留意細節',
  天芮: '耗損與瑣事，宜節制與調養',
  天冲: '行動與衝勁，利於主動出擊',
  天輔: '學習與輔佐，利於請益與文書',
  天禽: '居中調和，宜協調各方',
  天心: '謀略與決斷，利於定策',
  天柱: '調整與口舌，宜先釐清條件',
  天任: '穩重與積累，利於長線規劃',
  天英: '聲名與表現，利於對外展示',
};

export const GOD_MEANING: Record<string, string> = {
  值符: '主導與貴人，利於請示與領導',
  螣蛇: '變化與虛驚，宜先核實消息',
  太陰: '隱秘與細節，宜審慎保密',
  六合: '合作與和氣，利於合夥與簽約',
  白虎: '競爭與壓力，宜留意期限',
  玄武: '謀慮與防範，宜做好備案',
  九地: '穩固與守護，利於固守既有基礎',
  九天: '升進與公開，利於公開場合與遠行',
};

const TOPIC_FIT: Record<Topic, string> = {
  general: '一般事項可依最吉方位安排行動，重大事項另行評估',
  travel: '出行宜選開、休、景門所在的方位',
  contract: '洽談合約宜選六合或生門所在的方位，並先行備妥文書',
  career: '事業決策宜參考值符或天心所在的方位',
  wealth: '求財宜參考生門或天任所在的方位',
};

const VERDICT_PHRASE: Record<QimenPalace['verdict'], string> = {
  吉: '整體偏順，宜主動推進',
  中: '吉凶參半，宜視事而定',
  凶: '阻力較多，宜先準備或改期',
};

export interface QimenCopy {
  headline: string;
  valueLine: string;
  patternLines: string[];
  timingLine: string;
  bestLine: string;
  worstLine: string;
  fitLine: string;
  caution: string;
}

function palaceLabel(palace: number): string {
  const { name, direction } = PALACE_NAMES[palace];
  return `${name}（${direction}）`;
}

// 依盤面產生斷語。同一盤與同一問題方向，輸出固定相同。
export function interpret(chart: QimenChart): QimenCopy {
  // 值符星隨旬首轉至時干宮，值使門轉至時支宮，故 valueStar 與 valueDoor 即是這兩個宮位的星與門。
  const headline = `此盤${chart.polarity}遁${chart.ju}局，${chart.yuan}元，節氣為${chart.term}；旬首${chart.xunHead}，時辰${chart.hourGanzhi}，問題方向為${TOPIC_LABELS[chart.topic]}。`;
  const valueLine = `值符${chart.valueStar}隨旬首轉至${palaceLabel(chart.hourPalace)}，${STAR_MEANING[chart.valueStar]}；值使${chart.valueDoor}門轉至${palaceLabel(chart.shiPalace)}，${DOOR_MEANING[chart.valueDoor]}。`;
  const patternLines = chart.patterns.length > 0 ? chart.patterns : ['本盤沒有特殊格局，依八門、九星與八神的組合判斷。'];
  const timingLine = `此時辰${chart.hourGanzhi}，值使${chart.valueDoor}門當令，${DOOR_MEANING[chart.valueDoor]}。若事項需要時機，可優先選擇同方向的吉宮時段。`;
  const { best, worst } = chart;
  const bestLine = `${palaceLabel(best.palace)}的${best.door}門、${best.star}與${best.god}相合，綜合評分最高，${VERDICT_PHRASE[best.verdict]}。`;
  const worstLine = `${palaceLabel(worst.palace)}的${worst.door}門、${worst.star}與${worst.god}組合較弱，${VERDICT_PHRASE[worst.verdict]}，不宜在此方位倉促行事。`;
  const fitLine = `${TOPIC_FIT[chart.topic]}。`;
  const caution = '奇門遁甲是傳統時空哲學體系，此處的斷語提供觀察時機與方位的視角，可作為輔助判斷的參考，不取代專業意見。';

  return { headline, valueLine, patternLines, timingLine, bestLine, worstLine, fitLine, caution };
}
