import { useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import AnalysisPanel from "../components/atomSimulator/AnalysisPanel";
import AtomPanel from "../components/atomSimulator/AtomPanel";
import BuildBoard from "../components/atomSimulator/BuildBoard";
import ChallengeSection from "../components/atomSimulator/ChallengeSection";
import MobileControlDrawer from "../components/MobileControlDrawer";
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

export default function AtomMoleculeCompoundSimulatorPage({
  reviewPanel,
}: {
  reviewPanel?: ReactNode;
}) {
  const [atoms, setAtoms] = useState<AtomNode[]>([]);
  const [bonds, setBonds] = useState<AtomBond[]>([]);
  const [structureVersion, setStructureVersion] = useState(0);
  const atomCounter = useRef(0);
  const bondCounter = useRef(0);
  const analysis = useMemo(() => classifyMatter(atoms, bonds), [atoms, bonds]);

  const markStructureChanged = () => {
    setStructureVersion((version) => version + 1);
  };

  const addAtomAt = (element: ElementSymbol, position: Position) => {
    atomCounter.current += 1;
    markStructureChanged();
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

  const addAtomToBoardCenter = (element: ElementSymbol) => {
    addAtomAt(element, { x: 50, y: 50 });
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

    if (bonds.some((bond) => getBondKey(bond.from, bond.to) === pairKey)) {
      return;
    }

    bondCounter.current += 1;
    markStructureChanged();
    setBonds((current) => {
      if (current.some((bond) => getBondKey(bond.from, bond.to) === pairKey)) {
        return current;
      }

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
    if (atomIds.length) {
      markStructureChanged();
    }
    setAtoms((current) => current.filter((atom) => !ids.has(atom.id)));
    setBonds((current) => current.filter((bond) => !ids.has(bond.from) && !ids.has(bond.to)));
  };

  const removeBond = (bondId: string) => {
    if (bonds.some((bond) => bond.id === bondId)) {
      markStructureChanged();
    }
    setBonds((current) => current.filter((bond) => bond.id !== bondId));
  };

  const clearBoard = () => {
    if (atoms.length || bonds.length) {
      markStructureChanged();
    }
    setAtoms([]);
    setBonds([]);
  };

  return (
    <main className="atomSimulatorPage">
      <section className="atomHero">
        <span className="simulatorHero__kicker">Tingkatan 5 - Bab Elektrokimia</span>
        <h1>Simulator Atom, Molekul dan Sebatian</h1>
        <p>
          <span className="atomInstructionDesktop">
            Seret atom ke papan binaan untuk membina model zarah serta mengenal pasti atom,
            unsur, molekul, sebatian dan campuran.
          </span>
          <span className="atomInstructionMobile">
            Tekan atom untuk menambah ke papan binaan, kemudian alihkan kedudukannya untuk
            membina model zarah.
          </span>
        </p>
      </section>

      {reviewPanel}

      <section className="atomLabLayout" aria-label="Simulator atom molekul dan sebatian">
        <MobileControlDrawer title="Panel atom" summary="Tambah atom ke papan binaan">
          <AtomPanel
            onTapAtom={addAtomToBoardCenter}
            onDragStart={handlePaletteDragStart}
            onClear={clearBoard}
          />
        </MobileControlDrawer>
        <BuildBoard
          atoms={atoms}
          bonds={bonds}
          analysis={analysis}
          onAddAtomAt={addAtomAt}
          onMoveAtoms={moveAtoms}
          onCreateBond={createBond}
          onRemoveBond={removeBond}
          onRemoveAtoms={removeAtoms}
          onClear={clearBoard}
        />
        <AnalysisPanel analysis={analysis} structureVersion={structureVersion} />
      </section>

      <ChallengeSection analysis={analysis} onClearBoard={clearBoard} />
      <QuizSection />
    </main>
  );
}
