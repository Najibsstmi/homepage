import type { BridgeDesign } from "./types";

export function nextDisplayNumber(items: Array<{ displayNumber?: number }>) {
  return Math.max(items.length, ...items.map((item) => item.displayNumber ?? 0), 0) + 1;
}

/** Adds persistent presentation numbers to legacy files without changing IDs. */
export function withDisplayNumbers(design: BridgeDesign): BridgeDesign {
  const number = <T extends { displayNumber?: number }>(items: T[]): T[] => {
    let next = nextDisplayNumber(items) - 1;
    return items.map((item, index) => item.displayNumber ? item : {
      ...item, displayNumber: items.every((entry) => !entry.displayNumber) ? index + 1 : ++next,
    });
  };
  if ([...design.nodes, ...design.members, ...design.joints].every((item) => item.displayNumber)) return design;
  return { ...design, nodes: number(design.nodes), members: number(design.members), joints: number(design.joints) };
}

export function displayLabel(design: BridgeDesign, kind: "node" | "member" | "joint" | "global", id: string) {
  if (kind === "global") return "Keseluruhan jambatan";
  const items = kind === "node" ? design.nodes : kind === "member" ? design.members : design.joints;
  const index = items.findIndex((item) => item.id === id);
  const prefix = kind === "node" ? "Nod" : kind === "member" ? "Lidi" : "Sambungan";
  return index < 0 ? prefix : `${prefix} ${items[index].displayNumber ?? index + 1}`;
}
