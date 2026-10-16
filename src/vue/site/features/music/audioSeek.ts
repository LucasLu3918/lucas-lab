export function clampSeekTarget(target: number, duration: number): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  return Math.max(0, Math.min(safeTarget, Math.max(0, safeDuration - 0.25)));
}

export function isAudioTimeSeekable(ranges: TimeRanges, target: number, tolerance = 0.5): boolean {
  for (let index = 0; index < ranges.length; index += 1) {
    if (ranges.start(index) <= target && target <= ranges.end(index) + tolerance) return true;
  }
  return false;
}
