export default function AlloyProgress({ results, measurementCorrect, quizScore = 0, quizTotal = 0 }) {
  const materialTester = results.pure || results.alloy ? 10 : 0;
  const indentationObserver = measurementCorrect.pure || measurementCorrect.alloy ? 10 : 0;
  const alloyComparator = results.pure && results.alloy ? 10 : 0;
  const scienceCheck = quizTotal > 0 ? Math.round((quizScore / quizTotal) * 10) : 0;
  const total = materialTester + indentationObserver + alloyComparator + scienceCheck;
  const level = total >= 36 ? "Hardness Expert" : total >= 24 ? "Atomic Analyst" : total >= 12 ? "Indentation Observer" : "Material Tester";
  const items = [
    ["Material Tester", materialTester],
    ["Indentation Observer", indentationObserver],
    ["Alloy Comparator", alloyComparator],
    ["Science Check", scienceCheck],
  ];

  return (
    <section className="scoreboardPanel alloyProgress" aria-label="Science Progress aloi">
      <div className="scoreboardPanel__header">
        <span>Science Progress</span>
        <strong>{total}/40</strong>
      </div>
      <p className="scoreboardBadge">{level}</p>
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
