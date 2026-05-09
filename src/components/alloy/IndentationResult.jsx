export default function IndentationResult({ results, latestResult, readings, measurementCorrect, onReadingChange }) {
  const active = latestResult?.materialId;
  const expected = latestResult?.depth || 0;
  const rawReading = active ? readings[active] || "" : "";
  const numericReading = Number(rawReading);
  const hasReading = rawReading !== "";
  const isCorrect = active && hasReading && Math.abs(numericReading - expected) <= 0.5;
  const dentHeight = Math.min(Math.max(expected * 14, 24), 96);

  return (
    <section className="electroPanel alloyResultPanel">
      <h2>Keputusan Lekukan</h2>
      <div className="alloyResultGrid">
        {[
          ["pure", "Logam tulen"],
          ["alloy", "Aloi"],
        ].map(([id, label]) => (
          <div className="alloyResultCard" key={id}>
            <span>{label}</span>
            <strong>{results[id] ? `${results[id].depth.toFixed(1)} mm` : "Belum diuji"}</strong>
            <small>{results[id] ? (id === "pure" ? "Lekukan lebih dalam" : "Lekukan lebih cetek") : "Jalankan eksperimen"}</small>
          </div>
        ))}
      </div>

      {latestResult && (
        <div className="indentMeasureCard">
          <h3>Ukur Kedalaman Lekukan</h3>
          <div className="indentMeasureCard__visual">
            <div className={`indentMeasureBlock indentMeasureBlock--${active}`}>
              <span className="indentMeasureDent" style={{ height: `${dentHeight}px` }} />
            </div>
            <div className="indentRuler" aria-label="Pembaris skala milimeter">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={index}>{index}</span>
              ))}
            </div>
          </div>
          <label>
            Bacaan kedalaman lekukan
            <div className="indentMeasureCard__input">
              <input
                type="number"
                step="0.1"
                value={rawReading}
                onChange={(event) => onReadingChange(active, event.target.value)}
                placeholder="Contoh: 2.5"
              />
              <span>mm</span>
            </div>
          </label>
          {hasReading && (
            <p className={isCorrect ? "checkText checkText--ok" : "checkText checkText--warn"}>
              {isCorrect || measurementCorrect[active] ? "✓ Bacaan tepat" : "Cuba baca skala pembaris semula"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
