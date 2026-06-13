import { useMemo, useState } from "react";
import MobileControlDrawer from "../components/MobileControlDrawer";

const metals = [
  { name: "Magnesium", symbol: "Mg", index: 0, electrodeColor: "#9ca3af" },
  { name: "Aluminium", symbol: "Al", index: 1, electrodeColor: "#cbd5e1" },
  { name: "Zink", symbol: "Zn", index: 2, electrodeColor: "#94a3b8" },
  { name: "Besi", symbol: "Fe", index: 3, electrodeColor: "#64748b" },
  { name: "Plumbum", symbol: "Pb", index: 4, electrodeColor: "#475569" },
  { name: "Kuprum", symbol: "Cu", index: 5, electrodeColor: "#c76732" },
  { name: "Perak", symbol: "Ag", index: 6, electrodeColor: "#e2e8f0" },
];

const electrolytes = [
  {
    id: "copper-sulfate",
    name: "Larutan kuprum(II) sulfat",
    formula: "CuSO4(aq)",
    color: "56, 189, 248",
  },
  {
    id: "zinc-sulfate",
    name: "Larutan zink sulfat",
    formula: "ZnSO4(aq)",
    color: "74, 222, 128",
  },
  {
    id: "sulfuric-acid",
    name: "Asid sulfurik cair",
    formula: "H2SO4(aq)",
    color: "250, 204, 21",
  },
  {
    id: "sodium-chloride",
    name: "Larutan natrium klorida",
    formula: "NaCl(aq)",
    color: "168, 85, 247",
  },
  {
    id: "silver-nitrate",
    name: "Larutan argentum nitrat",
    formula: "AgNO3(aq)",
    color: "244, 114, 182",
  },
];

const currentByDistance = {
  0: 0,
  1: 0.2,
  2: 0.4,
  3: 0.6,
  4: 0.8,
  5: 1.1,
  6: 1.4,
};

function getMetalLabel(metal) {
  return metal ? `${metal.name} (${metal.symbol})` : "-";
}

function getBulbStrength(current) {
  if (current >= 1) {
    return "bright";
  }
  if (current >= 0.6) {
    return "medium";
  }
  if (current >= 0.2) {
    return "dim";
  }
  return "off";
}

function getInference(distance, hasPair) {
  if (!hasPair) {
    return "Pilih dua logam daripada siri keelektropositifan untuk membandingkan arus elektrik yang terhasil.";
  }

  if (distance === 0) {
    return "Kedua-dua elektrod adalah sama. Tiada beza keupayaan. Arus elektrik tidak terhasil.";
  }

  if (distance <= 2) {
    return "Pasangan logam hampir dalam siri keelektropositifan. Arus elektrik yang terhasil rendah.";
  }

  if (distance <= 4) {
    return "Pasangan logam agak berjauhan dalam siri keelektropositifan. Arus elektrik yang terhasil sederhana.";
  }

  return "Pasangan logam berjauhan dalam siri keelektropositifan. Arus elektrik yang terhasil tinggi.";
}

