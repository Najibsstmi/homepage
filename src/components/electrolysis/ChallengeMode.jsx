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
  const total = circuitSolver + observationExpert + electrochemist;
  const level = total >= 27 ? "Saintis Muda" : total >= 17 ? "Penyiasat Aktif" : total >= 7 ? "Pembina Litar" : "Mula Misi";
  const scoreItems = [
    ["Circuit Solver", circuitSolver],
    ["Observation Expert", observationExpert],
    ["Electrochemist", electrochemist],
  ];

  return (
    <section className="scoreboardPanel" aria-label="Science Progress">
      <div className="scoreboardPanel__header">
        <span>Science Progress</span>
        <strong>{total}/30</strong>
      </div>
      <p className="scoreboardBadge">{level}</p>
      <div className="scoreGrid">
        {scoreItems.map(([label, score]) => (
          <div key={label} className="scoreItem" style={{ "--score": `${score * 10}%` }}>
            <div className="scoreItem__top">
              <span>{label}</span>
              <strong>{score}/10</strong>
            </div>
            <div className="scoreItem__bar" aria-hidden="true">
              <i />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
