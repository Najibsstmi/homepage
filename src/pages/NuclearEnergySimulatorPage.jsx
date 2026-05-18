import { useEffect, useMemo, useState } from "react";

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
  active: false,
  success: false,
  energy: 0,
  message: "Laraskan suhu plasma dan medan magnet sebelum memulakan pelakuran.",
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
        options: ["Elektron", "Neutron", "Proton"],
        answer: "Neutron",
        explanation: "Betul. Neutron membedil uranium-235 dan mencetuskan pembelahan.",
        hint: "Zarah ini neutral dan boleh memasuki nukleus dengan lebih mudah.",
      },
      {
        id: "rod",
        text: "Mengapa rod kawalan digunakan dalam reaktor nuklear?",
        options: [
          "Menyerap neutron",
          "Menambah wap",
          "Menukar turbin kepada generator",
        ],
        answer: "Menyerap neutron",
        explanation: "Betul. Rod kawalan menyerap neutron supaya kadar pembelahan terkawal.",
        hint: "Rod kawalan berkaitan dengan bilangan neutron yang masih bebas bergerak.",
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
        id: "temperature",
        text: "Mengapa pelakuran nukleus memerlukan suhu yang sangat tinggi?",
        options: [
          "Supaya nukleus ringan dapat bercantum",
          "Supaya rod kawalan melebur",
          "Supaya turbin bergerak perlahan",
        ],
        answer: "Supaya nukleus ringan dapat bercantum",
        explanation:
          "Betul. Suhu tinggi memberi tenaga kepada nukleus ringan untuk menghampiri dan bercantum.",
        hint: "Fikirkan keadaan yang diperlukan supaya dua nukleus kecil boleh bergabung.",
      },
      {
        id: "magnet",
        text: "Apakah yang berlaku jika medan magnet terlalu rendah?",
        options: ["Plasma bocor", "Uranium terbelah", "Generator menghasilkan elektrik"],
        answer: "Plasma bocor",
        explanation: "Betul. Medan magnet membantu mengurung plasma panas supaya lebih stabil.",
        hint: "Medan magnet bertindak seperti pengurung plasma dalam ruang pelakuran.",
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
        options: ["Wap", "Neutron", "Rod kawalan"],
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
        ],
        answer: "Menghasilkan elektrik",
        explanation:
          "Betul. Generator menukar putaran turbin kepada tenaga elektrik.",
        hint: "Komponen ini berada selepas turbin dalam aliran tenaga.",
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

  const fusionStatus = useMemo(() => {
    if (!fusion.active) {
      return "Sedia";
    }

    if (fusion.magneticField < 35) {
      return "Plasma tidak stabil";
    }

    if (fusion.temperature < 80) {
      return "Suhu belum mencukupi";
    }

    return "Pelakuran berjaya";
  }, [fusion.active, fusion.magneticField, fusion.temperature]);
  const fusionDanger = fusion.active && (fusion.magneticField < 35 || (fusion.temperature >= 95 && fusion.magneticField < 50));
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

  const startFusion = () => {
    setFusion((current) => {
      if (current.magneticField < 35) {
        return {
          ...current,
          active: true,
          success: false,
          energy: 8,
          message: "Plasma bocor. Tingkatkan medan magnet.",
        };
      }

      if (current.temperature < 80) {
        return {
          ...current,
          active: true,
          success: false,
          energy: 14,
          message: "Suhu belum mencukupi untuk pelakuran.",
        };
      }

      return {
        ...current,
        active: true,
        success: true,
        energy: Math.round(clamp(current.temperature * 1.1 + current.magneticField * 0.35, 0, 140)),
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
          <section className="nuclearModeGrid">
            <aside className="nuclearPanel nuclearSteps">
              <div className="nuclearPanelTitle">
                <span>Langkah</span>
                <h2>Pelakuran Nukleus</h2>
              </div>
              <ol>
                <li>Naikkan suhu plasma sehingga menghampiri 100 juta °C.</li>
                <li>Kuatkan medan magnet untuk mengurung plasma.</li>
                <li>Mulakan pelakuran dan perhatikan pembentukan helium.</li>
              </ol>
              <p className="nuclearMiniNote">
                Pelakuran berlaku pada suhu sangat tinggi, seperti di dalam bintang.
              </p>
            </aside>

            <section
              className={[
                "nuclearStage",
                "fusionStage",
                fusion.active ? "fusionStage--active" : "",
                fusion.success ? "fusionStage--success" : "",
                fusion.active && fusion.magneticField < 35 ? "fusionStage--unstable" : "",
              ].join(" ")}
              style={{ "--fusion-speed": fusion.temperature >= 80 ? "1.4s" : "4.2s" }}
              aria-label="Ruang simulasi pelakuran nukleus"
            >
              <div className="plasmaChamber">
                <div className="plasmaSwirl" aria-hidden="true" />
                <div className="fusionNucleus fusionNucleus--deuterium">Deuterium</div>
                <div className="fusionNucleus fusionNucleus--tritium">Tritium</div>
                <div className="fusionHelium">Helium</div>
                <div className="fusionNeutron">neutron</div>
                <div className="fusionFlash" aria-hidden="true" />
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
              <NuclearDangerOverlay show={fusionDanger} message="Plasma tidak stabil" />
            </section>

            <aside className="nuclearPanel nuclearControls">
              <div className="nuclearPanelTitle">
                <span>Kawalan</span>
                <h2>Plasma & Medan Magnet</h2>
              </div>
              <NuclearSlider
                label="Suhu plasma"
                value={fusion.temperature}
                min={1}
                max={100}
                suffix=" juta °C"
                leftLabel="1 juta °C"
                rightLabel="100 juta °C"
                onChange={(value) =>
                  setFusion((current) => ({
                    ...current,
                    temperature: value,
                    active: false,
                    success: false,
                    message: "Suhu diubah. Tekan Mulakan Pelakuran untuk menguji keadaan.",
                  }))
                }
              />
              <NuclearSlider
                label="Medan magnet"
                value={fusion.magneticField}
                min={0}
                max={100}
                leftLabel="Lemah"
                rightLabel="Kuat"
                onChange={(value) =>
                  setFusion((current) => ({
                    ...current,
                    magneticField: value,
                    active: false,
                    success: false,
                    message: "Medan magnet diubah. Tekan Mulakan Pelakuran untuk menguji keadaan.",
                  }))
                }
              />

              <div className="nuclearActionRow">
                <button type="button" className="nuclearButton nuclearButton--primary" onClick={startFusion}>
                  Mulakan Pelakuran
                </button>
                <button type="button" className="nuclearButton nuclearButton--ghost" onClick={resetFusion}>
                  Reset Pelakuran
                </button>
              </div>

              <div className="nuclearMeterGrid">
                <NuclearMeter label="Suhu" value={`${fusion.temperature} juta °C`} fill={fusion.temperature} />
                <NuclearMeter label="Medan magnet" value={`${fusion.magneticField}%`} fill={fusion.magneticField} tone="purple" />
                <NuclearMeter label="Tenaga" value={`${fusion.energy} unit`} fill={fusion.energy} tone="orange" />
                <NuclearMeter label="Status" value={fusionStatus} fill={fusion.success ? 100 : fusion.active ? 40 : 12} />
              </div>
            </aside>
          </section>

          <section className="nuclearConceptNote">
            Pelakuran nukleus berlaku apabila dua nukleus ringan bercantum membentuk
            nukleus yang lebih berat dengan pembebasan tenaga yang sangat besar. Proses
            ini memerlukan suhu yang sangat tinggi.
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
              <NuclearDangerOverlay show={plantDanger} message="Suhu reaktor tinggi" />

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
          .fissionModeGrid {
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
        }
      `}</style>

      <LearningPanel
        mode={activeMode}
        answers={quizAnswers[activeMode]}
        onAnswer={handleQuizAnswer}
      />
    </main>
  );
}
