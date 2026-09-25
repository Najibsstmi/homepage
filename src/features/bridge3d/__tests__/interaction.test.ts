import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Raycaster, Vector2, Vector3 } from "three";
import { addMember, createEmptyDesign, createStarterDesign, deleteMember, distance3, mirrorSide, replaceMember, splitMemberAtPoint, tryMoveNode } from "../model";
import { cloneProfile, OFFICIAL_2026_PROFILE } from "../profile";
import { calculateBridgeMass, getInventorySummary, physicalPieceId } from "../inventory";
import { displayLabel, withDisplayNumbers } from "../displayLabels";
import { buildPlaneOrigin, connectTargets, constrainPosition, initialInteraction, interactionReducer, rankSnapCandidates, resolveSnapTarget, type SnapTarget } from "../interaction";
import { historyReducer, type HistoryState } from "../history";
import { validateBridge } from "../validation";
import type { BridgeDesign } from "../types";

function sample() {
  const profile = cloneProfile(OFFICIAL_2026_PROFILE);
  profile.materialRules.cutWasteCm = 0.2;
  let design = createEmptyDesign(profile, "practice");
  design = addMember(design, { x: 0, y: 0, z: -4.5 }, { x: 12, y: 0, z: -4.5 }, "left").design;
  return addMember(design, { x: 0, y: 8, z: -4.5 }, { x: 12, y: 8, z: -4.5 }, "left").design;
}
function target(design: BridgeDesign, index: number): SnapTarget {
  const node = design.nodes[index];
  return { kind: "node", id: node.id, position: node.position, label: displayLabel(design, "node", node.id) };
}
function invariant(design: BridgeDesign) {
  const ids = new Set(design.nodes.map((node) => node.id));
  expect(ids.size).toBe(design.nodes.length);
  for (const member of design.members) {
    expect(ids.has(member.nodeA) && ids.has(member.nodeB)).toBe(true);
    const a = design.nodes.find((node) => node.id === member.nodeA)!;
    const b = design.nodes.find((node) => node.id === member.nodeB)!;
    expect(member.lengthCm).toBeCloseTo(distance3(a.position, b.position), 7);
    const usages = design.sticks.flatMap((stick) => stick.usedSegments.filter((usage) => usage.memberId === member.id));
    expect(usages).toHaveLength(1);
    expect(usages[0].sourceSegmentId).toBe(member.sourceSegmentId);
    expect(usages[0].lengthCm).toBeCloseTo(member.lengthCm, 2);
  }
  for (const stick of design.sticks) {
    expect(stick.remainingSegments.every((segment) => segment.lengthCm >= 0)).toBe(true);
    const total = stick.remainingSegments.reduce((sum, segment) => sum + segment.lengthCm, 0)
      + stick.usedSegments.reduce((sum, usage) => sum + usage.lengthCm + usage.cutWasteCm, 0);
    expect(total).toBeLessThanOrEqual(stick.originalLengthCm + 0.002);
    expect(total).toBeCloseTo(stick.originalLengthCm, 2);
  }
}
const mass = (design: BridgeDesign) => calculateBridgeMass(design.sticks, 0, design.profileSnapshot).massGram;

