import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ATOM_ELEMENTS,
  type ElementSymbol,
} from "../../data/atomSimulator/CompoundDatabase";
import {
  BOND_DISTANCE_PX,
  canFormBond,
  getBondKey,
  getBondKind,
  getConnectedGroups,
  getMoleculeGroup,
  type AtomBond,
  type AtomNode,
  type MatterAnalysis,
} from "../../utils/atomSimulator/ClassificationEngine";
import ChemicalFormula from "./ChemicalFormula";

type Position = {
  x: number;
  y: number;
};

type BuildBoardProps = {
  atoms: AtomNode[];
  bonds: AtomBond[];
  analysis: MatterAnalysis;
  onAddAtomAt: (element: ElementSymbol, position: Position) => void;
  onMoveAtoms: (updates: Record<string, Position>) => void;
  onCreateBond: (firstId: string, secondId: string) => void;
  onRemoveBond: (bondId: string) => void;
  onRemoveAtoms: (atomIds: string[]) => void;
  onClear: () => void;
};

type DragState = {
  groupIds: string[];
  startClientX: number;
  startClientY: number;
  initialPositions: Record<string, Position>;
};

type PendingBond = {
  firstId: string;
  secondId: string;
  pairKey: string;
};

type BlockedBond = PendingBond & {
  reason: string;
  suggestedBondId?: string;
  suggestedBondLabel?: string;
};

type BondPrompt =
  | (PendingBond & { status: "pending" })
  | (BlockedBond & { status: "blocked" });

type MoveMode = "atom" | "molecule";

const atomRadiusPx = 30;

