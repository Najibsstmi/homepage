import { useEffect, useMemo, useRef, useState } from "react";

const MODES = [
  { id: "fission", label: "Pembelahan Nukleus" },
  { id: "fusion", label: "Pelakuran Nukleus" },
  { id: "plant", label: "Janakuasa Nuklear" },
];

const INITIAL_CHAIN_NEUTRONS = 1;
const NEUTRONS_PER_FISSION = 3;
const MAX_CHAIN_NEUTRONS = 90;

const initialFission = {
  running: false,
  paused: false,
  cycle: 0,
  splitIds: [],
  neutronCount: INITIAL_CHAIN_NEUTRONS,
  splitCount: 0,
  energy: 0,
  temperature: 260,
  boronRod: 25,
  coolantFlow: 55,
  graphiteRod: 55,
  uraniumRod: 55,
  showLabels: true,
  showPaths: true,
  absorbedCount: 0,
  fragmentBursts: [],
  neutronFadeOut: false,
  lastAction: "idle",
  message: "Laraskan Rod Boron, Rod Grafit dan Uranium-235, kemudian mulakan simulasi.",
  hasStarted: false,
};

const initialFusion = {
  temperature: 20,
  magneticField: 55,
  collisionSpeed: 60,
  fuelBalance: 50,
  deuteriumPlaced: false,
  tritiumPlaced: false,
  active: false,
  success: false,
  energy: 0,
  message: "Drag Deuterium dan Tritium ke dalam plasma chamber sebelum memulakan pelakuran.",
};

const initialPlant = {
  active: false,
  uranium235: 55,
  coolantAgent: 70,
  steamVelocity: 45,
};

const uraniumPositions = [
  { id: "u0", left: "30%", top: "50%", scale: 1.85, primary: true },
  { id: "u1", left: "58%", top: "24%", scale: 0.92 },
  { id: "u2", left: "75%", top: "36%", scale: 0.86 },
  { id: "u3", left: "55%", top: "54%", scale: 0.86 },
  { id: "u4", left: "78%", top: "58%", scale: 0.82 },
  { id: "u5", left: "61%", top: "76%", scale: 0.82 },
  { id: "u6", left: "89%", top: "45%", scale: 0.74 },
  { id: "u7", left: "47%", top: "32%", scale: 0.76 },
  { id: "u8", left: "43%", top: "70%", scale: 0.76 },
  { id: "u9", left: "88%", top: "72%", scale: 0.7 },
  { id: "u10", left: "66%", top: "41%", scale: 0.72 },
  { id: "u11", left: "70%", top: "82%", scale: 0.68 },
];

const neutronPaths = [
  { fromX: "4%", fromY: "32%", dx: "74%", dy: "18%" },
  { fromX: "8%", fromY: "70%", dx: "68%", dy: "-38%" },
  { fromX: "80%", fromY: "18%", dx: "-66%", dy: "44%" },
  { fromX: "86%", fromY: "72%", dx: "-72%", dy: "-30%" },
  { fromX: "36%", fromY: "8%", dx: "26%", dy: "72%" },
  { fromX: "52%", fromY: "90%", dx: "-30%", dy: "-72%" },
  { fromX: "6%", fromY: "50%", dx: "86%", dy: "-2%" },
  { fromX: "90%", fromY: "48%", dx: "-82%", dy: "4%" },
];

const fissionAssets = {
  background: "/asset/reactor%20core%20background.png",
  uranium: "/asset/uranium_235_glow.png",
  neutron: "/asset/neutron_blue_glow.png",
  fragment: "/asset/fission_fragment.png",
  energy: "/asset/energy_burst_orange.png",
  trail: "/asset/neutron_trail.png",
  controlRod: "/asset/control_rod.png",
};

const fissionProcessSteps = [
  "Neutron bergerak",
  "Neutron diserap",
  "Nukleus tidak stabil",
  "Nukleus terbelah",
  "Tenaga dibebaskan",
  "Neutron baharu",
  "Pembelahan seterusnya",
  "Tindak balas berantai",
];

const fissionObservationRows = [
  {
    step: 1,
    event: "Neutron menghentam U-235",
    observation: "Nukleus menjadi tidak stabil",
  },
  {
    step: 2,
    event: "Nukleus terbelah",
    observation: "Dua serpihan dan tenaga terhasil",
  },
  {
    step: 3,
    event: "Neutron baharu keluar",
    observation: "Tindak balas berantai bermula",
  },
  {
    step: 4,
    event: "Rod boron diturunkan",
    observation: "Sebahagian neutron diserap",
  },
];

