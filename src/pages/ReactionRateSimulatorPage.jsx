import { useEffect, useMemo, useRef, useState } from "react";
import QuizCard from "../components/quiz/QuizCard";
import ReactionConcentrationGraphs from "../components/reactionRate/ReactionConcentrationGraphs";
import ReactionConcentrationObservationTable from "../components/reactionRate/ReactionConcentrationObservationTable";
import ReactionConcentrationPlotChallenge from "../components/reactionRate/ReactionConcentrationPlotChallenge";
import ReactionFactorPanel from "../components/reactionRate/ReactionFactorPanel";
import ReactionGraph from "../components/reactionRate/ReactionGraph";
import ReactionObservationTable from "../components/reactionRate/ReactionObservationTable";
import ReactionPlotChallenge from "../components/reactionRate/ReactionPlotChallenge";
import ReactionProgress from "../components/reactionRate/ReactionProgress";
import ReactionRateApparatus from "../components/reactionRate/ReactionRateApparatus";
import {
  concentrationOptionIds,
  concentrationSpeedMultiplier,
  factorOrder,
  getConcentrationOption,
  getInverseTime,
  getSizeReactionPoints,
  reactionFactors,
  sizeOptionIds,
} from "../data/reactionRateData";
import { reactionRateQuiz } from "../data/simulatorQuizzes";

const initialOptions = factorOrder.reduce((options, factorId) => {
  options[factorId] = reactionFactors[factorId].options[0].id;
  return options;
}, {});

