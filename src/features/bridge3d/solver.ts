import type {
  BridgeDesign,
  CompetitionProfile,
  JointAnalysis,
  MemberAnalysis,
  StructuralResult,
  Vector3Data,
} from "./types";

const GRAVITY = 9.80665;
const ESTIMATED_MATERIAL = {
  youngModulusMPa: 12000,
  tensileStrengthN: 420,
  compressionStrengthN: 240,
  jointCapacityN: 150,
};

function solveLinearSystem(matrix: number[][], vector: number[]) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < 1e-8) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    for (let index = column; index <= size; index += 1) augmented[column][index] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      if (Math.abs(factor) < 1e-14) continue;
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }
  return augmented.map((row) => row[size]);
}

function interpolateJointCapacity(glueCm: number, profile: CompetitionProfile) {
  const curve = [...profile.materialCalibration.jointCalibration].sort((a, b) => a.glueCm - b.glueCm);
  if (!curve.length) {
    return Math.max(4, ESTIMATED_MATERIAL.jointCapacityN * (1 - Math.exp(-glueCm / 0.65)));
  }
  if (glueCm <= curve[0].glueCm) {
    return curve[0].failureForceN * Math.max(0.1, glueCm / curve[0].glueCm);
  }
  if (glueCm >= curve[curve.length - 1].glueCm) return curve[curve.length - 1].failureForceN;
  for (let index = 0; index < curve.length - 1; index += 1) {
    const current = curve[index];
    const next = curve[index + 1];
    if (glueCm >= current.glueCm && glueCm <= next.glueCm) {
      const ratio = (glueCm - current.glueCm) / (next.glueCm - current.glueCm);
      return current.failureForceN + (next.failureForceN - current.failureForceN) * ratio;
    }
  }
  return ESTIMATED_MATERIAL.jointCapacityN;
}

function emptyFailureResult(loadKg: number, message: string): StructuralResult {
  return {
    stable: false,
    estimate: true,
    message,
    loadKg,
    displacements: {},
    members: [],
    joints: [],
    firstFailure: { kind: "global", id: "structure", mode: "GLOBAL INSTABILITY", utilization: Infinity },
    loadContactNodeIds: [],
  };
}

function findLoadContactNodes(design: BridgeDesign, profile: CompetitionProfile) {
  const zone = profile.loadTestRules.loadingZone;
  const direct = design.nodes.filter((node) =>
    Math.abs(node.position.x - zone.centreXcm) <= zone.lengthCm / 2
    && Math.abs(node.position.z) <= zone.widthCm / 2 + 0.25);
  if (direct.length) return direct;

  const crossingIds = new Set<string>();
  design.members.forEach((member) => {
    const a = design.nodes.find((node) => node.id === member.nodeA);
    const b = design.nodes.find((node) => node.id === member.nodeB);
    if (!a || !b) return;
    const midpoint = {
      x: (a.position.x + b.position.x) / 2,
      z: (a.position.z + b.position.z) / 2,
    };
    if (Math.abs(midpoint.x - zone.centreXcm) <= zone.lengthCm / 2
      && Math.abs(midpoint.z) <= zone.widthCm / 2 + 0.25) {
      crossingIds.add(a.id);
      crossingIds.add(b.id);
    }
  });
  if (crossingIds.size) return design.nodes.filter((node) => crossingIds.has(node.id));

  const nearestDistance = Math.min(...design.nodes.map((node) => Math.abs(node.position.x - zone.centreXcm)));
  return design.nodes.filter((node) => Math.abs(node.position.x - zone.centreXcm) <= nearestDistance + 0.25);
}

