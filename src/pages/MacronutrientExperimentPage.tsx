import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import ComparisonPanel from "../components/macronutrient/ComparisonPanel";
import MacronutrientLab from "../components/macronutrient/MacronutrientLab";
import SolutionSelector from "../components/macronutrient/SolutionSelector";
import {
  EXPERIMENT_SETS,
  MACRONUTRIENT_CRITICAL_ASSETS,
  PLANT_CHECKPOINTS,
  SOLUTION_BY_ID,
  createEmptySelections,
  getPlantAsset,
  type ExperimentSetId,
  type SolutionSelections,
  type SolutionType,
} from "../data/macronutrientExperimentData";
import "./MacronutrientExperimentPage.css";

type ExperimentPhase = "setup" | "running" | "paused" | "complete" | "compare";
type LightPhase = "morning" | "midday" | "evening" | "night";
type Speed = 1 | 2 | 4;

const NORMAL_DURATION_SECONDS = 30;

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function getClockDisplay(day: number) {
  const totalHours = 8 + day * 24;
  const hour = Math.floor(totalHours) % 24;
  const minutes = Math.floor((totalHours % 1) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getLightPhase(day: number): LightPhase {
  const hour = (8 + day * 24) % 24;
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "midday";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function getLightLabel(lightPhase: LightPhase) {
  if (lightPhase === "morning") return "☀️ Pagi";
  if (lightPhase === "midday") return "🌤️ Tengah hari";
  if (lightPhase === "evening") return "🌇 Petang";
  return "🌙 Malam";
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="macro-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="macro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="macro-modal-title"
        tabIndex={-1}
      >
        <header>
          <h2 id="macro-modal-title">{title}</h2>
          <button type="button" aria-label="Tutup" onClick={onClose}>×</button>
        </header>
        {children}
      </div>
    </div>
  );
}

function SimulationClock({ day, lightPhase }: { day: number; lightPhase: LightPhase }) {
  return (
    <div className="macro-clock" aria-label={`Hari ${Math.floor(day)}, ${getClockDisplay(day)}`}>
      <div className="macro-calendar">
        <span>HARI</span>
        <strong>{Math.min(14, Math.floor(day))}</strong>
      </div>
      <div className="macro-clock__time">
        <strong>{getClockDisplay(day)}</strong>
        <span>{getLightLabel(lightPhase)}</span>
      </div>
    </div>
  );
}

function TimeControls({
  phase,
  speed,
  canStart,
  onStart,
  onPause,
  onResume,
  onSpeedChange,
}: {
  phase: ExperimentPhase;
  speed: Speed;
  canStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSpeedChange: (speed: Speed) => void;
}) {
  const isRunning = phase === "running";
  const canControl = phase === "running" || phase === "paused";

  return (
    <div className="macro-time-controls" aria-label="Kawalan masa eksperimen">
      {phase === "setup" ? (
        <button className="macro-primary" type="button" disabled={!canStart} onClick={onStart}>
          <span aria-hidden="true">▶</span> Mulakan eksperimen
        </button>
      ) : canControl ? (
        <button
          className="macro-play-pause"
          type="button"
          onClick={isRunning ? onPause : onResume}
          aria-label={isRunning ? "Jeda eksperimen" : "Sambung eksperimen"}
        >
          {isRunning ? "❚❚ Jeda" : "▶ Sambung"}
        </button>
      ) : (
        <span className="macro-finished-label">✓ Eksperimen selesai</span>
      )}
      <div className="macro-speed" aria-label="Kelajuan eksperimen">
        <span>Kelajuan</span>
        {([1, 2, 4] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={speed === value}
            disabled={!canControl}
            onClick={() => onSpeedChange(value)}
          >
            {value}×
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MacronutrientExperimentPage({
  reviewPanel,
}: {
  reviewPanel?: ReactNode;
}) {
  const [selections, setSelections] = useState<SolutionSelections>(createEmptySelections);
  const [selectedSolution, setSelectedSolution] = useState<SolutionType | null>(null);
  const [pouringSet, setPouringSet] = useState<ExperimentSetId | null>(null);
  const [phase, setPhase] = useState<ExperimentPhase>("setup");
  const [day, setDay] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetFailures, setAssetFailures] = useState(0);
  const [feedback, setFeedback] = useState("Pilih satu botol larutan untuk bermula.");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [observedSet, setObservedSet] = useState<ExperimentSetId | null>(null);
  const [showReason, setShowReason] = useState(false);
  const dayRef = useRef(0);
  const speedRef = useRef<Speed>(1);
  const pourTimerRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const allSetsReady = EXPERIMENT_SETS.every((setId) => selections[setId]);
  const lightPhase = getLightPhase(day);
  const observedSolution = observedSet ? selections[observedSet] : null;
  const progress = Math.min(100, (day / 14) * 100);

  useEffect(() => {
    let active = true;
    Promise.allSettled(
      MACRONUTRIENT_CRITICAL_ASSETS.map(
        (source) =>
          new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(source));
            image.src = source;
          }),
      ),
    ).then((results) => {
      if (!active) return;
      const failures = results.filter((result) => result.status === "rejected").length;
      setAssetFailures(failures);
      setAssetsReady(true);
    });

    return () => {
      active = false;
      if (pourTimerRef.current) window.clearTimeout(pourTimerRef.current);
    };
  }, []);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    let animationFrame = 0;
    let previousTimestamp = performance.now();

    const advance = (timestamp: number) => {
      const elapsedSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.1);
      previousTimestamp = timestamp;
      const dayIncrease =
        elapsedSeconds * (14 / NORMAL_DURATION_SECONDS) * speedRef.current;
      const nextDay = Math.min(14, dayRef.current + dayIncrease);
      dayRef.current = nextDay;
      setDay(nextDay);

      if (nextDay >= 14) {
        setPhase("complete");
        setFeedback("Eksperimen selesai. Perhatikan empat pokok sebelum membandingkan.");
        return;
      }
      animationFrame = window.requestAnimationFrame(advance);
    };

    animationFrame = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [phase]);

  const selectSolution = (solution: SolutionType) => {
    if (phase !== "setup") return;
    setSelectedSolution(solution);
    setFeedback(`${SOLUTION_BY_ID[solution].label} dipilih. Klik Set A, B, C atau D.`);
  };

  const assignSolution = (setId: ExperimentSetId) => {
    if (phase !== "setup") return;
    if (!selectedSolution) {
      setFeedback("Pilih satu botol larutan dahulu, kemudian klik set yang dikehendaki.");
      return;
    }

    if (pourTimerRef.current) window.clearTimeout(pourTimerRef.current);
    setPouringSet(setId);
    setSelections((current) => ({ ...current, [setId]: selectedSolution }));
    setFeedback(
      `${SOLUTION_BY_ID[selectedSolution].label} dimasukkan ke dalam Set ${setId}. Anda boleh menukarnya sebelum eksperimen bermula.`,
    );
    pourTimerRef.current = window.setTimeout(() => setPouringSet(null), reducedMotion ? 80 : 720);
  };

  const startExperiment = () => {
    if (!allSetsReady || !assetsReady) return;
    dayRef.current = 0;
    setDay(0);
    setPhase("running");
    setFeedback("Pam udara dihidupkan. Masa eksperimen sedang dipercepatkan.");
  };

  const pauseExperiment = () => {
    setPhase("paused");
    setFeedback(`Eksperimen dijeda pada Hari ${Math.floor(day)}. Semua perubahan dihentikan.`);
  };

  const resumeExperiment = () => {
    setPhase("running");
    setFeedback("Eksperimen disambung.");
  };

  const resetExperiment = () => {
    dayRef.current = 0;
    speedRef.current = 1;
    setSelections(createEmptySelections());
    setSelectedSolution(null);
    setPouringSet(null);
    setPhase("setup");
    setDay(0);
    setSpeed(1);
    setObservedSet(null);
    setShowReason(false);
    setResetModalOpen(false);
    setFeedback("Pilih satu botol larutan untuk bermula.");
  };

  const openObservation = (setId: ExperimentSetId) => {
    setObservedSet(setId);
    setShowReason(false);
  };

  const statusLabel = useMemo(() => {
    if (!assetsReady) return "Memuatkan makmal…";
    if (phase === "setup") return allSetsReady ? "Empat set sedia" : "Sediakan empat set";
    if (phase === "running") return "Eksperimen berjalan";
    if (phase === "paused") return "Eksperimen dijeda";
    return "Hari 14 · Selesai";
  }, [allSetsReady, assetsReady, phase]);

  return (
    <main className="macro-page">
      <header className="macro-header">
        <a className="macro-brand" href="/simulator" aria-label="Kembali ke senarai simulator EduSim">
          <span aria-hidden="true">E</span>
          <div><strong>EduSim</strong><small>Sains Tingkatan 5</small></div>
        </a>
        <div className="macro-title">
          <span>Eksperimen 2.2</span>
          <h1>Kesan Kekurangan Makronutrien terhadap Pertumbuhan Tumbuhan</h1>
        </div>
        <button type="button" className="macro-reset" onClick={() => setResetModalOpen(true)}>
          ↻ Set semula
        </button>
      </header>

      <section className="macro-workspace">
        <div className="macro-scene-panel">
          <div className="macro-scene-panel__topbar">
            <div><span>MAKMAL MAYA</span><strong>{statusLabel}</strong></div>
            <SimulationClock day={day} lightPhase={lightPhase} />
          </div>
          <MacronutrientLab
            selections={selections}
            selectedSolution={selectedSolution}
            pouringSet={pouringSet}
            day={day}
            phase={phase}
            lightPhase={lightPhase}
            reducedMotion={reducedMotion}
            onSetClick={assignSolution}
          />
          <div className="macro-timeline" aria-label={`Kemajuan eksperimen ${Math.round(progress)} peratus`}>
            <div className="macro-timeline__track"><span style={{ width: `${progress}%` }} /></div>
            <div className="macro-timeline__checkpoints">
              {PLANT_CHECKPOINTS.map((checkpoint) => (
                <span className={day >= checkpoint ? "is-reached" : ""} key={checkpoint}>
                  <i /> Hari {checkpoint}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="macro-control-panel" aria-label="Panel kawalan eksperimen">
          <SolutionSelector
            selected={selectedSolution}
            disabled={phase !== "setup"}
            onSelect={selectSolution}
          />

          <section className="macro-setup-summary" aria-labelledby="macro-setup-heading">
            <div className="macro-section-heading">
              <span>LANGKAH 2</span>
              <div><h2 id="macro-setup-heading">Sediakan empat set</h2><p>Setiap set boleh menerima mana-mana larutan.</p></div>
            </div>
            <div className="macro-set-summary">
              {EXPERIMENT_SETS.map((setId) => {
                const selection = selections[setId];
                return (
                  <button
                    type="button"
                    key={setId}
                    disabled={phase !== "setup"}
                    onClick={() => assignSolution(setId)}
                  >
                    <strong>SET {setId}</strong>
                    <span>{selection ? SOLUTION_BY_ID[selection].shortLabel : "Belum dipilih"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="macro-run-panel" aria-labelledby="macro-run-heading">
            <div className="macro-section-heading">
              <span>LANGKAH 3</span>
              <div><h2 id="macro-run-heading">Jalankan eksperimen</h2><p>Hari 0 hingga Hari 14 dalam sekitar 30 saat pada 1×.</p></div>
            </div>
            <TimeControls
              phase={phase}
              speed={speed}
              canStart={allSetsReady && assetsReady}
              onStart={startExperiment}
              onPause={pauseExperiment}
              onResume={resumeExperiment}
              onSpeedChange={setSpeed}
            />
            {!allSetsReady && phase === "setup" ? (
              <p className="macro-hint">Pilih larutan untuk semua set terlebih dahulu.</p>
            ) : null}
            {!assetsReady ? <p className="macro-loading">Memuatkan semua state tumbuhan…</p> : null}
            {assetFailures > 0 ? (
              <p className="macro-asset-warning" role="status">
                {assetFailures} aset gagal dipramuat. Simulator akan menggunakan state terdekat jika perlu.
              </p>
            ) : null}
          </section>

          <p className="macro-feedback" role="status" aria-live="polite">{feedback}</p>

          {(phase === "complete" || phase === "compare") ? (
            <button
              className="macro-compare-button"
              type="button"
              onClick={() => {
                setPhase("compare");
                document.getElementById("macro-comparison")?.scrollIntoView({
                  behavior: reducedMotion ? "auto" : "smooth",
                  block: "start",
                });
              }}
            >
              Bandingkan empat set →
            </button>
          ) : null}
        </aside>
      </section>

      {phase === "compare" ? (
        <div id="macro-comparison">
          <ComparisonPanel selections={selections} onObserve={openObservation} />
        </div>
      ) : null}

      <section className="macro-learning-note">
        <span aria-hidden="true">◉</span>
        <p><strong>Fokus pemerhatian:</strong> bandingkan saiz daun, warna daun dan perkembangan akar antara set. Tiada markah atau jawapan wajib.</p>
      </section>

      {reviewPanel ? <div className="macro-review">{reviewPanel}</div> : null}

      {resetModalOpen ? (
        <Modal title="Mulakan eksperimen semula?" onClose={() => setResetModalOpen(false)}>
          <p>Semua pilihan larutan, masa, pertumbuhan dan paparan perbandingan akan kembali ke Hari 0.</p>
          <div className="macro-modal__actions">
            <button type="button" onClick={() => setResetModalOpen(false)}>Batal</button>
            <button className="macro-primary" type="button" onClick={resetExperiment}>Set semula</button>
          </div>
        </Modal>
      ) : null}

      {observedSet && observedSolution ? (
        <Modal title={`Set ${observedSet} · ${SOLUTION_BY_ID[observedSolution].label}`} onClose={() => setObservedSet(null)}>
          <div className="macro-observation">
            <div className="macro-observation__plant">
              <img
                src={getPlantAsset(observedSolution, 14)}
                alt={`Pokok jagung Set ${observedSet} pada Hari 14`}
                width="480"
                height="520"
              />
              <span>Daun</span><span>Batang</span><span>Akar</span>
            </div>
            <div className="macro-observation__content">
              <span>HARI 14</span>
              <h3>Perhatikan dahulu</h3>
              <ul><li>Warna dan keadaan daun</li><li>Saiz serta bentuk batang</li><li>Panjang dan kepadatan akar</li></ul>
              {showReason ? (
                <div className="macro-reason">
                  <strong>{SOLUTION_BY_ID[observedSolution].nutrient}</strong>
                  <p>{SOLUTION_BY_ID[observedSolution].explanation}</p>
                </div>
              ) : (
                <button className="macro-primary" type="button" onClick={() => setShowReason(true)}>
                  Ketahui sebab
                </button>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}
