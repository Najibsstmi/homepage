import type { CSSProperties } from "react";
import {
  EXPERIMENT_SETS,
  MACRONUTRIENT_ASSET_BASE,
  SOLUTION_BY_ID,
  getPlantAsset,
  getPlantBlend,
  type ExperimentSetId,
  type SolutionSelections,
  type SolutionType,
} from "../../data/macronutrientExperimentData";

type ExperimentPhase = "setup" | "running" | "paused" | "complete" | "compare";
type LightPhase = "morning" | "midday" | "evening" | "night";

interface PlantVisualProps {
  solution: SolutionType;
  day: number;
  label: string;
  reducedMotion: boolean;
  variant: "root" | "foliage";
}

function SafePlantImage({
  source,
  fallback,
  alt,
  style,
}: {
  source: string;
  fallback: string;
  alt: string;
  style: CSSProperties;
}) {
  return (
    <img
      src={source}
      alt={alt}
      style={style}
      draggable={false}
      onError={(event) => {
        const image = event.currentTarget;
        if (!image.dataset.fallbackApplied) {
          console.warn(`Aset tumbuhan gagal dimuatkan: ${source}. Menggunakan state sebelumnya.`);
          image.dataset.fallbackApplied = "true";
          image.src = fallback;
        }
      }}
    />
  );
}

export function PlantVisual({
  solution,
  day,
  label,
  reducedMotion,
  variant,
}: PlantVisualProps) {
  const blend = getPlantBlend(solution, day);
  const mix = reducedMotion ? (blend.mix >= 0.5 ? 1 : 0) : blend.mix;
  const fallback = getPlantAsset(solution, 0);
  const growthScale = day > 0 ? 1.14 + (Math.min(day, 14) / 14) * 0.08 : 1;
  const rootStretch = variant === "root" && day > 0 ? 2 : 1;
  const previousScale = growthScale * (1 + mix * 0.012);
  const nextScale = growthScale * (0.988 + mix * 0.012);

  return (
    <div className={`macro-plant macro-plant--${variant}`} aria-hidden={variant === "root"}>
      <SafePlantImage
        key={blend.previous}
        source={blend.previous}
        fallback={fallback}
        alt={variant === "foliage" ? label : ""}
        style={{
          opacity: 1 - mix,
          transform: `scale(${previousScale}, ${previousScale * rootStretch})`,
        }}
      />
      {blend.next !== blend.previous ? (
        <SafePlantImage
          key={blend.next}
          source={blend.next}
          fallback={blend.previous}
          alt=""
          style={{
            opacity: mix,
            transform: `scale(${nextScale}, ${nextScale * rootStretch})`,
          }}
        />
      ) : null}
    </div>
  );
}

export interface MacronutrientLabProps {
  selections: SolutionSelections;
  selectedSolution: SolutionType | null;
  pouringSet: ExperimentSetId | null;
  day: number;
  phase: ExperimentPhase;
  lightPhase: LightPhase;
  reducedMotion: boolean;
  onSetClick: (setId: ExperimentSetId) => void;
}

const SET_POSITIONS: Record<ExperimentSetId, string> = {
  A: "9.8%",
  B: "27.1%",
  C: "44.2%",
  D: "61.2%",
};

export default function MacronutrientLab({
  selections,
  selectedSolution,
  pouringSet,
  day,
  phase,
  lightPhase,
  reducedMotion,
  onSetClick,
}: MacronutrientLabProps) {
  const pumpActive = phase === "running" || phase === "paused";
  const isSetup = phase === "setup";

  return (
    <section className="macro-lab" aria-label="Makmal maya eksperimen makronutrien">
      <img
        className="macro-lab__background"
        src={`${MACRONUTRIENT_ASSET_BASE}/lab-background.webp`}
        alt="Makmal sains moden dengan meja eksperimen"
        width="1536"
        height="1024"
      />
      <div className={`macro-lab__light macro-lab__light--${lightPhase}`} aria-hidden="true" />

      <div className="macro-lab__apparatus-wrap">
        {EXPERIMENT_SETS.map((setId) => {
          const solution = selections[setId] ?? "complete";
          const plantDay = selections[setId] ? day : 0;
          const solutionDefinition = selections[setId]
            ? SOLUTION_BY_ID[selections[setId]]
            : null;
          const position = { "--set-x": SET_POSITIONS[setId] } as CSSProperties;

          return (
            <div className="macro-lab__set" style={position} key={setId}>
              <PlantVisual
                solution={solution}
                day={plantDay}
                label={`Pokok jagung Set ${setId}, ${solutionDefinition?.label ?? "Hari 0"}`}
                reducedMotion={reducedMotion}
                variant="root"
              />
              {pumpActive ? (
                <div className={`macro-bubbles${phase === "paused" ? " is-paused" : ""}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              ) : null}
            </div>
          );
        })}

        <img
          className="macro-lab__apparatus"
          src={`${MACRONUTRIENT_ASSET_BASE}/apparatus.webp`}
          alt="Empat tabung eksperimen pada rak yang disambung kepada pam udara"
          width="1518"
          height="680"
          draggable={false}
        />

        {EXPERIMENT_SETS.map((setId) => {
          const solution = selections[setId] ?? "complete";
          const plantDay = selections[setId] ? day : 0;
          const selected = selections[setId];
          const definition = selected ? SOLUTION_BY_ID[selected] : null;
          const position = { "--set-x": SET_POSITIONS[setId] } as CSSProperties;

          return (
            <div className="macro-lab__set macro-lab__set--front" style={position} key={`front-${setId}`}>
              <PlantVisual
                solution={solution}
                day={plantDay}
                label=""
                reducedMotion={reducedMotion}
                variant="root"
              />
              <PlantVisual
                solution={solution}
                day={plantDay}
                label={`Pokok jagung Set ${setId}, termasuk daun dan akar`}
                reducedMotion={reducedMotion}
                variant="foliage"
              />
              <button
                type="button"
                className={`macro-set-button${selected ? " is-filled" : ""}`}
                disabled={!isSetup}
                onClick={() => onSetClick(setId)}
                aria-label={
                  selected
                    ? `Set ${setId}, ${definition?.label}. Klik untuk menukar larutan.`
                    : `Pilih Set ${setId} untuk memasukkan larutan`
                }
              >
                <strong>SET {setId}</strong>
                <span style={definition ? ({ "--badge-color": definition.color } as CSSProperties) : undefined}>
                  {definition?.shortLabel ?? "Belum dipilih"}
                </span>
              </button>
            </div>
          );
        })}

        <div className={`macro-pump-status${pumpActive ? " is-on" : ""}`} aria-live="polite">
          <i aria-hidden="true" />
          PAM {pumpActive ? (phase === "paused" ? "JEDA" : "ON") : "OFF"}
        </div>

        {pouringSet && selectedSolution ? (
          <div
            className="macro-pour"
            style={{ "--set-x": SET_POSITIONS[pouringSet] } as CSSProperties}
            aria-hidden="true"
          >
            <img src={SOLUTION_BY_ID[selectedSolution].bottle} alt="" />
            <span />
          </div>
        ) : null}
      </div>
    </section>
  );
}
