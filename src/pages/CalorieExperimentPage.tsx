import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import {
  CALORIE_ASSET_BASE,
  EXPERIMENT_STEPS,
  FOOD_DATA,
  FOOD_ORDER,
  calculateCalorieResult,
  getTemperatureAtProgress,
  type CalorieResult,
  type FoodId,
  type FoodState,
} from "../data/calorieExperimentData";
import "./CalorieExperimentPage.css";

type ExperimentStage =
  | "select-food"
  | "prepare-water"
  | "record-initial"
  | "ready-to-ignite"
  | "drag-to-calorimeter"
  | "heating"
  | "burned"
  | "calculate"
  | "completed";
type ModalKind = "instructions" | "info" | null;
type SampleLocation = "tray" | "under-calorimeter";
type IconName =
  | "arrowRight"
  | "book"
  | "calculator"
  | "check"
  | "exit"
  | "fire"
  | "flask"
  | "info"
  | "lock"
  | "menu"
  | "reset"
  | "table"
  | "thermometer"
  | "timer"
  | "water"
  | "x";

const STAGE_STEP_INDEX: Record<ExperimentStage, number> = {
  "select-food": 0,
  "prepare-water": 2,
  "record-initial": 3,
  "ready-to-ignite": 4,
  "drag-to-calorimeter": 5,
  heating: 6,
  burned: 7,
  calculate: 8,
  completed: 9,
};

const INITIAL_TEMPERATURE = 27;

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H7a3 3 0 0 0-3 3V5.5Z" />
        <path d="M4 18a3 3 0 0 1 3-3h13" />
        <path d="M8 7h7" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h.01" />
        <path d="M12 11h.01" />
        <path d="M16 11h.01" />
        <path d="M8 15h.01" />
        <path d="M12 15h.01" />
        <path d="M16 15h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    exit: (
      <>
        <path d="M10 17 15 12 10 7" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </>
    ),
    fire: (
      <>
        <path d="M12 22c3.3-1.4 5-3.9 5-7.2 0-3-1.8-5.3-3.3-6.9-.6 2.3-1.9 3.5-3.3 4.7.2-2.7-.7-5.1-2.7-7.2C6.8 7.6 5 10 5 14.6 5 18.8 7.7 21.2 12 22Z" />
        <path d="M12 22c1.4-.9 2.2-2 2.2-3.4 0-1.3-.8-2.4-1.7-3.3-.3 1-.9 1.6-1.7 2.2.1-1.2-.3-2.2-1.1-3.2-.7 1.1-1.4 2.3-1.4 4.1 0 1.6 1.1 2.8 3.7 3.6Z" />
      </>
    ),
    flask: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v5l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
        <path d="M8 15h8" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6" />
        <path d="M12 7h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    reset: (
      <>
        <path d="M4 12a8 8 0 1 0 2.4-5.7" />
        <path d="M4 4v6h6" />
      </>
    ),
    table: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M9 5v14" />
        <path d="M15 5v14" />
      </>
    ),
    thermometer: (
      <>
        <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
        <path d="M12 8v8" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 13 15 10" />
        <path d="M9 2h6" />
      </>
    ),
    water: (
      <>
        <path d="M12 3C9.6 6.2 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-3.6-7.8-6-11Z" />
        <path d="M9.2 15.8A3.2 3.2 0 0 0 12 17" />
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const updateMotion = () => setReduced(media.matches);
    media.addEventListener("change", updateMotion);

    return () => media.removeEventListener("change", updateMotion);
  }, []);

  return reduced;
}

function formatTemperature(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1) : "Belum direkod";
}

