export type StoryStatus = 'demo' | 'pending' | 'complete';
export type GameStatus = 'playable' | 'concept';
export type ProjectStatus = 'live' | 'repo' | 'concept';

export interface StoryChapter {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface Story {
  slug: string;
  title: string;
  description: string;
  category: string;
  status: StoryStatus;
  palette: string;
  symbol: string;
  cover: string;
  coverSmall: string;
  coverAlt: string;
  subtitle?: string;
  warnings?: string[];
  chapters?: StoryChapter[];
  manuscript?: string;
  expectedChapters?: number;
  expectedUnits?: number;
}

export interface Game {
  slug: string;
  title: string;
  description: string;
  category: string;
  status: GameStatus;
  palette: string;
  symbol: string;
  storySlug?: string;
  warnings?: string[];
  highlights?: string[];
  cover?: string;
  coverSmall?: string;
  coverAlt?: string;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  category: string;
  status: ProjectStatus;
  palette: string;
  symbol: string;
  highlights: string[];
  href?: string;
  hrefLabel?: string;
  repo?: string;
  shot?: string;
  shotSmall?: string;
  shotAlt?: string;
}

export interface Tool {
  title: string;
  description: string;
  category: string;
  trait: string;
  href: `https://${string}`;
  symbol: string;
}

export interface GalleryItem {
  title: string;
  description: string;
  palette: string;
  symbol: string;
  scene: string;
}

export interface JournalEntry {
  slug: string;
  date: string;
  title: string;
  description: string;
  paragraphs?: string[];
  symbol?: string;
  palette?: string;
}

export interface MusicTimelineStep {
  title: string;
  desc: string;
  start: number;
  end: number;
}

export interface MusicTrack {
  slug: string;
  title: string;
  english: string;
  edition: string;
  style: string;
  bpm: number;
  key: string;
  meter: string;
  vocal: string;
  instruments: string[];
  mood: string[];
  palette: string;
  description: string;
  highlights: string[];
  bestFor: string;
  timeline: MusicTimelineStep[];
  duration: number;
  audio: string;
  lyrics: string;
  peak?: number;
  energy?: number[];
}

export interface Catalog {
  stories: Story[];
  games: Game[];
  projects: Project[];
  tools: Tool[];
  gallery: GalleryItem[];
  journal: JournalEntry[];
  music: MusicTrack[];
}
