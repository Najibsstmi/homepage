import type { CompetitionProfile } from "./types";

export const OFFICIAL_2026_PROFILE_ID = "bridge-building-2026";

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
  restrictedZones: [
    {
      id: "central-plate-clearance",
      kind: "box",
      label: "Ruang tengah untuk plat ujian",
      centre: { x: 0, y: 2.5, z: 0 },
      size: { x: 5, y: 5, z: 5 },
      restriction: "clearance",
    },
    {
      id: "pipe-clearance",
      kind: "cylinder",
      label: "Laluan paip Ø5.5 cm",
      axis: "x",
      centre: { x: 0, y: -3.2, z: 0 },
      lengthCm: 45,
      diameterCm: 5.5,
      restriction: "clearance",
    },
  ],
};

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
