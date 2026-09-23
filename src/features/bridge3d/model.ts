import { consumeStickSegment, createStickInventory, restoreMemberSegment } from "./inventory";
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
    const used = design.members.filter((member) => member.role === role).length;
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
  let nodeA = findNodeNear(nodes, start);
  if (!nodeA) {
    nodeA = { id: `node-${crypto.randomUUID()}`, position: { ...start } };
    nodes.push(nodeA);
  }
  let nodeB = findNodeNear(nodes, end);
  if (!nodeB) {
    nodeB = { id: `node-${crypto.randomUUID()}`, position: { ...end } };
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
    nodeA: nodeA.id,
    nodeB: nodeB.id,
    sourceStickId: inventory.sourceStickId,
    sourceSegmentId: inventory.sourceSegmentId,
    lengthCm: Math.round(lengthCm * 100) / 100,
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
  const member = design.members.find((item) => item.id === memberId);
  if (!member) return design;
  const members = design.members.filter((item) => item.id !== memberId);
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
    sticks: restoreMemberSegment(design.sticks, member),
    updatedAt: new Date().toISOString(),
  };
}

export function moveNode(design: BridgeDesign, nodeId: string, position: Vector3Data): BridgeDesign {
  if (design.nodes.some((node) => node.id !== nodeId && distance3(node.position, position) < 0.1)) {
    return design;
  }
  const incidentMembers = design.members.filter((member) => member.nodeA === nodeId || member.nodeB === nodeId);
  const nodes = design.nodes.map((node) => node.id === nodeId ? { ...node, position } : node);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let sticks = incidentMembers.reduce(
    (current, member) => restoreMemberSegment(current, member),
    design.sticks,
  );
  const resized = new Map<string, BridgeMember>();
  for (const member of incidentMembers) {
    const a = byId.get(member.nodeA);
    const b = byId.get(member.nodeB);
    if (!a || !b) return design;
    const lengthCm = Math.round(distance3(a.position, b.position) * 100) / 100;
    if (!Number.isFinite(lengthCm) || lengthCm < 0.5) return design;
    const allocation = consumeStickSegment(
      sticks,
      member.id,
      lengthCm,
      design.profileSnapshot.materialRules.cutWasteCm,
      "auto",
    );
    if (!allocation.ok || !allocation.sourceStickId || !allocation.sourceSegmentId) return design;
    sticks = allocation.sticks;
    resized.set(member.id, {
      ...member,
      lengthCm,
      sourceStickId: allocation.sourceStickId,
      sourceSegmentId: allocation.sourceSegmentId,
    });
  }
  const members = design.members.map((member) => resized.get(member.id) ?? member);
  return { ...design, nodes, members, sticks, updatedAt: new Date().toISOString() };
}

export function replaceMember(design: BridgeDesign, memberId: string): AddMemberResult {
  const member = design.members.find((item) => item.id === memberId);
  const a = member ? design.nodes.find((node) => node.id === member.nodeA) : null;
  const b = member ? design.nodes.find((node) => node.id === member.nodeB) : null;
  if (!member || !a || !b) return { ok: false, design, reason: "Lidi tidak ditemui." };
  const withoutMember = deleteMember(design, memberId);
  const plane: BuildPlane = member.side === "left" || member.side === "right" || member.side === "base"
    ? member.side
    : "cross";
  const result = addMember(
    { ...withoutMember, selectedInventoryMode: "new" },
    a.position,
    b.position,
    plane,
    member.role,
  );
  if (!result.ok) return { ...result, design };
  return {
    ...result,
    design: { ...result.design, selectedInventoryMode: design.selectedInventoryMode },
  };
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
  for (const member of sourceMembers) {
    const a = design.nodes.find((node) => node.id === member.nodeA);
    const b = design.nodes.find((node) => node.id === member.nodeB);
    if (!a || !b) continue;
    const result = addMember(
      next,
      { x: snap(a.position.x), y: snap(a.position.y), z: snap(-a.position.z) },
      { x: snap(b.position.x), y: snap(b.position.y), z: snap(-b.position.z) },
      target,
      member.role,
    );
    if (!result.ok) {
      return { ok: false, design, requiredLengthCm, reason: result.reason };
    }
    next = result.design;
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