const learningContent = {
  fission: {
    observation:
      "Apabila neutron mengenai uranium-235, nukleus bergetar, terbelah dan membebaskan neutron baharu.",
    inference:
      "Neutron baharu boleh membedil nukleus uranium lain lalu menghasilkan tindak balas berantai.",
    conclusion:
      "Rod Boron menyerap neutron untuk memperlahankan pembelahan dan mengawal tindak balas.",
    questions: [
      {
        id: "particle",
        text: "Apakah zarah yang membedil nukleus uranium dalam pembelahan?",
        options: ["Elektron", "Neutron", "Proton", "Ion klorida"],
        answer: "Neutron",
        explanation: "Betul. Neutron membedil uranium-235 dan mencetuskan pembelahan.",
        hint: "Zarah ini neutral dan boleh memasuki nukleus dengan lebih mudah.",
      },
      {
        id: "moderator",
        text: "Apakah fungsi moderator dalam reaktor nuklear?",
        options: [
          "Memperlahankan neutron",
          "Menyerap neutron",
          "Menyalakan generator",
          "Menyejukkan bandar",
        ],
        answer: "Memperlahankan neutron",
        explanation: "Betul. Moderator memperlahankan neutron supaya U-235 lebih mudah menyerapnya.",
        hint: "Moderator membantu neutron menjadi lebih sesuai untuk membelah U-235.",
      },
      {
        id: "uranium",
        text: "Nukleus manakah yang digunakan sebagai bahan api pembelahan dalam simulator ini?",
        options: ["Uranium-235", "Helium", "Deuterium", "Karbon dioksida"],
        answer: "Uranium-235",
        explanation: "Betul. Uranium-235 ialah nukleus berat yang boleh mengalami pembelahan.",
        hint: "Lihat label pada nukleus biru dalam reaktor.",
      },
      {
        id: "chain",
        text: "Apakah yang menyebabkan tindak balas berantai berlaku?",
        options: [
          "Neutron baharu membelah U-235 lain",
          "Turbin berpusing lebih laju",
          "Air bertukar menjadi wap",
          "Medan magnet menjadi lemah",
        ],
        answer: "Neutron baharu membelah U-235 lain",
        explanation: "Betul. Neutron baharu boleh membedil uranium lain dan meneruskan pembelahan.",
        hint: "Perhatikan urutan neutron → U-235 terbelah → neutron baharu.",
      },
      {
        id: "heat",
        text: "Tenaga daripada pembelahan nukleus mula-mula digunakan sebagai apa?",
        options: ["Haba", "Cahaya lampu jalan", "Bunyi", "Medan magnet"],
        answer: "Haba",
        explanation: "Betul. Tenaga pembelahan digunakan sebagai haba sebelum memanaskan air.",
        hint: "Dalam janakuasa nuklear, haba memanaskan air menjadi wap.",
      },
    ],
  },
  fusion: {
    observation:
      "Pada suhu sangat tinggi dan medan magnet mencukupi, deuterium dan tritium boleh bercantum.",
    inference:
      "Pelakuran memerlukan tenaga awal yang besar untuk membolehkan nukleus ringan menghampiri antara satu sama lain.",
    conclusion:
      "Pelakuran membentuk helium, membebaskan neutron dan menghasilkan tenaga yang sangat besar.",
    questions: [
      {
        id: "fuel",
        text: "Apakah dua isotop hidrogen yang digunakan dalam pelakuran nukleus?",
        options: [
          "Deuterium dan Tritium",
          "Uranium-235 dan Boron",
          "Helium dan Karbon",
          "Oksigen dan Nitrogen",
        ],
        answer: "Deuterium dan Tritium",
        explanation: "Betul. Deuterium dan tritium ialah isotop hidrogen yang boleh bercantum.",
        hint: "Dalam chamber, atom dilabel D dan T.",
      },
      {
        id: "temperature",
        text: "Mengapa pelakuran nukleus memerlukan suhu yang sangat tinggi?",
        options: [
          "Supaya nukleus ringan mempunyai tenaga untuk bercantum",
          "Supaya rod boron menyerap neutron",
          "Supaya air membeku",
          "Supaya turbin berhenti",
        ],
        answer: "Supaya nukleus ringan mempunyai tenaga untuk bercantum",
        explanation: "Betul. Suhu tinggi membantu nukleus mengatasi tolakan antara cas positif.",
        hint: "Dua nukleus bercas positif perlu cukup tenaga untuk menghampiri satu sama lain.",
      },
      {
        id: "magnet",
        text: "Apakah yang berlaku jika medan magnet terlalu rendah?",
        options: ["Plasma bocor", "Uranium terbelah", "Generator menghasilkan elektrik", "Air menjadi moderator"],
        answer: "Plasma bocor",
        explanation: "Betul. Medan magnet membantu mengurung plasma panas supaya lebih stabil.",
        hint: "Medan magnet bertindak seperti pengurung plasma dalam ruang pelakuran.",
      },
      {
        id: "collision",
        text: "Mengapa halaju pelanggaran nukleus perlu tinggi?",
        options: [
          "Supaya D dan T boleh bertembung dan bercantum",
          "Supaya rod kawalan turun",
          "Supaya wap menjadi sejuk",
          "Supaya neutron berhenti bergerak",
        ],
        answer: "Supaya D dan T boleh bertembung dan bercantum",
        explanation: "Betul. Pelanggaran yang cukup kuat membolehkan pelakuran berlaku.",
        hint: "Pelakuran memerlukan nukleus ringan menghampiri dan bertembung.",
      },
      {
        id: "product",
        text: "Apakah hasil utama selepas deuterium dan tritium berjaya bercantum?",
        options: ["Helium, neutron dan tenaga", "Uranium dan wap", "Boron dan grafit", "Elektron dan garam"],
        answer: "Helium, neutron dan tenaga",
        explanation: "Betul. Pelakuran D-T menghasilkan helium, neutron dan tenaga besar.",
        hint: "Lihat objek yang muncul di tengah chamber selepas pelakuran berjaya.",
      },
    ],
  },
  plant: {
    observation:
      "Apabila loji dihidupkan, haba daripada reaktor memanaskan air sehingga menjadi wap.",
    inference:
      "Tekanan wap memutarkan turbin, kemudian generator menukar tenaga mekanikal kepada elektrik.",
    conclusion:
      "Janakuasa nuklear menggunakan pembelahan nukleus sebagai sumber haba untuk menjana elektrik.",
    questions: [
      {
        id: "steam",
        text: "Apakah hasil akhir yang memutarkan turbin?",
        options: ["Wap", "Neutron", "Rod kawalan", "Grafit"],
        answer: "Wap",
        explanation: "Betul. Wap bertekanan memutarkan turbin.",
        hint: "Air dipanaskan dahulu sebelum sampai ke turbin.",
      },
      {
        id: "generator",
        text: "Apakah fungsi generator dalam stesen janakuasa nuklear?",
        options: [
          "Menghasilkan elektrik",
          "Menyerap neutron",
          "Membentuk helium",
          "Memperlahankan neutron",
        ],
        answer: "Menghasilkan elektrik",
        explanation:
          "Betul. Generator menukar putaran turbin kepada tenaga elektrik.",
        hint: "Komponen ini berada selepas turbin dalam aliran tenaga.",
      },
      {
        id: "controlRod",
        text: "Apakah fungsi rod kawalan dalam reaktor nuklear?",
        options: [
          "Menyerap neutron untuk mengawal pembelahan",
          "Memutarkan turbin secara terus",
          "Menghasilkan rumah",
          "Menukar wap kepada uranium",
        ],
        answer: "Menyerap neutron untuk mengawal pembelahan",
        explanation: "Betul. Rod kawalan mengurangkan bilangan neutron bebas dalam reaktor.",
        hint: "Rod kawalan berkaitan dengan kadar pembelahan nukleus.",
      },
      {
        id: "cooling",
        text: "Mengapa sistem penyejukan penting dalam loji nuklear?",
        options: [
          "Membawa haba keluar supaya reaktor tidak terlalu panas",
          "Menghasilkan deuterium",
          "Menukar elektrik kepada wap",
          "Menghalang turbin daripada berpusing",
        ],
        answer: "Membawa haba keluar supaya reaktor tidak terlalu panas",
        explanation: "Betul. Agen penyejuk membawa haba keluar dan membantu suhu kekal selamat.",
        hint: "Perhatikan slider agen penyejuk dalam loji.",
      },
      {
        id: "flow",
        text: "Apakah urutan tenaga yang betul dalam stesen janakuasa nuklear?",
        options: [
          "Reaktor → wap → turbin → generator → elektrik",
          "Generator → uranium → wap → rumah",
          "Turbin → neutron → moderator → helium",
          "Bandar → generator → wap → reaktor",
        ],
        answer: "Reaktor → wap → turbin → generator → elektrik",
        explanation: "Betul. Haba reaktor menghasilkan wap, wap memutarkan turbin, generator menghasilkan elektrik.",
        hint: "Ikut aliran kiri ke kanan dalam infographic loji.",
      },
    ],
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getUraniumCount(uraniumRod) {
  return clamp(2 + Math.round((uraniumRod / 100) * 10), 2, uraniumPositions.length);
}

function getModeratorStatus(graphiteRod) {
  if (graphiteRod < 40) {
    return "Neutron laju";
  }

  if (graphiteRod >= 70) {
    return "Neutron perlahan";
  }

  return "Neutron sederhana";
}

function getNeutronMode(graphiteRod) {
  if (graphiteRod < 40) {
    return "fast";
  }

  return "optimal";
}

function getModeratorConcept(graphiteRod) {
  if (graphiteRod < 40) {
    return "Neutron terlalu laju dan sukar diserap oleh U-235.";
  }

  if (graphiteRod >= 70) {
    return "Rod Grafit tinggi memperlahankan neutron. Neutron perlahan lebih mudah membelah U-235.";
  }

  return "Neutron diperlahankan. U-235 lebih mudah mengalami pembelahan.";
}

function getModeratorEfficiency(graphiteRod) {
  return 0.5 + (graphiteRod / 100) * 1.5;
}

function getFissionMetrics(fission) {
  const uraniumCount = getUraniumCount(fission.uraniumRod);
  const moderatorEfficiency = getModeratorEfficiency(fission.graphiteRod);
  const uranium235 = fission.uraniumRod;
  const graphiteRod = fission.graphiteRod;
  const boronRod = fission.boronRod;
  const uraniumFactor = uranium235 / 100;
  const graphiteFactor = 0.5 + (graphiteRod / 100) * 1.5;
  const boronAbsorption = boronRod / 100;
  const activeNeutron = uraniumFactor * graphiteFactor * (1 - boronAbsorption);
  const reactionRate = Math.min(100, Math.round(activeNeutron * 100));
  const energyOutput = Math.round(reactionRate * 15);
  const neutronCount = Math.max(0, Math.round(uranium235 * graphiteFactor - boronRod * 0.8));
  const neutronSpeed = graphiteRod >= 70 ? "Perlahan" : graphiteRod >= 40 ? "Sederhana" : "Laju";
  const activeUranium = Math.max(0, uraniumCount - fission.splitIds.length);
  const moderatorStatus = getModeratorStatus(fission.graphiteRod);
  let status = "RENDAH";
  let warning = false;

  if (uranium235 >= 75 && boronRod < 50) {
    status = "BAHAYA";
    warning = true;
  } else if (reactionRate >= 80) {
    status = "TINGGI";
    warning = true;
  } else if (reactionRate >= 40) {
    status = "STABIL";
  }

  return {
    uranium235,
    graphiteRod,
    boronRod,
    uraniumCount,
    activeUranium,
    moderatorEfficiency,
    uraniumFactor,
    graphiteFactor,
    boronAbsorption,
    activeNeutron,
    activeNeutronFactor: activeNeutron,
    reactionRate,
    energyOutput,
    neutronCount,
    neutronSpeed,
    moderatorStatus,
    status,
    statusDisplay: status.charAt(0) + status.slice(1).toLowerCase(),
    warning,
    highUranium: uranium235 >= 75,
    criticalDanger: uranium235 >= 75 && boronRod < 50,
  };
}

function getFissionMessage(fission, metrics) {
  if (metrics.criticalDanger) {
    return "Bahaya: Tingkatkan Rod Boron";
  }

  if ((fission.coolantFlow ?? 0) >= 82 && fission.temperature > 420) {
    return "Agen penyejuk mengalir deras dan membuang haba daripada teras reaktor.";
  }

  if (fission.boronRod >= 95) {
    return "Rod boron menyerap hampir semua neutron. Tindak balas pembelahan menjadi sangat rendah.";
  }

  if (metrics.highUranium) {
    return "Kadar tindak balas tinggi. Tingkatkan Rod Boron sekurang-kurangnya 50% untuk menyerap neutron berlebihan.";
  }

  if (fission.uraniumRod > 84 && metrics.reactionRate > 70) {
    return "Rod uranium tinggi: lebih banyak U-235 menyebabkan neutron mudah mencetuskan pembelahan berantai.";
  }

  if (fission.graphiteRod < 40) {
    return "Rod Grafit rendah. Neutron bergerak laju, maka pembelahan Uranium-235 kurang berkesan.";
  }

  if (fission.graphiteRod >= 70) {
    return "Rod Grafit tinggi memperlahankan neutron. Neutron perlahan meningkatkan peluang pembelahan Uranium-235.";
  }

  if (metrics.reactionRate >= 55) {
    return "Rod Grafit memperlahankan neutron. Kadar pembelahan meningkat apabila neutron lebih mudah mengenai U-235.";
  }

  return fission.message;
}

function getFissionDisplayStatus(fission, metrics) {
  return metrics.statusDisplay;
}

function getFissionPhaseIndex(fission, metrics) {
  if (!fission.hasStarted) {
    return 0;
  }

  if (fission.boronRod >= 95 && Math.round(fission.neutronCount ?? 0) <= 0) {
    return 1;
  }

  if (fission.splitIds.length > 0 && metrics.reactionRate >= 64) {
    return 7;
  }

  if (fission.splitIds.length > 0) {
    return clamp(3 + Math.min(fission.cycle, 3), 3, 6);
  }

  if (fission.running && fission.cycle <= 1) {
    return 1;
  }

  if (fission.running) {
    return 2;
  }

  return Math.min(fissionProcessSteps.length - 1, Math.max(0, fission.cycle));
}

function advanceFission(current) {
  const metrics = getFissionMetrics(current);
  const visibleUraniumIds = uraniumPositions.slice(0, metrics.uraniumCount).map((position) => position.id);
  const currentSplitIds = (current.splitIds ?? []).filter((id) => visibleUraniumIds.includes(id));
  const currentFragments = (current.fragmentBursts ?? []).filter((burst) => currentSplitIds.includes(burst.id));
  const setFullySplit = visibleUraniumIds.length > 0 && currentSplitIds.length >= visibleUraniumIds.length;
  const nextEnergy = current.hasStarted ? Math.max(0, metrics.energyOutput) : 0;
  const activeNeutronsInput = current.hasStarted
    ? Math.max(0, Math.round(current.neutronCount ?? INITIAL_CHAIN_NEUTRONS))
    : INITIAL_CHAIN_NEUTRONS;

  if (setFullySplit) {
    if (current.neutronFadeOut) {
      return {
        ...current,
        running: true,
        paused: false,
        cycle: current.cycle + 1,
        splitIds: [],
        fragmentBursts: [],
        neutronFadeOut: false,
        neutronCount: INITIAL_CHAIN_NEUTRONS,
        energy: nextEnergy,
        temperature: clamp(Math.round(current.temperature - 18), 220, 1100),
        message: "Set Uranium-235 baharu muncul. Satu neutron pertama memulakan pembelahan semula.",
      };
    }

    return {
      ...current,
      running: true,
      cycle: current.cycle + 1,
      splitIds: currentSplitIds,
      fragmentBursts: currentFragments,
      neutronFadeOut: true,
      neutronCount: Math.max(activeNeutronsInput, INITIAL_CHAIN_NEUTRONS),
      energy: nextEnergy,
      temperature: clamp(Math.round(current.temperature - 18), 220, 1100),
      message: "Semua Uranium-235 dalam set ini telah dibelah. Neutron bebas fade out sebelum set baharu bermula.",
    };
  }

  const uraniumDensity = current.uraniumRod / 100;
  const coolantFlow = current.coolantFlow ?? initialFission.coolantFlow;
  const boronAbsorptionRate = clamp((current.boronRod / 100) * 0.86, 0, 0.94);
  const shouldPreserveCollision =
    activeNeutronsInput > 0 && metrics.reactionRate >= 40 && current.boronRod < 95;
  const protectedCollisionNeutrons = shouldPreserveCollision ? 1 : 0;
  const absorbableNeutrons = Math.max(0, activeNeutronsInput - protectedCollisionNeutrons);
  const boronAbsorbed =
    current.boronRod >= 95
      ? Math.min(activeNeutronsInput, Math.ceil(activeNeutronsInput * boronAbsorptionRate))
      : Math.min(absorbableNeutrons, Math.floor(absorbableNeutrons * boronAbsorptionRate));
  const fastEscapeRate = current.graphiteRod < 40 ? clamp((40 - current.graphiteRod) / 80, 0.08, 0.5) : 0;
  const sparseEscapeRate = current.uraniumRod < 35 ? clamp((35 - current.uraniumRod) / 140, 0.02, 0.22) : 0;
  const escaped = Math.min(
    Math.max(0, activeNeutronsInput - boronAbsorbed),
    Math.round(Math.max(0, activeNeutronsInput - boronAbsorbed) * (fastEscapeRate + sparseEscapeRate))
  );
  const effectiveNeutrons = Math.max(
    protectedCollisionNeutrons,
    activeNeutronsInput - boronAbsorbed - escaped
  );
  const collisionEfficiency = clamp(
    0.22 + uraniumDensity * 0.45 + Math.min(metrics.graphiteFactor / 2, 1) * 0.35,
    0.08,
    1
  );
  const splitDemand = Math.round(effectiveNeutrons * collisionEfficiency);
  const minimumHit = metrics.reactionRate >= 12 && effectiveNeutrons > 0 && current.boronRod < 94 ? 1 : 0;
  const unsplitIds = visibleUraniumIds.filter((id) => !currentSplitIds.includes(id));
  const splitEvents = effectiveNeutrons <= 0
    ? 0
    : clamp(Math.max(splitDemand, minimumHit), 0, Math.min(1, effectiveNeutrons, unsplitIds.length));
  const producedNeutrons = splitEvents * NEUTRONS_PER_FISSION;
  const remainingNeutrons = Math.max(0, activeNeutronsInput - splitEvents - boronAbsorbed - escaped);
  const nextNeutrons = clamp(remainingNeutrons + producedNeutrons, 0, MAX_CHAIN_NEUTRONS);
  const coolantCooling = Math.round(coolantFlow * (current.temperature > 900 ? 1.18 : 0.72));
  const heatGain =
    splitEvents * (22 + Math.round(current.uraniumRod / 4.5)) +
    producedNeutrons * 2 +
    Math.round(metrics.reactionRate * 0.08) -
    Math.round(current.boronRod * 0.45) -
    coolantCooling -
    Math.round(escaped * 4) -
    (splitEvents === 0 ? 22 : 0);
  const nextTemperature = clamp(Math.round(current.temperature + heatGain), 220, 1100);
  const newSplitIds = unsplitIds.slice(0, splitEvents);
  const nextSplitIds = [...currentSplitIds, ...newSplitIds.filter((id) => id && !currentSplitIds.includes(id))];
  const fragmentBursts = [
    ...currentFragments,
    ...newSplitIds.filter(Boolean).map((id, index) => ({
      id,
      cycle: current.cycle + 1,
      key: `${current.cycle + 1}-${id}-${index}`,
    })),
  ].slice(-uraniumPositions.length);
  const nextMetrics = getFissionMetrics({
    ...current,
    neutronCount: nextNeutrons,
    temperature: nextTemperature,
    energy: nextEnergy,
    splitIds: nextSplitIds,
  });
  const completedSet = nextSplitIds.length >= visibleUraniumIds.length && visibleUraniumIds.length > 0;
  const controlledStop = !completedSet && current.boronRod >= 95 && nextNeutrons <= 1;
  const displayNeutronCount = completedSet
    ? Math.max(nextNeutrons, producedNeutrons, INITIAL_CHAIN_NEUTRONS)
    : nextNeutrons;

  return {
    ...current,
    running: completedSet || (!controlledStop && nextNeutrons > 0),
    cycle: current.cycle + 1,
    splitIds: nextSplitIds,
    fragmentBursts,
    neutronFadeOut: completedSet,
    neutronCount: displayNeutronCount,
    splitCount: current.splitCount + splitEvents,
    absorbedCount: current.absorbedCount + boronAbsorbed,
    energy: nextEnergy,
    temperature: nextTemperature,
    message:
      splitEvents > 0
        ? completedSet
          ? "Semua Uranium-235 dalam set ini telah dibelah. Set baharu akan bermula selepas serpihan kelihatan."
          : `${splitEvents} nukleus U-235 terbelah dan melepaskan ${producedNeutrons} neutron baharu.`
        : nextNeutrons <= 0
        ? "Neutron aktif tiada. Rod Boron menyerap neutron atau neutron terlalu laju untuk mencetuskan pembelahan."
        : getFissionMessage(current, nextMetrics),
  };
}

function getFuelRatioLabel(value) {
  const deuterium = Math.round(value);
  const tritium = 100 - deuterium;
  return `D ${deuterium}:T ${tritium}`;
}

function getFusionDiagnostics(fusion) {
  const atomsReady = fusion.deuteriumPlaced && fusion.tritiumPlaced;
  const fuelOffset = Math.abs(fusion.fuelBalance - 50);
  const temperatureOk = fusion.temperature >= 80 && fusion.temperature <= 95;
  const temperatureTooHigh = fusion.temperature > 95;
  const magneticOk = fusion.magneticField >= 60;
  const collisionOk = fusion.collisionSpeed >= 70;
  const fuelOk = fuelOffset <= 10;
  const projectedEnergy = Math.round(
    clamp(
      fusion.temperature * 0.75 +
        fusion.magneticField * 0.28 +
        fusion.collisionSpeed * 0.48 +
        45 -
        fuelOffset * 0.45,
      0,
      160
    )
  );
  const outputTooHigh = atomsReady && projectedEnergy > 145 && (fusion.temperature > 92 || fusion.collisionSpeed > 92);
  const collisionUncontrolled = atomsReady && fusion.collisionSpeed > 88 && fusion.magneticField < 70;
  const danger =
    temperatureTooHigh ||
    fusion.magneticField < 35 ||
    outputTooHigh ||
    collisionUncontrolled ||
    (fusion.active && !fusion.success && (fusion.collisionSpeed > 88 || fusion.magneticField < 45));
  const stability = clamp(
    Math.round(
      (magneticOk ? 26 : fusion.magneticField * 0.36) +
        (temperatureOk ? 28 : fusion.temperature >= 65 ? 16 : fusion.temperature * 0.18) +
        (collisionOk ? 22 : fusion.collisionSpeed * 0.22) +
        (fuelOk ? 18 : Math.max(0, 18 - fuelOffset * 1.2)) +
        (atomsReady ? 8 : 0) -
        (temperatureTooHigh ? 30 : 0)
    ),
    0,
    100
  );
  const almostStable =
    atomsReady &&
    !danger &&
    fusion.temperature >= 70 &&
    fusion.magneticField >= 50 &&
    fusion.collisionSpeed >= 60 &&
    fuelOffset <= 20;
  const liveEnergy = fusion.success
    ? fusion.energy
    : fusion.active
    ? danger
      ? projectedEnergy
      : Math.round(clamp((fusion.temperature + fusion.collisionSpeed + fusion.magneticField) / 3 - fuelOffset, 0, 120))
    : fusion.energy;
  let status = "Gagal";

  if (danger) {
    status = "Tidak stabil";
  } else if (!fusion.active) {
    status = almostStable ? "Hampir stabil" : "Sedia";
  } else if (fusion.success) {
    status = "Berjaya";
  } else if (almostStable) {
    status = "Hampir stabil";
  }

  return {
    atomsReady,
    temperatureOk,
    temperatureTooHigh,
    magneticOk,
    collisionOk,
    fuelOk,
    fuelOffset,
    projectedEnergy,
    outputTooHigh,
    collisionUncontrolled,
    danger,
    stability,
    almostStable,
    liveEnergy,
    status,
  };
}

function getFusionFailureMessage(fusion, diagnostics) {
  if (!diagnostics.atomsReady) {
    return "Masukkan Deuterium dan Tritium ke dalam plasma chamber dahulu.";
  }

  if (diagnostics.temperatureTooHigh) {
    return "AMARAN: Plasma terlalu panas. Kurangkan suhu dan kuatkan medan magnet.";
  }

  if (diagnostics.outputTooHigh) {
    return "AMARAN: Output tenaga terlalu tinggi. Kurangkan suhu atau halaju pelanggaran.";
  }

  if (diagnostics.collisionUncontrolled) {
    return "Pelanggaran terlalu agresif untuk medan magnet semasa. Kuatkan medan magnet atau kurangkan halaju.";
  }

  if (fusion.temperature < 80) {
    return "Suhu rendah. Nukleus D dan T belum mempunyai tenaga mencukupi untuk bercantum.";
  }

  if (!diagnostics.magneticOk) {
    return "Medan magnet lemah. Plasma bocor dan pelakuran gagal.";
  }

  if (!diagnostics.collisionOk) {
    return "Halaju pelanggaran rendah. D dan T berlanggar tetapi terpisah semula.";
  }

  if (!diagnostics.fuelOk) {
    return "Nisbah Deuterium:Tritium tidak seimbang. Laraskan nisbah ke hampir 50:50.";
  }

  return "Keadaan hampir stabil. Laraskan pembolehubah sedikit lagi sebelum cuba semula.";
}

function NuclearMeter({ label, value, detail, fill, tone = "cyan" }) {
  return (
    <article className={`nuclearMeter nuclearMeter--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {detail ? <p>{detail}</p> : null}
      <i style={{ "--fill": `${clamp(fill ?? 0, 0, 100)}%` }} aria-hidden="true" />
    </article>
  );
}

function NuclearGauge({ label, value, detail, fill, tone = "cyan" }) {
  const gaugeFill = clamp(fill ?? 0, 0, 100);

  return (
    <article className={`nuclearGauge nuclearGauge--${tone}`}>
      <div className="nuclearGauge__arc">
        <svg viewBox="0 0 120 72" aria-hidden="true">
          <path className="nuclearGauge__track" d="M 12 60 A 48 48 0 0 1 108 60" pathLength="100" />
          <path
            className="nuclearGauge__value"
            d="M 12 60 A 48 48 0 0 1 108 60"
            pathLength="100"
            strokeDasharray={`${gaugeFill} 100`}
          />
        </svg>
        <strong>{value}</strong>
      </div>
      <span>{label}</span>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function NuclearDangerOverlay({ show, message }) {
  if (!show) {
    return null;
  }

  return (
    <div className="nuclearDangerOverlay" aria-hidden="true">
      <div className="nuclearDangerOverlay__card">
        <span className="nuclearDangerOverlay__symbol">☢</span>
        <strong>BAHAYA</strong>
        <small>{message}</small>
      </div>
    </div>
  );
}

function FusionGaugeControl({
  label,
  value,
  min = 0,
  max = 100,
  unit = "%",
  tone = "cyan",
  leftLabel,
  centerLabel,
  rightLabel,
  displayValue,
  optimal = false,
  onChange,
}) {
  const gaugeRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const percent = clamp(((value - min) / (max - min)) * 100, 0, 100);
  const angle = -90 + percent * 1.8;

  const updateFromPointer = (event) => {
    const element = gaugeRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.78;
    const x = event.clientX - centerX;
    const y = centerY - event.clientY;
    const pointerAngle = clamp((Math.atan2(y, x) * 180) / Math.PI, 0, 180);
    const nextPercent = clamp(((180 - pointerAngle) / 180) * 100, 0, 100);
    const nextValue = Math.round(min + (nextPercent / 100) * (max - min));

    onChange(nextValue);
  };

  const handlePointerDown = (event) => {
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove = (event) => {
    if (dragging) {
      updateFromPointer(event);
    }
  };

  const stopDragging = () => setDragging(false);

  return (
    <article className={`fusionGauge fusionGauge--${tone}${optimal ? " fusionGauge--optimal" : ""}`}>
      <button
        type="button"
        ref={gaugeRef}
        className="fusionGauge__dial"
        style={{ "--gauge-fill": `${percent}%`, "--needle-angle": `${angle}deg` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        aria-label={`${label}: ${displayValue ?? `${value}${unit}`}`}
      >
        <svg viewBox="0 0 140 92" aria-hidden="true">
          <defs>
            <linearGradient id="fusionHeatGradient" x1="18" y1="74" x2="122" y2="74" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="52%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path className="fusionGauge__track" d="M 18 74 A 52 52 0 0 1 122 74" pathLength="100" />
          <path
            className="fusionGauge__value"
            d="M 18 74 A 52 52 0 0 1 122 74"
            pathLength="100"
            strokeDasharray={`${percent} 100`}
          />
        </svg>
        <span className="fusionGauge__needle" />
        <strong>{displayValue ?? `${value}${unit}`}</strong>
      </button>
      <div className="fusionGauge__meta">
        <span>{label}</span>
        <div>
          <small>{leftLabel}</small>
          {centerLabel ? <small>{centerLabel}</small> : null}
          <small>{rightLabel}</small>
        </div>
      </div>
    </article>
  );
}

function NuclearSlider({
  label,
  caption,
  value,
  min,
  max,
  step = 1,
  suffix = "%",
  tone = "cyan",
  leftLabel,
  rightLabel,
  onChange,
}) {
  return (
    <label className={`nuclearSlider nuclearSlider--${tone}`}>
      <div className="nuclearSlider__top">
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
      {caption ? <small className="nuclearSlider__caption">{caption}</small> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {(leftLabel || rightLabel) && (
        <div className="nuclearSlider__ticks">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </label>
  );
}

function LearningPanel({ mode, answers, onAnswer }) {
  const content = learningContent[mode];

  return (
    <section className="nuclearLearningPanel">
      <div className="nuclearLearningGrid">
        <article>
          <span>Pemerhatian</span>
          <p>{content.observation}</p>
        </article>
        <article>
          <span>Inferens</span>
          <p>{content.inference}</p>
        </article>
        <article>
          <span>Kesimpulan</span>
          <p>{content.conclusion}</p>
        </article>
      </div>

      <div className="nuclearQuiz">
        <div className="nuclearPanelTitle">
          <span>Semak Kefahaman</span>
          <h2>Uji konsep utama</h2>
        </div>

        <div className="nuclearQuizGrid">
          {content.questions.map((question) => {
            const selected = answers[question.id];
            const correct = selected === question.answer;

            return (
              <article className="nuclearQuizCard" key={question.id}>
                <h3>{question.text}</h3>
                <div className="nuclearQuizOptions">
                  {question.options.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={[
                        "nuclearQuizOption",
                        selected === option ? "nuclearQuizOption--selected" : "",
                        selected === option && correct ? "nuclearQuizOption--correct" : "",
                        selected === option && !correct ? "nuclearQuizOption--wrong" : "",
                      ].join(" ")}
                      onClick={() => onAnswer(question.id, option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {selected ? (
                  <p
                    className={
                      correct
                        ? "nuclearQuizFeedback nuclearQuizFeedback--correct"
                        : "nuclearQuizFeedback nuclearQuizFeedback--wrong"
                    }
                  >
                    {correct ? "✅ " : "❌ "}
                    {correct ? question.explanation : question.hint}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function createNuclearQuizState() {
  return {
    index: 0,
    selected: "",
    wrongSelections: {},
    missedFirstAttempt: {},
    score: 0,
    done: false,
  };
}

function LearningPanelV2({ mode }) {
  const content = learningContent[mode];
  const [panelTab, setPanelTab] = useState("nota");
  const [quizStateByMode, setQuizStateByMode] = useState(() => ({
    fission: createNuclearQuizState(),
    fusion: createNuclearQuizState(),
    plant: createNuclearQuizState(),
  }));
  const quizState = quizStateByMode[mode] ?? createNuclearQuizState();
  const currentQuestion = content.questions[quizState.index] ?? content.questions[0];
  const selected = quizState.selected;
  const isCorrectSelection = selected === currentQuestion.answer;
  const attempted = Boolean(selected);
  const currentWrongSelections = quizState.wrongSelections[currentQuestion.id] ?? [];
  const progressStep = quizState.done ? content.questions.length : isCorrectSelection ? quizState.index + 1 : quizState.index;
  const progress = content.questions.length ? (progressStep / content.questions.length) * 100 : 0;

  useEffect(() => {
    setPanelTab("nota");
  }, [mode]);

  const updateQuizState = (updater) => {
    setQuizStateByMode((current) => {
      const activeState = current[mode] ?? createNuclearQuizState();
      return {
        ...current,
        [mode]: updater(activeState),
      };
    });
  };

  const chooseQuizOption = (option) => {
    updateQuizState((state) => {
      const activeQuestion = content.questions[state.index] ?? content.questions[0];

      if (state.done || state.selected === activeQuestion.answer) {
        return state;
      }

      if (option === activeQuestion.answer) {
        return {
          ...state,
          selected: option,
          score: state.missedFirstAttempt[activeQuestion.id] ? state.score : state.score + 1,
        };
      }

      const previousWrongSelections = state.wrongSelections[activeQuestion.id] ?? [];

      return {
        ...state,
        selected: option,
        missedFirstAttempt: {
          ...state.missedFirstAttempt,
          [activeQuestion.id]: true,
        },
        wrongSelections: {
          ...state.wrongSelections,
          [activeQuestion.id]: previousWrongSelections.includes(option)
            ? previousWrongSelections
            : [...previousWrongSelections, option],
        },
      };
    });
  };

  const goToNextQuizQuestion = () => {
    updateQuizState((state) => {
      const activeQuestion = content.questions[state.index] ?? content.questions[0];

      if (state.selected !== activeQuestion.answer) {
        return state;
      }

      if (state.index < content.questions.length - 1) {
        return {
          ...state,
          index: state.index + 1,
          selected: "",
        };
      }

      return {
        ...state,
        done: true,
      };
    });
  };

  const retryQuizForMode = () => {
    updateQuizState(() => createNuclearQuizState());
  };

  return (
    <section className="nuclearLearningPanel">
      <div className="learningPanelTabs" role="tablist" aria-label="Panel pembelajaran">
        <button type="button" className={panelTab === "nota" ? "active" : ""} onClick={() => setPanelTab("nota")}>
          Nota
        </button>
        <button type="button" className={panelTab === "kuiz" ? "active" : ""} onClick={() => setPanelTab("kuiz")}>
          Kuiz
        </button>
      </div>

      {panelTab === "nota" ? (
        <div className="nuclearLearningGrid">
          <article>
            <span>Pemerhatian</span>
            <p>{content.observation}</p>
          </article>
          <article>
            <span>Inferens</span>
            <p>{content.inference}</p>
          </article>
          <article>
            <span>Kesimpulan</span>
            <p>{content.conclusion}</p>
          </article>
        </div>
      ) : (
        <div className="nuclearQuiz">
          <div className="nuclearQuizHeader">
            <div className="nuclearPanelTitle">
              <span>Semak Kefahaman</span>
              <h2>Kuiz {MODES.find((modeItem) => modeItem.id === mode)?.label}</h2>
            </div>
            <div className="nuclearQuizScore">
              <span>{quizState.done ? "Skor" : "Kemajuan"}</span>
              <strong>
                {quizState.done ? quizState.score : progressStep}/{content.questions.length}
              </strong>
            </div>
          </div>

          <div className="nuclearQuizProgress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>

          {quizState.done ? (
            <div className="nuclearQuizComplete">
              <span>Skor cubaan pertama</span>
              <strong>{quizState.score}/{content.questions.length}</strong>
              <p>{quizState.score === content.questions.length ? "Hebat! Semua konsep utama dikuasai." : "Ulang kuiz untuk kukuhkan semula konsep."}</p>
              <button type="button" className="nuclearButton nuclearButton--primary" onClick={retryQuizForMode}>
                Ulang Kuiz
              </button>
            </div>
          ) : (
            <>
              <div className="nuclearQuizGrid nuclearQuizGrid--single">
                <article className="nuclearQuizCard" key={currentQuestion.id}>
                  <span className="nuclearQuizNumber">
                    Soalan {quizState.index + 1}/{content.questions.length}
                  </span>
                  <h3>{currentQuestion.text}</h3>
                  <div className="nuclearQuizOptions">
                    {currentQuestion.options.map((option) => {
                      const isWrong = currentWrongSelections.includes(option);
                      const isCorrect = isCorrectSelection && option === currentQuestion.answer;

                      return (
                        <button
                          type="button"
                          key={option}
                          disabled={isCorrectSelection || isWrong}
                          className={[
                            "nuclearQuizOption",
                            selected === option ? "nuclearQuizOption--selected" : "",
                            isCorrect ? "nuclearQuizOption--correct" : "",
                            isWrong ? "nuclearQuizOption--wrong" : "",
                          ].join(" ")}
                          onClick={() => chooseQuizOption(option)}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {attempted ? (
                    <div
                      className={
                        isCorrectSelection
                          ? "nuclearQuizFeedback nuclearQuizFeedback--correct"
                          : "nuclearQuizFeedback nuclearQuizFeedback--wrong"
                      }
                    >
                      {isCorrectSelection ? (
                        <>
                          <strong>Betul.</strong>
                          <p>{currentQuestion.explanation}</p>
                          <button type="button" className="nuclearButton nuclearButton--primary" onClick={goToNextQuizQuestion}>
                            {quizState.index < content.questions.length - 1 ? "Soalan Seterusnya" : "Lihat Skor"}
                          </button>
                        </>
                      ) : (
                        <>
                          <strong>Cuba lagi.</strong>
                          <p>Jawapan betul belum dipaparkan. Pilih pilihan lain sehingga tepat.</p>
                        </>
                      )}
                    </div>
                  ) : null}
                </article>
              </div>

              <div className="nuclearQuizActions">
                <button type="button" className="nuclearButton nuclearButton--ghost" onClick={retryQuizForMode}>
                  Cuba Lagi
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function FissionReactorLab({
  fission,
  metrics,
  neutronVisuals,
  activeUraniumPositions,
  fissionMessage,
  fissionDanger,
  onStart,
  onPause,
  onReset,
  onBoronChange,
  onGraphiteChange,
  onUraniumChange,
  onToggleLabels,
  onTogglePaths,
}) {
  const phaseIndex = getFissionPhaseIndex(fission, metrics);
  const displayStatus = getFissionDisplayStatus(fission, metrics);
  const statusTone =
    metrics.status === "BAHAYA" ? "danger" : metrics.status === "TINGGI" ? "rising" : metrics.status === "STABIL" ? "stable" : "low";
  const neutronDuration = clamp(0.75 + (metrics.graphiteRod / 100) * 4.2, 0.75, 4.95);
  const trailWidth = clamp(112 - metrics.graphiteRod * 0.72, 36, 112);
  const controlOffset = -58 + fission.boronRod * 0.62;
  const displayNeutronCount = fission.hasStarted
    ? Math.max(0, Math.round(fission.neutronCount ?? INITIAL_CHAIN_NEUTRONS))
    : INITIAL_CHAIN_NEUTRONS;
  const hasSplit = fission.splitIds.length > 0;
  const visualChainCount =
    hasSplit || fission.neutronFadeOut
      ? Math.min(Math.max(displayNeutronCount, fission.neutronFadeOut ? 1 : 0), 18)
      : 0;
  const chainNeutrons = neutronVisuals.slice(0, visualChainCount);
  const activeMessage =
    metrics.criticalDanger
      ? fissionMessage
      : fission.hasStarted
      ? fission.message
      : fissionMessage;
  const visibleAtomPositions = activeUraniumPositions.filter((position) => !fission.splitIds.includes(position.id));
  const absorbedVisualCount = Math.min(8, Math.round(metrics.boronRod / 14));
  const fragmentBursts =
    fission.fragmentBursts?.length > 0
      ? fission.fragmentBursts
      : fission.splitIds.map((id, index) => ({ id, key: `${fission.cycle}-${id}-${index}` }));
  const activeControlAction =
    fission.paused
      ? "pause"
      : fission.running
      ? "start"
      : fission.lastAction === "reset"
      ? "reset"
      : fission.lastAction ?? "idle";
  const activeObservationIndex = Math.min(
    fissionObservationRows.length - 1,
    fission.hasStarted ? Math.floor(phaseIndex / 2) : 0
  );

  return (
    <section className="nuclearFissionLab" aria-label="Simulator pembelahan nukleus">
      <aside className="nuclearPanel fissionControlPanel">
        <div className="nuclearPanelTitle">
          <span>Kawalan</span>
          <h2>Pembelahan Nukleus</h2>
        </div>

        <div className="fissionActionRow">
          <button
            type="button"
            className={[
              "nuclearButton fissionButton fissionButton--start",
              activeControlAction === "start" ? "fissionButton--active" : "",
            ].join(" ")}
            aria-pressed={activeControlAction === "start"}
            onClick={onStart}
          >
            <span>Mula Simulasi</span>
          </button>
          <button
            type="button"
            className={[
              "nuclearButton fissionButton fissionButton--stop",
              activeControlAction === "pause" ? "fissionButton--active" : "",
            ].join(" ")}
            aria-pressed={activeControlAction === "pause"}
            onClick={onPause}
          >
            <span>Hentikan</span>
          </button>
          <button
            type="button"
            className={[
              "nuclearButton fissionButton fissionButton--reset",
              activeControlAction === "reset" ? "fissionButton--active" : "",
            ].join(" ")}
            aria-pressed={activeControlAction === "reset"}
            onClick={onReset}
          >
            <span>Reset</span>
          </button>
        </div>

        <NuclearSlider
          label="Rod Boron"
          caption="Menyerap neutron"
          value={fission.boronRod}
          min={0}
          max={100}
          suffix="%"
          leftLabel="Rendah"
          rightLabel="Tinggi"
          tone="boron"
          onChange={onBoronChange}
        />
        <NuclearSlider
          label="Rod Grafit"
          caption="Memperlahankan neutron"
          value={fission.graphiteRod}
          min={0}
          max={100}
          suffix="%"
          leftLabel="Rendah"
          rightLabel="Tinggi"
          tone="graphite"
          onChange={onGraphiteChange}
        />
        <NuclearSlider
          label="Uranium-235"
          caption="Bahan api nuklear"
          value={fission.uraniumRod}
          min={0}
          max={100}
          suffix="%"
          leftLabel="Sedikit"
          rightLabel="Banyak"
          tone="uranium"
          onChange={onUraniumChange}
        />

        <div className="fissionToggleGrid">
          <label className="fissionSwitch">
            <input
              type="checkbox"
              checked={fission.showLabels}
              onChange={(event) => onToggleLabels(event.target.checked)}
            />
            <span />
            <strong>Tunjuk label</strong>
          </label>
          <label className="fissionSwitch">
            <input
              type="checkbox"
              checked={fission.showPaths}
              onChange={(event) => onTogglePaths(event.target.checked)}
            />
            <span />
            <strong>Tunjuk laluan neutron</strong>
          </label>
        </div>

        <p className="fissionControlHint">
          Uranium-235 menaikkan peluang pembelahan. Rod grafit memperlahankan neutron. Rod boron menyerap neutron
          berlebihan.
        </p>
      </aside>

      <section
        className={[
          "nuclearFissionStage",
          fission.running ? "nuclearFissionStage--running" : "",
          fission.paused ? "nuclearFissionStage--paused" : "",
          fission.splitIds.length > 0 ? "nuclearFissionStage--split" : "",
          fission.neutronFadeOut ? "nuclearFissionStage--neutron-fade" : "",
          fission.showLabels ? "nuclearFissionStage--labels" : "",
          fission.showPaths ? "nuclearFissionStage--paths" : "",
          fissionDanger ? "nuclearFissionStage--danger" : "",
        ].join(" ")}
        style={{
          "--reactor-background": `url(${fissionAssets.background})`,
          "--uranium-image": `url(${fissionAssets.uranium})`,
          "--neutron-image": `url(${fissionAssets.neutron})`,
          "--fragment-image": `url(${fissionAssets.fragment})`,
          "--energy-image": `url(${fissionAssets.energy})`,
          "--trail-image": `url(${fissionAssets.trail})`,
          "--control-rod-image": `url(${fissionAssets.controlRod})`,
          "--control-offset": `${controlOffset}%`,
          "--neutron-duration": `${neutronDuration}s`,
          "--chain-duration": `${neutronDuration * 0.86}s`,
          "--trail-width": `${trailWidth}px`,
          "--reaction-glow": `${0.16 + metrics.reactionRate / 220}`,
          "--reaction-green-alpha": `${0.08 + metrics.reactionRate / 340}`,
          "--energy-alpha": `${0.06 + metrics.reactionRate / 170}`,
        }}
        aria-label="Kawasan simulasi utama pembelahan nukleus"
      >
        <div className="fissionReactorBackdrop" aria-hidden="true" />
        <div className="fissionReactorShade" aria-hidden="true" />

        {fission.showPaths ? (
          <div className="fissionPathLayer" aria-hidden="true">
            <span className="fissionPath fissionPath--incoming" />
            <span className="fissionPath fissionPath--upper" />
            <span className="fissionPath fissionPath--middle" />
            <span className="fissionPath fissionPath--lower" />
          </div>
        ) : null}

        <div className="fissionControlRodAssembly" aria-hidden="true">
          {[0, 1, 2, 3].map((rod) => (
            <span key={rod} className="fissionControlRod" style={{ "--rod-index": rod }} />
          ))}
        </div>

        <div className="fissionAtomLayer" aria-hidden="true">
          {visibleAtomPositions.map((position, index) => {
            return (
              <div
                className={[
                  "fissionAtom",
                  position.primary ? "fissionAtom--primary" : "",
                ].join(" ")}
                key={position.id}
                style={{
                  left: position.left,
                  top: position.top,
                  "--atom-scale": position.scale ?? 1,
                  "--atom-delay": `${index * 0.08}s`,
                }}
              >
                {fission.showLabels && (position.primary || index === 1) ? <span>Uranium-235</span> : null}
              </div>
            );
          })}
        </div>

        {!hasSplit && !fission.neutronFadeOut ? (
          <div className="fissionIncomingNeutron" aria-hidden="true">
            <span className="fissionNeutronTrail" />
            <span className="fissionNeutronOrb" />
            {fission.showLabels ? <strong>Neutron</strong> : null}
          </div>
        ) : null}

        <div className="fissionChainNeutronLayer" aria-hidden="true">
          {fission.hasStarted
            ? chainNeutrons.map((neutron, index) => (
                <span
                  className="fissionChainNeutron"
                  key={neutron.id}
                  style={{
                    "--from-x": neutron.fromX,
                    "--from-y": neutron.fromY,
                    "--dx": neutron.dx,
                    "--dy": neutron.dy,
                    "--neutron-delay": `${(index % 6) * -0.28}s`,
                    "--neutron-size": `${index < 3 ? 30 : 22}px`,
                  }}
                >
                  <i />
                </span>
              ))
            : null}
        </div>

        {absorbedVisualCount > 0 ? (
          <div className="fissionAbsorbedNeutronLayer" aria-hidden="true">
            {Array.from({ length: absorbedVisualCount }).map((_, index) => (
              <span key={`absorbed-${index}`} style={{ "--absorbed-index": index }} />
            ))}
          </div>
        ) : null}

        <div className="fissionFragmentLayer" aria-hidden="true">
          {fragmentBursts.map((burst, index) => {
            const position = uraniumPositions.find((item) => item.id === burst.id) || uraniumPositions[0];

            return (
              <div
                className="fissionFragmentBurst"
                key={burst.key}
                style={{ left: position.left, top: position.top, "--fragment-delay": `${index * 0.08}s` }}
              >
                <span className="fissionFragment fissionFragment--a" />
                <span className="fissionFragment fissionFragment--b" />
              </div>
            );
          })}
        </div>

        <div className="fissionEnergyBurst" aria-hidden="true">
          <span />
        </div>

        <div className="fissionSparkField" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((spark) => (
            <span key={spark} style={{ "--spark-index": spark }} />
          ))}
        </div>

        {fission.showLabels ? (
          <div className="fissionStageLabels" aria-hidden="true">
            {fission.hasStarted ? <span className="fissionLabel fissionLabel--unstable">Nukleus tidak stabil</span> : null}
            {hasSplit ? <span className="fissionLabel fissionLabel--fragments">Serpihan pembelahan</span> : null}
            {hasSplit ? <span className="fissionLabel fissionLabel--energy">Tenaga dibebaskan</span> : null}
            {hasSplit ? <span className="fissionLabel fissionLabel--new">Neutron baharu</span> : null}
            {hasSplit ? <span className="fissionLabel fissionLabel--chain">Tindak balas berantai</span> : null}
            <span className="fissionLabel fissionLabel--rod">Rod boron</span>
          </div>
        ) : null}

        {metrics.criticalDanger ? (
          <div className="fissionDangerBadge" aria-hidden="true">
            <span>!</span>
            <strong>Bahaya: Tingkatkan Rod Boron</strong>
          </div>
        ) : null}

        <div className="fissionStageReadout">
          <strong>{fissionProcessSteps[phaseIndex]}</strong>
          <span>{activeMessage}</span>
        </div>
      </section>

      <aside className="nuclearPanel fissionInfoPanel">
        <div className="nuclearPanelTitle">
          <span>Status</span>
          <h2>Maklumat Proses</h2>
        </div>

        <div className="fissionStatusGrid">
          <article className="fissionStatusMetric fissionStatusMetric--neutron">
            <span>Neutron aktif</span>
            <strong>{displayNeutronCount}</strong>
          </article>
          <article className="fissionStatusMetric fissionStatusMetric--speed">
            <span>Kelajuan neutron</span>
            <strong>{metrics.neutronSpeed}</strong>
          </article>
          <article className="fissionStatusMetric fissionStatusMetric--rate">
            <span>Kadar tindak balas</span>
            <strong>{metrics.reactionRate}%</strong>
          </article>
          <article className="fissionStatusMetric fissionStatusMetric--energy">
            <span>Tenaga terhasil</span>
            <strong>{metrics.energyOutput.toLocaleString()} MW</strong>
          </article>
          <article className={`fissionStatusCard fissionStatusCard--${statusTone}`}>
            <span>Status sistem</span>
            <strong>{displayStatus}</strong>
          </article>
        </div>

      </aside>

      <section className="fissionObservationPanel" aria-label="Jadual pemerhatian pembelahan nukleus">
        <div className="nuclearPanelTitle">
          <span>Pemerhatian</span>
          <h2>Status Simulasi</h2>
        </div>
        <div className="fissionObservationTableWrap">
          <table className="fissionObservationTable">
            <thead>
              <tr>
                <th>Langkah</th>
                <th>Peristiwa</th>
                <th>Pemerhatian</th>
              </tr>
            </thead>
            <tbody>
              {fissionObservationRows.map((row, index) => (
                <tr key={row.step} className={index === activeObservationIndex ? "active" : ""}>
                  <td>{row.step}</td>
                  <td>{row.event}</td>
                  <td>{row.observation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default function NuclearEnergySimulatorPage() {
  const [activeMode, setActiveMode] = useState("fission");
  const [fission, setFission] = useState(initialFission);
  const [fusion, setFusion] = useState(initialFusion);
  const [plant, setPlant] = useState(initialPlant);
  const [quizAnswers, setQuizAnswers] = useState({
    fission: {},
    fusion: {},
    plant: {},
  });
  const [quizSubmitted, setQuizSubmitted] = useState({
    fission: false,
    fusion: false,
    plant: false,
  });
  useEffect(() => {
    if (activeMode !== "fission" || !fission.running || fission.paused) {
      return undefined;
    }

    const tickMs = Math.round(clamp(620 + fission.graphiteRod * 9.8, 620, 1600));
    const timer = window.setInterval(() => {
      setFission((current) => advanceFission(current));
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [activeMode, fission.running, fission.paused, fission.graphiteRod]);

  useEffect(() => {
    if (activeMode !== "fission" || fission.temperature <= initialFission.temperature) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFission((current) => {
        if (current.temperature <= initialFission.temperature) {
          return current;
        }

        const metrics = getFissionMetrics(current);
        const coolantFlow = current.coolantFlow ?? initialFission.coolantFlow;
        const coolantCooling = Math.round(coolantFlow * (current.temperature > 900 ? 1.16 : 0.68));
        const boronCooling = Math.round(current.boronRod * 0.22);
        const passiveCooling = current.running ? 6 : 18;
        const activeHeat = current.running ? Math.round(metrics.reactionRate * 0.18) : 0;
        const coolingPower = Math.max(3, coolantCooling + boronCooling + passiveCooling - activeHeat);
        const nextTemperature = Math.max(initialFission.temperature, current.temperature - coolingPower);
        const wasDanger = current.temperature > 900;
        const isNowStable = nextTemperature <= 900;

        return {
          ...current,
          temperature: nextTemperature,
          message:
            wasDanger && isNowStable
              ? "Agen penyejuk berjaya menurunkan suhu reaktor ke zon selamat."
              : current.message,
        };
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, [activeMode, fission.temperature, fission.coolantFlow, fission.boronRod, fission.running]);

  const fissionMetrics = useMemo(() => getFissionMetrics(fission), [fission]);
  const fissionStatus = fissionMetrics.status;
  const fissionMessage = getFissionMessage(fission, fissionMetrics);
  const fissionDanger = fissionMetrics.criticalDanger;
  const coolantLevel = (fission.coolantFlow ?? initialFission.coolantFlow) / 100;
  const neutronMode = getNeutronMode(fission.graphiteRod);
  const moderatorConcept = getModeratorConcept(fission.graphiteRod);
  const neutronBaseSpeed = fissionMetrics.neutronSpeed === "Laju" ? 0.8 : fissionMetrics.neutronSpeed === "Perlahan" ? 3.6 : 2.05;
  const activeUraniumPositions = uraniumPositions.slice(0, fissionMetrics.uraniumCount);
  const activeChainNeutronCount = fission.hasStarted
    ? Math.max(0, Math.round(fission.neutronCount ?? INITIAL_CHAIN_NEUTRONS))
    : INITIAL_CHAIN_NEUTRONS;
  const visualNeutronCount =
    !fission.hasStarted || (activeChainNeutronCount <= 0 && !fission.neutronFadeOut)
      ? 0
      : Math.min(Math.max(activeChainNeutronCount, fission.neutronFadeOut ? 1 : 0), 18);
  const neutronVisuals = Array.from(
    { length: visualNeutronCount },
    (_, index) => {
      const path = neutronPaths[(index + fission.cycle) % neutronPaths.length];
      return {
        ...path,
        id: `${fission.cycle}-${index}`,
        delay: `${(index % 6) * -0.22}s`,
        speed: `${clamp(neutronBaseSpeed + index * 0.04, 0.42, 5.2)}s`,
        rippleDelay: `${(index % 5) * -0.18}s`,
      };
    }
  );
  const graphiteRodCount = Math.round(fission.graphiteRod / 20);

  const plantData = useMemo(() => {
    const steamLimit = Math.round(clamp((plant.uranium235 - 20) * 1.55, 18, 100));

    if (!plant.active) {
      return {
        temperature: 35,
        steam: 0,
        requestedSteam: plant.steamVelocity,
        effectiveSteam: 0,
        steamLimit,
        turbine: 0,
        output: 0,
        outputMW: 0,
        outputPercent: 0,
        electricSymbols: 0,
        lampPower: 0,
        smokePuffs: 0,
        smokePower: 0,
        reactorHeat: 0,
        nuclearLoad: plant.uranium235,
        coolantStress: clamp(100 - plant.coolantAgent, 0, 100),
        radioactive: false,
        danger: false,
        electricHigh: false,
        turbineFast: false,
        steamLimited: false,
        status: "Loji belum aktif",
        statusDetail: "Tekan Hidupkan Loji untuk menjana elektrik.",
      };
    }

    const coolantStress = clamp(100 - plant.coolantAgent, 0, 100);
    const nuclearLoad = clamp(plant.uranium235, 0, 100);
    const reactorHeat = Math.round(clamp(plant.uranium235 * 1.15 - plant.coolantAgent * 0.55 + 32, 0, 100));
    const temperature = Math.round(
      clamp(
        80 + reactorHeat * 9.2,
        45,
        1000
      )
    );
    const requestedSteam = plant.steamVelocity;
    const effectiveSteam = Math.round(clamp(Math.min(requestedSteam, steamLimit), 0, 100));
    const steam = effectiveSteam;
    const turbine = Math.round(clamp(effectiveSteam * (0.78 + reactorHeat / 360), 0, 100));
    const outputMW = Math.round(clamp(turbine * (0.42 + reactorHeat / 155) * 10, 0, 1000));
    const outputPercent = Math.round((outputMW / 1000) * 100);
    const electricSymbols = Math.floor(outputMW / 250);
    const radioactive = reactorHeat > 86 && plant.coolantAgent < 35;
    const danger = temperature > 850 || (plant.coolantAgent < 22 && plant.uranium235 > 62);
    const electricHigh = electricSymbols > 0;
    const turbineFast = turbine >= 70;
    const steamLimited = requestedSteam > steamLimit;
    const lampPower = outputMW / 1000;
    const smokePower = outputMW / 1000;
    const smokePuffs = outputMW <= 0 ? 0 : Math.ceil(clamp(outputMW / 165, 1, 7));
    let status = "Loji stabil";
    let statusDetail = "Uranium-235, agen penyejuk dan stim berada dalam julat seimbang.";

    if (danger) {
      status = "Amaran suhu tinggi";
      statusDetail = "Kurangkan Uranium-235 atau tambah agen penyejuk untuk menurunkan suhu reaktor.";
    } else if (steamLimited) {
      status = "Stim terhad";
      statusDetail = "Halaju stim tidak boleh meningkat lagi kerana Uranium-235 belum cukup panas.";
    } else if (outputMW < 250) {
      status = "Output rendah";
      statusDetail = "Naikkan halaju stim atau jumlah Uranium-235 untuk menambah output elektrik.";
    } else if (outputMW >= 750 && temperature < 850) {
      status = "Output optimum";
      statusDetail = "Turbin berpusing laju dan pencawang menerima bekalan elektrik tinggi.";
    }

    return {
      temperature,
      steam,
      requestedSteam,
      effectiveSteam,
      steamLimit,
      turbine,
      output: outputPercent,
      outputMW,
      outputPercent,
      electricSymbols,
      lampPower,
      smokePuffs,
      smokePower,
      reactorHeat,
      nuclearLoad: Math.round(nuclearLoad),
      coolantStress,
      radioactive,
      danger,
      electricHigh,
      turbineFast,
      steamLimited,
      status,
      statusDetail,
    };
  }, [plant]);

  const fusionDiagnostics = useMemo(() => getFusionDiagnostics(fusion), [fusion]);
  const fusionStatus = fusionDiagnostics.status;
  const fusionDanger = fusionDiagnostics.danger;
  const plantDanger = plantData.danger;

  const startCurrentMode = () => {
    if (activeMode === "fission") {
      shootNeutron();
    } else if (activeMode === "fusion") {
      startFusion();
    } else {
      setPlant((current) => ({ ...current, active: true }));
    }
  };

  const resetAll = () => {
    setActiveMode("fission");
    setFission({ ...initialFission, lastAction: "reset" });
    setFusion(initialFusion);
    setPlant(initialPlant);
    setQuizAnswers({ fission: {}, fusion: {}, plant: {} });
    setQuizSubmitted({ fission: false, fusion: false, plant: false });
  };

  const resetFission = () => {
    setFission({
      ...initialFission,
      lastAction: "reset",
      message: "Simulasi telah direset. Tekan Mula Simulasi untuk mulakan semula.",
    });
  };

  const pauseFission = () => {
    setFission((current) => {
      if (!current.hasStarted) {
        return {
          ...current,
          running: false,
          paused: false,
          lastAction: "pause",
          message: "Simulasi belum dimulakan.",
        };
      }

      return {
        ...current,
        running: true,
        paused: true,
        lastAction: "pause",
        message: "Simulasi dihentikan sementara. Tekan Mula Simulasi untuk sambung.",
      };
    });
  };

  const shootNeutron = () => {
    setFission((current) => {
      if (current.paused && current.hasStarted) {
        const resumed = {
          ...current,
          running: true,
          paused: false,
        };
        const metrics = getFissionMetrics(resumed);

        return {
          ...resumed,
          neutronCount: Math.max(0, current.neutronCount ?? INITIAL_CHAIN_NEUTRONS),
          energy: metrics.energyOutput,
          lastAction: "start",
          message: "Simulasi disambung mengikut nilai slider semasa.",
        };
      }

      const next = {
        ...current,
        running: true,
        paused: false,
        cycle: current.cycle + 1,
        splitIds: [],
        fragmentBursts: [],
        neutronFadeOut: false,
        neutronCount: INITIAL_CHAIN_NEUTRONS,
        lastAction: "start",
        hasStarted: true,
      };
      const metrics = getFissionMetrics(next);

      return {
        ...next,
        energy: metrics.energyOutput,
        message: "Neutron bergerak menuju nukleus Uranium-235.",
      };
    });
  };

  const setBoronRod = (value) => {
    setFission((current) => {
      const currentNeutrons = Math.max(0, Math.round(current.neutronCount ?? INITIAL_CHAIN_NEUTRONS));
      const boronIncrease = Math.max(0, value - current.boronRod);
      const absorbedNow = current.hasStarted ? Math.round(currentNeutrons * (boronIncrease / 100) * 0.9) : 0;
      const next = {
        ...current,
        boronRod: value,
        neutronCount: current.hasStarted ? Math.max(0, currentNeutrons - absorbedNow) : INITIAL_CHAIN_NEUTRONS,
      };
      const metrics = getFissionMetrics(next);

      return {
        ...next,
        energy: current.hasStarted ? metrics.energyOutput : current.energy,
        message:
          value >= 95
            ? "Rod boron menyerap neutron dan memperlahankan tindak balas berantai."
            : "Rod boron dilaraskan. Lebih tinggi keberkesanan, lebih banyak neutron diserap.",
      };
    });
  };

  const setShowFissionLabels = (value) => {
    setFission((current) => ({
      ...current,
      showLabels: value,
    }));
  };

  const setShowFissionPaths = (value) => {
    setFission((current) => ({
      ...current,
      showPaths: value,
    }));
  };

  const setCoolantFlow = (value) => {
    setFission((current) => {
      const previousFlow = current.coolantFlow ?? initialFission.coolantFlow;
      const immediateCooling = value > previousFlow ? Math.round((value - previousFlow) * 2.2) : 0;
      const nextTemperature = Math.max(initialFission.temperature, current.temperature - immediateCooling);

      return {
        ...current,
        coolantFlow: value,
        temperature: nextTemperature,
        message:
          value >= 80
            ? "Agen penyejuk (air) ditingkatkan untuk membawa haba keluar daripada teras reaktor."
            : value < 25
            ? "Agen penyejuk terlalu sedikit. Suhu reaktor boleh meningkat dengan cepat."
            : "Agen penyejuk dilaraskan untuk mengawal suhu reaktor.",
      };
    });
  };

  const setGraphiteRod = (value) => {
    setFission((current) => {
      const next = {
        ...current,
        graphiteRod: value,
      };
      const metrics = getFissionMetrics(next);

      return {
        ...next,
        neutronCount: current.hasStarted
          ? Math.max(0, Math.round(current.neutronCount ?? INITIAL_CHAIN_NEUTRONS))
          : INITIAL_CHAIN_NEUTRONS,
        energy: current.hasStarted ? metrics.energyOutput : current.energy,
        message:
          value < 40
            ? "Rod grafit rendah. Neutron terlalu laju dan pembelahan kurang berkesan."
            : value >= 70
            ? "Rod grafit tinggi. Neutron menjadi perlahan dan lebih mudah membelah Uranium-235."
            : "Rod grafit dilaraskan. Neutron bergerak pada kelajuan sederhana.",
      };
    });
  };

  const setUraniumRod = (value) => {
    setFission((current) => {
      const allowedIds = uraniumPositions.slice(0, getUraniumCount(value)).map((position) => position.id);
      const nextSplitIds = current.splitIds.filter((id) => allowedIds.includes(id));
      const setStillFullySplit = allowedIds.length > 0 && nextSplitIds.length >= allowedIds.length;
      const next = {
        ...current,
        uraniumRod: value,
        splitIds: nextSplitIds,
        fragmentBursts: (current.fragmentBursts ?? []).filter((burst) => allowedIds.includes(burst.id)),
        neutronFadeOut: setStillFullySplit ? current.neutronFadeOut : false,
      };
      const metrics = getFissionMetrics(next);

      return {
        ...next,
        neutronCount: current.hasStarted
          ? Math.max(0, Math.round(current.neutronCount ?? INITIAL_CHAIN_NEUTRONS))
          : INITIAL_CHAIN_NEUTRONS,
        energy: current.hasStarted ? metrics.energyOutput : current.energy,
        message:
          value >= 75
            ? "Kadar tindak balas tinggi. Tingkatkan Rod Boron sekurang-kurangnya 50% untuk menyerap neutron berlebihan."
            : "Uranium-235 dilaraskan. Lebih banyak U-235 memberi lebih banyak sasaran neutron.",
      };
    });
  };

  const setFusionValue = (key, value) => {
    setFusion((current) => ({
      ...current,
      [key]: value,
      active: false,
      success: false,
      energy: 0,
      message: "Pembolehubah plasma dilaraskan. Tekan Mulakan Pelakuran untuk menguji keadaan.",
    }));
  };

  const placeFusionAtom = (atom) => {
    setFusion((current) => ({
      ...current,
      [`${atom}Placed`]: true,
      active: false,
      success: false,
      message:
        atom === "deuterium"
          ? "Deuterium dimasukkan ke dalam plasma chamber."
          : "Tritium dimasukkan ke dalam plasma chamber.",
    }));
  };

  const handleFusionAtomDragStart = (atom, event) => {
    event.dataTransfer.setData("text/plain", atom);
  };

  const handleFusionDrop = (event) => {
    event.preventDefault();
    const atom = event.dataTransfer.getData("text/plain");

    if (atom === "deuterium" || atom === "tritium") {
      placeFusionAtom(atom);
    }
  };

  const startFusion = () => {
    setFusion((current) => {
      const diagnostics = getFusionDiagnostics(current);

      if (
        !diagnostics.atomsReady ||
        !diagnostics.temperatureOk ||
        !diagnostics.magneticOk ||
        !diagnostics.collisionOk ||
        !diagnostics.fuelOk ||
        diagnostics.danger
      ) {
        return {
          ...current,
          active: true,
          success: false,
          energy: diagnostics.danger ? diagnostics.projectedEnergy : diagnostics.liveEnergy,
          message: getFusionFailureMessage(current, diagnostics),
        };
      }

      const energy = Math.round(
        clamp(current.temperature * 0.75 + current.magneticField * 0.28 + current.collisionSpeed * 0.48 + 45, 0, 160)
      );

      return {
        ...current,
        active: true,
        success: true,
        energy,
        message: "Deuterium dan tritium bercantum membentuk helium. Tenaga besar dibebaskan.",
      };
    });
  };

  const resetFusion = () => {
    setFusion(initialFusion);
  };

  const resetPlant = () => {
    setPlant(initialPlant);
  };

  const handleQuizAnswer = (questionId, option) => {
    setQuizAnswers((current) => ({
      ...current,
      [activeMode]: {
        ...current[activeMode],
        [questionId]: option,
      },
    }));
    setQuizSubmitted((current) => ({
      ...current,
      [activeMode]: false,
    }));
  };

  const submitQuiz = () => {
    setQuizSubmitted((current) => ({
      ...current,
      [activeMode]: true,
    }));
  };

  const retryQuiz = () => {
    setQuizAnswers((current) => ({
      ...current,
      [activeMode]: {},
    }));
    setQuizSubmitted((current) => ({
      ...current,
      [activeMode]: false,
    }));
  };

  return (
    <main className="nuclearPage">
      <section className="nuclearHero">
        <div className="nuclearHero__content">
          <span className="nuclearBadge">Tingkatan 4 • Bab 12 • Tenaga Nuklear</span>
          <h1>Simulator Tenaga Nuklear</h1>
          <p>
            Terokai pembelahan nukleus, pelakuran nukleus dan cara stesen janakuasa
            nuklear menghasilkan elektrik.
          </p>
          <div className="nuclearHero__actions">
            <button type="button" className="nuclearButton nuclearButton--primary" onClick={startCurrentMode}>
              Mula Simulasi
            </button>
            <button type="button" className="nuclearButton nuclearButton--ghost" onClick={resetAll}>
              Reset
            </button>
          </div>
        </div>
        <div className="nuclearHero__reactor" aria-hidden="true">
          <div className="nuclearHero__ring nuclearHero__ring--outer" />
          <div className="nuclearHero__ring nuclearHero__ring--inner" />
          <div className="nuclearHero__core" />
        </div>
      </section>

      <section className="nuclearTabs" aria-label="Pilihan mod simulator tenaga nuklear">
        {MODES.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={activeMode === mode.id ? "active" : ""}
            onClick={() => setActiveMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </section>

      {activeMode === "fission" && (
        <FissionReactorLab
          fission={fission}
          metrics={fissionMetrics}
          neutronVisuals={neutronVisuals}
          activeUraniumPositions={activeUraniumPositions}
          fissionMessage={fissionMessage}
          fissionDanger={fissionDanger}
          onStart={shootNeutron}
          onPause={pauseFission}
          onReset={resetFission}
          onBoronChange={setBoronRod}
          onGraphiteChange={setGraphiteRod}
          onUraniumChange={setUraniumRod}
          onToggleLabels={setShowFissionLabels}
          onTogglePaths={setShowFissionPaths}
        />
      )}

      {false && activeMode === "fission" && (
        <>
          <section className="nuclearModeGrid fissionModeGrid">
            <aside className="nuclearPanel nuclearSteps fissionSteps">
              <div className="nuclearPanelTitle">
                <span>Langkah</span>
                <h2>Pembelahan Nukleus</h2>
              </div>
              <ol>
                <li>Laraskan Rod Uranium untuk menambah nukleus U-235 dalam reaktor.</li>
                <li>Laraskan Rod Grafit supaya neutron diperlahankan secara optimum.</li>
                <li>Tembak neutron dan perhatikan U-235 terbelah secara berantai.</li>
                <li>Masukkan Rod Boron untuk menyerap neutron dan mengawal reaktor.</li>
              </ol>
              <p className="nuclearMiniNote">
                Urutan utama: neutron → U-235 terbelah → neutron baharu → U-235 lain terbelah.
              </p>
            </aside>

            <section
              className={[
                "nuclearStage",
                "fissionStage",
                fission.running ? "fissionStage--running" : "",
                fission.splitIds.length > 0 ? "fissionStage--split" : "",
                fissionMetrics.reactionRate > 70 ? "fissionStage--active" : "",
                `fissionStage--neutron-${neutronMode}`,
                fissionDanger ? "nuclearStage--warning" : "",
              ].join(" ")}
              style={{
                "--boron-top": `${-74 + fission.boronRod * 0.92}%`,
                "--reactor-cyan-alpha": `${0.11 + fissionMetrics.reactionRate / 650}`,
                "--reactor-orange-alpha": `${fissionMetrics.reactionRate / 780}`,
                "--coolant-opacity": `${0.18 + coolantLevel * 0.62}`,
                "--coolant-speed": `${2.8 - coolantLevel * 1.35}s`,
              }}
              aria-label="Ruang simulasi pembelahan nukleus"
            >
              <div className="nuclearStageGrid" aria-hidden="true" />

              <div className="reactorCoreShell" aria-hidden="true">
                <div className="reactorGlowField" />
              </div>

              <div className="coolantFlowField" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>

              <div className={`moderatorZone moderatorZone--${neutronMode}`} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className={`moderatorZoneLabel moderatorZoneLabel--${neutronMode}`} aria-hidden="true">
                Moderator Grafit
              </div>

              <div className="boronRodBank" aria-label="Rod Boron menyerap neutron">
                <span>Rod Boron</span>
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className="graphiteRodBank" aria-label="Rod Grafit moderator">
                {Array.from({ length: graphiteRodCount }).map((_, index) => (
                  <i key={`graphite-${index}`} style={{ "--index": index }} />
                ))}
                <span>Rod Grafit</span>
              </div>

              <div className="uraniumField" aria-label="Nukleus Uranium-235">
                {activeUraniumPositions.map((position, index) => {
                  const isSplitting = fission.splitIds.includes(position.id);
                  return (
                    <div
                      className={`reactorUranium${isSplitting ? " reactorUranium--splitting" : ""}`}
                      key={position.id}
                      style={{ left: position.left, top: position.top, "--delay": `${index * 0.08}s` }}
                    >
                      <span>U-235</span>
                    </div>
                  );
                })}
              </div>

              <div className="neutronField" aria-hidden="true">
                {neutronVisuals.map((neutron) => (
                  <i
                    className={`chainNeutron chainNeutron--${neutronMode}`}
                    key={neutron.id}
                    style={{
                      "--from-x": neutron.fromX,
                      "--from-y": neutron.fromY,
                      "--dx": neutron.dx,
                      "--dy": neutron.dy,
                      "--delay": neutron.delay,
                      "--neutron-speed": neutron.speed,
                      "--ripple-delay": neutron.rippleDelay,
                    }}
                  />
                ))}
              </div>

              <div className="splitFragmentField" aria-hidden="true">
                {fission.splitIds.map((id, index) => {
                  const position = uraniumPositions.find((item) => item.id === id) || uraniumPositions[0];
                  return (
                    <div
                      className="splitFragments"
                      key={`${fission.cycle}-${id}`}
                      style={{ left: position.left, top: position.top, "--delay": `${index * 0.08}s` }}
                    >
                      <span />
                      <span />
                    </div>
                  );
                })}
              </div>

              <div className="absorbedField" aria-hidden="true">
                {Array.from({ length: Math.min(Math.ceil(fission.boronRod / 25), 4) }).map((_, index) => (
                  <i key={`${fission.cycle}-absorbed-${index}`} style={{ "--index": index }} />
                ))}
              </div>

              <div className="reactorLegend">
                <div>
                  <i className="legendDot legendDot--neutron" />
                  <span>neutron</span>
                </div>
                <div>
                  <i className="legendDot legendDot--uranium" />
                  <span>U-235</span>
                </div>
                <div>
                  <i className="legendDot legendDot--boron" />
                  <span>diserap boron</span>
                </div>
              </div>

              <div className="moderatorFlowLabel">
                <span>Neutron laju</span>
                <strong>→ Moderator →</strong>
                <span>Neutron perlahan</span>
                <strong>→</strong>
                <span>U-235 terbelah</span>
              </div>

              <div className="nuclearStageReadout">
                <strong>{fissionStatus}</strong>
                <span>{fission.running ? fission.message : fissionMessage}</span>
              </div>
              <NuclearDangerOverlay show={fissionDanger} message="Suhu reaktor terlalu tinggi" />
            </section>

            <section className="fissionGaugeDeck" aria-label="Data langsung reaktor pembelahan">
              <NuclearGauge label="Bilangan neutron" value={fission.neutronCount} fill={(fission.neutronCount / 30) * 100} />
              <NuclearGauge label="Uranium aktif" value={fissionMetrics.activeUranium} fill={(fissionMetrics.activeUranium / 12) * 100} />
              <NuclearGauge label="Tenaga terbebas" value={`${fission.energy}`} detail="unit" fill={fission.energy / 10} tone="orange" />
              <NuclearGauge
                label="Suhu reaktor"
                value={`${fission.temperature}°C`}
                fill={fission.temperature / 11}
                tone={fissionDanger ? "red" : "purple"}
              />
              <NuclearGauge label="Kadar tindak balas" value={`${fissionMetrics.reactionRate}%`} fill={fissionMetrics.reactionRate} tone="orange" />
              <NuclearGauge label="Status reaktor" value={`${fissionMetrics.reactionRate}%`} detail={fissionStatus} fill={fissionMetrics.reactionRate} />
            </section>

            {fissionDanger ? (
              <p className="nuclearWarning fissionWarning">AMARAN: Suhu reaktor terlalu tinggi. Tingkatkan Agen Penyejuk (Air) dan masukkan Rod Boron.</p>
            ) : null}

            <aside className="nuclearPanel nuclearControls">
              <div className="nuclearPanelTitle">
                <span>Kawalan</span>
                <h2>Kawalan Reaktor</h2>
              </div>
              <div className="nuclearActionRow">
                <button
                  type="button"
                  className="nuclearButton nuclearButton--primary"
                  onClick={shootNeutron}
                >
                  Tembak Neutron
                </button>
                <button type="button" className="nuclearButton nuclearButton--ghost" onClick={resetFission}>
                  Reset Pembelahan
                </button>
              </div>

              <NuclearSlider
                label="Rod Boron (Rod Pengawal)"
                value={fission.boronRod}
                min={0}
                max={100}
                leftLabel="Keluar"
                rightLabel="Masuk penuh"
                onChange={setBoronRod}
              />
              <NuclearSlider
                label="Agen Penyejuk (Air)"
                value={fission.coolantFlow ?? initialFission.coolantFlow}
                min={0}
                max={100}
                leftLabel="Sedikit"
                rightLabel="Deras"
                onChange={setCoolantFlow}
              />
              <NuclearSlider
                label="Rod Grafit (Moderator)"
                value={fission.graphiteRod}
                min={0}
                max={100}
                leftLabel="Rendah"
                rightLabel="Tinggi"
                onChange={setGraphiteRod}
              />
              <NuclearSlider
                label="Rod Uranium"
                value={fission.uraniumRod}
                min={0}
                max={100}
                leftLabel="Sedikit"
                rightLabel="Padat"
                onChange={setUraniumRod}
              />

              <p className={`nuclearModeratorStatus nuclearModeratorStatus--${neutronMode}`}>
                <strong>{fissionMetrics.moderatorStatus}</strong>
                <span>{moderatorConcept}</span>
              </p>

              <div className="nuclearMeterGrid">
                <NuclearMeter label="Bilangan neutron" value={fission.neutronCount} fill={fission.neutronCount * 4} />
                <NuclearMeter label="Bilangan uranium aktif" value={fissionMetrics.activeUranium} fill={fissionMetrics.activeUranium * 9} />
                <NuclearMeter label="Tenaga terbebas" value={`${fission.energy} unit`} fill={fission.energy / 7} tone="orange" />
                <NuclearMeter
                  label="Suhu reaktor"
                  value={`${fission.temperature}°C`}
                  fill={fission.temperature / 10}
                  tone={fissionDanger ? "red" : "purple"}
                />
                <NuclearMeter label="Kadar tindak balas" value={`${fissionMetrics.reactionRate}%`} fill={fissionMetrics.reactionRate} tone="orange" />
                <NuclearMeter label="Status reaktor" value={fissionStatus} fill={fissionMetrics.reactionRate} />
              </div>

              {fissionDanger ? (
                <p className="nuclearWarning">AMARAN: Suhu reaktor terlalu tinggi. Tingkatkan Agen Penyejuk (Air) dan masukkan Rod Boron.</p>
              ) : null}
            </aside>
          </section>

          <section className="nuclearConceptNote">
            Pembelahan nukleus berlaku apabila neutron membedil U-235. Nukleus U-235
            terbelah kepada serpihan lebih kecil, membebaskan tenaga dan menghasilkan
            neutron baharu yang boleh membelah U-235 lain secara tindak balas berantai.
          </section>
        </>
      )}

      {activeMode === "fusion" && (
        <>
          <section className="nuclearModeGrid fusionModeGrid">
            <section
              className={[
                "nuclearStage",
                "fusionStage",
                fusion.active ? "fusionStage--active" : "",
                fusion.success ? "fusionStage--success" : "",
                fusion.active && !fusion.success ? "fusionStage--failed" : "",
                fusionDiagnostics.almostStable ? "fusionStage--near" : "",
                fusionDanger ? "fusionStage--unstable" : "",
              ].join(" ")}
              style={{
                "--fusion-speed": `${clamp(4.4 - fusion.collisionSpeed / 26, 0.75, 4.2)}s`,
                "--fusion-glow": `${fusionDiagnostics.stability}%`,
                "--fusion-glow-alpha": `${0.14 + fusionDiagnostics.stability / 500}`,
              }}
              aria-label="Ruang simulasi pelakuran nukleus"
            >
              <button
                type="button"
                draggable={!fusion.deuteriumPlaced}
                className={`fusionAtomDock fusionAtomDock--deuterium${fusion.deuteriumPlaced ? " fusionAtomDock--placed" : ""}`}
                onDragStart={(event) => handleFusionAtomDragStart("deuterium", event)}
              >
                <span>D</span>
                <small>Deuterium</small>
              </button>

              <button
                type="button"
                draggable={!fusion.tritiumPlaced}
                className={`fusionAtomDock fusionAtomDock--tritium${fusion.tritiumPlaced ? " fusionAtomDock--placed" : ""}`}
                onDragStart={(event) => handleFusionAtomDragStart("tritium", event)}
              >
                <span>T</span>
                <small>Tritium</small>
              </button>

              <div className="plasmaChamber fusionPlasmaChamber" onDragOver={(event) => event.preventDefault()} onDrop={handleFusionDrop}>
                <div className="plasmaSwirl" aria-hidden="true" />
                <div className="fusionMagneticField" aria-hidden="true" />
                {fusion.deuteriumPlaced ? (
                  <div className="fusionNucleus fusionNucleus--deuterium">D</div>
                ) : (
                  <div className="fusionDropGhost fusionDropGhost--deuterium">D</div>
                )}
                {fusion.tritiumPlaced ? (
                  <div className="fusionNucleus fusionNucleus--tritium">T</div>
                ) : (
                  <div className="fusionDropGhost fusionDropGhost--tritium">T</div>
                )}
                <div className="fusionHelium">Helium</div>
                <div className="fusionNeutron">neutron</div>
                <div className="fusionFlash" aria-hidden="true" />
                <div className="fusionShockwave" aria-hidden="true" />
                <div className="fusionParticleField" aria-hidden="true">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <i
                      key={`fusion-particle-${index}`}
                      style={{
                        "--particle-angle": `${index * 30}deg`,
                        "--chaos-angle-a": `${index * 41}deg`,
                        "--chaos-angle-b": `${index * 67}deg`,
                        "--particle-delay": `${index * 0.035}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="electricSparks" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="nuclearStageReadout">
                <strong>{fusionStatus}</strong>
                <span>{fusion.message}</span>
              </div>
              <NuclearDangerOverlay show={fusionDanger} message="AMARAN: Plasma tidak stabil" />
            </section>

            <aside className="nuclearPanel nuclearControls">
              <div className="nuclearPanelTitle">
                <span>Kawalan</span>
                <h2>Gauge Pelakuran</h2>
              </div>
              <div className="fusionGaugeGrid">
                <FusionGaugeControl
                  label="Suhu plasma"
                  value={fusion.temperature}
                  min={1}
                  max={100}
                  unit=" juta °C"
                  tone={fusion.temperature > 95 ? "red" : "heat"}
                  leftLabel="Rendah"
                  rightLabel="Tinggi"
                  displayValue={`${fusion.temperature} juta °C`}
                  optimal={fusionDiagnostics.temperatureOk}
                  onChange={(value) => setFusionValue("temperature", value)}
                />
                <FusionGaugeControl
                  label="Medan magnet"
                  value={fusion.magneticField}
                  min={0}
                  max={100}
                  tone="purple"
                  leftLabel="Lemah"
                  rightLabel="Kuat"
                  optimal={fusionDiagnostics.magneticOk}
                  onChange={(value) => setFusionValue("magneticField", value)}
                />
                <FusionGaugeControl
                  label="Halaju pelanggaran"
                  value={fusion.collisionSpeed}
                  min={0}
                  max={100}
                  tone="cyan"
                  leftLabel="Perlahan"
                  rightLabel="Laju"
                  optimal={fusionDiagnostics.collisionOk}
                  onChange={(value) => setFusionValue("collisionSpeed", value)}
                />
                <FusionGaugeControl
                  label="Nisbah Deuterium : Tritium"
                  value={fusion.fuelBalance}
                  min={0}
                  max={100}
                  tone="green"
                  leftLabel="D kurang"
                  centerLabel="Seimbang"
                  rightLabel="T kurang"
                  displayValue={getFuelRatioLabel(fusion.fuelBalance)}
                  optimal={fusionDiagnostics.fuelOk}
                  onChange={(value) => setFusionValue("fuelBalance", value)}
                />
              </div>

              <div className="nuclearActionRow">
                <button type="button" className="nuclearButton nuclearButton--primary" onClick={startFusion}>
                  Mulakan Pelakuran
                </button>
                <button type="button" className="nuclearButton nuclearButton--ghost" onClick={resetFusion}>
                  Reset Pelakuran
                </button>
              </div>

              <div className="fusionInfoPanel">
                <NuclearMeter label="Suhu plasma" value={`${fusion.temperature} juta °C`} fill={fusion.temperature} tone={fusion.temperature > 95 ? "red" : "orange"} />
                <NuclearMeter label="Kestabilan plasma" value={`${fusionDiagnostics.stability}%`} fill={fusionDiagnostics.stability} tone={fusionDanger ? "red" : "purple"} />
                <NuclearMeter label="Halaju pelanggaran" value={`${fusion.collisionSpeed}%`} fill={fusion.collisionSpeed} />
                <NuclearMeter label="Output tenaga" value={`${fusionDiagnostics.liveEnergy} unit`} fill={fusionDiagnostics.liveEnergy} tone="orange" />
                <NuclearMeter label="Status fusion" value={fusionStatus} fill={fusion.success ? 100 : fusionDiagnostics.stability} />
              </div>
            </aside>
          </section>
        </>
      )}

      {activeMode === "plant" && (
        <>
          <section className="nuclearPlantLayout">
            <div className="plantGaugeDeck">
              <NuclearGauge
                label="Uranium-235"
                value={`${plant.uranium235}%`}
                detail="Lebih banyak, reaktor lebih panas"
                fill={plant.uranium235}
                tone="orange"
              />
              <NuclearGauge
                label="Agen penyejukan"
                value={`${plant.coolantAgent}%`}
                detail="Lebih banyak, reaktor lebih sejuk"
                fill={plant.coolantAgent}
              />
              <NuclearGauge
                label="Halaju stim"
                value={`${plant.steamVelocity}%`}
                detail={plantData.steamLimited ? `Terhad kepada ${plantData.steamLimit}%` : "Memusingkan turbin"}
                fill={plant.steamVelocity}
                tone={plantData.steamLimited ? "red" : "purple"}
              />
              <NuclearGauge
                label="Output elektrik"
                value={`${plantData.outputMW.toLocaleString("ms-MY")} MW`}
                detail="Maksimum 1000 MW"
                fill={plantData.outputPercent}
                tone="orange"
              />
            </div>

            <section
              className={[
                "nuclearPlantFlow",
                plant.active ? "nuclearPlantFlow--active" : "",
                plantData.danger ? "nuclearPlantFlow--warning" : "",
                plantData.radioactive ? "nuclearPlantFlow--radioactive" : "",
                plantData.electricHigh ? "nuclearPlantFlow--electric" : "",
                plantData.turbineFast ? "nuclearPlantFlow--turbineFast" : "",
              ].join(" ")}
              style={{
                "--turbine-speed": `${clamp(2.2 - plantData.turbine / 58, 0.34, 2.2)}s`,
                "--plant-heat": `${plantData.reactorHeat}%`,
                "--plant-output": `${plantData.outputPercent}%`,
                "--reactor-alpha": plant.active ? `${clamp(0.18 + plantData.reactorHeat / 95, 0.08, 1).toFixed(2)}` : "0.08",
                "--reactor-brightness": `${clamp(1 + plantData.reactorHeat / 46, 1, 3.15).toFixed(2)}`,
                "--lamp-alpha": `${clamp(plantData.lampPower, 0, 1).toFixed(2)}`,
                "--steam-alpha": plant.active ? `${clamp(0.16 + plantData.effectiveSteam / 110, 0.08, 1).toFixed(2)}` : "0.08",
                "--smoke-alpha": `${clamp(0.14 + plantData.smokePower * 0.9, 0, 1).toFixed(2)}`,
                "--smoke-scale": `${clamp(0.78 + plantData.smokePower * 0.48, 0.78, 1.26).toFixed(2)}`,
              }}
              aria-label="Gambaran keseluruhan loji janakuasa nuklear"
            >
              <NuclearDangerOverlay show={plantDanger} message="AMARAN: Reaktor tidak stabil" />

              <div className="plantCoolingSmoke" aria-hidden="true">
                {Array.from({ length: plantData.smokePuffs }, (_, index) => (
                  <i key={`plant-smoke-${index}`} />
                ))}
              </div>
              <div className="plantReactorGlow" aria-hidden="true">
                <span />
              </div>
              <div className="plantSteamTrace" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="plantTurbineShakeLayer" aria-hidden="true" />
              <div className="plantTurbineIndicator" aria-hidden="true">
                <span />
                <i />
                <i />
                <i />
              </div>
              <div className="plantTurbineIndicator plantTurbineIndicator--middle" aria-hidden="true">
                <span />
                <i />
                <i />
                <i />
              </div>
              <div className="plantTurbineIndicator plantTurbineIndicator--rear" aria-hidden="true">
                <span />
                <i />
                <i />
                <i />
              </div>
              <div className="plantLampGlows" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="plantElectricSymbols" aria-label={`${plantData.electricSymbols} simbol elektrik dikeluarkan`}>
                {Array.from({ length: plantData.electricSymbols }, (_, index) => (
                  <i key={`plant-electric-${index}`} />
                ))}
              </div>
              <div className="plantOutputBadge" aria-live="polite">
                <span>Elektrik Dihasilkan</span>
                <strong>{plantData.outputMW.toLocaleString("ms-MY")} MW</strong>
                <small>Maksimum 1000 MW</small>
              </div>
            </section>

            <aside className="nuclearPanel nuclearControls">
              <div className="nuclearPanelTitle">
                <span>Kawalan Loji</span>
                <h2>Stesen Janakuasa</h2>
              </div>
              <NuclearSlider
                label="Jumlah Uranium-235"
                value={plant.uranium235}
                min={0}
                max={100}
                leftLabel="Sedikit"
                rightLabel="Banyak"
                onChange={(value) => setPlant((current) => ({ ...current, uranium235: value }))}
              />
              <NuclearSlider
                label="Agen Penyejukan"
                value={plant.coolantAgent}
                min={0}
                max={100}
                leftLabel="Sedikit"
                rightLabel="Banyak"
                onChange={(value) => setPlant((current) => ({ ...current, coolantAgent: value }))}
              />
              <NuclearSlider
                label="Halaju Stim"
                value={plant.steamVelocity}
                min={0}
                max={100}
                leftLabel="Perlahan"
                rightLabel="Laju"
                onChange={(value) => setPlant((current) => ({ ...current, steamVelocity: value }))}
              />

              <div className="nuclearActionRow">
                <button
                  type="button"
                  className="nuclearButton nuclearButton--primary plantStartButton"
                  onClick={() => setPlant((current) => ({ ...current, active: true }))}
                >
                  Hidupkan Loji
                </button>
                <button type="button" className="nuclearButton nuclearButton--ghost" onClick={resetPlant}>
                  Reset Loji
                </button>
              </div>

              <div className="nuclearMeterGrid plantStatusGrid">
                <NuclearMeter
                  label="Suhu reaktor"
                  value={`${plantData.temperature} C`}
                  fill={plantData.temperature / 10}
                  tone={plantData.danger ? "red" : "purple"}
                />
                <NuclearMeter label="Stim berkesan" value={`${plantData.effectiveSteam}%`} fill={plantData.effectiveSteam} />
                <NuclearMeter label="Kelajuan turbin" value={`${plantData.turbine}%`} fill={plantData.turbine} tone="orange" />
                <NuclearMeter label="Simbol elektrik" value={`${plantData.electricSymbols} / 4`} fill={plantData.outputPercent} tone="orange" />
                <NuclearMeter label="Status" value={plantData.status} fill={plant.active ? 80 : 10} />
              </div>

              <p className="nuclearMiniNote plantStatusNote">{plantData.statusDetail}</p>

              {plantData.danger ? (
                <p className="nuclearWarning">Bahaya: reaktor terlalu panas. Tambah agen penyejukan atau kurangkan Uranium-235.</p>
              ) : null}
            </aside>
          </section>

          <section className="nuclearConceptNote">
            Dalam stesen janakuasa nuklear, tenaga daripada pembelahan nukleus digunakan
            untuk menghasilkan haba. Haba memanaskan air menjadi wap. Wap memutarkan turbin
            yang disambungkan kepada generator untuk menghasilkan elektrik.
          </section>
        </>
      )}

      <style>{`
        .fusionModeGrid {
          grid-template-columns: minmax(650px, 1fr) minmax(340px, 0.42fr);
          align-items: start;
        }

        .fusionModeGrid > .fusionStage {
          min-height: clamp(720px, 74vh, 880px);
          overflow: hidden;
        }

        .fusionModeGrid > .nuclearControls {
          gap: 1rem;
        }

        .fusionPlasmaChamber {
          width: min(660px, 72vw);
          max-width: calc(100% - 11rem);
          border-color: rgba(56, 189, 248, 0.48);
          background:
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08), transparent 13%),
            radial-gradient(circle at 50% 48%, rgba(168, 85, 247, 0.34), transparent 28%),
            radial-gradient(circle, rgba(56, 189, 248, var(--fusion-glow-alpha, 0.22)), rgba(15, 23, 42, 0.3) 58%, rgba(2, 6, 23, 0.88));
          box-shadow:
            0 0 78px rgba(56, 189, 248, 0.25),
            inset 0 0 72px rgba(168, 85, 247, 0.18);
        }

        .fusionStage--near .fusionPlasmaChamber,
        .fusionStage--success .fusionPlasmaChamber {
          box-shadow:
            0 0 92px rgba(56, 189, 248, 0.34),
            0 0 60px rgba(249, 115, 22, 0.16),
            inset 0 0 84px rgba(168, 85, 247, 0.24);
        }

        .fusionStage--unstable {
          animation: warningPulse 1.15s ease-in-out infinite, heatDistortion 0.52s linear infinite;
        }

        .fusionStage--unstable .fusionPlasmaChamber {
          border-color: rgba(239, 68, 68, 0.58);
          background:
            radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.22), transparent 28%),
            radial-gradient(circle, rgba(168, 85, 247, 0.22), rgba(15, 23, 42, 0.36) 58%, rgba(2, 6, 23, 0.9));
          box-shadow: 0 0 72px rgba(239, 68, 68, 0.3), inset 0 0 70px rgba(239, 68, 68, 0.18);
        }

        .fusionMagneticField {
          position: absolute;
          inset: 7%;
          border: 1px dashed rgba(168, 85, 247, 0.36);
          border-radius: 50%;
          animation: plasmaSwirl 7s linear infinite;
        }

        .fusionMagneticField::before,
        .fusionMagneticField::after {
          content: "";
          position: absolute;
          inset: 14%;
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 50%;
        }

        .fusionMagneticField::after {
          inset: 28%;
          border-color: rgba(168, 85, 247, 0.24);
        }

        .fusionAtomDock {
          position: absolute;
          z-index: 12;
          display: grid;
          width: 116px;
          aspect-ratio: 1;
          place-items: center;
          gap: 0.12rem;
          border: 1px solid rgba(226, 232, 240, 0.18);
          border-radius: 50%;
          color: #f8fafc;
          font-weight: 950;
          cursor: grab;
          user-select: none;
          transition: transform 0.22s ease, opacity 0.22s ease;
        }

        .fusionAtomDock span {
          display: grid;
          width: 52px;
          aspect-ratio: 1;
          place-items: center;
          border-radius: 50%;
          font-size: 1.55rem;
        }

        .fusionAtomDock small {
          margin-top: -0.65rem;
          color: rgba(226, 232, 240, 0.82);
          font-size: 0.72rem;
          font-weight: 900;
        }

        .fusionAtomDock:hover {
          transform: translateY(-4px) scale(1.03);
        }

        .fusionAtomDock--placed {
          opacity: 0.34;
          cursor: default;
          filter: grayscale(0.4);
        }

        .fusionAtomDock--deuterium {
          left: clamp(0.8rem, 3vw, 2rem);
          top: 46%;
          background: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.82), #38bdf8 42%, #1d4ed8 100%);
          box-shadow: 0 0 34px rgba(56, 189, 248, 0.42);
        }

        .fusionAtomDock--tritium {
          right: clamp(0.8rem, 3vw, 2rem);
          top: 46%;
          background: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.82), #fb7185 42%, #9d174d 100%);
          box-shadow: 0 0 34px rgba(244, 114, 182, 0.42);
        }

        .fusionPlasmaChamber .fusionNucleus {
          z-index: 8;
          display: grid;
          width: clamp(72px, 7vw, 102px);
          aspect-ratio: 1;
          place-items: center;
          border-radius: 50%;
          color: #f8fafc;
          font-size: 1.35rem;
          font-weight: 950;
          text-align: center;
          opacity: 1;
          transform: none;
        }

        .fusionPlasmaChamber .fusionNucleus--deuterium {
          left: 25%;
          top: 48%;
          background: radial-gradient(circle at 35% 30%, #ffffff, #38bdf8 36%, #1e40af 100%);
        }

        .fusionPlasmaChamber .fusionNucleus--tritium {
          right: 25%;
          top: 48%;
          background: radial-gradient(circle at 35% 30%, #ffffff, #fb7185 36%, #9d174d 100%);
        }

        .fusionDropGhost {
          position: absolute;
          z-index: 4;
          display: grid;
          width: clamp(70px, 7vw, 98px);
          aspect-ratio: 1;
          place-items: center;
          border: 1px dashed rgba(226, 232, 240, 0.32);
          border-radius: 50%;
          color: rgba(226, 232, 240, 0.48);
          font-size: 1.35rem;
          font-weight: 950;
          background: rgba(15, 23, 42, 0.34);
        }

        .fusionDropGhost--deuterium {
          left: 25%;
          top: 48%;
        }

        .fusionDropGhost--tritium {
          right: 25%;
          top: 48%;
        }

        .fusionStage--active .fusionNucleus--deuterium {
          animation: fusionCollideLeft var(--fusion-speed, 1.4s) ease-in-out infinite alternate;
        }

        .fusionStage--active .fusionNucleus--tritium {
          animation: fusionCollideRight var(--fusion-speed, 1.4s) ease-in-out infinite alternate;
        }

        .fusionStage--failed .fusionNucleus--deuterium {
          animation: fusionFailLeft 1.35s ease-in-out infinite;
        }

        .fusionStage--failed .fusionNucleus--tritium {
          animation: fusionFailRight 1.35s ease-in-out infinite;
        }

        .fusionStage--success .fusionNucleus {
          opacity: 0.18;
          transition: opacity 0.35s ease;
        }

        .fusionShockwave {
          position: absolute;
          z-index: 7;
          width: 150px;
          aspect-ratio: 1;
          border: 2px solid rgba(125, 211, 252, 0.74);
          border-radius: 50%;
          opacity: 0;
        }

        .fusionStage--success .fusionShockwave {
          animation: fusionShockwave 1.25s ease-out infinite;
        }

        .fusionStage--success .fusionFlash {
          animation: fusionFlash 1s ease-out infinite;
        }

        .fusionStage--success .fusionHelium {
          opacity: 1;
          transform: scale(1);
        }

        .fusionParticleField {
          position: absolute;
          inset: 10%;
          z-index: 6;
          pointer-events: none;
        }

        .fusionParticleField i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: #e0f2fe;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.8);
          opacity: 0;
          transform: rotate(var(--particle-angle)) translateX(0);
        }

        .fusionStage--success .fusionParticleField i {
          animation: fusionParticleBurst 1.4s ease-out infinite;
          animation-delay: var(--particle-delay);
        }

        .fusionStage--unstable .fusionParticleField i {
          background: #fecaca;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.84);
          animation: fusionChaoticParticle 0.85s ease-in-out infinite alternate;
          animation-delay: var(--particle-delay);
        }

        .fusionGaugeGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(138px, 1fr));
          gap: 0.75rem;
        }

        .fusionInfoPanel {
          display: grid;
          gap: 0.72rem;
        }

        .fusionGauge {
          display: grid;
          gap: 0.44rem;
          min-width: 0;
          padding: 0.72rem;
          border: 1px solid rgba(56, 189, 248, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.38);
          color: #38bdf8;
          box-shadow: inset 0 0 18px rgba(56, 189, 248, 0.04);
        }

        .fusionGauge--purple {
          color: #a855f7;
        }

        .fusionGauge--green {
          color: #22c55e;
        }

        .fusionGauge--red {
          color: #ef4444;
        }

        .fusionGauge--heat {
          color: #f97316;
        }

        .fusionGauge--optimal {
          border-color: color-mix(in srgb, currentColor 42%, transparent);
          box-shadow: 0 0 22px color-mix(in srgb, currentColor 20%, transparent), inset 0 0 18px rgba(255, 255, 255, 0.04);
        }

        .fusionGauge__dial {
          position: relative;
          display: grid;
          min-height: 104px;
          place-items: center;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: grab;
          touch-action: none;
        }

        .fusionGauge__dial:active {
          cursor: grabbing;
        }

        .fusionGauge__dial svg {
          width: 100%;
          max-width: 170px;
          overflow: visible;
        }

        .fusionGauge__dial path {
          fill: none;
          stroke-width: 12;
          stroke-linecap: round;
        }

        .fusionGauge__track {
          stroke: rgba(148, 163, 184, 0.18);
        }

        .fusionGauge__value {
          stroke: currentColor;
          filter: drop-shadow(0 0 10px currentColor);
          transition: stroke-dasharray 0.22s ease;
        }

        .fusionGauge--heat .fusionGauge__value {
          stroke: url(#fusionHeatGradient);
        }

        .fusionGauge__needle {
          position: absolute;
          left: 50%;
          bottom: 26px;
          width: 4px;
          height: 52px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f8fafc, currentColor);
          box-shadow: 0 0 14px currentColor;
          transform: translateX(-50%) rotate(var(--needle-angle));
          transform-origin: 50% 100%;
          transition: transform 0.2s ease;
        }

        .fusionGauge__needle::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -7px;
          width: 16px;
          aspect-ratio: 1;
          transform: translateX(-50%);
          border-radius: 50%;
          background: #f8fafc;
          box-shadow: 0 0 12px currentColor;
        }

        .fusionGauge__dial strong {
          position: absolute;
          left: 50%;
          bottom: 0.2rem;
          transform: translateX(-50%);
          width: 100%;
          color: #f8fafc;
          font-size: clamp(0.88rem, 1.4vw, 1.08rem);
          font-weight: 950;
          line-height: 1.1;
          text-align: center;
        }

        .fusionGauge__meta {
          display: grid;
          gap: 0.28rem;
          text-align: center;
        }

        .fusionGauge__meta > span {
          color: rgba(226, 232, 240, 0.9);
          font-size: 0.82rem;
          font-weight: 950;
          line-height: 1.22;
        }

        .fusionGauge__meta div {
          display: flex;
          justify-content: space-between;
          gap: 0.3rem;
          color: rgba(148, 163, 184, 0.86);
          font-size: 0.64rem;
          font-weight: 850;
        }

        .learningPanelTabs {
          display: inline-flex;
          gap: 0.45rem;
          margin-bottom: 1rem;
          padding: 0.32rem;
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.48);
        }

        .learningPanelTabs button {
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(226, 232, 240, 0.74);
          padding: 0.5rem 0.9rem;
          font-weight: 950;
          cursor: pointer;
        }

        .learningPanelTabs button.active {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(168, 85, 247, 0.2));
          color: #ffffff;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.16);
        }

        .nuclearQuizHeader {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .nuclearQuizScore {
          display: grid;
          justify-items: center;
          min-width: 92px;
          padding: 0.65rem 0.85rem;
          border: 1px solid rgba(34, 197, 94, 0.28);
          border-radius: 18px;
          background: rgba(20, 83, 45, 0.2);
        }

        .nuclearQuizScore span,
        .nuclearQuizNumber {
          color: #86efac;
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .nuclearQuizScore strong {
          color: #f8fafc;
          font-size: 1.42rem;
          line-height: 1;
        }

        .nuclearQuizActions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .nuclearQuizOption--correct {
          box-shadow: 0 0 18px rgba(34, 197, 94, 0.24);
        }

        .nuclearQuizOption--wrong {
          box-shadow: 0 0 18px rgba(239, 68, 68, 0.24);
        }

        @keyframes fusionCollideLeft {
          to {
            left: 47%;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        @keyframes fusionCollideRight {
          to {
            right: 47%;
            transform: translate(50%, -50%) scale(1.05);
          }
        }

        @keyframes fusionFailLeft {
          0%,
          100% {
            left: 25%;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            left: 43%;
            transform: translate(-50%, -50%) scale(0.96);
          }
        }

        @keyframes fusionFailRight {
          0%,
          100% {
            right: 25%;
            transform: translate(50%, -50%) scale(1);
          }
          50% {
            right: 43%;
            transform: translate(50%, -50%) scale(0.96);
          }
        }

        @keyframes fusionShockwave {
          0% {
            opacity: 0;
            transform: scale(0.24);
          }
          35% {
            opacity: 0.78;
          }
          100% {
            opacity: 0;
            transform: scale(2.9);
          }
        }

        @keyframes fusionParticleBurst {
          0% {
            opacity: 0;
            transform: rotate(var(--particle-angle)) translateX(0) scale(0.6);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--particle-angle)) translateX(190px) scale(0.2);
          }
        }

        @keyframes fusionChaoticParticle {
          0% {
            opacity: 0.2;
            transform: rotate(var(--chaos-angle-a)) translateX(40px) translateY(-12px);
          }
          100% {
            opacity: 0.9;
            transform: rotate(var(--chaos-angle-b)) translateX(180px) translateY(20px);
          }
        }

        .fissionModeGrid {
          grid-template-columns: minmax(620px, 1fr) minmax(300px, 0.34fr);
          grid-auto-rows: auto;
          align-items: start;
        }

        .fissionModeGrid .fissionSteps {
          display: none;
        }

        .fissionModeGrid > .fissionStage {
          grid-column: 1;
          min-height: clamp(680px, 72vh, 820px);
        }

        .fissionModeGrid > .nuclearControls {
          grid-column: 2;
          grid-row: 1 / span 3;
        }

        .fissionModeGrid .nuclearControls .nuclearMeterGrid,
        .fissionModeGrid .nuclearControls > .nuclearWarning {
          display: none;
        }

        .fissionGaugeDeck {
          grid-column: 1;
          display: grid;
          grid-template-columns: repeat(6, minmax(112px, 1fr));
          gap: 0.75rem;
          padding: 0.9rem;
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 24px;
          background:
            radial-gradient(circle at 14% 0%, rgba(56, 189, 248, 0.13), transparent 32%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.065), rgba(255, 255, 255, 0.025)),
            rgba(15, 23, 42, 0.82);
          box-shadow: 0 18px 54px rgba(2, 6, 23, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
        }

        .fissionWarning {
          grid-column: 1;
        }

        .nuclearGauge {
          display: grid;
          min-width: 0;
          min-height: 142px;
          align-content: start;
          justify-items: center;
          gap: 0.18rem;
          padding: 0.72rem 0.52rem 0.78rem;
          border: 1px solid rgba(125, 211, 252, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.46);
          color: #38bdf8;
          text-align: center;
        }

        .nuclearGauge__arc {
          position: relative;
          display: grid;
          width: min(100%, 132px);
          min-height: 78px;
          place-items: center;
        }

        .nuclearGauge svg {
          display: block;
          width: 100%;
          overflow: visible;
        }

        .nuclearGauge path {
          fill: none;
          stroke-width: 12;
          stroke-linecap: round;
        }

        .nuclearGauge__track {
          stroke: rgba(148, 163, 184, 0.18);
        }

        .nuclearGauge__value {
          stroke: currentColor;
          filter: drop-shadow(0 0 10px currentColor);
          transition: stroke-dasharray 0.3s ease;
        }

        .nuclearGauge strong {
          position: absolute;
          left: 50%;
          bottom: 0.42rem;
          max-width: 100%;
          transform: translateX(-50%);
          color: #f8fafc;
          font-size: clamp(1rem, 1.7vw, 1.28rem);
          font-weight: 950;
          line-height: 1;
          white-space: nowrap;
        }

        .nuclearGauge > span {
          color: rgba(226, 232, 240, 0.86);
          font-size: 0.78rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .nuclearGauge small {
          color: rgba(203, 213, 225, 0.74);
          font-size: 0.7rem;
          font-weight: 850;
          line-height: 1.2;
        }

        .nuclearGauge--purple {
          color: #a855f7;
        }

        .nuclearGauge--orange {
          color: #f97316;
        }

        .nuclearGauge--red {
          color: #ef4444;
        }

        .coolantFlowField {
          position: absolute;
          inset: 12% 9% 18%;
          z-index: 4;
          overflow: hidden;
          border-radius: 24px;
          opacity: var(--coolant-opacity, 0.52);
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .coolantFlowField::before {
          content: "Agen penyejuk (air)";
          position: absolute;
          right: 1rem;
          top: 0.85rem;
          padding: 0.3rem 0.62rem;
          border: 1px solid rgba(125, 211, 252, 0.26);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.72);
          color: #bae6fd;
          font-size: 0.68rem;
          font-weight: 950;
          opacity: var(--coolant-opacity, 0.52);
        }

        .coolantFlowField i {
          position: absolute;
          left: 16%;
          top: -18%;
          width: clamp(52px, 7vw, 94px);
          height: 136%;
          border-radius: 999px;
          background:
            linear-gradient(180deg, transparent, rgba(125, 211, 252, 0.28), rgba(14, 165, 233, 0.18), transparent),
            repeating-linear-gradient(180deg, transparent 0 22px, rgba(186, 230, 253, 0.24) 22px 34px);
          filter: blur(1px);
          animation: coolantFlow var(--coolant-speed, 1.9s) linear infinite;
        }

        .coolantFlowField i:nth-child(1) {
          left: 16%;
        }

        .coolantFlowField i:nth-child(2) {
          left: 44%;
          animation-delay: -0.42s;
        }

        .coolantFlowField i:nth-child(3) {
          left: 72%;
          animation-delay: -0.84s;
        }

        .nuclearDangerOverlay {
          position: absolute;
          inset: 0;
          z-index: 38;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .nuclearDangerOverlay__card {
          display: grid;
          min-width: min(230px, 72%);
          justify-items: center;
          gap: 0.26rem;
          padding: 1rem 1.15rem;
          border: 2px solid rgba(250, 204, 21, 0.86);
          border-radius: 22px;
          background:
            radial-gradient(circle at 50% 18%, rgba(250, 204, 21, 0.2), transparent 48%),
            rgba(2, 6, 23, 0.82);
          box-shadow: 0 0 34px rgba(250, 204, 21, 0.28), 0 0 60px rgba(239, 68, 68, 0.22);
          text-align: center;
          animation: nuclearDangerPulse 1.8s ease-in-out infinite;
          backdrop-filter: blur(10px);
        }

        .nuclearDangerOverlay__symbol {
          display: grid;
          width: clamp(74px, 10vw, 118px);
          aspect-ratio: 1;
          place-items: center;
          border: 6px solid #020617;
          border-radius: 50%;
          background: #facc15;
          color: #020617;
          font-size: clamp(3rem, 7vw, 5.6rem);
          line-height: 1;
          box-shadow: 0 0 28px rgba(250, 204, 21, 0.58);
        }

        .nuclearDangerOverlay__card strong {
          color: #fee2e2;
          font-size: clamp(1.08rem, 2.2vw, 1.45rem);
          font-weight: 950;
          letter-spacing: 0.08em;
        }

        .nuclearDangerOverlay__card small {
          color: #fef3c7;
          font-size: 0.84rem;
          font-weight: 900;
          line-height: 1.28;
        }

        .moderatorZone {
          position: absolute;
          inset: 16% 14% 25%;
          z-index: 3;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 28px;
          background:
            radial-gradient(circle at 50% 48%, rgba(125, 211, 252, 0.14), transparent 48%),
            linear-gradient(90deg, rgba(15, 23, 42, 0.12), rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.12));
          box-shadow: inset 0 0 32px rgba(56, 189, 248, 0.12);
          pointer-events: none;
          transition: opacity 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease;
        }

        .moderatorZone::before {
          content: "";
          position: absolute;
          inset: 12%;
          border-radius: 24px;
          background:
            repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.2) 0 7px, transparent 7px 34px),
            radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 62%);
          opacity: 0.75;
        }

        .moderatorZoneLabel {
          position: absolute;
          left: calc(14% + 0.85rem);
          top: calc(16% + 0.75rem);
          z-index: 14;
          padding: 0.32rem 0.7rem;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.78);
          color: #bae6fd;
          font-size: 0.72rem;
          font-weight: 950;
          white-space: nowrap;
          pointer-events: none;
        }

        .moderatorZone i {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 1;
          width: 74px;
          aspect-ratio: 1;
          border: 1px solid rgba(125, 211, 252, 0.58);
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.25);
          animation: moderatorRipple 2.2s ease-out infinite;
        }

        .moderatorZone i:nth-of-type(2) {
          left: 38%;
          top: 46%;
          animation-delay: 0.42s;
        }

        .moderatorZone i:nth-of-type(3) {
          left: 62%;
          top: 56%;
          animation-delay: 0.82s;
        }

        .moderatorZone--fast {
          opacity: 0.34;
          filter: saturate(0.72) brightness(0.86);
          box-shadow: inset 0 0 18px rgba(56, 189, 248, 0.08);
        }

        .moderatorZone--optimal {
          opacity: 0.82;
          animation: moderatorZoneGlow 2.4s ease-in-out infinite;
          box-shadow: inset 0 0 38px rgba(56, 189, 248, 0.2), 0 0 26px rgba(56, 189, 248, 0.14);
        }

        .moderatorZone--tooSlow {
          opacity: 0.96;
          filter: saturate(0.78) brightness(1.26);
          animation: moderatorOverGlow 1.8s ease-in-out infinite;
          box-shadow: inset 0 0 56px rgba(186, 230, 253, 0.28), 0 0 30px rgba(186, 230, 253, 0.18);
        }

        .chainNeutron {
          z-index: 7;
          transition: opacity 0.2s ease, filter 0.2s ease;
        }

        .chainNeutron::before {
          content: "";
          position: absolute;
          inset: -18px;
          border: 1px solid rgba(125, 211, 252, 0.7);
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.2);
          animation: moderatorNeutronRipple var(--neutron-speed, 2s) linear infinite;
          animation-delay: var(--ripple-delay, 0s);
          pointer-events: none;
        }

        .chainNeutron--fast {
          width: 11px;
          background: #f8fbff;
          box-shadow: 0 0 14px #7dd3fc, 0 0 34px rgba(56, 189, 248, 0.88);
          filter: blur(0.15px);
          animation-timing-function: cubic-bezier(0.16, 0.02, 0.82, 0.22);
        }

        .chainNeutron--fast::after {
          width: 132px;
          height: 6px;
          background: linear-gradient(90deg, rgba(186, 230, 253, 0.94), rgba(56, 189, 248, 0.54), transparent);
        }

        .chainNeutron--optimal {
          width: 13px;
          background: #eff6ff;
          box-shadow: 0 0 12px #38bdf8, 0 0 26px rgba(56, 189, 248, 0.72);
        }

        .chainNeutron--optimal::after {
          width: 58px;
          background: linear-gradient(90deg, rgba(56, 189, 248, 0.74), rgba(125, 211, 252, 0.38), transparent);
        }

        .chainNeutron--tooSlow {
          width: 15px;
          opacity: 0.72;
          background: #dbeafe;
          box-shadow: 0 0 10px rgba(191, 219, 254, 0.76), 0 0 22px rgba(125, 211, 252, 0.4);
          animation-timing-function: ease-in-out;
        }

        .chainNeutron--tooSlow::after {
          width: 34px;
          height: 3px;
          opacity: 0.48;
          background: linear-gradient(90deg, rgba(191, 219, 254, 0.56), transparent);
        }

        .moderatorFlowLabel {
          position: absolute;
          right: 1rem;
          bottom: 6.9rem;
          z-index: 13;
          display: flex;
          max-width: min(460px, calc(100% - 2rem));
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 0.34rem;
          padding: 0.48rem 0.65rem;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.76);
          color: rgba(226, 232, 240, 0.84);
          font-size: 0.7rem;
          font-weight: 850;
          line-height: 1.25;
          backdrop-filter: blur(12px);
        }

        .moderatorFlowLabel strong {
          color: #7dd3fc;
          font-weight: 950;
        }

        .nuclearModeratorStatus {
          display: grid;
          gap: 0.3rem;
        }

        .nuclearModeratorStatus strong {
          color: inherit;
        }

        .nuclearModeratorStatus span {
          color: rgba(226, 232, 240, 0.82);
          font-size: 0.84rem;
          font-weight: 750;
          line-height: 1.45;
        }

        .nuclearModeratorStatus--fast {
          border-color: rgba(249, 115, 22, 0.36);
          background: rgba(124, 45, 18, 0.22);
          color: #fed7aa;
        }

        .nuclearModeratorStatus--optimal {
          border-color: rgba(56, 189, 248, 0.34);
          background: rgba(14, 116, 144, 0.22);
          color: #bae6fd;
        }

        .nuclearModeratorStatus--tooSlow {
          border-color: rgba(168, 85, 247, 0.34);
          background: rgba(88, 28, 135, 0.23);
          color: #e9d5ff;
        }

        @keyframes coolantFlow {
          0% {
            background-position: 0 0, 0 -80px;
            opacity: 0.5;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            background-position: 0 0, 0 80px;
            opacity: 0.5;
          }
        }

        @keyframes nuclearDangerPulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.82);
          }
          50% {
            opacity: 0.98;
            transform: scale(1.08);
          }
        }

        @keyframes moderatorRipple {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.22);
          }
          32% {
            opacity: 0.72;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.45);
          }
        }

        @keyframes moderatorNeutronRipple {
          0%,
          38%,
          62%,
          100% {
            opacity: 0;
            transform: scale(0.22);
          }
          46% {
            opacity: 0.82;
            transform: scale(1);
          }
          56% {
            opacity: 0;
            transform: scale(1.65);
          }
        }

        @keyframes moderatorZoneGlow {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.16);
          }
        }

        @keyframes moderatorOverGlow {
          0%,
          100% {
            filter: saturate(0.78) brightness(1.18);
          }
          50% {
            filter: saturate(0.72) brightness(1.42);
          }
        }

        @media (max-width: 1180px) {
          .fissionModeGrid,
          .fusionModeGrid {
            grid-template-columns: 1fr;
          }

          .fissionModeGrid > .fissionStage,
          .fissionGaugeDeck,
          .fissionWarning,
          .fissionModeGrid > .nuclearControls {
            grid-column: 1;
          }

          .fissionModeGrid > .nuclearControls {
            grid-row: auto;
          }

          .fissionModeGrid > .fissionStage {
            min-height: 640px;
          }

          .fissionGaugeDeck {
            grid-template-columns: repeat(3, minmax(128px, 1fr));
          }

          .fusionModeGrid > .fusionStage {
            min-height: 680px;
          }

          .fusionPlasmaChamber {
            max-width: calc(100% - 8rem);
          }
        }

        @media (max-width: 760px) {
          .fissionModeGrid > .fissionStage {
            min-height: 560px;
          }

          .fissionGaugeDeck {
            grid-template-columns: repeat(2, minmax(124px, 1fr));
            gap: 0.62rem;
            padding: 0.7rem;
          }

          .nuclearGauge {
            min-height: 128px;
          }

          .moderatorZone {
            inset: 18% 9% 28%;
            border-radius: 22px;
          }

          .moderatorZoneLabel {
            left: calc(9% + 0.6rem);
            top: calc(18% + 0.55rem);
            font-size: 0.66rem;
          }

          .moderatorFlowLabel {
            left: 1rem;
            right: 1rem;
            bottom: 7.5rem;
            justify-content: center;
            border-radius: 16px;
            font-size: 0.66rem;
          }

          .chainNeutron--fast::after {
            width: 86px;
          }

          .fusionModeGrid > .fusionStage {
            min-height: 620px;
          }

          .fusionPlasmaChamber {
            width: min(430px, 92vw);
            max-width: calc(100% - 1.5rem);
          }

          .fusionAtomDock {
            width: 82px;
            top: auto;
            bottom: 6.5rem;
          }

          .fusionAtomDock--deuterium {
            left: 1rem;
          }

          .fusionAtomDock--tritium {
            right: 1rem;
          }

          .fusionGaugeGrid {
            grid-template-columns: 1fr;
          }

          .nuclearQuizHeader {
            display: grid;
          }
        }
      `}</style>

      <LearningPanelV2
        mode={activeMode}
        answers={quizAnswers[activeMode]}
        submitted={quizSubmitted[activeMode]}
        onAnswer={handleQuizAnswer}
        onSubmit={submitQuiz}
        onRetry={retryQuiz}
      />
    </main>
  );
}
