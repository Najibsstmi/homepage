import {
  SOLUTIONS,
  type SolutionType,
} from "../../data/macronutrientExperimentData";

interface SolutionSelectorProps {
  selected: SolutionType | null;
  disabled: boolean;
  onSelect: (solution: SolutionType) => void;
}

export default function SolutionSelector({
  selected,
  disabled,
  onSelect,
}: SolutionSelectorProps) {
  return (
    <section className="macro-solutions" aria-labelledby="macro-solution-heading">
      <div className="macro-section-heading">
        <span>LANGKAH 1</span>
        <div>
          <h2 id="macro-solution-heading">Pilih larutan</h2>
          <p>Klik botol, kemudian klik mana-mana Set A–D.</p>
        </div>
      </div>
      <div className="macro-solution-list">
        {SOLUTIONS.map((solution) => (
          <button
            type="button"
            className={`macro-solution${selected === solution.id ? " is-selected" : ""}`}
            key={solution.id}
            aria-pressed={selected === solution.id}
            aria-label={`Pilih ${solution.label}`}
            disabled={disabled}
            onClick={() => onSelect(solution.id)}
          >
            <img src={solution.bottle} alt="" width="210" height="475" />
            <span>
              <strong>{solution.label}</strong>
              <small>{solution.nutrient}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