describe("safe building interactions", () => {
  it("clears pending endpoint on tool/mode/cancel transitions", () => {
    const state = { ...initialInteraction, tool: "add" as const, pending: target(sample(), 0) };
    expect(interactionReducer(state, { type: "tool", tool: "move" }).pending).toBeNull();
    expect(interactionReducer(state, { type: "mode", mode: "free" }).pending).toBeNull();
    expect(interactionReducer(state, { type: "cancel" }).pending).toBeNull();
  });
  it("rejects empty sky or grid second endpoints without consuming or splitting anything", () => {
    const design = sample();
    const first: SnapTarget = { kind: "member", id: design.members[0].id, position: { x: 6, y: 0, z: -4.5 }, label: "Lidi 1" };
    for (const second of [null, { kind: "grid" as const, position: { x: 40, y: 20, z: 6 }, label: "Grid" }]) {
      const result = connectTargets(design, first, second, "nodes", "left");
      expect(result.ok).toBe(false);
      expect(result.design).toBe(design);
    }
  });
  it("connects two nodes in one operation and leaves the new member selected", () => {
    const design = sample();
    const result = connectTargets(design, target(design, 0), target(design, 3), "nodes", "left");
    expect(result.ok).toBe(true);
    expect(result.design.members.length).toBe(design.members.length + 1);
    expect(result.selection?.kind).toBe("member");
    expect(result.design.members.at(-1)?.id).toBe(result.selection?.id);
    invariant(result.design);
  });
  it("retains original material when duplicate or too-short connection fails", () => {
    const design = sample();
    expect(connectTargets(design, target(design, 0), target(design, 1), "nodes", "left").design).toBe(design);
    expect(connectTargets(design, target(design, 0), target(design, 0), "nodes", "left").design).toBe(design);
  });
  it("only accepts free grid endpoints when explicitly enabled", () => {
    const design = sample();
    const a: SnapTarget = { kind: "grid", position: { x: 0, y: 12, z: 6 }, label: "Grid" };
    const b: SnapTarget = { kind: "grid", position: { x: 8, y: 12, z: 6 }, label: "Grid" };
    expect(connectTargets(design, a, b, "nodes", "right").ok).toBe(false);
    const result = connectTargets(design, a, b, "free", "right");
    expect(result.ok).toBe(true);
    expect(result.design.nodes.slice(-2).every((node) => node.position.z === 6)).toBe(true);
  });
  it("uses the current truss Z for free-point construction", () => {
    const design = createStarterDesign(OFFICIAL_2026_PROFILE);
    expect(buildPlaneOrigin(design, "left").z).toBe(-4.5);
    expect(buildPlaneOrigin(design, "right").z).toBe(4.5);
    expect(buildPlaneOrigin(createEmptyDesign(OFFICIAL_2026_PROFILE), "right").z).toBe(4.5);
  });
  it.each(["left", "right"] as const)("locks original truss Z while dragging on %s", (plane) => {
    const origin = { x: 1, y: 2, z: plane === "left" ? -4.5 : 4.5 };
    expect(constrainPosition({ x: 3.2, y: 6.7, z: 99 }, origin, plane, "xy")).toEqual({ x: 3, y: 7, z: origin.z });
  });
  it("locks base Y and each selected cross constraint", () => {
    const origin = { x: 2, y: 0, z: 4.5 };
    const point = { x: 3.3, y: 9, z: 7.2 };
    expect(constrainPosition(point, origin, "base", "xy").y).toBe(0);
    expect(constrainPosition(point, origin, "cross", "xy").z).toBe(4.5);
    expect(constrainPosition(point, origin, "cross", "xz").y).toBe(0);
    expect(constrainPosition(point, origin, "cross", "yz").x).toBe(2);
  });
  it("commits one completed drag and restores coordinates/material with one Undo/Redo", () => {
    const design = sample();
    const result = tryMoveNode(design, design.nodes[0].id, { x: -3, y: 2, z: -4.5 });
    expect(result.ok).toBe(true);
    const initial: HistoryState = { past: [], present: design, future: [] };
    const moved = historyReducer(initial, { type: "commit", next: result.design });
    expect(moved.past).toHaveLength(1);
    expect(historyReducer(moved, { type: "undo" }).present).toEqual(design);
    expect(historyReducer(historyReducer(moved, { type: "undo" }), { type: "redo" }).present).toEqual(result.design);
    invariant(result.design);
  });
  it("reverts impossible, overlapping and non-finite drags atomically", () => {
    const design = sample();
    for (const position of [{ x: -100, y: 0, z: -4.5 }, design.nodes[1].position, { x: NaN, y: 0, z: 0 }]) {
      const result = tryMoveNode(design, design.nodes[0].id, position);
      expect(result.ok).toBe(false);
      expect(result.design).toBe(design);
    }
    invariant(design);
  });
  it("lets competition violations update validation without blocking a possible edit", () => {
    const design = createStarterDesign(cloneProfile(OFFICIAL_2026_PROFILE));
    const result = tryMoveNode(design, design.nodes[1].id, { x: -14, y: 2.95, z: 0 });
    expect(result.ok).toBe(true);
    expect(validateBridge(result.design).items.find((item) => item.id === "pipe-clearance")?.severity).toBe("error");
  });
  it("uses stable friendly labels through deletion and JSON roundtrip", () => {
    const design = withDisplayNumbers(sample());
    const survivor = design.members[1];
    const label = displayLabel(design, "member", survivor.id);
    const deleted = deleteMember(design, design.members[0].id);
    expect(displayLabel(JSON.parse(JSON.stringify(deleted)), "member", survivor.id)).toBe(label);
    expect(label).toMatch(/^Lidi \d+$/);
    expect(label).not.toContain(survivor.id);
  });
  it("ranks nearby nodes ahead of overlapping members and grid", () => {
    const design = sample();
    const node = target(design, 0);
    const member: SnapTarget = { kind: "member", id: design.members[0].id, position: node.position, label: "Lidi 1" };
    expect(rankSnapCandidates([{ target: member, pixels: 0, depth: 0 }, { target: node, pixels: 12, depth: 1 }], "nodes")).toBe(node);
  });
  it("raycasts to node/member interiors and rejects the sky in default mode", () => {
    const design = sample();
    const camera = new PerspectiveCamera(42, 1, 0.1, 260);
    camera.position.set(6, 4, -40); camera.lookAt(6, 4, -4.5); camera.updateMatrixWorld();
    const raycaster = new Raycaster();
    const resolve = (point: Vector3) => {
      const projected = point.project(camera);
      raycaster.setFromCamera(new Vector2(projected.x, projected.y), camera);
      return resolveSnapTarget({ design, camera, ray: raycaster.ray, pointer: { x: (projected.x + 1) * 500, y: (1 - projected.y) * 500 },
        width: 1000, height: 1000, touch: true, mode: "nodes", plane: "left", cross: "xy" });
    };
    expect(resolve(new Vector3(0, 0, -4.5))?.kind).toBe("node");
    expect(resolve(new Vector3(6, 0, -4.5))?.kind).toBe("member");
    expect(resolve(new Vector3(30, 20, -4.5))).toBeNull();
  });
});

