import { consumeStickSegment, createStickInventory, partitionPieceUsage, physicalPieceId, restorePhysicalPiece } from "./inventory";
import { nextDisplayNumber, withDisplayNumbers } from "./displayLabels";
import type {
  BridgeDesign,
  BridgeJoint,
  BridgeMember,
  BridgeNode,
  BuildPlane,
  CompetitionMode,
  CompetitionProfile,
  MemberRole,
  MemberSide,
  Vector3Data,
} from "./types";

export const distance3 = (a: Vector3Data, b: Vector3Data) =>
  Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);

export function createEmptyDesign(profile: CompetitionProfile, mode: CompetitionMode = "competition"): BridgeDesign {
  const now = new Date().toISOString();
  return {
    id: `bridge-${Date.now()}`,
    name: "Reka Bentuk Baharu",
    profileId: profile.id,
    profileSnapshot: structuredClone(profile),
    mode,
    createdAt: now,
    updatedAt: now,
    nodes: [],
    members: [],
    joints: [],
    sticks: createStickInventory(profile),
    selectedInventoryMode: "auto",
  };
}

export function sideForPlane(plane: BuildPlane): MemberSide {
  if (plane === "left" || plane === "right" || plane === "base") return plane;
  return "cross";
}

export function roleForPlane(plane: BuildPlane, a: Vector3Data, b: Vector3Data): MemberRole {
  if (plane === "cross") return "crossBracing";
  if (plane !== "base") return "truss";
  return Math.abs(b.x - a.x) >= Math.abs(b.z - a.z) ? "baseLongitudinal" : "baseBinding";
}

export function findNodeNear(nodes: BridgeNode[], point: Vector3Data, radiusCm = 0.8) {
  return nodes.find((node) => distance3(node.position, point) <= radiusCm) ?? null;
}

function ensureJoint(joints: BridgeJoint[], nodeId: string): BridgeJoint[] {
  if (joints.some((joint) => joint.nodeId === nodeId)) return joints;
  return [...joints, {
    id: `joint-${nodeId}`,
    displayNumber: nextDisplayNumber(joints),
    nodeId,
    connectedMemberIds: [],
    glueUsedCm: 0,
    glueMassGram: null,
    state: "unglued",
  }];
}

function syncJointMembers(joints: BridgeJoint[], members: BridgeMember[]): BridgeJoint[] {
  return joints.map((joint) => ({
    ...joint,
    connectedMemberIds: members
      .filter((member) => member.nodeA === joint.nodeId || member.nodeB === joint.nodeId)
      .map((member) => member.id),
  }));
}

export interface AddMemberResult {
  ok: boolean;
  design: BridgeDesign;
  member?: BridgeMember;
  reason?: string;
}

