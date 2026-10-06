import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  getEvaporationRate,
  getRelativeRateScore,
  type EvaporationVessel,
} from "../utils/evaporationModel";
import "./WaterEvaporationSimulatorPage.css";

const DEFAULTS = {
  temperature: 30,
  airflow: 1,
  humidity: 55,
  vessel: "medium" as EvaporationVessel,
  speed: 1,
};

const VESSELS: ReadonlyArray<{
  id: EvaporationVessel;
  label: string;
  note: string;
  initialFill: number;
}> = [
  { id: "narrow", label: "Sempit", note: "Permukaan kecil", initialFill: 82 },
  { id: "medium", label: "Sederhana", note: "Permukaan sederhana", initialFill: 61 },
  { id: "wide", label: "Lebar", note: "Permukaan besar", initialFill: 41 },
];

const WATER_PARTICLES = [
  [12, 18], [29, 31], [48, 16], [69, 28], [86, 14], [19, 55], [39, 68],
  [60, 49], [81, 66], [10, 82], [31, 88], [52, 78], [72, 90], [91, 81],
] as const;

const ESCAPING_PARTICLES = [14, 26, 38, 51, 64, 76, 88] as const;
const AMBIENT_PARTICLES = [
  [12, 24], [27, 13], [43, 28], [58, 12], [74, 25], [88, 15], [20, 39], [66, 39], [83, 44],
] as const;

const HINTS = [
  "Apa berlaku jika suhu dinaikkan?",
  "Bandingkan bekas sempit dengan bekas lebar.",
  "Apakah yang berlaku apabila udara lebih lembap?",
  "Cuba kuatkan angin tanpa mengubah faktor lain.",
];

type WaterEvaporationSimulatorPageProps = {
  reviewPanel?: ReactNode;
};

type RangeControlProps = {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step?: number;
  valueLabel: string;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
};

function RangeControl({
  label,
  value,
  minimum,
  maximum,
  step = 1,
  valueLabel,
  lowLabel,
  highLabel,
  onChange,
}: RangeControlProps) {
  return (
    <label className="evap-rangeControl">
      <span className="evap-rangeControl__heading">
        <strong>{label}</strong>
        <output>{valueLabel}</output>
      </span>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={valueLabel}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="evap-rangeControl__labels" aria-hidden="true">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </span>
    </label>
  );
}

function H2OMolecule({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={`evap-h2o ${className}`.trim()}
      style={style}
      viewBox="0 0 44 32"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 17 8 25M26 17l10 8" />
      <circle className="evap-h2o__oxygen" cx="22" cy="13" r="9" />
      <circle className="evap-h2o__hydrogen" cx="7" cy="25" r="5" />
      <circle className="evap-h2o__hydrogen" cx="37" cy="25" r="5" />
    </svg>
  );
}

