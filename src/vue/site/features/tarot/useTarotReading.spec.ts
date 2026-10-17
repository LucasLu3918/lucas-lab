import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { clearTarotHistory } from './TarotHistoryRepository';
import { useTarotReading } from './useTarotReading';

describe('tarot reading state', () => {
  afterEach(() => clearTarotHistory());

  it('keeps the selected reading spread stable if the next mode is changed before revealing', () => {
    let reading!: ReturnType<typeof useTarotReading>;
    const Host = defineComponent({
      setup() {
        reading = useTarotReading();
        return () => h('div');
      },
    });
    const wrapper = mount(Host);

    reading.spread.value = 'daily';
    reading.startReading();
    expect(reading.readingSpread.value).toBe('daily');
    expect(reading.history.value).toHaveLength(1);

    reading.spread.value = 'deep-five';
    reading.revealCard(0);
    expect(reading.history.value).toHaveLength(1);
    expect(reading.history.value[0].spread).toBe('daily');

    wrapper.unmount();
  });
});
