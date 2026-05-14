const graph = {
  x: 58,
  y: 42,
  width: 488,
  height: 224,
};

function getRuns(temperatureRuns) {
  return (Array.isArray(temperatureRuns) ? temperatureRuns : [])
    .map((run, index) => ({
      id: run.id || `${run.temperature}-${index}`,
      color: run.color || "#fbbf24",
      ...run,
    }))
    .sort((a, b) => a.temperature - b.temperature);
}

function toPoint(temperature, value, maxY) {
  const x = graph.x + ((temperature - 30) / 30) * graph.width;
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
      {Array.from({ length: 7 }, (_, index) => (
        <line key={`v-${index}`} className="reactionGridLine" x1={graph.x + index * (graph.width / 6)} x2={graph.x + index * (graph.width / 6)} y1={graph.y} y2={graph.y + graph.height} />
      ))}
      <line className="reactionAxis" x1={graph.x} y1={graph.y + graph.height} x2="552" y2={graph.y + graph.height} />
      <line className="reactionAxis" x1={graph.x} y1={graph.y - 4} x2={graph.x} y2={graph.y + graph.height} />
      <text className="reactionAxisLabel" x="300" y="315">Suhu (°C)</text>
      <text className="reactionAxisLabel" x="18" y="184" transform="rotate(-90 18 184)">{yLabel}</text>
      {[30, 35, 40, 45, 50, 55, 60].map((value) => (
        <text key={value} className="reactionTick" x={graph.x + ((value - 30) / 30) * graph.width} y="291">{value}</text>
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
  const points = runs.map((run) => toPoint(run.temperature, mode === "time" ? run.time : run.inverseTime, maxY));
  const linePoints = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  return (
    <div className="reactionConcentrationGraphCard reactionTemperatureGraphCard">
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
              style={{ fill: run.color }}
            />
          );
        })}
        {!runs.length && (
          <text className="reactionEmptyGraph" x="300" y="166">Rekod data suhu untuk memaparkan graf.</text>
        )}
      </svg>
    </div>
  );
}

export default function ReactionTemperatureGraphs({ temperatureRuns }) {
  const runs = getRuns(temperatureRuns);

  return (
    <section className="electroPanel reactionGraphPanel reactionTemperatureGraphs">
      <div className="reactionPanelTitle">
        <div>
          <h2>Graf Faktor Suhu</h2>
          <p>Bandingkan suhu dengan masa dan kadar tindak balas.</p>
        </div>
        <strong>{runs.length} data</strong>
      </div>

      <div className="reactionConcentrationGraphGrid reactionTemperatureGraphGrid">
        <GraphCard
          title="Suhu Melawan Masa"
          subtitle="Suhu lebih tinggi menyebabkan masa tanda X hilang lebih singkat."
          runs={runs}
          mode="time"
        />
        <GraphCard
          title="Suhu Melawan Kadar Tindak Balas"
          subtitle="Kadar tindak balas diwakili oleh nilai 1/masa."
          runs={runs}
          mode="inverse"
        />
      </div>

      <div className="reactionAnalysisNote">
        <strong>Konsep sains</strong>
        <p>Pada suhu tinggi, zarah bergerak lebih laju. Perlanggaran antara zarah berlaku dengan lebih kerap dan lebih banyak perlanggaran berkesan berlaku. Oleh itu, kadar tindak balas meningkat.</p>
      </div>
    </section>
  );
}

export { getRuns as getTemperatureGraphRuns, graph as temperatureGraph, toPoint as toTemperatureGraphPoint };
