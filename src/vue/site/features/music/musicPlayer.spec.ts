import { describe, expect, it, vi } from 'vitest';
import { BrowserAudioPlayerAdapter } from './BrowserAudioPlayerAdapter';
import { clampSeekTarget, isAudioTimeSeekable } from './audioSeek';

class FakeAudio extends EventTarget {
  src = '';
  currentSrc = '';
  currentTime = 0;
  duration = 180;
  readyState = 4;
  paused = true;
  volume = 0.9;
  muted = false;
  playbackRate = 1;
  seekable = {
    length: 1,
    start: () => 0,
    end: () => 30,
  } as TimeRanges;
  buffered = this.seekable;

  async play(): Promise<void> { this.paused = false; }
  pause(): void { this.paused = true; }
}

describe('Music audio boundary', () => {
  it('keeps the requested seek position inside the playable duration', () => {
    expect(clampSeekTarget(42, 180)).toBe(42);
    expect(clampSeekTarget(200, 180)).toBe(179.75);
    expect(clampSeekTarget(Number.NaN, 180)).toBe(0);
  });

  it('recognizes byte-range-backed seek windows with a small browser tolerance', () => {
    const ranges = new FakeAudio().seekable;
    expect(isAudioTimeSeekable(ranges, 30.4)).toBe(true);
    expect(isAudioTimeSeekable(ranges, 31)).toBe(false);
  });

  it('switches the current track through the port and removes audio listeners on destroy', () => {
    const element = new FakeAudio();
    const port = new BrowserAudioPlayerAdapter(element as unknown as HTMLAudioElement);
    const onTimeUpdate = vi.fn();
    port.addEventListener('timeupdate', onTimeUpdate);
    port.src = '/music/audio/next-track.m4a';

    expect(element.src).toBe('/music/audio/next-track.m4a');
    element.dispatchEvent(new Event('timeupdate'));
    expect(onTimeUpdate).toHaveBeenCalledTimes(1);

    port.destroy();
    element.dispatchEvent(new Event('timeupdate'));
    expect(onTimeUpdate).toHaveBeenCalledTimes(1);
  });
});
