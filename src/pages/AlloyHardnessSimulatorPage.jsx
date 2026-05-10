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
  pure: { depth: "", hardness: "" },
  alloy: { depth: "", hardness: "" },
};

const isWithinTolerance = (value, expected) => Math.abs(value - expected) <= 0.2;

export default function AlloyHardnessSimulatorPage() {
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [dropping, setDropping] = useState(false);
  const [results, setResults] = useState({});
  const [latestResult, setLatestResult] = useState(null);
  const [showAtoms, setShowAtoms] = useState(false);
  const [tableAnswers, setTableAnswers] = useState(initialTableAnswers);
  const [readings, setReadings] = useState({ pure: "", alloy: "" });
  const [quizResult, setQuizResult] = useState({ score: 0, total: alloyQuiz.length });

  const completed = Boolean(results.pure && results.alloy);
  const measurementCorrect = {
    pure: results.pure && readings.pure !== "" && isWithinTolerance(Number(readings.pure), results.pure.depth),
    alloy: results.alloy && readings.alloy !== "" && isWithinTolerance(Number(readings.alloy), results.alloy.depth),
  };
  const learningMessage = useMemo(() => {
    if (!selectedMaterial) {
      return "Pilih jenis bongkah untuk memulakan eksperimen.";
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
  }, [selectedMaterial, dropping, latestResult]);

  const handleDropItem = (id) => {
    if (id === "pure" || id === "alloy") {
      setSelectedMaterial(id);
      setLatestResult(null);
    }
  };

  const releaseBall = () => {
    if (!selectedMaterial || dropping) {
      return;
    }

    setDropping(true);
    window.setTimeout(() => {
      const result = {
        materialId: selectedMaterial,
        depth: getIndentDepth(selectedMaterial),
      };
      setResults((current) => ({ ...current, [selectedMaterial]: result }));
      setLatestResult(result);
      setDropping(false);
    }, 760);
  };

  const resetExperiment = () => {
    setSelectedMaterial("");
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
          onSelectMaterial={setSelectedMaterial}
        />

        <div className="electroMain alloyMain">
          <AlloyApparatus
            selectedMaterial={selectedMaterial}
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

      <section className="electroPanel learningPanel">
        <h2>Apa yang berlaku?</h2>
        <p>{learningMessage}</p>
      </section>

      <AlloyObservationTable answers={tableAnswers} onChange={updateTableAnswer} results={results} />

      <QuizCard
        title="Science Check (Kuiz)"
        questions={alloyQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