export default function BuildBoard({
  atoms,
  bonds,
  analysis,
  onAddAtomAt,
  onMoveAtoms,
  onCreateBond,
  onRemoveBond,
  onRemoveAtoms,
  onClear,
}: BuildBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(() => new Set());
  const [draggingGroup, setDraggingGroup] = useState<string[]>([]);
  const [deleteHover, setDeleteHover] = useState(false);
  const [moveMode, setMoveMode] = useState<MoveMode>("atom");

  const atomMap = useMemo(() => new Map(atoms.map((atom) => [atom.id, atom])), [atoms]);

  useEffect(() => {
    const board = boardRef.current;

    if (!board) {
      return undefined;
    }

    const updateSize = () => {
      const rect = board.getBoundingClientRect();
      setBoardSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(board);

    return () => observer.disconnect();
  }, []);

  const connectedGroups = useMemo(() => getConnectedGroups(atoms, bonds), [atoms, bonds]);
  const bondPrompt = useMemo(
    () => getBondPrompt(atoms, bonds, boardSize, ignoredPairs),
    [atoms, bonds, boardSize, ignoredPairs],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const symbol = event.dataTransfer.getData("application/x-atom-symbol") as ElementSymbol;

    if (!symbol || !ATOM_ELEMENTS[symbol]) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    onAddAtomAt(symbol, {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 88),
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, atom: AtomNode) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const groupIds = moveMode === "atom" ? [atom.id] : getMoleculeGroup(atom.id, atoms, bonds);
    const initialPositions = groupIds.reduce<Record<string, Position>>((positions, id) => {
      const groupAtom = atomMap.get(id);

      if (groupAtom) {
        positions[id] = { x: groupAtom.x, y: groupAtom.y };
      }

      return positions;
    }, {});

    const dragState = {
      groupIds,
      startClientX: event.clientX,
      startClientY: event.clientY,
      initialPositions,
    };

    dragStateRef.current = dragState;
    setDraggingGroup(groupIds);
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const pointerId = event.pointerId;

    const handleWindowPointerMove = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      pointerEvent.preventDefault();
      moveDraggedGroup(dragState, pointerEvent.clientX, pointerEvent.clientY);
    };

    const handleWindowPointerUp = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      if (isPointInsideDeleteZone(pointerEvent.clientX, pointerEvent.clientY)) {
        onRemoveAtoms(dragState.groupIds);
      }

      dragStateRef.current = null;
      setDraggingGroup([]);
      setDeleteHover(false);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };

    const handleWindowPointerCancel = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      dragStateRef.current = null;
      setDraggingGroup([]);
      setDeleteHover(false);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);
  };

  const moveDraggedGroup = (dragState: DragState, clientX: number, clientY: number) => {
    if (boardSize.width === 0 || boardSize.height === 0) {
      return;
    }

    const deltaX = ((clientX - dragState.startClientX) / boardSize.width) * 100;
    const deltaY = ((clientY - dragState.startClientY) / boardSize.height) * 100;
    const horizontalPadding = (atomRadiusPx / boardSize.width) * 100;
    const verticalPadding = (atomRadiusPx / boardSize.height) * 100;

    const updates = dragState.groupIds.reduce<Record<string, Position>>((positions, id) => {
      const initial = dragState.initialPositions[id];

      if (!initial) {
        return positions;
      }

      positions[id] = {
        x: clamp(initial.x + deltaX, horizontalPadding, 100 - horizontalPadding),
        y: clamp(initial.y + deltaY, verticalPadding, 100 - verticalPadding),
      };

      return positions;
    }, {});

    setDeleteHover(isPointInsideDeleteZone(clientX, clientY));
    pruneIgnoredPairs(getUpdatedAtoms(atoms, updates), boardSize);
    onMoveAtoms(updates);
  };

  const pruneIgnoredPairs = (nextAtoms: AtomNode[], size: { width: number; height: number }) => {
    if (size.width === 0 || size.height === 0) {
      return;
    }

    const nextAtomMap = new Map(nextAtoms.map((atom) => [atom.id, atom]));

    setIgnoredPairs((current) => {
      let changed = false;
      const next = new Set<string>();

      current.forEach((pairKey) => {
        const [firstId, secondId] = pairKey.split(":");
        const first = nextAtomMap.get(firstId);
        const second = nextAtomMap.get(secondId);

        if (first && second && getDistance(first, second, size) < BOND_DISTANCE_PX + 24) {
          next.add(pairKey);
        } else {
          changed = true;
        }
      });

      return changed ? next : current;
    });
  };

  const isPointInsideDeleteZone = (clientX: number, clientY: number) => {
    const deleteRect = deleteRef.current?.getBoundingClientRect();

    return Boolean(
      deleteRect &&
      clientX >= deleteRect.left &&
      clientX <= deleteRect.right &&
      clientY >= deleteRect.top &&
      clientY <= deleteRect.bottom,
    );
  };

  const confirmBond = () => {
    if (bondPrompt?.status !== "pending") {
      return;
    }

    onCreateBond(bondPrompt.firstId, bondPrompt.secondId);
  };

  const rejectBond = () => {
    if (bondPrompt?.status !== "pending") {
      return;
    }

    setIgnoredPairs((current) => new Set(current).add(bondPrompt.pairKey));
  };

  const dismissBlockedBond = () => {
    if (bondPrompt?.status !== "blocked") {
      return;
    }

    setIgnoredPairs((current) => new Set(current).add(bondPrompt.pairKey));
  };

  const removeSuggestedBond = () => {
    if (bondPrompt?.status !== "blocked" || !bondPrompt.suggestedBondId) {
      return;
    }

    onRemoveBond(bondPrompt.suggestedBondId);
  };

  const pendingFirst = bondPrompt?.status === "pending" ? atomMap.get(bondPrompt.firstId) : undefined;
  const pendingSecond = bondPrompt?.status === "pending" ? atomMap.get(bondPrompt.secondId) : undefined;
  const pendingKind = pendingFirst && pendingSecond ? getBondKind(pendingFirst.element, pendingSecond.element) : "covalent";
  const blockedFirst = bondPrompt?.status === "blocked" ? atomMap.get(bondPrompt.firstId) : undefined;
  const blockedSecond = bondPrompt?.status === "blocked" ? atomMap.get(bondPrompt.secondId) : undefined;

  return (
    <section className="atomBuildPanel atomSimPanel">
      <div className="atomBuildPanel__header">
        <div className="atomBuildPanel__title">
          <span className="atomBuildPanel__eyebrow">Papan Binaan</span>
          <div className="atomFormulaBadge" aria-label={`Formula semasa ${analysis.formula || "-"}`}>
            <span>Formula Semasa</span>
            <strong>
              <ChemicalFormula value={analysis.formula} />
            </strong>
          </div>
        </div>
        <div className="atomBuildPanel__actions">
          <div className="atomMoveMode" aria-label="Mod gerakan atom">
            <button
              type="button"
              className={moveMode === "atom" ? "atomMoveMode__button--active" : ""}
              aria-pressed={moveMode === "atom"}
              onClick={() => setMoveMode("atom")}
            >
              Gerak atom
            </button>
            <button
              type="button"
              className={moveMode === "molecule" ? "atomMoveMode__button--active" : ""}
              aria-pressed={moveMode === "molecule"}
              onClick={() => setMoveMode("molecule")}
            >
              Gerak molekul
            </button>
          </div>
          <button type="button" onClick={onClear} disabled={!atoms.length}>
            Reset
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        className="atomBoard"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {!atoms.length && (
          <div className="atomBoard__empty">
            <strong>Papan kosong</strong>
            <span className="atomInstructionDesktop">Seret atom ke papan binaan</span>
            <span className="atomInstructionMobile">Tekan atom untuk menambah ke papan binaan</span>
          </div>
        )}

        <div className="atomBondLayer" aria-label="Garisan ikatan atom">
          {bonds.map((bond) => {
            const first = atomMap.get(bond.from);
            const second = atomMap.get(bond.to);

            if (!first || !second) {
              return null;
            }

            const style = getBondStyle(first, second, boardSize);

            return (
              <button
                key={bond.id}
                type="button"
                className={`atomBondLine atomBondLine--${bond.kind}`}
                style={style}
                onClick={() => onRemoveBond(bond.id)}
                aria-label={`Putuskan ikatan ${first.element}-${second.element}`}
                title={`Putuskan ikatan ${first.element}-${second.element}`}
              />
            );
          })}
        </div>

        {atoms.map((atom) => {
          const element = ATOM_ELEMENTS[atom.element];
          const charge = getAtomCharge(atom, bonds);
          const style = {
            left: `${atom.x}%`,
            top: `${atom.y}%`,
            "--atom-start": element.colorStart,
            "--atom-end": element.colorEnd,
          } as CSSProperties;

          return (
            <button
              key={atom.id}
              type="button"
              className={[
                "boardAtom",
                draggingGroup.includes(atom.id) ? "boardAtom--dragging" : "",
                charge ? "boardAtom--ion" : "",
              ].filter(Boolean).join(" ")}
              style={style}
              onPointerDown={(event) => handlePointerDown(event, atom)}
              onPointerCancel={() => {
                dragStateRef.current = null;
                setDraggingGroup([]);
                setDeleteHover(false);
              }}
            >
              <span>
                {element.symbol}
                {charge && <sup>{charge}</sup>}
              </span>
            </button>
          );
        })}

        {connectedGroups.length > 1 && atoms.length > 1 && (
          <div className="atomBoard__groupCount">
            {connectedGroups.length} unit berasingan
          </div>
        )}

        {bondPrompt?.status === "pending" && pendingFirst && pendingSecond && (
          <div className="atomBondDialog" role="dialog" aria-modal="true">
            <span>{pendingKind === "ionic" ? "Tarikan ionik dikesan" : "Atom berdekatan"}</span>
            <strong>
              Bina ikatan antara {pendingFirst.element} dan {pendingSecond.element}?
            </strong>
            <div className="atomBondDialog__actions">
              <button type="button" onClick={confirmBond}>
                Bina Ikatan
              </button>
              <button type="button" onClick={rejectBond}>
                Jangan Ikat
              </button>
            </div>
          </div>
        )}

        {bondPrompt?.status === "blocked" && blockedFirst && blockedSecond && (
          <div className="atomBondDialog atomBondDialog--blocked" role="dialog" aria-modal="true">
            <span>Ikatan tidak boleh dibina</span>
            <strong>
              {blockedFirst.element} dan {blockedSecond.element} sudah rapat, tetapi ikatan ini tidak sesuai.
            </strong>
            <p>{bondPrompt.reason}</p>
            <div className="atomBondDialog__actions">
              {bondPrompt.suggestedBondId && (
                <button type="button" onClick={removeSuggestedBond}>
                  Putuskan {bondPrompt.suggestedBondLabel}
                </button>
              )}
              <button type="button" onClick={dismissBlockedBond}>
                Faham
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        ref={deleteRef}
        className={[
          "atomDeleteZone",
          draggingGroup.length ? "atomDeleteZone--active" : "",
          deleteHover ? "atomDeleteZone--hover" : "",
        ].filter(Boolean).join(" ")}
      >
        {deleteHover ? "Lepaskan sekarang untuk buang" : "Seret atom atau molekul ke sini untuk buang"}
      </div>
    </section>
  );
}

function getDistance(first: AtomNode, second: AtomNode, boardSize: { width: number; height: number }) {
  const dx = ((first.x - second.x) / 100) * boardSize.width;
  const dy = ((first.y - second.y) / 100) * boardSize.height;

  return Math.sqrt(dx * dx + dy * dy);
}

function getExistingBond(firstId: string, secondId: string, bonds: AtomBond[]) {
  const pairKey = getBondKey(firstId, secondId);

  return bonds.find((bond) => getBondKey(bond.from, bond.to) === pairKey);
}

function getBondPrompt(
  atoms: AtomNode[],
  bonds: AtomBond[],
  boardSize: { width: number; height: number },
  ignoredPairs: Set<string>,
): BondPrompt | null {
  if (boardSize.width === 0 || boardSize.height === 0) {
    return null;
  }

  let firstBlockedPrompt: BondPrompt | null = null;

  for (let firstIndex = 0; firstIndex < atoms.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < atoms.length; secondIndex += 1) {
      const first = atoms[firstIndex];
      const second = atoms[secondIndex];
      const pairKey = getBondKey(first.id, second.id);

      if (
        ignoredPairs.has(pairKey) ||
        getExistingBond(first.id, second.id, bonds) ||
        getDistance(first, second, boardSize) > BOND_DISTANCE_PX
      ) {
        continue;
      }

      if (canFormBond(first.id, second.id, atoms, bonds)) {
        return {
          status: "pending",
          firstId: first.id,
          secondId: second.id,
          pairKey,
        };
      }

      const blockedDetails = getBlockedBondDetails(first, second, atoms, bonds);

      if (blockedDetails && !firstBlockedPrompt) {
        firstBlockedPrompt = {
          status: "blocked",
          firstId: first.id,
          secondId: second.id,
          pairKey,
          ...blockedDetails,
        };
      }
    }
  }

  return firstBlockedPrompt;
}