describe("interior connections retain a single physical piece", () => {
  it("splits without changing stick usage, offcuts, mass or cut waste; Undo restores it", () => {
    const design = sample();
    const result = splitMemberAtPoint(design, design.members[0].id, { x: 6, y: 0, z: -4.5 });
    expect(result.ok).toBe(true);
    expect(result.design.members.length).toBe(design.members.length + 1);
    expect(getInventorySummary(result.design.sticks)).toEqual(getInventorySummary(design.sticks));
    expect(mass(result.design)).toBe(mass(design));
    expect(result.design.members.slice(0, 2).map(physicalPieceId)).toEqual([design.members[0].id, design.members[0].id]);
    const history = historyReducer({ past: [], present: design, future: [] }, { type: "commit", next: result.design });
    expect(historyReducer(history, { type: "undo" }).present).toEqual(design);
    invariant(result.design);
  });
  it("splits and adds an interior connection in one undoable action", () => {
    const design = sample();
    const mid: SnapTarget = { kind: "member", id: design.members[0].id, position: { x: 6, y: 0, z: -4.5 }, label: "Lidi 1" };
    const result = connectTargets(design, mid, target(design, 2), "nodes", "left");
    expect(result.ok).toBe(true);
    const usedBefore = getInventorySummary(design.sticks).totalLengthUsedCm;
    const usedAfter = getInventorySummary(result.design.sticks).totalLengthUsedCm;
    expect(usedAfter - usedBefore).toBeCloseTo(10, 3);
    expect(result.design.joints.find((joint) => joint.nodeId === result.design.nodes.at(-1)?.id)?.connectedMemberIds).toHaveLength(3);
    invariant(result.design);
  });
  it("deletes or replaces a split physical piece only once", () => {
    const design = sample();
    const split = splitMemberAtPoint(design, design.members[0].id, { x: 6, y: 0, z: -4.5 }).design;
    const deleted = deleteMember(split, split.members[1].id);
    expect(deleted.members).toHaveLength(1);
    expect(getInventorySummary(deleted.sticks).totalLengthUsedCm).toBe(12);
    invariant(deleted);
    const replaced = replaceMember(split, split.members[1].id);
    expect(replaced.ok).toBe(true);
    expect(mass(replaced.design)).toBe(mass(split));
    invariant(replaced.design);
  });
  it("keeps subdivisions straight when moved and rejects bending without corruption", () => {
    const design = sample();
    const split = splitMemberAtPoint(design, design.members[0].id, { x: 6, y: 0, z: -4.5 });
    const moved = tryMoveNode(split.design, split.node!.id, { x: 7, y: 0, z: -4.5 });
    expect(moved.ok).toBe(true);
    expect(mass(moved.design)).toBe(mass(design));
    invariant(moved.design);
    const bent = tryMoveNode(split.design, split.node!.id, { x: 6, y: 1, z: -4.5 });
    expect(bent.ok).toBe(false);
    expect(bent.design).toBe(split.design);
  });
  it("mirrors analytical spans as one physical allocation, including cut waste", () => {
    const design = sample();
    const split = splitMemberAtPoint(design, design.members[0].id, { x: 6, y: 0, z: -4.5 }).design;
    const mirror = mirrorSide(split, "leftToRight");
    expect(mirror.ok).toBe(true);
    const waste = (d: BridgeDesign) => d.sticks.flatMap((stick) => stick.usedSegments).reduce((sum, usage) => sum + usage.cutWasteCm, 0);
    expect(waste(mirror.design)).toBeCloseTo(waste(split) * 2);
    expect(mass(mirror.design)).toBeCloseTo(mass(split)! * 2, 1);
    invariant(mirror.design);
  });
});
