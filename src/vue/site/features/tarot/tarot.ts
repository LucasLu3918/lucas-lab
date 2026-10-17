export type TarotOrientation = 'upright' | 'reversed';
export type TarotSpreadId = 'single' | 'daily' | 'past-present-future' | 'situation-challenge-advice' | 'choice';
export type TarotSuitId = 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotCard {
  id: string;
  number: string;
  name: string;
  englishName: string;
  arcana: 'major' | 'minor';
  suit: TarotSuitId | null;
  suitLabel: string | null;
  symbol: string;
  keywords: Record<TarotOrientation, string[]>;
  meanings: Record<TarotOrientation, string>;
}

interface MajorSeed {
  id: string;
  number: string;
  name: string;
  englishName: string;
  symbol: string;
  upright: string;
  reversed: string;
  uprightKeywords: string;
  reversedKeywords: string;
}

const MAJOR_ARCANA: MajorSeed[] = [
  ['00','愚者','The Fool','✧','踏出新旅程，保持好奇並為未知留一點空間。','衝動可能遮住風險；先確認方向，再決定要不要跳下去。','啟程,自由,信任','魯莽,遲疑,忽略風險'],
  ['01','魔術師','The Magician','⚝','你已握有開始所需的工具，現在適合把想法化為行動。','能力尚未聚焦，或承諾多於實際行動；先把資源用在一件事上。','專注,創造,行動力','分心,操弄,未發揮'],
  ['02','女祭司','The High Priestess','☾','安靜觀察直覺與未說出口的訊息，暫時不必急著揭底。','直覺被雜音蓋過，或秘密與猜測正在造成誤會；先查證再下結論。','直覺,內在知識,靜觀','混亂,隱瞞,忽略直覺'],
  ['03','皇后','The Empress','❀','滋養關係與創作，讓值得成長的事在穩定照料中開花。','付出失衡或過度依賴舒適感；照顧他人時也留意自己的需要。','豐盛,照料,創造','匱乏感,依賴,停滯'],
  ['04','皇帝','The Emperor','♜','建立清晰界線與可靠秩序，讓計畫有穩固的支撐。','規則可能變得僵硬或控制過多；重新檢查哪些界線仍然有用。','秩序,責任,穩定','僵化,專斷,失序'],
  ['05','教皇','The Hierophant','✥','傳統、師長或共同價值能提供方向，適合先理解既有方法。','舊規則未必符合現在的你；保留有用的原則，也允許重新選擇。','傳承,學習,共同信念','反叛,盲從,重新定義'],
  ['06','戀人','The Lovers','♡','真誠的連結來自一致的價值與選擇，適合坦白溝通。','關係或決定出現不一致；先釐清自己的需要，再談如何靠近。','連結,選擇,一致','失衡,猶豫,疏離'],
  ['07','戰車','The Chariot','✦','把相反的力量導向同一目標，穩定前進便能突破阻礙。','方向分散或急於掌控；稍作調整，再用可持續的步伐前進。','意志,前進,掌控','失控,分心,受阻'],
  ['08','力量','Strength','☼','柔韌、耐心與自我信任，比強硬壓制更能安頓眼前局面。','疲憊或自我懷疑正在消耗力量；先恢復穩定，不必勉強證明自己。','勇氣,耐心,溫柔','耗竭,不安,壓抑'],
  ['09','隱者','The Hermit','⌕','獨處與深入思考能幫你看清方向，暫時收回外界的聲音。','退隱太久可能變成隔絕；在保有空間的同時，找一位可信任的人交流。','內省,尋路,洞見','孤立,封閉,拒絕協助'],
  ['10','命運之輪','Wheel of Fortune','◉','局勢正在轉動，迎接變化並把握可行的時機。','變化帶來不穩或延宕；分清可控與不可控之處，避免只靠運氣。','轉機,循環,時機','延滯,反覆,抗拒變化'],
  ['11','正義','Justice','⚖','以事實與公平衡量選項，並為自己的決定承擔責任。','資訊不完整或標準不一致；補足證據，重新檢視判斷是否公平。','公正,誠實,因果','偏見,逃避,失衡'],
  ['12','倒吊人','The Hanged Man','⟡','暫停原有做法，換個角度看待事情，新的理解可能因此出現。','等待失去目的或犧牲過多；確認暫停是否仍有助於你。','換位思考,等待,放下','拖延,徒勞,抗拒'],
  ['13','死神','Death','☠','一個階段正在結束，放下已完成的事，為轉變騰出位置。','緊抓不再適合的狀態會延長不安；從一個小而具體的告別開始。','結束,轉化,釋放','抗拒,停滯,延後告別'],
  ['14','節制','Temperance','⚗','以耐心調和不同需求，採取適中的步調，讓事情逐漸恢復平衡。','節奏或比例失衡；減少過度投入，重新安排可長久維持的方式。','調和,耐心,平衡','過量,失衡,急躁'],
  ['15','惡魔','The Devil','⛓','看見慾望、習慣或依附如何限制選擇，覺察就是鬆動束縛的起點。','你開始辨認束縛並找回選擇權；持續建立界線，避免舊模式回頭。','慾望,依附,覺察','鬆綁,拒絕誘惑,重掌選擇'],
  ['16','高塔','The Tower','ϟ','不穩固的結構可能突然改變；先保護重要之物，再面對真相。','危機正在累積或餘波未散；不要只修補表面，找出需要重建的根基。','突變,揭露,重整','延後崩解,恐懼改變,餘波'],
  ['17','星星','The Star','☆','在混亂後重新看見希望，透過誠實而溫和的照料恢復信心。','希望感暫時變弱；先做一件能補充心力的小事，再重新規劃遠方。','希望,療癒,信任','失望,疲乏,缺乏信心'],
  ['18','月亮','The Moon','☽','情緒與想像放大了不確定感；慢下來，辨認事實與投射。','迷霧逐漸散開，也可能有被忽略的情緒浮現；用可靠資訊校正直覺。','夢境,直覺,不確定','看清,焦慮,隱情浮現'],
  ['19','太陽','The Sun','☀','清晰、活力與坦率帶來向前的力量，適合分享成果與喜悅。','快樂被疲憊或期待遮住；降低完美要求，重新看見已經做到的事。','明朗,活力,成功','延遲,過度樂觀,倦怠'],
  ['20','審判','Judgement','♧','回顧經驗並回應內心真正重視的事，適合做出成熟的下一步。','自我批判或遲疑讓你難以翻頁；以學習取代責備，再做決定。','覺醒,回顧,召喚','自責,逃避,遲疑'],
  ['21','世界','The World','◌','一段旅程走向完整，肯定成果並準備迎接下一個循環。','收尾仍有一小段路；完成未竟之事，讓成果真正落地。','完成,整合,圓滿','未竟,延宕,缺少收束'],
].map(([number,name,englishName,symbol,upright,reversed,uprightKeywords,reversedKeywords]) => ({
  id: `major-${number}-${String(englishName).toLowerCase().replaceAll(' ','-')}`,
  number,
  name,
  englishName,
  symbol,
  upright,
  reversed,
  uprightKeywords,
  reversedKeywords,
}));

