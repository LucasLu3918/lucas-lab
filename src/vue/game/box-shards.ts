export type BoxShardId =
  | 'shard-library'
  | 'shard-ballroom'
  | 'shard-hunter'
  | 'shard-mine'
  | 'shard-crypt'
  | 'shard-queen'
  | 'shard-mirror';

export interface BoxShard {
  id: BoxShardId;
  act: number;
  title: string;
}

export interface BoxShardsSnapshot {
  shards: BoxShard[];
  placed: BoxShardId[];
  selected: BoxShardId | null;
  finished: boolean;
}

export type BoxShardsAction =
  | { type: 'select-shard'; id: BoxShardId }
  | { type: 'place-shard'; slotId: BoxShardId }
  | { type: 'skip-empty' };

const SHARDS: readonly BoxShard[] = [
  { id: 'shard-library', act: 1, title: '黑鐘書庫' },
  { id: 'shard-ballroom', act: 2, title: '血色舞會' },
  { id: 'shard-hunter', act: 3, title: '獵人的心臟' },
  { id: 'shard-mine', act: 4, title: '銀骨礦坑' },
  { id: 'shard-crypt', act: 5, title: '玻璃棺室' },
  { id: 'shard-queen', act: 6, title: '王后寢宮' },
  { id: 'shard-mirror', act: 7, title: '鏡中之國' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isShardId(value: unknown): value is BoxShardId {
  return typeof value === 'string' && SHARDS.some(shard => shard.id === value);
}

function parseShard(value: unknown): BoxShard | null {
  if (!isRecord(value) || !isShardId(value.id)) return null;
  const expected = SHARDS.find(shard => shard.id === value.id)!;
  if (value.act !== expected.act || value.title !== expected.title) return null;
  return { ...expected };
}

export function parseBoxShardsSnapshot(value: unknown): BoxShardsSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.shards) || value.shards.length > SHARDS.length
    || !Array.isArray(value.placed) || value.placed.length > value.shards.length
    || typeof value.finished !== 'boolean') return null;

  const shards = value.shards.map(parseShard);
  if (shards.some(shard => shard === null)) return null;
  const collectedIds = (shards as BoxShard[]).map(shard => shard.id);
  if (new Set(collectedIds).size !== collectedIds.length) return null;

  if (!value.placed.every(isShardId) || new Set(value.placed).size !== value.placed.length
    || !value.placed.every(id => collectedIds.includes(id))) return null;

  if (value.selected !== null && (!isShardId(value.selected) || !collectedIds.includes(value.selected)
    || value.placed.includes(value.selected))) return null;

  if (collectedIds.length > 0 && value.finished !== (value.placed.length === collectedIds.length)) return null;

  return {
    shards: shards as BoxShard[],
    placed: [...value.placed] as BoxShardId[],
    selected: value.selected as BoxShardId | null,
    finished: value.finished,
  };
}
