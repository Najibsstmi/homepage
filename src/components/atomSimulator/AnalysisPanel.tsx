import { ATOM_ELEMENTS, type ElementSymbol } from "../../data/atomSimulator/CompoundDatabase";
import type { MatterAnalysis } from "../../utils/atomSimulator/ClassificationEngine";
import ChemicalFormula from "./ChemicalFormula";

type AnalysisPanelProps = {
  analysis: MatterAnalysis;
};

export default function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  const elementRows = Object.entries(analysis.elementCounts)
    .filter((entry): entry is [ElementSymbol, number] => Boolean(entry[1]))
    .map(([symbol, count]) => ({
      symbol,
      count,
      name: ATOM_ELEMENTS[symbol].name,
    }));

  return (
    <aside className="atomAnalysis atomSimPanel" aria-label="Panel analisis">
      <div className="atomAnalysis__header">
        <span>Hasil Analisis</span>
        <strong className={`atomCategoryBadge atomCategoryBadge--${analysis.tone}`}>
          {analysis.category}
        </strong>
      </div>

      <div className="atomResultCard">
        <span>Formula</span>
        <strong>
          <ChemicalFormula value={analysis.formula} />
        </strong>
        <p>{analysis.name}</p>
      </div>

      {analysis.category === "SEBATIAN IONIK" && (
        <div className="atomIonicCard">
          <span>Model ionik</span>
          <strong>
            Na<sup>+</sup> <i /> Cl<sup>-</sup>
          </strong>
          <p>{analysis.description}</p>
        </div>
      )}

      <dl className="atomAnalysisGrid">
        <div>
          <dt>Jenis</dt>
          <dd>{analysis.typeLabel}</dd>
        </div>
        <div>
          <dt>Bilangan Atom</dt>
          <dd>{analysis.atomCount}</dd>
        </div>
        <div>
          <dt>Bilangan Ikatan</dt>
          <dd>{analysis.bondCount}</dd>
        </div>
        <div>
          <dt>Unsur Berbeza</dt>
          <dd>{analysis.uniqueElementCount}</dd>
        </div>
      </dl>

      <div className="atomExplanation">
        <span>Penerangan</span>
        <p>{analysis.description}</p>
      </div>

      {!!elementRows.length && (
        <div className="atomElementBreakdown">
          <span>Pecahan unsur</span>
          {elementRows.map((row) => (
            <div key={row.symbol}>
              <strong>{row.symbol}</strong>
              <p>{row.name}</p>
              <b>{row.count}</b>
            </div>
          ))}
        </div>
      )}

      {analysis.units.length > 1 && (
        <div className="atomUnitList">
          <span>Unit pada papan</span>
          {analysis.units.map((unit, index) => (
            <div key={`${unit.id}-${index}`}>
              <strong>
                <ChemicalFormula value={unit.formula} />
              </strong>
              <p>{unit.category}</p>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
