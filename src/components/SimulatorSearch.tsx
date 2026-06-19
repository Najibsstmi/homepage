import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SIMULATORS,
  type SimulatorLevel,
  type SimulatorMetadata,
} from "../data/simulators";

type SimulatorFilter = "all" | SimulatorLevel;

interface SimulatorSearchProps {
  onOpenSimulator: (path: string) => void;
}

const FILTERS: ReadonlyArray<{ label: string; value: SimulatorFilter }> = [
  { label: "Semua", value: "all" },
  { label: "Tingkatan 4", value: 4 },
  { label: "Tingkatan 5", value: 5 },
];

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ms-MY")
    .trim();
}

function getSearchScore(simulator: SimulatorMetadata, query: string) {
  if (!query) {
    return 1;
  }

  const terms = query.split(/\s+/).filter(Boolean);
  const fields = [
    { value: simulator.title, weight: 8 },
    { value: simulator.topik ?? "", weight: 6 },
    { value: simulator.bab ?? "", weight: 5 },
    { value: simulator.description, weight: 3 },
    { value: `Tingkatan ${simulator.tingkatan}`, weight: 4 },
    { value: simulator.keywords.join(" "), weight: 7 },
  ].map((field) => ({ ...field, value: normalizeSearchText(field.value) }));

  if (!terms.every((term) => fields.some((field) => field.value.includes(term)))) {
    return 0;
  }

  return fields.reduce(
    (score, field) =>
      score + terms.filter((term) => field.value.includes(term)).length * field.weight,
    0,
  );
}

export function SimulatorSearch({ onOpenSimulator }: SimulatorSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SimulatorFilter>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const normalizedQuery = normalizeSearchText(query);
  const results = useMemo(
    () =>
      SIMULATORS.map((simulator, index) => ({
        simulator,
        index,
        score: getSearchScore(simulator, normalizedQuery),
      }))
        .filter(
          ({ simulator, score }) =>
            score > 0 && (filter === "all" || simulator.tingkatan === filter),
        )
        .sort((first, second) => second.score - first.score || first.index - second.index)
        .map(({ simulator }) => simulator),
    [filter, normalizedQuery],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href]',
        );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const openResult = (simulator: SimulatorMetadata) => {
    setIsOpen(false);
    setQuery("");
    onOpenSimulator(simulator.path);
  };

  const dialog = isOpen ? (
    <div
      className="simulatorSearchOverlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeSearch();
        }
      }}
    >
      <section
        ref={panelRef}
        className="simulatorSearchPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulator-search-title"
      >
        <header className="simulatorSearchPanel__header">
          <div>
            <span className="simulatorSearchPanel__eyebrow">EduSim</span>
            <h2 id="simulator-search-title">Cari simulator</h2>
            <p>Taip konsep, topik atau tingkatan yang ingin diteroka.</p>
          </div>
          <button
            className="simulatorSearchPanel__close"
            type="button"
            aria-label="Tutup carian simulator"
            onClick={closeSearch}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="simulatorSearchPanel__inputWrap">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Contoh: atom, daya, Pascal..."
            aria-label="Kata kunci simulator"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}>
              Padam
            </button>
          )}
        </div>

        <div className="simulatorSearchPanel__filters" aria-label="Tapis tingkatan">
          {FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={filter === option.value ? "is-active" : ""}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="simulatorSearchPanel__status" role="status" aria-live="polite">
          <strong>{results.length}</strong> simulator dijumpai
          {normalizedQuery ? ` untuk “${query.trim()}”` : ""}
        </div>

        <div className="simulatorSearchResults">
          {results.length > 0 ? (
            results.map((simulator) => (
              <a
                className="simulatorSearchResult"
                href={simulator.path}
                key={simulator.id}
                onClick={(event) => {
                  event.preventDefault();
                  openResult(simulator);
                }}
              >
                <div className="simulatorSearchResult__image" aria-hidden="true">
                  {simulator.image ? (
                    <img src={simulator.image} alt="" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 3h6M10 9l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3h-4v6Z" />
                      <path d="M8 15h8" />
                    </svg>
                  )}
                </div>
                <div className="simulatorSearchResult__content">
                  <div className="simulatorSearchResult__badges">
                    <span>Tingkatan {simulator.tingkatan}</span>
                    {simulator.bab && <span>{simulator.bab}</span>}
                    {simulator.topik && <span>{simulator.topik}</span>}
                  </div>
                  <h3>{simulator.title}</h3>
                  <p>{simulator.description}</p>
                </div>
                <span className="simulatorSearchResult__action">
                  Buka Simulator <span aria-hidden="true">→</span>
                </span>
              </a>
            ))
          ) : (
            <div className="simulatorSearchResults__empty">
              <span aria-hidden="true">⌕</span>
              <h3>Tiada simulator dijumpai.</h3>
              <p>Cuba kata kunci lain atau pilih semula filter tingkatan.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        className="simulatorSearchTrigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <span>Cari Simulator</span>
      </button>
      {typeof document !== "undefined" && dialog
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
