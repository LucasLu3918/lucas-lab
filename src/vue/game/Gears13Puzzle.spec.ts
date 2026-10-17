import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Gears13Puzzle from './Gears13Puzzle.vue';
import {
  gearHoles,
  gearToothPath,
  parseGears13Snapshot,
  type Gears13Action,
  type Gears13Snapshot,
} from './gears13';

const initial: Gears13Snapshot = {
  level: 'warm',
  goalHtml: '左邊金色的是曲柄（12 齒），右邊紅圈是輸出軸。讓輸出軸<b>和曲柄轉得一樣快、轉向也相同</b>：中間那個軸座放一顆「惰輪」，惰輪只改變方向，不改變速度比。',
  rules: ['從下方取齒輪：點一下選取，再點畫面上的黑色軸座放上去。再點一次軸座可以取下。', '齒輪要剛好咬合：太遠會空轉，太近會卡住（變紅）。'],
  viewBox: '-12 -15 44 30',
  reach: 5,
  layers: 1,
  selectedLayer: 0,
  selectedGear: null,
  ruler: false,
  sockets: [
    { id: 'S0', x: 0, y: 0, crank: true, output: false, empty: true, ariaLabel: '曲柄，空的' },
    { id: 'S1', x: 10, y: 0, crank: false, output: false, empty: true, ariaLabel: '軸座 1，空的' },
    { id: 'S2', x: 20, y: 0, crank: false, output: true, empty: true, ariaLabel: '輸出軸，空的' },
  ],
  gears: [{ id: 'S0.0', socket: 'S0', layer: 0, teeth: 12, x: 0, y: 0, phase: 0, speed: 1, bad: false }],
  tray: [8, 12, 16].map((teeth, index) => ({ index, teeth, used: false, selected: false })),
  rulerLines: [],
  crankAngle: -Math.PI / 2,
  crankX: 0,
  crankY: -5,
  outputMarker: { visible: false, x: 20, y: 0 },
  turns: 0,
  counter: '曲柄 0.00 圈',
  status: '輸出軸還沒有被帶動。',
  tone: '',
  canRun: false,
  running: false,
  runLabel: '轉動曲柄，看它們同速同向 ⟶',
};

describe('Gears13Puzzle', () => {
  it('renders the warm-up board, accessible socket controls and gear tray', () => {
    const wrapper = mount(Gears13Puzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });

    expect(wrapper.get('#bf-goal').text()).toContain('惰輪');
    expect(wrapper.findAll('.belfry-hit')).toHaveLength(2);
    expect(wrapper.get('.belfry-hit').attributes('aria-label')).toBe('軸座 1，空的');
    expect(wrapper.findAll('.belfry-gear-button')).toHaveLength(3);
    expect(wrapper.get('#bf-status').text()).toBe(initial.status);
    expect(wrapper.find('#bf-run').exists()).toBe(false);
  });

  it('sends gear selection and keyboard socket placement actions to legacy', async () => {
    const selected: Gears13Snapshot = {
      ...initial,
      selectedGear: 0,
      tray: initial.tray.map(gear => ({ ...gear, selected: gear.index === 0 })),
    };
    const onAction = vi.fn((_action: Gears13Action) => selected);
    const wrapper = mount(Gears13Puzzle, { props: { snapshot: initial, onAction } });

    await wrapper.get('.belfry-gear-button').trigger('click');
    await wrapper.get('.belfry-hit').trigger('keydown.enter');

    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'select-gear', index: 0 });
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'socket', id: 'S1' });
    expect(wrapper.get('.belfry-gear-button').attributes('aria-pressed')).toBe('true');
  });

  it('keeps layers, ruler, reset and run as typed legacy actions', async () => {
    const main: Gears13Snapshot = {
      ...initial,
      level: 'main',
      goalHtml: '左上角金色的曲柄齒輪（12 齒）轉 <b>13 圈</b>，右下紅圈的輸出軸要剛好轉 <b>1 圈</b>，而且<b>轉向和曲柄相同</b>。',
      rules: ['金色是下層、銅色是上層。'],
      viewBox: '-26 -26 108 74',
      reach: 6,
      layers: 2,
      sockets: ['S0', 'S1', 'S2', 'S3', 'S4'].map((id, index) => ({
        id, x: index * 10, y: 0, crank: index === 0, output: index === 2,
        empty: true, ariaLabel: id,
      })),
      tray: [6, 8, 12, 13, 16, 18, 24, 39].map((teeth, index) => ({ index, teeth, used: false, selected: false })),
      gears: [{ ...initial.gears[0], teeth: 12 }],
      canRun: true,
    };
    const onAction = vi.fn((_action: Gears13Action) => main);
    const wrapper = mount(Gears13Puzzle, { props: { snapshot: main, onAction } });

    await wrapper.get('[aria-pressed="false"].belfry-layer').trigger('click');
    await wrapper.get('#bf-ruler').trigger('click');
    await wrapper.get('#bf-reset').trigger('click');
    await wrapper.get('#bf-run').trigger('click');

    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      { type: 'select-layer', layer: 1 },
      { type: 'toggle-ruler' },
      { type: 'reset' },
      { type: 'run' },
    ]);
  });
});

describe('gears13 snapshot and gear artwork helpers', () => {
  it('accepts the bounded legacy warm-up snapshot', () => {
    expect(parseGears13Snapshot(initial)).toEqual(initial);
  });

  it.each([
    null,
    { ...initial, goalHtml: '<img src=x onerror=alert(1)>' },
    { ...initial, sockets: initial.sockets.slice(1) },
    { ...initial, sockets: initial.sockets.map((socket, index) => index ? socket : { ...socket, x: Infinity }) },
    { ...initial, gears: [{ ...initial.gears[0], socket: 'S9' }] },
    { ...initial, tray: initial.tray.map((gear, index) => index ? gear : { ...gear, teeth: 999 }) },
    { ...initial, tone: 'unsafe' },
    { ...initial, rulerLines: Array.from({ length: 13 }, (_, index) => ({
      id: String(index), x1: 0, y1: 0, x2: 1, y2: 1, labelX: 0, labelY: 0, distance: '1',
    })) },
  ])('rejects an invalid snapshot', value => {
    expect(parseGears13Snapshot(value)).toBeNull();
  });

  it('builds bounded tooth paths and matching web details for tray gears', () => {
    expect(gearToothPath(8).split('L')).toHaveLength(32);
    expect(gearToothPath(39).split('L')).toHaveLength(156);
    expect(gearToothPath(5)).toBe('');
    expect(gearHoles(8)).toEqual([]);
    expect(gearHoles(12)).toHaveLength(5);
    expect(gearHoles(24)).toHaveLength(6);
  });
});
