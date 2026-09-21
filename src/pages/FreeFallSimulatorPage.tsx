import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DROP_HEIGHT, fallenDistance, landingTime } from "../utils/freeFallPhysics";
import type { FallingObject } from "../utils/freeFallPhysics";
import "./FreeFallSimulatorPage.css";

const asset = (file: string) => `/assets/Jatuh%20bebas/${encodeURIComponent(file)}`;
const PAPER = ["cebisan kertas1.png", "cebisan kertas 2.png", "cebisan kertas 3.png"];
const STEPS = ["Fenomena", "Persoalan", "Hipotesis", "KPS", "Eksperimen", "Analisis", "Kesimpulan", "Aplikasi"];
const VARIABLES = ["kehadiran udara", "masa yang diambil untuk objek jatuh", "ketinggian objek", "jenis objek"];
const CHANGES = ["bertambah", "berkurang", "kekal"];
const WINNERS = ["Bulu", "Bola logam", "Serentak"];
const FALLING_OBJECTS: FallingObject[] = ["paper", "feather", "ball"];
const OBJECT_LABEL: Record<FallingObject, string> = { paper: "Cebisan kertas", feather: "Bulu ayam", ball: "Bola besi" };

type Mode = "explore" | "ibse";
type Run = {
  mode: "explore" | "guided";
  vacuum: boolean;
  advanced: boolean;
  time: number;
  duration: number;
  done: boolean;
  objects: FallingObject[];
  sideObjects?: Record<"vacuum" | "air", FallingObject>;
};
type Results = { air?: number; vacuum?: number };
type PairResult = { feather: number; ball: number };

function Select({ label, value, options, onChange, disabled = false }: {
  label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled?: boolean;
}) {
  return <label className="ff-field"><span>{label}</span><select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
    <option value="">Pilih jawapan…</option>{options.map(option => <option key={option} value={option}>{option}</option>)}
  </select></label>;
}

function Choices({ label, value, options, onChange }: {
  label: string; value: string; options: readonly string[]; onChange: (value: string) => void;
}) {
  return <fieldset className="ff-choices"><legend>{label}</legend><div>{options.map(option =>
    <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>,
  )}</div></fieldset>;
}

function ResultsTable({ results }: { results: Results }) {
  return <div className="ff-table"><table><caption>Keputusan penyiasatan</caption><thead><tr><th scope="col">Kehadiran udara</th><th scope="col">Masa jatuh (s)</th></tr></thead>
    <tbody><tr><th scope="row">Ada</th><td>{results.air?.toFixed(2) ?? "Belum direkodkan"}</td></tr>
      <tr><th scope="row">Tiada (vakum)</th><td>{results.vacuum?.toFixed(2) ?? "Belum direkodkan"}</td></tr></tbody></table></div>;
}

function ObjectChoice({ label, value, onChange, disabled = false }: {
  label: string; value: FallingObject; onChange: (object: FallingObject) => void; disabled?: boolean;
}) {
  return <fieldset className="ff-object-picker"><legend>{label}</legend><div>
    {FALLING_OBJECTS.map(object => <button key={object} type="button" aria-pressed={value === object} disabled={disabled} onClick={() => onChange(object)}>{OBJECT_LABEL[object]}</button>)}
  </div></fieldset>;
}

