import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import bones from '../data/skeletonBones.json';
import manifest from '../../public/skeleton/manifest.json';
import { attemptPlacement, initialGame, isPlacementAtTarget, metrics, undoPlacement } from './game';

describe('complete assembly using original model targets', () => {
  const ids = bones.map(bone => bone.id);
  const targets = new Map(manifest.components.map(entry => [entry.id, { world: new Vector3(...entry.targetPosition as [number, number, number]) }]));
  it('accepts every original transform and reaches 36/36', () => {
    let state = initialGame();
    for (const id of ids) {
      const target = targets.get(id)!;
      state = attemptPlacement(state, id, ids, isPlacementAtTarget(id, target.world, targets));
    }
    expect(state.installed).toHaveLength(36);
    expect(metrics(state)).toEqual({ progress: 100, accuracy: 100 });
    expect(undoPlacement(state).installed).toHaveLength(35);
  });
  it('rejects the opposite anatomical side for every paired bone', () => {
    for (const id of ids.filter(id => id.endsWith('_L'))) {
      const other = id.slice(0, -2) + '_R';
      expect(isPlacementAtTarget(id, targets.get(other)!.world, targets)).toBe(false);
    }
  });
  it('rejects unrelated positions without reducing progress', () => {
    const id = ids[0];
    const state = attemptPlacement(initialGame(), id, ids, isPlacementAtTarget(id, new Vector3(10, 10, 10), targets));
    expect(state.installed).toHaveLength(0);
    expect(state.attempts).toBe(1);
    expect(state.mistakes).toBe(1);
  });
});
