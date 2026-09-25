import { Camera, Plane, Ray, Vector3 } from "three";
import { displayLabel } from "./displayLabels";
import { addMember, distance3, splitMemberAtPoint } from "./model";
import type { BridgeDesign, BuildPlane, BuildTool, Selection, Vector3Data } from "./types";

export type AddMode = "nodes" | "free";
export type DragConstraint = "xy" | "xz" | "yz";
export type SnapTarget =
  | { kind: "node"; id: string; position: Vector3Data; label: string }
  | { kind: "member"; id: string; position: Vector3Data; label: string }
  | { kind: "grid"; position: Vector3Data; label: string };
export type InteractionState = { tool: BuildTool; addMode: AddMode; pending: SnapTarget | null };
export const initialInteraction: InteractionState = { tool: "select", addMode: "nodes", pending: null };
export type InteractionAction =
  | { type: "tool"; tool: BuildTool } | { type: "mode"; mode: AddMode }
  | { type: "pending"; target: SnapTarget } | { type: "cancel" };
export function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  if (action.type === "tool") return { ...state, tool: action.tool, pending: null };
  if (action.type === "mode") return { ...state, addMode: action.mode, pending: null };
  if (action.type === "pending") return { ...state, pending: action.target };
  return { ...state, pending: null };
}

export const vector = (point: Vector3Data) => new Vector3(point.x, point.y, point.z);
export const coordinates = (point: Vector3Data) =>
  `X ${Number(point.x.toFixed(2))} · Y ${Number(point.y.toFixed(2))} · Z ${Number(point.z.toFixed(2))} cm`;
export function constraintAxis(plane: BuildPlane, cross: DragConstraint): "x" | "y" | "z" {
  return plane === "left" || plane === "right" ? "z" : plane === "base" ? "y" : cross === "xy" ? "z" : cross === "xz" ? "y" : "x";
}
export function constrainPosition(point: Vector3Data, origin: Vector3Data, plane: BuildPlane, cross: DragConstraint): Vector3Data {
  const axis = constraintAxis(plane, cross);
  return { x: Math.round(point.x), y: Math.max(0, Math.round(point.y)), z: Math.round(point.z), [axis]: origin[axis] };
}
export function movementPlane(origin: Vector3Data, plane: BuildPlane, cross: DragConstraint) {
  const axis = constraintAxis(plane, cross);
  const normal = new Vector3(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0);
  return new Plane().setFromNormalAndCoplanarPoint(normal, vector(origin));
}
export function buildPlaneOrigin(design: BridgeDesign, plane: BuildPlane): Vector3Data {
  if (plane !== "left" && plane !== "right") return { x: 0, y: 0, z: 0 };

  // The profile width is a limit. Free points must follow the truss plane
  // already used by the design, even when that truss is narrower.
  const sideNodeIds = new Set(design.members
    .filter((member) => member.side === plane)
    .flatMap((member) => [member.nodeA, member.nodeB]));
  const sideZs = design.nodes
    .filter((node) => sideNodeIds.has(node.id))
    .map((node) => node.position.z)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (sideZs.length) {
    const middle = Math.floor(sideZs.length / 2);
    const z = sideZs.length % 2 ? sideZs[middle] : (sideZs[middle - 1] + sideZs[middle]) / 2;
    return { x: 0, y: 0, z };
  }

  const rules = design.profileSnapshot.bridgeRules;
  const defaultWidth = Math.min(rules.maxWidthCm, Math.max(rules.minWidthCm, 9));
  return { x: 0, y: 0, z: (plane === "left" ? -1 : 1) * defaultWidth / 2 };
}

export interface SnapCandidate { target: SnapTarget; pixels: number; depth: number }
/** Explicit ranking means an invisible plane or broad member hitbox cannot steal a node. */
export function rankSnapCandidates(candidates: SnapCandidate[], mode: AddMode): SnapTarget | null {
  const eligible = candidates.filter(({ target }) => mode === "free" || target.kind !== "grid");
  const priority = { node: 0, member: 1, grid: 3 };
  eligible.sort((a, b) => priority[a.target.kind] - priority[b.target.kind]
    || a.pixels - b.pixels || a.depth - b.depth || a.target.label.localeCompare(b.target.label));
  return eligible[0]?.target ?? null;
}

