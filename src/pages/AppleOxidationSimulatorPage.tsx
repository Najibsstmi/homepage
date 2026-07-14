import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, ReactNode } from "react";
import {
  APPLE_COLOR_LABELS,
  APPLE_OXIDATION_ASSETS,
  EXPERIMENT_STEPS,
  OBSERVATION_OPTIONS,
  POST_EXPERIMENT_QUIZ,
  SOLUTION_TREATMENTS,
  TREATMENTS,
  VARIABLE_OPTIONS,
  type AppleColorStage,
  type ObservationAnswer,
  type Treatment,
  type TreatmentId,
} from "../data/appleOxidationData";
import "./AppleOxidationSimulatorPage.css";

type SolutionTreatmentId = Exclude<TreatmentId, "control">;
type ExperimentPhase =
  | "variables"
  | "cutting"
  | "control"
  | "immersing"
  | "soaking"
  | "transferring"
  | "exposing"
  | "observing"
  | "conclusion"
  | "quiz"
  | "complete";
type SliceLocation =
  | "hidden"
  | "prep"
  | `beaker-${SolutionTreatmentId}`
  | `petri-${TreatmentId}`;
type TargetLocation = `beaker-${SolutionTreatmentId}` | `petri-${TreatmentId}`;
type VariableField = "manipulated" | "responding" | "controlled";
type VariableFeedback = "idle" | "correct" | "incorrect";
type ModalKind = "instructions" | "info" | "reset" | null;
type ToneKind = "click" | "success" | "error" | "done";
type IconName =
  | "book"
  | "info"
  | "volume"
  | "volumeOff"
  | "reset"
  | "check"
  | "timer"
  | "flask"
  | "knife"
  | "menu"
  | "x";

const SOAK_REAL_MS = 7000;
const AIR_REAL_MS = 14000;
const TREATMENT_BY_ID = Object.fromEntries(
  TREATMENTS.map((treatment) => [treatment.id, treatment]),
) as Record<TreatmentId, Treatment>;
const SOLUTION_IDS = SOLUTION_TREATMENTS.map(
  (treatment) => treatment.id,
) as SolutionTreatmentId[];
const PHASE_ORDER: Record<ExperimentPhase, number> = {
  variables: 0,
  cutting: 1,
  control: 2,
  immersing: 3,
  soaking: 4,
  transferring: 5,
  exposing: 6,
  observing: 7,
  conclusion: 8,
  quiz: 9,
  complete: 10,
};
const INITIAL_VARIABLE_ANSWERS: Record<VariableField, string> = {
  manipulated: "",
  responding: "",
  controlled: "",
};
const INITIAL_CONCLUSION_ANSWERS = {
  leastChanged: "",
  slowsOxidation: "",
  hypothesis: "",
};

function createSliceLocations(location: SliceLocation) {
  return Object.fromEntries(
    TREATMENTS.map((treatment) => [treatment.id, location]),
  ) as Record<TreatmentId, SliceLocation>;
}

function createObservationAnswers() {
  return Object.fromEntries(
    TREATMENTS.map((treatment) => [treatment.id, ""]),
  ) as Record<TreatmentId, ObservationAnswer | "">;
}

function createBooleanRecord(value: boolean | null) {
  return Object.fromEntries(
    TREATMENTS.map((treatment) => [treatment.id, value]),
  ) as Record<TreatmentId, boolean | null>;
}

function normalizeAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ms-MY")
    .trim();
}

function getTargetTreatment(target: TargetLocation) {
  return target.replace(/^beaker-|^petri-/, "") as TreatmentId;
}

function formatSoakTimer(progress: number) {
  const seconds = Math.min(60, Math.round(progress * 60));
  return `00:${String(seconds).padStart(2, "0")}`;
}

function getAirMinuteLabel(progress: number) {
  const minute = Math.min(15, Math.round(progress * 15));
  if (minute < 3) return "0 minit";
  if (minute < 8) return "5 minit";
  if (minute < 13) return "10 minit";
  return "15 minit";
}

function getPhaseInstruction(phase: ExperimentPhase) {
  if (phase === "variables") {
    return "Lengkapkan pemboleh ubah dahulu untuk membuka ruang eksperimen.";
  }
  if (phase === "cutting") {
    return "Tekan Potong Epal untuk menyediakan lima hirisan sama saiz.";
  }
  if (phase === "control") {
    return "Pilih hirisan Kawalan, kemudian klik piring Petri Kawalan.";
  }
  if (phase === "immersing") {
    return "Pindahkan setiap hirisan ke bikar larutan yang sepadan.";
  }
  if (phase === "soaking") {
    return "Rendaman sedang berjalan. Semua tindakan dikunci sementara.";
  }
  if (phase === "transferring") {
    return "Gunakan forseps secara simulasi: pilih hirisan dalam bikar, kemudian klik piring Petri sepadan.";
  }
  if (phase === "exposing") {
    return "Perhatikan perubahan warna semasa hirisan terdedah kepada udara.";
  }
  if (phase === "observing") {
    return "Rekod pemerhatian dalam jadual keputusan.";
  }
  if (phase === "conclusion") {
    return "Lengkapkan kesimpulan berdasarkan pemerhatian.";
  }
  if (phase === "quiz") {
    return "Jawab kuiz pasca eksperimen untuk menguji kefahaman.";
  }
  return "Eksperimen selesai. Anda boleh tetapkan semula untuk ulang kaji.";
}