export function addMember(
  design: BridgeDesign,
  start: Vector3Data,
  end: Vector3Data,
  plane: BuildPlane,
  roleOverride?: MemberRole,
): AddMemberResult {
  design = withDisplayNumbers(design);
  if (![start.x, start.y, start.z, end.x, end.y, end.z].every(Number.isFinite)) {
    return { ok: false, design, reason: "Kedudukan tidak sah." };
  }
  const lengthCm = distance3(start, end);
  if (!Number.isFinite(lengthCm) || lengthCm < 0.5) {
    return { ok: false, design, reason: "Panjang lidi mesti sekurang-kurangnya 0.5 cm." };
  }

  const role = roleOverride ?? roleForPlane(plane, start, end);
  const maxForRole = role === "baseLongitudinal"
    ? design.profileSnapshot.bridgeRules.maxBaseLongitudinalSticks
    : role === "baseBinding"
      ? design.profileSnapshot.bridgeRules.maxBaseBindingSticks
      : null;
  if (maxForRole !== null) {
    const used = new Set(design.members.filter((member) => member.role === role).map(physicalPieceId)).size;
    if (design.mode === "competition" && used >= maxForRole) {
      return {
        ok: false,
        design,
        reason: `Peraturan pertandingan dilanggar: maksimum ${maxForRole} lidi ${role === "baseBinding" ? "pengikat tapak" : "memanjang tapak"}.`,
      };
    }
  }
  if (design.mode === "competition" && (role === "baseLongitudinal" || role === "baseBinding")) {
    const nodeById = new Map(design.nodes.map((node) => [node.id, node]));
    const existingLayers = new Set(
      design.members
        .filter((member) => member.role === "baseLongitudinal" || member.role === "baseBinding")
        .map((member) => {
          const a = nodeById.get(member.nodeA);
          const b = nodeById.get(member.nodeB);
          return Math.round((((a?.position.y ?? 0) + (b?.position.y ?? 0)) / 2) * 10) / 10;
        }),
    );
    const candidateLayer = Math.round(((start.y + end.y) / 2) * 10) / 10;
    if (!existingLayers.has(candidateLayer)
      && existingLayers.size >= design.profileSnapshot.bridgeRules.maxBaseLayers) {
      return {
        ok: false,
        design,
        reason: `Peraturan pertandingan dilanggar: maksimum ${design.profileSnapshot.bridgeRules.maxBaseLayers} lapisan tapak.`,
      };
    }
  }

  const nodes = [...design.nodes];
  let nodeA = findNodeNear(nodes, start, 1e-5);
  if (!nodeA) {
    nodeA = { id: `node-${crypto.randomUUID()}`, displayNumber: nextDisplayNumber(nodes), position: { ...start } };
    nodes.push(nodeA);
  }
  let nodeB = findNodeNear(nodes, end, 1e-5);
  if (!nodeB) {
    nodeB = { id: `node-${crypto.randomUUID()}`, displayNumber: nextDisplayNumber(nodes), position: { ...end } };
    nodes.push(nodeB);
  }
  if (nodeA.id === nodeB.id) return { ok: false, design, reason: "Pilih dua titik yang berlainan." };

  if (design.members.some((member) =>
    (member.nodeA === nodeA.id && member.nodeB === nodeB.id)
    || (member.nodeA === nodeB.id && member.nodeB === nodeA.id))) {
    return { ok: false, design, reason: "Lidi ini sudah wujud." };
  }

  const memberId = `member-${crypto.randomUUID()}`;
  const inventory = consumeStickSegment(
    design.sticks,
    memberId,
    lengthCm,
    design.profileSnapshot.materialRules.cutWasteCm,
    design.selectedInventoryMode,
  );
  if (!inventory.ok || !inventory.sourceStickId || !inventory.sourceSegmentId) {
    return { ok: false, design, reason: inventory.reason };
  }

  const member: BridgeMember = {
    id: memberId,
    displayNumber: nextDisplayNumber(design.members),
    physicalPieceId: memberId,
    nodeA: nodeA.id,
    nodeB: nodeB.id,
    sourceStickId: inventory.sourceStickId,
    sourceSegmentId: inventory.sourceSegmentId,
    lengthCm,
    role,
    side: sideForPlane(plane),
    state: "normal",
  };
  const members = [...design.members, member];
  let joints = ensureJoint(ensureJoint(design.joints, nodeA.id), nodeB.id);
  joints = syncJointMembers(joints, members);

  return {
    ok: true,
    member,
    design: {
      ...design,
      nodes,
      members,
      joints,
      sticks: inventory.sticks,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function deleteMember(design: BridgeDesign, memberId: string): BridgeDesign {
  design = withDisplayNumbers(design);
  const member = design.members.find((item) => item.id === memberId);
  if (!member) return design;
  const piece = design.members.filter((item) => physicalPieceId(item) === physicalPieceId(member));
  const members = design.members.filter((item) => physicalPieceId(item) !== physicalPieceId(member));
  const connectedNodeIds = new Set(members.flatMap((item) => [item.nodeA, item.nodeB]));
  const nodes = design.nodes.filter((node) => connectedNodeIds.has(node.id));
  return {
    ...design,
    members,
    nodes,
    joints: syncJointMembers(
      design.joints.filter((joint) => connectedNodeIds.has(joint.nodeId)),
      members,
    ),
    sticks: restorePhysicalPiece(design.sticks, piece),
    updatedAt: new Date().toISOString(),
  };
}

export interface MoveNodeResult {
  ok: boolean;
  design: BridgeDesign;
  reason?: string;
}

export function tryMoveNode(design: BridgeDesign, nodeId: string, position: Vector3Data): MoveNodeResult {
  const fail = (reason: string): MoveNodeResult => ({ ok: false, design, reason });
  const original = design.nodes.find((node) => node.id === nodeId);
  if (!original || !Object.values(position).every(Number.isFinite)) return fail("Kedudukan tidak sah.");
  if (distance3(original.position, position) < 1e-6) return { ok: true, design };
  if (design.nodes.some((node) => node.id !== nodeId && distance3(node.position, position) < 0.1)) {
    return fail("Nod sudah wujud di sini. Pilih lokasi lain; gunakan Tambah lidi untuk menyambung nod.");
  }
  const nodes = design.nodes.map((node) => node.id === nodeId ? { ...node, position: { ...position } } : node);
  const byId = new Map(nodes.map((node) => [node.id, node.position]));
  const affected = new Set(design.members.filter((member) => member.nodeA === nodeId || member.nodeB === nodeId).map(physicalPieceId));
  const groups = [...affected].map((id) => design.members.filter((member) => physicalPieceId(member) === id));
  const resized = new Map<string, BridgeMember>();
  let sticks = groups.reduce((current, group) => restorePhysicalPiece(current, group), design.sticks);
  for (const group of groups) {
    const spans = group.map((member) => ({ ...member, lengthCm: distance3(byId.get(member.nodeA)!, byId.get(member.nodeB)!) }));
    if (spans.some((member) => !Number.isFinite(member.lengthCm) || member.lengthCm < 0.5)) {
      return fail("Kedudukan tidak sah: panjang setiap bahagian lidi mesti sekurang-kurangnya 0.5 cm.");
    }
    // Analytical connections do not turn one uncut skewer into bendable pieces.
    if (spans.length > 1) {
      const nodeIds = [...new Set(spans.flatMap((member) => [member.nodeA, member.nodeB]))];
      const points = nodeIds.map((id) => byId.get(id)!);
      const diameter = Math.max(...points.flatMap((a) => points.map((b) => distance3(a, b))));
      if (Math.abs(diameter - spans.reduce((sum, span) => sum + span.lengthCm, 0)) > 1e-4) {
        return fail("Lidi asal mesti kekal lurus. Alih sambungan sepanjang lidi atau ganti lidi dahulu.");
      }
    }
    const totalLength = spans.reduce((sum, member) => sum + member.lengthCm, 0);
    const allocation = consumeStickSegment(sticks, spans[0].id, totalLength,
      design.profileSnapshot.materialRules.cutWasteCm, "auto");
    if (!allocation.ok || !allocation.sourceStickId || !allocation.sourceSegmentId) {
      return fail("Baki lidi tidak mencukupi untuk kedudukan baharu.");
    }
    const allocated = spans.map((member) => ({
      ...member, sourceStickId: allocation.sourceStickId!, sourceSegmentId: allocation.sourceSegmentId!,
    }));
    sticks = partitionPieceUsage(allocation.sticks, allocated[0].id, allocated);
    allocated.forEach((member) => resized.set(member.id, member));
  }
  return { ok: true, design: { ...design, nodes,
    members: design.members.map((member) => resized.get(member.id) ?? member),
    sticks, updatedAt: new Date().toISOString() } };
}

export function moveNode(design: BridgeDesign, nodeId: string, position: Vector3Data): BridgeDesign {
  return tryMoveNode(design, nodeId, position).design;
}

export function replaceMember(design: BridgeDesign, memberId: string): AddMemberResult {
  const member = design.members.find((item) => item.id === memberId);
  if (!member) return { ok: false, design, reason: "Lidi tidak ditemui." };
  const piece = design.members.filter((item) => physicalPieceId(item) === physicalPieceId(member));
  const restored = restorePhysicalPiece(design.sticks, piece);
  const allocation = consumeStickSegment(restored, piece[0].id, piece.reduce((sum, item) => sum + item.lengthCm, 0),
    design.profileSnapshot.materialRules.cutWasteCm, "new");
  if (!allocation.ok || !allocation.sourceStickId || !allocation.sourceSegmentId) {
    return { ok: false, design, reason: allocation.reason };
  }
  const replacements = piece.map((item) => ({ ...item, sourceStickId: allocation.sourceStickId!,
    sourceSegmentId: allocation.sourceSegmentId!, state: "normal" as const }));
  const byId = new Map(replacements.map((item) => [item.id, item]));
  return { ok: true, member: byId.get(memberId), design: { ...design,
    members: design.members.map((item) => byId.get(item.id) ?? item),
    sticks: partitionPieceUsage(allocation.sticks, piece[0].id, replacements),
    updatedAt: new Date().toISOString(),
  } };
}

/** Insert a joint into an uncut skewer; only analytical spans and usage attribution change. */
export function splitMemberAtPoint(design: BridgeDesign, memberId: string, point: Vector3Data):
  { ok: boolean; design: BridgeDesign; node?: BridgeNode; reason?: string } {
  const fail = (reason: string) => ({ ok: false, design, reason });
  const member = design.members.find((item) => item.id === memberId);
  if (!member || !Object.values(point).every(Number.isFinite)) return fail("Sambungan tidak sah.");
  const a = design.nodes.find((node) => node.id === member.nodeA)!;
  const b = design.nodes.find((node) => node.id === member.nodeB)!;
  if (distance3(point, a.position) < 0.5) return { ok: true, design, node: a };
  if (distance3(point, b.position) < 0.5) return { ok: true, design, node: b };
  if (Math.abs(distance3(a.position, point) + distance3(point, b.position) - distance3(a.position, b.position)) > 1e-5) {
    return fail("Titik mesti berada pada lidi.");
  }
  const numbered = withDisplayNumbers(design);
  const existing = findNodeNear(numbered.nodes, point, 1e-5);
  const node = existing ?? { id: `node-${crypto.randomUUID()}`, displayNumber: nextDisplayNumber(numbered.nodes), position: { ...point } };
  const source = numbered.members.find((item) => item.id === memberId)!;
  const first: BridgeMember = { ...source, physicalPieceId: physicalPieceId(source), nodeB: node.id, lengthCm: distance3(a.position, node.position) };
  const second: BridgeMember = { ...source, id: `member-${crypto.randomUUID()}`,
    displayNumber: nextDisplayNumber(numbered.members), physicalPieceId: physicalPieceId(source),
    nodeA: node.id, lengthCm: distance3(node.position, b.position) };
  const members = numbered.members.flatMap((item) => item.id === memberId ? [first, second] : [item]);
  return { ok: true, node, design: { ...numbered,
    nodes: existing ? numbered.nodes : [...numbered.nodes, node], members,
    joints: syncJointMembers(ensureJoint(numbered.joints, node.id), members),
    sticks: partitionPieceUsage(numbered.sticks, memberId, [first, second]),
    updatedAt: new Date().toISOString(),
  } };
}

export function applyGlue(
  design: BridgeDesign,
  jointId: string,
  amountCm: number,
): { ok: boolean; design: BridgeDesign; reason?: string } {
  const totalAvailable = design.profileSnapshot.materialRules.glueRefillCount
    * design.profileSnapshot.materialRules.glueRefillLengthCm;
  const used = design.joints.reduce((sum, joint) => sum + joint.glueUsedCm, 0);
  if (amountCm <= 0) return { ok: false, design, reason: "Jumlah gam mesti melebihi sifar." };
  if (used + amountCm > totalAvailable + 1e-6) {
    return { ok: false, design, reason: "Gam tidak mencukupi." };
  }
  const massRate = design.profileSnapshot.materialCalibration.glueMassPerCmGram;
  return {
    ok: true,
    design: {
      ...design,
      joints: design.joints.map((joint) => joint.id === jointId ? {
        ...joint,
        glueUsedCm: Math.round((joint.glueUsedCm + amountCm) * 100) / 100,
        glueMassGram: massRate === null ? null : (joint.glueUsedCm + amountCm) * massRate,
        state: "glued",
      } : joint),
      updatedAt: new Date().toISOString(),
    },
  };
}

function snap(value: number) {
  return Math.round(value * 100) / 100;
}

export function mirrorSide(
  design: BridgeDesign,
  direction: "leftToRight" | "rightToLeft",
): { ok: boolean; design: BridgeDesign; requiredLengthCm: number; reason?: string } {
  const source = direction === "leftToRight" ? "left" : "right";
  const target = direction === "leftToRight" ? "right" : "left";
  const sourceMembers = design.members.filter((member) => member.side === source);
  const requiredLengthCm = sourceMembers.reduce((sum, member) => sum + member.lengthCm, 0);
  let next = design;
  const pieces = [...new Set(sourceMembers.map(physicalPieceId))];
  for (const pieceId of pieces) {
    const spans = sourceMembers.filter((member) => physicalPieceId(member) === pieceId);
    const counts = new Map<string, number>();
    spans.forEach((member) => [member.nodeA, member.nodeB].forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
    const ends = [...counts].filter(([, count]) => count === 1).map(([id]) => design.nodes.find((node) => node.id === id)!);
    if (ends.length !== 2) return { ok: false, design, requiredLengthCm, reason: "Sambungan lidi tidak sah untuk mirror." };
    const reflect = (p: Vector3Data) => ({ x: snap(p.x), y: snap(p.y), z: snap(-p.z) });
    const result = addMember(next, reflect(ends[0].position), reflect(ends[1].position), target, spans[0].role);
    if (!result.ok || !result.member) return { ok: false, design, requiredLengthCm, reason: result.reason };
    next = result.design;
    for (const [nodeId, count] of counts) {
      if (count < 2) continue;
      const point = reflect(design.nodes.find((node) => node.id === nodeId)!.position);
      const mirroredSpans = next.members.filter((member) => physicalPieceId(member) === physicalPieceId(result.member!));
      let inserted = false;
      for (const span of mirroredSpans) {
        const split = splitMemberAtPoint(next, span.id, point);
        if (split.ok) { next = split.design; inserted = true; break; }
      }
      if (!inserted) return { ok: false, design, requiredLengthCm, reason: "Sambungan mirror tidak dapat diletakkan." };
    }
  }
  return { ok: true, design: next, requiredLengthCm };
}

export function createStarterDesign(profile: CompetitionProfile): BridgeDesign {
  let design = createEmptyDesign(profile, "practice");
  design.name = "Rangka Warren Latihan";
  const halfLength = Math.min(profile.bridgeRules.maxLengthCm, 42) / 2;
  const halfWidth = Math.min(profile.bridgeRules.maxWidthCm, 9) / 2;
  const panels = 6;
  const step = (halfLength * 2) / panels;
  const bottomXs = Array.from({ length: panels + 1 }, (_, i) => -halfLength + i * step);
  const topXs = Array.from({ length: panels }, (_, i) => -halfLength + (i + 0.5) * step);

  const append = (a: Vector3Data, b: Vector3Data, plane: BuildPlane, role?: MemberRole) => {
    const result = addMember(design, a, b, plane, role);
    if (result.ok) design = result.design;
  };

  for (const [plane, z] of [["left", -halfWidth], ["right", halfWidth]] as const) {
    bottomXs.slice(0, -1).forEach((x, index) => {
      append({ x, y: 0, z }, { x: bottomXs[index + 1], y: 0, z }, plane, "truss");
    });
    topXs.slice(0, -1).forEach((x, index) => {
      append({ x, y: 9, z }, { x: topXs[index + 1], y: 9, z }, plane, "truss");
    });
    topXs.forEach((x, index) => {
      append({ x: bottomXs[index], y: 0, z }, { x, y: 9, z }, plane, "truss");
      append({ x, y: 9, z }, { x: bottomXs[index + 1], y: 0, z }, plane, "truss");
    });
  }
  bottomXs
    .filter((x) => Math.abs(x) > profile.bridgeRules.centralClearanceWidthCm / 2)
    .forEach((x) => append(
      { x, y: 0, z: -halfWidth },
      { x, y: 0, z: halfWidth },
      "base",
      "baseBinding",
    ));
  bottomXs.slice(0, -1).forEach((x, index) => {
    const nextX = bottomXs[index + 1];
    const crossesCentralOpening = x < profile.bridgeRules.centralClearanceWidthCm / 2
      && nextX > -profile.bridgeRules.centralClearanceWidthCm / 2;
    if (!crossesCentralOpening) {
      append(
        { x, y: 0, z: -halfWidth },
        { x: nextX, y: 0, z: halfWidth },
        "cross",
        "crossBracing",
      );
    }
  });
  topXs.forEach((x, index) => {
    append(
      { x, y: 9, z: -halfWidth },
      { x, y: 9, z: halfWidth },
      "cross",
      "crossBracing",
    );
    if (index < topXs.length - 1) {
      append(
        { x, y: 9, z: -halfWidth },
        { x: topXs[index + 1], y: 9, z: halfWidth },
        "cross",
        "crossBracing",
      );
    }
  });
  const starterGluePerJointCm = 0.5;
  const structuralJointIds = design.joints
    .filter((joint) => joint.connectedMemberIds.length > 1)
    .map((joint) => joint.id);
  structuralJointIds.forEach((jointId) => {
    const result = applyGlue(design, jointId, starterGluePerJointCm);
    if (result.ok) design = result.design;
  });
  return design;
}
