import { useMemo, useRef, useState, type DragEvent } from "react";
import AnalysisPanel from "../components/atomSimulator/AnalysisPanel";
import AtomPanel from "../components/atomSimulator/AtomPanel";
import BuildBoard from "../components/atomSimulator/BuildBoard";
import ChallengeSection from "../components/atomSimulator/ChallengeSection";
import QuizSection from "../components/atomSimulator/QuizSection";
import type { ElementSymbol } from "../data/atomSimulator/CompoundDatabase";
import {
  classifyMatter,
  getBondKey,
  getBondKind,
  type AtomBond,
  type AtomNode,
} from "../utils/atomSimulator/ClassificationEngine";

type Position = {
  x: number;
  y: number;
};

const fallbackPositions: Position[] = [
  { x: 32, y: 34 },
  { x: 45, y: 34 },
  { x: 58, y: 34 },
  { x: 38, y: 48 },
  { x: 52, y: 48 },
  { x: 66, y: 48 },
  { x: 34, y: 62 },
  { x: 48, y: 62 },
  { x: 62, y: 62 },
];

export default function AtomMoleculeCompoundSimulatorPage() {
  const [atoms, setAtoms] = useState<AtomNode[]>([]);
  const [bonds, setBonds] = useState<AtomBond[]>([]);
  const atomCounter = useRef(0);
  const bondCounter = useRef(0);
  const analysis = useMemo(() => classifyMatter(atoms, bonds), [atoms, bonds]);

  const addAtomAt = (element: ElementSymbol, position: Position) => {
    atomCounter.current += 1;
    setAtoms((current) => [
      ...current,
      {
        id: `atom-${atomCounter.current}`,
        element,
        x: position.x,
        y: position.y,
      },
    ]);
  };

  const addAtomFromPanel = (element: ElementSymbol) => {
    const position = fallbackPositions[atoms.length % fallbackPositions.length];
    addAtomAt(element, position);
  };

  const handlePaletteDragStart = (event: DragEvent<HTMLButtonElement>, element: ElementSymbol) => {
    event.dataTransfer.setData("application/x-atom-symbol", element);
    event.dataTransfer.effectAllowed = "copy";
  };

  const moveAtoms = (updates: Record<string, Position>) => {
    setAtoms((current) =>
      current.map((atom) => {
        const update = updates[atom.id];
        return update ? { ...atom, ...update } : atom;
      }),
    );
  };

  const createBond = (firstId: string, secondId: string) => {
    const first = atoms.find((atom) => atom.id === firstId);
    const second = atoms.find((atom) => atom.id === secondId);

    if (!first || !second) {
      return;
    }

    const pairKey = getBondKey(firstId, secondId);

    setBonds((current) => {
      if (current.some((bond) => getBondKey(bond.from, bond.to) === pairKey)) {
        return current;
      }

      bondCounter.current += 1;
      return [
        ...current,
        {
          id: `bond-${bondCounter.current}`,
          from: firstId,
          to: secondId,
          kind: getBondKind(first.element, second.element),
        },
      ];
    });
  };

  const removeAtoms = (atomIds: string[]) => {
    const ids = new Set(atomIds);
    setAtoms((current) => current.filter((atom) => !ids.has(atom.id)));
    setBonds((current) => current.filter((bond) => !ids.has(bond.from) && !ids.has(bond.to)));
  };

  const clearBoard = () => {
    setAtoms([]);
    setBonds([]);
  };

  return (
    <main className="atomSimulatorPage">
      <section className="atomHero">
        <span className="simulatorHero__kicker">Tingkatan 5 - Bab Elektrokimia</span>
        <h1>Simulator Atom, Molekul dan Sebatian</h1>
        <p>
          Seret dan lepaskan atom untuk membina model zarah serta mengenal pasti atom,
          unsur, molekul, sebatian dan campuran.
        </p>
      </section>

      <section className="atomLabLayout" aria-label="Simulator atom molekul dan sebatian">
        <AtomPanel
          onAddAtom={addAtomFromPanel}
          onDragStart={handlePaletteDragStart}
          onClear={clearBoard}
        />
        <BuildBoard
          atoms={atoms}
          bonds={bonds}
          analysis={analysis}
          onAddAtomAt={addAtomAt}
          onMoveAtoms={moveAtoms}
          onCreateBond={createBond}
          onRemoveAtoms={removeAtoms}
          onClear={clearBoard}
        />
        <AnalysisPanel analysis={analysis} />
      </section>

      <ChallengeSection analysis={analysis} onClearBoard={clearBoard} />
      <QuizSection />
    </main>
  );
}
