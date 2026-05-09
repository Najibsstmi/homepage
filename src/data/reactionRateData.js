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
    variable: "Suhu asid hidroklorik",
    prompt: "Ubah tenaga kinetik zarah dengan menukar suhu larutan.",
    options: [
      { id: "low", label: "Rendah", rate: 0.62, note: "Zarah bergerak perlahan dan kurang perlanggaran berkesan." },
      { id: "medium", label: "Sederhana", rate: 0.9, note: "Kadar sederhana apabila tenaga kinetik meningkat." },
      { id: "high", label: "Tinggi", rate: 1.34, note: "Zarah bergerak paling laju, perlanggaran berkesan lebih kerap." },
    ],
  },
  concentration: {
    id: "concentration",
    label: "Kepekatan",
    variable: "Kepekatan asid hidroklorik",
    prompt: "Ubah bilangan zarah asid dalam isipadu yang sama.",
    options: [
      { id: "dilute", label: "Cair", rate: 0.58, note: "Kurang zarah asid per unit isipadu." },
      { id: "medium", label: "Sederhana", rate: 0.9, note: "Bilangan zarah asid sederhana." },
      { id: "concentrated", label: "Pekat", rate: 1.3, note: "Lebih banyak zarah asid, perlanggaran lebih kerap." },
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
