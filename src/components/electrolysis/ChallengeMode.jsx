import { checkInferenceWithAI } from "../../data/electrolysisQuestions";

export default function ChallengeMode({
  solidReady,
  moltenReady,
  aqueousReady,
  bulbAnswers,
  inferences,
}) {
  const setupScore = solidReady && moltenReady && aqueousReady ? 30 : moltenReady || aqueousReady ? 20 : solidReady ? 10 : 0;
  const bulbScore =
    bulbAnswers.solid === "Tidak menyala" && bulbAnswers.molten === "Menyala" && bulbAnswers.aqueous === "Menyala"
      ? 30
      : 0;
  const inferenceScore =
    checkInferenceWithAI(inferences.solid || "", "solid") &&
    checkInferenceWithAI(inferences.molten || "", "molten") &&
    checkInferenceWithAI(inferences.aqueous || "", "aqueous")
      ? 40
      : 0;
  const total = setupScore + bulbScore + inferenceScore;

  return (
    <section className="electroPanel challengePanel">
      <h2>Challenge Mode</h2>
      <p>Misi: Lengkapkan eksperimen elektrolisis sehingga mentol menyala dan jadual pemerhatian betul.</p>
      <div className="scoreGrid">
        <div>
          <span>Susun radas betul</span>
          <strong>{setupScore}/30</strong>
        </div>
        <div>
          <span>Keadaan mentol betul</span>
          <strong>{bulbScore}/30</strong>
        </div>
        <div>
          <span>Inferens betul</span>
          <strong>{inferenceScore}/40</strong>
        </div>
      </div>
      <strong className="totalScore">Skor: {total}/100</strong>
    </section>
  );
}
