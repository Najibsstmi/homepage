import type { CSSProperties, DragEvent } from "react";
import {
  ATOM_ELEMENTS,
  type ElementSymbol,
} from "../../data/atomSimulator/CompoundDatabase";

type AtomPanelProps = {
  onAddAtom: (element: ElementSymbol) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, element: ElementSymbol) => void;
  onClear: () => void;
};

const panelOrder: ElementSymbol[] = ["H", "O", "C", "N", "Na", "Cl"];

export default function AtomPanel({ onAddAtom, onDragStart, onClear }: AtomPanelProps) {
  return (
    <aside className="atomPanel atomSimPanel" aria-label="Panel atom">
      <div className="atomPanel__header">
        <span>Panel Atom</span>
        <strong>6 unsur</strong>
      </div>

      <div className="atomPalette">
        {panelOrder.map((symbol) => {
          const element = ATOM_ELEMENTS[symbol];
          const style = {
            "--atom-start": element.colorStart,
            "--atom-end": element.colorEnd,
          } as CSSProperties;

          return (
            <button
              key={symbol}
              type="button"
              draggable
              className="atomPalette__item"
              style={style}
              onClick={() => onAddAtom(symbol)}
              onDragStart={(event) => onDragStart(event, symbol)}
            >
              <span className="atomPalette__orb">{element.symbol}</span>
              <span className="atomPalette__name">{element.name}</span>
            </button>
          );
        })}
      </div>

      <button className="atomPanel__clear" type="button" onClick={onClear}>
        Kosongkan papan
      </button>
    </aside>
  );
}