const SUITS: Array<{ id: TarotSuitId; label: string; symbol: string; domain: string; cards: Array<[string,string,string,string]> }> = [
  { id:'wands', label:'權杖', symbol:'♢', domain:'行動、創造與熱情', cards:[
    ['權杖一','Ace of Wands','新的創作或行動火花已出現，適合把熱情落實為第一步。','靈感受到阻塞或過早消散；先排除分心，再確認真正想投入的事。'],
    ['權杖二','Two of Wands','你正站在規劃與拓展的門檻，盤點資源後選擇方向。','猶豫或過度掌控讓計畫停在原地；先定一個可執行的小目標。'],
    ['權杖三','Three of Wands','前期努力開始向外延伸，合作與遠景值得持續觀察。','進度延遲或協作失準；重新確認時程與彼此的期待。'],
    ['權杖四','Four of Wands','階段成果帶來安定與歡聚，適合與重要的人共享喜悅。','歸屬感或安排出現落差；先修復溝通，再慶祝成果。'],
    ['權杖五','Five of Wands','不同意見帶來競爭與磨合；把分歧轉成清楚的討論。','衝突可能升高，也可能被壓著不談；尋找公平而明確的規則。'],
    ['權杖六','Six of Wands','努力獲得肯定，坦然接受成果，也記得感謝同行者。','認可尚未到來或過度依賴掌聲；回到自己重視的進展。'],
    ['權杖七','Seven of Wands','守住重要立場並保持彈性，你有能力面對外界挑戰。','壓力過多使防守變得耗竭；重訂界線，也考慮尋求支援。'],
    ['權杖八','Eight of Wands','消息與進展加速，抓住時機並讓溝通保持清楚。','延誤、雜訊或急躁干擾進度；逐項確認資訊與優先順序。'],
    ['權杖九','Nine of Wands','經歷考驗後仍保有韌性；謹慎前進，但不必獨自承受。','持續警戒帶來疲憊；分辨真實風險與過去留下的恐懼。'],
    ['權杖十','Ten of Wands','責任與熱情同時累積；整理優先順序並適度分工。','你開始卸下不必要的重擔；練習拒絕並把責任交還適當的人。'],
    ['權杖侍者','Page of Wands','新點子值得探索，保持好奇並先用小規模行動試水溫。','熱情容易起落；完成一個小承諾，勝過不斷開啟新計畫。'],
    ['權杖騎士','Knight of Wands','勇於追求目標並善用行動力，同時替變化保留緩衝。','急進或反覆改變方向可能傷及合作；先評估後果再衝刺。'],
    ['權杖皇后','Queen of Wands','自信與熱情讓你成為穩定的帶動者，分享光芒也尊重界線。','不安可能轉成嫉妒或過度介入；回到自己的力量與需求。'],
    ['權杖國王','King of Wands','遠見與主動性適合帶領計畫，讓願景配上可檢視的步驟。','強勢或急於控制會壓縮他人空間；用聆聽取代單方面決定。'],
  ]},
  { id:'cups', label:'聖杯', symbol:'✿', domain:'情感、關係與內在感受', cards:[
    ['聖杯一','Ace of Cups','情感或創作迎來新的流動，允許自己真誠感受並接納善意。','感受被壓住或付出失衡；先照料自己的情緒，再回應他人。'],
    ['聖杯二','Two of Cups','互相尊重與坦誠交流讓關係更靠近，留意彼此都能自在表達。','互動出現不對等或誤解；釐清期待，避免單方面猜測。'],
    ['聖杯三','Three of Cups','友誼、支持與共享的喜悅為你補充力量，記得珍惜互相扶持。','社交過量或流言損害信任；回到真誠的小圈子與清楚溝通。'],
    ['聖杯四','Four of Cups','心情倦怠使新機會不易被看見；給自己時間，也留意伸來的援手。','你重新對情感與機會敞開；先確認內心真正想要什麼。'],
    ['聖杯五','Five of Cups','失落值得被承認，但仍有支持與可能性留在身邊。','你開始從遺憾中回望可用的資源，逐步允許自己向前。'],
    ['聖杯六','Six of Cups','回憶與熟悉的善意帶來溫暖；把過去的美好帶進現在。','懷舊可能遮住眼前需要；珍惜回憶，但不必困在舊時光。'],
    ['聖杯七','Seven of Cups','選項與想像同時湧現；辨認願望與現實，再挑一條可走的路。','迷霧逐漸散去，適合做出取捨；別讓幻想取代實際資訊。'],
    ['聖杯八','Eight of Cups','離開已無法滋養你的狀態，是尋找更深層意義的一步。','害怕改變可能讓你停留；確認留下是出於選擇還是逃避。'],
    ['聖杯九','Nine of Cups','願望與滿足感逐漸靠近；享受成果，同時維持真實的需要。','短暫享樂或過高期待無法填補空缺；重新檢視何謂真正滿足。'],
    ['聖杯十','Ten of Cups','情感支持與共享幸福正在成形，讓關係容納每個人的真實樣貌。','理想化的和諧掩蓋了張力；坦誠處理差異才能建立持久連結。'],
    ['聖杯侍者','Page of Cups','溫柔訊息或情感靈感值得留意，保持開放也保持清醒。','情緒容易波動或表達不成熟；先整理感受，再做出承諾。'],
    ['聖杯騎士','Knight of Cups','浪漫、理想或邀請帶來吸引力；讓行動與承諾相互一致。','甜美承諾可能缺乏落實；確認事實，避免只憑想像投入。'],
    ['聖杯皇后','Queen of Cups','同理與直覺能理解細膩情緒；以溫柔回應，也為自己留界線。','過度吸收他人情緒會讓你失去平衡；先分清哪些感受屬於自己。'],
    ['聖杯國王','King of Cups','成熟地安放情緒，讓關懷與理性並存，不被一時波動牽著走。','情緒被壓抑或被用來影響他人；以坦率而負責的方式表達。'],
  ]},
  { id:'swords', label:'寶劍', symbol:'✦', domain:'思考、溝通與判斷', cards:[
    ['寶劍一','Ace of Swords','清晰的想法與坦率溝通有助突破，先確認事實再採取行動。','資訊混亂或措辭過於尖銳；整理證據，避免急著定論。'],
    ['寶劍二','Two of Swords','兩難尚未解開；暫停片刻蒐集資訊，再正視必須做的選擇。','逃避決定只會加重壓力；承認現況，逐步解除僵局。'],
    ['寶劍三','Three of Swords','失望或心痛需要被正視；給自己時間，透過誠實表達開始修復。','傷口逐漸癒合，也可能有情緒仍未說出口；溫和地面對它。'],
    ['寶劍四','Four of Swords','休息與暫停能恢復判斷力；安排安靜時間，不必立刻回應所有事。','休息不足或停滯太久；循序恢復行動，不要用忙碌掩蓋疲憊。'],
    ['寶劍五','Five of Swords','衝突中的勝負可能有代價；重新思考什麼值得堅持，什麼可以放下。','適合止息爭端或修補關係；承認各自責任，避免翻舊帳。'],
    ['寶劍六','Six of Swords','離開混亂、移向較平靜的環境；過渡需要時間，也需要支持。','仍被舊問題牽制；找出阻礙前進的因素，再安排下一步。'],
    ['寶劍七','Seven of Swords','策略與保留空間可以派上用場，但重要行動仍須誠實負責。','隱瞞或取巧可能被揭穿；坦承問題，修正不可靠的做法。'],
    ['寶劍八','Eight of Swords','你感到受困，但限制未必無法改變；先辨認一個可行的出口。','開始看見自己仍有選擇；逐步拆解恐懼建立的限制。'],
    ['寶劍九','Nine of Swords','憂慮正在放大問題；把擔心說出來，並尋求可信任的支持。','壓力稍有緩解，或悔意浮現；以具體照料取代反覆責怪自己。'],
    ['寶劍十','Ten of Swords','一段困難走到盡頭；承認結束，讓復原從眼前能做的小事開始。','最艱難的時刻逐漸過去；恢復需要時間，接受幫助並重建信任。'],
    ['寶劍侍者','Page of Swords','保持好奇並仔細查證，新的消息值得研究後再分享。','流言、急躁或準備不足影響判斷；先核實資訊再表態。'],
    ['寶劍騎士','Knight of Swords','迅速而直接的行動有助突破；保持目標清楚，也照顧溝通方式。','言語或行動過於衝動；先停下來確認方向與可能後果。'],
    ['寶劍皇后','Queen of Swords','清醒的判斷與明確界線能保護重要價值，坦率但不必刻薄。','失望可能使判斷變得苛刻；辨認偏見，讓事實與感受各有位置。'],
    ['寶劍國王','King of Swords','以邏輯、公正與專業知識處理問題，清楚說明決策依據。','理性可能被拿來壓制或操控；重新檢視權力、證據與公平性。'],
  ]},
  { id:'pentacles', label:'錢幣', symbol:'❖', domain:'工作、資源與身體生活', cards:[
    ['錢幣一','Ace of Pentacles','新的工作、學習或資源機會值得把握，讓計畫建立在可行基礎上。','機會尚未成熟或資源運用不當；先確認成本、條件與長期價值。'],
    ['錢幣二','Two of Pentacles','在多項責任間靈活調度，調整節奏以維持實際平衡。','承擔過量造成失衡；刪減不必要的事，重新安排優先順序。'],
    ['錢幣三','Three of Pentacles','技藝與合作共同累積成果；清楚分工並尊重彼此專長。','溝通或品質未達共識；確認標準、責任與需要補強之處。'],
    ['錢幣四','Four of Pentacles','穩健管理資源有其價值，也要避免因害怕失去而拒絕流動。','控制或囤積帶來緊繃；在安全範圍內練習分享與調整。'],
    ['錢幣五','Five of Pentacles','匱乏感或現實壓力值得正視；尋求可用資源，不必獨自承受。','處境開始好轉，援助逐漸可見；願意開口能讓支持進來。'],
    ['錢幣六','Six of Pentacles','給予與接受需要平衡；確認交換公平，也讓善意不附帶控制。','資源分配不均或援助附帶條件；重新協商界線與互惠方式。'],
    ['錢幣七','Seven of Pentacles','長期投入需要耐心；檢視進度，讓等待與實際調整並行。','急著收成或持續投入失效方法；重新衡量成本與期待。'],
    ['錢幣八','Eight of Pentacles','持續練習與細心工作能累積專業；專注品質，也記得安排休息。','分心、拖延或過度完美主義減慢進展；回到穩定可完成的節奏。'],
    ['錢幣九','Nine of Pentacles','獨立與踏實耕耘帶來成果；享受收穫，也保有自己的步調。','安全感過度依賴外物或他人；建立穩固的自信與生活界線。'],
    ['錢幣十','Ten of Pentacles','長期安定、家族支持或共享成果值得珍惜，思考如何延續它。','家人或資源議題出現張力；以公平溝通修補長期穩定的基礎。'],
    ['錢幣侍者','Page of Pentacles','踏實學習與新的實務機會值得投入，從穩定的小步開始。','計畫停留在想像或學習缺乏持續；設定期限並完成基本功。'],
    ['錢幣騎士','Knight of Pentacles','耐心、可靠與規律讓成果逐漸成形；持續履行承諾。','步調過慢或疏於檢視使工作停滯；重新設定可追蹤的進展。'],
    ['錢幣皇后','Queen of Pentacles','以務實方式照料生活與他人，讓安全感建立在可持續的習慣上。','過度付出或物質焦慮消耗心力；照顧自己並重整資源。'],
    ['錢幣國王','King of Pentacles','穩健管理資源並為長期成果負責，讓成功兼具慷慨與安全。','貪求、僵化或物質控制造成失衡；重新檢查價值與責任。'],
  ]},
];

