import { useMemo, useState } from "react";
import { ATOM_ELEMENTS, type ElementSymbol } from "../../data/atomSimulator/CompoundDatabase";
import type { MatterAnalysis } from "../../utils/atomSimulator/ClassificationEngine";
import ChemicalFormula from "./ChemicalFormula";

type AnalysisPanelProps = {
  analysis: MatterAnalysis;
  structureVersion: number;
};

type AqueousSolutionId = "hcl-aq" | "nacl-aq" | "nh3-aq";

type IonPart = {
  base: string;
  subscript?: string;
  charge: string;
};

type AqueousSolution = {
  id: AqueousSolutionId;
  requiredFormula: string;
  label: string;
  name: string;
  formula: string;
  electrolyte: "Elektrolit kuat" | "Elektrolit lemah";
  ions: [IonPart, IonPart];
  explanation: string;
};

const aqueousSolutions: AqueousSolution[] = [
  {
    id: "hcl-aq",
    requiredFormula: "HCl",
    label: "Bentuk HCl(aq)",
    name: "Asid Hidroklorik",
    formula: "HCl(aq)",
    electrolyte: "Elektrolit kuat",
    ions: [
      { base: "H", charge: "+" },
      { base: "Cl", charge: "-" },
    ],
    explanation: "HCl terion sepenuhnya dalam air menghasilkan ion H+ dan Cl-.",
  },
  {
    id: "nacl-aq",
    requiredFormula: "NaCl",
    label: "Bentuk NaCl(aq)",
    name: "Larutan Natrium Klorida",
    formula: "NaCl(aq)",
    electrolyte: "Elektrolit kuat",
    ions: [
      { base: "Na", charge: "+" },
      { base: "Cl", charge: "-" },
    ],
    explanation: "NaCl terpisah kepada ion Na+ dan Cl- dalam air.",
  },
  {
    id: "nh3-aq",
    requiredFormula: "NH3",
    label: "Bentuk NH3(aq)",
    name: "Larutan Ammonia",
    formula: "NH3(aq)",
    electrolyte: "Elektrolit lemah",
    ions: [
      { base: "NH", subscript: "4", charge: "+" },
      { base: "OH", charge: "-" },
    ],
    explanation: "Sebahagian molekul NH3 bertindak balas dengan air menghasilkan ion NH4+ dan OH-.",
  },
];

