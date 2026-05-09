import { useMemo, useState } from "react";
import AlloyApparatus from "../components/alloy/AlloyApparatus";
import AlloyObservationTable from "../components/alloy/AlloyObservationTable";
import AlloyProgress from "../components/alloy/AlloyProgress";
import AtomicView from "../components/alloy/AtomicView";
import IndentationResult from "../components/alloy/IndentationResult";
import MaterialTray from "../components/alloy/MaterialTray";
import QuizCard from "../components/quiz/QuizCard";
import { alloyMaterials, getIndentDepth } from "../data/alloyQuestions";
import { alloyQuiz } from "../data/simulatorQuizzes";

const initialTableAnswers = {
  pure: { depth: "", hardness: "", inference: "" },
  alloy: { depth: "", hardness: "", inference: "" },
};

export default function AlloyHardnessSimulatorPage() {
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [ballPlaced, setBallPlaced] = useState(false);
  const [dropHeight, setDropHeight] = useState("medium");
  const [dropping, setDropping] = useState(false);
  const [results, setResults] = useState({});
  const [latestResult, setLatestResult] = useState(null);
  const [showAtoms, setShowAtoms] = useState(false);
  const [tableAnswers, setTableAnswers] = useState(initialTableAnswers);
  const [readings, setReadings] = useState({ pure: "", alloy: "" });
  const [quizResult, setQuizResult] = useState({ score: 0, total: alloyQuiz.length });

  const completed = Boolean(results.pure && results.alloy);
  const measurementCorrect = {
    pure: results.pure && readings.pure !== "" && Math.abs(Number(readings.pure) - results.pure.depth) <= 0.5,
    alloy: results.alloy && readings.alloy !== "" && Math.abs(Number(readings.alloy) - results.alloy.depth) <= 0.5,
  };
  const learningMessage = useMemo(() => {
    if (!selectedMaterial) {
      return "Pilih jenis bongkah untuk memulakan eksperimen.";
    }
    if (!ballPlaced) {
      return "Letakkan bebola keluli di atas bongkah sebelum dilepaskan.";
    }
    if (dropping) {
      return "Bebola keluli dijatuhkan ke atas bongkah.";
    }
    if (latestResult?.materialId === "pure") {
      return "Lekukan pada logam tulen lebih dalam kerana lapisan atom mudah menggelongsor.";
    }
    if (latestResult?.materialId === "alloy") {
      return "Aloi lebih keras kerana susunan atom berlainan saiz menghalang penggelongsoran lapisan atom.";
    }
    return `${alloyMaterials[selectedMaterial].label} sudah dipilih. Tekan Lepaskan bebola untuk merekod pemerhatian.`;
  }, [selectedMaterial, ballPlaced, dropping, latestResult]);

  const handleDropItem = (id) => {
    if (id === "steel-ball") {
      setBallPlaced(true);
      return;
    }
    if (id === "pure" || id === "alloy") {
      setSelectedMaterial(id);
      setLatestResult(null);
    }
  };

  const releaseBall = () => {
    if (!selectedMaterial || !ballPlaced || dropping) {
      return;
    }

    setDropping(true);
    window.setTimeout(() => {
      const result = {
        materialId: selectedMaterial,
        depth: getIndentDepth(selectedMaterial, dropHeight),
      };
      setResults((current) => ({ ...current, [selectedMaterial]: result }));
      setLatestResult(result);
      setDropping(false);
      setBallPlaced(false);
    }, 760);
  };

  const resetExperiment = () => {
    setSelectedMaterial("");
    setBallPlaced(false);
    setDropHeight("medium");
    setDropping(false);
    setResults({});
    setLatestResult(null);
    setShowAtoms(false);
    setTableAnswers(initialTableAnswers);
    setReadings({ pure: "", alloy: "" });
    setQuizResult({ score: 0, total: alloyQuiz.length });
  };

  const updateTableAnswer = (row, field, value) => {
    setTableAnswers((current) => ({
      ...current,
      [row]: {
        ...current[row],
        [field]: value,
      },
    }));
  };

  return (
    <main className="electrolysisPage alloyPage">
      <section className="electroHero alloyHero">
        <a className="linearSim__back" href="/simulator">← Semua Simulator</a>
        <span className="simulatorHero__kicker">Tingkatan 4 • Bab 9 Kimia Industri</span>
        <h1>Eksperimen Mengkaji Kesan Jenis Bongkah terhadap Kedalaman Lekukan</h1>
        <p>
          Bandingkan kekerasan logam tulen dan aloi melalui kedalaman lekukan yang terbentuk
          selepas bebola keluli dijatuhkan ke atas bongkah.
        </p>
      </section>

      <section className="electroLayout alloyLayout">
        <MaterialTray
          selectedMaterial={selectedMaterial}
          ballPlaced={ballPlaced}
          dropHeight={dropHeight}
          onSelectMaterial={setSelectedMaterial}
          onPlaceBall={() => setBallPlaced(true)}
          onHeightChange={setDropHeight}
        />

        <div className="electroMain alloyMain">
          <AlloyApparatus
            selectedMaterial={selectedMaterial}
            ballPlaced={ballPlaced}
            dropHeight={dropHeight}
            dropping={dropping}
            latestResult={latestResult}
            completed={completed}
            onDropItem={handleDropItem}
            onRelease={releaseBall}
            onReset={resetExperiment}
          />
        </div>

        <aside className="electroProgressRail" aria-label="Progress pembelajaran aloi">
          <AlloyProgress
            results={results}
            measurementCorrect={measurementCorrect}
            quizScore={quizResult.score}
            quizTotal={quizResult.total}
          />
        </aside>
      </section>

      <section className="electroPanel learningPanel">
        <h2>Apa yang berlaku?</h2>
        <p>{learningMessage}</p>
      </section>

      <section className="alloyDataGrid">
        <IndentationResult
          results={results}
          latestResult={latestResult}
          readings={readings}
          measurementCorrect={measurementCorrect}
          onReadingChange={(id, value) => setReadings((current) => ({ ...current, [id]: value }))}
        />
        <AtomicView selectedMaterial={selectedMaterial || "pure"} show={showAtoms} onToggle={() => setShowAtoms((value) => !value)} />
      </section>

      <AlloyObservationTable answers={tableAnswers} onChange={updateTableAnswer} results={results} />
      <QuizCard
        title="Science Check"
        questions={alloyQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
