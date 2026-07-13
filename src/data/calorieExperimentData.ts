export const CALORIE_ASSET_BASE = "/assets/nilai%20kalori";

export const FOOD_DATA = {
  peanut: {
    id: "peanut",
    name: "Kacang tanah",
    shortName: "Kacang",
    hypothesisRank: 1,
    initialTemperature: 27,
    finalTemperature: 69,
    sampleMass: 1,
    waterMass: 10,
    burnDurationMs: 9000,
    assets: {
      normal: `${CALORIE_ASSET_BASE}/kacang-tanah-normal.webp`,
      burning: `${CALORIE_ASSET_BASE}/kacang-tanah-terbakar.webp`,
      burned: `${CALORIE_ASSET_BASE}/kacang-tanah-hangus.webp`,
    },
  },
  anchovy: {
    id: "anchovy",
    name: "Ikan bilis",
    shortName: "Ikan bilis",
    hypothesisRank: 2,
    initialTemperature: 27,
    finalTemperature: 51,
    sampleMass: 1,
    waterMass: 10,
    burnDurationMs: 7500,
    assets: {
      normal: `${CALORIE_ASSET_BASE}/ikan-bilis-normal.webp`,
      burning: `${CALORIE_ASSET_BASE}/ikan-bilis-terbakar.webp`,
      burned: `${CALORIE_ASSET_BASE}/ikan-bilis-hangus.webp`,
    },
  },
  bread: {
    id: "bread",
    name: "Roti",
    shortName: "Roti",
    hypothesisRank: 3,
    initialTemperature: 27,
    finalTemperature: 41,
    sampleMass: 1,
    waterMass: 10,
    burnDurationMs: 6000,
    assets: {
      normal: `${CALORIE_ASSET_BASE}/roti-normal.webp`,
      burning: `${CALORIE_ASSET_BASE}/roti-terbakar.webp`,
      burned: `${CALORIE_ASSET_BASE}/roti-hangus.webp`,
    },
  },
} as const;

export const FOOD_ORDER = ["peanut", "anchovy", "bread"] as const;

export const EXPERIMENT_STEPS = [
  "Pilih sampel makanan.",
  "Sediakan sampel pada jarum.",
  "Masukkan 10 g air suling.",
  "Rekod suhu awal air.",
  "Nyalakan sampel makanan.",
  "Letakkan sampel di bawah tabung didih.",
  "Tunggu sehingga pembakaran selesai.",
  "Rekod suhu akhir.",
  "Hitung nilai kalori makanan.",
] as const;

export type FoodId = keyof typeof FOOD_DATA;
export type FoodState = "normal" | "burning" | "burned";

export interface CalorieResult {
  foodId: FoodId;
  sampleMass: number;
  waterMass: number;
  initialTemperature: number;
  finalTemperature: number;
  deltaTemperature: number;
  absorbedEnergyJ: number;
  calorieKJPerGram: number;
}

export function calculateCalorieResult(foodId: FoodId): CalorieResult {
  const food = FOOD_DATA[foodId];
  const deltaTemperature = food.finalTemperature - food.initialTemperature;
  const absorbedEnergyJ = 4.2 * food.waterMass * deltaTemperature;
  const calorieKJPerGram = absorbedEnergyJ / (food.sampleMass * 1000);

  return {
    foodId,
    sampleMass: food.sampleMass,
    waterMass: food.waterMass,
    initialTemperature: food.initialTemperature,
    finalTemperature: food.finalTemperature,
    deltaTemperature,
    absorbedEnergyJ,
    calorieKJPerGram,
  };
}

export function getTemperatureAtProgress(foodId: FoodId, progress: number) {
  const food = FOOD_DATA[foodId];
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = 1 - Math.pow(1 - clamped, 2.65);

  return (
    food.initialTemperature +
    (food.finalTemperature - food.initialTemperature) * eased
  );
}
