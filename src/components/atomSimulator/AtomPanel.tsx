import { useEffect, useState, type CSSProperties, type DragEvent } from "react";
import {
  ATOM_ELEMENTS,
  type ElementSymbol,
} from "../../data/atomSimulator/CompoundDatabase";

type AtomPanelProps = {
  onTapAtom: (element: ElementSymbol) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, element: ElementSymbol) => void;
  onClear: () => void;
};

const panelOrder: ElementSymbol[] = ["H", "O", "C", "N", "Na", "Cl"];

export default function AtomPanel({ onTapAtom, onDragStart, onClear }: AtomPanelProps) {
  const [isTapMode, setIsTapMode] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const updateMode = () => setIsTapMode(query.matches);

    updateMode();
    query.addEventListener("change", updateMode);

    return () => query.removeEventListener("change", updateMode);
  }, []);

  return (
    <aside className="atomPanel atomSimPanel" aria-label="Panel atom">
      <div className="atomPanel__header">
        <span>Panel Atom</span>
        <strong>6 unsur</strong>
      </div>

      <p className="atomPanel__hint">
        <span className="atomInstructionDesktop">Seret atom ke papan binaan</span>
        <span className="atomInstructionMobile">Tekan atom untuk menambah ke papan binaan</span>
      </p>

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
              draggable={!isTapMode}
              className="atomPalette__item"
              style={style}
              onClick={() => {
                if (isTapMode) {
                  onTapAtom(symbol);
                }
              }}
              onDragStart={(event) => {
                if (isTapMode) {
                  event.preventDefault();
                  return;
                }

                onDragStart(event, symbol);
              }}
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
