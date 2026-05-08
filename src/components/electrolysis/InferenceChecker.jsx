import { useState } from "react";
import { checkInferenceWithAI } from "../../data/electrolysisQuestions";

export default function InferenceChecker({ row, value, onChange }) {
  const [checked, setChecked] = useState(false);
  const hasAnswer = value.trim().length > 0;
  const isCorrect = checked && hasAnswer && checkInferenceWithAI(value, row.expectedConcept);

  return (
    <div className="inferenceBox">
      <textarea
        value={value}
        onChange={(event) => {
          setChecked(false);
          onChange(event.target.value);
        }}
        placeholder="Taip inferens murid di sini..."
        rows={3}
      />
      <button type="button" onClick={() => setChecked(true)} disabled={!hasAnswer}>
        Semak jawapan
      </button>
      {checked && hasAnswer && (
        <p className={isCorrect ? "checkText checkText--ok" : "checkText checkText--warn"}>
          {isCorrect ? "✓ Inferens diterima" : "Jawapan hampir betul. Cuba masukkan idea tentang pergerakan ion."}
        </p>
      )}
    </div>
  );
}
