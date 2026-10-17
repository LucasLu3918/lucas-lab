import { describe, expect, it } from 'vitest';
import {
  emitInventorySelection,
  emitInventoryUpdate,
  readInventorySelection,
  readInventoryUpdate,
} from './inventoryEvents';
import { toInventoryItems } from './inventory';

describe('Blood Mirror inventory boundary', () => {
  it('maps known inventory IDs to the legacy item catalog and icon family', () => {
    const entries = toInventoryItems(['watch', 'glove', 'unknown']);

    expect(entries.map(({ id, name, keepsake }) => ({ id, name, keepsake }))).toEqual([
      { id: 'watch', name: '黃金懷錶', keepsake: false },
      { id: 'glove', name: '伊萊的黑手套', keepsake: true },
    ]);
    expect(entries[0]?.iconMarkup).toContain('<svg');
  });

  it('publishes inventory updates and reads only string IDs', () => {
    const target = new EventTarget();
    let received: string[] | null = null;
    target.addEventListener('blood-mirror:inventory-updated', event => {
      received = readInventoryUpdate(event);
    });

    emitInventoryUpdate(target, ['watch', 'glove']);
    expect(received).toEqual(['watch', 'glove']);
    expect(readInventoryUpdate(new CustomEvent('blood-mirror:inventory-updated', {
      detail: { inventory: ['watch', 3, null] },
    }))).toEqual(['watch']);
    expect(readInventoryUpdate(new Event('blood-mirror:inventory-updated'))).toBeNull();
  });

  it('publishes and parses selected item IDs without markup payloads', () => {
    const target = new EventTarget();
    let selected: string | null = null;
    target.addEventListener('blood-mirror:inventory-selected', event => {
      selected = readInventorySelection(event);
    });

    emitInventorySelection(target, 'watch');
    expect(selected).toBe('watch');
    expect(readInventorySelection(new CustomEvent('blood-mirror:inventory-selected', {
      detail: { id: { html: '<img>' } },
    }))).toBeNull();
  });
});
