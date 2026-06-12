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
  const resultRows = [
    ["pure", "Logam tulen"],
    ["alloy", "Aloi"],
  ];

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

  const getResultValue = (id) => {
    if (!results[id]) {
      return "Belum diuji";
    }

    if (measurementCorrect[id]) {
      return `${results[id].depth.toFixed(1)} mm`;
    }

    return "Perlu diukur";
  };

  const getResultNote = (id) => {
    if (!results[id]) {
      return "Jalankan eksperimen";
    }

    if (measurementCorrect[id]) {
      return id === "pure" ? "Lekukan lebih dalam" : "Lekukan lebih cetek";
    }

    return "Masukkan bacaan murid";
  };

  return (
    <section className="electroPanel alloyResultPanel">
      <h2>Ukur dan Rekod Lekukan</h2>

      {latestResult && (
        <div className="indentMeasureCard" id="alloy-measurement">
          <div className="indentMeasureCard__header">
            <span>Langkah wajib selepas jatuhan</span>
            <h3>Masukkan bacaan kedalaman lekukan</h3>
            <p className="indentMeasureCard__hint">
              Baca dari permukaan asal (0 mm) hingga ke dasar lekukan. Jawapan sebenar hanya dipaparkan selepas bacaan disemak.
            </p>
          </div>

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
                ? "Bacaan tepat"
                : showCorrectAnswer
                  ? `Cuba semak semula. Bacaan sebenar ialah ${expected.toFixed(1)} mm.`
                  : "Cuba baca skala pembaris semula"}
            </p>
          )}
        </div>
      )}

      <div className="alloyResultGrid">
        {resultRows.map(([id, label]) => (
          <div className="alloyResultCard" key={id}>
            <span>{label}</span>
            <strong>{getResultValue(id)}</strong>
            <small>{getResultNote(id)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
