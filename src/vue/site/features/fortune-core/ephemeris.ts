// 天體位置與上升點的共用原語。西洋占星與吠陀占星都以這裡的地心黃道經度為基礎，各模組不互相依賴。
import * as Astronomy from 'astronomy-engine';

export function normalize(degrees: number): number {
  return (degrees % 360 + 360) % 360;
}

/** 地心視黃道經度（度，0 至 360），含光行差修正。 */
export function geoEclipticLongitude(body: Astronomy.Body, instant: Date): number {
  const vector = Astronomy.GeoVector(body, instant, true);
  return normalize(Astronomy.Ecliptic(vector).elon);
}

/** 依當地恆星時與黃赤交角估算上升點與天頂（黃經，度）。 */
export function calculateAscendantAndMidheaven(instant: Date, latitude: number, longitude: number) {
  const localSidereal = normalize((Astronomy.SiderealTime(instant) + longitude / 15) * 15) * Math.PI / 180;
  const obliquity = Astronomy.e_tilt(new Astronomy.AstroTime(instant)).tobl * Math.PI / 180;
  const latitudeRadians = latitude * Math.PI / 180;
  const x = Math.sin(localSidereal) * Math.cos(obliquity) + Math.tan(latitudeRadians) * Math.sin(obliquity);
  const y = -Math.cos(localSidereal);
  const ascendant = normalize(Math.atan2(y, x) * 180 / Math.PI + 180);
  const mc = normalize(Math.atan2(Math.sin(localSidereal), Math.cos(localSidereal) * Math.cos(obliquity)) * 180 / Math.PI);
  return { ascendant, midheaven: mc };
}
