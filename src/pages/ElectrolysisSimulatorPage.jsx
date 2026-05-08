import { useEffect, useMemo, useState } from "react";
import AqueousMode from "../components/electrolysis/AqueousMode";
import ChallengeMode from "../components/electrolysis/ChallengeMode";
import ComparisonTable from "../components/electrolysis/ComparisonTable";
import DraggableMaterial from "../components/electrolysis/DraggableMaterial";
import ElectrolysisApparatus from "../components/electrolysis/ElectrolysisApparatus";
import ObservationTable from "../components/electrolysis/ObservationTable";
import ReflectionQuestions from "../components/electrolysis/ReflectionQuestions";
import { observationRows } from "../data/electrolysisQuestions";

const initialBulbAnswers = { solid: "", molten: "", aqueous: "" };
const initialInferences = { solid: "", molten: "", aqueous: "" };
const initialAqueousItems = { water: false, powder: false, electrodes: false };

export default function ElectrolysisSimulatorPage() {
  const [mode, setMode] = useState("solid-molten");
  const [hasPowder, setHasPowder] = useState(false);
  const [hasBurner, setHasBurner] = useState(false);
  const [hasElectrodes, setHasElectrodes] = useState(false);
  const [burnerOn, setBurnerOn] = useState(false);
  const [solidCircuitOn, setSolidCircuitOn] = useState(false);
  const [bulbDelayedOn, setBulbDelayedOn] = useState(false);
  const [showScheme, setShowScheme] = useState(false);
  const [bulbAnswers, setBulbAnswers] = useState(initialBulbAnswers);
  const [inferences, setInferences] = useState(initialInferences);
  const [aqueousItems, setAqueousItems] = useState(initialAqueousItems);
  const [aqueousCircuitOn, setAqueousCircuitOn] = useState(false);
  const [showIons, setShowIons] = useState(true);

  const learningMessage = useMemo(() => {
    if (mode === "aqueous") {
      const aqueousComplete = aqueousItems.water && aqueousItems.powder && aqueousItems.electrodes;
      if (aqueousComplete && aqueousCircuitOn) {
        return "Ion Na⁺ bergerak ke katod manakala ion Cl⁻ bergerak ke anod. Larutan akueus mengkonduksikan elektrik dan mentol menyala.";
      }
      if (aqueousComplete) {
        return "Larutan akueus NaCl sudah terbentuk. Hidupkan suis litar untuk menyalakan mentol.";
      }
      return "Masukkan air suling, natrium klorida dan elektrod karbon ke dalam bikar. Bateri sudah tersedia dalam litar.";
    }

    if (!hasPowder) {
      return "Seret serbuk PbBr₂ ke dalam mangkuk pijar.";
    }

    if (!hasElectrodes) {
      return "Seret elektrod karbon ke dalam radas supaya litar lengkap.";
    }

    if (!burnerOn || !solidCircuitOn) {
      return "Mentol tidak menyala kerana penunu dan suis litar belum lengkap dihidupkan.";
    }

    return "PbBr₂ melebur. Ion menjadi bebas bergerak dan mentol menyala.";
  }, [mode, hasPowder, hasElectrodes, burnerOn, solidCircuitOn, aqueousCircuitOn, aqueousItems]);

  useEffect(() => {
    if (!(hasPowder && hasElectrodes && burnerOn && solidCircuitOn)) {
      setBulbDelayedOn(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setBulbDelayedOn(true), 1500);
    return () => window.clearTimeout(timer);
  }, [hasPowder, hasElectrodes, burnerOn, solidCircuitOn]);

  const handleDragStart = (event, id) => {
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDropMaterial = (id, target) => {
    if (target === "crucible" || target === "apparatus") {
      if (id === "powder") {
        setHasPowder(true);
      }
      if (id === "burner") {
        setHasBurner(true);
      }
      if (id === "electrodes") {
        setHasElectrodes(true);
      }
    }
  };

  const handleAqueousDrop = (id) => {
    const map = {
      water: "water",
      powder: "powder",
      electrodes: "electrodes",
    };
    if (map[id]) {
      setAqueousItems((current) => ({ ...current, [map[id]]: true }));
    }
  };

  const resetExperiment = () => {
    setMode("solid-molten");
    setHasPowder(false);
    setHasBurner(false);
    setHasElectrodes(false);
    setBurnerOn(false);
    setSolidCircuitOn(false);
    setBulbDelayedOn(false);
    setShowScheme(false);
    setBulbAnswers(initialBulbAnswers);
    setInferences(initialInferences);
    setAqueousItems(initialAqueousItems);
    setAqueousCircuitOn(false);
    setShowIons(true);
  };

  const aqueousReady = aqueousItems.water && aqueousItems.powder && aqueousItems.electrodes && aqueousCircuitOn;

  return (
    <main className="electrolysisPage">
      <section className="electroHero">
        <a className="linearSim__back" href="/simulator">← Semua Simulator</a>
        <span className="simulatorHero__kicker">Tingkatan 5 • Bab 6 Elektrokimia</span>
        <h1>Elektrolisis Sebatian Ion: Pepejal, Leburan dan Akueus</h1>
        <p>
          Kaji bagaimana keadaan pepejal, leburan dan akueus mempengaruhi kebolehan
          sebatian ion mengkonduksikan elektrik.
        </p>
      </section>

      <section className="electroModeBar" aria-label="Pilihan mode simulator">
        {[
          ["solid-molten", "Pepejal & Leburan"],
          ["aqueous", "Akueus"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={mode === id ? "active" : ""} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
        <button type="button" onClick={resetExperiment}>Reset eksperimen</button>
      </section>

      <section className="electroLayout">
        <aside className="electroPanel materialTray">
          <h2>Bahan</h2>
          {mode === "solid-molten" ? (
            <>
              <DraggableMaterial id="powder" title="Serbuk plumbum(II) bromida, PbBr₂" subtitle="Seret ke mangkuk pijar" placed={hasPowder} onDragStart={handleDragStart} />
              <DraggableMaterial id="electrodes" title="Elektrod karbon" subtitle="Seret ke dalam radas" placed={hasElectrodes} onDragStart={handleDragStart} />
              <DraggableMaterial id="burner" title="Penunu Bunsen" subtitle="Seret ke bawah mangkuk pijar" placed={hasBurner} onDragStart={handleDragStart} />
            </>
          ) : (
            <>
              <DraggableMaterial id="water" title="Air suling" subtitle="Seret ke dalam bikar" placed={aqueousItems.water} onDragStart={handleDragStart} />
              <DraggableMaterial id="powder" title="Natrium klorida, NaCl" subtitle="Seret ke dalam bikar" placed={aqueousItems.powder} onDragStart={handleDragStart} />
              <DraggableMaterial id="electrodes" title="Elektrod karbon" subtitle="Seret ke dalam larutan" placed={aqueousItems.electrodes} onDragStart={handleDragStart} />
            </>
          )}

          <div className="electroNote">
            <strong>Nota ringkas</strong>
            <p>Sebatian ion hanya boleh mengkonduksikan elektrik apabila ion-ionnya bebas bergerak, iaitu dalam keadaan leburan atau akueus.</p>
          </div>
        </aside>

        <div className="electroMain">
          {mode === "solid-molten" ? (
            <ElectrolysisApparatus
              hasPowder={hasPowder}
              hasBurner={hasBurner}
              hasElectrodes={hasElectrodes}
              burnerOn={burnerOn}
              circuitOn={solidCircuitOn}
              bulbOn={bulbDelayedOn}
              onDropMaterial={handleDropMaterial}
              onToggleBurner={() => hasPowder && hasElectrodes && setBurnerOn((value) => !value)}
              onToggleCircuit={() => hasPowder && hasElectrodes && setSolidCircuitOn((value) => !value)}
            />
          ) : (
            <AqueousMode
              aqueousItems={aqueousItems}
              circuitOn={aqueousCircuitOn}
              showIons={showIons}
              onDropMaterial={handleAqueousDrop}
              onToggleCircuit={() => setAqueousCircuitOn((value) => !value)}
              onToggleIons={setShowIons}
            />
          )}

          <section className="electroPanel learningPanel">
            <h2>Apa yang berlaku?</h2>
            <p>{learningMessage}</p>
          </section>
        </div>
      </section>

      <ObservationTable
        bulbAnswers={bulbAnswers}
        inferences={inferences}
        onBulbChange={(id, value) => setBulbAnswers((current) => ({ ...current, [id]: value }))}
        onInferenceChange={(id, value) => setInferences((current) => ({ ...current, [id]: value }))}
      />

      <section className="electroPanel schemePanel">
        <button type="button" onClick={() => setShowScheme((value) => !value)}>
          {showScheme ? "Sembunyikan skema jawapan" : "Pamerkan skema jawapan"}
        </button>
        {showScheme && (
          <div className="schemeList">
            {observationRows.map((row) => (
              <p key={row.id}>
                <strong>{row.material}:</strong> Mentol {row.expectedBulb.toLowerCase()}. {row.scheme}
              </p>
            ))}
          </div>
        )}
      </section>

      <ComparisonTable />
      <ReflectionQuestions />
      <ChallengeMode
        solidReady={hasPowder && hasElectrodes}
        moltenReady={hasPowder && hasElectrodes && burnerOn && solidCircuitOn}
        aqueousReady={aqueousReady}
        bulbAnswers={bulbAnswers}
        inferences={inferences}
      />
    </main>
  );
}
