export default function IndentationResult({ results, latestResult, readings, measurementCorrect, onReadingChange }) {
  const active = latestResult?.materialId;
  const expected = latestResult?.depth || 0;
  const rawReading = active ? readings[active] || "" : "";
  const numericReading = Number(rawReading);
  const hasReading = rawReading !== "";
  const isCorrect = active && hasReading && Math.abs(numericReading - expected) <= 0.5;
  const scaleMax = 6;
  const scaleHeight = 156;
  const surfaceTop = 34;
  const dentHeight = Math.min(Math.max((expected / scaleMax) * scaleHeight, 18), scaleHeight);
  const guideTop = surfaceTop + dentHeight;

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
          <p className="indentMeasureCard__hint">Baca dari permukaan asal (0 mm) hingga ke dasar lekukan.</p>
          <div className="indentMeasureCard__visual">
            <div className={`indentMeasureBlock indentMeasureBlock--${active}`}>
              <span className="indentSurfaceLine" style={{ top: `${surfaceTop}px` }} />
              <span className="indentSurfaceLabel">Permukaan asal (0 mm)</span>
              <span className="indentMeasureDent" style={{ top: `${surfaceTop}px`, height: `${dentHeight}px` }} />
              <span className="indentGuideLine" style={{ top: `${guideTop}px` }} />
            </div>
            <div className="indentRulerWrap">
              <span className="indentRulerUnit">mm</span>
              <div className="indentRuler" aria-label="Pembaris skala milimeter">
                {Array.from({ length: 7 }, (_, index) => (
                  <span key={index} style={{ top: `${(index / scaleMax) * 100}%` }}>
                    {index}
                  </span>
                ))}
              </div>
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