export function analyseBridge(
  design: BridgeDesign,
  loadKg: number,
  profile = design.profileSnapshot,
): StructuralResult {
  if (design.nodes.length < 4 || design.members.length < 3) {
    return emptyFailureResult(loadKg, "Struktur tidak stabil: anggota tidak mencukupi.");
  }
  const nodeIndex = new Map(design.nodes.map((node, index) => [node.id, index]));
  const dof = design.nodes.length * 3;
  const stiffness = Array.from({ length: dof }, () => Array<number>(dof).fill(0));
  const forces = Array<number>(dof).fill(0);
  const diameterMm = profile.materialRules.skewerDiameterCm * 10;
  const areaMm2 = Math.PI * diameterMm ** 2 / 4;
  const momentMm4 = Math.PI * diameterMm ** 4 / 64;
  const modulus = profile.materialCalibration.youngModulusMPa ?? ESTIMATED_MATERIAL.youngModulusMPa;

  for (const member of design.members) {
    const indexA = nodeIndex.get(member.nodeA);
    const indexB = nodeIndex.get(member.nodeB);
    const nodeA = indexA === undefined ? null : design.nodes[indexA];
    const nodeB = indexB === undefined ? null : design.nodes[indexB];
    if (indexA === undefined || indexB === undefined || !nodeA || !nodeB) continue;
    const dx = (nodeB.position.x - nodeA.position.x) * 10;
    const dy = (nodeB.position.y - nodeA.position.y) * 10;
    const dz = (nodeB.position.z - nodeA.position.z) * 10;
    const length = Math.hypot(dx, dy, dz);
    if (length < 1e-6) continue;
    const direction = [dx / length, dy / length, dz / length];
    const factor = modulus * areaMm2 / length;
    for (let a = 0; a < 3; a += 1) {
      for (let b = 0; b < 3; b += 1) {
        const value = factor * direction[a] * direction[b];
        stiffness[indexA * 3 + a][indexA * 3 + b] += value;
        stiffness[indexB * 3 + a][indexB * 3 + b] += value;
        stiffness[indexA * 3 + a][indexB * 3 + b] -= value;
        stiffness[indexB * 3 + a][indexA * 3 + b] -= value;
      }
    }
  }

  const contactNodes = findLoadContactNodes(design, profile);
  if (!contactNodes.length) return emptyFailureResult(loadKg, "Tiada nod sentuhan dalam zon plat beban.");
  const loadPerNodeN = (loadKg * GRAVITY) / contactNodes.length;
  contactNodes.forEach((node) => {
    const index = nodeIndex.get(node.id);
    if (index !== undefined) forces[index * 3 + 1] -= loadPerNodeN;
  });

  const span = profile.loadTestRules.supportSpanCm;
  const minimumY = Math.min(...design.nodes.map((node) => node.position.y));
  const leftNodes = design.nodes.filter((node) => node.position.x <= -span / 2 + 1.5 && node.position.y <= minimumY + 1);
  const rightNodes = design.nodes.filter((node) => node.position.x >= span / 2 - 1.5 && node.position.y <= minimumY + 1);
  if (!leftNodes.length || !rightNodes.length) return emptyFailureResult(loadKg, "Struktur tidak menyentuh kedua-dua sokongan.");

  const constrained = new Set<number>();
  leftNodes.forEach((node, index) => {
    const base = (nodeIndex.get(node.id) ?? 0) * 3;
    constrained.add(base + 1);
    constrained.add(base + 2);
    if (index === 0) constrained.add(base);
  });
  rightNodes.forEach((node) => {
    const base = (nodeIndex.get(node.id) ?? 0) * 3;
    constrained.add(base + 1);
    constrained.add(base + 2);
  });

  const free = Array.from({ length: dof }, (_, index) => index).filter((index) => !constrained.has(index));
  const reducedK = free.map((row) => free.map((column) => stiffness[row][column]));
  const reducedF = free.map((index) => forces[index]);
  // Real hot-glue joints have a small amount of rotational/lateral stiffness that an
  // ideal pin-jointed truss does not. A tiny numerical spring keeps unloaded local
  // mechanisms from making the matrix singular; a loaded mechanism is still caught
  // by the displacement limit below.
  const largestDiagonal = Math.max(1, ...reducedK.map((row, index) => Math.abs(row[index])));
  const stabilization = largestDiagonal * 1e-9;
  reducedK.forEach((row, index) => { row[index] += stabilization; });
  const solved = solveLinearSystem(reducedK, reducedF);
  if (!solved || solved.some((value) => !Number.isFinite(value))) {
    return {
      ...emptyFailureResult(loadKg, "Struktur tidak stabil. Tambah triangulasi atau cross bracing."),
      loadContactNodeIds: contactNodes.map((node) => node.id),
    };
  }
  const maximumDisplacementMm = Math.max(...solved.map((value) => Math.abs(value)));
  if (maximumDisplacementMm > 50) {
    return {
      ...emptyFailureResult(loadKg, "Struktur tidak stabil. Sesaran mekanisme melebihi 5 cm."),
      loadContactNodeIds: contactNodes.map((node) => node.id),
    };
  }
  const displacementVector = Array<number>(dof).fill(0);
  free.forEach((index, reducedIndex) => { displacementVector[index] = solved[reducedIndex]; });
  const displacements: Record<string, Vector3Data> = {};
  design.nodes.forEach((node, index) => {
    displacements[node.id] = {
      x: displacementVector[index * 3] / 10,
      y: displacementVector[index * 3 + 1] / 10,
      z: displacementVector[index * 3 + 2] / 10,
    };
  });

  const tensileCapacity = profile.materialCalibration.tensileStrengthN ?? ESTIMATED_MATERIAL.tensileStrengthN;
  const compressionCapacity = profile.materialCalibration.compressionStrengthN ?? ESTIMATED_MATERIAL.compressionStrengthN;
  const memberResults: MemberAnalysis[] = design.members.map((member) => {
    const indexA = nodeIndex.get(member.nodeA) ?? 0;
    const indexB = nodeIndex.get(member.nodeB) ?? 0;
    const a = design.nodes[indexA]; const b = design.nodes[indexB];
    const dx = (b.position.x - a.position.x) * 10;
    const dy = (b.position.y - a.position.y) * 10;
    const dz = (b.position.z - a.position.z) * 10;
    const length = Math.max(1e-6, Math.hypot(dx, dy, dz));
    const direction = [dx / length, dy / length, dz / length];
    const relative = direction.reduce((sum, component, axis) =>
      sum + component * (displacementVector[indexB * 3 + axis] - displacementVector[indexA * 3 + axis]), 0);
    const forceN = modulus * areaMm2 / length * relative;
    const mode = forceN > 0.001 ? "tension" : forceN < -0.001 ? "compression" : "neutral";
    const eulerCapacity = Math.PI ** 2 * modulus * momentMm4 / length ** 2;
    const capacity = mode === "compression"
      ? Math.min(compressionCapacity, eulerCapacity)
      : tensileCapacity;
    const utilization = Math.abs(forceN) / Math.max(capacity, 1e-6);
    return {
      memberId: member.id,
      forceN,
      stressMPa: forceN / areaMm2,
      mode,
      utilization,
      bucklingCapacityN: mode === "compression" ? eulerCapacity : null,
      status: utilization >= 1 ? "failed" : utilization >= 0.75 ? "warning" : "safe",
    };
  });

  const memberResultById = new Map(memberResults.map((result) => [result.memberId, result]));
  const jointResults: JointAnalysis[] = design.joints.map((joint) => {
    const resultantForceN = joint.connectedMemberIds.reduce(
      (sum, memberId) => sum + Math.abs(memberResultById.get(memberId)?.forceN ?? 0), 0) / 2;
    const capacityN = interpolateJointCapacity(joint.glueUsedCm, profile);
    const utilization = resultantForceN / Math.max(capacityN, 1e-6);
    return {
      jointId: joint.id,
      resultantForceN,
      capacityN,
      utilization,
      status: utilization >= 1 ? "failed" : utilization >= 0.75 ? "warning" : "safe",
    };
  });

  const failures = [
    ...memberResults.filter((member) => member.utilization >= 1).map((member) => ({
      kind: "member" as const,
      id: member.memberId,
      mode: member.mode === "compression" ? "COMPRESSION / BUCKLING" : "TENSION FAILURE",
      utilization: member.utilization,
    })),
    ...jointResults.filter((joint) => joint.utilization >= 1).map((joint) => ({
      kind: "joint" as const,
      id: joint.jointId,
      mode: "JOINT FAILURE",
      utilization: joint.utilization,
    })),
  ].sort((a, b) => b.utilization - a.utilization);

  const estimate = profile.materialCalibration.youngModulusMPa === null
    || profile.materialCalibration.tensileStrengthN === null
    || profile.materialCalibration.compressionStrengthN === null
    || profile.materialCalibration.jointCalibration.length === 0;
  return {
    stable: true,
    estimate,
    message: failures.length ? "Kegagalan struktur dikesan." : "Struktur menanggung beban bagi peringkat ini.",
    loadKg,
    displacements,
    members: memberResults,
    joints: jointResults,
    firstFailure: failures[0] ?? null,
    loadContactNodeIds: contactNodes.map((node) => node.id),
  };
}
