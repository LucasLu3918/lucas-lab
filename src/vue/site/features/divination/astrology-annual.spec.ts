import { describe, expect, it } from 'vitest';
import { calculateAstrology } from './astrology';
import { createAnnualAstrologyForecast } from './astrology-annual';
import { BIRTH_PLACES } from './locations';

// Golden list for the annual station scan (Mercury to Pluto turning points, UTC, to the minute). The scan samples every three days,
// which is shorter than the shortest retrograde (Mercury, about three weeks). It finds the same stations as the earlier daily scan.
describe('annual station scan', () => {
  it('lists the same turning points for the next year as the daily scan did', () => {
    const place = BIRTH_PLACES[0];
    const chart = calculateAstrology({
      birthDate: '1990-06-15', birthTime: '08:00', timeZone: place.timeZone, latitude: place.latitude, longitude: place.longitude, timeUnknown: false, disambiguation: 'earlier',
    });
    const annual = createAnnualAstrologyForecast(chart, place, new Date('2026-10-07T03:00:00Z'));
    const stations = annual.events
      .filter(event => event.kind === 'station')
      .map(event => `${event.title}|${event.exactAt.slice(0, 16)}|${event.sign}`);
    expect(stations).toEqual([
      '冥王星恢復順行|2026-10-16T02:23|水瓶座',
      '水星開始逆行|2026-10-24T07:14|天蠍座',
      '水星恢復順行|2026-11-13T15:52|天蠍座',
      '金星恢復順行|2026-11-14T00:20|天秤座',
      '土星恢復順行|2026-12-10T23:23|牡羊座',
      '海王星恢復順行|2026-12-12T22:13|牡羊座',
      '木星開始逆行|2026-12-13T00:58|獅子座',
      '火星開始逆行|2027-01-10T13:01|處女座',
      '天王星恢復順行|2027-02-08T12:23|雙子座',
      '水星開始逆行|2027-02-09T17:35|雙魚座',
      '水星恢復順行|2027-03-03T12:35|水瓶座',
      '火星恢復順行|2027-04-01T14:10|獅子座',
      '木星恢復順行|2027-04-13T02:13|獅子座',
      '冥王星開始逆行|2027-05-08T12:14|水瓶座',
      '水星開始逆行|2027-06-10T18:19|巨蟹座',
      '水星恢復順行|2027-07-04T19:40|雙子座',
      '海王星開始逆行|2027-07-09T22:50|牡羊座',
      '土星開始逆行|2027-08-09T17:52|牡羊座',
      '天王星開始逆行|2027-09-15T09:15|雙子座',
    ]);
  }, 20_000);
});
