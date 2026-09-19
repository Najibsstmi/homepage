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
type Run = { vacuum: boolean; advanced: boolean; time: number; duration: number; done: boolean };
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

function Scene({ run, pumping, advanced }: { run: Run | null; pumping: boolean; advanced: boolean }) {
  const objects: FallingObject[] = advanced ? ["feather", "ball"] : ["paper"];
  return <div className={`ff-scene${pumping ? " ff-pumping" : ""}`}>
    <img className="ff-background" src={asset("statik1.png")} alt="Makmal dengan tiub lutsinar yang disambungkan kepada pam vakum melalui hos." width="1672" height="941" />
    <div className="ff-tube-highlight" aria-hidden="true" />
    <div className="ff-pump-highlight" aria-hidden="true" />
    {objects.map(object => {
      const time = run?.time ?? 0;
      const vacuum = run?.vacuum ?? false;
      const landed = !!run && time >= landingTime(vacuum, object);
      const progress = Math.min(1, fallenDistance(time, vacuum, object) / DROP_HEIGHT);
      const flutter = !vacuum && object !== "ball" && !landed && time > 0;
      const x = (object === "paper" ? 32.5 : object === "feather" ? 31.7 : 34) + (flutter ? Math.sin(time * 15) * (object === "feather" ? 0.25 : 0.65) : 0);
      const frame = flutter ? Math.floor(time * 9) % 3 : 0;
      const files = object === "paper" ? PAPER : [object === "feather" ? "bulu.png" : "metal ball.png"];
      return <div key={object} className={`ff-object ff-${object}`} data-object={object} data-landed={landed}
        style={{ left: `${x}%`, top: `${21 + progress * 56}%` }}>
        <div className="ff-object-turn" style={{ transform: `rotate(${flutter ? Math.sin(time * 12) * 18 : 0}deg)` }}>
          {files.map((file, index) => <img key={file} src={asset(file)} alt={index === frame ? object === "paper" ? "Cebisan kertas" : object === "feather" ? "Bulu" : "Bola logam" : ""} style={{ visibility: index === frame ? "visible" : "hidden" }} />)}
        </div>
      </div>;
    })}
  </div>;
}

