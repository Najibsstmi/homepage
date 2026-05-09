import { useEffect, useMemo, useState } from "react";
import QuizCard from "../components/quiz/QuizCard";
import ReactionFactorPanel from "../components/reactionRate/ReactionFactorPanel";
import ReactionGraph from "../components/reactionRate/ReactionGraph";
import ReactionObservationTable from "../components/reactionRate/ReactionObservationTable";
import ReactionPlotChallenge from "../components/reactionRate/ReactionPlotChallenge";
import ReactionProgress from "../components/reactionRate/ReactionProgress";
import ReactionRateApparatus from "../components/reactionRate/ReactionRateApparatus";
import { factorOrder, getSizeReactionPoints, reactionFactors, sizeOptionIds } from "../data/reactionRateData";
import { reactionRateQuiz } from "../data/simulatorQuizzes";

const initialOptions = factorOrder.reduce((options, factorId) => {
  options[factorId] = reactionFactors[factorId].options[0].id;
  return options;
}, {});

export default function ReactionRateSimulatorPage() {
  const [activeFactor, setActiveFactor] = useState("size");
  const [selectedOptions, setSelectedOptions] = useState(initialOptions);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeRun, setActiveRun] = useState(null);
  const [completedRuns, setCompletedRuns] = useState({});
  const [started, setStarted] = useState(false);
  const [plotComplete, setPlotComplete] = useState(false);
  const [quizResult, setQuizResult] = useState({ score: 0, total: reactionRateQuiz.length });

  const factor = reactionFactors[activeFactor];
  const selectedOptionId = selectedOptions[activeFactor] || factor.options[0].id;
  const option = factor.options.find((item) => item.id === selectedOptionId) || factor.options[0];
  const activePoints = activeRun?.optionId === selectedOptionId ? activeRun.points : [];
  const completedPoints = completedRuns[selectedOptionId] || [];
  const latestPoint = activePoints[activePoints.length - 1] || completedPoints[completedPoints.length - 1] || { time: 0, volume: 0 };
  const completedCount = sizeOptionIds.filter((id) => completedRuns[id]).length;
  const allSizeRunsComplete = completedCount === sizeOptionIds.length;
  const graphComplete = allSizeRunsComplete || plotComplete;

  useEffect(() => {
    if (!running || !activeRun) {
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
  }, [running, activeRun?.optionId]);

  const activeProgress = useMemo(() => {
    if (!activePoints.length) {
      return completedRuns[selectedOptionId] ? 1 : 0;
    }

    return Math.min(1, activePoints[activePoints.length - 1].time / 60);
  }, [activePoints, completedRuns, selectedOptionId]);

  const handleFactorChange = (id) => {
    setActiveFactor(id);
  };

  const handleOptionChange = (factorId, optionId) => {
    setSelectedOptions((current) => ({ ...current, [factorId]: optionId }));
    setElapsed(0);
    setActiveRun(null);
  };

  const startExperiment = () => {
    const dataset = getSizeReactionPoints(selectedOptionId);
    setStarted(true);
    setRunning(true);
    setElapsed(0);
    setActiveRun({ optionId: selectedOptionId, index: 0, points: [dataset[0]] });
  };

  const resetExperiment = () => {
    setRunning(false);
    setElapsed(0);
    setActiveRun(null);
    setCompletedRuns({});
    setPlotComplete(false);
  };

  return (
    <main className="electrolysisPage reactionRatePage">
      <section className="electroHero reactionHero">
        <a className="linearSim__back" href="/simulator">&larr; Semua Simulator</a>
        <span className="simulatorHero__kicker">Sains Tingkatan 5 &bull; Bab 4 Kadar Tindak Balas</span>
        <h1>Makmal Kadar Tindak Balas</h1>
        <p>
          Jalankan eksperimen ketulan dan serbuk zink, bandingkan isi padu gas H2
          melawan masa, kemudian cabar diri dengan plot graf sendiri.
        </p>
      </section>

      <section className="reactionControlDeck">
        <ReactionFactorPanel
          activeFactor={activeFactor}
          selectedOptions={selectedOptions}
          completedRuns={completedRuns}
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
            elapsed={elapsed}
            volume={latestPoint.volume}
            progress={activeProgress}
            completed={Boolean(completedRuns[selectedOptionId])}
            canRun={activeFactor === "size"}
            onStart={startExperiment}
            onReset={resetExperiment}
          />
        </div>

        <aside className="electroProgressRail" aria-label="Progress pembelajaran kadar tindak balas">
          <ReactionProgress
            started={started}
            completedCount={completedCount}
            allSizeRunsComplete={allSizeRunsComplete}
            graphComplete={graphComplete}
            quizScore={quizResult.score}
            quizTotal={quizResult.total}
          />
        </aside>
      </section>

      <section className="reactionDataGrid">
        <ReactionObservationTable completedRuns={completedRuns} />
        <ReactionGraph completedRuns={completedRuns} activeRun={activeRun} />
      </section>

      <ReactionPlotChallenge completedRuns={completedRuns} onComplete={() => setPlotComplete(true)} />

      <QuizCard
        title="Science Check (Kuiz)"
        questions={reactionRateQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
