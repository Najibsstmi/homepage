import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import bones from '../data/skeletonBones.json';
import { attemptPlacement, initialGame, undoPlacement, type GameState } from './game';

const KEY = 'edusim:skeleton-builder:v1';
const validIds = bones.map(b => b.id);
export function readSavedGame(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!saved || !Array.isArray(saved.installed)) return initialGame();
    const installed = [...new Set<string>(saved.installed.filter((id: unknown): id is string => typeof id === 'string' && validIds.includes(id)))];
    const num = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    const attempts = Math.max(num(saved.attempts), installed.length);
    return { ...initialGame(), installed, attempts, mistakes: Math.min(num(saved.mistakes), Math.max(0, attempts - installed.length)), hints: num(saved.hints), elapsedSeconds: num(saved.elapsedSeconds) };
  } catch { return initialGame(); }
}
export function useAssemblyGame() {
  const [game, setGame] = useState<GameState>(readSavedGame);
  const [mode, setMode] = useState<'build' | 'explore'>('build');
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState('Pilih tulang, kemudian seret atau ketik pada kedudukan yang betul.');
  const gameRef = useRef(game);
  useLayoutEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { /* Storage may be disabled. */ } }, [game]);
  useEffect(() => {
    if (mode !== 'build' || game.installed.length === validIds.length) return;
    const timer = window.setInterval(() => setGame(g => ({ ...g, elapsedSeconds: g.elapsedSeconds + 1 })), 1000);
    return () => window.clearInterval(timer);
  }, [mode, game.installed.length]);
  const place = useCallback((id: string, success: boolean) => {
    if (gameRef.current.installed.includes(id)) return;
    setGame(g => attemptPlacement(g, id, validIds, success));
    setFeedback(success ? 'Betul! Tulang berjaya dipasang.' : 'Belum tepat. Cuba semak kedudukan dan sisi tulang.');
    if (success) { setSelected(null); setHint(false); }
  }, []);
  const select = useCallback((id: string) => { setSelected(id); setHint(false); setFeedback('Seret tulang yang dipilih, atau ketik lokasi pemasangannya.'); }, []);
  const showHint = () => { if (!selected) return; setHint(true); setGame(g => ({ ...g, hints: g.hints + 1 })); };
  const undo = () => { setGame(g => undoPlacement(g)); setSelected(null); setHint(false); setFeedback('Pemasangan terakhir telah dibatalkan.'); };
  const reset = () => { setGame(initialGame()); setSelected(null); setHint(false); setMode('build'); setFeedback('Permainan telah dimulakan semula.'); try { localStorage.removeItem(KEY); } catch { /* unavailable */ } };
  return { game, mode, setMode, selected, setSelected, hint, feedback, place, select, showHint, undo, reset };
}
