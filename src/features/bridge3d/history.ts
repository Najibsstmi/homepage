import type { BridgeDesign } from "./types";
import { withDisplayNumbers } from "./displayLabels";
export interface HistoryState { past: BridgeDesign[]; present: BridgeDesign; future: BridgeDesign[] }
export type HistoryAction = { type: "commit"; next: BridgeDesign | ((design: BridgeDesign) => BridgeDesign) }
  | { type: "replace"; design: BridgeDesign } | { type: "undo" | "redo" };
export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "replace") return { past: [], present: withDisplayNumbers(action.design), future: [] };
  if (action.type === "commit") {
    const next = typeof action.next === "function" ? action.next(state.present) : action.next;
    return next === state.present ? state : { past: [...state.past.slice(-49), state.present],
      present: withDisplayNumbers(next), future: [] };
  }
  if (action.type === "undo") {
    const previous = state.past.at(-1);
    return previous ? { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] } : state;
  }
  const next = state.future[0];
  return next ? { past: [...state.past, state.present], present: next, future: state.future.slice(1) } : state;
}
