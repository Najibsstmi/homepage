import {
  EXPERIMENT_SETS,
  SOLUTION_BY_ID,
  getPlantAsset,
  type ExperimentSetId,
  type SolutionSelections,
} from "../../data/macronutrientExperimentData";

interface ComparisonPanelProps {
  selections: SolutionSelections;
  onObserve: (setId: ExperimentSetId) => void;
}

export default function ComparisonPanel({
  selections,
  onObserve,
}: ComparisonPanelProps) {
  return (
    <section className="macro-comparison" aria-labelledby="macro-comparison-title">
      <div className="macro-comparison__heading">
        <span>HARI 14 · PEMERHATIAN</span>
        <h2 id="macro-comparison-title">Bandingkan pertumbuhan empat set</h2>
        <p>Perhatikan daun, batang dan akar sebelum membaca penerangan saintifik.</p>
      </div>
      <div className="macro-comparison__grid">
        {EXPERIMENT_SETS.map((setId) => {
          const solutionId = selections[setId];
          if (!solutionId) return null;
          const solution = SOLUTION_BY_ID[solutionId];
          return (
            <article className="macro-comparison-card" key={setId}>
              <span>SET {setId}</span>
              <div className="macro-comparison-card__plant">
                <img
                  src={getPlantAsset(solutionId, 14)}
                  alt={`Pokok jagung Set ${setId} pada Hari 14`}
                  width="480"
                  height="520"
                />
              </div>
              <h3>{solution.label}</h3>
              <p>Hari 14</p>
              <button type="button" onClick={() => onObserve(setId)}>
                <span aria-hidden="true">⌕</span> Perhatikan
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
