import { describe, expect, it, vi } from 'vitest';
import type { GameSavePort, LoadedGameProgress } from '../ports/GameSavePort';
import { LoadGameProgress } from './LoadGameProgress';
import { SaveGameProgress } from './SaveGameProgress';

interface TestState {
  room: number;
}

function loaded(overrides: Partial<LoadedGameProgress<TestState>> = {}): LoadedGameProgress<TestState> {
  return {
    state: { room: 2 },
    puzzles: ['library'],
    migrated: false,
    recovered: false,
    newer: false,
    ...overrides,
  };
}

function createPort(progress = loaded()) {
  return {
    load: vi.fn(() => progress),
    backup: vi.fn(() => true),
    save: vi.fn(() => true),
  } satisfies GameSavePort<TestState> & {
    load: ReturnType<typeof vi.fn>;
    backup: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
}

describe('LoadGameProgress', () => {
  it('backs up an ordinary current save without rewriting it', () => {
    const port = createPort();
    const result = new LoadGameProgress(port).execute();

    expect(result).toEqual({ progress: loaded(), saveBlocked: false });
    expect(port.backup).toHaveBeenCalledOnce();
    expect(port.save).not.toHaveBeenCalled();
  });

  it('normalizes a migrated save after attempting the usual backup', () => {
    const progress = loaded({ migrated: true });
    const port = createPort(progress);

    expect(new LoadGameProgress(port).execute().progress).toBe(progress);
    expect(port.backup).toHaveBeenCalledOnce();
    expect(port.save).toHaveBeenCalledOnce();
    expect(port.save).toHaveBeenCalledWith(progress);
  });

  it('normalizes a recovered save without replacing the recovery backup', () => {
    const progress = loaded({ recovered: true });
    const port = createPort(progress);

    expect(new LoadGameProgress(port).execute().progress).toBe(progress);
    expect(port.backup).not.toHaveBeenCalled();
    expect(port.save).toHaveBeenCalledWith(progress);
  });

  it('does not write or back up when a newer save version is present', () => {
    const progress = loaded({ newer: true });
    const port = createPort(progress);

    expect(new LoadGameProgress(port).execute()).toEqual({ progress, saveBlocked: true });
    expect(port.backup).not.toHaveBeenCalled();
    expect(port.save).not.toHaveBeenCalled();
  });
});

describe('SaveGameProgress', () => {
  it('delegates the snapshot when saving is allowed', () => {
    const port = createPort();
    const progress = { state: { room: 3 }, puzzles: ['library', 'mine'] };

    expect(new SaveGameProgress(port).execute(progress, { saveBlocked: false })).toEqual({ status: 'saved' });
    expect(port.save).toHaveBeenCalledOnce();
    expect(port.save).toHaveBeenCalledWith(progress);
  });

  it('does not overwrite a newer save', () => {
    const port = createPort();
    const progress = { state: { room: 3 }, puzzles: [] };

    expect(new SaveGameProgress(port).execute(progress, { saveBlocked: true })).toEqual({
      status: 'blocked-newer-version',
    });
    expect(port.save).not.toHaveBeenCalled();
  });

  it('reports unavailable storage when the engine cannot write', () => {
    const port = createPort();
    port.save.mockReturnValue(false);

    expect(new SaveGameProgress(port).execute(
      { state: { room: 3 }, puzzles: [] },
      { saveBlocked: false },
    )).toEqual({ status: 'storage-unavailable' });
  });
});
