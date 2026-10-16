import type { GameStoragePort } from '../application/ports/GameStoragePort';

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Adapts same-origin browser storage without making browser globals an import-time dependency. */
export class BrowserGameStorageAdapter implements GameStoragePort {
  constructor(private readonly storage: BrowserStorage | null) {}

  getItem(key: string): string | null {
    return this.storage?.getItem(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (!this.storage) throw new Error('Browser storage is unavailable.');
    this.storage.setItem(key, value);
  }
}

export function createBrowserGameStorageAdapter(
  resolveStorage: () => BrowserStorage = () => window.localStorage,
): BrowserGameStorageAdapter {
  try {
    return new BrowserGameStorageAdapter(resolveStorage());
  } catch {
    return new BrowserGameStorageAdapter(null);
  }
}
