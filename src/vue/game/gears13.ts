export type Gears13Level = 'warm' | 'main';

export interface Gears13Gear {
  id: string;
  socket: string;
  layer: number;
  teeth: number;
  x: number;
  y: number;
  phase: number;
  speed: number;
  bad: boolean;
}

export interface Gears13Socket {
  id: string;
  x: number;
  y: number;
  crank: boolean;
  output: boolean;
  empty: boolean;
  ariaLabel: string;
}

export interface Gears13RulerLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  distance: string;
}

export interface Gears13TrayGear {
  index: number;
  teeth: number;
  used: boolean;
  selected: boolean;
}

export interface Gears13Snapshot {
  level: Gears13Level;
  goalHtml: string;
  rules: string[];
  viewBox: string;
  reach: number;
  layers: number;
  selectedLayer: number;
  selectedGear: number | null;
  ruler: boolean;
  sockets: Gears13Socket[];
  gears: Gears13Gear[];
  tray: Gears13TrayGear[];
  rulerLines: Gears13RulerLine[];
  crankAngle: number;
  crankX: number;
  crankY: number;
  outputMarker: { visible: boolean; x: number; y: number };
  turns: number;
  counter: string;
  status: string;
  tone: '' | 'ok' | 'bad';
  canRun: boolean;
  running: boolean;
  runLabel: string;
}

export type Gears13Action =
  | { type: 'select-gear'; index: number | null }
  | { type: 'select-layer'; layer: number }
  | { type: 'socket'; id: string }
  | { type: 'toggle-ruler' }
  | { type: 'reset' }
  | { type: 'run' };

const GOALS: Record<Gears13Level, string> = {
  warm: '左邊金色的是曲柄（12 齒），右邊紅圈是輸出軸。讓輸出軸<b>和曲柄轉得一樣快、轉向也相同</b>：中間那個軸座放一顆「惰輪」，惰輪只改變方向，不改變速度比。',
  main: '左上角金色的曲柄齒輪（12 齒）轉 <b>13 圈</b>，右下紅圈的輸出軸要剛好轉 <b>1 圈</b>，而且<b>轉向和曲柄相同</b>。',
};

const LEVELS = {
  warm: { tray: [8, 12, 16], sockets: ['S0', 'S1', 'S2'], layers: 1 },
  main: { tray: [6, 8, 12, 13, 16, 18, 24, 39], sockets: ['S0', 'S1', 'S2', 'S3', 'S4'], layers: 2 },
} as const;

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const boundedText = (value: unknown, max = 240): value is string => typeof value === 'string' && value.length <= max;

export function parseGears13Snapshot(value: unknown): Gears13Snapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<Gears13Snapshot>;
  if (snapshot.level !== 'warm' && snapshot.level !== 'main') return null;
  const level = LEVELS[snapshot.level];
  if (snapshot.goalHtml !== GOALS[snapshot.level] || !Array.isArray(snapshot.rules)
    || !snapshot.rules.every(rule => boundedText(rule, 180))
    || !boundedText(snapshot.viewBox, 80) || !finite(snapshot.reach)
    || snapshot.reach < 1 || snapshot.reach > 10
    || snapshot.layers !== level.layers
    || !Number.isInteger(snapshot.selectedLayer) || (snapshot.selectedLayer ?? -1) < 0
    || (snapshot.selectedLayer ?? 99) >= level.layers
    || !(snapshot.selectedGear === null || (snapshot.selectedGear !== undefined
      && Number.isInteger(snapshot.selectedGear)
      && snapshot.selectedGear >= 0 && snapshot.selectedGear < level.tray.length))
    || typeof snapshot.ruler !== 'boolean' || !Array.isArray(snapshot.sockets)
    || !Array.isArray(snapshot.gears) || !Array.isArray(snapshot.tray)
    || !Array.isArray(snapshot.rulerLines) || !finite(snapshot.crankAngle)
    || !finite(snapshot.crankX) || !finite(snapshot.crankY) || !finite(snapshot.turns)
    || snapshot.turns < 0 || !boundedText(snapshot.counter, 120)
    || !boundedText(snapshot.status, 240)
    || !['', 'ok', 'bad'].includes(snapshot.tone ?? '')
    || typeof snapshot.canRun !== 'boolean' || typeof snapshot.running !== 'boolean'
    || !boundedText(snapshot.runLabel, 80)) return null;

  if (snapshot.sockets.length !== level.sockets.length || !snapshot.sockets.every((socket, index) =>
    socket && socket.id === level.sockets[index] && finite(socket.x) && finite(socket.y)
      && typeof socket.crank === 'boolean' && typeof socket.output === 'boolean'
      && typeof socket.empty === 'boolean' && boundedText(socket.ariaLabel, 120))) return null;

  if (snapshot.gears.length > 1 + (level.sockets.length - 1) * level.layers
    || !snapshot.gears.every(gear => gear && typeof gear.id === 'string'
      && level.sockets.includes(gear.socket as never)
      && Number.isInteger(gear.layer) && gear.layer >= 0 && gear.layer < level.layers
      && level.tray.includes(gear.teeth as never) && finite(gear.x) && finite(gear.y)
      && finite(gear.phase) && finite(gear.speed) && typeof gear.bad === 'boolean')) return null;

  if (snapshot.tray.length !== level.tray.length || !snapshot.tray.every((gear, index) =>
    gear && gear.index === index && gear.teeth === level.tray[index]
      && typeof gear.used === 'boolean' && typeof gear.selected === 'boolean')) return null;

  if (snapshot.rulerLines.length > 12 || !snapshot.rulerLines.every(line => line
    && boundedText(line.id, 16) && finite(line.x1) && finite(line.y1) && finite(line.x2)
    && finite(line.y2) && finite(line.labelX) && finite(line.labelY)
    && boundedText(line.distance, 12))) return null;

  const marker = snapshot.outputMarker;
  if (!marker || typeof marker.visible !== 'boolean' || !finite(marker.x) || !finite(marker.y)) return null;
  return snapshot as Gears13Snapshot;
}

export function gearToothPath(teeth: number): string {
  if (!Number.isInteger(teeth) || teeth < 6 || teeth > 39) return '';
  const pitch = teeth / 2;
  const step = Math.PI * 2 / teeth;
  const root = pitch - 1;
  const tip = pitch + 1;
  let path = '';
  for (let tooth = 0; tooth < teeth; tooth += 1) {
    for (const [offset, radius] of [[-.27, root], [-.16, tip], [.16, tip], [.27, root]]) {
      const angle = tooth * step + offset * step;
      path += `${path ? 'L' : 'M'}${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`;
    }
  }
  return `${path}Z`;
}

export function gearHoles(teeth: number) {
  if (!Number.isInteger(teeth) || teeth < 10 || teeth > 39) return [];
  const radius = teeth / 2;
  const web = Math.max(radius - 2.9, 1);
  const hub = Math.min(2.1, radius / 3);
  const count = teeth >= 14 ? 6 : 5;
  const ring = (web + hub + 0.8) / 2;
  const size = Math.max((web - hub - 1.4) / 2 * 0.62, 0.7);
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count;
    return { cx: Math.cos(angle) * ring, cy: Math.sin(angle) * ring, r: size };
  });
}