export default function ChemicalCellSimulatorPage({ reviewPanel }) {
  const [electrodeOne, setElectrodeOne] = useState(null);
  const [electrodeTwo, setElectrodeTwo] = useState(null);
  const [electrolyte, setElectrolyte] = useState(null);
  const [started, setStarted] = useState(false);
  const [startWarning, setStartWarning] = useState("");

  const hasPair = Boolean(electrodeOne && electrodeTwo);
  const sameElectrode = hasPair && electrodeOne.symbol === electrodeTwo.symbol;
  const distance = hasPair ? Math.abs(electrodeOne.index - electrodeTwo.index) : 0;
  const circuitReady = started && hasPair && Boolean(electrolyte);
  const current = circuitReady ? currentByDistance[distance] : 0;
  const bulbStrength = getBulbStrength(current);
  const inference = getInference(distance, hasPair);

  const nextSelectionLabel = useMemo(() => {
    if (!electrodeOne || (electrodeOne && electrodeTwo)) {
      return "Klik logam untuk Elektrod 1.";
    }

    return "Klik logam kedua untuk Elektrod 2.";
  }, [electrodeOne, electrodeTwo]);

  const handleMetalClick = (metal) => {
    setStarted(false);
    setStartWarning("");

    if (!electrodeOne || electrodeTwo) {
      setElectrodeOne(metal);
      setElectrodeTwo(null);
      return;
    }

    setElectrodeTwo(metal);
  };

  const handleElectrolyteClick = (item) => {
    setElectrolyte(item);
    setStarted(false);
    setStartWarning("");
  };

  const startSimulation = () => {
    if (!hasPair || !electrolyte) {
      setStartWarning("Pilih dua elektrod dan satu elektrolit sebelum menekan Mula.");
      return;
    }

    setStartWarning("");
    setStarted(true);
  };

  const resetSimulation = () => {
    setElectrodeOne(null);
    setElectrodeTwo(null);
    setElectrolyte(null);
    setStarted(false);
    setStartWarning("");
  };

  const getMetalSelectionBadge = (metal) => {
    const isFirst = electrodeOne?.symbol === metal.symbol;
    const isSecond = electrodeTwo?.symbol === metal.symbol;

    if (isFirst && isSecond) {
      return "E1 + E2";
    }

    if (isFirst) {
      return "E1";
    }

    if (isSecond) {
      return "E2";
    }

    return "";
  };

  return (
    <main className="chemicalCellPage">
      <section className="chemicalCellHero">
        <span className="simulatorHero__kicker">Tingkatan 5 - Bab 6 Elektrokimia</span>
        <h1>Simulator Sel Kimia</h1>
        <p>
          Terokai hubungan antara jarak kedudukan dua logam dalam siri keelektropositifan
          dengan arus elektrik yang terhasil.
        </p>
      </section>

      {reviewPanel}

      <section className="chemicalCellLayout" aria-label="Simulator sel kimia">
        <MobileControlDrawer title="Siri keelektropositifan" summary="Pilih dua logam">
          <aside className="chemicalCellPanel chemicalSeriesPanel">
            <div className="chemicalPanelHeader">
              <span>Siri Keelektropositifan</span>
              <strong>Paling elektropositif ke paling kurang elektropositif</strong>
            </div>

            <div className="chemicalMetalList">
              {metals.map((metal, index) => {
                const selectionBadge = getMetalSelectionBadge(metal);

                return (
                  <button
                    key={metal.symbol}
                    type="button"
                    className={`chemicalMetalButton${selectionBadge ? " chemicalMetalButton--selected" : ""}`}
                    onClick={() => handleMetalClick(metal)}
                  >
                    <span>{index + 1}. {metal.name} ({metal.symbol})</span>
                    {selectionBadge && <strong>{selectionBadge}</strong>}
                  </button>
                );
              })}
            </div>

            <div className="chemicalSelectionHint">
              <strong>Status pilihan</strong>
              <p>{nextSelectionLabel}</p>
            </div>

            {sameElectrode && (
              <div className="chemicalWarning" role="alert">
                Jenis elektrod adalah sama. Tiada beza keupayaan dihasilkan.
              </div>
            )}
          </aside>
        </MobileControlDrawer>

        <section className="chemicalApparatusPanel" aria-label="Radas sel kimia">
          <div className="chemicalApparatusTop">
            <div>
              <h2>Radas Sel Kimia</h2>
              <p>
                {started
                  ? "Litar diaktifkan. Bandingkan bacaan ammeter dengan jarak pasangan logam."
                  : "Pilih dua elektrod dan elektrolit, kemudian tekan Mula."}
              </p>
            </div>
            <div className={`chemicalCircuitBadge chemicalCircuitBadge--${started ? "on" : "off"}`}>
              {started ? "Litar aktif" : "Litar belum aktif"}
            </div>
          </div>

          <div
            className={`chemicalApparatusFrame chemicalApparatusFrame--${bulbStrength}`}
            style={{
              "--electrode-one-color": electrodeOne?.electrodeColor || "#94a3b8",
              "--electrode-two-color": electrodeTwo?.electrodeColor || "#c76732",
              "--liquid-color": electrolyte ? electrolyte.color : "56, 189, 248",
            }}
          >
            <img
              src="/assets/sel kimia.png"
              alt="Rajah radas sel kimia tanpa bateri dengan mentol, suis, wayar, klip buaya, bikar dan dua elektrod logam"
              draggable="false"
            />

            {electrolyte && (
              <span className="chemicalLiquid" aria-hidden="true">
                <i />
              </span>
            )}

            <span className="chemicalBulbGlow" aria-hidden="true" />

            <div className="chemicalAmmeter" aria-label={`Bacaan ammeter ${current.toFixed(2)} ampere`}>
              <span>Ammeter</span>
              <strong>{current.toFixed(2)} A</strong>
            </div>

            <div className="chemicalCurrentBadge" aria-label={`Bacaan arus besar ${current.toFixed(2)} ampere`}>
              <span>Bacaan arus</span>
              <strong>{current.toFixed(2)} A</strong>
            </div>

            <span className="chemicalElectrodeOverlay chemicalElectrodeOverlay--one" aria-hidden="true" />
            <span className="chemicalElectrodeOverlay chemicalElectrodeOverlay--two" aria-hidden="true" />

            <div className="chemicalElectrodeTag chemicalElectrodeTag--one">
              <span>Elektrod 1</span>
              <strong>{electrodeOne ? electrodeOne.symbol : "-"}</strong>
            </div>
            <div className="chemicalElectrodeTag chemicalElectrodeTag--two">
              <span>Elektrod 2</span>
              <strong>{electrodeTwo ? electrodeTwo.symbol : "-"}</strong>
            </div>
          </div>

          <div className="chemicalActionBar">
            <button type="button" className="chemicalStartButton" onClick={startSimulation}>
              <span aria-hidden="true" />
              Mula
            </button>
            <button type="button" className="chemicalResetButton" onClick={resetSimulation}>
              <span aria-hidden="true" />
              Reset
            </button>
          </div>

          {startWarning && (
            <div className="chemicalWarning chemicalWarning--center" role="alert">
              {startWarning}
            </div>
          )}

          <div className="chemicalReadoutGrid">
            <article>
              <span>Elektrod 1</span>
              <strong>{getMetalLabel(electrodeOne)}</strong>
            </article>
            <article>
              <span>Elektrod 2</span>
              <strong>{getMetalLabel(electrodeTwo)}</strong>
            </article>
            <article>
              <span>Elektrolit</span>
              <strong>{electrolyte ? electrolyte.name : "-"}</strong>
            </article>
            <article>
              <span>Jarak siri</span>
              <strong>{hasPair ? distance : "-"}</strong>
            </article>
          </div>

          <section className="chemicalInferencePanel" aria-label="Inferens">
            <span>Inferens</span>
            <p>{inference}</p>
          </section>
        </section>

        <MobileControlDrawer title="Elektrolit" summary="Pilih larutan">
          <aside className="chemicalCellPanel chemicalElectrolytePanel">
            <div className="chemicalPanelHeader chemicalPanelHeader--blue">
              <span>Pilih Elektrolit</span>
              <strong>Nama penuh larutan</strong>
            </div>

            <div className="chemicalElectrolyteList">
              {electrolytes.map((item) => {
                const selected = electrolyte?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`chemicalElectrolyteButton${selected ? " chemicalElectrolyteButton--selected" : ""}`}
                    onClick={() => handleElectrolyteClick(item)}
                  >
                    <span
                      className="chemicalElectrolyteSwatch"
                      style={{ "--swatch-color": item.color }}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.formula}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="chemicalConceptNote">
              <strong>Nota</strong>
              <p>
                Semakin jauh kedudukan dua logam dalam siri keelektropositifan, semakin
                besar arus elektrik yang terhasil dalam sel kimia.
              </p>
            </div>

            <div className="chemicalSeriesStrip">
              <span>Mg</span>
              <span>Al</span>
              <span>Zn</span>
              <span>Fe</span>
              <span>Pb</span>
              <span>Cu</span>
              <span>Ag</span>
            </div>
          </aside>
        </MobileControlDrawer>
      </section>
    </main>
  );
}
