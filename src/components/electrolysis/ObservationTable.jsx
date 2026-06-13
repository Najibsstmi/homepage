import InferenceChecker from "./InferenceChecker";
import { observationRows } from "../../data/electrolysisQuestions";

export default function ObservationTable({
  open,
  onToggle,
  bulbAnswers,
  inferences,
  onBulbChange,
  onInferenceChange,
}) {
  return (
    <section className="electroPanel electroObservation electroAccordion">
      <button className="accordionHeader accordionHeader--observation" type="button" onClick={onToggle} aria-expanded={open}>
        <span className="accordionHeader__step" aria-hidden="true">1</span>
        <span className="accordionHeader__icon accordionHeader__icon--clipboard" aria-hidden="true">
          <i />
        </span>
        <span className="accordionHeader__label">
          <b>Jadual Pemerhatian</b>
          <small>Rekod apa yang anda lihat sepanjang eksperimen.</small>
          <em>{open ? "Sedang dibuka" : "Belum lengkap"}</em>
        </span>
        <span className="accordionHeader__arrow" aria-hidden="true" />
      </button>
      {open && (
        <div className="accordionBody electroTableWrap">
          <table>
            <thead>
              <tr>
                <th>Bahan</th>
                <th>Keadaan mentol</th>
                <th>Inferens</th>
              </tr>
            </thead>
            <tbody>
              {observationRows.map((row) => {
                const answer = bulbAnswers[row.id] || "";
                const answered = Boolean(answer);
                const bulbCorrect = answered && answer === row.expectedBulb;

                return (
                  <tr key={row.id}>
                    <td>{row.material}</td>
                    <td>
                      <select value={answer} onChange={(event) => onBulbChange(row.id, event.target.value)}>
                        <option value="">Pilih jawapan</option>
                        <option value="Menyala">Menyala</option>
                        <option value="Tidak menyala">Tidak menyala</option>
                      </select>
                      {answered && (
                        <p className={bulbCorrect ? "checkText checkText--ok" : "checkText checkText--bad"}>
                          {bulbCorrect ? "✓ Betul" : "✕ Cuba lagi"}
                        </p>
                      )}
                    </td>
                    <td>
                      <InferenceChecker
                        row={row}
                        value={inferences[row.id] || ""}
                        onChange={(value) => onInferenceChange(row.id, value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