export default function AnalysisPanel({ analysis, structureVersion }: AnalysisPanelProps) {
  const aqueousOptions = useMemo(() => getAqueousOptions(analysis), [analysis]);
  const [aqueousSelection, setAqueousSelection] = useState<{ id: AqueousSolutionId; structureVersion: number } | undefined>();
  const selectedSolutionId = aqueousSelection?.structureVersion === structureVersion ? aqueousSelection.id : "";
  const selectedSolution = aqueousOptions.find((solution) => solution.id === selectedSolutionId);
  const displayAnalysis = selectedSolution
    ? getAqueousAnalysis(analysis, selectedSolution)
    : getPromptedMixtureAnalysis(analysis, aqueousOptions);
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
        <strong className={`atomCategoryBadge atomCategoryBadge--${displayAnalysis.tone}`}>
          {displayAnalysis.category}
        </strong>
      </div>

      <div className="atomResultCard">
        <span>Formula</span>
        <strong>
          <ChemicalFormula value={displayAnalysis.formula} />
        </strong>
        <p>{displayAnalysis.name}</p>
      </div>

      {displayAnalysis.category === "SEBATIAN IONIK" && (
        <div className="atomIonicCard">
          <span>Model ionik</span>
          <strong>
            Na<sup>+</sup> <i /> Cl<sup>-</sup>
          </strong>
          <p>{displayAnalysis.description}</p>
        </div>
      )}

      <dl className="atomAnalysisGrid">
        <div>
          <dt>Jenis</dt>
          <dd>{displayAnalysis.typeLabel}</dd>
        </div>
        {selectedSolution && (
          <div>
            <dt>Ion hadir</dt>
            <dd className="atomIonPresence">
              <IonFormula ion={selectedSolution.ions[0]} /> + <IonFormula ion={selectedSolution.ions[1]} />
            </dd>
          </div>
        )}
        <div>
          <dt>Bilangan Atom</dt>
          <dd>{displayAnalysis.atomCount}</dd>
        </div>
        <div>
          <dt>Bilangan Ikatan</dt>
          <dd>{displayAnalysis.bondCount}</dd>
        </div>
        <div>
          <dt>Unsur Berbeza</dt>
          <dd>{displayAnalysis.uniqueElementCount}</dd>
        </div>
      </dl>

      <div className="atomExplanation">
        <span>Penerangan</span>
        <p>{displayAnalysis.description}</p>
      </div>

      {!!aqueousOptions.length && (
        <div className="atomAqueousCard">
          <span>Larutan akueus</span>
          <strong>{selectedSolution ? "Larutan akueus telah dibentuk" : "Larutan akueus boleh dibentuk"}</strong>
          <div className="atomAqueousActions">
            {aqueousOptions.map((solution) => (
              <button
                key={solution.id}
                type="button"
                className={selectedSolutionId === solution.id ? "atomAqueousAction--active" : ""}
                onClick={() => setAqueousSelection({ id: solution.id, structureVersion })}
              >
                {solution.label}
              </button>
            ))}
          </div>

          {selectedSolution && <AqueousSolutionResult solution={selectedSolution} />}
        </div>
      )}

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

function getAqueousOptions(analysis: MatterAnalysis) {
  if (!analysis.isStable || !analysis.units.length) {
    return [];
  }

  const formulas = new Set(analysis.units.map((unit) => unit.primaryFormula));

  if (!formulas.has("H2O")) {
    return [];
  }

  return aqueousSolutions.filter((solution) => formulas.has(solution.requiredFormula));
}

function getPromptedMixtureAnalysis(analysis: MatterAnalysis, options: AqueousSolution[]): MatterAnalysis {
  if (!options.length) {
    return analysis;
  }

  const firstOption = options[0];
  const solutionFormula = options.length === 1
    ? `${firstOption.requiredFormula} + H2O`
    : `${options.map((option) => option.requiredFormula).join(" + ")} + H2O`;

  return {
    ...analysis,
    formula: solutionFormula,
    primaryFormula: solutionFormula,
    description: `${firstOption.requiredFormula} dan H2O ialah dua bahan berasingan. Klik ${firstOption.label} untuk menghasilkan larutan akueus.`,
  };
}

function getAqueousAnalysis(analysis: MatterAnalysis, solution: AqueousSolution): MatterAnalysis {
  return {
    ...analysis,
    id: `aqueous-${solution.id}`,
    category: "LARUTAN AKUEUS",
    formula: solution.formula,
    primaryFormula: solution.formula,
    name: solution.name,
    typeLabel: solution.electrolyte,
    description: solution.explanation,
    tone: "teal",
    isMixture: false,
  };
}

function AqueousSolutionResult({ solution }: { solution: AqueousSolution }) {
  return (
    <div className="atomAqueousResult">
      <div className="atomAqueousResult__header">
        <strong>{solution.formula}</strong>
        <span className={`atomElectrolyteBadge atomElectrolyteBadge--${solution.electrolyte.includes("kuat") ? "strong" : "weak"}`}>
          {solution.electrolyte}
        </span>
      </div>

      <div className="atomIonSplit" aria-label={`Ion hadir dalam ${solution.formula}`}>
        <div className="atomIonChip atomIonChip--left">
          <IonFormula ion={solution.ions[0]} />
        </div>
        <div className="atomIonSplit__source">
          <span>{solution.formula}</span>
          <i aria-hidden="true" />
        </div>
        <div className="atomIonChip atomIonChip--right">
          <IonFormula ion={solution.ions[1]} />
        </div>
      </div>

      <p>
        Ion hadir: <IonFormula ion={solution.ions[0]} /> + <IonFormula ion={solution.ions[1]} />
      </p>
      <p>{solution.explanation}</p>
    </div>
  );
}

function IonFormula({ ion }: { ion: IonPart }) {
  return (
    <span className="atomIonFormula">
      {ion.base}
      {ion.subscript && <sub>{ion.subscript}</sub>}
      <sup>{ion.charge}</sup>
    </span>
  );
}