function Scene({ run, pumping, previewObjects }: {
  run: Run | null; pumping: boolean; previewObjects: FallingObject[] | Record<"vacuum" | "air", FallingObject>;
}) {
  const sideCenter = { vacuum: 34.7, air: 70.6 };
  const top = 15;
  const fallRange = 70;
  const runningExplore = run?.mode === "explore";
  const exploreSelection = runningExplore
    ? run.sideObjects ?? { vacuum: "feather", air: "ball" }
    : Array.isArray(previewObjects) ? null : previewObjects;
  const sides = exploreSelection ? (["vacuum", "air"] as const) : ([run?.vacuum ? "vacuum" : "air"] as const);

  return <div className={`ff-scene${pumping ? " ff-pumping" : ""}${exploreSelection ? " ff-scene--explore" : ""}`}>
    <img className="ff-background" src={asset("statik 2.png")} alt="Makmal dengan dua silinder lutsinar: kiri disambung kepada pam vakum, kanan tanpa pam." width="1672" height="941" />
    <div className="ff-tube-highlight ff-tube-highlight--vacuum" aria-hidden="true" />
    <div className="ff-tube-highlight ff-tube-highlight--air" aria-hidden="true" />
    <div className="ff-pump-highlight" aria-hidden="true" />
    {sides.flatMap(side => {
      const visibleObjects: FallingObject[] = exploreSelection
        ? [exploreSelection[side]]
        : Array.isArray(previewObjects) && previewObjects.length ? previewObjects : ["paper"];
      const offsets = visibleObjects.length === 1 ? [0] : visibleObjects.length === 2 ? [-1.15, 1.15] : [-1.75, 0, 1.75];

      return visibleObjects.map((object, index) => {
        const vacuum = side === "vacuum";
        const time = run?.time ?? 0;
        const objectLandingTime = landingTime(vacuum, object);
        const landed = !!run && time >= objectLandingTime;
        const progress = Math.min(1, fallenDistance(time, vacuum, object) / DROP_HEIGHT);
        const flutter = !vacuum && object !== "ball" && !landed && time > 0;
        const frame = flutter ? Math.floor(time * 9) % 3 : 0;
        const files = object === "paper" ? PAPER : [object === "feather" ? "bulu.png" : "metal ball.png"];
        const x = sideCenter[side] + offsets[index] + (flutter ? Math.sin(time * 15 + index) * (object === "feather" ? 0.18 : 0.36) : 0);

        return <div key={`${side}-${object}`} className={`ff-object ff-${object}`} data-object={object} data-side={side} data-landed={landed}
          style={{ left: `${x}%`, top: `${top + progress * fallRange}%` }}>
          <div className="ff-object-turn" style={{ transform: `rotate(${flutter ? Math.sin(time * 12 + index) * 18 : 0}deg)` }}>
            {files.map((file, fileIndex) => <img key={file} src={asset(file)} alt={fileIndex === frame ? `${OBJECT_LABEL[object]} dalam silinder ${vacuum ? "vakum" : "udara"}` : ""} style={{ visibility: fileIndex === frame ? "visible" : "hidden" }} />)}
          </div>
        </div>;
      });
    })}
  </div>;
}

