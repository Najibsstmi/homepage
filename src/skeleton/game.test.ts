import { describe, expect, it } from 'vitest';
import { attemptPlacement, initialGame, metrics, undoPlacement, validatePlacement } from './game';

const target = { position: [0, 0, 0] as [number, number, number], quaternion: [0, 0, 0, 1] as [number, number, number, number] };
describe('skeleton game rules', () => {
  it('checks position and rotation and accepts equivalent quaternion signs', () => {
    expect(validatePlacement({ position: [0.1, 0, 0], quaternion: [0, 0, 0, -1] }, target, 0.2, 0.1)).toBe(true);
    expect(validatePlacement({ position: [0.3, 0, 0], quaternion: [0, 0, 0, 1] }, target, 0.2, 0.1)).toBe(false);
    expect(validatePlacement({ position: [0, 0, 0], quaternion: [0, 1, 0, 0] }, target, 0.2, 0.1)).toBe(false);
    expect(validatePlacement({ position: [NaN, 0, 0], quaternion: [0, 0, 0, 1] }, target, 0.2, 0.1)).toBe(false);
  });
  it('records failures without losing progress, ignores duplicate placement, and preserves accuracy through undo', () => {
    const ids = ['left', 'right'];
    const first = attemptPlacement(initialGame(), 'left', ids, true);
    const failed = attemptPlacement(first, 'right', ids, false);
    expect(failed.installed).toEqual(['left']);
    expect(metrics(failed).accuracy).toBe(50);
    expect(attemptPlacement(failed, 'left', ids, true)).toBe(failed);
    expect(undoPlacement(failed).installed).toEqual([]);
    expect(metrics(initialGame()).accuracy).toBe(0);
  });
});
