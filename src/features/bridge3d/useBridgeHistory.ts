import { useCallback, useReducer } from "react";
import type { BridgeDesign } from "./types";
import { historyReducer } from "./history";
import { withDisplayNumbers } from "./displayLabels";

export function useBridgeHistory(initialDesign: BridgeDesign) {
  const [history, dispatch] = useReducer(historyReducer, initialDesign,
    (design) => ({ past: [], present: withDisplayNumbers(design), future: [] }));
  const commit = useCallback((next: BridgeDesign | ((current: BridgeDesign) => BridgeDesign)) => dispatch({ type: "commit", next }), []);
  const replace = useCallback((design: BridgeDesign) => dispatch({ type: "replace", design }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  return { design: history.present, commit, replace, undo, redo,
    canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
