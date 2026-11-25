import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSavedGame } from './useAssemblyGame';

afterEach(() => vi.unstubAllGlobals());
describe('saved assembly state', () => {
  it('restores valid progress and removes duplicates or unknown components', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ installed: ['Skull', 'Skull', 'unknown'], attempts: 3, mistakes: 1, hints: 2, elapsedSeconds: 42 }) });
    expect(readSavedGame()).toMatchObject({ installed: ['Skull'], attempts: 3, mistakes: 1, hints: 2, elapsedSeconds: 42 });
  });
  it('falls back safely for malformed storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken' });
    expect(readSavedGame()).toMatchObject({ installed: [], attempts: 0, elapsedSeconds: 0 });
  });
});
