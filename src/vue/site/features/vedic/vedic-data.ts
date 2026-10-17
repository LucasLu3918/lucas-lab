// 吠陀占星的固定資料：二十七月宿、九曜、維姆歐塔里大運的順序與年數，以及中文說明。規則依 docs/plan/FORTUNE_HUB_PLAN.md §3.11。

export type GrahaId = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu';

export interface GrahaInfo {
  id: GrahaId;
  name: string;
  sanskrit: string;
  keywords: string;
  // 大運主題：作為大運期間的主要課題，語氣以可能性與方向為主。
  theme: string;
  // 維姆歐塔里大運的年數；九曜合計 120 年。
  years: number;
}

// 九曜依大運的固定順序排列；月宿的主星依此循環（第 1 宿為計都，第 2 宿為金星，第 3 宿為太陽）。
export const GRAHAS: Record<GrahaId, GrahaInfo> = {
  sun: { id: 'sun', name: '太陽', sanskrit: 'Surya', keywords: '自我、權威、活力、目標', years: 6, theme: '自我表達與責任感升起，適合把方向與公開的角色整理清楚。' },
  moon: { id: 'moon', name: '月亮', sanskrit: 'Chandra', keywords: '情緒、安全感、照顧、記憶', years: 10, theme: '情緒、家庭與日常節奏成為焦點，適合照顧身心基礎與安定的環境。' },
  mars: { id: 'mars', name: '火星', sanskrit: 'Mangala', keywords: '行動、勇氣、競爭、紀律', years: 7, theme: '行動力與主動性升高，適合把能量導向明確目標，並留意節奏與休息。' },
  mercury: { id: 'mercury', name: '水星', sanskrit: 'Budha', keywords: '溝通、學習、分析、商務', years: 17, theme: '學習、交流與整理資訊的階段，適合釐清想法、建立技能與人脈。' },
  jupiter: { id: 'jupiter', name: '木星', sanskrit: 'Guru', keywords: '智慧、擴展、信念、教導', years: 16, theme: '視野與信念擴展的時期，適合學習、教導與追求有意義的成長。' },
  venus: { id: 'venus', name: '金星', sanskrit: 'Shukra', keywords: '愛、美感、關係、享受', years: 20, theme: '關係、美感與享受成為重點，適合深化情感連結並培養生活品味。' },
  saturn: { id: 'saturn', name: '土星', sanskrit: 'Shani', keywords: '責任、紀律、時間、結構', years: 19, theme: '長期責任與結構建立是主題，適合以耐心與紀律累積可持續的成果。' },
  rahu: { id: 'rahu', name: '羅睺', sanskrit: 'Rahu', keywords: '渴望、探索、非傳統、拓展', years: 18, theme: '渴望探索新領域與不同經驗，適合有意識地檢視動機並保持平衡。' },
  ketu: { id: 'ketu', name: '計都', sanskrit: 'Ketu', keywords: '放下、內省、靈性、專注', years: 7, theme: '向內整理、放下不必要的執念，適合深度專注並回到本質。' },
};

export const DASHA_ORDER: readonly GrahaId[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];

export const DASHA_TOTAL_YEARS = 120;

export interface NakshatraInfo {
  // 第 1 至 27 宿，順序與黃道一致（白羊座 0° 起算）。
  number: number;
  name: string;
  meaning: string;
  lord: GrahaId;
  essence: string;
}

