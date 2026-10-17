// 星座資料與描述不依賴天文計算，獨立成模組，讓頁面無需載入 ephemeris 即可使用。

export const SIGNS = [
  { name: '牡羊座', element: '火', mode: '開創', text: '主動、直接，適合把想法化為清楚的第一步。' },
  { name: '金牛座', element: '土', mode: '固定', text: '重視穩定與感官經驗，適合用持續投入累積成果。' },
  { name: '雙子座', element: '風', mode: '變動', text: '好奇且善於連結資訊，適合交流、學習與保留彈性。' },
  { name: '巨蟹座', element: '水', mode: '開創', text: '重視情感安全與歸屬，適合照料重要關係和生活根基。' },
  { name: '獅子座', element: '火', mode: '固定', text: '以創造力和熱情展現自我，適合分享成果並尊重彼此空間。' },
  { name: '處女座', element: '土', mode: '變動', text: '擅長觀察細節和改善流程，適合讓實用判斷配合自我寬容。' },
  { name: '天秤座', element: '風', mode: '開創', text: '留意互惠、公平與美感，適合透過協商整理關係中的需要。' },
  { name: '天蠍座', element: '水', mode: '固定', text: '傾向深入理解情緒與信任，適合坦誠面對界線和轉變。' },
  { name: '射手座', element: '火', mode: '變動', text: '追求探索和意義，適合拓展視野並確認實際承諾。' },
  { name: '摩羯座', element: '土', mode: '開創', text: '重視長期目標與責任，適合拆解計畫並安排可持續進度。' },
  { name: '水瓶座', element: '風', mode: '固定', text: '重視理念、獨立與群體，適合提出新做法並保持互相理解。' },
  { name: '雙魚座', element: '水', mode: '變動', text: '想像力與同理心豐富，適合照料感受並建立清楚界線。' },
];

export function signDescription(signName: string, role: 'sun' | 'moon' | 'rising'): string {
  const sign = SIGNS.find(item => item.name === signName);
  if (!sign) return '';
  const roleText = role === 'sun' ? '核心動機與自我表達' : role === 'moon' ? '情緒需求與安全感' : '初次互動與面對環境的風格';
  return `${roleText}可參考${sign.name}的象徵特質。${sign.text}元素：${sign.element}；模式：${sign.mode}。`;
}
