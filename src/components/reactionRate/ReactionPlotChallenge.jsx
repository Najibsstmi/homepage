import { useState } from "react";
import { getSizeReactionPoints, reactionFactors, reactionTimes, sizeOptionIds } from "../../data/reactionRateData";

const graph = {
  x: 54,
  y: 44,
  width: 486,
  height: 224,
  maxTime: 60,
  maxVolume: 70,
};

function toSvgPoint(point) {
  return {
    x: graph.x + (point.time / graph.maxTime) * graph.width,
    y: graph.y + graph.height - (point.volume / graph.maxVolume) * graph.height,
  };
}

function distancePercent(click, target) {
  const dx = Math.abs(click.x - target.x) / graph.width;
  const dy = Math.abs(click.y - target.y) / graph.height;
  return Math.max(dx, dy);
}

export default function ReactionPlotChallenge({ completedRuns, onComplete }) {
  const [open, setOpen] = useState(false);
  const [dataset, setDataset] = useState("large");
  const [plotted, setPlotted] = useState([]);
  const [feedback, setFeedback] = useState("Klik pada graf untuk plot titik data.");
  const [mistake, setMistake] = useState(null);
  const options = reactionFactors.size.options;
  const targetPoints = getSizeReactionPoints(dataset);
  const nextIndex = plotted.length;
  const complete = plotted.length === targetPoints.length;

  const handleDatasetChange = (event) => {
    setDataset(event.target.value);
    setPlotted([]);
    setMistake(null);
    setFeedback("Klik pada graf untuk plot titik data.");
  };

  const handlePlot = (event) => {
    if (!completedRuns[dataset]) {
      setFeedback("Jalankan eksperimen dataset ini dahulu sebelum plot graf.");
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
    const target = toSvgPoint(targetPoints[nextIndex]);
    const accurate = distancePercent(click, target) <= 0.05;

    if (accurate) {
      const nextPlotted = [...plotted, targetPoints[nextIndex]];
      setPlotted(nextPlotted);
      setMistake(null);
      setFeedback(nextPlotted.length === targetPoints.length ? "Semua titik tepat. Garis graf berjaya dibina." : "Titik tepat.");
      if (nextPlotted.length === targetPoints.length) {
        onComplete?.();
      }
      return;
    }

    setMistake(click);
    setFeedback("Semak semula bacaan masa dan isipadu gas.");
  };

  return (
    <section className="electroPanel electroAccordion reactionPlotChallenge">
      <button className="accordionHeader quizCard__toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span>Cabaran Plot Graf</span>
        <strong>{open ? "Tutup" : "Buka"}</strong>
      </button>

      {open && (
        <div className="accordionBody reactionPlotBody">
          <label className="reactionPlotSelect">
            Pilih dataset
            <select value={dataset} onChange={handleDatasetChange}>
              {sizeOptionIds.map((id) => {
                const option = options.find((item) => item.id === id);
                return (
                  <option key={id} value={id}>
                    {option?.label}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="reactionPlotInstructions">
            <span>1</span>
            <p>Rujuk jadual pemerhatian dan klik titik mengikut turutan masa 0, 10, 20, 30, 40, 50, 60 s.</p>
          </div>
          <div className="reactionPlotInstructions">
            <span>2</span>
            <p>Toleransi semakan ialah kira-kira 5% daripada skala graf.</p>
          </div>

          <svg className="reactionPlotSvg" viewBox="0 0 600 340" role="img" aria-label="Graf kosong untuk cabaran plot graf" onClick={handlePlot}>
            <rect className="reactionGraphBg" x="0" y="0" width="600" height="340" rx="20" />
            {Array.from({ length: 6 }, (_, index) => (
              <line key={`h-${index}`} className="reactionGridLine" x1={graph.x} x2="540" y1={56 + index * 42.4} y2={56 + index * 42.4} />
            ))}
            {Array.from({ length: 7 }, (_, index) => (
              <line key={`v-${index}`} className="reactionGridLine" x1={graph.x + index * 81} x2={graph.x + index * 81} y1="56" y2="268" />
            ))}
            <line className="reactionAxis" x1={graph.x} y1="268" x2="548" y2="268" />
            <line className="reactionAxis" x1={graph.x} y1="44" x2={graph.x} y2="268" />
            <text className="reactionAxisLabel" x="245" y="315">Masa (s)</text>
            <text className="reactionAxisLabel" x="18" y="174" transform="rotate(-90 18 174)">Isi padu H2 (cm3)</text>
            {reactionTimes.map((value) => (
              <text key={value} className="reactionTick" x={graph.x + (value / graph.maxTime) * graph.width} y="291">{value}</text>
            ))}
            {[0, 10, 20, 30, 40, 50, 60, 70].map((value) => (
              <text key={value} className="reactionTick reactionTick--y" x="28" y={272 - (value / graph.maxVolume) * 212}>{value}</text>
            ))}
            {complete && (
              <polyline className="reactionGraphLine" points={plotted.map((point) => {
                const position = toSvgPoint(point);
                return `${position.x},${position.y}`;
              }).join(" ")} />
            )}
            {plotted.map((point) => {
              const position = toSvgPoint(point);
              return <circle key={point.time} className="reactionPlotPoint reactionPlotPoint--ok" cx={position.x} cy={position.y} r="7" />;
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