export function resolveSnapTarget({
  design, camera, ray, pointer, width, height, touch, mode, plane, cross, visibility = "all",
}: {
  design: BridgeDesign; camera: Camera; ray: Ray; pointer: { x: number; y: number };
  width: number; height: number; touch: boolean; mode: AddMode; plane: BuildPlane;
  cross: DragConstraint; visibility?: string;
}): SnapTarget | null {
  const project = (point: Vector3Data) => {
    const projected = vector(point).project(camera);
    return { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2, depth: projected.z };
  };
  const candidates: SnapCandidate[] = [];
  const nodes = new Map(design.nodes.map((node) => [node.id, node]));
  const members = design.members.filter((member) =>
    !(visibility === "hideFront" && member.side === "right") && !(visibility === "hideRear" && member.side === "left"));
  const visibleNodeIds = new Set(members.flatMap((member) => [member.nodeA, member.nodeB]));
  for (const node of design.nodes) {
    if (!visibleNodeIds.has(node.id)) continue;
    const p = project(node.position);
    const pixels = Math.hypot(p.x - pointer.x, p.y - pointer.y);
    if (pixels <= (touch ? 24 : 14) && p.depth >= -1 && p.depth <= 1) {
      candidates.push({ target: { kind: "node", id: node.id, position: node.position,
        label: displayLabel(design, "node", node.id) }, pixels, depth: p.depth });
    }
  }
  for (const member of members) {
    const a = nodes.get(member.nodeA); const b = nodes.get(member.nodeB);
    if (!a || !b) continue;
    const closest = new Vector3();
    ray.distanceSqToSegment(vector(a.position), vector(b.position), undefined, closest);
    const p = project(closest);
    const pixels = Math.hypot(p.x - pointer.x, p.y - pointer.y);
    if (pixels > (touch ? 15 : 8) || p.depth < -1 || p.depth > 1) continue;
    const near = distance3(closest, a.position) < 0.5 ? a : distance3(closest, b.position) < 0.5 ? b : null;
    candidates.push({ target: near
      ? { kind: "node", id: near.id, position: near.position, label: displayLabel(design, "node", near.id) }
      : { kind: "member", id: member.id, position: { x: closest.x, y: closest.y, z: closest.z },
        label: `${displayLabel(design, "member", member.id)} · ${distance3(a.position, closest).toFixed(1)} cm dari hujung` },
    pixels, depth: p.depth });
  }
  if (mode === "free") {
    const origin = buildPlaneOrigin(design, plane);
    const hit = ray.intersectPlane(movementPlane(origin, plane, cross), new Vector3());
    if (hit && Math.abs(hit.x) <= 32 && hit.y >= 0 && hit.y <= 42 && Math.abs(hit.z) <= 32) {
      const position = constrainPosition(hit, origin, plane, cross);
      candidates.push({ target: { kind: "grid", position, label: `Grid: ${coordinates(position)}` }, pixels: Infinity, depth: 1 });
    }
  }
  return rankSnapCandidates(candidates, mode);
}

/** Resolve both targets atomically: a cancelled/invalid second point spends no material. */
export function connectTargets(design: BridgeDesign, start: SnapTarget, end: SnapTarget | null, mode: AddMode, plane: BuildPlane) {
  const fail = (reason: string) => ({ ok: false as const, design, selection: null as Selection, reason });
  if (!end || (mode === "nodes" && (start.kind === "grid" || end.kind === "grid"))) {
    return fail("Pilih nod atau sambungan yang sah. Gunakan Titik Bebas untuk ruang kosong.");
  }
  let next = design;
  const positions: Vector3Data[] = [];
  for (const target of [start, end]) {
    if (target.kind === "node") {
      const node = next.nodes.find((item) => item.id === target.id);
      if (!node) return fail("Nod tidak lagi wujud. Batal titik dan pilih semula.");
      positions.push(node.position);
    } else if (target.kind === "member") {
      // The first endpoint may have split the same source member already.
      const source = design.members.find((item) => item.id === target.id);
      const candidates = next.members.filter((item) => item.id === target.id ||
        (source && (item.physicalPieceId ?? item.id) === (source.physicalPieceId ?? source.id)));
      let found = false;
      for (const member of candidates) {
        const split = splitMemberAtPoint(next, member.id, target.position);
        if (split.ok && split.node && distance3(split.node.position, target.position) < 0.5) {
          next = split.design; positions.push(split.node.position); found = true; break;
        }
      }
      if (!found) return fail("Sambungan pada lidi tidak lagi sah.");
    } else positions.push(target.position);
  }
  const result = addMember(next, positions[0], positions[1], plane);
  if (!result.ok || !result.member) return fail(result.reason ?? "Lidi tidak dapat ditambah.");
  return { ...result, selection: { kind: "member", id: result.member.id } as Selection };
}
