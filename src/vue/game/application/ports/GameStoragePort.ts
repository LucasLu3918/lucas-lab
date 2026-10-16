/** Minimal persistence boundary required by the existing Blood Mirror save engine. */
export interface GameStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
