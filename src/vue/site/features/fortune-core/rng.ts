// Two sources of randomness, kept apart on purpose:
// - seeded (deterministic) values are only for entertainment copy that should be stable within a day;
// - secure values are for anything the user experiences as a draw (cards, shuffles).

const UINT32_RANGE = 2 ** 32;

/** FNV-1a over the parts joined by '|'. Returns an unsigned 32-bit seed. */
export function hashSeed(...parts: string[]): number {
  let hash = 0x811c9dc5;
  for (const char of parts.join('|')) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, reproducible PRNG returning values in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/** Seed for content that should not change within one local day, e.g. dailySeed('2026-10-17', 'aries', 'day'). */
export function dailySeed(localDay: string, ...keys: string[]): number {
  return hashSeed(localDay, ...keys);
}

export function pickSeeded<T>(items: readonly T[], seed: number): T {
  if (items.length === 0) throw new RangeError('無法從空清單中挑選內容。');
  return items[Math.floor(seededRandom(seed)() * items.length)];
}

/** Uniform integer in [0, limit) from the Web Crypto API, with rejection sampling to avoid modulo bias. */
export function secureRandomInt(limit: number, cryptoApi: Crypto | null = globalThis.crypto ?? null): number {
  if (!cryptoApi?.getRandomValues) throw new Error('此瀏覽器無法提供安全亂數，請更新瀏覽器後再抽牌。');
  if (!Number.isInteger(limit) || limit <= 0) throw new RangeError('亂數範圍必須是正整數。');
  const sample = new Uint32Array(1);
  const maxUnbiased = UINT32_RANGE - (UINT32_RANGE % limit);
  do cryptoApi.getRandomValues(sample); while (sample[0] >= maxUnbiased);
  return sample[0] % limit;
}
