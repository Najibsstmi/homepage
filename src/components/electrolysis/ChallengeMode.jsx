import { checkInferenceWithAI } from "../../data/electrolysisQuestions";

export default function ChallengeMode({
  solidReady,
  moltenReady,
  aqueousReady,
  bulbAnswers,
  inferences,
}) {
  const circuitSolver = solidReady && moltenReady && aqueousReady ? 10 : moltenReady || aqueousReady ? 7 : solidReady ? 4 : 0;
  const observationExpert =
    bulbAnswers.solid === "Tidak menyala" && bulbAnswers.molten === "Menyala" && bulbAnswers.aqueous === "Menyala"
      ? 10
      : 0;
  const electrochemist =
    checkInferenceWithAI(inferences.solid || "", "solid") &&
    checkInferenceWithAI(inferences.molten || "", "molten") &&
    checkInferenceWithAI(inferences.aqueous || "", "aqueous")
      ? 10
      : 0;

  return (
    <section className="scoreboardPanel">
      <div className="scoreboardPanel__header">
        <span>Scoreboard</span>
      </div>
      <div className="scoreGrid">
        <div style={{ "--score": `${circuitSolver * 10}%` }}>
          <span>Circuit Solver</span>
          <strong>{circuitSolver}/10</strong>
        </div>
        <div style={{ "--score": `${observationExpert * 10}%` }}>
          <span>Observation Expert</span>
          <strong>{observationExpert}/10</strong>
        </div>
        <div style={{ "--score": `${electrochemist * 10}%` }}>
          <span>Electrochemist</span>
          <strong>{electrochemist}/10</strong>
        </div>
      </div>
    </section>
  );
}
