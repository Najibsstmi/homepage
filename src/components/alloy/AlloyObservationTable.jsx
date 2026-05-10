import { alloyObservationRows } from "../../data/alloyQuestions";

export default function AlloyObservationTable({ answers, onChange, results }) {
  const isRowCorrect = (row) =>
    answers[row.id]?.depth === row.depthAnswer &&
    answers[row.id]?.hardness === row.hardnessAnswer;

  return (
    <section className="electroPanel electroAccordion alloyObservation">
      <div className="accordionHeader alloyStaticHeader">
        <span>Jadual Pemerhatian</span>
        <strong>Semak kendiri</strong>
      </div>
      <div className="accordionBody">
        <div className="electroTableWrap">
          <table>
            <thead>
              <tr>
                <th>Jenis bongkah</th>
                <th>Kedalaman lekukan</th>
                <th>Kekerasan</th>
              </tr>
            </thead>
            <tbody>
              {alloyObservationRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.label}</strong>
                    <br />
                    <small>{results[row.id] ? `${results[row.id].depth.toFixed(1)} mm` : "Belum diuji"}</small>
                  </td>
                  <td>
                    <select
                      value={answers[row.id]?.depth || ""}
                      onChange={(event) => onChange(row.id, "depth", event.target.value)}
                    >
                      <option value="">Pilih jawapan</option>
                      <option value="Dalam">Dalam</option>
                      <option value="Cetek">Cetek</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={answers[row.id]?.hardness || ""}
                      onChange={(event) => onChange(row.id, "hardness", event.target.value)}
                    >
                      <option value="">Pilih jawapan</option>
                      <option value="Kurang keras">Kurang keras</option>
                      <option value="Lebih keras">Lebih keras</option>
                    </select>
                    {(answers[row.id]?.depth || answers[row.id]?.hardness) && (
                      <p className={isRowCorrect(row) ? "checkText checkText--ok" : "checkText checkText--warn"}>
                        {isRowCorrect(row) ? "Pemerhatian tepat" : "Semak semula hubungan antara lekukan dan kekerasan."}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
