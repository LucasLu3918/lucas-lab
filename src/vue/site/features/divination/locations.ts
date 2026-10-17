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
  { id: 'hong-kong', label: '香港', timeZone: 'Asia/Hong_Kong', latitude: 22.3193, longitude: 114.1694 },
  { id: 'singapore', label: '新加坡', timeZone: 'Asia/Singapore', latitude: 1.3521, longitude: 103.8198 },
  { id: 'london', label: '英國・倫敦', timeZone: 'Europe/London', latitude: 51.5072, longitude: -0.1276 },
  { id: 'new-york', label: '美國・紐約', timeZone: 'America/New_York', latitude: 40.7128, longitude: -74.006 },
  { id: 'los-angeles', label: '美國・洛杉磯', timeZone: 'America/Los_Angeles', latitude: 34.0522, longitude: -118.2437 },
  { id: 'sydney', label: '澳洲・雪梨', timeZone: 'Australia/Sydney', latitude: -33.8688, longitude: 151.2093 },
];
