import { useEffect, useRef, useState } from "react";

const INPUT_FORCE = 100;
const INPUT_AREA = 10;
const AMBULANCE_WEIGHT = 1200;
const DEFAULT_OUTPUT_AREA = 60;

const kpsVariableOptions = [
  { value: "output-area", label: "Luas permukaan omboh output" },
  { value: "output-force", label: "Daya yang boleh diangkat" },
];

const kpsTrendOptions = [
  { value: "larger", label: "lebih besar" },
  { value: "smaller", label: "lebih kecil" },
];

const emptyKpsAnswers = {
  problemCause: "",
  problemEffect: "",
  hypothesisCause: "",
  hypothesisCauseTrend: "",
  hypothesisEffect: "",
  hypothesisEffectTrend: "",
};

function PumpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10M12 3v5M8 8h8v12H8zM5 20h14" />
      <path d="M8 13H5v4" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4v6h6" />
      <path d="M5.5 15a8 8 0 1 0 .7-7.8L4 10" />
    </svg>
  );
}

function FormulaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h14v14H5zM8 9h8M8 13h3M14 13h2M8 16h8" />
    </svg>
  );
}

function ReadingRow({ label, symbol, value, accent = false }) {
  return (
    <div className={`pascalReadingRow${accent ? " pascalReadingRow--accent" : ""}`}>
      <span>
        {label} <b>{symbol}</b>
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function FormulaFraction({ numerator, denominator }) {
  return (
    <span className="pascalWorkingFraction">
      <span>{numerator}</span>
      <i />
      <span>{denominator}</span>
    </span>
  );
}

function KpsSelect({ value, expected, label, options, placeholder, compact = false, onChange }) {
  const answerState = value ? (value === expected ? "correct" : "incorrect") : "";

  return (
    <label
      className={`pascalKpsSelect${compact ? " pascalKpsSelect--compact" : ""}${
        answerState ? ` pascalKpsSelect--${answerState}` : ""
      }`}
    >
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function PascalHydraulicSimulator({ reviewPanel }) {
  const [outputArea, setOutputArea] = useState(DEFAULT_OUTPUT_AREA);
  const [hasPumped, setHasPumped] = useState(false);
  const [isPumping, setIsPumping] = useState(false);
  const [pumpCycle, setPumpCycle] = useState(0);
  const [showFormula, setShowFormula] = useState(false);
  const [kpsAnswers, setKpsAnswers] = useState(emptyKpsAnswers);
  const pumpTimerRef = useRef(null);

  const pressure = INPUT_FORCE / INPUT_AREA;
  const outputForce = (outputArea / INPUT_AREA) * INPUT_FORCE;
  const liftHeight = Math.min(90, (outputForce / AMBULANCE_WEIGHT) * 90);
  const displayedLift = hasPumped ? liftHeight : 0;
  const isSuccessful = outputForce >= AMBULANCE_WEIGHT;
  const areaProgress = ((outputArea - 20) / 180) * 100;
  const pistonDiameter =
    72 +
    ((Math.sqrt(outputArea) - Math.sqrt(20)) /
      (Math.sqrt(200) - Math.sqrt(20))) *
      78;
  const outputChamberWidth = 118 + (areaProgress / 100) * 100;
  const outputChamberLeft = 700 - outputChamberWidth / 2;
  const outputChamberRight = 700 + outputChamberWidth / 2;
  const problemComplete = Boolean(kpsAnswers.problemCause && kpsAnswers.problemEffect);
  const problemCorrect =
    kpsAnswers.problemCause === "output-area" &&
    kpsAnswers.problemEffect === "output-force";
  const hypothesisComplete = Boolean(
    kpsAnswers.hypothesisCause &&
      kpsAnswers.hypothesisCauseTrend &&
      kpsAnswers.hypothesisEffect &&
      kpsAnswers.hypothesisEffectTrend
  );
  const hypothesisCorrect =
    kpsAnswers.hypothesisCause === "output-area" &&
    kpsAnswers.hypothesisCauseTrend === "larger" &&
    kpsAnswers.hypothesisEffect === "output-force" &&
    kpsAnswers.hypothesisEffectTrend === "larger";

  useEffect(() => {
    return () => window.clearTimeout(pumpTimerRef.current);
  }, []);

  useEffect(() => {
    if (!showFormula) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowFormula(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showFormula]);

  const runPump = () => {
    window.clearTimeout(pumpTimerRef.current);
    setPumpCycle((cycle) => cycle + 1);
    setIsPumping(true);
    setHasPumped(true);
    pumpTimerRef.current = window.setTimeout(() => setIsPumping(false), 1750);
  };

  const resetSimulator = () => {
    window.clearTimeout(pumpTimerRef.current);
    setOutputArea(DEFAULT_OUTPUT_AREA);
    setHasPumped(false);
    setIsPumping(false);
    setKpsAnswers(emptyKpsAnswers);
    setPumpCycle((cycle) => cycle + 1);
  };

  const updateOutputArea = (event) => {
    setOutputArea(Number(event.target.value));
  };

  return (
    <main className="pascalPage">
      <section className="pascalHero">
        <div>
          <span className="pascalHero__kicker">Sains Tingkatan 5 · Prinsip Pascal</span>
          <h1>PASCAL : Sistem Hidraulik di Bengkel</h1>
          <p>Terokai bagaimana luas omboh output mempengaruhi daya angkat.</p>
        </div>
        <div className="pascalHero__badge" aria-label="Sasaran daya angkat">
          <span>Sasaran angkat</span>
          <strong>1,200 N</strong>
          <small>berat minimum ambulans</small>
        </div>
      </section>

      <section className="pascalLayout">
        <aside className="pascalPanel pascalControls" aria-labelledby="pascal-controls-title">
          <div className="pascalPanel__heading">
            <span>01</span>
            <div>
              <small>Tetapan murid</small>
              <h2 id="pascal-controls-title">Kawalan Eksperimen</h2>
            </div>
          </div>

          <label className="pascalSliderLabel" htmlFor="output-area">
            <span>Luas Omboh Output</span>
            <strong>A₂</strong>
          </label>
          <div className="pascalSliderValue">
            <strong>{outputArea}</strong>
            <span>cm²</span>
          </div>
          <input
            id="output-area"
            className="pascalSlider"
            type="range"
            min="20"
            max="200"
            step="10"
            value={outputArea}
            onChange={updateOutputArea}
            style={{ "--slider-progress": `${areaProgress}%` }}
            aria-valuetext={`${outputArea} sentimeter persegi`}
          />
          <div className="pascalSliderScale" aria-hidden="true">
            <span>20 cm²</span>
            <span>200 cm²</span>
          </div>

          <div className="pascalControlHint">
            <span aria-hidden="true">↔</span>
            Gelongsorkan A₂, kemudian pam sistem.
          </div>

          <div className="pascalActions">
            <button className="pascalButton pascalButton--pump" type="button" onClick={runPump}>
              <PumpIcon />
              {isPumping ? "Sistem mengepam…" : "Pam Hidraulik"}
            </button>
            <button className="pascalButton pascalButton--reset" type="button" onClick={resetSimulator}>
              <ResetIcon />
              Reset
            </button>
            <button className="pascalButton pascalButton--formula" type="button" onClick={() => setShowFormula(true)}>
              <FormulaIcon />
              Tunjuk Formula
            </button>
          </div>
        </aside>

        <section className="pascalStageCard" aria-label="Animasi sistem hidraulik">
          <div className="pascalStageHeader">
            <div>
              <span className={`pascalLiveDot${isPumping ? " is-active" : ""}`} />
              Simulasi bengkel
            </div>
            <strong>{hasPumped ? `${Math.round(displayedLift)} px terangkat` : "Sedia untuk dipam"}</strong>
          </div>

          <div
            className={`pascalScene${isPumping ? " is-pumping" : ""}${isSuccessful && hasPumped ? " is-success" : ""}`}
            style={{ "--lift-height": `${displayedLift}px`, "--piston-size": `${pistonDiameter}px` }}
          >
            <img className="pascalScene__background" src="/assets/hidraulik.png" alt="Bengkel dengan sistem hidraulik" />
            <div className="pascalScene__shade" />

            <svg className="pascalHydraulicPipe" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="pascal-fluid-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bff7ff" stopOpacity="0.8" />
                  <stop offset="48%" stopColor="#35d6ef" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#0799c6" stopOpacity="0.88" />
                </linearGradient>
                <marker id="pascal-pressure-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f12d43" />
                </marker>
              </defs>
              <path
                className="pascalHydraulicChamber"
                d={`M130 312 H220 V443 H${outputChamberLeft} V270 H${outputChamberRight} V500 H130 Z`}
              />
              <path
                className="pascalHydraulicLiquid"
                d={`M144 329 H206 V458 H${outputChamberLeft + 14} V289 H${outputChamberRight - 14} V484 H144 Z`}
              />
              <path
                key={`flow-${pumpCycle}`}
                className="pascalHydraulicPressure"
                d="M175 348 V466 H700 V322"
                markerEnd="url(#pascal-pressure-arrow)"
              />
            </svg>

            <div key={`input-${pumpCycle}`} className="pascalInputAssembly" aria-hidden="true">
              <span className="pascalSceneLabel">Omboh input</span>
              <i className="pascalInputHandle" />
              <i className="pascalInputPiston" />
              <i className="pascalInputCylinder" />
            </div>

            <div className="pascalFluidLabel">
              <i />
              Bendalir hidraulik
            </div>

            <div className="pascalOutputAssembly" aria-hidden="true">
              <span className="pascalSceneLabel">Omboh output</span>
              <i className="pascalOutputPlatform" />
              <i className="pascalOutputRod" />
              <i className="pascalOutputCylinder" />
            </div>

            <div className="pascalAmbulanceWrap">
              <img
                className="pascalAmbulance"
                src="/assets/ambulance%20pandangan%20sisi.png"
                alt="Ambulans di atas omboh output"
              />
            </div>

            <span className="pascalForceArrow" aria-hidden="true">
              <i />
              <b>Daya output</b>
            </span>

            <div className="pascalForcePill">
              <span>F₂</span>
              <strong>{outputForce.toLocaleString("ms-MY")} N</strong>
            </div>
          </div>

          <div className="pascalStageFooter">
            <span>Tekanan dipindahkan sama rata</span>
            <div aria-hidden="true"><i /><i /><i /></div>
            <strong>F₂ = {outputForce.toLocaleString("ms-MY")} N</strong>
          </div>
        </section>

        <aside className="pascalPanel pascalReadings" aria-labelledby="pascal-readings-title">
          <div className="pascalPanel__heading">
            <span>02</span>
            <div>
              <small>Kiraan masa nyata</small>
              <h2 id="pascal-readings-title">Bacaan Sistem</h2>
            </div>
          </div>

          <div className="pascalReadingList">
            <ReadingRow label="Daya input" symbol="F₁" value="100 N" />
            <ReadingRow label="Luas input" symbol="A₁" value="10 cm²" />
            <ReadingRow label="Luas output" symbol="A₂" value={`${outputArea} cm²`} accent />
            <ReadingRow label="Tekanan bendalir" symbol="P" value={`${pressure} N/cm²`} />
          </div>

          <div className="pascalOutputReading">
            <span>Daya output, F₂</span>
            <strong>{outputForce.toLocaleString("ms-MY")} <small>N</small></strong>
            <div className="pascalTargetBar">
              <i style={{ width: `${Math.min(100, (outputForce / AMBULANCE_WEIGHT) * 100)}%` }} />
            </div>
            <small>{Math.min(100, Math.round((outputForce / AMBULANCE_WEIGHT) * 100))}% daripada daya minimum</small>
          </div>

          <div className="pascalWorkingCard" aria-label="Jalan pengiraan daya output">
            <div className="pascalWorkingCard__title">
              <span>ƒx</span>
              <strong>Jalan Pengiraan</strong>
            </div>
            <div className="pascalWorkingLine pascalWorkingLine--formula">
              <FormulaFraction numerator="F₁" denominator="A₁" />
              <b>=</b>
              <FormulaFraction numerator="F₂" denominator="A₂" />
            </div>
            <div className="pascalWorkingLine pascalWorkingLine--substitute">
              <FormulaFraction numerator="100 N" denominator="10 cm²" />
              <b>=</b>
              <FormulaFraction numerator="F₂" denominator={`${outputArea} cm²`} />
            </div>
            <div className="pascalWorkingSolve">
              <span>F₂ =</span>
              <FormulaFraction
                numerator={`${outputArea} cm² × 100 N`}
                denominator="10 cm²"
              />
            </div>
            <div className="pascalWorkingAnswer">
              F₂ = <strong>{outputForce.toLocaleString("ms-MY")} N</strong>
            </div>
          </div>

          <div className={`pascalStatus pascalStatus--${isSuccessful ? "success" : "pending"}`} role="status" aria-live="polite">
            <span aria-hidden="true">{isSuccessful ? "✓" : "!"}</span>
            <div>
              <strong>{isSuccessful ? "Berjaya!" : "Belum mencukupi"}</strong>
              <p>
                {isSuccessful
                  ? "Ambulans dapat diangkat."
                  : "Daya output belum cukup untuk mengangkat ambulans."}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="pascalConceptCard">
        <div className="pascalConceptIcon" aria-hidden="true">A₂ ↑</div>
        <div>
          <span>Konsep Utama</span>
          <p>
            Apabila luas permukaan omboh output bertambah, daya output juga bertambah kerana tekanan yang sama bertindak pada kawasan yang lebih besar.
          </p>
        </div>
        <strong>P sama · A lebih besar · F lebih besar</strong>
      </section>

      <section className="pascalKpsCard" aria-labelledby="pascal-kps-title">
        <div className="pascalKpsHeader">
          <span>05</span>
          <div>
            <small>Kemahiran Proses Sains</small>
            <h2 id="pascal-kps-title">Bina KPS (IBSE)</h2>
          </div>
          <strong>Fikir · Pilih · Semak</strong>
        </div>

        <div className="pascalKpsSection">
          <h3>Pernyataan masalah</h3>
          <div className="pascalKpsSentence">
            <span>Apakah kesan</span>
            <KpsSelect
              value={kpsAnswers.problemCause}
              expected="output-area"
              label="Pilih pemboleh ubah dimanipulasikan dalam pernyataan masalah"
              options={kpsVariableOptions}
              placeholder="Pilih pemboleh ubah"
              onChange={(value) =>
                setKpsAnswers((current) => ({ ...current, problemCause: value }))
              }
            />
            <span>ke atas</span>
            <KpsSelect
              value={kpsAnswers.problemEffect}
              expected="output-force"
              label="Pilih pemboleh ubah bergerak balas dalam pernyataan masalah"
              options={kpsVariableOptions}
              placeholder="Pilih pemboleh ubah"
              onChange={(value) =>
                setKpsAnswers((current) => ({ ...current, problemEffect: value }))
              }
            />
            <span>?</span>
          </div>
          <p
            className={`pascalKpsFeedback${
              problemComplete
                ? problemCorrect
                  ? " pascalKpsFeedback--correct"
                  : " pascalKpsFeedback--incorrect"
                : ""
            }`}
            role="status"
          >
            {!problemComplete
              ? "Lengkapkan kedua-dua ruang pernyataan masalah."
              : problemCorrect
                ? "Betul. Pernyataan masalah menunjukkan kesan PM ke atas PB."
                : "Belum tepat. Letakkan pemboleh ubah dimanipulasikan dahulu, kemudian pemboleh ubah bergerak balas."}
          </p>
        </div>

        <div className="pascalKpsDivider" />

        <div className="pascalKpsSection">
          <h3>Hipotesis</h3>
          <div className="pascalKpsSentence pascalKpsSentence--hypothesis">
            <span>Jika</span>
            <KpsSelect
              value={kpsAnswers.hypothesisCause}
              expected="output-area"
              label="Pilih pemboleh ubah pertama dalam hipotesis"
              options={kpsVariableOptions}
              placeholder="Pilih pemboleh ubah"
              onChange={(value) =>
                setKpsAnswers((current) => ({ ...current, hypothesisCause: value }))
              }
            />
            <KpsSelect
              value={kpsAnswers.hypothesisCauseTrend}
              expected="larger"
              label="Pilih keadaan pemboleh ubah pertama"
              options={kpsTrendOptions}
              placeholder="Pilih perubahan"
              compact
              onChange={(value) =>
                setKpsAnswers((current) => ({ ...current, hypothesisCauseTrend: value }))
              }
            />
            <span>, maka</span>
            <KpsSelect
              value={kpsAnswers.hypothesisEffect}
              expected="output-force"
              label="Pilih pemboleh ubah kedua dalam hipotesis"
              options={kpsVariableOptions}
              placeholder="Pilih pemboleh ubah"
              onChange={(value) =>
                setKpsAnswers((current) => ({ ...current, hypothesisEffect: value }))
              }
            />
            <KpsSelect
              value={kpsAnswers.hypothesisEffectTrend}
              expected="larger"
              label="Pilih keadaan pemboleh ubah kedua"
              options={kpsTrendOptions}
              placeholder="Pilih perubahan"
              compact
              onChange={(value) =>
                setKpsAnswers((current) => ({ ...current, hypothesisEffectTrend: value }))
              }
            />
            <span>.</span>
          </div>
          <p
            className={`pascalKpsFeedback${
              hypothesisComplete
                ? hypothesisCorrect
                  ? " pascalKpsFeedback--correct"
                  : " pascalKpsFeedback--incorrect"
                : ""
            }`}
            role="status"
          >
            {!hypothesisComplete
              ? "Lengkapkan keempat-empat ruang hipotesis."
              : hypothesisCorrect
                ? "Betul. Apabila luas permukaan omboh output lebih besar, daya yang boleh diangkat juga lebih besar."
                : "Belum tepat. Semak semula pemboleh ubah dan arah perubahan dalam hipotesis."}
          </p>
        </div>

        <div className="pascalKpsLegend">
          <article>
            <span>PM</span>
            <div>
              <strong>Luas permukaan omboh output</strong>
              <small>Pemboleh ubah dimanipulasikan</small>
            </div>
          </article>
          <article>
            <span>PB</span>
            <div>
              <strong>Daya yang boleh diangkat</strong>
              <small>Pemboleh ubah bergerak balas</small>
            </div>
          </article>
          <article>
            <span>DM</span>
            <div>
              <strong>F₁, A₁ dan jenis bendalir</strong>
              <small>Daya input 100 N dan luas input 10 cm²</small>
            </div>
          </article>
        </div>
      </section>

      {reviewPanel}

      {showFormula && (
        <div className="pascalModalBackdrop" role="presentation" onMouseDown={() => setShowFormula(false)}>
          <section className="pascalFormulaModal" role="dialog" aria-modal="true" aria-labelledby="pascal-formula-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="pascalModalClose" type="button" onClick={() => setShowFormula(false)} aria-label="Tutup formula">×</button>
            <span>Prinsip Pascal</span>
            <h2 id="pascal-formula-title">Tekanan yang sama, daya yang berbeza</h2>
            <div className="pascalFormulaEquation">
              <span><b>F₁</b><i /><b>A₁</b></span>
              <strong>=</strong>
              <span><b>F₂</b><i /><b>A₂</b></span>
            </div>
            <div className="pascalFormulaResult">F₂ = (A₂ / A₁) × F₁</div>
            <p>Dengan F₁ = 100 N dan A₁ = 10 cm²</p>
            <div className="pascalFormulaCurrent">
              F₂ = ({outputArea} / 10) × 100 = <strong>{outputForce.toLocaleString("ms-MY")} N</strong>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
