import { useState } from "react";
import { reflectionQuestions } from "../../data/electrolysisQuestions";

export default function ReflectionQuestions() {
  const [answers, setAnswers] = useState({});

  return (
    <section className="electroPanel reflectionPanel">
      <h2>Soalan Refleksi</h2>
      <div className="reflectionList">
        {reflectionQuestions.map((item) => {
          const answer = (answers[item.id] || "").toLowerCase();
          const correct = item.keywords.every((keyword) => answer.includes(keyword));

          return (
            <label key={item.id}>
              <span>{item.question}</span>
              <input
                value={answers[item.id] || ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder="Jawapan ringkas..."
              />
              {answer && (
                <small className={correct ? "checkText checkText--ok" : "checkText checkText--warn"}>
                  {correct ? "✓ Jawapan diterima" : item.hint}
                </small>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
