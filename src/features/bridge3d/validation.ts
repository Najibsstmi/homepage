import { distance3 } from "./model";
import {
  getEffectiveClearanceZones,
  OFFICIAL_PIPE_CLEARANCE_ID,
  OFFICIAL_PLATE_CLEARANCE_ID,
} from "./profile";
import type {
  BridgeDesign,
  BridgeMember,
  RestrictedBoxZone,
  RestrictedCylinderZone,
  RestrictedZone,
  ValidationItem,
  ValidationReport,
  Vector3Data,
} from "./types";

const CLEARANCE_TOLERANCE_CM = 1e-4;
export const APPLIED_GLUE_RADIUS_CM = 0.5;

function bounds(points: Vector3Data[]) {
  if (!points.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  return points.reduce((box, point) => ({
    minX: Math.min(box.minX, point.x), maxX: Math.max(box.maxX, point.x),
    minY: Math.min(box.minY, point.y), maxY: Math.max(box.maxY, point.y),
    minZ: Math.min(box.minZ, point.z), maxZ: Math.max(box.maxZ, point.z),
  }), {
    minX: points[0].x, maxX: points[0].x,
    minY: points[0].y, maxY: points[0].y,
    minZ: points[0].z, maxZ: points[0].z,
  });
}

export function getBridgeDimensions(design: BridgeDesign) {
  const box = bounds(design.nodes.map((node) => node.position));
  return {
    lengthCm: Math.round((box.maxX - box.minX) * 100) / 100,
    widthCm: Math.round((box.maxZ - box.minZ) * 100) / 100,
    heightCm: Math.round((box.maxY - box.minY) * 100) / 100,
  };
}

function segmentIntersectsExpandedBox(
  a: Vector3Data,
  b: Vector3Data,
  radius: number,
  zone: RestrictedBoxZone,
) {
  let minimumT = 0;
  let maximumT = 1;
  const expansion = Math.max(0, radius - CLEARANCE_TOLERANCE_CM);
  for (const axis of ["x", "y", "z"] as const) {
    const halfExtent = zone.size[axis] / 2 + expansion;
    const minimum = zone.centre[axis] - halfExtent;
    const maximum = zone.centre[axis] + halfExtent;
    const direction = b[axis] - a[axis];
    if (Math.abs(direction) < 1e-10) {
      if (a[axis] < minimum || a[axis] > maximum) return false;
      continue;
    }
    const first = (minimum - a[axis]) / direction;
    const second = (maximum - a[axis]) / direction;
    minimumT = Math.max(minimumT, Math.min(first, second));
    maximumT = Math.min(maximumT, Math.max(first, second));
    if (minimumT > maximumT) return false;
  }
  return true;
}

function segmentIntersectsExpandedCylinder(
  a: Vector3Data,
  b: Vector3Data,
  radius: number,
  zone: RestrictedCylinderZone,
) {
  const radialAxes = (["x", "y", "z"] as const).filter((axis) => axis !== zone.axis);
  const axialStart = a[zone.axis] - zone.centre[zone.axis];
  const axialDirection = b[zone.axis] - a[zone.axis];
  const axialLimit = zone.lengthCm / 2 + Math.max(0, radius - CLEARANCE_TOLERANCE_CM);
  let minimumT = 0;
  let maximumT = 1;
  if (Math.abs(axialDirection) < 1e-10) {
    if (Math.abs(axialStart) > axialLimit) return false;
  } else {
    const first = (-axialLimit - axialStart) / axialDirection;
    const second = (axialLimit - axialStart) / axialDirection;
    minimumT = Math.max(minimumT, Math.min(first, second));
    maximumT = Math.min(maximumT, Math.max(first, second));
    if (minimumT > maximumT) return false;
  }

  const radialStart = radialAxes.map((axis) => a[axis] - zone.centre[axis]);
  const radialDirection = radialAxes.map((axis) => b[axis] - a[axis]);
  const denominator = radialDirection[0] ** 2 + radialDirection[1] ** 2;
  const closestT = denominator < 1e-12
    ? minimumT
    : Math.min(maximumT, Math.max(minimumT,
      -(radialStart[0] * radialDirection[0] + radialStart[1] * radialDirection[1]) / denominator));
  const radialDistance = Math.hypot(
    radialStart[0] + radialDirection[0] * closestT,
    radialStart[1] + radialDirection[1] * closestT,
  );
  const radialLimit = zone.diameterCm / 2 + Math.max(0, radius - CLEARANCE_TOLERANCE_CM);
  return radialDistance < radialLimit;
}

function segmentIntersectsZone(a: Vector3Data, b: Vector3Data, radius: number, zone: RestrictedZone) {
  return zone.kind === "box"
    ? segmentIntersectsExpandedBox(a, b, radius, zone)
    : segmentIntersectsExpandedCylinder(a, b, radius, zone);
}

export function memberIntersectsRestrictedZone(
  member: BridgeMember,
  design: BridgeDesign,
  zone: RestrictedZone,
  memberRadius = design.profileSnapshot.materialRules.skewerDiameterCm / 2,
) {
  const a = design.nodes.find((node) => node.id === member.nodeA)?.position;
  const b = design.nodes.find((node) => node.id === member.nodeB)?.position;
  if (!a || !b) return false;
  return segmentIntersectsZone(a, b, memberRadius, zone);
}

function glueIntersectsRestrictedZone(position: Vector3Data, zone: RestrictedZone) {
  return segmentIntersectsZone(position, position, APPLIED_GLUE_RADIUS_CM, zone);
}

function clearanceItem(
  design: BridgeDesign,
  zone: RestrictedZone,
  id: string,
  label: string,
  clearDetail: string,
  memberRadius: number,
): ValidationItem {
  const members = design.members.filter((member) =>
    memberIntersectsRestrictedZone(member, design, zone, memberRadius));
  const nodeById = new Map(design.nodes.map((node) => [node.id, node.position]));
  const joints = design.joints.filter((joint) => {
    const position = nodeById.get(joint.nodeId);
    return joint.glueUsedCm > 0 && !!position && glueIntersectsRestrictedZone(position, zone);
  });
  const parts = [
    members.length ? `${members.length} batang` : "",
    joints.length ? `${joints.length} sambungan gam` : "",
  ].filter(Boolean);
  return {
    id,
    severity: parts.length ? "error" : "pass",
    label,
    detail: parts.length ? `TERHALANG oleh ${parts.join(" dan ")}.` : clearDetail,
    relatedIds: parts.length
      ? [...members.map((member) => member.id), ...joints.map((joint) => joint.id)]
      : undefined,
  };
}

function overlapLength(
  first: BridgeMember,
  second: BridgeMember,
  design: BridgeDesign,
): number {
  const byId = new Map(design.nodes.map((node) => [node.id, node.position]));
  const a = byId.get(first.nodeA); const b = byId.get(first.nodeB);
  const c = byId.get(second.nodeA); const d = byId.get(second.nodeB);
  if (!a || !b || !c || !d) return 0;
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const ad = { x: d.x - a.x, y: d.y - a.y, z: d.z - a.z };
  const crossC = Math.hypot(ab.y * ac.z - ab.z * ac.y, ab.z * ac.x - ab.x * ac.z, ab.x * ac.y - ab.y * ac.x);
  const crossD = Math.hypot(ab.y * ad.z - ab.z * ad.y, ab.z * ad.x - ab.x * ad.z, ab.x * ad.y - ab.y * ad.x);
  const abLength = distance3(a, b);
  if (abLength < 1e-6 || crossC / abLength > 0.15 || crossD / abLength > 0.15) return 0;
  const unit = { x: ab.x / abLength, y: ab.y / abLength, z: ab.z / abLength };
  const project = (point: Vector3Data) => (point.x - a.x) * unit.x + (point.y - a.y) * unit.y + (point.z - a.z) * unit.z;
  const firstRange = [0, abLength];
  const pC = project(c); const pD = project(d);
  const secondRange = [Math.min(pC, pD), Math.max(pC, pD)];
  return Math.max(0, Math.min(firstRange[1], secondRange[1]) - Math.max(firstRange[0], secondRange[0]));
}

function connectedComponents(design: BridgeDesign) {
  if (!design.nodes.length) return 0;
  const adjacency = new Map(design.nodes.map((node) => [node.id, new Set<string>()]));
  design.members.forEach((member) => {
    adjacency.get(member.nodeA)?.add(member.nodeB);
    adjacency.get(member.nodeB)?.add(member.nodeA);
  });
  const visited = new Set<string>();
  let components = 0;
  for (const node of design.nodes) {
    if (visited.has(node.id)) continue;
    components += 1;
    const queue = [node.id];
    while (queue.length) {
      const current = queue.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      adjacency.get(current)?.forEach((next) => queue.push(next));
    }
  }
  return components;
}

export function validateBridge(design: BridgeDesign, profile = design.profileSnapshot): ValidationReport {
  const dimensions = getBridgeDimensions(design);
  const items: ValidationItem[] = [];
  const dimensionCheck = (
    id: string,
    label: string,
    value: number,
    min: number | null,
    max: number | null,
  ) => {
    const valid = (min === null || value >= min) && (max === null || value <= max);
    items.push({
      id,
      severity: valid ? "pass" : "error",
      label,
      detail: valid
        ? `${value.toFixed(1)} cm — dalam julat.`
        : `${value.toFixed(1)} cm — had ${min ?? 0} hingga ${max ?? "∞"} cm.`,
    });
  };

  dimensionCheck("length", "Panjang jambatan", dimensions.lengthCm, profile.bridgeRules.minLengthCm, profile.bridgeRules.maxLengthCm);
  dimensionCheck("width", "Lebar jambatan", dimensions.widthCm, profile.bridgeRules.minWidthCm, profile.bridgeRules.maxWidthCm);
  dimensionCheck("height", "Tinggi jambatan", dimensions.heightCm, null, profile.bridgeRules.maxHeightCm);

  const baseLongitudinal = design.members.filter((member) => member.role === "baseLongitudinal");
  const baseBinding = design.members.filter((member) => member.role === "baseBinding");
  for (const [id, label, count, max] of [
    ["base-longitudinal", "Lidi memanjang tapak", baseLongitudinal.length, profile.bridgeRules.maxBaseLongitudinalSticks],
    ["base-binding", "Lidi pengikat tapak", baseBinding.length, profile.bridgeRules.maxBaseBindingSticks],
  ] as const) {
    items.push({
      id,
      severity: count <= max ? "pass" : "error",
      label,
      detail: `${count} digunakan daripada maksimum ${max}.`,
      relatedIds: count > max ? (id === "base-longitudinal" ? baseLongitudinal : baseBinding).map((member) => member.id) : undefined,
    });
  }
  const baseLayerHeights = new Set(
    [...baseLongitudinal, ...baseBinding].map((member) => {
      const a = design.nodes.find((node) => node.id === member.nodeA);
      const b = design.nodes.find((node) => node.id === member.nodeB);
      return Math.round((((a?.position.y ?? 0) + (b?.position.y ?? 0)) / 2) * 10) / 10;
    }),
  );
  const baseLayerCount = baseLayerHeights.size;
  items.push({
    id: "base-layers",
    severity: baseLayerCount <= profile.bridgeRules.maxBaseLayers ? "pass" : "error",
    label: "Lapisan tapak",
    detail: `${baseLayerCount} lapisan digunakan daripada maksimum ${profile.bridgeRules.maxBaseLayers}.`,
  });

  const clearanceZones = getEffectiveClearanceZones(profile);
  const plateZone = clearanceZones.find((zone) => zone.id === OFFICIAL_PLATE_CLEARANCE_ID);
  const pipeZone = clearanceZones.find((zone) => zone.id === OFFICIAL_PIPE_CLEARANCE_ID);
  const memberRadius = profile.materialRules.skewerDiameterCm / 2;
  if (plateZone) {
    items.push(clearanceItem(
      design,
      plateZone,
      "plate-clearance",
      "Zon Plate Pengujian",
      `${profile.bridgeRules.centralClearanceWidthCm} × ${profile.bridgeRules.centralClearanceHeightCm} cm — CLEAR.`,
      memberRadius,
    ));
  }
  if (pipeZone) {
    items.push(clearanceItem(
      design,
      pipeZone,
      "pipe-clearance",
      "Laluan Paip",
      `Ø${profile.bridgeRules.pipeClearanceDiameterCm} cm — CLEAR.`,
      memberRadius,
    ));
  }
  clearanceZones
    .filter((zone) => zone.id !== OFFICIAL_PLATE_CLEARANCE_ID && zone.id !== OFFICIAL_PIPE_CLEARANCE_ID)
    .forEach((zone) => {
      if (zone.restriction === "clearance") {
        items.push(clearanceItem(
          design,
          zone,
          `clearance-${zone.id}`,
          zone.label,
          "Zon kelegaan custom — CLEAR.",
          memberRadius,
        ));
        return;
      }
      const nodeById = new Map(design.nodes.map((node) => [node.id, node.position]));
      const violatingJoints = design.joints.filter((joint) => {
        const position = nodeById.get(joint.nodeId);
        return joint.glueUsedCm > 0 && !!position && glueIntersectsRestrictedZone(position, zone);
      });
      items.push({
        id: `no-glue-${zone.id}`,
        severity: violatingJoints.length ? "error" : "pass",
        label: zone.label,
        detail: violatingJoints.length
          ? `TERHALANG oleh ${violatingJoints.length} sambungan gam.`
          : "Tiada gam dalam zon custom ini.",
        relatedIds: violatingJoints.length ? violatingJoints.map((joint) => joint.id) : undefined,
      });
    });

  const maximumOverlap = profile.materialRules.skewerLengthCm * profile.bridgeRules.maxOverlapRatio;
  const excessiveOverlap: string[] = [];
  for (let a = 0; a < design.members.length; a += 1) {
    for (let b = a + 1; b < design.members.length; b += 1) {
      if (overlapLength(design.members[a], design.members[b], design) > maximumOverlap + 1e-6) {
        excessiveOverlap.push(design.members[a].id, design.members[b].id);
      }
    }
  }
  items.push({
    id: "overlap",
    severity: excessiveOverlap.length ? "error" : "pass",
    label: "Pertindihan lidi",
    detail: excessiveOverlap.length
      ? `Pertindihan melebihi ${maximumOverlap.toFixed(1)} cm.`
      : `Semua pertindihan tidak melebihi ${maximumOverlap.toFixed(1)} cm.`,
    relatedIds: [...new Set(excessiveOverlap)],
  });

  const glueUsed = design.joints.reduce((sum, joint) => sum + joint.glueUsedCm, 0);
  const glueAvailable = profile.materialRules.glueRefillCount * profile.materialRules.glueRefillLengthCm;
  items.push({
    id: "glue",
    severity: glueUsed <= glueAvailable + 1e-6 ? "pass" : "error",
    label: "Inventori gam",
    detail: `${glueUsed.toFixed(2)} / ${glueAvailable.toFixed(2)} cm digunakan.`,
  });

  const unglued = design.joints.filter((joint) => joint.connectedMemberIds.length > 1 && joint.glueUsedCm <= 0);
  items.push({
    id: "joints",
    severity: unglued.length ? "warning" : "pass",
    label: "Sambungan bergam",
    detail: unglued.length ? `${unglued.length} sambungan struktur masih belum digam.` : "Semua sambungan struktur telah digam.",
    relatedIds: unglued.map((joint) => joint.id),
  });

  const components = connectedComponents(design);
  items.push({
    id: "connectivity",
    severity: components === 1 && design.members.length > 0 ? "pass" : "error",
    label: "Kesinambungan struktur",
    detail: design.members.length === 0
      ? "Jambatan belum dibina."
      : components === 1 ? "Semua komponen bersambung." : `Struktur mempunyai ${components} komponen terpisah.`,
  });

  const nodeXs = design.nodes.map((node) => node.position.x);
  const span = profile.loadTestRules.supportSpanCm;
  const spansSupports = nodeXs.some((x) => x <= -span / 2 + 1)
    && nodeXs.some((x) => x >= span / 2 - 1);
  items.push({
    id: "support-span",
    severity: spansSupports ? "pass" : "error",
    label: "Jambatan merentasi sokongan",
    detail: spansSupports ? `Kedua-dua sokongan pada rentang ${span} cm dicapai.` : `Struktur belum mencapai kedua-dua sokongan ${span} cm.`,
  });

  const zone = profile.loadTestRules.loadingZone;
  const loadNodes = design.nodes.filter((node) =>
    Math.abs(node.position.x - zone.centreXcm) <= zone.lengthCm / 2
    && Math.abs(node.position.z) <= zone.widthCm / 2 + 0.5);
  const loadMembers = design.members.filter((member) => {
    const a = design.nodes.find((node) => node.id === member.nodeA);
    const b = design.nodes.find((node) => node.id === member.nodeB);
    if (!a || !b) return false;
    const midpoint = {
      x: (a.position.x + b.position.x) / 2,
      z: (a.position.z + b.position.z) / 2,
    };
    return Math.abs(midpoint.x - zone.centreXcm) <= zone.lengthCm / 2
      && Math.abs(midpoint.z) <= zone.widthCm / 2 + 0.5;
  });
  const hasLoadContact = loadNodes.length > 0 || loadMembers.length > 0;
  items.push({
    id: "load-contact",
    severity: hasLoadContact ? "pass" : "error",
    label: "Sentuhan plat beban",
    detail: hasLoadContact
      ? `${loadNodes.length} nod dan ${loadMembers.length} batang tersedia dalam zon beban.`
      : "Tiada struktur dalam zon plat beban.",
    relatedIds: [...loadNodes.map((node) => node.id), ...loadMembers.map((member) => member.id)],
  });

  return { valid: !items.some((item) => item.severity === "error"), dimensions, items };
}
