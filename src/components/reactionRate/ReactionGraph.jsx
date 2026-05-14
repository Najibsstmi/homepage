import { getSizeReactionPoints, reactionFactors, sizeOptionIds } from "../../data/reactionRateData";

const maxTime = 60;
const maxVolume = 70;

function toPoint(point) {
  const x = 54 + (point.time / maxTime) * 486;
  const y = 268 - (point.volume / maxVolume) * 212;
  return { x, y };
}

function linePoints(points) {
  return points.map((point) => {
    const position = toPoint(point);
    return `${position.x.toFixed(1)},${position.y.toFixed(1)}`;
  }).join(" ");
}

export default function ReactionGraph({ completedRuns, activeRun }) {
  const sizeFactor = reactionFactors.size;
  const visibleRuns = sizeOptionIds
    .map((id) => {
      const option = sizeFactor.options.find((item) => item.id === id);
      const completed = completedRuns[id];
      const live = activeRun?.optionId === id ? activeRun.points : null;
      const points = completed || live || [];
      return { id, option, points, live: Boolean(live && !completed) };
    })
    .filter((run) => run.points.length);
  const latest = activeRun?.points?.[activeRun.points.length - 1] || { volume: 0 };

  return (
    <section className="electroPanel reactionGraphPanel">
      <div className="reactionPanelTitle">
        <div>
          <h2>Graf: Isi Padu Gas Hidrogen Melawan Masa</h2>
          <p>Line muncul apabila data eksperimen direkodkan. Bandingkan kecerunan setiap keadaan.</p>
        </div>
        <strong>{latest.volume.toFixed(1)} cm3</strong>
      </div>
      <div className="reactionGraphWrap">
        <svg viewBox="0 0 600 350" role="img" aria-label="Graf isi padu hidrogen melawan masa untuk tiga saiz bahan">
          <rect className="reactionGraphBg" x="0" y="0" width="600" height="350" rx="20" />
          {Array.from({ length: 6 }, (_, index) => (
            <line key={`h-${index}`} className="reactionGridLine" x1="54" x2="540" y1={56 + index * 42.4} y2={56 + index * 42.4} />
          ))}
          {Array.from({ length: 7 }, (_, index) => (
            <line key={`v-${index}`} className="reactionGridLine" x1={54 + index * 81} x2={54 + index * 81} y1="56" y2="268" />
          ))}
          <line className="reactionAxis" x1="54" y1="268" x2="548" y2="268" />
          <line className="reactionAxis" x1="54" y1="44" x2="54" y2="268" />
          <text className="reactionAxisLabel" x="245" y="315">Masa (s)</text>
          <text className="reactionAxisLabel" x="18" y="174" transform="rotate(-90 18 174)">Isi padu hidrogen (cm3)</text>
          {[0, 10, 20, 30, 40, 50, 60].map((value) => (
            <text key={value} className="reactionTick" x={54 + (value / maxTime) * 486} y="291">{value}</text>
          ))}
          {[0, 10, 20, 30, 40, 50, 60, 70].map((value) => (
            <text key={value} className="reactionTick reactionTick--y" x="28" y={272 - (value / maxVolume) * 212}>{value}</text>
          ))}

          {visibleRuns.map((run) => (
            <g key={run.id}>
              <polyline
                className={run.live ? "reactionGraphLine reactionGraphLine--live" : "reactionGraphLine"}
                points={linePoints(run.points)}
                style={{ stroke: run.option.color }}
              />
              {run.points.map((point) => {
                const position = toPoint(point);
                return <circle key={`${run.id}-${point.time}`} className="reactionGraphDot" cx={position.x} cy={position.y} r="5.5" style={{ fill: run.option.color }} />;
              })}
            </g>
          ))}

          {!visibleRuns.length && (
            <text className="reactionEmptyGraph" x="300" y="166">Jalankan eksperimen untuk memaparkan garis graf.</text>
          )}
        </svg>
      </div>
      <div className="reactionLegend">
        {sizeOptionIds.map((id) => {
          const option = sizeFactor.options.find((item) => item.id === id);
          const done = Boolean(completedRuns[id]);
          return (
            <span key={id} className={done ? "reactionLegend__item" : "reactionLegend__item reactionLegend__item--muted"}>
              <i style={{ background: option.color }} />
              {option.label}
            </span>
          );
        })}
      </div>
      <div className="reactionAnalysisNote">
        <strong>Analisis</strong>
        <p>Garis paling curam menunjukkan kadar tindak balas paling tinggi. Serbuk zink mempunyai luas permukaan paling besar, maka perlanggaran zarah paling kerap. Jumlah isi padu akhir hampir sama kerana jisim zink adalah tetap.</p>
      </div>
    </section>
  );
}

export { getSizeReactionPoints, toPoint };
