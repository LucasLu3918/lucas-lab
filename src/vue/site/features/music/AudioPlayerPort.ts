export interface AudioPlayerPort {
  src: string;
  currentTime: number;
  readonly currentSrc: string;
  readonly duration: number;
  readonly readyState: number;
  readonly paused: boolean;
  readonly seekable: TimeRanges;
  readonly buffered: TimeRanges;
  volume: number;
  muted: boolean;
  readonly playbackRate: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  destroy(): void;
}
