import { describe, expect, it, vi } from 'vitest';
import { BrowserGameStorageAdapter, createBrowserGameStorageAdapter } from './BrowserGameStorageAdapter';

describe('Blood Mirror game storage boundary', () => {
  it('delegates reads and writes to the injected browser storage', () => {
    const storage = { getItem: vi.fn(() => 'saved'), setItem: vi.fn() };
    const adapter = new BrowserGameStorageAdapter(storage);

    expect(adapter.getItem('blood-mirror-v2')).toBe('saved');
    adapter.setItem('blood-mirror-v2', '{"version":2}');

    expect(storage.getItem).toHaveBeenCalledWith('blood-mirror-v2');
    expect(storage.setItem).toHaveBeenCalledWith('blood-mirror-v2', '{"version":2}');
  });

  it('handles a blocked localStorage getter and reports writes as unavailable', () => {
    const adapter = createBrowserGameStorageAdapter(() => { throw new Error('storage blocked'); });

    expect(adapter.getItem('blood-mirror-v2')).toBeNull();
    expect(() => adapter.setItem('blood-mirror-v2', '{}')).toThrow('Browser storage is unavailable.');
  });
});
