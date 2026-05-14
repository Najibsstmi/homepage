import { useMemo, useState } from "react";
import { getConcentrationGraphRuns, concentrationGraph, toConcentrationGraphPoint } from "./ReactionConcentrationGraphs";

function distancePercent(click, target) {
  const dx = Math.abs(click.x - target.x) / concentrationGraph.width;
  const dy = Math.abs(click.y - target.y) / concentrationGraph.height;
  return Math.max(dx, dy);
}

function getTargetPoint(run, mode) {
  const maxY = mode === "time" ? 80 : 0.06;
  return toConcentrationGraphPoint(run.concentration, mode === "time" ? run.time : run.inverseTime, maxY);
}

export default function ReactionConcentrationPlotChallenge({ concentrationRuns, onComplete }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("inverse");
  const [plotted, setPlotted] = useState([]);
  const [mistake, setMistake] = useState(null);
  const [feedback, setFeedback] = useState("Klik titik pada graf berdasarkan data jadual.");
  const runs = useMemo(() => getConcentrationGraphRuns(concentrationRuns), [concentrationRuns]);
  const complete = runs.length === 5 && plotted.length === runs.length;
  const maxY = mode === "time" ? 80 : 0.06;
  const yLabel = mode === "time" ? "Masa (s)" : "1/masa (s-1)";

  const resetPlot = (nextMode) => {
    setMode(nextMode);
    setPlotted([]);
    setMistake(null);
    setFeedback("Klik titik pada graf berdasarkan data jadual.");
  };

  const handlePlot = (event) => {
    if (runs.length < 5) {
      setFeedback("Lengkapkan semua lima bacaan kepekatan dahulu.");
      return;
    }

    if (complete) {
      return;
    }

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const click = {
      x: ((event.clientX - rect.left) / rect.width) * 600,
      y: ((event.clientY - rect.top) / rect.height) * 340,
    };
    const target = getTargetPoint(runs[plotted.length], mode);
    const accurate = distancePercent(click, target) <= 0.055;

    if (accurate) {
      const nextPlotted = [...plotted, runs[plotted.length]];
      setPlotted(nextPlotted);
      setMistake(null);
      setFeedback(nextPlotted.length === runs.length ? "Semua titik tepat. Graf berjaya diplot." : "Titik tepat.");
      if (nextPlotted.length === runs.length) {
        onComplete?.();
      }
      return;
    }

    setMistake(click);
    setFeedback("Semak semula bacaan jadual.");
  };

  return (
    <section className="electroPanel electroAccordion reactionPlotChallenge reactionConcentrationPlotChallenge">
      <button className="accordionHeader quizCard__toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span>Cabaran Plot Graf Sendiri</span>
        <strong>{open ? "Tutup" : "Buka"}</strong>
      </button>

      {open && (
        <div className="accordionBody reactionPlotBody">
          <label className="reactionPlotSelect">
            Pilih graf
            <select value={mode} onChange={(event) => resetPlot(event.target.value)}>
              <option value="inverse">Kepekatan melawan 1/masa</option>
              <option value="time">Kepekatan melawan masa</option>
            </select>
          </label>

          <div className="reactionPlotInstructions">
            <span>1</span>
            <p>Rujuk jadual dan klik titik mengikut turutan kepekatan 0.04, 0.08, 0.12, 0.16, 0.20 mol dm-3.</p>
          </div>
          <div className="reactionPlotInstructions">
            <span>2</span>
            <p>Titik hijau bermaksud tepat. Titik merah bermaksud bacaan perlu disemak semula.</p>
          </div>

          <svg className="reactionPlotSvg" viewBox="0 0 600 340" role="img" aria-label="Graf kosong untuk cabaran plot kepekatan" onClick={handlePlot}>
            <rect className="reactionGraphBg" x="0" y="0" width="600" height="340" rx="20" />
            {Array.from({ length: 6 }, (_, index) => (
              <line key={`h-${index}`} className="reactionGridLine" x1={concentrationGraph.x} x2="546" y1={concentrationGraph.y + index * (concentrationGraph.height / 5)} y2={concentrationGraph.y + index * (concentrationGraph.height / 5)} />
            ))}
            {Array.from({ length: 5 }, (_, index) => (
              <line key={`v-${index}`} className="reactionGridLine" x1={concentrationGraph.x + index * (concentrationGraph.width / 4)} x2={concentrationGraph.x + index * (concentrationGraph.width / 4)} y1={concentrationGraph.y} y2={concentrationGraph.y + concentrationGraph.height} />
            ))}
            <line className="reactionAxis" x1={concentrationGraph.x} y1={concentrationGraph.y + concentrationGraph.height} x2="552" y2={concentrationGraph.y + concentrationGraph.height} />
            <line className="reactionAxis" x1={concentrationGraph.x} y1={concentrationGraph.y - 4} x2={concentrationGraph.x} y2={concentrationGraph.y + concentrationGraph.height} />
            <text className="reactionAxisLabel" x="260" y="315">Kepekatan natrium tiosulfat (mol dm-3)</text>
            <text className="reactionAxisLabel" x="18" y="184" transform="rotate(-90 18 184)">{yLabel}</text>
            {[0.04, 0.08, 0.12, 0.16, 0.2].map((value) => (
              <text key={value} className="reactionTick" x={concentrationGraph.x + ((value - 0.04) / 0.16) * concentrationGraph.width} y="291">{value.toFixed(2)}</text>
            ))}
            {Array.from({ length: 5 }, (_, index) => {
              const value = (maxY / 4) * index;
              return (
                <text key={value} className="reactionTick reactionTick--y" x="32" y={concentrationGraph.y + concentrationGraph.height + 4 - (value / maxY) * concentrationGraph.height}>
                  {maxY < 1 ? value.toFixed(3) : Math.round(value)}
                </text>
              );
            })}
            {complete && (
              <polyline
                className="reactionGraphLine"
                points={plotted.map((run) => {
                  const point = getTargetPoint(run, mode);
                  return `${point.x},${point.y}`;
                }).join(" ")}
              />
            )}
            {plotted.map((run) => {
              const point = getTargetPoint(run, mode);
              return <circle key={run.id} className="reactionPlotPoint reactionPlotPoint--ok" cx={point.x} cy={point.y} r="7" />;
            })}
            {mistake && <circle className="reactionPlotPoint reactionPlotPoint--bad" cx={mistake.x} cy={mistake.y} r="7" />}
          </svg>

          <p className={feedback.includes("tepat") || feedback.includes("berjaya") ? "checkText checkText--ok" : "checkText checkText--warn"}>
            {feedback}
          </p>
        </div>
      )}
    </section>
  );
}
