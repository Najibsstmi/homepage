export default function ReactionProgress({ started, completedCount, totalRuns = 2, allRunsComplete, graphComplete, quizScore, quizTotal }) {
  const reactionStarter = started ? 10 : 0;
  const variableController = allRunsComplete ? 10 : 0;
  const dataCollector = allRunsComplete ? 10 : 0;
  const graphAnalyst = graphComplete ? 10 : 0;
  const scienceCheck = quizTotal ? Math.round((quizScore / quizTotal) * 10) : 0;
  const total = reactionStarter + variableController + dataCollector + graphAnalyst + scienceCheck;
  const items = [
    ["Reaction Starter", reactionStarter],
    ["Variable Controller", variableController],
    ["Data Collector", dataCollector],
    ["Graph Analyst", graphAnalyst],
    ["Science Check", scienceCheck],
  ];

  return (
    <section className="scoreboardPanel reactionProgress" aria-label="Science Progress kadar tindak balas">
      <div className="scoreboardPanel__header">
        <span>Science Progress</span>
        <strong>{total}/50</strong>
      </div>
      <div className="scoreboardBadge">Makmal Kadar Tindak Balas</div>
      <p className="reactionProgressHint">{completedCount}/{totalRuns} keadaan selesai.</p>
      <div className="scoreGrid">
        {items.map(([label, score]) => (
          <div key={label} className="scoreItem" style={{ "--score": `${score * 10}%` }}>
            <div className="scoreItem__top">
              <span>{label}</span>
              <strong>{score}/10</strong>
            </div>
            <div className="scoreItem__bar" aria-hidden="true">
              <i />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
