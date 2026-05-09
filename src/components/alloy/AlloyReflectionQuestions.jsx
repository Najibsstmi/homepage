import { checkAlloyReflection } from "../../data/alloyQuestions";

const questions = [
  ["deeper", "Bongkah manakah menghasilkan lekukan lebih dalam?"],
  ["harder", "Bongkah manakah lebih keras?"],
  ["atomic", "Mengapakah aloi lebih keras berbanding logam tulen?"],
  ["relationship", "Apakah hubungan antara kedalaman lekukan dengan kekerasan bahan?"],
];

export default function AlloyReflectionQuestions({ answers, onChange }) {
  return (
    <section className="electroPanel reflectionPanel alloyReflection">
      <h2>Soalan Refleksi</h2>
      <div className="reflectionList">
        {questions.map(([id, question]) => {
          const value = answers[id] || "";
          const checked = value.trim().length > 0;
          const correct = checked && checkAlloyReflection(value, id);
          return (
            <label key={id}>
              <span>{question}</span>
              <input
                value={value}
                onChange={(event) => onChange(id, event.target.value)}
                placeholder="Jawapan ringkas..."
              />
              {checked && (
                <small className={correct ? "checkText checkText--ok" : "checkText checkText--warn"}>
                  {correct ? "✓ Idea diterima" : "Cuba masukkan kata kunci utama daripada eksperimen."}
                </small>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