export default function FreeFallSimulatorPage({ reviewPanel }: { reviewPanel?: ReactNode }) {
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
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const raf = useRef(0);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const lab = useRef<HTMLElement>(null);
  const advanced = step === 7 && advancedPhase > 0;
  const vacuum = air === 0;
  const active = pumping || (!!run && !run.done);

  useEffect(() => {
    let mounted = true;
    Promise.all(["statik1.png", ...PAPER, "bulu.png", "metal ball.png"].map(file => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(); img.onerror = reject; img.src = asset(file);
    }))).then(() => { if (mounted) setAssetsReady(true); }).catch(() => { if (mounted) setAssetError(true); });
    return () => { mounted = false; cancelAnimationFrame(raf.current); busy.current = false; };
  }, []);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step, advancedPhase]);

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
  function next() { setStep(value => value + 1); setChecked(false); setFeedback(""); }
  function reset() {
    cancelAnimationFrame(raf.current); busy.current = false;
    setStep(0); setAnswers({}); setChecked(false); setFeedback(""); setRun(null);
    setAir(100); setPumping(false); setResults({}); setAdvancedPhase(0); setPairResults({}); setComplete(false);
  }
  function drop() {
    if (busy.current || !assetsReady) return;
    if (window.matchMedia("(max-width: 960px)").matches) lab.current?.scrollIntoView({ block: "start", behavior: "instant" });
    busy.current = true; setFeedback("");
    const duration = landingTime(vacuum, advanced ? "feather" : "paper");
    const initial = { vacuum, advanced, time: 0, duration, done: false };
    setRun(initial);
    const started = performance.now();
    const tick = (now: number) => {
      const time = Math.min((now - started) / 1000, duration);
      const done = time >= duration;
      setRun({ ...initial, time, done });
      if (!done) raf.current = requestAnimationFrame(tick);
      else {
        busy.current = false;
        if (advanced) {
          setPairResults(previous => ({ ...previous, [vacuum ? "vacuum" : "air"]: { feather: duration, ball: landingTime(vacuum, "ball") } }));
          setFeedback("✓ Jatuhan selesai. Perhatikan masa ketibaan kedua-dua objek.");
        }
      }
    };
    raf.current = requestAnimationFrame(tick);
  }
  function pump() {
    if (busy.current) return;
    if (window.matchMedia("(max-width: 960px)").matches) lab.current?.scrollIntoView({ block: "start", behavior: "instant" });
    busy.current = true; setPumping(true); setRun(null); setFeedback("");
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 3000, 1);
      setAir(100 - Math.floor(progress * 4) * 25);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else { busy.current = false; setPumping(false); setFeedback("✓ Tiub kini dalam keadaan vakum. Sedia untuk dijatuhkan."); }
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

  return <main className="ff-page">
    <header className="ff-header"><div><span className="ff-eyebrow">EDUSIM · SAINS TINGKATAN 4 · IBSE</span><h1>Jatuh Bebas</h1><p>Kesan Kehadiran Udara</p></div>
      <button type="button" onClick={reset}>Mula semula</button></header>
    <ol className="ff-progress" aria-label="Kemajuan penyiasatan">{STEPS.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={index < step || complete ? "is-done" : step === index ? "is-current" : ""}><span>{index < step || complete ? "✓" : index + 1}</span>{label}</li>)}</ol>
    <div className="ff-layout"><section ref={lab} className="ff-lab" aria-label="Ruang eksperimen">
      <div className="ff-lab-heading"><div><span className="ff-eyebrow">MAKMAL MAYA</span><h2>{advanced ? "Bulu & bola logam" : "Penyiasatan cebisan kertas"}</h2></div><span className="ff-status">{pumping ? "MENGEPAM…" : vacuum ? "VAKUM" : "ADA UDARA"}</span></div>
      <Scene run={run} pumping={pumping} advanced={advanced} />
      <div className="ff-readouts"><div><span>Masa jatuh</span><strong aria-label="Pemasa">{(run?.time ?? 0).toFixed(2)} <small>s</small></strong></div><div><span>Udara dalam tiub</span><strong>{air}%</strong><progress aria-label="Udara dalam tiub" max="100" value={air} /></div><div><span>Ketinggian tetap</span><strong>1.20 <small>m</small></strong></div></div>
      <p className="ff-note">{advanced ? "Kedua-dua objek dilepaskan serentak dari ketinggian yang sama." : "Objek dilepaskan dari keadaan rehat pada ketinggian yang sama."} Masa yang dipaparkan ialah masa model.</p>
      {step >= 4 && <ResultsTable results={results} />}
    </section>
    <section className="ff-panel" aria-label="Panduan penyiasatan"><span className="ff-eyebrow">LANGKAH {step + 1} DARIPADA 8 · FIKIR · PILIH · SEMAK</span><h2 ref={heading} tabIndex={-1}>{advanced ? "Penyiasatan lanjutan" : STEPS[step]}</h2>
      {!assetsReady && <p role="status">{assetError ? "Aset tidak dapat dimuatkan. Semak sambungan dan muat semula halaman." : "Memuatkan aset makmal…"}</p>}
      {step === 0 && <><p>Perhatikan apa yang berlaku apabila cebisan kertas dijatuhkan.</p><button className="ff-primary" disabled={active || !assetsReady} onClick={drop}>Jatuhkan kertas</button>{run?.done && <div className="ff-callout"><p>Apakah yang mempengaruhi masa yang diambil oleh cebisan kertas untuk jatuh?</p><button onClick={() => { setRun(null); next(); }}>Mula penyiasatan →</button></div>}</>}
      {step === 1 && <><p>Bina pernyataan masalah.</p><p>Apakah kesan…</p>{select("problemCause", "Perkara yang dikaji", VARIABLES)}<p>…terhadap…</p>{select("problemEffect", "Perkara yang diperhatikan", VARIABLES)}<button onClick={() => check(answers.problemCause === VARIABLES[0] && answers.problemEffect === VARIABLES[1], answers.problemCause !== VARIABLES[0] ? "Semak semula. Apakah perkara yang sengaja diubah dalam penyiasatan ini?" : "Apakah perkara yang akan diukur?", "✓ Pernyataan masalah berjaya dibina.")}>Semak</button>{nextButton}</>}
      {step === 2 && <><p>Hipotesis ialah jangkaan yang akan diuji. Bina ayat anda; keputusan belum diketahui.</p>{select("hCause", "Jika (pemboleh ubah)", VARIABLES)}{select("hCauseTrend", "Perubahan pertama", CHANGES)}{select("hEffect", "Maka (pemboleh ubah)", VARIABLES)}{select("hEffectTrend", "Perubahan kedua", CHANGES)}<button onClick={() => check(answers.hCause === VARIABLES[0] && answers.hEffect === VARIABLES[1] && !!answers.hCauseTrend && answers.hCauseTrend !== "kekal" && !!answers.hEffectTrend, "Hubungkan perkara yang sengaja diubah dengan perkara yang diukur. Pilih perubahan udara yang boleh diuji.", "✓ Hipotesis disimpan. Mari uji jangkaan anda.")}>Simpan hipotesis</button>{checked && <p className="ff-callout">{hypothesis}</p>}{nextButton}</>}
      {step === 3 && <><h3>Bina KPS (IBSE)</h3>{select("pm", "Pemboleh ubah dimanipulasikan", VARIABLES)}{select("pb", "Pemboleh ubah bergerak balas", VARIABLES)}{select("pd", "Pemboleh ubah dimalarkan", VARIABLES)}<button onClick={() => check(answers.pm === VARIABLES[0] && answers.pb === VARIABLES[1] && answers.pd === VARIABLES[2], answers.pm !== VARIABLES[0] ? "Pemboleh ubah dimanipulasikan ialah perkara yang sengaja diubah." : answers.pb !== VARIABLES[1] ? "Pemboleh ubah bergerak balas ialah perkara yang diukur." : "Apakah kedudukan pelepasan yang perlu dikekalkan supaya perbandingan adil?", "✓ Reka bentuk penyiasatan lengkap.")}>Semak</button><button className="ff-primary" disabled={!checked} onClick={next}>Mula eksperimen →</button></>}
      {step === 4 && <><p>Uji kertas dalam udara, rekod masa, kemudian keluarkan udara dan ulang jatuhan.</p><p className="ff-callout">Jenis objek dan ketinggian pelepasan dikekalkan.</p><button className="ff-primary" disabled={active || !assetsReady || results[recordKey] !== undefined || !!run?.done} onClick={drop}>Jatuhkan kertas</button><button disabled={!run?.done || results[recordKey] !== undefined} onClick={record}>Rekod keputusan</button><button disabled={results.air === undefined || vacuum || active} onClick={pump}>Hidupkan pam vakum</button>{pumping && <p role="status">Udara sedang dikeluarkan… {air}%</p>}<button className="ff-primary" disabled={results.vacuum === undefined} onClick={next}>Analisis bukti →</button></>}
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
      <p className={`ff-feedback${checked ? " ff-success" : ""}`} role="status" aria-live="polite">{feedback}</p>
    </section></div>
    {complete && <section className="ff-summary"><span className="ff-eyebrow">PENYIASATAN LENGKAP</span><h2>Rekod Penyiasatan Saya</h2><dl>
      <dt>Pernyataan masalah</dt><dd>Apakah kesan {answers.problemCause} terhadap {answers.problemEffect}?</dd>
      <dt>Hipotesis</dt><dd>{hypothesis}</dd><dt>Pemboleh ubah dimanipulasikan</dt><dd>{answers.pm}</dd><dt>Pemboleh ubah bergerak balas</dt><dd>{answers.pb}</dd><dt>Pemboleh ubah dimalarkan</dt><dd>{answers.pd} (1.20 m); jenis objek yang sama bagi kedua-dua ujian utama.</dd>
      <dt>Keputusan</dt><dd>Ada udara: {results.air?.toFixed(2)} s · Vakum: {results.vacuum?.toFixed(2)} s</dd><dt>Kesimpulan</dt><dd>{conclusion}</dd><dt>Status hipotesis</dt><dd>{hypothesisSupported ? "Diterima berdasarkan bukti" : "Ditolak berdasarkan bukti"}</dd>
      <dt>Ramalan lanjutan</dt><dd>Udara: {answers.predictAir} · Vakum: {answers.predictVacuum}</dd><dt>Refleksi</dt><dd>{answers.reflection}.</dd></dl>
      <details><summary>Tentang model fizik</summary><p>Ketinggian 1.20 m dan g = 9.81 m/s². Vakum: t = √(2h/g). Dalam udara, model rintangan berkadar dengan kuasa dua halaju menggunakan halaju terminal berkesan: kertas 0.65 m/s, bulu 0.38 m/s dan bola 12 m/s. Ini model ideal untuk perbandingan, bukan ukuran alat sebenar. Daya apungan dan perubahan bentuk tidak dimodelkan; kibaran ialah petunjuk visual.</p></details>
      <p>Rekod ini disimpan sepanjang sesi pada halaman ini.</p><button className="ff-primary" onClick={reset}>Ulang eksperimen</button></section>}
    {!complete && step > 0 && <div className="ff-reset"><button onClick={reset}>Ulang eksperimen</button><small>Mengosongkan semua jawapan dan data untuk penyiasatan baharu.</small></div>}
    {reviewPanel && <div className="ff-review">{reviewPanel}</div>}
  </main>;
}