export const NAKSHATRAS: readonly NakshatraInfo[] = [
  { number: 1, name: 'Ashvini', meaning: '馬首', lord: 'ketu', essence: '開創與快速行動的能量，適合勇於起步，並在實踐中調整方向。' },
  { number: 2, name: 'Bharani', meaning: '承載', lord: 'venus', essence: '承擔與轉化的能量，重視責任，也善於在壓力中培育成果。' },
  { number: 3, name: 'Krittika', meaning: '利刃', lord: 'sun', essence: '清楚而有力的切割感，適合分辨界線、直接表達，並以明確的標準要求自己。' },
  { number: 4, name: 'Rohini', meaning: '紅者', lord: 'moon', essence: '重視美感、滋養與穩定的關係，對環境的舒適度與情感連結特別敏銳。' },
  { number: 5, name: 'Mrigashira', meaning: '鹿首', lord: 'mars', essence: '好奇而機敏，喜歡探索與追尋，適合在多樣的經驗中找到方向。' },
  { number: 6, name: 'Ardra', meaning: '濕潤', lord: 'rahu', essence: '情緒的深度與變化並存，適合以真實的感受理解自己與他人。' },
  { number: 7, name: 'Punarvasu', meaning: '再度富足', lord: 'jupiter', essence: '善於復原與重新出發，帶著樂觀與包容面對循環與回歸。' },
  { number: 8, name: 'Pushya', meaning: '滋養', lord: 'saturn', essence: '照顧他人、建立制度與長期努力的能量，適合穩定而持續地累積。' },
  { number: 9, name: 'Ashlesha', meaning: '纏繞', lord: 'mercury', essence: '洞察與細膩的觀察力，善於理解人際與心理的細節，也可留意不要過度糾纏。' },
  { number: 10, name: 'Magha', meaning: '強大者', lord: 'ketu', essence: '重視傳承、榮譽與根源，適合承擔有象徵意義的角色。' },
  { number: 11, name: 'Purva Phalguni', meaning: '前紅', lord: 'venus', essence: '享受生活與人際的愉悅，重視表達、藝術與友誼。' },
  { number: 12, name: 'Uttara Phalguni', meaning: '後紅', lord: 'sun', essence: '重視互惠、承諾與責任，適合建立長期合作與可信賴的關係。' },
  { number: 13, name: 'Hasta', meaning: '手', lord: 'moon', essence: '擅長手作與務實的技巧，喜歡把想法具體做出來。' },
  { number: 14, name: 'Chitra', meaning: '光彩', lord: 'mars', essence: '重視設計與美感，喜歡創造有結構的作品，也追求細節的完成度。' },
  { number: 15, name: 'Swati', meaning: '獨立', lord: 'rahu', essence: '靈活、獨立且善於適應變化，適合在自由的空間中發展。' },
  { number: 16, name: 'Vishakha', meaning: '分枝', lord: 'jupiter', essence: '目標導向、有決心，適合在多條路徑中做選擇並努力抵達。' },
  { number: 17, name: 'Anuradha', meaning: '隨行', lord: 'saturn', essence: '重視友誼與忠誠，善於在團隊中維持長期而穩定的合作。' },
  { number: 18, name: 'Jyeshtha', meaning: '年長者', lord: 'mercury', essence: '具有領導與守護的意識，重視責任，也願意保護他人。' },
  { number: 19, name: 'Mula', meaning: '根', lord: 'ketu', essence: '喜歡追根究柢，適合重新檢視基礎，從根本處整理方向。' },
  { number: 20, name: 'Purva Ashadha', meaning: '前不敗', lord: 'venus', essence: '充滿自信與感染力，適合以熱情推動理念與交流。' },
  { number: 21, name: 'Uttara Ashadha', meaning: '後不敗', lord: 'sun', essence: '重視原則與長期努力，適合循序完成值得堅持的目標。' },
  { number: 22, name: 'Shravana', meaning: '聆聽', lord: 'moon', essence: '善於傾聽與學習，重視知識、傳承與口耳相傳的智慧。' },
  { number: 23, name: 'Dhanishtha', meaning: '富饒者', lord: 'mars', essence: '節奏感與團隊合作力強，適合把資源與節奏安排得井然有序。' },
  { number: 24, name: 'Shatabhisha', meaning: '百醫', lord: 'rahu', essence: '重視研究、療癒與獨立思考，適合深入探索未知的領域。' },
  { number: 25, name: 'Purva Bhadrapada', meaning: '前足', lord: 'jupiter', essence: '理想與熱情兼具，適合追求有深度的理念，也可留意過於執著的傾向。' },
  { number: 26, name: 'Uttara Bhadrapada', meaning: '後足', lord: 'saturn', essence: '沉著、穩定而有包容力，適合長期投入、慢慢累積深度。' },
  { number: 27, name: 'Revati', meaning: '豐饒', lord: 'mercury', essence: '溫和而富同理心，善於照顧他人與引導旅程，重視完整與圓滿。' },
];

export interface RashiInfo {
  name: string;
  chinese: string;
}

// 十二星座（Rashi）依恆星黃道白羊 0° 起算，順序與西洋星座相同，命名取梵文。
export const RASHIS: readonly RashiInfo[] = [
  { name: 'Mesha', chinese: '白羊' }, { name: 'Vrishabha', chinese: '金牛' }, { name: 'Mithuna', chinese: '雙子' },
  { name: 'Karka', chinese: '巨蟹' }, { name: 'Simha', chinese: '獅子' }, { name: 'Kanya', chinese: '處女' },
  { name: 'Tula', chinese: '天秤' }, { name: 'Vrishchika', chinese: '天蠍' }, { name: 'Dhanu', chinese: '射手' },
  { name: 'Makara', chinese: '摩羯' }, { name: 'Kumbha', chinese: '水瓶' }, { name: 'Meena', chinese: '雙魚' },
];
