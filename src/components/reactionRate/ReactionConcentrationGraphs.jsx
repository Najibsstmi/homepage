import { concentrationOptionIds, getConcentrationOption } from "../../data/reactionRateData";

const graph = {
  x: 58,
  y: 42,
  width: 488,
  height: 224,
};

function getRuns(concentrationRuns) {
  return concentrationOptionIds
    .map((id) => {
      const option = getConcentrationOption(id);
      const run = concentrationRuns[id];
      return run ? { id, option, ...run } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.concentration - b.concentration);
}

function toPoint(concentration, value, maxY) {
  const x = graph.x + ((concentration - 0.04) / 0.16) * graph.width;
  const y = graph.y + graph.height - (value / maxY) * graph.height;
  return { x, y };
}

function Axis({ maxY, yLabel }) {
  return (
    <>
      <rect className="reactionGraphBg" x="0" y="0" width="600" height="340" rx="20" />
      {Array.from({ length: 6 }, (_, index) => (
        <line key={`h-${index}`} className="reactionGridLine" x1={graph.x} x2="546" y1={graph.y + index * (graph.height / 5)} y2={graph.y + index * (graph.height / 5)} />
      ))}
      {Array.from({ length: 5 }, (_, index) => (
        <line key={`v-${index}`} className="reactionGridLine" x1={graph.x + index * (graph.width / 4)} x2={graph.x + index * (graph.width / 4)} y1={graph.y} y2={graph.y + graph.height} />
      ))}
      <line className="reactionAxis" x1={graph.x} y1={graph.y + graph.height} x2="552" y2={graph.y + graph.height} />
      <line className="reactionAxis" x1={graph.x} y1={graph.y - 4} x2={graph.x} y2={graph.y + graph.height} />
      <text className="reactionAxisLabel" x="260" y="315">Kepekatan Na2S2O3 (mol dm-3)</text>
      <text className="reactionAxisLabel" x="18" y="184" transform="rotate(-90 18 184)">{yLabel}</text>
      {[0.04, 0.08, 0.12, 0.16, 0.2].map((value) => (
        <text key={value} className="reactionTick" x={graph.x + ((value - 0.04) / 0.16) * graph.width} y="291">{value.toFixed(2)}</text>
      ))}
      {Array.from({ length: 5 }, (_, index) => {
        const value = (maxY / 4) * index;
        return (
          <text key={value} className="reactionTick reactionTick--y" x="32" y={graph.y + graph.height + 4 - (value / maxY) * graph.height}>
            {maxY < 1 ? value.toFixed(3) : Math.round(value)}
          </text>
        );
      })}
    </>
  );
}

function GraphCard({ title, subtitle, runs, mode }) {
  const maxY = mode === "time" ? 80 : 0.06;
  const yLabel = mode === "time" ? "Masa (s)" : "1/masa (s-1)";
  const points = runs.map((run) => toPoint(run.concentration, mode === "time" ? run.time : run.inverseTime, maxY));
  const linePoints = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  return (
    <div className="reactionConcentrationGraphCard">
      <div className="reactionPanelTitle">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <svg viewBox="0 0 600 340" role="img" aria-label={title}>
        <Axis maxY={maxY} yLabel={yLabel} />
        {runs.length > 1 && <polyline className="reactionGraphLine" points={linePoints} />}
        {runs.map((run, index) => {
          const point = points[index];
          return (
            <circle
              key={run.id}
              className="reactionGraphDot"
              cx={point.x}
              cy={point.y}
              r="6"
              style={{ fill: run.option.color }}
            />
          );
        })}
        {!runs.length && (
          <text className="reactionEmptyGraph" x="300" y="166">Rekod data kepekatan untuk memaparkan graf.</text>
        )}
      </svg>
    </div>
  );
}

export default function ReactionConcentrationGraphs({ concentrationRuns }) {
  const runs = getRuns(concentrationRuns);

  return (
    <section className="electroPanel reactionGraphPanel reactionConcentrationGraphs">
      <div className="reactionPanelTitle">
        <div>
          <h2>Graf Faktor Kepekatan</h2>
          <p>Bandingkan masa dan kadar tindak balas yang diwakili oleh 1/masa.</p>
        </div>
        <strong>{runs.length}/5 data</strong>
      </div>

      <div className="reactionConcentrationGraphGrid">
        <GraphCard
          title="Kepekatan Melawan Masa"
          subtitle="Kepekatan lebih tinggi memberikan masa lebih singkat."
          runs={runs}
          mode="time"
        />
        <GraphCard
          title="Kepekatan Melawan 1/masa"
          subtitle="1/masa mewakili kadar tindak balas."
          runs={runs}
          mode="inverse"
        />
      </div>

      <div className="reactionAnalysisNote">
        <strong>Analisis automatik</strong>
        <p>Semakin tinggi kepekatan natrium tiosulfat, semakin singkat masa untuk tanda X tidak kelihatan. Semakin tinggi kepekatan, semakin tinggi kadar tindak balas. Kadar tindak balas diwakili oleh 1/masa.</p>
      </div>
    </section>
  );
}

export { getRuns as getConcentrationGraphRuns, graph as concentrationGraph, toPoint as toConcentrationGraphPoint };
