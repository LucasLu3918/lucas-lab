export interface JournalEntry {
  id: string;
  label: string;
  text: string;
}

export interface JournalChapter {
  index: number;
  chapter: string;
  title: string;
  entries: JournalEntry[];
}

export interface JournalClueGroup {
  id: string;
  label: string;
  words: string[];
}

export interface JournalMemory {
  id: string;
  chapter: string;
  title: string;
  found: boolean;
  label: string | null;
  text: string | null;
}

export interface JournalShard {
  id: string;
  found: boolean;
  title: string | null;
}

export interface JournalAchievement {
  id: string;
  unlocked: boolean;
  title: string | null;
  text: string | null;
}

export interface JournalSnapshot {
  initialSelection: string;
  chapters: JournalChapter[];
  clues: JournalClueGroup[];
  clueCount: number;
  clueTotal: number;
  memories: JournalMemory[];
  memoriesAvailable: boolean;
  shards: JournalShard[];
  achievements: JournalAchievement[];
  closingTitle: string | null;
  secretTitle: string;
  canReadSecretEpilogue: boolean;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const string = (value: unknown): value is string => typeof value === 'string';
const nullableString = (value: unknown): value is string | null => value === null || string(value);

function parseEntries(value: unknown): JournalEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries: JournalEntry[] = [];
  for (const item of value) {
    if (!record(item) || !string(item.id) || !string(item.label) || !string(item.text)) return null;
    entries.push({ id: item.id, label: item.label, text: item.text });
  }
  return entries;
}

function parseChapters(value: unknown): JournalChapter[] | null {
  if (!Array.isArray(value)) return null;
  const chapters: JournalChapter[] = [];
  for (const item of value) {
    const entries = record(item) ? parseEntries(item.entries) : null;
    if (!record(item) || !Number.isInteger(item.index) || !string(item.chapter)
      || !string(item.title) || !entries) return null;
    chapters.push({ index: item.index as number, chapter: item.chapter, title: item.title, entries });
  }
  return chapters;
}

function parseClues(value: unknown): JournalClueGroup[] | null {
  if (!Array.isArray(value)) return null;
  const groups: JournalClueGroup[] = [];
  for (const item of value) {
    if (!record(item) || !string(item.id) || !string(item.label) || !Array.isArray(item.words)
      || !item.words.every(string)) return null;
    groups.push({ id: item.id, label: item.label, words: [...item.words] });
  }
  return groups;
}

function parseMemories(value: unknown): JournalMemory[] | null {
  if (!Array.isArray(value)) return null;
  const memories: JournalMemory[] = [];
  for (const item of value) {
    if (!record(item) || !string(item.id) || !string(item.chapter) || !string(item.title) || typeof item.found !== 'boolean'
      || !nullableString(item.label) || !nullableString(item.text)) return null;
    memories.push({ id: item.id, chapter: item.chapter, title: item.title, found: item.found, label: item.label, text: item.text });
  }
  return memories;
}

function parseShards(value: unknown): JournalShard[] | null {
  if (!Array.isArray(value)) return null;
  const shards: JournalShard[] = [];
  for (const item of value) {
    if (!record(item) || !string(item.id) || typeof item.found !== 'boolean' || !nullableString(item.title)) return null;
    shards.push({ id: item.id, found: item.found, title: item.title });
  }
  return shards;
}

function parseAchievements(value: unknown): JournalAchievement[] | null {
  if (!Array.isArray(value)) return null;
  const achievements: JournalAchievement[] = [];
  for (const item of value) {
    if (!record(item) || !string(item.id) || typeof item.unlocked !== 'boolean'
      || !nullableString(item.title) || !nullableString(item.text)) return null;
    achievements.push({ id: item.id, unlocked: item.unlocked, title: item.title, text: item.text });
  }
  return achievements;
}

export function parseJournalSnapshot(value: unknown): JournalSnapshot | null {
  if (!record(value) || !string(value.initialSelection) || !Number.isInteger(value.clueCount)
    || !Number.isInteger(value.clueTotal) || typeof value.memoriesAvailable !== 'boolean'
    || !string(value.secretTitle) || typeof value.canReadSecretEpilogue !== 'boolean'
    || !nullableString(value.closingTitle)) return null;

  const chapters = parseChapters(value.chapters);
  const clues = parseClues(value.clues);
  const memories = parseMemories(value.memories);
  const shards = parseShards(value.shards);
  const achievements = parseAchievements(value.achievements);
  if (!chapters || !clues || !memories || !shards || !achievements) return null;

  return {
    initialSelection: value.initialSelection,
    chapters,
    clues,
    clueCount: value.clueCount as number,
    clueTotal: value.clueTotal as number,
    memories,
    memoriesAvailable: value.memoriesAvailable,
    shards,
    achievements,
    closingTitle: value.closingTitle,
    secretTitle: value.secretTitle,
    canReadSecretEpilogue: value.canReadSecretEpilogue,
  };
}