export default function FreeFallSimulatorPage({ reviewPanel }: { reviewPanel?: ReactNode }) {
  const [mode, setMode] = useState<Mode>("explore");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [air, setAir] = useState(100);
  const [pumping, setPumping] = useState(false);
  const [results, setResults] = useState<Results>({});
  const [advancedPhase, setAdvancedPhase] = useState(0);
  const [pairResults, setPairResults] = useState<{ air?: PairResult; vacuum?: PairResult }>({});
  const [complete, setComplete] = useState(false);
  const [exploreVacuumObject, setExploreVacuumObject] = useState<FallingObject>("feather");
  const [exploreAirObject, setExploreAirObject] = useState<FallingObject>("ball");
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const raf = useRef(0);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const lab = useRef<HTMLElement>(null);
  const advanced = mode === "ibse" && step === 7 && advancedPhase > 0;
  const vacuum = air === 0;
  const active = pumping || (!!run && !run.done);

  useEffect(() => {
    let mounted = true;
    Promise.all(["statik 2.png", ...PAPER, "bulu.png", "metal ball.png"].map(file => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(); img.onerror = reject; img.src = asset(file);
    }))).then(() => { if (mounted) setAssetsReady(true); }).catch(() => { if (mounted) setAssetError(true); });
    return () => { mounted = false; cancelAnimationFrame(raf.current); busy.current = false; };
  }, []);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [mode, step, advancedPhase]);

  function clearRunState() {
    cancelAnimationFrame(raf.current); busy.current = false; setRun(null); setPumping(false); setFeedback("");
  }
  function answer(key: string, value: string) {
    setAnswers(previous => ({ ...previous, [key]: value })); setChecked(false); setFeedback("");
  }
  function select(key: string, label: string, options: readonly string[]) {
    return <Select label={label} value={answers[key] ?? ""} options={options} disabled={complete} onChange={value => answer(key, value)} />;
  }
  function choices(key: string, label: string, options: readonly string[]) {
    return <Choices label={label} value={answers[key] ?? ""} options={options} onChange={value => answer(key, value)} />;
  }
  function check(valid: boolean, hint: string, success = "✓ Tepat !") {
    setChecked(valid); setFeedback(valid ? success : hint);
  }
  function next() { setStep(value => value + 1); setChecked(false); setFeedback(""); setRun(null); }
  function reset() {
    clearRunState();
    setStep(0); setAnswers({}); setChecked(false); setAir(100); setResults({}); setAdvancedPhase(0); setPairResults({}); setComplete(false);
  }
  function switchMode(nextMode: Mode) {
    setMode(nextMode); reset();
  }
  function chooseExploreObject(side: "vacuum" | "air", object: FallingObject) {
    if (side === "vacuum") setExploreVacuumObject(object);
    else setExploreAirObject(object);
    setRun(null); setFeedback("");
  }
  function scrollLabIntoView() {
    if (window.matchMedia("(max-width: 960px)").matches) lab.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  function animateRun(initial: Run, onDone?: () => void) {
    busy.current = true; setRun(initial);
    const started = performance.now();
    const tick = (now: number) => {
      const time = Math.min((now - started) / 1000, initial.duration);
      const done = time >= initial.duration;
      setRun({ ...initial, time, done });
      if (!done) raf.current = requestAnimationFrame(tick);
      else { busy.current = false; onDone?.(); }
    };
    raf.current = requestAnimationFrame(tick);
  }
  function startExploreDrop() {
    if (busy.current || !assetsReady) return;
    scrollLabIntoView(); setFeedback("");
    const sideObjects = { vacuum: exploreVacuumObject, air: exploreAirObject };
    const duration = Math.max(landingTime(true, exploreVacuumObject), landingTime(false, exploreAirObject));
    animateRun({ mode: "explore", vacuum: false, advanced: false, objects: [exploreVacuumObject, exploreAirObject], sideObjects, time: 0, duration, done: false }, () => {
      const vacuumTime = landingTime(true, exploreVacuumObject);
      const airTime = landingTime(false, exploreAirObject);
      setFeedback(vacuumTime < airTime
        ? `Pemerhatian: ${OBJECT_LABEL[exploreVacuumObject]} dalam silinder kiri vakum sampai dahulu.`
        : airTime < vacuumTime
          ? `Pemerhatian: ${OBJECT_LABEL[exploreAirObject]} dalam silinder kanan berudara sampai dahulu.`
          : "Pemerhatian: kedua-dua objek sampai hampir serentak.");
    });
  }
  function drop() {
    if (busy.current || !assetsReady) return;
    scrollLabIntoView(); setFeedback("");
    const objects: FallingObject[] = advanced ? ["feather", "ball"] : ["paper"];
    const duration = landingTime(vacuum, advanced ? "feather" : "paper");
    animateRun({ mode: "guided", vacuum, advanced, objects, time: 0, duration, done: false }, () => {
      if (advanced) {
        setPairResults(previous => ({ ...previous, [vacuum ? "vacuum" : "air"]: { feather: duration, ball: landingTime(vacuum, "ball") } }));
        setFeedback("✓ Jatuhan selesai. Perhatikan masa ketibaan kedua-dua objek.");
      }
    });
  }
  function pump() {
    if (busy.current) return;
    scrollLabIntoView();
    busy.current = true; setPumping(true); setRun(null); setFeedback("");
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 3000, 1);
      setAir(100 - Math.floor(progress * 4) * 25);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else { busy.current = false; setPumping(false); setFeedback("✓ Tiub kiri kini mewakili keadaan vakum. Sedia untuk dijatuhkan."); }
    };
    raf.current = requestAnimationFrame(tick);
  }
  function record() {
    if (!run?.done) return;
    setResults(previous => ({ ...previous, [run.vacuum ? "vacuum" : "air"]: run.time }));
    setFeedback("✓ Keputusan telah direkodkan.");
  }
  const hypothesisSupported = answers.hCauseTrend === answers.hEffectTrend;
  const hypothesis = `Jika ${answers.hCause} ${answers.hCauseTrend}, maka ${answers.hEffect} ${answers.hEffectTrend}.`;
  const conclusion = `Apabila ${answers.conAir}, masa yang diambil oleh cebisan kertas untuk jatuh ${answers.conChange}. Oleh itu, hipotesis ${answers.conStatus}.`;
  const nextButton = <button type="button" className="ff-primary" disabled={!checked} onClick={next}>Seterusnya →</button>;
  const recordKey = vacuum ? "vacuum" : "air";
  const labTitle = mode === "explore" ? "Mode Explore: cuba jatuhkan bahan" : advanced ? "Bulu & bola logam" : "Penyiasatan cebisan kertas";

  return <main className="ff-page">
    <header className="ff-header"><div><span className="ff-eyebrow">EDUSIM · SAINS TINGKATAN 4</span><h1>Jatuh Bebas</h1><p>Kesan Kehadiran Udara</p></div>
      <button type="button" onClick={reset}>Mula semula</button></header>
    <div className="ff-mode-tabs" role="tablist" aria-label="Mod simulator">
      <button type="button" role="tab" aria-selected={mode === "explore"} className={mode === "explore" ? "is-active" : ""} onClick={() => switchMode("explore")}>Mode Explore</button>
      <button type="button" role="tab" aria-selected={mode === "ibse"} className={mode === "ibse" ? "is-active" : ""} onClick={() => switchMode("ibse")}>IBSE Berpandu</button>
    </div>
    {mode === "ibse" && <ol className="ff-progress" aria-label="Kemajuan penyiasatan">{STEPS.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={index < step || complete ? "is-done" : step === index ? "is-current" : ""}><span>{index < step || complete ? "✓" : index + 1}</span>{label}</li>)}</ol>}
    <div className="ff-layout"><section ref={lab} className="ff-lab" aria-label="Ruang eksperimen">
      <div className="ff-lab-heading"><div><span className="ff-eyebrow">MAKMAL MAYA</span><h2>{labTitle}</h2></div><span className="ff-status">{mode === "explore" ? "KIRI: VAKUM · KANAN: UDARA" : pumping ? "MENGEPAM…" : vacuum ? "SILINDER KIRI: VAKUM" : "SILINDER KANAN: UDARA"}</span></div>
      <Scene run={run} pumping={pumping} previewObjects={mode === "explore" ? { vacuum: exploreVacuumObject, air: exploreAirObject } : advanced ? ["feather", "ball"] : ["paper"]} />
      {mode === "explore" ? <p className="ff-note ff-note--explore">Tekan Lepaskan dan perhatikan sahaja. Tiada masa direkodkan dalam mode ini. Silinder kiri mewakili vakum; silinder kanan mewakili udara biasa.</p> : <>
        <div className="ff-readouts"><div><span>Masa jatuh</span><strong aria-label="Pemasa">{(run?.time ?? 0).toFixed(2)} <small>s</small></strong></div><div><span>Udara dalam tiub</span><strong>{air}%</strong><progress aria-label="Udara dalam tiub" max="100" value={air} /></div><div><span>Ketinggian tetap</span><strong>1.20 <small>m</small></strong></div></div>
        <p className="ff-note">{advanced ? "Bulu dan bola logam dilepaskan serentak dari ketinggian yang sama." : "Objek dilepaskan dari keadaan rehat pada ketinggian yang sama."} Masa yang dipaparkan ialah masa model.</p>
        {step >= 4 && <ResultsTable results={results} />}
      </>}
    </section>
    <section className="ff-panel" aria-label={mode === "explore" ? "Kawalan mode explore" : "Panduan penyiasatan"}>
      {mode === "explore" ? <>
        <span className="ff-eyebrow">MODE EXPLORE · CUBA JAYA</span><h2 ref={heading} tabIndex={-1}>Pilih bahan dan lepaskan</h2>
        {!assetsReady && <p role="status">{assetError ? "Aset tidak dapat dimuatkan. Semak nama fail aset." : "Memuatkan aset makmal…"}</p>}
        <p>Pilih satu objek untuk setiap silinder. Kedua-duanya akan dilepaskan pada masa yang sama.</p>
        <ObjectChoice label="Silinder kiri: vakum" value={exploreVacuumObject} onChange={object => chooseExploreObject("vacuum", object)} disabled={active} />
        <ObjectChoice label="Silinder kanan: udara biasa" value={exploreAirObject} onChange={object => chooseExploreObject("air", object)} disabled={active} />
        <button className="ff-primary" disabled={active || !assetsReady} onClick={startExploreDrop}>Lepaskan</button>
        <button disabled={active} onClick={() => { setRun(null); setFeedback(""); }}>Susun semula objek</button>
        <div className="ff-callout"><p><strong>Pemerhatian:</strong> bandingkan objek dalam silinder kiri dan kanan. Setiap silinder hanya ada satu objek pada satu masa.</p></div>
      </> : <>
        <span className="ff-eyebrow">LANGKAH {step + 1} DARIPADA 8 · FIKIR · PILIH · SEMAK</span><h2 ref={heading} tabIndex={-1}>{advanced ? "Penyiasatan lanjutan" : STEPS[step]}</h2>
        {!assetsReady && <p role="status">{assetError ? "Aset tidak dapat dimuatkan. Semak nama fail aset." : "Memuatkan aset makmal…"}</p>}
        {step === 0 && <><p>Perhatikan apa yang berlaku apabila cebisan kertas dijatuhkan dalam silinder kanan yang berudara.</p><button className="ff-primary" disabled={active || !assetsReady} onClick={drop}>Jatuhkan kertas</button>{run?.done && <div className="ff-callout"><p>Apakah yang mempengaruhi masa yang diambil oleh cebisan kertas untuk jatuh?</p><button onClick={() => { setRun(null); next(); }}>Mula penyiasatan →</button></div>}</>}
        {step === 1 && <><p>Bina pernyataan masalah.</p><p>Apakah kesan…</p>{select("problemCause", "Perkara yang dikaji", VARIABLES)}<p>…terhadap…</p>{select("problemEffect", "Perkara yang diperhatikan", VARIABLES)}<button onClick={() => check(answers.problemCause === VARIABLES[0] && answers.problemEffect === VARIABLES[1], answers.problemCause !== VARIABLES[0] ? "Semak semula. Apakah perkara yang sengaja diubah dalam penyiasatan ini?" : "Apakah perkara yang akan diukur?", "✓ Pernyataan masalah berjaya dibina.")}>Semak</button>{nextButton}</>}
        {step === 2 && <><p>Hipotesis ialah jangkaan yang akan diuji. Bina ayat anda; keputusan belum diketahui.</p>{select("hCause", "Jika (pemboleh ubah)", VARIABLES)}{select("hCauseTrend", "Perubahan pertama", CHANGES)}{select("hEffect", "Maka (pemboleh ubah)", VARIABLES)}{select("hEffectTrend", "Perubahan kedua", CHANGES)}<button onClick={() => check(answers.hCause === VARIABLES[0] && answers.hEffect === VARIABLES[1] && !!answers.hCauseTrend && answers.hCauseTrend !== "kekal" && !!answers.hEffectTrend, "Hubungkan perkara yang sengaja diubah dengan perkara yang diukur. Pilih perubahan udara yang boleh diuji.", "✓ Hipotesis disimpan. Mari uji jangkaan anda.")}>Simpan hipotesis</button>{checked && <p className="ff-callout">{hypothesis}</p>}{nextButton}</>}
        {step === 3 && <><h3>Bina KPS (IBSE)</h3>{select("pm", "Pemboleh ubah dimanipulasikan", VARIABLES)}{select("pb", "Pemboleh ubah bergerak balas", VARIABLES)}{select("pd", "Pemboleh ubah dimalarkan", VARIABLES)}<button onClick={() => check(answers.pm === VARIABLES[0] && answers.pb === VARIABLES[1] && answers.pd === VARIABLES[2], answers.pm !== VARIABLES[0] ? "Pemboleh ubah dimanipulasikan ialah perkara yang sengaja diubah." : answers.pb !== VARIABLES[1] ? "Pemboleh ubah bergerak balas ialah perkara yang diukur." : "Apakah kedudukan pelepasan yang perlu dikekalkan supaya perbandingan adil?", "✓ Reka bentuk penyiasatan lengkap.")}>Semak</button><button className="ff-primary" disabled={!checked} onClick={next}>Mula eksperimen →</button></>}
        {step === 4 && <><p>Uji kertas dalam udara, rekod masa, kemudian aktifkan keadaan vakum pada silinder kiri dan ulang jatuhan.</p><p className="ff-callout">Jenis objek dan ketinggian pelepasan dikekalkan.</p><button className="ff-primary" disabled={active || !assetsReady || results[recordKey] !== undefined || !!run?.done} onClick={drop}>Jatuhkan kertas</button><button disabled={!run?.done || results[recordKey] !== undefined} onClick={record}>Rekod keputusan</button><button disabled={results.air === undefined || vacuum || active} onClick={pump}>Hidupkan pam vakum</button>{pumping && <p role="status">Udara sedang dikeluarkan… {air}%</p>}<button className="ff-primary" disabled={results.vacuum === undefined} onClick={next}>Analisis bukti →</button></>}
        {step === 5 && <>{choices("shorter", "Dalam keadaan manakah cebisan kertas mengambil masa lebih singkat untuk jatuh?", ["Ada udara", "Vakum"])}{choices("trend", "Apabila udara dikeluarkan daripada tiub, masa jatuh…", CHANGES)}
          <h3>Bina penjelasan berdasarkan bukti</h3>{select("claim", "Dakwaan", ["Kertas jatuh lebih cepat dalam vakum", "Kertas jatuh lebih cepat dalam udara", "Masa jatuh sama"])}
          {select("evidence", "Bukti daripada jadual anda", [`${results.vacuum?.toFixed(2)} s < ${results.air?.toFixed(2)} s`, `${results.vacuum?.toFixed(2)} s > ${results.air?.toFixed(2)} s`, "Kedua-dua masa sama"])}
          {select("reason", "Penjelasan", ["Rintangan udara memperlahankan gerakan jatuh", "Pam menambahkan daya graviti", "Udara menolak objek ke bawah"])}
          <button onClick={() => check(answers.shorter === "Vakum" && answers.trend === "berkurang" && answers.claim === "Kertas jatuh lebih cepat dalam vakum" && answers.evidence === `${results.vacuum?.toFixed(2)} s < ${results.air?.toFixed(2)} s` && answers.reason === "Rintangan udara memperlahankan gerakan jatuh", "Cuba semula. Semak masa dalam jadual dan fikirkan daya yang menentang gerakan.")}>Semak analisis</button>
          {checked && <p className="ff-callout">✓ Bukti anda: {results.air?.toFixed(2)} s dalam udara berbanding {results.vacuum?.toFixed(2)} s dalam vakum.</p>}{nextButton}</>}
        {step === 6 && <><p className="ff-callout">Hipotesis anda: {hypothesis}</p>{select("conAir", "Apabila…", ["udara dikeluarkan daripada tiub", "udara dimasukkan ke dalam tiub"])}{select("conChange", "Masa jatuh cebisan kertas…", CHANGES)}{select("conStatus", "Oleh itu, hipotesis…", ["diterima", "ditolak"])}<button onClick={() => check(answers.conAir === "udara dikeluarkan daripada tiub" && answers.conChange === "berkurang" && answers.conStatus === (hypothesisSupported ? "diterima" : "ditolak"), "Semak data dan bandingkan arah perubahan dengan hipotesis asal anda. Hipotesis yang tidak disokong bukti juga membantu kita belajar.", "✓ Kesimpulan disimpan.")}>Semak kesimpulan</button>{checked && <p>{conclusion}</p>}{nextButton}</>}
        {step === 7 && advancedPhase === 0 && <>{select("force", "Selain graviti, daya manakah yang memperlahankan objek jatuh dalam udara?", ["Daya geseran / rintangan udara", "Daya magnet", "Daya elektrostatik", "Daya apungan"])}{select("direction", "Daya tersebut bertindak…", ["searah dengan gerakan", "bertentangan dengan arah gerakan", "hanya ke kiri", "hanya ke kanan"])}<button onClick={() => check(answers.force === "Daya geseran / rintangan udara" && answers.direction === "bertentangan dengan arah gerakan", "Fikirkan daya yang menentang pergerakan objek melalui udara.")}>Semak konsep</button><button className="ff-primary" disabled={!checked} onClick={() => { setAdvancedPhase(1); setChecked(false); setFeedback(""); setAir(100); setRun(null); }}>Buka penyiasatan lanjutan →</button></>}
        {advanced && <>
          <p>Jika bulu dan bola logam dijatuhkan serentak, objek manakah sampai dahulu?</p>
          {advancedPhase === 1 && <>{choices("predictAir", "Ramalan dalam udara", WINNERS)}{choices("predictVacuum", "Ramalan dalam vakum", WINNERS)}<button className="ff-primary" disabled={!answers.predictAir || !answers.predictVacuum} onClick={() => { setAdvancedPhase(2); setFeedback("✓ Ramalan disimpan. Uji dengan udara dahulu."); }}>Simpan ramalan</button></>}
          {advancedPhase === 2 && <><p className="ff-callout">Ramalan anda — udara: {answers.predictAir}; vakum: {answers.predictVacuum}.</p>
            <button className="ff-primary" disabled={active || !assetsReady || !!pairResults[recordKey]} onClick={drop}>Jatuhkan bulu + bola logam</button>
            <button disabled={!pairResults.air || active || vacuum} onClick={pump}>Hidupkan pam vakum</button>
            {pairResults.air && <p>Udara — bulu: {pairResults.air.feather.toFixed(2)} s; bola logam: {pairResults.air.ball.toFixed(2)} s.</p>}
            {pairResults.vacuum && <><p>Vakum — bulu: {pairResults.vacuum.feather.toFixed(2)} s; bola logam: {pairResults.vacuum.ball.toFixed(2)} s.</p>{choices("observation", "Apakah yang anda perhatikan dalam vakum?", ["Bola logam sampai dahulu", "Bulu sampai dahulu", "Kedua-duanya sampai serentak"])}<button onClick={() => check(answers.observation === "Kedua-duanya sampai serentak", "Cuba semula. Bandingkan masa ketibaan kedua-dua objek dalam vakum.")}>Semak pemerhatian</button><button className="ff-primary" disabled={!checked} onClick={() => { setAdvancedPhase(3); setChecked(false); setFeedback(""); }}>Refleksi berdasarkan bukti →</button></>}
          </>}
          {advancedPhase === 3 && <><div className="ff-callout"><h3>Ramalan awal anda ↔ Bukti eksperimen</h3><p>Udara: {answers.predictAir} → Bola logam dahulu.</p><p>Vakum: {answers.predictVacuum} → Serentak.</p><p>{answers.predictAir === "Bola logam" && answers.predictVacuum === "Serentak" ? "Ramalan awal anda selaras dengan bukti eksperimen." : "Ramalan awal anda berbeza daripada bukti eksperimen."}</p></div>
            {select("reflection", "Berdasarkan bukti, apakah penjelasan yang lebih sesuai?", ["Dalam vakum dekat permukaan Bumi, kedua-dua objek mengalami pecutan graviti yang sama", "Objek berjisim besar sentiasa sampai dahulu dalam vakum", "Tiada daya graviti di dalam vakum"])}
            <button disabled={complete} onClick={() => { const valid = answers.reflection === "Dalam vakum dekat permukaan Bumi, kedua-dua objek mengalami pecutan graviti yang sama"; check(valid, "Semak bukti dalam vakum. Adakah masa jatuh kedua-dua objek berbeza?"); if (valid) setComplete(true); }}>Lengkapkan penyiasatan</button>
            {complete && <p className="ff-callout">✓ Dalam vakum, apabila rintangan udara diabaikan, semua objek yang dilepaskan dari keadaan rehat pada ketinggian sama dekat permukaan Bumi mengalami pecutan graviti yang sama.</p>}
          </>}
        </>}
      </>}
      <p className={`ff-feedback${checked ? " ff-success" : ""}`} role="status" aria-live="polite">{feedback}</p>
    </section></div>
    {mode === "ibse" && complete && <section className="ff-summary"><span className="ff-eyebrow">PENYIASATAN LENGKAP</span><h2>Rekod Penyiasatan Saya</h2><dl>
      <dt>Pernyataan masalah</dt><dd>Apakah kesan {answers.problemCause} terhadap {answers.problemEffect}?</dd>
      <dt>Hipotesis</dt><dd>{hypothesis}</dd><dt>Pemboleh ubah dimanipulasikan</dt><dd>{answers.pm}</dd><dt>Pemboleh ubah bergerak balas</dt><dd>{answers.pb}</dd><dt>Pemboleh ubah dimalarkan</dt><dd>{answers.pd} (1.20 m); jenis objek yang sama bagi kedua-dua ujian utama.</dd>
      <dt>Keputusan</dt><dd>Ada udara: {results.air?.toFixed(2)} s · Vakum: {results.vacuum?.toFixed(2)} s</dd><dt>Kesimpulan</dt><dd>{conclusion}</dd><dt>Status hipotesis</dt><dd>{hypothesisSupported ? "Diterima berdasarkan bukti" : "Ditolak berdasarkan bukti"}</dd>
      <dt>Ramalan lanjutan</dt><dd>Udara: {answers.predictAir} · Vakum: {answers.predictVacuum}</dd><dt>Refleksi</dt><dd>{answers.reflection}.</dd></dl>
      <details><summary>Tentang model fizik</summary><p>Ketinggian 1.20 m dan g = 9.81 m/s². Vakum: t = √(2h/g). Dalam udara, model rintangan berkadar dengan kuasa dua halaju menggunakan halaju terminal berkesan: kertas 0.65 m/s, bulu 0.38 m/s dan bola 12 m/s. Ini model ideal untuk perbandingan, bukan ukuran alat sebenar. Daya apungan dan perubahan bentuk tidak dimodelkan; kibaran ialah petunjuk visual.</p></details>
      <p>Rekod ini disimpan sepanjang sesi pada halaman ini.</p><button className="ff-primary" onClick={reset}>Ulang eksperimen</button></section>}
    {mode === "ibse" && !complete && step > 0 && <div className="ff-reset"><button onClick={reset}>Ulang eksperimen</button><small>Mengosongkan semua jawapan dan data untuk penyiasatan baharu.</small></div>}
    {reviewPanel && <div className="ff-review">{reviewPanel}</div>}
  </main>;
}

