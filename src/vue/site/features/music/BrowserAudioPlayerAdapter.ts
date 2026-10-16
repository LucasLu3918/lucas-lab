import type { AudioPlayerPort } from './AudioPlayerPort';

interface ListenerBinding {
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

export class BrowserAudioPlayerAdapter implements AudioPlayerPort {
  private readonly listeners = new Set<ListenerBinding>();

  constructor(private readonly audio: HTMLAudioElement) {}

  get src(): string { return this.audio.src; }
  set src(value: string) { this.audio.src = value; }
  get currentTime(): number { return this.audio.currentTime; }
  set currentTime(value: number) { this.audio.currentTime = value; }
  get currentSrc(): string { return this.audio.currentSrc; }
  get duration(): number { return this.audio.duration; }
  get readyState(): number { return this.audio.readyState; }
  get paused(): boolean { return this.audio.paused; }
  get seekable(): TimeRanges { return this.audio.seekable; }
  get buffered(): TimeRanges { return this.audio.buffered; }
  get volume(): number { return this.audio.volume; }
  set volume(value: number) { this.audio.volume = value; }
  get muted(): boolean { return this.audio.muted; }
  set muted(value: boolean) { this.audio.muted = value; }
  get playbackRate(): number { return this.audio.playbackRate; }

  play(): Promise<void> {
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void {
    this.audio.addEventListener(type, listener, options);
    this.listeners.add({ type, listener, options });
  }

  removeEventListener(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void {
    this.audio.removeEventListener(type, listener, options);
    for (const binding of this.listeners) {
      const capture = typeof binding.options === 'boolean' ? binding.options : binding.options?.capture;
      const requestedCapture = typeof options === 'boolean' ? options : options?.capture;
      if (binding.type === type && binding.listener === listener && capture === requestedCapture) {
        this.listeners.delete(binding);
      }
    }
  }

  destroy(): void {
    for (const { type, listener, options } of this.listeners) {
      this.audio.removeEventListener(type, listener, options);
    }
    this.listeners.clear();
  }
}
