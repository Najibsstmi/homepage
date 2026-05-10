import { concentrationOptionIds, getConcentrationOption } from "../../data/reactionRateData";

function UnitHeader() {
  return (
    <>
      Kepekatan natrium tiosulfat (mol dm<sup>-3</sup>)
    </>
  );
}

function UnitValue({ label }) {
  return (
    <>
      {label.replace(" mol dm-3", "")} mol dm<sup>-3</sup>
    </>
  );
}

export default function ReactionConcentrationObservationTable({ concentrationRuns }) {
  return (
    <section className="electroPanel electroAccordion reactionObservation reactionConcentrationObservation">
      <div className="accordionHeader reactionStaticHeader">
        <span>Jadual Pemerhatian</span>
        <strong>Auto rekod</strong>
      </div>
      <div className="accordionBody">
        <div className="reactionTableMeta">
          <span>Faktor: Kepekatan</span>
          <span>Na<sub>2</sub>S<sub>2</sub>O<sub>3</sub> berubah</span>
          <span>H<sub>2</sub>SO<sub>4</sub> tetap</span>
        </div>
        <div className="electroTableWrap reactionTableWrap reactionConcentrationTableWrap">
          <table>
            <thead>
              <tr>
                <th><UnitHeader /></th>
                <th>Masa tanda X tidak kelihatan (s)</th>
                <th>1/masa (s<sup>-1</sup>)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {concentrationOptionIds.map((id) => {
                const option = getConcentrationOption(id);
                const run = concentrationRuns[id];
                return (
                  <tr key={id}>
                    <td><UnitValue label={option.label} /></td>
                    <td className={run ? "" : "reactionPendingCell"}>{run ? run.time.toFixed(1) : "-"}</td>
                    <td className={run ? "" : "reactionPendingCell"}>{run ? run.inverseTime.toFixed(4) : "-"}</td>
                    <td>
                      <span className={run ? "reactionStatusPill reactionStatusPill--done" : "reactionStatusPill"}>
                        {run ? "Selesai" : "Belum diuji"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="reactionTableHint">
          Masa direkod secara automatik apabila STOP ditekan pada saat tanda X tidak kelihatan.
        </p>
      </div>
    </section>
  );
}
