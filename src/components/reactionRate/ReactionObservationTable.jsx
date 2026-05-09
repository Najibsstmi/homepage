import { getSizeReactionPoint, reactionFactors, reactionTimes, sizeOptionIds, zincMass } from "../../data/reactionRateData";

export default function ReactionObservationTable({ completedRuns }) {
  const options = reactionFactors.size.options;

  return (
    <section className="electroPanel electroAccordion reactionObservation">
      <div className="accordionHeader reactionStaticHeader">
        <span>Jadual Pemerhatian</span>
        <strong>Grouped table</strong>
      </div>
      <div className="accordionBody">
        <div className="reactionTableMeta">
          <span>Faktor: Saiz bahan</span>
          <span>Jisim zink: {zincMass} g</span>
          <span>Asid hidroklorik: isipadu dan kepekatan sama</span>
        </div>
        <div className="electroTableWrap reactionTableWrap">
          <table>
            <thead>
              <tr>
                <th rowSpan="2">Masa (s)</th>
                <th colSpan={sizeOptionIds.length}>Isi padu gas H2 (cm3)</th>
              </tr>
              <tr>
                {sizeOptionIds.map((id) => {
                  const option = options.find((item) => item.id === id);
                  return <th key={id}>{option?.label}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {reactionTimes.map((time) => (
                <tr key={time}>
                  <td>{time}</td>
                  {sizeOptionIds.map((id) => {
                    const point = getSizeReactionPoint(id, time);
                    return (
                      <td key={`${id}-${time}`} className={completedRuns[id] ? "" : "reactionPendingCell"}>
                        {completedRuns[id] ? point.volume.toFixed(1) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="reactionTableHint">Isi padu akhir hampir sama kerana jumlah jisim Zn adalah tetap, iaitu {zincMass} g.</p>
      </div>
    </section>
  );
}