const RANKS = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];

const majorCards: TarotCard[] = MAJOR_ARCANA.map(card => ({
  id: card.id,
  number: card.number,
  name: card.name,
  englishName: card.englishName,
  arcana: 'major',
  suit: null,
  suitLabel: null,
  symbol: card.symbol,
  keywords: { upright: card.uprightKeywords.split(','), reversed: card.reversedKeywords.split(',') },
  meanings: { upright: card.upright, reversed: card.reversed },
}));

const minorCards: TarotCard[] = SUITS.flatMap(suit => suit.cards.map(([name, englishName, upright, reversed], index) => ({
  id: `minor-${suit.id}-${String(index + 1).padStart(2, '0')}-${RANKS[index].toLowerCase()}`,
  number: String(index + 1).padStart(2, '0'),
  name,
  englishName,
  arcana: 'minor' as const,
  suit: suit.id,
  suitLabel: suit.label,
  symbol: suit.symbol,
  keywords: {
    upright: [suit.domain.split('、')[0], index < 10 ? '順勢發展' : '成熟表現'],
    reversed: [suit.domain.split('、')[0], '重新調整'],
  },
  meanings: { upright, reversed },
})));

export const TAROT_DECK: TarotCard[] = [...majorCards, ...minorCards];
export const TAROT_CARD_BY_ID = new Map(TAROT_DECK.map(card => [card.id, card]));