function formatTimer(elapsedMs: number, burnDurationMs: number) {
  const simulatedSeconds = Math.round(
    (Math.min(elapsedMs, burnDurationMs) / burnDurationMs) *
      Math.round((burnDurationMs / 1000) * 15),
  );
  const minutes = Math.floor(simulatedSeconds / 60);
  const seconds = simulatedSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getInstruction(stage: ExperimentStage, selectedFoodId: FoodId | null) {
  if (!selectedFoodId) {
    return "Pilih satu sampel makanan untuk memulakan eksperimen.";
  }

  const food = FOOD_DATA[selectedFoodId];

  if (stage === "prepare-water") {
    return `${food.name} berjisim 1 g telah dicucuk pada hujung jarum. Masukkan air suling ke dalam tabung didih.`;
  }
  if (stage === "record-initial") {
    return "Rekodkan suhu awal air sebelum sampel dinyalakan.";
  }
  if (stage === "ready-to-ignite") {
    return "Nyalakan sampel makanan menggunakan pemetik api.";
  }
  if (stage === "drag-to-calorimeter") {
    return "Seret sampel yang sedang terbakar ke zon di bawah tabung didih.";
  }
  if (stage === "heating") {
    return "Tunggu sehingga sampel habis terbakar dan suhu air berhenti meningkat.";
  }
  if (stage === "burned") {
    return "Pembakaran selesai. Rekodkan suhu akhir air.";
  }
  if (stage === "calculate") {
    return "Hitungkan nilai kalori makanan menggunakan formula buku teks.";
  }
  return "Keputusan sampel ini telah direkodkan. Pilih sampel seterusnya untuk perbandingan.";
}

function getSampleState(stage: ExperimentStage): FoodState {
  if (stage === "drag-to-calorimeter" || stage === "heating") {
    return "burning";
  }
  if (stage === "burned" || stage === "calculate" || stage === "completed") {
    return "burned";
  }
  return "normal";
}

function DigitalTemperature({ value }: { value: number }) {
  return (
    <figure className="calorieDigitalThermometer" aria-label="Paparan suhu digital">
      <span className="calorieDigitalThermometer__label">Suhu air</span>
      <strong className="calorieDigitalThermometer__readout" aria-live="polite">
        {value.toFixed(1)}
      </strong>
      <span className="calorieDigitalThermometer__unit">°C</span>
    </figure>
  );
}

function FoodSelector({
  selectedFoodId,
  completedResults,
  canSelect,
  onSelect,
}: {
  selectedFoodId: FoodId | null;
  completedResults: Partial<Record<FoodId, CalorieResult>>;
  canSelect: boolean;
  onSelect: (foodId: FoodId) => void;
}) {
  return (
    <section className="caloriePanel calorieFoodPanel" aria-label="Pilih sampel makanan">
      <div className="caloriePanel__header caloriePanel__header--blue">
        <span>1</span>
        <h2>Pilih Sampel Makanan</h2>
      </div>
      <div className="calorieFoodList">
        {FOOD_ORDER.map((foodId) => {
          const food = FOOD_DATA[foodId];
          const selected = selectedFoodId === foodId;
          const completed = Boolean(completedResults[foodId]);

          return (
            <button
              key={foodId}
              type="button"
              className={`calorieFoodCard${selected ? " is-selected" : ""}${completed ? " is-complete" : ""}`}
              onClick={() => onSelect(foodId)}
              disabled={!canSelect || completed}
              aria-pressed={selected}
              aria-label={`Pilih ${food.name}`}
            >
              <img
                src={food.assets.normal}
                alt={`Sampel ${food.name} belum terbakar pada jarum`}
                loading="lazy"
                decoding="async"
                draggable="false"
              />
              <span>{food.name}</span>
              {selected && <i aria-label="Dipilih"><Icon name="check" /></i>}
              {completed && <em>Selesai</em>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LockedTextbookPanel() {
  return (
    <section className="caloriePanel calorieLockedPanel" aria-label="Tetapan buku teks">
      <div className="caloriePanel__header caloriePanel__header--green">
        <span>2</span>
        <h2>Mod Buku Teks</h2>
      </div>
      <div className="calorieLockedGrid">
        <article>
          <Icon name="lock" />
          <span>Jisim sampel</span>
          <strong>1.0 g</strong>
        </article>
        <article>
          <Icon name="lock" />
          <span>Jisim air</span>
          <strong>10 g</strong>
        </article>
      </div>
      <p>Mengikut Buku Teks. Nilai dikunci untuk versi pertama simulator.</p>
    </section>
  );
}

function ExperimentSteps({ stage }: { stage: ExperimentStage }) {
  const currentIndex = STAGE_STEP_INDEX[stage];

  return (
    <section className="caloriePanel calorieStepsPanel" aria-label="Langkah eksperimen">
      <div className="caloriePanel__header caloriePanel__header--teal">
        <span>3</span>
        <h2>Aliran Eksperimen</h2>
      </div>
      <ol>
        {EXPERIMENT_STEPS.map((step, index) => {
          const complete = currentIndex > index;
          const active = currentIndex === index;

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
    </section>
  );
}

function ExperimentStageView({
  selectedFoodId,
  stage,
  sampleLocation,
  dragTargetActive,
  temperature,
  feedback,
  onDragStart,
  onDropSample,
  onDragTargetActiveChange,
}: {
  selectedFoodId: FoodId | null;
  stage: ExperimentStage;
  sampleLocation: SampleLocation;
  dragTargetActive: boolean;
  temperature: number;
  feedback: string;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDropSample: () => void;
  onDragTargetActiveChange: (active: boolean) => void;
}) {
  const food = selectedFoodId ? FOOD_DATA[selectedFoodId] : null;
  const sampleState = getSampleState(stage);
  const sampleAsset = food ? food.assets[sampleState] : null;
  const canMoveBurningSample =
    stage === "drag-to-calorimeter" && sampleLocation === "tray" && Boolean(food);
  const showUnderSample = sampleLocation === "under-calorimeter" && sampleAsset;
  const showPrepSample = food && sampleLocation === "tray";
  const waterVisible = STAGE_STEP_INDEX[stage] >= STAGE_STEP_INDEX["record-initial"];

  return (
    <section className="calorieStagePanel" aria-label="Ruang eksperimen kalorimeter">
      <div className="calorieInstructionBar" aria-live="polite">
        <Icon name={stage === "heating" ? "fire" : "info"} />
        <p>{getInstruction(stage, selectedFoodId)}</p>
      </div>

      <div className="calorieStageScene">
        <img
          className="calorieLabBackground"
          src={`${CALORIE_ASSET_BASE}/makmal.webp`}
          alt="Makmal sains dengan meja eksperimen"
          draggable="false"
          decoding="async"
        />

        <img
          className="calorieCalorimeterImage"
          src={`${CALORIE_ASSET_BASE}/calorimeter.webp`}
          alt="Susunan kalorimeter dengan kaki retort, tabung didih, termometer, penghadang dan air"
          draggable="false"
          decoding="async"
        />

        <div
          className={`calorieBeakerWater${waterVisible ? " is-filled" : ""}`}
          aria-hidden="true"
        >
          <span />
        </div>

        <div className="calorieStageLabel calorieStageLabel--thermometer">
          <span>Termometer</span>
        </div>
        <div className="calorieStageLabel calorieStageLabel--tube">
          <span>Tabung didih</span>
          <strong>Air 10 g</strong>
        </div>

        {showUnderSample && food && sampleAsset && (
          <img
            className={`calorieSampleOnHeat calorieSampleOnHeat--${sampleState}`}
            src={sampleAsset}
            alt={`${food.name} pada jarum di bawah tabung didih`}
            draggable="false"
            decoding="async"
          />
        )}

        <button
          type="button"
          className={`calorieDropZone${dragTargetActive ? " is-active" : ""}${canMoveBurningSample ? " is-ready" : ""}`}
          disabled={!canMoveBurningSample}
          onClick={onDropSample}
          onDragOver={(event) => {
            event.preventDefault();
            if (canMoveBurningSample) onDragTargetActiveChange(true);
          }}
          onDragLeave={() => onDragTargetActiveChange(false)}
          onDrop={(event) => {
            event.preventDefault();
            onDragTargetActiveChange(false);
            if (event.dataTransfer.getData("text/plain") === "burning-sample") {
              onDropSample();
            }
          }}
          aria-label="Letakkan sampel yang sedang terbakar di bawah tabung didih"
        >
          <span>Zon bawah tabung didih</span>
        </button>

        {showPrepSample && food && sampleAsset && (
          <div className="calorieSampleTray">
            <span className="calorieSampleTray__label">Ruang persediaan</span>
            <button
              type="button"
              className={`calorieSampleButton calorieSampleButton--${sampleState}`}
              draggable={canMoveBurningSample}
              onDragStart={onDragStart}
              disabled={!canMoveBurningSample}
              aria-label={
                canMoveBurningSample
                  ? `Seret ${food.name} yang sedang terbakar`
                  : `${food.name} pada hujung jarum`
              }
            >
              <img
                src={sampleAsset}
                alt={`${food.name} dalam keadaan ${sampleState === "burning" ? "terbakar" : "belum terbakar"}`}
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </button>
            {canMoveBurningSample && (
              <button
                type="button"
                className="calorieTouchPlaceButton"
                onClick={onDropSample}
              >
                Letakkan di bawah kalorimeter
              </button>
            )}
          </div>
        )}

        <div className="calorieStageTemperature">
          <Icon name="thermometer" />
          <span>Suhu air</span>
          <strong>{temperature.toFixed(1)} °C</strong>
        </div>
      </div>

      <p className="calorieStageFeedback" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}

function TemperatureGraph({
  selectedFoodId,
  stage,
  elapsedMs,
}: {
  selectedFoodId: FoodId | null;
  stage: ExperimentStage;
  elapsedMs: number;
}) {
  const graph = {
    x: 50,
    y: 24,
    width: 292,
    height: 168,
    minTemperature: 20,
    maxTemperature: 75,
  };
  const food = selectedFoodId ? FOOD_DATA[selectedFoodId] : null;
  const progress = food
    ? stage === "heating"
      ? Math.min(1, elapsedMs / food.burnDurationMs)
      : STAGE_STEP_INDEX[stage] >= STAGE_STEP_INDEX.burned
        ? 1
        : 0
    : 0;
  const visiblePoints = food
    ? Array.from({ length: 7 }, (_, index) => {
        const timeProgress = index / 6;
        if (timeProgress > Math.max(progress, 0.02)) {
          return null;
        }

        const temperature = getTemperatureAtProgress(food.id, timeProgress);
        const x = graph.x + timeProgress * graph.width;
        const y =
          graph.y +
          graph.height -
          ((temperature - graph.minTemperature) /
            (graph.maxTemperature - graph.minTemperature)) *
            graph.height;

        return { x, y, temperature, minute: index };
      }).filter((point): point is { x: number; y: number; temperature: number; minute: number } =>
        Boolean(point),
      )
    : [];
  const linePoints = visiblePoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="caloriePanel calorieGraphPanel" aria-label="Graf suhu air terhadap masa">
      <div className="caloriePanel__header caloriePanel__header--teal">
        <Icon name="thermometer" />
        <h2>Graf Suhu Air Terhadap Masa</h2>
      </div>
      <svg viewBox="0 0 382 224" role="img" aria-label="Graf suhu air meningkat semasa sampel makanan terbakar">
        {[0, 1, 2, 3, 4, 5].map((tick) => (
          <line
            key={`h-${tick}`}
            className="calorieGraphGrid"
            x1={graph.x}
            x2={graph.x + graph.width}
            y1={graph.y + (tick / 5) * graph.height}
            y2={graph.y + (tick / 5) * graph.height}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
          <line
            key={`v-${tick}`}
            className="calorieGraphGrid"
            x1={graph.x + (tick / 6) * graph.width}
            x2={graph.x + (tick / 6) * graph.width}
            y1={graph.y}
            y2={graph.y + graph.height}
          />
        ))}
        <line
          className="calorieGraphAxis"
          x1={graph.x}
          x2={graph.x + graph.width + 6}
          y1={graph.y + graph.height}
          y2={graph.y + graph.height}
        />
        <line
          className="calorieGraphAxis"
          x1={graph.x}
          x2={graph.x}
          y1={graph.y - 6}
          y2={graph.y + graph.height}
        />
        {[20, 30, 40, 50, 60, 70].map((value) => (
          <text
            key={value}
            className="calorieGraphTick calorieGraphTick--y"
            x="42"
            y={
              graph.y +
              graph.height -
              ((value - graph.minTemperature) /
                (graph.maxTemperature - graph.minTemperature)) *
                graph.height +
              4
            }
          >
            {value}
          </text>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((value) => (
          <text
            key={value}
            className="calorieGraphTick"
            x={graph.x + (value / 6) * graph.width}
            y="209"
          >
            {value}
          </text>
        ))}
        <text className="calorieGraphLabel" x="196" y="220">
          Masa (min)
        </text>
        <text className="calorieGraphLabel" x="66" y="15">
          Suhu (°C)
        </text>
        {linePoints && <polyline className="calorieGraphLine" points={linePoints} />}
        {visiblePoints.map((point) => (
          <circle
            key={`${point.minute}-${point.temperature}`}
            className="calorieGraphDot"
            cx={point.x}
            cy={point.y}
            r="4.5"
          />
        ))}
        {!visiblePoints.length && (
          <text className="calorieGraphEmpty" x="205" y="112">
            Graf muncul selepas sampel dipanaskan.
          </text>
        )}
      </svg>
    </section>
  );
}

function DataPanel({
  selectedFoodId,
  initialTemperature,
  finalTemperature,
  temperature,
}: {
  selectedFoodId: FoodId | null;
  initialTemperature: number | null;
  finalTemperature: number | null;
  temperature: number;
}) {
  const food = selectedFoodId ? FOOD_DATA[selectedFoodId] : null;
  const deltaTemperature =
    initialTemperature !== null && finalTemperature !== null
      ? finalTemperature - initialTemperature
      : null;

  return (
    <section className="caloriePanel calorieDataPanel" aria-label="Data eksperimen semasa">
      <div className="caloriePanel__header caloriePanel__header--slate">
        <Icon name="table" />
        <h2>Data Eksperimen</h2>
      </div>
      <table>
        <tbody>
          <tr>
            <th>Sampel makanan</th>
            <td>{food?.name ?? "Belum dipilih"}</td>
          </tr>
          <tr>
            <th>Jisim sampel makanan (g)</th>
            <td>{food ? food.sampleMass.toFixed(1) : "1.0"}</td>
          </tr>
          <tr>
            <th>Jisim air (g)</th>
            <td>{food?.waterMass ?? 10}</td>
          </tr>
          <tr>
            <th>Suhu semasa (°C)</th>
            <td>{temperature.toFixed(1)}</td>
          </tr>
          <tr>
            <th>Suhu awal, T1 (°C)</th>
            <td>{formatTemperature(initialTemperature)}</td>
          </tr>
          <tr>
            <th>Suhu akhir, T2 (°C)</th>
            <td>{formatTemperature(finalTemperature)}</td>
          </tr>
          <tr>
            <th>Perubahan suhu, ΔT (°C)</th>
            <td>{formatTemperature(deltaTemperature)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function CalculationPanel({
  selectedFoodId,
  initialTemperature,
  finalTemperature,
  hasCalculated,
}: {
  selectedFoodId: FoodId | null;
  initialTemperature: number | null;
  finalTemperature: number | null;
  hasCalculated: boolean;
}) {
  const food = selectedFoodId ? FOOD_DATA[selectedFoodId] : null;
  const deltaTemperature =
    food && initialTemperature !== null && finalTemperature !== null
      ? finalTemperature - initialTemperature
      : null;
  const absorbedEnergyJ =
    food && deltaTemperature !== null ? 4.2 * food.waterMass * deltaTemperature : null;
  const calorieKJPerGram =
    food && absorbedEnergyJ !== null
      ? absorbedEnergyJ / (food.sampleMass * 1000)
      : null;

  return (
    <section className="caloriePanel calorieCalculationPanel" aria-label="Pengiraan nilai kalori">
      <div className="caloriePanel__header caloriePanel__header--purple">
        <Icon name="calculator" />
        <h2>Pengiraan</h2>
      </div>
      <div className="calorieFormulaBox">
        <p>Nilai kalori makanan (kJ g⁻¹)</p>
        <strong>
          (4.2 J g⁻¹ °C⁻¹ × jisim air × ΔT) ÷ (jisim sampel × 1000)
        </strong>
      </div>
      <ol className="calorieCalculationSteps">
        <li>
          ΔT = T2 - T1
          <span>
            {deltaTemperature !== null
              ? `= ${finalTemperature?.toFixed(1)} - ${initialTemperature?.toFixed(1)} = ${deltaTemperature.toFixed(1)} °C`
              : "akan dipaparkan selepas T1 dan T2 direkod"}
          </span>
        </li>
        <li>
          Q = 4.2 × jisim air × ΔT
          <span>
            {food && absorbedEnergyJ !== null
              ? `= 4.2 × ${food.waterMass} × ${deltaTemperature?.toFixed(1)} = ${absorbedEnergyJ.toFixed(0)} J`
              : "menunggu data suhu akhir"}
          </span>
        </li>
        <li>
          Nilai kalori = Q ÷ jisim sampel ÷ 1000
          <span>
            {food && calorieKJPerGram !== null
              ? `= ${absorbedEnergyJ?.toFixed(0)} ÷ ${food.sampleMass} ÷ 1000`
              : "menunggu pengiraan"}
          </span>
        </li>
      </ol>
      <div className={`calorieFinalAnswer${hasCalculated ? " is-ready" : ""}`}>
        <span>Jawapan akhir</span>
        <strong>
          {hasCalculated && calorieKJPerGram !== null
            ? `${calorieKJPerGram.toFixed(3)} kJ g⁻¹`
            : "Belum dikira"}
        </strong>
      </div>
    </section>
  );
}

function ObservationTable({
  results,
  tableRef,
}: {
  results: Partial<Record<FoodId, CalorieResult>>;
  tableRef: React.RefObject<HTMLDivElement | null>;
}) {
  const rows: Array<{
    label: string;
    getValue: (result: CalorieResult | undefined) => string;
  }> = [
    {
      label: "Jisim sampel makanan (g)",
      getValue: (result) => (result ? result.sampleMass.toFixed(1) : "-"),
    },
    {
      label: "Jisim air (g)",
      getValue: (result) => (result ? String(result.waterMass) : "-"),
    },
    {
      label: "Suhu awal, T1 (°C)",
      getValue: (result) => (result ? result.initialTemperature.toFixed(1) : "-"),
    },
    {
      label: "Suhu akhir, T2 (°C)",
      getValue: (result) => (result ? result.finalTemperature.toFixed(1) : "-"),
    },
    {
      label: "Perubahan suhu, T2 - T1 (°C)",
      getValue: (result) => (result ? result.deltaTemperature.toFixed(1) : "-"),
    },
    {
      label: "Nilai kalori (kJ g⁻¹)",
      getValue: (result) => (result ? result.calorieKJPerGram.toFixed(3) : "-"),
    },
  ];

  return (
    <section className="caloriePanel calorieObservationPanel" aria-label="Jadual keputusan">
      <div className="caloriePanel__header caloriePanel__header--blue">
        <Icon name="table" />
        <h2>Jadual Keputusan</h2>
      </div>
      <div ref={tableRef} className="calorieTableScroller">
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              {FOOD_ORDER.map((foodId) => (
                <th key={foodId}>{FOOD_DATA[foodId].name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th>{row.label}</th>
                {FOOD_ORDER.map((foodId) => (
                  <td key={`${row.label}-${foodId}`}>{row.getValue(results[foodId])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComparisonQuestion({
  visible,
  selectedAnswer,
  onAnswer,
}: {
  visible: boolean;
  selectedAnswer: FoodId | null;
  onAnswer: (foodId: FoodId) => void;
}) {
  if (!visible) {
    return null;
  }

  const correct = selectedAnswer === "peanut";

  return (
    <section className="caloriePanel calorieQuestionPanel" aria-label="Soalan perbandingan nilai kalori">
      <div className="caloriePanel__header caloriePanel__header--green">
        <Icon name="check" />
        <h2>Kesimpulan</h2>
      </div>
      <p>Sampel makanan yang manakah mempunyai nilai kalori paling tinggi?</p>
      <div className="calorieAnswerGrid">
        {FOOD_ORDER.map((foodId) => (
          <button
            key={foodId}
            type="button"
            className={selectedAnswer === foodId ? "is-selected" : ""}
            onClick={() => onAnswer(foodId)}
          >
            {FOOD_DATA[foodId].name}
          </button>
        ))}
      </div>
      {selectedAnswer && (
        <p className={correct ? "calorieQuestionFeedback is-correct" : "calorieQuestionFeedback is-wrong"}>
          {correct
            ? "Tepat. Kacang tanah menghasilkan perubahan suhu paling tinggi dan mempunyai anggaran nilai kalori paling tinggi."
            : "Bandingkan perubahan suhu air dan nilai kalori dalam jadual."}
        </p>
      )}
    </section>
  );
}

function Modal({
  kind,
  onClose,
}: {
  kind: Exclude<ModalKind, null>;
  onClose: () => void;
}) {
  const isInstructions = kind === "instructions";

  return (
    <div
      className="calorieModalBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="calorieModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calorie-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="calorie-modal-title">
            {isInstructions ? "Arahan Eksperimen" : "Maklumat Eksperimen"}
          </h2>
          <button type="button" aria-label="Tutup" onClick={onClose}>
            x
          </button>
        </header>
        {isInstructions ? (
          <ol className="calorieModalList">
            <li>Pilih satu sampel makanan.</li>
            <li>Masukkan 10 g air suling ke dalam tabung didih.</li>
            <li>Rekod suhu awal, T1.</li>
            <li>Nyalakan sampel dengan pemetik api.</li>
            <li>Letakkan sampel yang sedang terbakar tepat di bawah tabung didih.</li>
            <li>Tunggu sampel habis terbakar, kemudian rekod suhu akhir, T2.</li>
            <li>Kira nilai kalori dan ulang untuk sampel seterusnya.</li>
          </ol>
        ) : (
          <div className="calorieModalContent">
            <p>
              <strong>Tujuan:</strong> Untuk menganggarkan nilai kalori dalam beberapa
              sampel makanan dengan menggunakan kalorimeter.
            </p>
            <p>
              <strong>Pernyataan masalah:</strong> Sampel makanan yang manakah yang
              mempunyai nilai kalori paling tinggi?
            </p>
            <p>
              <strong>Hipotesis:</strong> Kacang tanah mempunyai nilai kalori yang lebih
              tinggi berbanding dengan roti dan ikan bilis.
            </p>
            <dl>
              <div>
                <dt>Dimanipulasikan</dt>
                <dd>Jenis sampel makanan.</dd>
              </div>
              <div>
                <dt>Bergerak balas</dt>
                <dd>Perubahan suhu air atau nilai kalori makanan.</dd>
              </div>
              <div>
                <dt>Dimalarkan</dt>
                <dd>Jisim air.</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CalorieExperimentPage({
  reviewPanel,
}: {
  reviewPanel?: ReactNode;
}) {
  const [selectedFoodId, setSelectedFoodId] = useState<FoodId | null>(null);
  const [stage, setStage] = useState<ExperimentStage>("select-food");
  const [temperature, setTemperature] = useState(INITIAL_TEMPERATURE);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sampleLocation, setSampleLocation] = useState<SampleLocation>("tray");
  const [initialTemperature, setInitialTemperature] = useState<number | null>(null);
  const [finalTemperature, setFinalTemperature] = useState<number | null>(null);
  const [results, setResults] = useState<Partial<Record<FoodId, CalorieResult>>>({});
  const [feedback, setFeedback] = useState("Pilih satu sampel makanan.");
  const [modal, setModal] = useState<ModalKind>(null);
  const [dragTargetActive, setDragTargetActive] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<FoodId | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const selectedFood = selectedFoodId ? FOOD_DATA[selectedFoodId] : null;
  const allSamplesCompleted = FOOD_ORDER.every((foodId) => Boolean(results[foodId]));
  const hasCalculated = selectedFoodId ? Boolean(results[selectedFoodId]) : false;
  const canSelectFood = stage === "select-food";

  useEffect(() => {
    if (!mobilePanelOpen) {
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

  const beginFoodExperiment = useCallback((foodId: FoodId) => {
    const food = FOOD_DATA[foodId];
    setSelectedFoodId(foodId);
    setStage("prepare-water");
    setTemperature(food.initialTemperature);
    setElapsedMs(0);
    setSampleLocation("tray");
    setInitialTemperature(null);
    setFinalTemperature(null);
    setDragTargetActive(false);
    setFeedback(`${food.name} dipilih. Sampel 1 g telah disediakan pada jarum.`);
  }, []);

  const resetCurrentRun = useCallback(() => {
    setSelectedFoodId(null);
    setStage("select-food");
    setTemperature(INITIAL_TEMPERATURE);
    setElapsedMs(0);
    setSampleLocation("tray");
    setInitialTemperature(null);
    setFinalTemperature(null);
    setDragTargetActive(false);
    setFeedback("Pilih satu sampel makanan.");
  }, []);

  const resetAll = () => {
    resetCurrentRun();
    setResults({});
    setSelectedAnswer(null);
  };

  const selectFood = (foodId: FoodId) => {
    if (!canSelectFood) {
      setFeedback("Selesaikan eksperimen semasa sebelum memilih sampel baharu.");
      return;
    }

    if (results[foodId]) {
      setFeedback("Sampel ini sudah mempunyai keputusan. Tekan Semula untuk ulang dari awal.");
      return;
    }

    beginFoodExperiment(foodId);
  };

  const prepareWater = () => {
    if (stage !== "prepare-water" || !selectedFood) return;
    setStage("record-initial");
    setFeedback("Air suling 10 g telah dimasukkan. Rekod suhu awal air.");
  };

  const recordInitialTemperature = () => {
    if (stage !== "record-initial" || !selectedFood) return;
    setInitialTemperature(selectedFood.initialTemperature);
    setTemperature(selectedFood.initialTemperature);
    setStage("ready-to-ignite");
    setFeedback(`T1 direkodkan: ${selectedFood.initialTemperature.toFixed(1)} °C.`);
  };

  const igniteSample = () => {
    if (stage !== "ready-to-ignite" || !selectedFood) return;
    setStage("drag-to-calorimeter");
    setFeedback("Sampel sedang terbakar. Letakkan tepat di bawah tabung didih.");
  };

  const placeSampleUnderCalorimeter = () => {
    if (stage !== "drag-to-calorimeter" || !selectedFood) return;
    setSampleLocation("under-calorimeter");
    setElapsedMs(0);
    setTemperature(selectedFood.initialTemperature);
    setStage("heating");
    setFeedback("Pemanasan bermula. Suhu air meningkat secara beransur-ansur.");
  };

  const recordFinalTemperature = () => {
    if (stage !== "burned" || !selectedFood) return;
    setFinalTemperature(selectedFood.finalTemperature);
    setTemperature(selectedFood.finalTemperature);
    setStage("calculate");
    setFeedback(`T2 direkodkan: ${selectedFood.finalTemperature.toFixed(1)} °C.`);
  };

  const calculateResult = () => {
    if (stage !== "calculate" || !selectedFoodId) return;
    const result = calculateCalorieResult(selectedFoodId);
    setResults((current) => ({ ...current, [selectedFoodId]: result }));
    setStage("completed");
    setFeedback(`${FOOD_DATA[selectedFoodId].name} selesai. Nilai kalori telah dimasukkan ke jadual.`);
  };

  const chooseNextSample = () => {
    resetCurrentRun();
    setFeedback(
      allSamplesCompleted
        ? "Semua sampel telah selesai. Bandingkan nilai kalori dalam jadual."
        : "Pilih sampel seterusnya untuk melengkapkan jadual.",
    );
  };

  const showObservationTable = () => {
    tableRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  const finishExperiment = () => {
    if (!allSamplesCompleted) {
      setFeedback("Lengkapkan ketiga-tiga sampel dahulu sebelum tamat eksperimen.");
      return;
    }

    setFeedback("Eksperimen lengkap. Jawab soalan kesimpulan berdasarkan jadual.");
    showObservationTable();
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (stage !== "drag-to-calorimeter") {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("text/plain", "burning-sample");
    event.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    if (stage !== "heating" || !selectedFoodId) {
      return undefined;
    }

    const food = FOOD_DATA[selectedFoodId];
    const duration = prefersReducedMotion ? 1400 : food.burnDurationMs;
    const startedAt = performance.now();
    let animationFrame = 0;

    const updateHeating = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const simulatedElapsed = progress * food.burnDurationMs;
      const nextTemperature = getTemperatureAtProgress(selectedFoodId, progress);

      setElapsedMs(simulatedElapsed);
      setTemperature(Number(nextTemperature.toFixed(1)));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(updateHeating);
        return;
      }

      setElapsedMs(food.burnDurationMs);
      setTemperature(food.finalTemperature);
      setStage("burned");
      setFeedback("Sampel telah hangus. Rekodkan suhu akhir air.");
    };

    animationFrame = window.requestAnimationFrame(updateHeating);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [stage, selectedFoodId, prefersReducedMotion]);

  const stageActions = useMemo(
    () => [
      {
        label: "Masukkan 10 g Air",
        icon: "water" as const,
        disabled: stage !== "prepare-water",
        onClick: prepareWater,
      },
      {
        label: "Rekod Suhu Awal",
        icon: "thermometer" as const,
        disabled: stage !== "record-initial",
        onClick: recordInitialTemperature,
      },
      {
        label: "Nyalakan dengan Pemetik Api",
        icon: "fire" as const,
        disabled: stage !== "ready-to-ignite",
        onClick: igniteSample,
      },
      {
        label: "Rekod Suhu Akhir",
        icon: "thermometer" as const,
        disabled: stage !== "burned",
        onClick: recordFinalTemperature,
      },
      {
        label: "Kira Nilai Kalori",
        icon: "calculator" as const,
        disabled: stage !== "calculate",
        onClick: calculateResult,
      },
    ],
    [stage],
  );

  const selectFoodFromMobilePanel = (foodId: FoodId) => {
    selectFood(foodId);
    setMobilePanelOpen(false);
  };

  const runPanelAction = (action: () => void, closePanel: boolean) => {
    action();
    if (closePanel) {
      setMobilePanelOpen(false);
    }
  };

  const renderPrimaryActions = (variant: "desktop" | "mobile") => (
    <div
      className={`calorieActionBar calorieActionBar--${variant}`}
      aria-label={
        variant === "mobile"
          ? "Butang utama eksperimen dalam panel kawalan"
          : "Butang utama eksperimen"
      }
    >
      {stageActions.map((action) => (
        <button
          key={`${variant}-${action.label}`}
          type="button"
          disabled={action.disabled}
          onClick={() => runPanelAction(action.onClick, variant === "mobile")}
          aria-label={action.label}
        >
          <Icon name={action.icon} />
          {action.label}
        </button>
      ))}
    </div>
  );

  const renderSecondaryActions = (variant: "desktop" | "mobile") => (
    <div className={`calorieSecondaryActions calorieSecondaryActions--${variant}`}>
      <button
        type="button"
        disabled={stage !== "completed" || allSamplesCompleted}
        onClick={() => runPanelAction(chooseNextSample, variant === "mobile")}
      >
        Uji Sampel Seterusnya
        <Icon name="arrowRight" />
      </button>
      <button type="button" onClick={() => runPanelAction(showObservationTable, variant === "mobile")}>
        <Icon name="table" />
        Lihat Jadual
      </button>
      <button type="button" onClick={() => runPanelAction(finishExperiment, variant === "mobile")}>
        Tamat Eksperimen
      </button>
    </div>
  );

  return (
    <main className="calorieExperimentPage">
      <header className="calorieHeader">
        <div className="calorieBrand">
          <span className="calorieBrand__mark"><Icon name="flask" /></span>
          <strong>EduSim AI</strong>
          <em>Sains Tingkatan 5</em>
        </div>
        <div className="calorieTitleBlock">
          <span>Eksperimen 2.1</span>
          <h1>Menganggarkan Nilai Kalori Makanan</h1>
        </div>
        <div className="calorieHeaderActions">
          <button type="button" onClick={() => setModal("instructions")}>
            <Icon name="book" />
            Arahan
          </button>
          <button type="button" onClick={() => setModal("info")}>
            <Icon name="info" />
            Info
          </button>
          <button type="button" onClick={resetAll}>
            <Icon name="reset" />
            Semula
          </button>
          <a href="/simulator">
            <Icon name="exit" />
            Keluar
          </a>
        </div>
      </header>

      {reviewPanel && <div className="calorieReviewSlot">{reviewPanel}</div>}

      <section className="calorieWorkspace" aria-label="Simulator eksperimen nilai kalori makanan">
        <button
          type="button"
          className={`calorieMobilePanelToggle${mobilePanelOpen ? " is-open" : ""}`}
          aria-controls="calorie-mobile-panel"
          aria-expanded={mobilePanelOpen}
          onClick={() => setMobilePanelOpen(true)}
        >
          <Icon name="menu" />
          <span>Panel Kawalan</span>
        </button>

        <button
          type="button"
          className={`calorieMobilePanelBackdrop${mobilePanelOpen ? " is-open" : ""}`}
          aria-label="Tutup panel kawalan"
          onClick={() => setMobilePanelOpen(false)}
        />

        <aside
          id="calorie-mobile-panel"
          className={`calorieMobilePanelShell${mobilePanelOpen ? " is-open" : ""}`}
          aria-label="Panel kawalan eksperimen"
        >
          <div className="calorieMobilePanel__header">
            <strong>Panel Kawalan</strong>
            <button
              type="button"
              aria-label="Tutup panel kawalan"
              onClick={() => setMobilePanelOpen(false)}
            >
              <Icon name="x" />
            </button>
          </div>

          <div className="calorieMobileActionBlock">
            <div className="calorieMobileUtilityActions" aria-label="Tindakan simulator">
              <button
                type="button"
                onClick={() => {
                  setMobilePanelOpen(false);
                  setModal("instructions");
                }}
              >
                <Icon name="book" />
                Arahan
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobilePanelOpen(false);
                  setModal("info");
                }}
              >
                <Icon name="info" />
                Info
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setMobilePanelOpen(false);
                }}
              >
                <Icon name="reset" />
                Semula
              </button>
              <a href="/simulator">
                <Icon name="exit" />
                Keluar
              </a>
            </div>
            {renderPrimaryActions("mobile")}
            {renderSecondaryActions("mobile")}
          </div>

          <aside className="calorieLeftRail">
            <FoodSelector
              selectedFoodId={selectedFoodId}
              completedResults={results}
              canSelect={canSelectFood}
              onSelect={canSelectFood ? selectFoodFromMobilePanel : selectFood}
            />
            <LockedTextbookPanel />
            <ExperimentSteps stage={stage} />
          </aside>

          <aside className="calorieRightRail">
            <section className="caloriePanel calorieStatusPanel" aria-label="Status eksperimen">
              <div className="caloriePanel__header caloriePanel__header--orange">
                <Icon name={stage === "heating" ? "fire" : "timer"} />
                <h2>
                  {stage === "heating"
                    ? "Eksperimen Sedang Berjalan"
                    : stage === "completed"
                      ? "Sampel Selesai"
                      : "Status Semasa"}
                </h2>
              </div>
              <div className="calorieStatusGrid">
                <article>
                  <Icon name="timer" />
                  <span>Masa</span>
                  <strong>
                    {selectedFood ? formatTimer(elapsedMs, selectedFood.burnDurationMs) : "0:00"}
                  </strong>
                </article>
                <article>
                  <Icon name="thermometer" />
                  <span>Suhu</span>
                  <strong>{temperature.toFixed(1)} °C</strong>
                </article>
              </div>
              <DigitalTemperature value={temperature} />
            </section>

            <TemperatureGraph
              selectedFoodId={selectedFoodId}
              stage={stage}
              elapsedMs={elapsedMs}
            />

            <DataPanel
              selectedFoodId={selectedFoodId}
              initialTemperature={initialTemperature}
              finalTemperature={finalTemperature}
              temperature={temperature}
            />

            <CalculationPanel
              selectedFoodId={selectedFoodId}
              initialTemperature={initialTemperature}
              finalTemperature={finalTemperature}
              hasCalculated={hasCalculated}
            />
          </aside>
        </aside>

        <section className="calorieCenterColumn">
          <ExperimentStageView
            selectedFoodId={selectedFoodId}
            stage={stage}
            sampleLocation={sampleLocation}
            dragTargetActive={dragTargetActive}
            temperature={temperature}
            feedback={feedback}
            onDragStart={handleDragStart}
            onDropSample={placeSampleUnderCalorimeter}
            onDragTargetActiveChange={setDragTargetActive}
          />

          {renderPrimaryActions("desktop")}
          {renderSecondaryActions("desktop")}
        </section>

        <aside className="calorieRightRail calorieRightRail--legacy" hidden>
          <section className="caloriePanel calorieStatusPanel" aria-label="Status eksperimen">
            <div className="caloriePanel__header caloriePanel__header--orange">
              <Icon name={stage === "heating" ? "fire" : "timer"} />
              <h2>
                {stage === "heating"
                  ? "Eksperimen Sedang Berjalan"
                  : stage === "completed"
                    ? "Sampel Selesai"
                    : "Status Semasa"}
              </h2>
            </div>
            <div className="calorieStatusGrid">
              <article>
                <Icon name="timer" />
                <span>Masa</span>
                <strong>
                  {selectedFood ? formatTimer(elapsedMs, selectedFood.burnDurationMs) : "0:00"}
                </strong>
              </article>
              <article>
                <Icon name="thermometer" />
                <span>Suhu</span>
                <strong>{temperature.toFixed(1)} °C</strong>
              </article>
            </div>
            <DigitalTemperature value={temperature} />
          </section>

          <TemperatureGraph
            selectedFoodId={selectedFoodId}
            stage={stage}
            elapsedMs={elapsedMs}
          />

          <DataPanel
            selectedFoodId={selectedFoodId}
            initialTemperature={initialTemperature}
            finalTemperature={finalTemperature}
            temperature={temperature}
          />

          <CalculationPanel
            selectedFoodId={selectedFoodId}
            initialTemperature={initialTemperature}
            finalTemperature={finalTemperature}
            hasCalculated={hasCalculated}
          />
        </aside>
      </section>

      <section className="calorieBottomArea">
        <ObservationTable results={results} tableRef={tableRef} />
        <ComparisonQuestion
          visible={allSamplesCompleted}
          selectedAnswer={selectedAnswer}
          onAnswer={setSelectedAnswer}
        />
        <aside className="calorieNote">
          <Icon name="info" />
          <p>
            Nilai yang diperoleh merupakan anggaran eksperimen kerana sebahagian tenaga
            haba hilang ke persekitaran.
          </p>
        </aside>
      </section>

      {modal && <Modal kind={modal} onClose={() => setModal(null)} />}
    </main>
  );
}
