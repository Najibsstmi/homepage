import { useEffect, useMemo, useState } from "react";
import MobileControlDrawer from "../components/MobileControlDrawer";
import AqueousMode from "../components/electrolysis/AqueousMode";
import ChallengeMode from "../components/electrolysis/ChallengeMode";
import ComparisonTable from "../components/electrolysis/ComparisonTable";
import DraggableMaterial from "../components/electrolysis/DraggableMaterial";
import ElectrolysisApparatus from "../components/electrolysis/ElectrolysisApparatus";
import ObservationTable from "../components/electrolysis/ObservationTable";
import QuizCard from "../components/quiz/QuizCard";
import { observationRows } from "../data/electrolysisQuestions";
import { electrolysisQuiz } from "../data/simulatorQuizzes";

const initialBulbAnswers = { solid: "", molten: "", aqueous: "" };
const initialInferences = { solid: "", molten: "", aqueous: "" };
const initialAqueousItems = { water: false, powder: false, electrodes: false };

export default function ElectrolysisSimulatorPage({ reviewPanel }) {
  const [mode, setMode] = useState("solid-molten");
  const [hasPowder, setHasPowder] = useState(false);
  const [burnerOn, setBurnerOn] = useState(false);
  const [solidCircuitOn, setSolidCircuitOn] = useState(false);
  const [bulbDelayedOn, setBulbDelayedOn] = useState(false);
  const [showScheme, setShowScheme] = useState(false);
  const [showObservation, setShowObservation] = useState(false);
  const [bulbAnswers, setBulbAnswers] = useState(initialBulbAnswers);
  const [inferences, setInferences] = useState(initialInferences);
  const [aqueousItems, setAqueousItems] = useState(initialAqueousItems);
  const [aqueousCircuitOn, setAqueousCircuitOn] = useState(false);
  const [showIons, setShowIons] = useState(true);
  const [quizResult, setQuizResult] = useState({ score: 0, total: electrolysisQuiz.length });

  const learningMessage = useMemo(() => {
    if (mode === "aqueous") {
      const solutionReady = aqueousItems.water && aqueousItems.powder;
      if (solutionReady && aqueousCircuitOn) {
        return "Ion Na⁺ bergerak ke katod manakala ion Cl⁻ bergerak ke anod. Larutan akueus mengkonduksikan elektrik dan mentol menyala.";
      }
      if (solutionReady) {
        return "Larutan akueus NaCl sudah terbentuk. Hidupkan suis litar untuk menyalakan mentol.";
      }
      return "Masukkan air suling dan natrium klorida ke dalam bikar. Bateri sudah tersedia dalam litar.";
    }

    if (!hasPowder) {
      return "Seret serbuk PbBr₂ ke dalam mangkuk pijar.";
    }

    if (!burnerOn) {
      return "Hidupkan penunu Bunsen untuk meleburkan PbBr₂.";
    }

    if (!solidCircuitOn) {
      return "Leburan PbBr₂ sudah terbentuk. Hidupkan suis litar untuk menyalakan mentol.";
    }

    return "Mentol menyala kerana PbBr₂ telah melebur. Ion Pb²⁺ dan Br⁻ bebas bergerak lalu membawa cas elektrik melalui litar.";
  }, [mode, hasPowder, burnerOn, solidCircuitOn, aqueousCircuitOn, aqueousItems]);

  useEffect(() => {
    if (!(hasPowder && burnerOn && solidCircuitOn)) {
      setBulbDelayedOn(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setBulbDelayedOn(true), 1500);
    return () => window.clearTimeout(timer);
  }, [hasPowder, burnerOn, solidCircuitOn]);

  const handleDragStart = (event, id) => {
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDropMaterial = (id, target) => {
    if (target === "crucible" || target === "apparatus") {
      if (id === "powder") {
        setHasPowder(true);
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
    setBurnerOn(false);
    setSolidCircuitOn(false);
    setBulbDelayedOn(false);
    setShowScheme(false);
    setBulbAnswers(initialBulbAnswers);
    setInferences(initialInferences);
    setAqueousItems(initialAqueousItems);
    setAqueousCircuitOn(false);
    setShowIons(true);
    setQuizResult({ score: 0, total: electrolysisQuiz.length });
  };

  const aqueousReady = aqueousItems.water && aqueousItems.powder && aqueousCircuitOn;

  return (
    <main className="electrolysisPage">
      <section className="electroHero">
        <span className="simulatorHero__kicker">Tingkatan 5 • Bab 6 Elektrokimia</span>
        <h1>Elektrolisis Sebatian Ion: Pepejal, Leburan dan Akueus</h1>
        <p>
          Kaji bagaimana keadaan pepejal, leburan dan akueus mempengaruhi kebolehan
          sebatian ion mengkonduksikan elektrik.
        </p>
      </section>

      {reviewPanel}

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
        <MobileControlDrawer title="Bahan" summary="Seret bahan ke radas">
          <aside className="electroPanel materialTray">
          <h2>Bahan</h2>
          {mode === "solid-molten" ? (
            <>
              <DraggableMaterial id="powder" title="Serbuk Plumbum (II) bromida, PbBr₂" subtitle="Seret ke mangkuk pijar" placed={hasPowder} onDragStart={handleDragStart} />
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
        </MobileControlDrawer>

        <div className="electroMain">
          {mode === "solid-molten" ? (
            <ElectrolysisApparatus
              hasPowder={hasPowder}
              burnerOn={burnerOn}
              circuitOn={solidCircuitOn}
              bulbOn={bulbDelayedOn}
              onDropMaterial={handleDropMaterial}
              onToggleBurner={() => hasPowder && setBurnerOn((value) => !value)}
              onToggleCircuit={() => hasPowder && setSolidCircuitOn((value) => !value)}
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
        </div>

      </section>

      <details className="electroProgressFloat">
        <summary>
          <span>Science Progress</span>
          <strong>Lihat</strong>
        </summary>
        <ChallengeMode
          solidReady={hasPowder}
          moltenReady={hasPowder && burnerOn && solidCircuitOn}
          aqueousReady={aqueousReady}
          bulbAnswers={bulbAnswers}
          inferences={inferences}
          quizScore={quizResult.score}
          quizTotal={quizResult.total}
        />
      </details>

      <section className="electroPanel learningPanel">
        <h2>Apa yang berlaku?</h2>
        <p>{learningMessage}</p>
      </section>

      <ObservationTable
        open={showObservation}
        onToggle={() => setShowObservation((value) => !value)}
        bulbAnswers={bulbAnswers}
        inferences={inferences}
        onBulbChange={(id, value) => setBulbAnswers((current) => ({ ...current, [id]: value }))}
        onInferenceChange={(id, value) => setInferences((current) => ({ ...current, [id]: value }))}
      />

      <section className="electroPanel schemePanel electroAccordion">
        <button className="accordionHeader" type="button" onClick={() => setShowScheme((value) => !value)}>
          <span>Skema Jawapan</span>
          <strong>{showScheme ? "Sembunyikan" : "Pamerkan"}</strong>
        </button>
        {showScheme && (
          <div className="accordionBody">
            <div className="schemeList">
              {observationRows.map((row) => (
                <p key={row.id}>
                  <strong>{row.material}:</strong> Mentol {row.expectedBulb.toLowerCase()}. {row.scheme}
                </p>
              ))}
            </div>
            <ComparisonTable embedded />
          </div>
        )}
      </section>

      <QuizCard
        title="Science Check (Kuiz)"
        questions={electrolysisQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
