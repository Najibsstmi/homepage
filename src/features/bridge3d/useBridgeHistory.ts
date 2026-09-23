import { useCallback, useState } from "react";
import type { BridgeDesign } from "./types";

interface HistoryState {
  past: BridgeDesign[];
  present: BridgeDesign;
  future: BridgeDesign[];
}

export function useBridgeHistory(initialDesign: BridgeDesign) {
  const [history, setHistory] = useState<HistoryState>({ past: [], present: initialDesign, future: [] });

  const commit = useCallback((next: BridgeDesign | ((current: BridgeDesign) => BridgeDesign)) => {
    setHistory((current) => {
      const nextDesign = typeof next === "function" ? next(current.present) : next;
      if (nextDesign === current.present) return current;
      return { past: [...current.past.slice(-49), current.present], present: nextDesign, future: [] };
    });
  }, []);

  const replace = useCallback((design: BridgeDesign) => {
    setHistory({ past: [], present: design, future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) return current;
      return {
        past: [...current.past, current.present],
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    design: history.present,
    commit,
    replace,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
