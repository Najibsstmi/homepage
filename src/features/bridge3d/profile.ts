import type { CompetitionProfile, RestrictedBoxZone, RestrictedCylinderZone, RestrictedZone } from "./types";

export const OFFICIAL_2026_PROFILE_ID = "bridge-building-2026";
export const OFFICIAL_PLATE_CLEARANCE_ID = "central-plate-clearance";
export const OFFICIAL_PIPE_CLEARANCE_ID = "pipe-clearance";
const MINIMUM_PIPE_GUIDE_LENGTH_CM = 45;

const timeScoreTable = Array.from({ length: 10 }, (_, index) => ({
  second: index + 1,
  score: (index + 1) * 0.5,
}));

export const OFFICIAL_2026_PROFILE: CompetitionProfile = {
  id: OFFICIAL_2026_PROFILE_ID,
  name: "Bridge Building 2026",
  year: 2026,
  officialBaseId: OFFICIAL_2026_PROFILE_ID,
  modified: false,
  bridgeRules: {
    minLengthCm: 40,
    maxLengthCm: 45,
    minWidthCm: 6,
    maxWidthCm: 12,
    maxHeightCm: 40,
    centralClearanceWidthCm: 5,
    centralClearanceHeightCm: 5,
    pipeClearanceDiameterCm: 5.5,
    maxBaseLongitudinalSticks: 7,
    maxBaseBindingSticks: 7,
    maxBaseLayers: 1,
    maxOverlapRatio: 0.5,
  },
  materialRules: {
    skewerCount: 30,
    skewerLengthCm: 45,
    skewerDiameterCm: 0.4,
    glueRefillCount: 3,
    glueRefillLengthCm: 20,
    cutWasteCm: 0,
  },
  loadTestRules: {
    incrementKg: 5,
    holdDurationSeconds: 10,
    maximumTestLoadKg: 175,
    supportSpanCm: 40,
    loadingZone: { centreXcm: 0, widthCm: 5, lengthCm: 5 },
    timeScoreTable,
    failureTimeRounding: "floor",
  },
  materialCalibration: {
    averageSkewerMassGram: null,
    glueMassPerCmGram: null,
    tensileStrengthN: null,
    compressionStrengthN: null,
    youngModulusMPa: null,
    jointCalibration: [],
  },
  restrictedZones: [],
};

function formatCm(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

/**
 * Returns the two official clearance volumes derived from bridgeRules, followed
 * by any custom zones. Stored zones using an official ID are deliberately
 * ignored so an older saved profile cannot keep stale official dimensions.
 */
export function getEffectiveClearanceZones(profile: CompetitionProfile): RestrictedZone[] {
  const width = Math.max(0, profile.bridgeRules.centralClearanceWidthCm);
  const height = Math.max(0, profile.bridgeRules.centralClearanceHeightCm);
  const pipeDiameter = Math.max(0, profile.bridgeRules.pipeClearanceDiameterCm);
  const skewerRadius = Math.max(0, profile.materialRules.skewerDiameterCm) / 2;
  const pipeRadius = pipeDiameter / 2;

  const plateZone: RestrictedBoxZone = {
    id: OFFICIAL_PLATE_CLEARANCE_ID,
    kind: "box",
    label: `Zon Plate Pengujian — minimum ${formatCm(width)} cm × ${formatCm(height)} cm`,
    centre: { x: 0, y: height / 2, z: 0 },
    size: { x: width, y: height, z: width },
    restriction: "clearance",
  };
  const pipeZone: RestrictedCylinderZone = {
    id: OFFICIAL_PIPE_CLEARANCE_ID,
    kind: "cylinder",
    label: `Laluan Paip — Ø${formatCm(pipeDiameter)} cm`,
    axis: "x",
    centre: { x: 0, y: skewerRadius + pipeRadius, z: 0 },
    lengthCm: Math.max(MINIMUM_PIPE_GUIDE_LENGTH_CM, profile.bridgeRules.maxLengthCm),
    diameterCm: pipeDiameter,
    restriction: "clearance",
  };
  const customZones = profile.restrictedZones.filter((zone) =>
    zone.id !== OFFICIAL_PLATE_CLEARANCE_ID && zone.id !== OFFICIAL_PIPE_CLEARANCE_ID);
  return [plateZone, pipeZone, ...customZones];
}

export function cloneProfile(profile: CompetitionProfile): CompetitionProfile {
  return structuredClone(profile);
}

export function createCustomPracticeProfile(): CompetitionProfile {
  return {
    ...cloneProfile(OFFICIAL_2026_PROFILE),
    id: "custom-practice",
    name: "Custom Practice",
    year: null,
    officialBaseId: OFFICIAL_2026_PROFILE_ID,
    modified: true,
  };
}

export function duplicateProfile(profile: CompetitionProfile, name?: string): CompetitionProfile {
  const copy = cloneProfile(profile);
  return {
    ...copy,
    id: `custom-${Date.now()}`,
    name: name ?? `${profile.name} (Salinan)`,
    year: profile.year ? profile.year + 1 : null,
    officialBaseId: profile.officialBaseId ?? OFFICIAL_2026_PROFILE_ID,
    modified: true,
  };
}

export function getOfficialValue(path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, OFFICIAL_2026_PROFILE);
}

export const DEFAULT_PROFILES = [OFFICIAL_2026_PROFILE, createCustomPracticeProfile()];

const PROFILE_STORAGE_KEY = "edusim-bridge3d-profiles-v1";

export function loadProfiles(): CompetitionProfile[] {
  if (typeof window === "undefined") return DEFAULT_PROFILES.map(cloneProfile);
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? "[]") as CompetitionProfile[];
    const savedPractice = saved.find((profile) => profile.id === "custom-practice");
    const otherCustoms = saved.filter((profile) =>
      profile.id !== OFFICIAL_2026_PROFILE_ID && profile.id !== "custom-practice");
    return [
      cloneProfile(OFFICIAL_2026_PROFILE),
      cloneProfile(savedPractice ?? createCustomPracticeProfile()),
      ...otherCustoms.map(cloneProfile),
    ];
  } catch {
    return DEFAULT_PROFILES.map(cloneProfile);
  }
}

export function saveProfiles(profiles: CompetitionProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(profiles.filter((profile) => profile.id !== OFFICIAL_2026_PROFILE_ID)),
  );
}
