export default function ReactionTemperatureObservationTable({ temperatureRuns }) {
  const runs = Array.isArray(temperatureRuns) ? temperatureRuns : [];

  return (
    <section className="electroPanel electroAccordion reactionObservation reactionTemperatureObservation">
      <div className="accordionHeader reactionStaticHeader">
        <span>Jadual Keputusan</span>
        <strong>Auto rekod</strong>
      </div>
      <div className="accordionBody">
        <div className="reactionTableMeta">
          <span>Faktor: Suhu</span>
          <span>Larutan natrium tiosulfat digunakan</span>
          <span>Asid sulfurik tetap</span>
        </div>
        <div className="electroTableWrap reactionTableWrap reactionTemperatureTableWrap">
          <table>
            <thead>
              <tr>
                <th>Suhu (°C)</th>
                <th>Masa tanda X hilang (s)</th>
                <th>Kadar tindak balas (1/masa)</th>
              </tr>
            </thead>
            <tbody>
              {runs.length ? (
                runs.map((run, index) => (
                  <tr key={run.id || `${run.temperature}-${index}`}>
                    <td>{run.temperature}</td>
                    <td>{run.time.toFixed(1)}</td>
                    <td>{run.inverseTime.toFixed(4)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="reactionPendingCell" colSpan="3">Belum ada bacaan direkodkan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="reactionTableHint">
          Masa direkod apabila STOP ditekan pada saat tanda X tidak kelihatan.
        </p>
      </div>
    </section>
  );
}
