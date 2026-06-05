import { useMemo, useState } from "react";
import { ATOM_CHALLENGES } from "../../data/atomSimulator/CompoundDatabase";
import type { MatterAnalysis } from "../../utils/atomSimulator/ClassificationEngine";
import ChemicalFormula from "./ChemicalFormula";

type ChallengeSectionProps = {
  analysis: MatterAnalysis;
  onClearBoard: () => void;
};

export default function ChallengeSection({ analysis, onClearBoard }: ChallengeSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState("Bina model sasaran pada papan, kemudian semak jawapan.");
  const [celebrating, setCelebrating] = useState(false);
  const activeChallenge = ATOM_CHALLENGES[activeIndex];
  const score = completedIds.size * 10;
  const allComplete = completedIds.size === ATOM_CHALLENGES.length;
  const activeComplete = completedIds.has(activeChallenge.id);

  const targetPreview = useMemo(
    () => ATOM_CHALLENGES.map((challenge) => ({
      ...challenge,
      complete: completedIds.has(challenge.id),
    })),
    [completedIds],
  );

  const checkAnswer = () => {
    const isCorrect =
      !analysis.isEmpty &&
      !analysis.isMixture &&
      analysis.primaryFormula === activeChallenge.targetFormula &&
      analysis.category === activeChallenge.targetCategory;

    if (!isCorrect) {
      setFeedback(`Belum tepat. Sasaran: ${activeChallenge.targetFormula} sebagai ${activeChallenge.targetCategory}.`);
      setCelebrating(false);
      return;
    }

    setCompletedIds((current) => new Set(current).add(activeChallenge.id));
    setFeedback("Tahniah. +10 mata");
    setCelebrating(true);
    window.setTimeout(() => setCelebrating(false), 1200);
  };

  const goNext = () => {
    setActiveIndex((index) => Math.min(index + 1, ATOM_CHALLENGES.length - 1));
    setFeedback("Bina model sasaran pada papan, kemudian semak jawapan.");
    onClearBoard();
  };

  const restart = () => {
    setActiveIndex(0);
    setCompletedIds(new Set());
    setFeedback("Bina model sasaran pada papan, kemudian semak jawapan.");
    setCelebrating(false);
    onClearBoard();
  };

  return (
    <section className={`atomChallenge atomSimPanel${celebrating ? " atomChallenge--celebrate" : ""}`}>
      <div className="atomSectionHeader">
        <div>
          <span>Cabaran Interaktif</span>
          <h2>Bina formula sasaran</h2>
        </div>
        <strong>{score} mata</strong>
      </div>

      <div className="atomChallenge__main">
        <div className="atomChallenge__target">
          <span>Cabaran {activeIndex + 1}/{ATOM_CHALLENGES.length}</span>
          <h3>{activeChallenge.title}</h3>
          <strong>
            <ChemicalFormula value={activeChallenge.targetFormula} />
          </strong>
          <p>{activeChallenge.hint}</p>
        </div>

        <div className="atomChallenge__status">
          <span>Status papan</span>
          <strong>
            <ChemicalFormula value={analysis.formula} />
          </strong>
          <p>{feedback}</p>
          <div className="atomChallenge__actions">
            <button type="button" onClick={checkAnswer} disabled={allComplete}>
              Semak Jawapan
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!activeComplete || activeIndex === ATOM_CHALLENGES.length - 1}
            >
              Cabaran Seterusnya
            </button>
            {allComplete && (
              <button type="button" onClick={restart}>
                Cuba Semula
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="atomChallenge__track" aria-label="Senarai cabaran">
        {targetPreview.map((challenge, index) => (
          <button
            key={challenge.id}
            type="button"
            className={[
              "atomChallengeStep",
              index === activeIndex ? "atomChallengeStep--active" : "",
              challenge.complete ? "atomChallengeStep--done" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => setActiveIndex(index)}
          >
            <span className="atomChallengeStep__number">{index + 1}</span>
            <strong>
              <ChemicalFormula value={challenge.targetFormula} />
            </strong>
          </button>
        ))}
      </div>
    </section>
  );
}
