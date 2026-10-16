import type { AudioPlayerPort } from './AudioPlayerPort';

export function mountMusicPlayer(root: HTMLElement, audio: AudioPlayerPort): () => void;
