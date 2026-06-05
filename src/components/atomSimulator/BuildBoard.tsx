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

const atomRadiusPx = 30;

export default function BuildBoard({
  atoms,
  bonds,
  analysis,
  onAddAtomAt,
  onMoveAtoms,
  onCreateBond,
  onRemoveAtoms,
  onClear,
}: BuildBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [pendingBond, setPendingBond] = useState<PendingBond | null>(null);
  const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(() => new Set());
  const [draggingGroup, setDraggingGroup] = useState<string[]>([]);
  const [deleteHover, setDeleteHover] = useState(false);

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

  useEffect(() => {
    if (pendingBond || boardSize.width === 0 || boardSize.height === 0) {
      return;
    }

    for (let firstIndex = 0; firstIndex < atoms.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < atoms.length; secondIndex += 1) {
        const first = atoms[firstIndex];
        const second = atoms[secondIndex];
        const pairKey = getBondKey(first.id, second.id);

        if (ignoredPairs.has(pairKey) || !canFormBond(first.id, second.id, atoms, bonds)) {
          continue;
        }

        if (getDistance(first, second, boardSize) <= BOND_DISTANCE_PX) {
          setPendingBond({ firstId: first.id, secondId: second.id, pairKey });
          return;
        }
      }
    }
  }, [atoms, bonds, boardSize, ignoredPairs, pendingBond]);

  useEffect(() => {
    if (boardSize.width === 0 || boardSize.height === 0) {
      return;
    }

    setIgnoredPairs((current) => {
      const next = new Set<string>();

      current.forEach((pairKey) => {
        const [firstId, secondId] = pairKey.split(":");
        const first = atomMap.get(firstId);
        const second = atomMap.get(secondId);

        if (first && second && getDistance(first, second, boardSize) < BOND_DISTANCE_PX + 24) {
          next.add(pairKey);
        }
      });

      return next;
    });
  }, [atomMap, boardSize]);

  const connectedGroups = useMemo(() => getConnectedGroups(atoms, bonds), [atoms, bonds]);

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

    const groupIds = getMoleculeGroup(atom.id, atoms, bonds);
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
    onMoveAtoms(updates);
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
    if (!pendingBond) {
      return;
    }

    onCreateBond(pendingBond.firstId, pendingBond.secondId);
    setPendingBond(null);
  };

  const rejectBond = () => {
    if (!pendingBond) {
      return;
    }

    setIgnoredPairs((current) => new Set(current).add(pendingBond.pairKey));
    setPendingBond(null);
  };

  const pendingFirst = pendingBond ? atomMap.get(pendingBond.firstId) : undefined;
  const pendingSecond = pendingBond ? atomMap.get(pendingBond.secondId) : undefined;
  const pendingKind = pendingFirst && pendingSecond ? getBondKind(pendingFirst.element, pendingSecond.element) : "covalent";

  return (
    <section className="atomBuildPanel atomSimPanel">
      <div className="atomBuildPanel__header">
        <div>
          <span>Papan Binaan</span>
          <strong>
            <ChemicalFormula value={analysis.formula} />
          </strong>
        </div>
        <button type="button" onClick={onClear} disabled={!atoms.length}>
          Reset
        </button>
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
            <span>Seret atom ke kawasan putih untuk mula membina model zarah.</span>
          </div>
        )}

        <div className="atomBondLayer" aria-hidden="true">
          {bonds.map((bond) => {
            const first = atomMap.get(bond.from);
            const second = atomMap.get(bond.to);

            if (!first || !second) {
              return null;
            }

            const style = getBondStyle(first, second, boardSize);

            return (
              <span
                key={bond.id}
                className={`atomBondLine atomBondLine--${bond.kind}`}
                style={style}
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

        {pendingBond && pendingFirst && pendingSecond && (
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
