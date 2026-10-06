export type EvaporationVessel = "narrow" | "medium" | "wide";

export type EvaporationInputs = {
  temperature: number;
  airflow: number;
  humidity: number;
  vessel: EvaporationVessel;
};

export const VESSEL_FACTORS: Record<EvaporationVessel, number> = {
  narrow: 0.72,
  medium: 1,
  wide: 1.55,
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function getEvaporationFactors({
  temperature,
  airflow,
  humidity,
  vessel,
}: EvaporationInputs) {
  const normalizedTemperature = (clamp(temperature, 10, 50) - 10) / 40;
  const normalizedHumidity = (clamp(humidity, 20, 90) - 20) / 70;

  return {
    temperature: 0.7 + normalizedTemperature * 1.3,
    airflow: 1 + clamp(airflow, 0, 2) * 0.45,
    humidity: 1.28 - normalizedHumidity * 0.72,
    surfaceArea: VESSEL_FACTORS[vessel],
  };
}

export function getEvaporationRate(inputs: EvaporationInputs) {
  const factors = getEvaporationFactors(inputs);
  const combinedFactor =
    factors.temperature *
    factors.airflow *
    factors.humidity *
    factors.surfaceArea;

  // Accelerated educational model: relative fraction of the initial water volume per second.
  return 0.0028 * combinedFactor;
}

export function getRelativeRateScore(inputs: EvaporationInputs) {
  const rate = getEvaporationRate(inputs);
  const maximumRate = getEvaporationRate({
    temperature: 50,
    airflow: 2,
    humidity: 20,
    vessel: "wide",
  });

  return Math.round(clamp(Math.pow(rate / maximumRate, 0.55) * 100, 0, 100));
}