export default function ReactionRateSimulatorPage() {
  const [activeFactor, setActiveFactor] = useState("concentration");
  const [selectedOptions, setSelectedOptions] = useState(initialOptions);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeExperiment, setActiveExperiment] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [activeConcentrationRun, setActiveConcentrationRun] = useState(null);
  const [completedRuns, setCompletedRuns] = useState({});
  const [concentrationRuns, setConcentrationRuns] = useState({});
  const [concentrationFeedback, setConcentrationFeedback] = useState("Pilih kepekatan dan tekan Mula tindak balas.");
  const [started, setStarted] = useState(false);
  const [plotComplete, setPlotComplete] = useState(false);
  const [concentrationPlotComplete, setConcentrationPlotComplete] = useState(false);
  const [quizResult, setQuizResult] = useState({ score: 0, total: reactionRateQuiz.length });
  const concentrationStartedAt = useRef(0);

  const factor = reactionFactors[activeFactor];
  const selectedOptionId = selectedOptions[activeFactor] || factor.options[0].id;
  const option = factor.options.find((item) => item.id === selectedOptionId) || factor.options[0];
  const activePoints = activeRun?.optionId === selectedOptionId ? activeRun.points : [];
  const completedPoints = completedRuns[selectedOptionId] || [];
  const latestPoint = activePoints[activePoints.length - 1] || completedPoints[completedPoints.length - 1] || { time: 0, volume: 0 };
  const completedCount = sizeOptionIds.filter((id) => completedRuns[id]).length;
  const allSizeRunsComplete = completedCount === sizeOptionIds.length;
  const concentrationCompletedCount = concentrationOptionIds.filter((id) => concentrationRuns[id]).length;
  const allConcentrationRunsComplete = concentrationCompletedCount === concentrationOptionIds.length;
  const isConcentration = activeFactor === "concentration";
  const graphComplete = isConcentration ? allConcentrationRunsComplete || concentrationPlotComplete : allSizeRunsComplete || plotComplete;
  const progressCompletedCount = isConcentration ? concentrationCompletedCount : completedCount;
  const progressAllRunsComplete = isConcentration ? allConcentrationRunsComplete : allSizeRunsComplete;
  const progressTotalRuns = isConcentration ? concentrationOptionIds.length : sizeOptionIds.length;

  useEffect(() => {
    if (!running || activeExperiment !== "size" || !activeRun) {
      return undefined;
    }

    const fullDataset = getSizeReactionPoints(activeRun.optionId);
    const timer = window.setInterval(() => {
      setActiveRun((current) => {
        if (!current) {
          return current;
        }

        const nextIndex = Math.min(current.index + 1, fullDataset.length - 1);
        const nextPoints = fullDataset.slice(0, nextIndex + 1);
        const finished = nextIndex >= fullDataset.length - 1;

        setElapsed(fullDataset[nextIndex].time);

        if (finished) {
          window.clearInterval(timer);
          setRunning(false);
          setActiveExperiment(null);
          setCompletedRuns((runs) => ({ ...runs, [current.optionId]: fullDataset }));
        }

        return {
          optionId: current.optionId,
          index: nextIndex,
          points: nextPoints,
        };
      });
    }, 520);

    return () => window.clearInterval(timer);
  }, [running, activeExperiment, activeRun?.optionId]);

  useEffect(() => {
    if (!running || activeExperiment !== "concentration" || !activeConcentrationRun) {
      return undefined;
    }

    concentrationStartedAt.current = window.performance.now();
    const timer = window.setInterval(() => {
      const seconds = ((window.performance.now() - concentrationStartedAt.current) / 1000) * concentrationSpeedMultiplier;
      setElapsed(Number(seconds.toFixed(1)));
    }, 80);

    return () => window.clearInterval(timer);
  }, [running, activeExperiment, activeConcentrationRun?.optionId]);

  const activeProgress = useMemo(() => {
    if (!activePoints.length) {
      return completedRuns[selectedOptionId] ? 1 : 0;
    }

    return Math.min(1, activePoints[activePoints.length - 1].time / 60);
  }, [activePoints, completedRuns, selectedOptionId]);

  const handleFactorChange = (id) => {
    if (running) {
      return;
    }

    setActiveFactor(id);
    setElapsed(0);
    setActiveRun(null);
    setActiveConcentrationRun(null);
  };

  const handleOptionChange = (factorId, optionId) => {
    setSelectedOptions((current) => ({ ...current, [factorId]: optionId }));
    setElapsed(0);
    setActiveRun(null);
    setActiveConcentrationRun(null);
    if (factorId === "concentration") {
      setConcentrationFeedback("Kepekatan dipilih. Tekan Mula tindak balas apabila bersedia.");
    }
  };

  const startExperiment = () => {
    if (running) {
      return;
    }

    if (activeFactor === "concentration") {
      setStarted(true);
      setRunning(true);
      setActiveExperiment("concentration");
      setElapsed(0);
      setActiveRun(null);
      setActiveConcentrationRun({ optionId: selectedOptionId });
      setConcentrationFeedback("Tindak balas bermula. Perhatikan tanda X dari pandangan atas.");
      return;
    }

    const dataset = getSizeReactionPoints(selectedOptionId);
    setStarted(true);
    setRunning(true);
    setActiveExperiment("size");
    setElapsed(0);
    setActiveRun({ optionId: selectedOptionId, index: 0, points: [dataset[0]] });
  };

  const stopConcentrationExperiment = () => {
    if (!running || activeExperiment !== "concentration" || !activeConcentrationRun) {
      return;
    }

    const concentrationOption = getConcentrationOption(activeConcentrationRun.optionId);
    const stoppedAt = Number(elapsed.toFixed(1));

    if (stoppedAt < concentrationOption.targetTime * 0.9) {
      setConcentrationFeedback("Tanda X masih kelihatan. Cuba perhatikan semula.");
      return;
    }

    const isLate = stoppedAt > concentrationOption.targetTime * 1.35;
    setRunning(false);
    setActiveExperiment(null);
    setActiveConcentrationRun(null);
    setConcentrationRuns((runs) => ({
      ...runs,
      [concentrationOption.id]: {
        concentration: concentrationOption.concentration,
        time: stoppedAt,
        inverseTime: getInverseTime(stoppedAt),
        status: "Selesai",
        timing: isLate ? "late" : "accurate",
      },
    }));
    setConcentrationFeedback(isLate ? "Bacaan lewat sedikit. Cuba ulang untuk lebih tepat." : "Bacaan masa direkodkan.");
  };

  const resetExperiment = () => {
    setRunning(false);
    setElapsed(0);
    setActiveExperiment(null);
    setActiveRun(null);
    setActiveConcentrationRun(null);
    setCompletedRuns({});
    setConcentrationRuns({});
    setConcentrationFeedback("Pilih kepekatan dan tekan Mula tindak balas.");
    setPlotComplete(false);
    setConcentrationPlotComplete(false);
  };

  return (
    <main className="electrolysisPage reactionRatePage">
      <section className="electroHero reactionHero">
        <a className="linearSim__back" href="/simulator">&larr; Semua Simulator</a>
        <span className="simulatorHero__kicker">Sains Tingkatan 5 &bull; Bab 4 Kadar Tindak Balas</span>
        <h1>Makmal Kadar Tindak Balas</h1>
        <p>
          {isConcentration
            ? "Faktor kepekatan: lihat tanda X dari atas kelalang, tekan STOP apabila X tidak kelihatan."
            : "Jalankan eksperimen ketulan dan serbuk zink, bandingkan isi padu gas H2 melawan masa, kemudian cabar diri dengan plot graf sendiri."}
        </p>
      </section>

      <section className="reactionControlDeck">
        <ReactionFactorPanel
          activeFactor={activeFactor}
          selectedOptions={selectedOptions}
          completedRuns={completedRuns}
          concentrationRuns={concentrationRuns}
          running={running}
          onFactorChange={handleFactorChange}
          onOptionChange={handleOptionChange}
        />
      </section>

      <section className="reactionWorkspace">
        <div className="electroMain reactionMain">
          <ReactionRateApparatus
            factor={factor}
            option={option}
            running={running}
            activeExperiment={activeExperiment}
            elapsed={elapsed}
            volume={latestPoint.volume}
            progress={activeProgress}
            completed={Boolean(completedRuns[selectedOptionId])}
            concentrationRuns={concentrationRuns}
            concentrationFeedback={concentrationFeedback}
            activeConcentrationRun={activeConcentrationRun}
            canRun={activeFactor === "size" || activeFactor === "concentration"}
            onStart={startExperiment}
            onStop={stopConcentrationExperiment}
            onReset={resetExperiment}
          />
        </div>

        <aside className="electroProgressRail" aria-label="Progress pembelajaran kadar tindak balas">
          <ReactionProgress
            started={started}
            completedCount={progressCompletedCount}
            totalRuns={progressTotalRuns}
            allRunsComplete={progressAllRunsComplete}
            graphComplete={graphComplete}
            quizScore={quizResult.score}
            quizTotal={quizResult.total}
          />
        </aside>
      </section>

      <section className="reactionDataGrid">
        {isConcentration ? (
          <>
            <ReactionConcentrationObservationTable concentrationRuns={concentrationRuns} />
            <ReactionConcentrationGraphs concentrationRuns={concentrationRuns} />
          </>
        ) : (
          <>
            <ReactionObservationTable completedRuns={completedRuns} />
            <ReactionGraph completedRuns={completedRuns} activeRun={activeRun} />
          </>
        )}
      </section>

      {isConcentration ? (
        <ReactionConcentrationPlotChallenge
          concentrationRuns={concentrationRuns}
          onComplete={() => setConcentrationPlotComplete(true)}
        />
      ) : (
        <ReactionPlotChallenge completedRuns={completedRuns} onComplete={() => setPlotComplete(true)} />
      )}

      <QuizCard
        title="Science Check (Kuiz)"
        questions={reactionRateQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
