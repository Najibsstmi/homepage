import type { BridgeMember, CompetitionProfile, PhysicalStick } from "./types";

const roundLength = (value: number) => Math.max(0, Math.round(value * 1000) / 1000);

export function createStickInventory(profile: CompetitionProfile): PhysicalStick[] {
  return Array.from({ length: profile.materialRules.skewerCount }, (_, index) => ({
    id: `stick-${String(index + 1).padStart(2, "0")}`,
    originalLengthCm: profile.materialRules.skewerLengthCm,
    remainingSegments: [
      {
        id: `stick-${String(index + 1).padStart(2, "0")}-segment-1`,
        lengthCm: profile.materialRules.skewerLengthCm,
      },
    ],
    usedSegments: [],
  }));
}

export interface InventoryConsumption {
  ok: boolean;
  sticks: PhysicalStick[];
  sourceStickId?: string;
  sourceSegmentId?: string;
  reason?: string;
}

export function consumeStickSegment(
  sticks: PhysicalStick[],
  memberId: string,
  lengthCm: number,
  cutWasteCm: number,
  preference: "auto" | "new" | "offcut" = "auto",
): InventoryConsumption {
  const required = roundLength(lengthCm + cutWasteCm);
  if (required <= 0) return { ok: false, sticks, reason: "Panjang lidi tidak sah." };

  const candidates = sticks.flatMap((stick, stickIndex) =>
    stick.remainingSegments.map((segment, segmentIndex) => ({
      stick,
      stickIndex,
      segment,
      segmentIndex,
      untouched: stick.usedSegments.length === 0,
    })),
  ).filter((candidate) => candidate.segment.lengthCm + 1e-6 >= required);

  const filtered = preference === "new"
    ? candidates.filter((candidate) => candidate.untouched)
    : preference === "offcut"
      ? candidates.filter((candidate) => !candidate.untouched)
      : candidates;

  const source = [...filtered].sort((a, b) => {
    if (preference === "auto" && a.untouched !== b.untouched) return a.untouched ? 1 : -1;
    return a.segment.lengthCm - b.segment.lengthCm;
  })[0];

  if (!source) {
    return {
      ok: false,
      sticks,
      reason:
        preference === "offcut"
          ? "Tiada offcut yang cukup panjang."
          : "Inventori lidi tidak mempunyai baki yang mencukupi.",
    };
  }

  const next = structuredClone(sticks);
  const nextStick = next[source.stickIndex];
  const consumed = nextStick.remainingSegments.splice(source.segmentIndex, 1)[0];
  const remainder = roundLength(consumed.lengthCm - required);

  nextStick.usedSegments.push({
    memberId,
    sourceSegmentId: consumed.id,
    lengthCm: roundLength(lengthCm),
    cutWasteCm: roundLength(cutWasteCm),
  });

  if (remainder > 0.05) {
    nextStick.remainingSegments.push({
      id: `${consumed.id}-offcut-${nextStick.usedSegments.length}`,
      lengthCm: remainder,
    });
  }

  return {
    ok: true,
    sticks: next,
    sourceStickId: nextStick.id,
    sourceSegmentId: consumed.id,
  };
}

export function restoreMemberSegment(sticks: PhysicalStick[], member: BridgeMember): PhysicalStick[] {
  const next = structuredClone(sticks);
  const stick = next.find((item) => item.id === member.sourceStickId);
  if (!stick) return next;
  const usageIndex = stick.usedSegments.findIndex((usage) => usage.memberId === member.id);
  if (usageIndex < 0) return next;
  const [usage] = stick.usedSegments.splice(usageIndex, 1);
  stick.remainingSegments.push({
    id: `${usage.sourceSegmentId}-restored-${Date.now()}`,
    lengthCm: roundLength(usage.lengthCm + usage.cutWasteCm),
  });
  return next;
}

export function getInventorySummary(sticks: PhysicalStick[]) {
  const sticksStarted = sticks.filter((stick) => stick.usedSegments.length > 0).length;
  const sticksUntouched = sticks.length - sticksStarted;
  const totalLengthUsedCm = sticks.reduce(
    (sum, stick) => sum + stick.usedSegments.reduce((stickSum, use) => stickSum + use.lengthCm, 0),
    0,
  );
  const usableOffcuts = sticks.reduce(
    (sum, stick) => sum + stick.remainingSegments.filter((segment) => segment.lengthCm >= 1).length,
    0,
  );
  const availableLengthCm = sticks.reduce(
    (sum, stick) => sum + stick.remainingSegments.reduce((segmentSum, segment) => segmentSum + segment.lengthCm, 0),
    0,
  );
  return { sticksStarted, sticksUntouched, totalLengthUsedCm, usableOffcuts, availableLengthCm };
}

export function calculateBridgeMass(
  sticks: PhysicalStick[],
  glueUsedCm: number,
  profile: CompetitionProfile,
): { massGram: number | null; estimated: boolean; skewerMassGram: number | null; glueMassGram: number | null } {
  const usedLength = getInventorySummary(sticks).totalLengthUsedCm;
  const calibratedStickMass = profile.materialCalibration.averageSkewerMassGram;
  const calibratedGlueMass = profile.materialCalibration.glueMassPerCmGram;
  const estimated = calibratedStickMass === null || calibratedGlueMass === null;
  const fullStickMass = calibratedStickMass ?? 3.2;
  const glueMassPerCm = calibratedGlueMass ?? 0.22;
  const skewerMassGram = usedLength * (fullStickMass / profile.materialRules.skewerLengthCm);
  const glueMassGram = glueUsedCm * glueMassPerCm;
  return {
    massGram: Math.round((skewerMassGram + glueMassGram) * 100) / 100,
    estimated,
    skewerMassGram: Math.round(skewerMassGram * 100) / 100,
    glueMassGram: Math.round(glueMassGram * 100) / 100,
  };
}
