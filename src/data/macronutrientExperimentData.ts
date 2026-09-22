export const MACRONUTRIENT_ASSET_BASE =
  "/assets/kesan%20kekurangan%20mikronutrien/processed";

export const PLANT_CHECKPOINTS = [0, 2, 4, 7, 10, 14] as const;
export const EXPERIMENT_SETS = ["A", "B", "C", "D"] as const;

export type SolutionType = "complete" | "noN" | "noP" | "noK";
export type ExperimentSetId = (typeof EXPERIMENT_SETS)[number];
export type SolutionSelections = Record<ExperimentSetId, SolutionType | null>;

export interface SolutionDefinition {
  id: SolutionType;
  label: string;
  shortLabel: string;
  nutrient: string;
  color: string;
  liquidColor: string;
  bottle: string;
  explanation: string;
}

export const SOLUTIONS: readonly SolutionDefinition[] = [
  {
    id: "complete",
    label: "Larutan Lengkap",
    shortLabel: "Lengkap",
    nutrient: "N + P + K",
    color: "#168552",
    liquidColor: "#b8dfe4",
    bottle: `${MACRONUTRIENT_ASSET_BASE}/solutions/complete.webp`,
    explanation:
      "Larutan lengkap membekalkan makronutrien yang diperlukan. Tumbuhan dapat membentuk daun hijau, batang dan akar dengan pertumbuhan yang lebih baik.",
  },
  {
    id: "noN",
    label: "Tanpa Nitrogen (N)",
    shortLabel: "−N",
    nutrient: "Nitrogen",
    color: "#d94141",
    liquidColor: "#e4d757",
    bottle: `${MACRONUTRIENT_ASSET_BASE}/solutions/no-n.webp`,
    explanation:
      "Nitrogen diperlukan untuk pertumbuhan tumbuhan dan pembentukan klorofil. Kekurangan nitrogen mengganggu pertumbuhan dan menyebabkan daun menjadi lebih pucat atau kuning.",
  },
  {
    id: "noP",
    label: "Tanpa Fosforus (P)",
    shortLabel: "−P",
    nutrient: "Fosforus",
    color: "#d89d13",
    liquidColor: "#41a8da",
    bottle: `${MACRONUTRIENT_ASSET_BASE}/solutions/no-p.webp`,
    explanation:
      "Fosforus membantu pemindahan tenaga serta perkembangan akar. Kekurangannya membantutkan pertumbuhan dan boleh menghasilkan pigmentasi pada daun seperti yang ditunjukkan dalam aset eksperimen.",
  },
  {
    id: "noK",
    label: "Tanpa Kalium (K)",
    shortLabel: "−K",
    nutrient: "Kalium",
    color: "#7541b4",
    liquidColor: "#d982aa",
    bottle: `${MACRONUTRIENT_ASSET_BASE}/solutions/no-k.webp`,
    explanation:
      "Kalium membantu fungsi sel dan pertumbuhan yang sihat. Kekurangan kalium menyebabkan pertumbuhan tidak optimum serta simptom pada hujung dan tepi daun seperti dalam pemerhatian eksperimen.",
  },
] as const;

export const SOLUTION_BY_ID = Object.fromEntries(
  SOLUTIONS.map((solution) => [solution.id, solution]),
) as Record<SolutionType, SolutionDefinition>;

const FILE_PREFIX: Record<SolutionType, string> = {
  complete: "complete",
  noN: "no-n",
  noP: "no-p",
  noK: "no-k",
};

export function getPlantAsset(solution: SolutionType, checkpoint: number) {
  if (checkpoint === 0) {
    return `${MACRONUTRIENT_ASSET_BASE}/plants/day-0.webp`;
  }
  return `${MACRONUTRIENT_ASSET_BASE}/plants/${FILE_PREFIX[solution]}-day-${checkpoint}.webp`;
}

export function getPlantBlend(solution: SolutionType, day: number) {
  const clampedDay = Math.max(0, Math.min(14, day));
  let previous: number = PLANT_CHECKPOINTS[0];
  let next: number = PLANT_CHECKPOINTS[PLANT_CHECKPOINTS.length - 1];

  for (let index = 0; index < PLANT_CHECKPOINTS.length - 1; index += 1) {
    const current = PLANT_CHECKPOINTS[index];
    const following = PLANT_CHECKPOINTS[index + 1];
    if (clampedDay >= current && clampedDay <= following) {
      previous = current;
      next = following;
      break;
    }
  }

  const mix = previous === next ? 0 : (clampedDay - previous) / (next - previous);
  return {
    previous: getPlantAsset(solution, previous),
    next: getPlantAsset(solution, next),
    mix: Math.max(0, Math.min(1, mix)),
  };
}

export const MACRONUTRIENT_CRITICAL_ASSETS = [
  `${MACRONUTRIENT_ASSET_BASE}/lab-background.webp`,
  `${MACRONUTRIENT_ASSET_BASE}/apparatus.webp`,
  ...SOLUTIONS.map((solution) => solution.bottle),
  ...Array.from(
    new Set(
      SOLUTIONS.flatMap((solution) =>
        PLANT_CHECKPOINTS.map((checkpoint) => getPlantAsset(solution.id, checkpoint)),
      ),
    ),
  ),
];

export function createEmptySelections(): SolutionSelections {
  return { A: null, B: null, C: null, D: null };
}