function getBlockedBondDetails(first: AtomNode, second: AtomNode, atoms: AtomNode[], bonds: AtomBond[]) {
  const firstDefinition = ATOM_ELEMENTS[first.element];
  const secondDefinition = ATOM_ELEMENTS[second.element];
  const involvesMetal = firstDefinition.family === "metal" || secondDefinition.family === "metal";

  if (involvesMetal && getBondKind(first.element, second.element) !== "ionic") {
    return {
      reason:
        "Dalam simulator ini, atom logam hanya dibenarkan membentuk pasangan ionik Na-Cl. Pilih Na dan Cl untuk membina sebatian ionik.",
    };
  }

  const fullAtoms = [first, second].filter((atom) => {
    const definition = ATOM_ELEMENTS[atom.element];
    return countAtomBonds(atom.id, bonds) >= definition.valency;
  });

  if (!fullAtoms.length) {
    return {
      reason: "Ikatan ini tidak menepati aturan valensi yang ditetapkan dalam simulator.",
    };
  }

  const suggestedBond = getSuggestedBondToBreak(fullAtoms, bonds);
  const isWaterAttempt = [first.element, second.element].includes("H") && [first.element, second.element].includes("O");
  const reason = isWaterAttempt
    ? "Hidrogen dalam H-H sudah cukup satu ikatan. Untuk bina H2O, putuskan H-H dahulu, kemudian ikat O dengan dua atom H secara berasingan."
    : `${formatFullAtoms(fullAtoms, bonds)} sudah mencapai valensi maksimum. Putuskan ikatan sedia ada dahulu atau gerakkan atom lain yang masih boleh berikatan.`;

  return {
    reason,
    suggestedBondId: suggestedBond?.id,
    suggestedBondLabel: suggestedBond ? getBondLabel(suggestedBond, atoms) : undefined,
  };
}

