export interface BirthPlace {
  id: string;
  label: string;
  timeZone: string;
  latitude: number;
  longitude: number;
}

// Curated MVP locations avoid a geocoding service and keep all birth details in the browser.
export const BIRTH_PLACES: BirthPlace[] = [
  { id: 'taipei', label: '台灣・台北', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 },
  { id: 'taichung', label: '台灣・台中', timeZone: 'Asia/Taipei', latitude: 24.1477, longitude: 120.6736 },
  { id: 'kaohsiung', label: '台灣・高雄', timeZone: 'Asia/Taipei', latitude: 22.6273, longitude: 120.3014 },
  { id: 'tokyo', label: '日本・東京', timeZone: 'Asia/Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { id: 'seoul', label: '韓國・首爾', timeZone: 'Asia/Seoul', latitude: 37.5665, longitude: 126.978 },
  { id: 'shanghai', label: '中國・上海', timeZone: 'Asia/Shanghai', latitude: 31.2304, longitude: 121.4737 },
  { id: 'hong-kong', label: '香港', timeZone: 'Asia/Hong_Kong', latitude: 22.3193, longitude: 114.1694 },
  { id: 'singapore', label: '新加坡', timeZone: 'Asia/Singapore', latitude: 1.3521, longitude: 103.8198 },
  { id: 'bangkok', label: '泰國・曼谷', timeZone: 'Asia/Bangkok', latitude: 13.7563, longitude: 100.5018 },
  { id: 'new-delhi', label: '印度・新德里', timeZone: 'Asia/Kolkata', latitude: 28.6139, longitude: 77.209 },
  { id: 'dubai', label: '阿聯・杜拜', timeZone: 'Asia/Dubai', latitude: 25.2048, longitude: 55.2708 },
  { id: 'london', label: '英國・倫敦', timeZone: 'Europe/London', latitude: 51.5072, longitude: -0.1276 },
  { id: 'paris', label: '法國・巴黎', timeZone: 'Europe/Paris', latitude: 48.8566, longitude: 2.3522 },
  { id: 'berlin', label: '德國・柏林', timeZone: 'Europe/Berlin', latitude: 52.52, longitude: 13.405 },
  { id: 'new-york', label: '美國・紐約', timeZone: 'America/New_York', latitude: 40.7128, longitude: -74.006 },
  { id: 'toronto', label: '加拿大・多倫多', timeZone: 'America/Toronto', latitude: 43.6532, longitude: -79.3832 },
  { id: 'chicago', label: '美國・芝加哥', timeZone: 'America/Chicago', latitude: 41.8781, longitude: -87.6298 },
  { id: 'vancouver', label: '加拿大・溫哥華', timeZone: 'America/Vancouver', latitude: 49.2827, longitude: -123.1207 },
  { id: 'los-angeles', label: '美國・洛杉磯', timeZone: 'America/Los_Angeles', latitude: 34.0522, longitude: -118.2437 },
  { id: 'mexico-city', label: '墨西哥・墨西哥城', timeZone: 'America/Mexico_City', latitude: 19.4326, longitude: -99.1332 },
  { id: 'sao-paulo', label: '巴西・聖保羅', timeZone: 'America/Sao_Paulo', latitude: -23.5505, longitude: -46.6333 },
  { id: 'sydney', label: '澳洲・雪梨', timeZone: 'Australia/Sydney', latitude: -33.8688, longitude: 151.2093 },
  { id: 'auckland', label: '紐西蘭・奧克蘭', timeZone: 'Pacific/Auckland', latitude: -36.8509, longitude: 174.7645 },
];
