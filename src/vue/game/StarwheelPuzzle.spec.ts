import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import StarwheelPuzzle from './StarwheelPuzzle.vue';
import {
  STARWHEEL_NUMERALS,
  parseStarwheelSnapshot,
  type StarwheelAction,
  type StarwheelSnapshot,
} from './starwheel';

const initial: StarwheelSnapshot = {
  notches: Array.from({ length: 13 }, (_, index) => ({
    index,
    numeral: index === 0 ? '' : STARWHEEL_NUMERALS[((8 * index) % 13) - 1],
    ruby: index === 0,
  })),
  lit: false,
  step: 1,
  running: false,
  solved: false,
  reducedMotion: false,
  hammerAngle: 0,
  toll: '',
  status: '撥爪還在紅寶石上。',
  tone: '',
};

describe('parseStarwheelSnapshot', () => {
  it('accepts the fixed thirteen-notch view and copies validated labels', () => {
    const parsed = parseStarwheelSnapshot(initial);

    expect(parsed).toEqual(initial);
    expect(parsed).not.toBe(initial);
    expect(parsed?.notches).not.toBe(initial.notches);
  });

  it.each([
    ['wrong notch count', { ...initial, notches: initial.notches.slice(1) }],
    ['unknown step', { ...initial, step: 13 }],
    ['wrong ruby position', { ...initial, notches: initial.notches.map((notch, index) => ({ ...notch, ruby: index === 1 })) }],
    ['duplicate numeral', { ...initial, notches: initial.notches.map((notch, index) => index === 2 ? { ...notch, numeral: initial.notches[1].numeral } : notch) }],
    ['unbounded hammer angle', { ...initial, hammerAngle: Number.MAX_VALUE }],
    ['unbounded feedback', { ...initial, status: 'x'.repeat(221) }],
    ['invalid feedback tone', { ...initial, tone: 'warning' }],
  ])('rejects %s', (_label, value) => {
    expect(parseStarwheelSnapshot(value)).toBeNull();
  });
});

describe('StarwheelPuzzle', () => {
  it('renders the original accessible wheel and keeps the engraving dark until lit', () => {
    const wrapper = mount(StarwheelPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });

    expect(wrapper.get('#bf-svg').attributes('aria-label')).toBe('十三格星輪');
    expect(wrapper.findAll('.wheel-notch')).toHaveLength(13);
    expect(wrapper.findAll('.wheel-glyph')).toHaveLength(12);
    expect(wrapper.find('.wheel-ruby').exists()).toBe(true);
    expect(wrapper.findAll('#wheel-engraving')).toHaveLength(0);
    expect(wrapper.get('#wheel-candle').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('#wheel-step').text()).toBe('撥爪每聲跨 1 格');
    expect(wrapper.get('#wheel-less').attributes('disabled')).toBeDefined();
  });

  it('returns candle, step and run actions and renders validated legacy snapshots', async () => {
    const lit: StarwheelSnapshot = { ...initial, lit: true, step: 2, status: '燭光照亮星輪。' };
    const running: StarwheelSnapshot = { ...lit, running: true, hammerAngle: 27.69, toll: '一', status: '敲鐘……' };
    const onAction = vi.fn((action: StarwheelAction) => {
      if (action.type === 'toggle-candle') return lit;
      if (action.type === 'adjust-step') return { ...lit, step: lit.step + action.delta };
      return running;
    });
    const wrapper = mount(StarwheelPuzzle, { props: { snapshot: initial, onAction } });

    await wrapper.get('#wheel-candle').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'toggle-candle' });
    expect(wrapper.get('#wheel-candle').text()).toBe('熄燭');
    expect(wrapper.findAll('#wheel-engraving')).toHaveLength(1);
    expect(wrapper.get('#bf-status').text()).toBe(lit.status);

    await wrapper.get('#wheel-more').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'adjust-step', delta: 1 });
    expect(wrapper.get('#wheel-step').text()).toBe('撥爪每聲跨 3 格');

    await wrapper.get('#bf-run').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'run' });
    expect(wrapper.get('#bf-run').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#wheel-toll').text()).toBe('一');
    expect(wrapper.get('.wheel-hammer-turn').attributes('transform')).toContain('27.69');
  });

  it('disables the upper step control at twelve and keeps run disabled while active', () => {
    const atLimit: StarwheelSnapshot = { ...initial, step: 12, running: true };
    const wrapper = mount(StarwheelPuzzle, { props: { snapshot: atLimit, onAction: vi.fn(() => atLimit) } });

    expect(wrapper.get('#wheel-more').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#bf-run').attributes('disabled')).toBeDefined();
  });
});
