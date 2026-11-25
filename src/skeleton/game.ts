import { Quaternion, Vector3 } from 'three';

export type Mode = 'guided' | 'independent' | 'master' | 'explore';
export type Transform = { position: [number, number, number]; quaternion: [number, number, number, number] };
export type GameState = { mode: Mode; installed: string[]; attempts: number; mistakes: number; hints: number; elapsedSeconds: number };
export const TOTAL_COMPONENTS = 36;
export const initialGame = (mode: Mode = 'guided'): GameState => ({ mode, installed: [], attempts: 0, mistakes: 0, hints: 0, elapsedSeconds: 0 });

/** Positions must be in the same scene coordinate space. Rotation tolerance is in radians. */
export function validatePlacement(actual: Transform, target: Transform, positionTolerance: number, rotationTolerance: number): boolean {
  const values = [...actual.position, ...actual.quaternion, ...target.position, ...target.quaternion, positionTolerance, rotationTolerance];
  if (values.some((n) => !Number.isFinite(n)) || positionTolerance < 0 || rotationTolerance < 0) return false;
  const a = new Quaternion(...actual.quaternion);
  const b = new Quaternion(...target.quaternion);
  if (a.lengthSq() < 1e-12 || b.lengthSq() < 1e-12) return false;
  return new Vector3(...actual.position).distanceTo(new Vector3(...target.position)) <= positionTolerance && a.normalize().angleTo(b.normalize()) <= rotationTolerance;
}

export function attemptPlacement(state: GameState, id: string, validIds: readonly string[], success: boolean): GameState {
  if (!validIds.includes(id) || state.installed.includes(id) || state.mode === 'explore') return state;
  return { ...state, attempts: state.attempts + 1, mistakes: state.mistakes + (success ? 0 : 1), installed: success ? [...state.installed, id] : state.installed };
}
export function undoPlacement(state: GameState): GameState {
  return { ...state, installed: state.installed.slice(0, -1) };
}
export function metrics(state: GameState) {
  return { progress: state.installed.length / TOTAL_COMPONENTS * 100, accuracy: state.attempts === 0 ? 0 : (state.attempts - state.mistakes) / state.attempts * 100 };
}
