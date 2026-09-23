import { distance3 } from "./model";
import type {
  BridgeDesign,
  BridgeMember,
  CompetitionProfile,
  RestrictedBoxZone,
  RestrictedCylinderZone,
  ValidationItem,
  ValidationReport,
  Vector3Data,
} from "./types";

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

function pointInBox(point: Vector3Data, zone: RestrictedBoxZone) {
  return Math.abs(point.x - zone.centre.x) <= zone.size.x / 2
    && Math.abs(point.y - zone.centre.y) <= zone.size.y / 2
    && Math.abs(point.z - zone.centre.z) <= zone.size.z / 2;
}

function pointInCylinder(point: Vector3Data, zone: RestrictedCylinderZone) {
  const delta = {
    x: point.x - zone.centre.x,
    y: point.y - zone.centre.y,
    z: point.z - zone.centre.z,
  };
  const axial = Math.abs(delta[zone.axis]);
  const radial = zone.axis === "x"
    ? Math.hypot(delta.y, delta.z)
    : zone.axis === "y"
      ? Math.hypot(delta.x, delta.z)
      : Math.hypot(delta.x, delta.y);
  return axial <= zone.lengthCm / 2 && radial <= zone.diameterCm / 2;
}

export function memberIntersectsRestrictedZone(
  member: BridgeMember,
  design: BridgeDesign,
  zone: CompetitionProfile["restrictedZones"][number],
) {
  const a = design.nodes.find((node) => node.id === member.nodeA)?.position;
  const b = design.nodes.find((node) => node.id === member.nodeB)?.position;
  if (!a || !b) return false;
  const length = distance3(a, b);
  const samples = Math.max(3, Math.ceil(length / 0.5));
  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const point = {
      x: a.x + (b.x - a.x) * ratio,
      y: a.y + (b.y - a.y) * ratio,
      z: a.z + (b.z - a.z) * ratio,
    };
    if (zone.kind === "box" ? pointInBox(point, zone) : pointInCylinder(point, zone)) return true;
  }
  return false;
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

  const obstructions = profile.restrictedZones.flatMap((zone) =>
    design.members.filter((member) => memberIntersectsRestrictedZone(member, design, zone))
      .map((member) => ({ zone, member })),
  );
  items.push({
    id: "clearance",
    severity: obstructions.length ? "error" : "pass",
    label: "Zon kelegaan",
    detail: obstructions.length
      ? `${obstructions[0].zone.label} terhalang oleh ${obstructions.length} batang.`
      : "Ruang tengah dan laluan paip tidak terhalang.",
    relatedIds: obstructions.map(({ member }) => member.id),
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
