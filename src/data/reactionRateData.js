export const reactionFactors = {
  size: {
    id: "size",
    label: "Saiz bahan",
    variable: "Saiz zink",
    prompt: "",
    options: [
      { id: "large", label: "Ketulan", rate: 0.62, color: "#38bdf8", note: "" },
      { id: "powder", label: "Serbuk", rate: 1.32, color: "#facc15", note: "" },
    ],
  },
  temperature: {
    id: "temperature",
    label: "Suhu",
    variable: "Suhu larutan natrium tiosulfat",
    prompt: "",
    options: [
      { id: "temperature-slider", label: "30°C", temperature: 30, targetTime: 72, rate: 1, color: "#fbbf24" },
    ],
  },
  concentration: {
    id: "concentration",
    label: "Kepekatan",
    variable: "Kepekatan larutan natrium tiosulfat",
    prompt: "",
    options: [
      { id: "c020", label: "0.20 mol dm-3", concentration: 0.2, targetTime: 18, rate: 1.42, color: "#22d3ee" },
      { id: "c016", label: "0.16 mol dm-3", concentration: 0.16, targetTime: 24, rate: 1.12, color: "#38bdf8" },
      { id: "c012", label: "0.12 mol dm-3", concentration: 0.12, targetTime: 32, rate: 0.86, color: "#86efac" },
      { id: "c008", label: "0.08 mol dm-3", concentration: 0.08, targetTime: 48, rate: 0.58, color: "#fde68a" },
      { id: "c004", label: "0.04 mol dm-3", concentration: 0.04, targetTime: 75, rate: 0.34, color: "#fca5a5" },
    ],
  },
  catalyst: {
    id: "catalyst",
    label: "Mangkin",
    variable: "Kehadiran mangkin",
    prompt: "Lihat kesan mangkin terhadap laluan tindak balas.",
    options: [
      { id: "none", label: "Tanpa mangkin", rate: 0.76, note: "Tindak balas berlaku pada kadar biasa." },
      { id: "with", label: "Dengan mangkin", rate: 1.22, note: "Mangkin menyediakan laluan alternatif dengan tenaga pengaktifan lebih rendah." },
    ],
  },
  pressure: {
    id: "pressure",
    label: "Tekanan",
    variable: "Tekanan zarah gas",
    prompt: "Modelkan zarah gas yang lebih rapat apabila tekanan meningkat.",
    options: [
      { id: "low", label: "Rendah", rate: 0.64, note: "Zarah gas lebih berjauhan, perlanggaran kurang kerap." },
      { id: "medium", label: "Sederhana", rate: 0.9, note: "Kekerapan perlanggaran sederhana." },
      { id: "high", label: "Tinggi", rate: 1.24, note: "Zarah gas lebih rapat, perlanggaran berlaku lebih kerap." },
    ],
  },
};

export const factorOrder = ["size", "temperature", "concentration", "catalyst", "pressure"];

export const reactionTimes = [0, 10, 20, 30, 40, 50, 60];

export const zincMass = 5;

export const concentrationOptionIds = ["c020", "c016", "c012", "c008", "c004"];

export const concentrationSpeedMultiplier = 5;

export const temperatureSpeedMultiplier = 8;

export const temperatureMin = 30;

export const temperatureMax = 60;

export const temperatureCompletionTarget = 5;

export const sulfuricAcidConcentration = "1.0 mol dm-3";

export const sizeReactionResults = {
  large: [0, 14.6, 25.8, 34.5, 41.2, 46.4, 50.4],
  powder: [0, 35.0, 50.0, 58.0, 60.0, 60.0, 60.0],
};

export const sizeOptionIds = ["large", "powder"];

export function getSizeReactionPoints(optionId) {
  const volumes = sizeReactionResults[optionId] || sizeReactionResults.large;
  return reactionTimes.map((time, index) => ({
    time,
    volume: volumes[index],
  }));
}

export function getSizeReactionPoint(optionId, time) {
  return getSizeReactionPoints(optionId).find((point) => point.time === time) || { time, volume: 0 };
}

export function getConcentrationOption(optionId) {
  return reactionFactors.concentration.options.find((option) => option.id === optionId) || reactionFactors.concentration.options[0];
}

export function getConcentrationProgress(elapsed, optionId) {
  const option = getConcentrationOption(optionId);
  return Math.max(0, Math.min(1.18, elapsed / option.targetTime));
}

export function clampTemperature(temperature) {
  const value = Number.isFinite(Number(temperature)) ? Number(temperature) : temperatureMin;
  return Math.max(temperatureMin, Math.min(temperatureMax, Math.round(value)));
}

export function getTemperatureTargetTime(temperature) {
  const selectedTemperature = clampTemperature(temperature);
  const interpolated = 72 - ((selectedTemperature - temperatureMin) / (temperatureMax - temperatureMin)) * 52;
  const smallVariation = Math.sin(selectedTemperature * 1.37) * 1.2;
  return Number(Math.max(18, interpolated + smallVariation).toFixed(1));
}

export function getTemperatureOption(temperature = temperatureMin) {
  const selectedTemperature = clampTemperature(temperature);
  const targetTime = getTemperatureTargetTime(selectedTemperature);
  const heatRatio = (selectedTemperature - temperatureMin) / (temperatureMax - temperatureMin);
  return {
    id: `temperature-${selectedTemperature}`,
    label: `${selectedTemperature}°C`,
    temperature: selectedTemperature,
    targetTime,
    rate: Number((72 / targetTime).toFixed(2)),
    color: heatRatio < 0.34 ? "#38bdf8" : heatRatio < 0.67 ? "#fbbf24" : "#f87171",
  };
}

export function getTemperatureProgress(elapsed, temperature) {
  const option = typeof temperature === "object" ? temperature : getTemperatureOption(temperature);
  return Math.max(0, Math.min(1.18, elapsed / option.targetTime));
}

export function getInverseTime(time) {
  return time > 0 ? Number((1 / time).toFixed(4)) : 0;
}

export function getReactionReading(rate, time) {
  const maxVolume = 64;
  const curve = 1 - Math.exp((-rate * time) / 24);
  return Math.min(maxVolume, Number((maxVolume * curve).toFixed(1)));
}

export function describeRate(rate) {
  if (rate >= 1.2) {
    return "Kadar tinggi";
  }
  if (rate >= 0.85) {
    return "Kadar sederhana";
  }
  return "Kadar rendah";
}