export const TAROT_CONTENT_VERSION = 'rws-zh-tw-1.1.0';

export const TAROT_SPREADS: Array<{ id: TarotSpreadId; title: string; description: string }> = [
  { id: 'single', title: '單張指引', description: '聚焦當下，抽取一張牌作為自我提問。' },
  { id: 'daily', title: '每日一抽', description: '依裝置當地日期每日抽取一次，重新整理不會換牌。' },
  { id: 'past-present-future', title: '過去・現在・方向', description: '整理脈絡、此刻狀態與可以前往的方向。' },
  { id: 'situation-challenge-advice', title: '情境・挑戰・建議', description: '看見目前情境、主要阻力與可採取的行動。' },
  { id: 'choice', title: '選擇之路', description: '比較兩種方向及選擇時值得留意的事。' },
];

export const TAROT_POSITIONS: Record<TarotSpreadId, string[]> = {
  single: ['當下指引'],
  daily: ['今日提示'],
  'past-present-future': ['過去的影響', '此刻的狀態', '可以前往的方向'],
  'situation-challenge-advice': ['目前情境', '主要挑戰', '可採取的行動'],
  choice: ['方向 A', '方向 B', '選擇時的提醒'],
};

export function tarotSpreadCount(spread: TarotSpreadId): number {
  return TAROT_POSITIONS[spread].length;
}

function secureRandomInt(maxExclusive: number): number {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('此瀏覽器無法提供安全亂數，請更新瀏覽器後再抽牌。');
  const range = 0x100000000;
  const limit = range - (range % maxExclusive);
  const sample = new Uint32Array(1);
  do cryptoApi.getRandomValues(sample); while (sample[0] >= limit);
  return sample[0] % maxExclusive;
}

export function drawCards(count: number, allowReversed: boolean, randomInt = secureRandomInt): Array<{ card: TarotCard; orientation: TarotOrientation }> {
  if (!Number.isInteger(count) || count < 1 || count > TAROT_DECK.length) throw new RangeError('抽牌數量超出牌組範圍');
  const shuffled = [...TAROT_DECK];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = randomInt(index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, count).map(card => ({
    card,
    orientation: allowReversed && randomInt(2) === 1 ? 'reversed' : 'upright',
  }));
}

export function findTarotCard(id: string): TarotCard | undefined {
  return TAROT_CARD_BY_ID.get(id);
}
