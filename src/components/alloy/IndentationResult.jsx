import { useEffect, useState } from "react";

const isWithinTolerance = (value, expected) => Math.abs(value - expected) <= 0.2;

export default function IndentationResult({ results, latestResult, readings, measurementCorrect, onReadingChange }) {
  const active = latestResult?.materialId;
  const expected = latestResult?.depth || 0;
  const rawReading = active ? readings[active] || "" : "";
  const numericReading = Number(rawReading);
  const hasReading = rawReading !== "" && Number.isFinite(numericReading);
  const isCorrect = active && hasReading && isWithinTolerance(numericReading, expected);
  const [attempts, setAttempts] = useState({ pure: 0, alloy: 0 });
  const [checked, setChecked] = useState(false);
  const scaleMax = Math.max(7, Math.ceil(expected));
  const scaleHeight = 175;
  const surfaceTop = 34;
  const dentHeight = (expected / scaleMax) * scaleHeight;
  const guideTop = surfaceTop + dentHeight;
  const activeAttempts = active ? attempts[active] || 0 : 0;
  const showCorrectAnswer = checked && !isCorrect && activeAttempts >= 2;

  useEffect(() => {
    setChecked(false);
  }, [active, rawReading]);

  const checkReading = () => {
    if (!active || !hasReading) {
      return;
    }

    setChecked(true);
    if (!isCorrect) {
      setAttempts((current) => ({ ...current, [active]: (current[active] || 0) + 1 }));
    }
  };

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
                {Array.from({ length: scaleMax + 1 }, (_, index) => (
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
            <button className="indentCheckButton" type="button" onClick={checkReading} disabled={!hasReading}>
              Semak bacaan
            </button>
          </label>
          {checked && hasReading && (
            <p className={isCorrect ? "checkText checkText--ok" : "checkText checkText--warn"}>
              {isCorrect || measurementCorrect[active]
                ? "✓ Bacaan tepat"
                : showCorrectAnswer
                  ? `Cuba semak semula. Bacaan sebenar ialah ${expected.toFixed(1)} mm.`
                  : "Cuba baca skala pembaris semula"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