function getSuggestedBondToBreak(fullAtoms: AtomNode[], bonds: AtomBond[]) {
  const fullAtomIds = new Set(fullAtoms.map((atom) => atom.id));
  const candidateBonds = bonds.filter((bond) => fullAtomIds.has(bond.from) || fullAtomIds.has(bond.to));

  return candidateBonds.length === 1 ? candidateBonds[0] : undefined;
}

function countAtomBonds(atomId: string, bonds: AtomBond[]) {
  return bonds.filter((bond) => bond.from === atomId || bond.to === atomId).length;
}

function formatFullAtoms(fullAtoms: AtomNode[], bonds: AtomBond[]) {
  return fullAtoms
    .map((atom) => {
      const definition = ATOM_ELEMENTS[atom.element];
      return `${definition.name} (${definition.symbol}) dengan ${countAtomBonds(atom.id, bonds)} ikatan`;
    })
    .join(" dan ");
}

function getBondLabel(bond: AtomBond, atoms: AtomNode[]) {
  const first = atoms.find((atom) => atom.id === bond.from);
  const second = atoms.find((atom) => atom.id === bond.to);

  return first && second ? `${first.element}-${second.element}` : "ikatan";
}

function getUpdatedAtoms(atoms: AtomNode[], updates: Record<string, Position>) {
  return atoms.map((atom) => {
    const update = updates[atom.id];
    return update ? { ...atom, ...update } : atom;
  });
}

function getBondStyle(first: AtomNode, second: AtomNode, boardSize: { width: number; height: number }) {
  const firstX = (first.x / 100) * boardSize.width;
  const firstY = (first.y / 100) * boardSize.height;
  const secondX = (second.x / 100) * boardSize.width;
  const secondY = (second.y / 100) * boardSize.height;
  const deltaX = secondX - firstX;
  const deltaY = secondY - firstY;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  return {
    left: `${first.x}%`,
    top: `${first.y}%`,
    width: `${length}px`,
    transform: `rotate(${angle}deg)`,
  } as CSSProperties;
}

function getAtomCharge(atom: AtomNode, bonds: AtomBond[]) {
  const hasIonicBond = bonds.some((bond) => bond.kind === "ionic" && (bond.from === atom.id || bond.to === atom.id));

  if (!hasIonicBond) {
    return "";
  }

  if (atom.element === "Na") {
    return "+";
  }

  if (atom.element === "Cl") {
    return "-";
  }

  return "";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