function formatSimulationTime(value: number) {
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function WaterEvaporationSimulatorPage({
  reviewPanel,
}: WaterEvaporationSimulatorPageProps) {
  const [temperature, setTemperature] = useState(DEFAULTS.temperature);
  const [airflow, setAirflow] = useState(DEFAULTS.airflow);
  const [humidity, setHumidity] = useState(DEFAULTS.humidity);
  const [vessel, setVessel] = useState<EvaporationVessel>(DEFAULTS.vessel);
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [waterAmount, setWaterAmount] = useState(1);
  const [simulationTime, setSimulationTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [particlesVisible, setParticlesVisible] = useState(true);
  const [feedback, setFeedback] = useState("Ubah satu faktor dan lihat kesannya.");
  const [hintIndex, setHintIndex] = useState(-1);
  const animationFrame = useRef(0);
  const previousFrame = useRef<number | null>(null);
  const accumulatedTime = useRef(0);
  const feedbackTimer = useRef(0);
  const waterAmountRef = useRef(1);

  const inputs = useMemo(
    () => ({ temperature, airflow, humidity, vessel }),
    [airflow, humidity, temperature, vessel],
  );
  const evaporationRate = useMemo(() => getEvaporationRate(inputs), [inputs]);
  const rateScore = useMemo(() => getRelativeRateScore(inputs), [inputs]);
  const selectedVessel = VESSELS.find((option) => option.id === vessel) ?? VESSELS[1];
  const waterFill = Math.max(3.5, selectedVessel.initialFill * waterAmount);
  const ambientCount = Math.round(((humidity - 20) / 70) * 7) + 2;
  const rateLabel = rateScore < 36 ? "Lambat" : rateScore < 67 ? "Sederhana" : "Cepat";
  const airflowLabel = airflow === 0 ? "Tiada" : airflow === 1 ? "Sederhana" : "Kuat";
  const waterLabel = `${Math.round(waterAmount * 100)}% isipadu awal`;

  const sceneStyle = {
    "--water-fill": `${waterFill}%`,
    "--molecule-duration": `${Math.max(1.6, 4.8 - (temperature - 10) * 0.065)}s`,
    "--escape-duration": `${Math.max(2.2, 6.2 - rateScore * 0.035)}s`,
    "--wind-drift": `${airflow * 46}px`,
    "--wind-opacity": `${airflow * 0.32}`,
  } as CSSProperties;

  const announce = useCallback((message: string) => {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback("Ubah satu faktor dan lihat kesannya.");
    }, 2600);
  }, []);

  useEffect(() => {
    const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousTitle = document.title;
    const previousDescription = descriptionMeta?.content;
    const previousCanonical = canonicalLink?.href;

    document.title = "Penyejatan Air | EduSim";
    descriptionMeta?.setAttribute(
      "content",
      "Teroka kesan suhu, kelembapan, pergerakan udara dan luas permukaan terhadap kadar penyejatan air.",
    );
    canonicalLink?.setAttribute(
      "href",
      "https://www.cikgustem.com/simulator/penyejatan-air",
    );

    return () => {
      window.clearTimeout(feedbackTimer.current);
      document.title = previousTitle;
      if (previousDescription !== undefined) {
        descriptionMeta?.setAttribute("content", previousDescription);
      }
      if (previousCanonical !== undefined) {
        canonicalLink?.setAttribute("href", previousCanonical);
      }
    };
  }, []);

  useEffect(() => {
    if (!running) {
      previousFrame.current = null;
      accumulatedTime.current = 0;
      window.cancelAnimationFrame(animationFrame.current);
      return undefined;
    }

    const tick = (timestamp: number) => {
      if (previousFrame.current === null) {
        previousFrame.current = timestamp;
      }

      const delta = Math.min((timestamp - previousFrame.current) / 1000, 0.12);
      previousFrame.current = timestamp;
      accumulatedTime.current += delta;

      if (accumulatedTime.current >= 0.06) {
        const elapsed = accumulatedTime.current;
        accumulatedTime.current = 0;
        setSimulationTime((current) => current + elapsed * speed * 12);
        const nextWaterAmount = Math.max(
          0.04,
          waterAmountRef.current - evaporationRate * elapsed * speed,
        );
        waterAmountRef.current = nextWaterAmount;
        setWaterAmount(nextWaterAmount);

        if (nextWaterAmount <= 0.04) {
          setRunning(false);
          announce("Zarah air telah berpindah ke udara sebagai wap air.");
          return;
        }
      }

      animationFrame.current = window.requestAnimationFrame(tick);
    };

    animationFrame.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame.current);
  }, [announce, evaporationRate, running, speed]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setRunning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const reset = () => {
    setRunning(false);
    setTemperature(DEFAULTS.temperature);
    setAirflow(DEFAULTS.airflow);
    setHumidity(DEFAULTS.humidity);
    setVessel(DEFAULTS.vessel);
    setSpeed(DEFAULTS.speed);
    waterAmountRef.current = 1;
    setWaterAmount(1);
    setSimulationTime(0);
    setParticlesVisible(true);
    setHintIndex(-1);
    announce("Simulator kembali kepada keadaan asal.");
  };

  const showNextHint = () => {
    const nextIndex = (hintIndex + 1) % HINTS.length;
    setHintIndex(nextIndex);
    announce(HINTS[nextIndex]);
  };

  return (
    <main className="evap-page">
      <header className="evap-header">
        <div>
          <a className="evap-backLink" href="/simulator">
            ← Semua simulator
          </a>
          <span className="evap-eyebrow">EduSim · Sains Tingkatan 1 · Topik 6.0</span>
          <h1>Penyejatan Air</h1>
          <p>Teroka faktor yang mempengaruhi kadar penyejatan air.</p>
        </div>
        <div className="evap-header__badge">UBAH · LIHAT · CUBA LAGI</div>
      </header>

      <section className="evap-workbench" aria-label="Simulator penyejatan air">
        <aside className="evap-controls" aria-label="Kawalan faktor penyejatan">
          <div className="evap-panelHeading">
            <span>Faktor persekitaran</span>
            <strong>Ubah keadaan</strong>
          </div>

          <RangeControl
            label="Suhu persekitaran"
            value={temperature}
            minimum={10}
            maximum={50}
            valueLabel={`${temperature}°C`}
            lowLabel="10°C"
            highLabel="50°C"
            onChange={(value) => {
              announce(value > temperature ? "Suhu meningkat. Perhatikan gerakan zarah." : "Suhu menurun.");
              setTemperature(value);
            }}
          />

          <RangeControl
            label="Pergerakan udara"
            value={airflow}
            minimum={0}
            maximum={2}
            valueLabel={airflowLabel}
            lowLabel="Tiada"
            highLabel="Kuat"
            onChange={(value) => {
              announce(value > airflow ? "Angin membawa wap air menjauhi permukaan." : "Pergerakan udara berkurang.");
              setAirflow(value);
            }}
          />

          <RangeControl
            label="Kelembapan udara"
            value={humidity}
            minimum={20}
            maximum={90}
            step={5}
            valueLabel={`${humidity}%`}
            lowLabel="Rendah"
            highLabel="Tinggi"
            onChange={(value) => {
              announce(value > humidity ? "Udara lebih lembap. Perhatikan meter kadar." : "Udara menjadi lebih kering.");
              setHumidity(value);
            }}
          />

          <fieldset className="evap-vesselChoices">
            <legend>Luas permukaan terdedah</legend>
            <div>
              {VESSELS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`evap-vesselChoice evap-vesselChoice--${option.id}`}
                  aria-pressed={vessel === option.id}
                  onClick={() => {
                    setVessel(option.id);
                    announce(`Bekas ${option.label.toLocaleLowerCase("ms-MY")} dipilih. Isipadu awal masih sama.`);
                  }}
                >
                  <span className="evap-vesselChoice__icon" aria-hidden="true" />
                  <strong>{option.label}</strong>
                  <small>{option.note}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            className="evap-particleToggle"
            type="button"
            role="switch"
            aria-checked={particlesVisible}
            onClick={() => setParticlesVisible((current) => !current)}
          >
            <span>
              <strong>Pandangan zarah</strong>
              <small>Model perwakilan H₂O</small>
            </span>
            <span className="evap-switch" aria-hidden="true" />
          </button>
        </aside>

        <section className="evap-sceneCard">
          <div className="evap-sceneCard__topline">
            <div>
              <span>Teroka</span>
              <strong>{running ? "Penyejatan sedang berlaku" : "Sedia untuk diteroka"}</strong>
            </div>
            <span className={`evap-runStatus${running ? " is-running" : ""}`}>
              {running ? "BERGERAK" : "DIJEDA"}
            </span>
          </div>

          <div
            className={`evap-scene evap-scene--${vessel}${running ? " is-running" : " is-paused"}${particlesVisible ? " show-particles" : ""}`}
            style={sceneStyle}
            role="img"
            aria-label={`Bekas ${selectedVessel.label.toLocaleLowerCase("ms-MY")} mengandungi ${waterLabel}. Kadar penyejatan relatif ${rateLabel.toLocaleLowerCase("ms-MY")}.`}
          >
            <img
              className="evap-scene__background"
              src="/penyejatan/background.webp"
              alt=""
              width="1536"
              height="624"
              draggable="false"
            />

            <div className="evap-wind" aria-hidden="true">
              <i /><i /><i />
            </div>

            <div className="evap-ambient" aria-hidden="true">
              {AMBIENT_PARTICLES.slice(0, ambientCount).map(([left, top], index) => (
                <H2OMolecule
                  key={`${left}-${top}`}
                  className="evap-h2o--ambient"
                  style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * -0.47}s` }}
                />
              ))}
            </div>

            <div className={`evap-vessel evap-vessel--${vessel}`}>
              <div className="evap-vessel__back" aria-hidden="true" />
              <div className="evap-water" aria-hidden="true">
                <div className="evap-water__surface" />
                <div className="evap-water__particles">
                  {WATER_PARTICLES.map(([left, top], index) => (
                    <H2OMolecule
                      key={`${left}-${top}`}
                      className="evap-h2o--water"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        animationDelay: `${index * -0.31}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="evap-escaping" aria-hidden="true">
                {ESCAPING_PARTICLES.map((left, index) => (
                  <H2OMolecule
                    key={left}
                    className="evap-h2o--escaping"
                    style={{
                      left: `${left}%`,
                      animationDelay: `${index * -0.72}s`,
                    }}
                  />
                ))}
              </div>
              <div className="evap-vessel__front" aria-hidden="true" />
              <div className="evap-vessel__rim" aria-hidden="true" />
            </div>

            <div className="evap-scene__caption">
              <span>Isipadu awal sama</span>
              <strong>{selectedVessel.note}</strong>
            </div>
          </div>

          <div className="evap-transport" aria-label="Kawalan masa simulasi">
            <button
              className="evap-primaryButton"
              type="button"
              disabled={running || waterAmount <= 0.04}
              onClick={() => {
                setRunning(true);
                announce("Penyejatan bermula. Perhatikan permukaan air dan zarah.");
              }}
            >
              ▶ Mula
            </button>
            <button type="button" disabled={!running} onClick={() => setRunning(false)}>
              ⏸ Jeda
            </button>
            <button type="button" onClick={reset}>↻ Set Semula</button>
            <div className="evap-speed" aria-label="Kelajuan simulasi">
              {[1, 2, 5].map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={speed === option}
                  onClick={() => setSpeed(option)}
                >
                  {option}×
                </button>
              ))}
            </div>
          </div>

          <p className="evap-feedback" aria-live="polite">{feedback}</p>
        </section>

        <aside className="evap-observation" aria-label="Pemerhatian langsung">
          <div className="evap-panelHeading">
            <span>Pemerhatian langsung</span>
            <strong>Lihat kesan</strong>
          </div>

          <div className="evap-rateMeter">
            <div className="evap-rateMeter__heading">
              <span>Kadar penyejatan relatif</span>
              <strong>{rateLabel}</strong>
            </div>
            <div
              className="evap-rateMeter__track"
              role="meter"
              aria-label="Kadar penyejatan relatif"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rateScore}
              aria-valuetext={rateLabel}
            >
              <span style={{ width: `${rateScore}%` }} />
            </div>
            <div className="evap-rateMeter__labels" aria-hidden="true">
              <span>Lambat</span>
              <span>Cepat</span>
            </div>
          </div>

          <dl className="evap-readouts">
            <div>
              <dt>Air relatif</dt>
              <dd>{waterLabel}</dd>
            </div>
            <div>
              <dt>Masa simulasi</dt>
              <dd>{formatSimulationTime(simulationTime)}</dd>
            </div>
            <div>
              <dt>Keadaan udara</dt>
              <dd>{humidity}% lembap · Angin {airflowLabel.toLocaleLowerCase("ms-MY")}</dd>
            </div>
          </dl>

          <button className="evap-hintButton" type="button" onClick={showNextHint}>
            💡 Petunjuk
          </button>
          <p className="evap-modelNote">
            Zarah yang kelihatan ialah model perwakilan. Air tidak hilang; zarah air
            meninggalkan permukaan dan berada sebagai wap air di udara.
          </p>
        </aside>
      </section>

      {reviewPanel ? <section className="evap-review">{reviewPanel}</section> : null}
    </main>
  );
}