function getStageBlend(
  treatment: Treatment,
  phase: ExperimentPhase,
  airProgress: number,
): { from: AppleColorStage; to: AppleColorStage; mix: number } {
  if (phase === "exposing") {
    const position = Math.min(3, Math.max(0, airProgress * 3));
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(3, lowerIndex + 1);
    return {
      from: treatment.colorStages[lowerIndex],
      to: treatment.colorStages[upperIndex],
      mix: position - lowerIndex,
    };
  }

  if (PHASE_ORDER[phase] >= PHASE_ORDER.observing) {
    return {
      from: treatment.colorStages[3],
      to: treatment.colorStages[3],
      mix: 0,
    };
  }

  return { from: "fresh", to: "fresh", mix: 0 };
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H7a3 3 0 0 0-3 3V5.5Z" />
        <path d="M4 18a3 3 0 0 1 3-3h13" />
        <path d="M8 7h7" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6" />
        <path d="M12 7h.01" />
      </>
    ),
    volume: (
      <>
        <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
        <path d="M16 9a4 4 0 0 1 0 6" />
        <path d="M18.5 6.5a8 8 0 0 1 0 11" />
      </>
    ),
    volumeOff: (
      <>
        <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
        <path d="m17 9 4 4" />
        <path d="m21 9-4 4" />
      </>
    ),
    reset: (
      <>
        <path d="M4 12a8 8 0 1 0 2.4-5.7" />
        <path d="M4 4v6h6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    timer: (
      <>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 13 15 10" />
        <path d="M9 2h6" />
      </>
    ),
    flask: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v5l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
        <path d="M8 15h8" />
      </>
    ),
    knife: (
      <>
        <path d="M14 3 4 13l7 7L21 10V3h-7Z" />
        <path d="m4 13 7 7" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

function SliceVisual({
  alt,
  blend,
  className = "",
}: {
  alt: string;
  blend: { from: AppleColorStage; to: AppleColorStage; mix: number };
  className?: string;
}) {
  const showNext = blend.to !== blend.from && blend.mix > 0.02;

  return (
    <span className={`appleOxidationSliceVisual ${className}`.trim()}>
      <img
        src={APPLE_OXIDATION_ASSETS.sliceStages[blend.from]}
        alt={alt}
        draggable="false"
        loading="lazy"
        decoding="async"
        style={{ opacity: showNext ? 1 - blend.mix : 1 }}
      />
      {showNext && (
        <img
          className="appleOxidationSliceVisual__next"
          src={APPLE_OXIDATION_ASSETS.sliceStages[blend.to]}
          alt=""
          aria-hidden="true"
          draggable="false"
          loading="lazy"
          decoding="async"
          style={{ opacity: blend.mix }}
        />
      )}
    </span>
  );
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
  return (
    <div
      className="appleOxidationModalBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="appleOxidationModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apple-oxidation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="apple-oxidation-modal-title">{title}</h2>
          <button type="button" aria-label="Tutup modal" onClick={onClose}>
            x
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function MaterialsPanel() {
  return (
    <aside className="appleOxidationPanel appleOxidationMaterials">
      <div className="appleOxidationPanel__header appleOxidationPanel__header--green">
        <h2>Bahan dan Radas</h2>
      </div>

      <section>
        <h3>Bahan</h3>
        <div className="appleOxidationMaterialGrid">
          <figure>
            <img
              src={APPLE_OXIDATION_ASSETS.apple}
              alt="Buah epal merah"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Buah epal</figcaption>
          </figure>
          {SOLUTION_TREATMENTS.map((treatment) => (
            <figure key={treatment.id}>
              <span
                className="appleOxidationMiniBeaker"
                style={{ "--liquid-color": treatment.solutionColor } as CSSProperties}
                aria-hidden="true"
              >
                <img
                  src={APPLE_OXIDATION_ASSETS.beaker}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <i />
              </span>
              <figcaption>{treatment.materialLabel}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <h3>Radas</h3>
        <div className="appleOxidationMaterialGrid appleOxidationMaterialGrid--tools">
          <figure>
            <img
              src={APPLE_OXIDATION_ASSETS.petri}
              alt="Piring Petri"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Piring Petri</figcaption>
          </figure>
          <figure>
            <img
              src={APPLE_OXIDATION_ASSETS.forceps}
              alt="Forseps"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Forseps</figcaption>
          </figure>
          <figure>
            <img
              src={APPLE_OXIDATION_ASSETS.knife}
              alt="Pisau"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Pisau</figcaption>
          </figure>
          <figure>
            <img
              src={APPLE_OXIDATION_ASSETS.stopwatch}
              alt="Jam randik"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Jam randik</figcaption>
          </figure>
        </div>
      </section>
    </aside>
  );
}

function VariablesPanel({
  answers,
  feedback,
  locked,
  onChange,
  onCheck,
}: {
  answers: Record<VariableField, string>;
  feedback: VariableFeedback;
  locked: boolean;
  onChange: (field: VariableField, value: string) => void;
  onCheck: () => void;
}) {
  const fieldConfigs: readonly {
    field: VariableField;
    label: string;
    answer: string;
  }[] = [
    { field: "manipulated", label: "Dimanipulasikan", answer: "Jenis larutan" },
    { field: "responding", label: "Bergerak balas", answer: "Perubahan warna hirisan epal" },
    {
      field: "controlled",
      label: "Dimalarkan",
      answer: "Saiz hirisan, suhu persekitaran dan tempoh eksperimen",
    },
  ];

  return (
    <aside
      className={`appleOxidationPanel appleOxidationVariables appleOxidationVariables--${feedback}`}
    >
      <div className="appleOxidationPanel__header appleOxidationPanel__header--pink">
        <h2>Pemboleh Ubah</h2>
      </div>

      <div className="appleOxidationVariableList">
        {fieldConfigs.map((config) => (
          <label key={config.field} className="appleOxidationVariableCard">
            <span>{config.label}</span>
            {locked ? (
              <strong>{config.answer}</strong>
            ) : (
              <select
                value={answers[config.field]}
                onChange={(event) => onChange(config.field, event.target.value)}
              >
                {VARIABLE_OPTIONS.map((option) => (
                  <option key={`${config.field}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>

      {!locked && (
        <button type="button" className="appleOxidationPrimaryButton" onClick={onCheck}>
          Semak Pemboleh Ubah
        </button>
      )}
      {feedback === "correct" && (
        <p className="appleOxidationFeedback appleOxidationFeedback--success" role="status">
          Betul. Langkah eksperimen kini dibuka.
        </p>
      )}
      {feedback === "incorrect" && (
        <p className="appleOxidationFeedback appleOxidationFeedback--error" role="alert">
          Semak semula: jenis larutan ialah pemboleh ubah yang diubah oleh murid.
        </p>
      )}
    </aside>
  );
}

function StepsPanel({
  phase,
  variableLocked,
  sliceLocations,
  observationComplete,
  conclusionComplete,
}: {
  phase: ExperimentPhase;
  variableLocked: boolean;
  sliceLocations: Record<TreatmentId, SliceLocation>;
  observationComplete: boolean;
  conclusionComplete: boolean;
}) {
  const isComplete = (index: number) => {
    if (index === 0) return variableLocked;
    if (index === 1) return PHASE_ORDER[phase] > PHASE_ORDER.control;
    if (index === 2) return sliceLocations.control === "petri-control";
    if (index === 3) return PHASE_ORDER[phase] >= PHASE_ORDER.transferring;
    if (index === 4) return TREATMENTS.every(
      (treatment) => sliceLocations[treatment.id] === `petri-${treatment.id}`,
    );
    if (index === 5) return PHASE_ORDER[phase] >= PHASE_ORDER.observing;
    if (index === 6) return PHASE_ORDER[phase] >= PHASE_ORDER.observing;
    if (index === 7) return observationComplete;
    return conclusionComplete;
  };
  const activeIndex =
    phase === "variables"
      ? 0
      : phase === "cutting"
        ? 1
        : phase === "control"
          ? 2
          : phase === "immersing" || phase === "soaking"
            ? 3
            : phase === "transferring"
              ? 4
              : phase === "exposing"
                ? 5
                : phase === "observing"
                  ? 7
                  : 8;

  return (
    <aside className="appleOxidationPanel appleOxidationSteps">
      <div className="appleOxidationPanel__header appleOxidationPanel__header--purple">
        <h2>Langkah Eksperimen</h2>
      </div>
      <ol>
        {EXPERIMENT_STEPS.map((step, index) => {
          const complete = isComplete(index);
          const active = !complete && index === activeIndex;
          return (
            <li
              key={step}
              className={`${complete ? "is-complete" : ""}${active ? " is-active" : ""}`}
            >
              <span>{complete ? <Icon name="check" /> : index + 1}</span>
              <p>{step}</p>
            </li>
          );
        })}
      </ol>
      <div className="appleOxidationLegend">
        <span><i className="is-complete" /> Selesai</span>
        <span><i className="is-active" /> Aktif</span>
      </div>
    </aside>
  );
}

function TimerPanel({
  phase,
  progress,
}: {
  phase: ExperimentPhase;
  progress: number;
}) {
  const soakProgress =
    phase === "soaking" ? progress : PHASE_ORDER[phase] > PHASE_ORDER.soaking ? 1 : 0;
  const airProgress =
    phase === "exposing" ? progress : PHASE_ORDER[phase] > PHASE_ORDER.exposing ? 1 : 0;

  return (
    <section className="appleOxidationTimerPanel" aria-label="Pemasa eksperimen">
      <article>
        <Icon name="timer" />
        <div>
          <strong>{formatSoakTimer(soakProgress)}</strong>
          <span>Rendaman 1 minit</span>
        </div>
        <div className="appleOxidationProgressTrack" aria-hidden="true">
          <i style={{ width: `${soakProgress * 100}%` }} />
        </div>
      </article>
      <article>
        <Icon name="timer" />
        <div>
          <strong>{getAirMinuteLabel(airProgress)}</strong>
          <span>Pendedahan kepada udara 15 minit</span>
        </div>
        <div className="appleOxidationProgressTrack" aria-hidden="true">
          <i style={{ width: `${airProgress * 100}%` }} />
        </div>
      </article>
    </section>
  );
}

function ObservationTable({
  phase,
  answers,
  results,
  onChange,
  onCheck,
}: {
  phase: ExperimentPhase;
  answers: Record<TreatmentId, ObservationAnswer | "">;
  results: Record<TreatmentId, boolean | null>;
  onChange: (id: TreatmentId, value: ObservationAnswer | "") => void;
  onCheck: () => void;
}) {
  const unlocked = PHASE_ORDER[phase] >= PHASE_ORDER.observing;

  return (
    <section className="appleOxidationPanel appleOxidationTablePanel">
      <div className="appleOxidationPanel__header appleOxidationPanel__header--teal">
        <h2>Keputusan</h2>
        <span>Perubahan warna selepas 15 minit pendedahan kepada udara</span>
      </div>
      <div className="appleOxidationTableScroll">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Jenis rawatan</th>
              <th>Pemerhatian</th>
              <th>Rujukan visual</th>
            </tr>
          </thead>
          <tbody>
            {TREATMENTS.map((treatment, index) => (
              <tr
                key={treatment.id}
                className={
                  results[treatment.id] === null
                    ? ""
                    : results[treatment.id]
                      ? "is-correct"
                      : "is-incorrect"
                }
              >
                <td>{index + 1}</td>
                <td>{treatment.label}</td>
                <td>
                  <select
                    value={answers[treatment.id]}
                    disabled={!unlocked}
                    onChange={(event) =>
                      onChange(treatment.id, event.target.value as ObservationAnswer | "")
                    }
                    aria-label={`Pemerhatian bagi ${treatment.label}`}
                  >
                    <option value="">Pilih pemerhatian</option>
                    {OBSERVATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <SliceVisual
                    alt={`Rujukan warna ${treatment.label}: ${APPLE_COLOR_LABELS[treatment.colorStages[3]]}`}
                    blend={{
                      from: treatment.colorStages[3],
                      to: treatment.colorStages[3],
                      mix: 0,
                    }}
                    className="appleOxidationSliceVisual--table"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="appleOxidationPrimaryButton"
        disabled={!unlocked}
        onClick={onCheck}
      >
        Semak Pemerhatian
      </button>
      {!unlocked && (
        <p className="appleOxidationMuted">Jadual dibuka selepas pendedahan udara selesai.</p>
      )}
    </section>
  );
}

function ConclusionPanel({
  phase,
  answers,
  results,
  onChange,
  onCheck,
}: {
  phase: ExperimentPhase;
  answers: typeof INITIAL_CONCLUSION_ANSWERS;
  results: Record<keyof typeof INITIAL_CONCLUSION_ANSWERS, boolean | null>;
  onChange: (field: keyof typeof INITIAL_CONCLUSION_ANSWERS, value: string) => void;
  onCheck: () => void;
}) {
  const unlocked = PHASE_ORDER[phase] >= PHASE_ORDER.conclusion;
  const complete = Object.values(results).every(Boolean);

  return (
    <section className="appleOxidationPanel appleOxidationConclusion">
      <div className="appleOxidationPanel__header appleOxidationPanel__header--orange">
        <h2>Kesimpulan</h2>
      </div>
      <label className={results.leastChanged === false ? "is-incorrect" : ""}>
        <span>Hirisan epal yang direndam dalam</span>
        <input
          type="text"
          value={answers.leastChanged}
          disabled={!unlocked}
          placeholder="contoh: jus limau"
          onChange={(event) => onChange("leastChanged", event.target.value)}
        />
        <span>mengalami perubahan warna yang paling sedikit.</span>
      </label>
      <label className={results.slowsOxidation === false ? "is-incorrect" : ""}>
        <span>Oleh itu,</span>
        <input
          type="text"
          value={answers.slowsOxidation}
          disabled={!unlocked}
          placeholder="contoh: bahan antioksidan"
          onChange={(event) => onChange("slowsOxidation", event.target.value)}
        />
        <span>dapat melambatkan proses pengoksidaan buah epal.</span>
      </label>
      <label className={results.hypothesis === false ? "is-incorrect" : ""}>
        <span>Hipotesis eksperimen</span>
        <select
          value={answers.hypothesis}
          disabled={!unlocked}
          onChange={(event) => onChange("hypothesis", event.target.value)}
        >
          <option value="">Pilih jawapan</option>
          <option value="diterima">diterima</option>
          <option value="ditolak">ditolak</option>
        </select>
      </label>
      <button
        type="button"
        className="appleOxidationPrimaryButton"
        disabled={!unlocked}
        onClick={onCheck}
      >
        Semak Kesimpulan
      </button>
      {complete && (
        <div className="appleOxidationSummaryCard" role="status">
          <strong>Rumusan</strong>
          <p>
            Jus limau mengandungi bahan antioksidan yang membantu melambatkan
            pengoksidaan buah epal.
          </p>
        </div>
      )}
    </section>
  );
}

function QuizPanel({
  phase,
  answers,
  score,
  onAnswer,
  onSubmit,
}: {
  phase: ExperimentPhase;
  answers: Record<string, string>;
  score: number | null;
  onAnswer: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const unlocked = PHASE_ORDER[phase] >= PHASE_ORDER.quiz;

  return (
    <section className="appleOxidationPanel appleOxidationQuiz">
      <div className="appleOxidationPanel__header appleOxidationPanel__header--blue">
        <h2>Kuiz Ringkas</h2>
        {score !== null && <span>Markah: {score} / {POST_EXPERIMENT_QUIZ.length}</span>}
      </div>
      <div className="appleOxidationQuizList">
        {POST_EXPERIMENT_QUIZ.map((question, questionIndex) => (
          <fieldset key={question.id} disabled={!unlocked}>
            <legend>{questionIndex + 1}. {question.question}</legend>
            {question.options.map((option) => (
              <label
                key={`${question.id}-${option}`}
                className={answers[question.id] === option ? "is-selected" : ""}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(event) => onAnswer(question.id, event.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <button
        type="button"
        className="appleOxidationPrimaryButton"
        disabled={!unlocked}
        onClick={onSubmit}
      >
        Semak Kuiz
      </button>
    </section>
  );
}

export default function AppleOxidationSimulatorPage({
  reviewPanel,
}: {
  reviewPanel?: ReactNode;
}) {
  const [phase, setPhase] = useState<ExperimentPhase>("variables");
  const [soundOn, setSoundOn] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [variableAnswers, setVariableAnswers] = useState(INITIAL_VARIABLE_ANSWERS);
  const [variableLocked, setVariableLocked] = useState(false);
  const [variableFeedback, setVariableFeedback] = useState<VariableFeedback>("idle");
  const [sliceLocations, setSliceLocations] = useState(() => createSliceLocations("hidden"));
  const [selectedSlice, setSelectedSlice] = useState<TreatmentId | null>(null);
  const [timerProgress, setTimerProgress] = useState(0);
  const [observationAnswers, setObservationAnswers] = useState(createObservationAnswers);
  const [observationResults, setObservationResults] = useState(() => createBooleanRecord(null));
  const [conclusionAnswers, setConclusionAnswers] = useState(INITIAL_CONCLUSION_ANSWERS);
  const [conclusionResults, setConclusionResults] = useState<
    Record<keyof typeof INITIAL_CONCLUSION_ANSWERS, boolean | null>
  >({
    leastChanged: null,
    slowsOxidation: null,
    hypothesis: null,
  });
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const canStartSoak = SOLUTION_IDS.every(
    (id) => sliceLocations[id] === `beaker-${id}`,
  );
  const canStartAir = TREATMENTS.every(
    (treatment) => sliceLocations[treatment.id] === `petri-${treatment.id}`,
  );
  const observationComplete = TREATMENTS.every(
    (treatment) => observationResults[treatment.id] === true,
  );
  const conclusionComplete = Object.values(conclusionResults).every(Boolean);
  const progressLabel = getPhaseInstruction(phase);

  useEffect(() => {
    if (!mobilePanelOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobilePanelOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobilePanelOpen]);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  const playTone = useCallback(
    (kind: ToneKind) => {
      if (!soundOn || typeof window === "undefined") {
        return;
      }

      const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const frequencies: Record<ToneKind, number> = {
        click: 360,
        success: 620,
        error: 180,
        done: 780,
      };

      oscillator.frequency.value = frequencies[kind];
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.17);
    },
    [soundOn],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const existing = document.head.querySelector<HTMLLinkElement>(
      'link[data-apple-oxidation-preload="lab"]',
    );
    if (existing) {
      return undefined;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = APPLE_OXIDATION_ASSETS.lab;
    link.dataset.appleOxidationPreload = "lab";
    document.head.appendChild(link);

    return () => link.remove();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (phase !== "soaking" && phase !== "exposing") {
      return undefined;
    }

    const duration = phase === "soaking" ? SOAK_REAL_MS : AIR_REAL_MS;
    const startedAt = window.performance.now();
    let frameId = 0;
    let lastUpdate = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      if (now - lastUpdate > 90 || progress === 1) {
        setTimerProgress(progress);
        lastUpdate = now;
      }

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      if (phase === "soaking") {
        setPhase("transferring");
        showToast("Rendaman selesai. Pindahkan hirisan ke piring Petri.");
      } else {
        setPhase("observing");
        showToast("Pendedahan udara selesai. Rekod pemerhatian anda.");
      }
      playTone("done");
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [phase, playTone, showToast]);

  const resetExperiment = () => {
    setPhase("variables");
    setActiveModal(null);
    setToast("");
    setVariableAnswers(INITIAL_VARIABLE_ANSWERS);
    setVariableLocked(false);
    setVariableFeedback("idle");
    setSliceLocations(createSliceLocations("hidden"));
    setSelectedSlice(null);
    setTimerProgress(0);
    setObservationAnswers(createObservationAnswers());
    setObservationResults(createBooleanRecord(null));
    setConclusionAnswers(INITIAL_CONCLUSION_ANSWERS);
    setConclusionResults({
      leastChanged: null,
      slowsOxidation: null,
      hypothesis: null,
    });
    setQuizAnswers({});
    setQuizScore(null);
    playTone("click");
  };

  const checkVariables = () => {
    const correct =
      variableAnswers.manipulated === "jenis-larutan" &&
      variableAnswers.responding === "perubahan-warna" &&
      variableAnswers.controlled === "saiz-suhu-tempoh";

    if (!correct) {
      setVariableFeedback("incorrect");
      showToast("Jawapan pemboleh ubah belum tepat.");
      playTone("error");
      return;
    }

    setVariableFeedback("correct");
    setVariableLocked(true);
    setPhase("cutting");
    showToast("Pemboleh ubah betul. Anda boleh mula memotong epal.");
    playTone("success");
  };

  const cutApple = () => {
    if (phase !== "cutting") {
      showToast("Lengkapkan pemboleh ubah dahulu.");
      playTone("error");
      return;
    }

    setSliceLocations(createSliceLocations("prep"));
    setSelectedSlice("control");
    setPhase("control");
    showToast("Lima hirisan sama saiz telah disediakan.");
    playTone("success");
  };

  const isSliceMovable = (id: TreatmentId) => {
    if (phase === "control") {
      return sliceLocations[id] === "prep";
    }
    if (phase === "immersing") {
      return id !== "control" && sliceLocations[id] === "prep";
    }
    if (phase === "transferring") {
      return id !== "control" && sliceLocations[id] === `beaker-${id}`;
    }
    return false;
  };

  const selectSlice = (id: TreatmentId) => {
    if (!isSliceMovable(id)) {
      showToast("Hirisan ini belum boleh dipindahkan pada langkah semasa.");
      playTone("error");
      return;
    }

    setSelectedSlice(id);
    showToast(`Hirisan ${TREATMENT_BY_ID[id].shortLabel} dipilih.`);
    playTone("click");
  };

  const placeSlice = (sliceId: TreatmentId, target: TargetLocation) => {
    if (!isSliceMovable(sliceId)) {
      showToast("Tindakan ini tidak dibenarkan pada langkah semasa.");
      playTone("error");
      return;
    }

    if (phase === "control") {
      if (sliceId !== "control") {
        showToast("Gunakan hirisan kawalan untuk piring Petri Kawalan.");
        playTone("error");
        return;
      }
      if (target !== "petri-control") {
        showToast("Hirisan kawalan tidak direndam dalam sebarang larutan.");
        playTone("error");
        return;
      }
      setSliceLocations((current) => ({ ...current, control: "petri-control" }));
      setSelectedSlice(null);
      setPhase("immersing");
      showToast("Kawalan selesai. Rendam empat hirisan lain dalam larutan.");
      playTone("success");
      return;
    }

    if (phase === "immersing") {
      if (sliceId === "control") {
        showToast("Hirisan kawalan tidak direndam dalam sebarang larutan.");
        playTone("error");
        return;
      }

      const expectedTarget = `beaker-${sliceId}` as TargetLocation;
      if (target !== expectedTarget) {
        showToast(`Letakkan hirisan ini ke dalam ${TREATMENT_BY_ID[sliceId].label}.`);
        playTone("error");
        return;
      }

      setSliceLocations((current) => ({ ...current, [sliceId]: expectedTarget }));
      setSelectedSlice(null);
      showToast(`${TREATMENT_BY_ID[sliceId].shortLabel} selesai direndam.`);
      playTone("success");
      return;
    }

    if (phase === "transferring") {
      if (sliceId === "control") {
        showToast("Hirisan kawalan sudah berada dalam piring Petri.");
        playTone("error");
        return;
      }

      const expectedTarget = `petri-${sliceId}` as TargetLocation;
      if (target !== expectedTarget) {
        showToast(`Pindahkan hirisan ke piring Petri ${TREATMENT_BY_ID[sliceId].shortLabel}.`);
        playTone("error");
        return;
      }

      setSliceLocations((current) => ({ ...current, [sliceId]: expectedTarget }));
      setSelectedSlice(null);
      showToast(`Hirisan ${TREATMENT_BY_ID[sliceId].shortLabel} dipindahkan ke piring Petri.`);
      playTone("success");
    }
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, id: TreatmentId) => {
    if (!isSliceMovable(id)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", id);
    setSelectedSlice(id);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>, target: TargetLocation) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") as TreatmentId;
    if (draggedId) {
      placeSlice(draggedId, target);
    }
  };

  const handleTargetClick = (target: TargetLocation) => {
    const targetTreatment = getTargetTreatment(target);
    if (
      !selectedSlice &&
      phase === "transferring" &&
      target.startsWith("beaker-") &&
      sliceLocations[targetTreatment] === target
    ) {
      selectSlice(targetTreatment);
      return;
    }

    if (!selectedSlice) {
      showToast("Pilih satu hirisan dahulu, kemudian klik sasaran.");
      playTone("error");
      return;
    }

    placeSlice(selectedSlice, target);
  };

  const startSoaking = () => {
    if (phase !== "immersing" || !canStartSoak) {
      showToast("Pastikan empat hirisan berada dalam bikar larutan masing-masing.");
      playTone("error");
      return;
    }

    setTimerProgress(0);
    setPhase("soaking");
    showToast("Rendaman 1 minit bermula.");
    playTone("click");
  };

  const startAirExposure = () => {
    if (phase !== "transferring" || !canStartAir) {
      showToast("Pindahkan semua hirisan ke piring Petri dahulu.");
      playTone("error");
      return;
    }

    setTimerProgress(0);
    setPhase("exposing");
    showToast("Pendedahan kepada udara bermula.");
    playTone("click");
  };

  const checkObservations = () => {
    if (PHASE_ORDER[phase] < PHASE_ORDER.observing) {
      showToast("Selesaikan pendedahan udara dahulu.");
      playTone("error");
      return;
    }

    const results = Object.fromEntries(
      TREATMENTS.map((treatment) => [
        treatment.id,
        observationAnswers[treatment.id] === treatment.finalObservation,
      ]),
    ) as Record<TreatmentId, boolean>;
    setObservationResults(results);

    if (Object.values(results).every(Boolean)) {
      setPhase("conclusion");
      showToast("Pemerhatian tepat. Teruskan kepada kesimpulan.");
      playTone("success");
    } else {
      showToast("Ada pemerhatian belum tepat. Bandingkan semula warna hirisan.");
      playTone("error");
    }
  };

  const checkConclusion = () => {
    if (PHASE_ORDER[phase] < PHASE_ORDER.conclusion) {
      showToast("Lengkapkan pemerhatian dahulu.");
      playTone("error");
      return;
    }

    const leastChanged = normalizeAnswer(conclusionAnswers.leastChanged).includes("jus limau");
    const slowsOxidation = normalizeAnswer(conclusionAnswers.slowsOxidation);
    const result = {
      leastChanged,
      slowsOxidation:
        slowsOxidation.includes("jus limau") || slowsOxidation.includes("antioksidan"),
      hypothesis: conclusionAnswers.hypothesis === "diterima",
    };
    setConclusionResults(result);

    if (Object.values(result).every(Boolean)) {
      setPhase("quiz");
      showToast("Kesimpulan betul. Kuiz ringkas dibuka.");
      playTone("success");
    } else {
      showToast("Kesimpulan belum tepat. Semak semula pemerhatian jus limau.");
      playTone("error");
    }
  };

  const submitQuiz = () => {
    const allAnswered = POST_EXPERIMENT_QUIZ.every((question) => quizAnswers[question.id]);
    if (!allAnswered) {
      showToast("Jawab semua soalan kuiz dahulu.");
      playTone("error");
      return;
    }

    const score = POST_EXPERIMENT_QUIZ.reduce(
      (total, question) => total + (quizAnswers[question.id] === question.answer ? 1 : 0),
      0,
    );
    setQuizScore(score);
    if (score === POST_EXPERIMENT_QUIZ.length) {
      setPhase("complete");
      showToast("Tahniah. Semua jawapan kuiz betul.");
      playTone("success");
    } else {
      showToast("Semak semula jawapan kuiz dan cuba lagi.");
      playTone("error");
    }
  };

  const prepSlices = useMemo(
    () => TREATMENTS.filter((treatment) => sliceLocations[treatment.id] === "prep"),
    [sliceLocations],
  );

  const runMobilePanelAction = (action: () => void, closePanel = true) => {
    action();
    if (closePanel) {
      setMobilePanelOpen(false);
    }
  };

  const renderActionBar = (variant: "desktop" | "mobile") => (
    <div className={`appleOxidationActionBar appleOxidationActionBar--${variant}`}>
      <button
        type="button"
        className="appleOxidationPrimaryButton"
        disabled={phase !== "cutting"}
        onClick={() => runMobilePanelAction(cutApple, variant === "mobile")}
      >
        Potong Epal kepada 5 Hirisan Sama Saiz
      </button>
      <button
        type="button"
        className="appleOxidationPrimaryButton appleOxidationPrimaryButton--green"
        disabled={phase !== "immersing" || !canStartSoak}
        onClick={() => runMobilePanelAction(startSoaking, variant === "mobile")}
      >
        {phase === "soaking" ? "Sedang Merendam..." : "Mulakan Rendaman 1 Minit"}
      </button>
      <button
        type="button"
        className="appleOxidationPrimaryButton appleOxidationPrimaryButton--orange"
        disabled={phase !== "transferring" || !canStartAir}
        onClick={() => runMobilePanelAction(startAirExposure, variant === "mobile")}
      >
        Dedahkan kepada Udara selama 15 Minit
      </button>
    </div>
  );

  return (
    <main className="appleOxidationPage">
      <header className="appleOxidationHeader">
        <div className="appleOxidationTitleBlock">
          <img
            src={APPLE_OXIDATION_ASSETS.apple}
            alt="Buah epal merah"
            loading="eager"
            decoding="async"
          />
          <div>
            <span>Sains Tingkatan 4 - Eksperimen Antioksidan</span>
            <h1>ANTIOKSIDAN: Pengoksidaan Buah Epal</h1>
            <p>Kesan jenis larutan terhadap perubahan warna hirisan epal</p>
          </div>
        </div>

        <div className="appleOxidationHeaderActions">
          <button type="button" onClick={() => setActiveModal("instructions")}>
            <Icon name="book" />
            Arahan
          </button>
          <button type="button" onClick={() => setActiveModal("info")}>
            <Icon name="info" />
            Info
          </button>
          <button
            type="button"
            aria-pressed={soundOn}
            onClick={() => setSoundOn((current) => !current)}
          >
            <Icon name={soundOn ? "volume" : "volumeOff"} />
            Bunyi {soundOn ? "ON" : "OFF"}
          </button>
          <button type="button" onClick={() => setActiveModal("reset")}>
            <Icon name="reset" />
            Tetapkan Semula
          </button>
        </div>
      </header>

      {reviewPanel && <div className="appleOxidationReviewSlot">{reviewPanel}</div>}

      <section className="appleOxidationObjective" aria-label="Tujuan eksperimen">
        <Icon name="flask" />
        <p>
          <strong>Tujuan:</strong> Mengkaji kesan jenis larutan yang berbeza terhadap
          pengoksidaan buah epal.
        </p>
      </section>

      <section className="appleOxidationLayout" aria-label="Simulator pengoksidaan buah epal">
        <button
          type="button"
          className={`appleOxidationMobilePanelToggle${mobilePanelOpen ? " is-open" : ""}`}
          aria-controls="apple-oxidation-mobile-panel"
          aria-expanded={mobilePanelOpen}
          onClick={() => setMobilePanelOpen(true)}
        >
          <Icon name="menu" />
          <span>Panel Kawalan</span>
        </button>

        <button
          type="button"
          className={`appleOxidationMobilePanelBackdrop${mobilePanelOpen ? " is-open" : ""}`}
          aria-label="Tutup panel kawalan"
          onClick={() => setMobilePanelOpen(false)}
        />

        <aside
          id="apple-oxidation-mobile-panel"
          className={`appleOxidationMobilePanelShell${mobilePanelOpen ? " is-open" : ""}`}
          aria-label="Panel kawalan eksperimen antioksidan"
        >
          <div className="appleOxidationMobilePanel__header">
            <strong>Panel Kawalan</strong>
            <button
              type="button"
              aria-label="Tutup panel kawalan"
              onClick={() => setMobilePanelOpen(false)}
            >
              <Icon name="x" />
            </button>
          </div>

          <div className="appleOxidationMobileUtilityActions" aria-label="Tindakan simulator">
            <button
              type="button"
              onClick={() => {
                setMobilePanelOpen(false);
                setActiveModal("instructions");
              }}
            >
              <Icon name="book" />
              Arahan
            </button>
            <button
              type="button"
              onClick={() => {
                setMobilePanelOpen(false);
                setActiveModal("info");
              }}
            >
              <Icon name="info" />
              Info
            </button>
            <button
              type="button"
              aria-pressed={soundOn}
              onClick={() => setSoundOn((current) => !current)}
            >
              <Icon name={soundOn ? "volume" : "volumeOff"} />
              Bunyi {soundOn ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobilePanelOpen(false);
                setActiveModal("reset");
              }}
            >
              <Icon name="reset" />
              Reset
            </button>
          </div>

          {renderActionBar("mobile")}

          <div className="appleOxidationLeftRail appleOxidationLeftRail--panel">
            <VariablesPanel
              answers={variableAnswers}
              feedback={variableFeedback}
              locked={variableLocked}
              onChange={(field, value) =>
                setVariableAnswers((current) => ({ ...current, [field]: value }))
              }
              onCheck={checkVariables}
            />
            <MaterialsPanel />
          </div>

          <div className="appleOxidationRightRail appleOxidationRightRail--panel">
            <StepsPanel
              phase={phase}
              variableLocked={variableLocked}
              sliceLocations={sliceLocations}
              observationComplete={observationComplete}
              conclusionComplete={conclusionComplete}
            />

            <ConclusionPanel
              phase={phase}
              answers={conclusionAnswers}
              results={conclusionResults}
              onChange={(field, value) => {
                setConclusionAnswers((current) => ({ ...current, [field]: value }));
                setConclusionResults((current) => ({ ...current, [field]: null }));
                if (PHASE_ORDER[phase] > PHASE_ORDER.conclusion) {
                  setPhase("conclusion");
                  setQuizAnswers({});
                  setQuizScore(null);
                }
              }}
              onCheck={checkConclusion}
            />

            <aside className="appleOxidationPanel appleOxidationTip">
              <Icon name="info" />
              <p>
                Pastikan semua hirisan epal mempunyai saiz yang sama dan suhu
                persekitaran adalah sama sepanjang eksperimen.
              </p>
            </aside>
          </div>
        </aside>

        <div className="appleOxidationLeftRail">
          <VariablesPanel
            answers={variableAnswers}
            feedback={variableFeedback}
            locked={variableLocked}
            onChange={(field, value) =>
              setVariableAnswers((current) => ({ ...current, [field]: value }))
            }
            onCheck={checkVariables}
          />
          <MaterialsPanel />
        </div>

        <section className="appleOxidationMainColumn">
          <section className="appleOxidationStageCard">
            <div className="appleOxidationStageTop">
              <div>
                <span>Ruang Eksperimen</span>
                <h2>{progressLabel}</h2>
              </div>
              <div className="appleOxidationPhaseBadge">
                Langkah {Math.min(EXPERIMENT_STEPS.length, Math.max(1, PHASE_ORDER[phase] + 1))}
              </div>
            </div>

            <div className="appleOxidationSceneScroll">
              <div className={`appleOxidationScene appleOxidationScene--${phase}`}>
                <img
                  className="appleOxidationLabImage"
                  src={APPLE_OXIDATION_ASSETS.lab}
                  alt="Ruang makmal dengan lima piring Petri kosong dan meja eksperimen"
                  loading="eager"
                  decoding="async"
                  draggable="false"
                />

                {SOLUTION_TREATMENTS.map((treatment) => {
                  const target = `beaker-${treatment.id}` as TargetLocation;
                  const containsSlice = sliceLocations[treatment.id] === target;
                  const selected = selectedSlice === treatment.id;

                  return (
                    <button
                      key={target}
                      type="button"
                      className={`appleOxidationDropTarget appleOxidationDropTarget--beaker appleOxidationStation--${treatment.id}${containsSlice ? " has-slice" : ""}${selected ? " is-selected" : ""}`}
                      aria-label={`Bikar ${treatment.label}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, target)}
                      onClick={() => handleTargetClick(target)}
                    >
                      <img
                        className="appleOxidationBeakerImage"
                        src={APPLE_OXIDATION_ASSETS.solutionBeaker}
                        alt=""
                        aria-hidden="true"
                        loading="eager"
                        decoding="async"
                        draggable="false"
                      />
                      <span className="appleOxidationStationLabel">{treatment.shortLabel}</span>
                      {containsSlice && (
                        <SliceVisual
                          alt={`Hirisan epal dalam ${treatment.label}`}
                          blend={getStageBlend(treatment, phase, timerProgress)}
                          className="appleOxidationSliceVisual--beaker"
                        />
                      )}
                      {containsSlice && (
                        <span className="appleOxidationStationDone" aria-label="Selesai">
                          <Icon name="check" />
                        </span>
                      )}
                    </button>
                  );
                })}

                {TREATMENTS.map((treatment) => {
                  const target = `petri-${treatment.id}` as TargetLocation;
                  const containsSlice = sliceLocations[treatment.id] === target;

                  return (
                    <button
                      key={target}
                      type="button"
                      className={`appleOxidationDropTarget appleOxidationDropTarget--petri appleOxidationStation--${treatment.id}${containsSlice ? " has-slice" : ""}`}
                      aria-label={`Piring Petri ${treatment.label}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, target)}
                      onClick={() => handleTargetClick(target)}
                    >
                      <span className="appleOxidationStationLabel">{treatment.shortLabel}</span>
                      {containsSlice && (
                        <SliceVisual
                          alt={`Hirisan epal dalam piring Petri ${treatment.label}`}
                          blend={getStageBlend(treatment, phase, timerProgress)}
                          className={`appleOxidationSliceVisual--petri${treatment.id === "lemon" && phase === "exposing" ? " appleOxidationSliceVisual--antioxidant" : ""}`}
                        />
                      )}
                    </button>
                  );
                })}

                {phase === "exposing" && (
                  <div className="appleOxidationOxygenLayer" aria-hidden="true">
                    <span>O2</span>
                    <span>O2</span>
                    <span>O2</span>
                    <span>O2</span>
                    <span>O2</span>
                  </div>
                )}
              </div>
            </div>

            <div className="appleOxidationPrepTray" aria-label="Ruang persediaan epal">
              {phase === "cutting" && (
                <div className="appleOxidationWholeApple">
                  <img
                    src={APPLE_OXIDATION_ASSETS.apple}
                    alt="Buah epal penuh sebelum dipotong"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="appleOxidationKnifeCue" aria-hidden="true">
                    <Icon name="knife" />
                  </span>
                </div>
              )}

              {prepSlices.map((treatment) => (
                <button
                  key={`prep-${treatment.id}`}
                  type="button"
                  className={`appleOxidationSliceButton${selectedSlice === treatment.id ? " is-selected" : ""}`}
                  draggable={isSliceMovable(treatment.id)}
                  aria-pressed={selectedSlice === treatment.id}
                  onDragStart={(event) => handleDragStart(event, treatment.id)}
                  onClick={() => selectSlice(treatment.id)}
                >
                  <SliceVisual
                    alt={`Hirisan epal untuk ${treatment.label}`}
                    blend={{ from: "fresh", to: "fresh", mix: 0 }}
                  />
                  <span>{treatment.shortLabel}</span>
                </button>
              ))}
            </div>

            {renderActionBar("desktop")}

            <TimerPanel phase={phase} progress={timerProgress} />
          </section>

          <ObservationTable
            phase={phase}
            answers={observationAnswers}
            results={observationResults}
            onChange={(id, value) => {
              setObservationAnswers((current) => ({ ...current, [id]: value }));
              setObservationResults((current) => ({ ...current, [id]: null }));
              if (PHASE_ORDER[phase] > PHASE_ORDER.observing) {
                setPhase("observing");
                setConclusionResults({
                  leastChanged: null,
                  slowsOxidation: null,
                  hypothesis: null,
                });
                setQuizAnswers({});
                setQuizScore(null);
              }
            }}
            onCheck={checkObservations}
          />

          <QuizPanel
            phase={phase}
            answers={quizAnswers}
            score={quizScore}
            onAnswer={(questionId, value) => {
              setQuizAnswers((current) => ({ ...current, [questionId]: value }));
              if (phase === "complete") {
                setPhase("quiz");
                setQuizScore(null);
              }
            }}
            onSubmit={submitQuiz}
          />
        </section>

        <div className="appleOxidationRightRail">
          <StepsPanel
            phase={phase}
            variableLocked={variableLocked}
            sliceLocations={sliceLocations}
            observationComplete={observationComplete}
            conclusionComplete={conclusionComplete}
          />

          <ConclusionPanel
            phase={phase}
            answers={conclusionAnswers}
            results={conclusionResults}
            onChange={(field, value) => {
              setConclusionAnswers((current) => ({ ...current, [field]: value }));
              setConclusionResults((current) => ({ ...current, [field]: null }));
              if (PHASE_ORDER[phase] > PHASE_ORDER.conclusion) {
                setPhase("conclusion");
                setQuizAnswers({});
                setQuizScore(null);
              }
            }}
            onCheck={checkConclusion}
          />

          <aside className="appleOxidationPanel appleOxidationTip">
            <Icon name="info" />
            <p>
              Pastikan semua hirisan epal mempunyai saiz yang sama dan suhu
              persekitaran adalah sama sepanjang eksperimen.
            </p>
          </aside>
        </div>
      </section>

      {toast && (
        <div className="appleOxidationToast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {activeModal === "instructions" && (
        <Modal title="Cara menjalankan simulator" onClose={() => setActiveModal(null)}>
          <ol className="appleOxidationModalList">
            <li>Lengkapkan pemboleh ubah.</li>
            <li>Potong epal kepada lima hirisan sama saiz.</li>
            <li>Tetapkan hirisan kawalan.</li>
            <li>Rendam empat hirisan dalam larutan masing-masing.</li>
            <li>Jalankan pemasa rendaman dan pindahkan hirisan ke piring Petri.</li>
            <li>Dedahkan kepada udara, rekod pemerhatian dan buat kesimpulan.</li>
            <li>Jawab kuiz pasca eksperimen.</li>
          </ol>
        </Modal>
      )}

      {activeModal === "info" && (
        <Modal title="Info sains" onClose={() => setActiveModal(null)}>
          <p>
            Pengoksidaan berlaku apabila bahan dalam buah epal bertindak balas
            dengan oksigen dalam udara. Proses ini menyebabkan permukaan epal
            bertukar perang.
          </p>
          <p>
            Bahan antioksidan membantu memperlahankan proses pengoksidaan. Jus
            limau mengandungi vitamin C dan bahan berasid yang membantu
            melambatkan perubahan warna epal.
          </p>
        </Modal>
      )}

      {activeModal === "reset" && (
        <Modal title="Tetapkan semula eksperimen?" onClose={() => setActiveModal(null)}>
          <p>Semua langkah, pemasa, pemerhatian, kesimpulan dan kuiz akan dikosongkan.</p>
          <div className="appleOxidationModalActions">
            <button type="button" onClick={() => setActiveModal(null)}>
              Batal
            </button>
            <button type="button" className="appleOxidationPrimaryButton" onClick={resetExperiment}>
              Tetapkan Semula
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
