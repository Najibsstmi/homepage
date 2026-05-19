import { useEffect, useMemo, useRef, useState } from "react";

const MODES = [
  { id: "fission", label: "Pembelahan Nukleus" },
  { id: "fusion", label: "Pelakuran Nukleus" },
  { id: "plant", label: "Janakuasa Nuklear" },
];

const initialFission = {
  running: false,
  cycle: 0,
  splitIds: [],
  neutronCount: 2,
  splitCount: 0,
  energy: 0,
  temperature: 260,
  boronRod: 25,
  coolantFlow: 55,
  graphiteRod: 55,
  uraniumRod: 55,
  absorbedCount: 0,
  message: "Laraskan rod uranium, grafit, boron dan agen penyejuk, kemudian tembak neutron pertama.",
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
  fissionRate: 55,
  waterFlow: 70,
  controlRod: 45,
};

const uraniumPositions = [
  { id: "u0", left: "22%", top: "22%" },
  { id: "u1", left: "50%", top: "18%" },
  { id: "u2", left: "76%", top: "25%" },
  { id: "u3", left: "33%", top: "40%" },
  { id: "u4", left: "62%", top: "42%" },
  { id: "u5", left: "19%", top: "58%" },
  { id: "u6", left: "48%", top: "62%" },
  { id: "u7", left: "78%", top: "58%" },
  { id: "u8", left: "34%", top: "76%" },
  { id: "u9", left: "64%", top: "78%" },
  { id: "u10", left: "12%", top: "38%" },
  { id: "u11", left: "88%", top: "42%" },
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

const learningContent = {
  fission: {
    observation:
      "Apabila neutron mengenai uranium-235, nukleus bergetar, terbelah dan membebaskan neutron baharu.",
    inference:
      "Neutron baharu boleh membedil nukleus uranium lain lalu menghasilkan tindak balas berantai.",
    conclusion:
      "Rod kawalan menyerap neutron untuk memperlahankan pembelahan dan mengawal suhu reaktor.",
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
  return clamp(6 + Math.round((uraniumRod / 100) * 6), 6, uraniumPositions.length);
}

function getModeratorStatus(graphiteRod) {
  if (graphiteRod < 35) {
    return "Moderator terlalu rendah";
  }

  if (graphiteRod > 85) {
    return "Moderator terlalu tinggi";
  }

  return "Moderator optimum";
}

function getNeutronMode(graphiteRod) {
  if (graphiteRod < 35) {
    return "fast";
  }

  if (graphiteRod > 85) {
    return "tooSlow";
  }

  return "optimal";
}

function getModeratorConcept(graphiteRod) {
  if (graphiteRod < 35) {
    return "Neutron terlalu laju dan sukar diserap oleh U-235.";
  }

  if (graphiteRod > 85) {
    return "Neutron terlalu perlahan. Kadar pembelahan menurun.";
  }

  return "Neutron diperlahankan. U-235 lebih mudah mengalami pembelahan.";
}

function getModeratorEfficiency(graphiteRod) {
  if (graphiteRod < 35) {
    return 0.24 + graphiteRod / 160;
  }

  if (graphiteRod <= 65) {
    return 0.74 + (graphiteRod - 35) / 120;
  }

  if (graphiteRod <= 85) {
    return 1 - (graphiteRod - 65) / 260;
  }

  return clamp(0.9 - (graphiteRod - 85) / 35, 0.42, 0.9);
}

function getFissionMetrics(fission) {
  const uraniumCount = getUraniumCount(fission.uraniumRod);
  const moderatorEfficiency = getModeratorEfficiency(fission.graphiteRod);
  const boronBrake = 1 - (fission.boronRod / 100) * 0.88;
  const densityDrive = (fission.uraniumRod / 100) * 72;
  const neutronDrive = Math.min(fission.neutronCount, 18) * 3.1;
  const reactionRate = clamp(
    Math.round((densityDrive + neutronDrive) * moderatorEfficiency * boronBrake),
    0,
    100
  );
  const activeUranium = Math.max(0, uraniumCount - fission.splitIds.length);
  const moderatorStatus = getModeratorStatus(fission.graphiteRod);
  let status = "Reaktor stabil";

  if (fission.temperature > 900) {
    status = "Bahaya: suhu tinggi";
  } else if (fission.boronRod >= 95 || (fission.boronRod > 82 && reactionRate < 28)) {
    status = "Reaktor dikawal";
  } else if (reactionRate >= 76 && fission.neutronCount >= 8) {
    status = "Tindak balas berantai";
  } else if (reactionRate >= 54) {
    status = "Tindak balas aktif";
  } else if (reactionRate < 26) {
    status = "Tindak balas perlahan";
  }

  return {
    uraniumCount,
    activeUranium,
    moderatorEfficiency,
    reactionRate,
    moderatorStatus,
    status,
  };
}

function getFissionMessage(fission, metrics) {
  if (fission.temperature > 900) {
    return "AMARAN: Suhu reaktor terlalu tinggi. Masukkan Rod Boron dan tingkatkan Agen Penyejuk (Air).";
  }

  if ((fission.coolantFlow ?? 0) >= 82 && fission.temperature > 420) {
    return "Agen penyejuk mengalir deras dan membuang haba daripada teras reaktor.";
  }

  if (fission.boronRod >= 95) {
    return "Rod boron menyerap neutron bebas supaya tindak balas berantai terkawal.";
  }

  if (fission.uraniumRod > 84 && metrics.reactionRate > 70) {
    return "Rod uranium tinggi: lebih banyak U-235 menyebabkan neutron mudah mencetuskan pembelahan berantai.";
  }

  if (fission.graphiteRod < 35) {
    return "Neutron terlalu laju. Tanpa moderator grafit yang mencukupi, neutron sukar diserap oleh uranium-235.";
  }

  if (fission.graphiteRod > 85) {
    return "Rod grafit terlalu banyak memperlahankan neutron. Kadar pembelahan menurun.";
  }

  if (metrics.reactionRate >= 55) {
    return "Rod grafit memperlahankan neutron. Neutron perlahan lebih mudah diserap oleh U-235 lalu mencetuskan pembelahan.";
  }

  return fission.message;
}

function advanceFission(current) {
  const metrics = getFissionMetrics(current);
  const neutronMode = getNeutronMode(current.graphiteRod);
  const uraniumDensity = current.uraniumRod / 100;
  const coolantFlow = current.coolantFlow ?? initialFission.coolantFlow;
  const boronAbsorptionRate = clamp((current.boronRod / 100) * 0.92, 0, 0.94);
  const boronAbsorbed = Math.round(current.neutronCount * boronAbsorptionRate);
  const fastEscapeRate = current.graphiteRod < 35 ? clamp((35 - current.graphiteRod) / 58, 0.12, 0.6) : 0;
  const sparseEscapeRate = current.uraniumRod < 35 ? clamp((35 - current.uraniumRod) / 90, 0, 0.28) : 0;
  const escaped = Math.round(Math.max(0, current.neutronCount - boronAbsorbed) * (fastEscapeRate + sparseEscapeRate));
  const effectiveNeutrons = Math.max(0, current.neutronCount - boronAbsorbed - escaped);
  const splitCapacity = current.uraniumRod > 82 ? 5 : current.uraniumRod > 56 ? 4 : current.uraniumRod > 28 ? 3 : 2;
  const collisionDrive =
    effectiveNeutrons * (0.42 + uraniumDensity * 0.95) * metrics.moderatorEfficiency;
  const splitDemand = Math.round(collisionDrive / 2.35 + metrics.reactionRate / 38);
  const minimumFastHit =
    neutronMode === "fast" && current.neutronCount >= 3 && current.uraniumRod >= 45 && current.boronRod < 75
      ? 1
      : 0;
  const splitEvents = current.neutronCount <= 0 ? 0 : clamp(Math.max(splitDemand, minimumFastHit), 0, splitCapacity);
  const neutronsPerSplit = neutronMode === "optimal" ? 3 : neutronMode === "fast" ? 2 : 1;
  const producedNeutrons = splitEvents * neutronsPerSplit;
  const coolantCooling = Math.round(coolantFlow * (current.temperature > 900 ? 1.18 : 0.72));
  const nextNeutrons = clamp(
    current.neutronCount - boronAbsorbed - escaped + producedNeutrons,
    0,
    30
  );
  const heatGain =
    splitEvents * (22 + Math.round(current.uraniumRod / 4.5)) +
    producedNeutrons * 2 +
    Math.round(metrics.reactionRate * 0.08) -
    Math.round(current.boronRod * 0.45) -
    coolantCooling -
    Math.round(escaped * 4) -
    (splitEvents === 0 ? 22 : 0);
  const nextTemperature = clamp(Math.round(current.temperature + heatGain), 220, 1100);
  const nextEnergy = clamp(
    current.energy +
      splitEvents * (12 + Math.round(current.uraniumRod / 6)) -
      Math.round(boronAbsorbed * 5.5) -
      Math.round(escaped * 2.5) -
      (splitEvents === 0 ? 10 : 0),
    0,
    999
  );
  const splitIds = Array.from({ length: splitEvents }, (_, index) => {
    const targetIndex = (current.cycle * 3 + index * 2) % metrics.uraniumCount;
    return uraniumPositions[targetIndex].id;
  });
  const nextMetrics = getFissionMetrics({
    ...current,
    neutronCount: nextNeutrons,
    temperature: nextTemperature,
    energy: nextEnergy,
    splitIds,
  });
  const controlledStop = current.boronRod >= 95 && nextNeutrons <= 2;

  return {
    ...current,
    running: !controlledStop && nextNeutrons > 0,
    cycle: current.cycle + 1,
    splitIds,
    neutronCount: nextNeutrons,
    splitCount: current.splitCount + splitEvents,
    absorbedCount: current.absorbedCount + boronAbsorbed,
    energy: nextEnergy,
    temperature: nextTemperature,
    message:
      splitEvents > 0
        ? `${splitEvents} nukleus U-235 terbelah dan melepaskan ${producedNeutrons} neutron baharu.`
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
  value,
  min,
  max,
  step = 1,
  suffix = "%",
  leftLabel,
  rightLabel,
  onChange,
}) {
  return (
    <label className="nuclearSlider">
      <div className="nuclearSlider__top">
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
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

function LearningPanelV2({ mode, answers, submitted, onAnswer, onSubmit, onRetry }) {
  const content = learningContent[mode];
  const [panelTab, setPanelTab] = useState("nota");
  const answeredCount = content.questions.filter((question) => answers[question.id]).length;
  const score = content.questions.filter((question) => answers[question.id] === question.answer).length;

  useEffect(() => {
    setPanelTab("nota");
  }, [mode]);

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
              <span>Skor</span>
              <strong>
                {submitted ? score : answeredCount}/{content.questions.length}
              </strong>
            </div>
          </div>

          <div className="nuclearQuizGrid">
            {content.questions.map((question, index) => {
              const selected = answers[question.id];
              const correct = selected === question.answer;

              return (
                <article className="nuclearQuizCard" key={question.id}>
                  <span className="nuclearQuizNumber">Soalan {index + 1}</span>
                  <h3>{question.text}</h3>
                  <div className="nuclearQuizOptions">
                    {question.options.map((option) => (
                      <button
                        type="button"
                        key={option}
                        className={[
                          "nuclearQuizOption",
                          selected === option ? "nuclearQuizOption--selected" : "",
                          submitted && option === question.answer ? "nuclearQuizOption--correct" : "",
                          submitted && selected === option && !correct ? "nuclearQuizOption--wrong" : "",
                        ].join(" ")}
                        onClick={() => onAnswer(question.id, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {submitted && selected ? (
                    <p
                      className={
                        correct
                          ? "nuclearQuizFeedback nuclearQuizFeedback--correct"
                          : "nuclearQuizFeedback nuclearQuizFeedback--wrong"
                      }
                    >
                      {correct ? "Betul. " : "Salah. "}
                      {correct ? question.explanation : question.hint}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="nuclearQuizActions">
            <button type="button" className="nuclearButton nuclearButton--primary" onClick={onSubmit}>
              Semak Jawapan
            </button>
            <button type="button" className="nuclearButton nuclearButton--ghost" onClick={onRetry}>
              Cuba Lagi
            </button>
          </div>
        </div>
      )}
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
    if (activeMode !== "fission" || !fission.running) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFission((current) => advanceFission(current));
    }, 1150);

    return () => window.clearInterval(timer);
  }, [activeMode, fission.running]);

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
  const fissionDanger = fission.temperature > 900;
  const coolantLevel = (fission.coolantFlow ?? initialFission.coolantFlow) / 100;
  const neutronMode = getNeutronMode(fission.graphiteRod);
  const moderatorConcept = getModeratorConcept(fission.graphiteRod);
  const neutronBaseSpeed = neutronMode === "fast" ? 0.48 : neutronMode === "tooSlow" ? 4.6 : 1.95;
  const activeUraniumPositions = uraniumPositions.slice(0, fissionMetrics.uraniumCount);
  const neutronVisuals = Array.from(
    { length: Math.min(Math.max(fission.neutronCount, fission.running ? 3 : 2), 18) },
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
    if (!plant.active) {
      return {
        temperature: 35,
        steam: 0,
        turbine: 0,
        output: 0,
        homes: 0,
        reactorHeat: 0,
        nuclearLoad: 0,
        coolantStress: 0,
        radioactive: false,
        danger: false,
        electricHigh: false,
        status: "Loji belum aktif",
      };
    }

    const rodEffect = 1 - plant.controlRod / 100;
    const coolantStress = clamp(100 - plant.waterFlow, 0, 100);
    const nuclearLoad = clamp(plant.fissionRate * (0.24 + rodEffect * 0.96), 0, 110);
    const temperature = Math.round(
      clamp(
        90 + nuclearLoad * 7.4 + coolantStress * 4.2 - plant.controlRod * 1.1 - plant.waterFlow * 0.62,
        45,
        1120
      )
    );
    const reactorHeat = Math.round(clamp((temperature - 120) / 9.4, 0, 100));
    const steam = Math.round(clamp(nuclearLoad * 0.62 + plant.waterFlow * 0.42 - coolantStress * 0.18, 0, 100));
    const turbine = Math.round(clamp(steam * (0.48 + plant.waterFlow / 150), 0, 100));
    const output = Math.round(clamp(turbine * 0.98, 0, 100));
    const homes = Math.round(output * 12);
    const radioactive = plant.controlRod < 35 && reactorHeat > 42;
    const danger = temperature > 900 || plant.waterFlow < 28;
    const electricHigh = output >= 62;
    let status = "Loji stabil";

    if (danger) {
      status = "Amaran suhu tinggi";
    } else if (output < 35) {
      status = "Output rendah";
    } else if (output >= 68 && temperature < 850) {
      status = "Output optimum";
    }

    return {
      temperature,
      steam,
      turbine,
      output,
      homes,
      reactorHeat,
      nuclearLoad: Math.round(nuclearLoad),
      coolantStress,
      radioactive,
      danger,
      electricHigh,
      status,
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
    setFission(initialFission);
    setFusion(initialFusion);
    setPlant(initialPlant);
    setQuizAnswers({ fission: {}, fusion: {}, plant: {} });
    setQuizSubmitted({ fission: false, fusion: false, plant: false });
  };

  const resetFission = () => {
    setFission(initialFission);
  };

  const shootNeutron = () => {
    setFission((current) => ({
      ...current,
      running: true,
      cycle: current.cycle + 1,
      splitIds: [],
      neutronCount: Math.max(current.neutronCount, 3),
      hasStarted: true,
      message: "Neutron pertama memasuki teras reaktor dan mencari nukleus U-235.",
    }));
  };

  const setBoronRod = (value) => {
    setFission((current) => ({
      ...current,
      boronRod: value,
      message:
        value >= 95
          ? "Rod boron menyerap neutron dan memperlahankan tindak balas berantai."
          : "Rod boron dilaraskan. Lebih tinggi rod masuk, lebih banyak neutron diserap.",
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
    setFission((current) => ({
      ...current,
      graphiteRod: value,
      message:
        value < 35
          ? "Moderator terlalu rendah. Neutron terlalu laju dan kurang menyebabkan pembelahan."
          : value > 85
          ? "Moderator terlalu tinggi. Neutron menjadi terlalu perlahan dan tindak balas menurun."
          : "Moderator optimum. Neutron diperlahankan supaya lebih mudah membelah U-235.",
    }));
  };

  const setUraniumRod = (value) => {
    setFission((current) => ({
      ...current,
      uraniumRod: value,
      message:
        value > 85
          ? "Rod uranium tinggi. Reaktor semakin padat dan tindak balas berantai lebih aktif."
          : "Rod uranium dilaraskan. Lebih banyak U-235 memberi lebih banyak sasaran neutron.",
    }));
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
            <section
              className={[
                "nuclearPlantFlow",
                plant.active ? "nuclearPlantFlow--active" : "",
                plantData.danger ? "nuclearPlantFlow--warning" : "",
                plantData.radioactive ? "nuclearPlantFlow--radioactive" : "",
                plantData.electricHigh ? "nuclearPlantFlow--electric" : "",
              ].join(" ")}
              style={{
                "--turbine-speed": `${Math.max(0.75, 3.2 - plantData.turbine / 40)}s`,
                "--plant-heat": `${plantData.reactorHeat}%`,
                "--plant-output": `${plantData.output}%`,
              }}
              aria-label="Gambaran keseluruhan loji janakuasa nuklear"
            >
              <div className="plantSceneHeader">Gambaran Keseluruhan Loji</div>
              <NuclearDangerOverlay show={plantDanger} message="AMARAN: Reaktor tidak stabil" />

              <div className="plantRiver" aria-hidden="true">
                <span>Sumber Air</span>
                <small>Agen penyejuk</small>
              </div>

              <div className="plantCoolingTower" aria-label="Menara penyejuk">
                <div className="plantSmoke">
                  <i />
                  <i />
                  <i />
                </div>
                <strong>Menara Penyejuk</strong>
              </div>

              <div className="plantWaterPipe plantWaterPipe--in" aria-hidden="true">
                <i />
              </div>
              <div className="plantWaterPipe plantWaterPipe--out" aria-hidden="true">
                <i />
              </div>

              <div className="plantReactorBuilding" aria-label="Reaktor nuklear">
                <div className="plantReactorDome">
                  <strong>REAKTOR</strong>
                  <div className="plantReactorCore" aria-hidden="true">
                    <span />
                  </div>
                  <div className="plantRadiationSigns" aria-hidden="true">
                    <i>☢</i>
                    <i>☢</i>
                    <i>☢</i>
                  </div>
                  <div className="plantDangerSigns" aria-hidden="true">
                    <i>!</i>
                    <i>!</i>
                  </div>
                  <div className="plantGreySmoke" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <span className="plantHeatLabel">haba nuklear</span>
              </div>

              <div className="plantSteamLine" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>

              <div className="plantGeneratorBlock" aria-label="Turbin dan generator">
                <div className="plantTurbine" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="plantGenerator" aria-hidden="true">G</div>
                <strong>Generator</strong>
                <div className="plantElectricSparks" aria-hidden="true">
                  <i>⚡</i>
                  <i>⚡</i>
                  <i>⚡</i>
                </div>
              </div>

              <div className="plantPowerLine" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>

              <div className="plantSubstation" aria-label="Pencawang elektrik">
                <strong>Pencawang Elektrik</strong>
                <div className="plantTower">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="plantCity" aria-label="Kawasan rumah dan lampu jalan">
                <div className="plantStreetLights" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="plantHouses" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <strong>Kawasan Rumah</strong>
              </div>
            </section>

            <aside className="nuclearPanel nuclearControls">
              <div className="nuclearPanelTitle">
                <span>Kawalan Loji</span>
                <h2>Stesen Janakuasa</h2>
              </div>
              <NuclearSlider
                label="Kadar Pembelahan"
                value={plant.fissionRate}
                min={0}
                max={100}
                leftLabel="Rendah"
                rightLabel="Tinggi"
                onChange={(value) => setPlant((current) => ({ ...current, fissionRate: value }))}
              />
              <NuclearSlider
                label="Agen Penyejuk"
                value={plant.waterFlow}
                min={0}
                max={100}
                leftLabel="Sedikit"
                rightLabel="Banyak"
                onChange={(value) => setPlant((current) => ({ ...current, waterFlow: value }))}
              />
              <NuclearSlider
                label="Rod Pengawal"
                value={plant.controlRod}
                min={0}
                max={100}
                leftLabel="Sedikit"
                rightLabel="Penuh"
                onChange={(value) => setPlant((current) => ({ ...current, controlRod: value }))}
              />

              <div className="nuclearActionRow">
                <button
                  type="button"
                  className="nuclearButton nuclearButton--primary"
                  onClick={() => setPlant((current) => ({ ...current, active: true }))}
                >
                  Hidupkan Loji
                </button>
                <button type="button" className="nuclearButton nuclearButton--ghost" onClick={resetPlant}>
                  Reset Loji
                </button>
              </div>

              <div className="nuclearMeterGrid">
                <NuclearMeter
                  label="Suhu reaktor"
                  value={`${plantData.temperature}°C`}
                  fill={plantData.temperature / 10}
                  tone={plantData.danger ? "red" : "purple"}
                />
                <NuclearMeter label="Tenaga nuklear" value={`${plantData.nuclearLoad}%`} fill={plantData.nuclearLoad} tone="orange" />
                <NuclearMeter label="Tekanan wap" value={`${plantData.steam}%`} fill={plantData.steam} />
                <NuclearMeter label="Kelajuan turbin" value={`${plantData.turbine}%`} fill={plantData.turbine} tone="orange" />
                <NuclearMeter label="Output elektrik" value={`${plantData.output}%`} fill={plantData.output} />
                <NuclearMeter label="Rumah dibekalkan" value={`${plantData.homes} rumah`} fill={plantData.output} />
                <NuclearMeter label="Status" value={plantData.status} fill={plant.active ? 80 : 10} />
              </div>

              {plantData.danger ? (
                <p className="nuclearWarning">Bahaya: reaktor terlalu panas. Tambah agen penyejuk atau masukkan rod pengawal.</p>
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
