import { useEffect, useMemo, useRef, useState } from "react";
import QuizCard from "../components/quiz/QuizCard";
import { inertiaQuiz } from "../data/simulatorQuizzes";

const minMass = 30;
const maxMass = 70;
const targetOscillations = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPeriod(mass) {
  const basePeriod = 0.45 + ((mass - minMass) / (maxMass - minMass)) * 0.45;
  const variation = Math.sin(mass * 1.31) * 0.035;
  return Number(clamp(basePeriod + variation, 0.42, 0.95).toFixed(2));
}

function formatTime(value) {
  return Number(value || 0).toFixed(2);
}

function InertiaProgressPanel({ phase, pulled, records, graphReady, quizScore, quizTotal }) {
  const completed = phase === "done" || records.length > 0;
  const starter = completed ? 10 : phase === "running" ? 9 : pulled ? 8 : phase === "ready" ? 4 : 0;
  const dataCollector = records.length >= 5 ? 10 : records.length > 0 ? Math.min(10, 4 + records.length * 2) : 0;
  const oscillationTimer = completed ? 10 : phase === "running" ? 6 : pulled ? 3 : 0;
  const graphInterpreter = graphReady ? 10 : records.length > 0 ? 4 : 0;
  const scienceCheck = quizTotal > 0 ? Math.round((quizScore / quizTotal) * 10) : 0;
  const total = starter + dataCollector + oscillationTimer + graphInterpreter + scienceCheck;
  const badge = total >= 45 ? "Pakar Inersia" : total >= 30 ? "Penganalisis Ayunan" : total >= 14 ? "Pengumpul Data" : "Sedia Mula";
  const items = [
    ["Inertia Starter", starter],
    ["Data Collector", dataCollector],
    ["Oscillation Timer", oscillationTimer],
    ["Graph Interpreter", graphInterpreter],
    ["Science Check", scienceCheck],
  ];

  return (
    <aside className="linearProgressPanel inertiaProgressPanel" aria-label="Progress simulator jisim dan inersia">
      <div className="linearProgressPanel__header">
        <span>Inertia Progress</span>
        <strong>{total}/50</strong>
      </div>
      <p>{badge}</p>
      <div className="linearProgressGrid">
        {items.map(([label, score]) => (
          <div className="linearProgressItem" key={label} style={{ "--score": `${score * 10}%` }}>
            <div>
              <span>{label}</span>
              <strong>{score}/10</strong>
            </div>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
    </aside>
  );
}

function InertiaIntroCards() {
  return (
    <section className="inertiaIntroGrid inertiaIntroGrid--hero" aria-label="Maklumat eksperimen">
      <article className="inertiaCard">
        <span className="inertiaKicker">Tujuan</span>
        <p>Mengkaji hubungan antara jisim plastisin dengan inersia.</p>
      </article>
      <article className="inertiaCard">
        <span className="inertiaKicker">Pernyataan masalah</span>
        <p>Adakah jisim objek mempengaruhi inersia objek tersebut?</p>
      </article>
      <article className="inertiaCard">
        <span className="inertiaKicker">Hipotesis</span>
        <p>Semakin besar jisim sesuatu objek, semakin besar inersia objek itu.</p>
      </article>
    </section>
  );
}

function InertiaMassSlider({ mass, disabled, onChange }) {
  const ratio = ((mass - minMass) / (maxMass - minMass)) * 100;

  return (
    <div className="inertiaMassSlider">
      <div className="inertiaMassSlider__readout" style={{ left: `clamp(44px, ${ratio}%, calc(100% - 44px))` }}>
        {mass} g
      </div>
      <input
        type="range"
        min={minMass}
        max={maxMass}
        step="1"
        value={mass}
        disabled={disabled}
        aria-label="Jisim plastisin"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="inertiaMassSlider__ticks" aria-hidden="true">
        {[30, 40, 50, 60, 70].map((value) => (
          <span key={value}>{value} g</span>
        ))}
      </div>
    </div>
  );
}

function InertiaApparatus({
  mass,
  phase,
  period,
  pullAmount,
  oscillation,
  onPointerPullStart,
  onPointerPullMove,
  onPointerPullEnd,
}) {
  const massScale = 0.82 + ((mass - minMass) / (maxMass - minMass)) * 0.52;
  const isRunning = phase === "running";
  const isPulled = phase === "pulled";

  return (
    <section className="inertiaCard inertiaApparatus" aria-label="Radas eksperimen jisim dan inersia">
      <div className="inertiaPanelTitle">
        <div>
          <h2>Radas eksperimen</h2>
          <p>Pengapit-G mencengkam bilah gergaji pada tepi meja makmal.</p>
        </div>
        <strong>{mass} g</strong>
      </div>

      <div
        className={[
          "inertiaStage",
          isRunning ? "inertiaStage--running" : "",
          isPulled ? "inertiaStage--pulled" : "",
        ].join(" ")}
        style={{
          "--osc": oscillation,
          "--pull": pullAmount,
          "--mass-scale": massScale,
          "--period": `${period}s`,
        }}
      >
        <img className="inertiaStage__table" src="/assets/lab-table.png" alt="" draggable="false" />
        <div className="inertiaStage__wall" aria-hidden="true" />
        <img className="inertiaStage__limit" src="/assets/pull-limit-line.png" alt="" draggable="false" />
        <span className="inertiaStage__limitLabel">Garisan had tarikan</span>

        <img className="inertiaClamp" src="/assets/g-clamp.png" alt="Pengapit-G" draggable="false" />
        <div className="inertiaBladeRig" aria-hidden="true">
          <img className="inertiaBlade inertiaBlade--ghost inertiaBlade--ghostOne" src="/assets/hacksaw-blade.png" alt="" draggable="false" />
          <img className="inertiaBlade inertiaBlade--ghost inertiaBlade--ghostTwo" src="/assets/hacksaw-blade.png" alt="" draggable="false" />
          <img className="inertiaBlade inertiaBlade--ghost inertiaBlade--ghostThree" src="/assets/hacksaw-blade.png" alt="" draggable="false" />
          <img className="inertiaBlade inertiaBlade--base" src="/assets/hacksaw-blade.png" alt="" draggable="false" />
          <img className="inertiaBlade inertiaBlade--mid" src="/assets/hacksaw-blade.png" alt="" draggable="false" />
          <img className="inertiaBlade inertiaBlade--tip" src="/assets/hacksaw-blade.png" alt="" draggable="false" />
        </div>
        <img className="inertiaPlasticine" src="/assets/plasticine.png" alt="Plastisin pada hujung bilah gergaji" draggable="false" />

        <button
          type="button"
          className="inertiaPullHandle"
          aria-label="Tarik hujung bilah gergaji hingga garisan had"
          disabled={isRunning}
          onPointerDown={onPointerPullStart}
          onPointerMove={onPointerPullMove}
          onPointerUp={onPointerPullEnd}
          onPointerCancel={onPointerPullEnd}
        >
          <span>Tarik</span>
        </button>
      </div>

      <div className="inertiaApparatus__support">
        <div className="inertiaVariablePills">
          <span><strong>Pemboleh ubah bergerak balas</strong> Tempoh ayunan</span>
          <span><strong>Pemboleh ubah dimalarkan</strong> Panjang bilah gergaji yang berayun dan bentuk plastisin</span>
        </div>
        <div className="inertiaBalance">
          <img src="/assets/electronic-balance.png" alt="Penimbang elektronik" draggable="false" />
          <span>{mass} g</span>
        </div>
      </div>
    </section>
  );
}

function InertiaStopwatch({
  elapsed,
  oscillationCount,
  phase,
  feedback,
  onPull,
  onRelease,
  onStop,
  onReset,
}) {
  const running = phase === "running";
  const canRelease = phase === "pulled";

  return (
    <section className="inertiaCard inertiaStopwatch" aria-label="Jam randik">
      <div className="inertiaPanelTitle">
        <div>
          <h2>Jam randik</h2>
          <p>Ayunan lengkap: {oscillationCount}/{targetOscillations}</p>
        </div>
      </div>

      <div className="inertiaStopwatch__face">
        <img src="/assets/stopwatch.png" alt="" draggable="false" />
        <strong>{formatTime(elapsed)} s</strong>
        <span>Ayunan: {oscillationCount}/{targetOscillations}</span>
      </div>

      <p className="inertiaInstruction">Tarik bilah gergaji hingga garisan had, kemudian lepaskan.</p>

      <div className="inertiaActions">
        <button type="button" className="inertiaButton inertiaButton--primary" onClick={onPull} disabled={running}>Tarik</button>
        <button type="button" onClick={onRelease} disabled={running || !canRelease}>Lepaskan</button>
        <button type="button" className="inertiaButton--stop" onClick={onStop} disabled={!running}>STOP</button>
        <button type="button" onClick={onReset}>Reset</button>
      </div>

      <div className={feedback.includes("direkod") ? "inertiaFeedback inertiaFeedback--ok" : "inertiaFeedback"}>
        {feedback}
      </div>
    </section>
  );
}

function InertiaResultsTable({ records }) {
  return (
    <section className="inertiaCard inertiaResults">
      <div className="inertiaPanelTitle">
        <div>
          <h2>Jadual keputusan</h2>
          <p>Data masuk automatik selepas 10 ayunan lengkap.</p>
        </div>
      </div>
      <div className="inertiaTableWrap">
        <table>
          <thead>
            <tr>
              <th>Jisim plastisin (g)</th>
              <th>Masa untuk 10 ayunan, t (s)</th>
              <th>Tempoh, T = t/10 (s)</th>
            </tr>
          </thead>
          <tbody>
            {records.length ? (
              records.map((record) => (
                <tr key={record.id}>
                  <td>{record.mass}</td>
                  <td>{formatTime(record.time)}</td>
                  <td>{formatTime(record.period)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="inertiaPendingCell">Belum ada bacaan direkodkan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InertiaGraph({ records }) {
  const graph = { x: 62, y: 36, width: 500, height: 220 };
  const sortedRecords = [...records].sort((a, b) => a.mass - b.mass);
  const toPoint = (record) => ({
    x: graph.x + ((record.mass - minMass) / (maxMass - minMass)) * graph.width,
    y: graph.y + graph.height - ((record.period - 0.4) / 0.65) * graph.height,
  });
  const points = sortedRecords.map(toPoint);
  const linePoints = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  return (
    <section className="inertiaCard inertiaGraph">
      <div className="inertiaPanelTitle">
        <div>
          <h2>Graf</h2>
          <p>Tempoh, T (s) melawan jisim plastisin (g).</p>
        </div>
      </div>
      <svg viewBox="0 0 620 330" role="img" aria-label="Graf tempoh ayunan melawan jisim plastisin">
        <rect className="inertiaGraph__bg" x="0" y="0" width="620" height="330" rx="18" />
        {Array.from({ length: 6 }, (_, index) => (
          <line key={`h-${index}`} className="inertiaGraph__grid" x1={graph.x} x2={graph.x + graph.width} y1={graph.y + index * (graph.height / 5)} y2={graph.y + index * (graph.height / 5)} />
        ))}
        {Array.from({ length: 5 }, (_, index) => (
          <line key={`v-${index}`} className="inertiaGraph__grid" x1={graph.x + index * (graph.width / 4)} x2={graph.x + index * (graph.width / 4)} y1={graph.y} y2={graph.y + graph.height} />
        ))}
        <line className="inertiaGraph__axis" x1={graph.x} y1={graph.y + graph.height} x2={graph.x + graph.width + 8} y2={graph.y + graph.height} />
        <line className="inertiaGraph__axis" x1={graph.x} y1={graph.y - 6} x2={graph.x} y2={graph.y + graph.height} />
        <text className="inertiaGraph__label" x="286" y="306">Jisim plastisin (g)</text>
        <text className="inertiaGraph__label" x="18" y="178" transform="rotate(-90 18 178)">Tempoh, T (s)</text>
        {[30, 40, 50, 60, 70].map((value) => (
          <text key={value} className="inertiaGraph__tick" x={graph.x + ((value - minMass) / (maxMass - minMass)) * graph.width} y="280">{value}</text>
        ))}
        {[0.4, 0.55, 0.7, 0.85, 1.0].map((value) => (
          <text key={value} className="inertiaGraph__tick inertiaGraph__tick--y" x="34" y={graph.y + graph.height + 4 - ((value - 0.4) / 0.65) * graph.height}>{value.toFixed(2)}</text>
        ))}
        {points.length > 1 && <polyline className="inertiaGraph__line" points={linePoints} />}
        {points.map((point, index) => (
          <circle key={sortedRecords[index].id} className="inertiaGraph__dot" cx={point.x} cy={point.y} r="6" />
        ))}
        {!records.length && <text className="inertiaGraph__empty" x="310" y="162">Jalankan eksperimen untuk memaparkan graf.</text>}
      </svg>
    </section>
  );
}

export default function InertiaMassSimulatorPage() {
  const [mass, setMass] = useState(30);
  const [phase, setPhase] = useState("idle");
  const [pullAmount, setPullAmount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [oscillationCount, setOscillationCount] = useState(0);
  const [activeRun, setActiveRun] = useState(null);
  const [records, setRecords] = useState([]);
  const [quizResult, setQuizResult] = useState({ score: 0, total: inertiaQuiz.length });
  const [feedback, setFeedback] = useState("Tekan Tarik hingga garisan had, kemudian tekan Lepaskan.");
  const draggingRef = useRef(false);
  const runStartRef = useRef(0);

  const period = useMemo(() => getPeriod(mass), [mass]);
  const pulled = phase === "pulled" || phase === "running" || phase === "done";
  const graphReady = records.length > 1;
  const activePeriod = activeRun?.period || period;
  const damping = phase === "running" ? Math.max(0.46, Math.exp(-elapsed / 8)) : 1;
  const oscillation = phase === "running"
    ? Math.sin((elapsed / activePeriod) * Math.PI * 2) * damping
    : phase === "pulled"
      ? pullAmount
      : 0;

  useEffect(() => {
    if (phase !== "running" || !activeRun) {
      return undefined;
    }

    runStartRef.current = window.performance.now();
    const timer = window.setInterval(() => {
      const seconds = (window.performance.now() - runStartRef.current) / 1000;
      const nextElapsed = Math.min(activeRun.timeForTen, seconds);
      const nextCount = Math.min(targetOscillations, Math.floor(nextElapsed / activeRun.period));

      setElapsed(Number(nextElapsed.toFixed(2)));
      setOscillationCount(nextCount);

      if (nextElapsed >= activeRun.timeForTen) {
        window.clearInterval(timer);
        const record = {
          id: `${activeRun.mass}-${Date.now()}`,
          mass: activeRun.mass,
          time: Number(activeRun.timeForTen.toFixed(2)),
          period: Number(activeRun.period.toFixed(2)),
        };
        setRecords((current) => [...current, record]);
        setPhase("done");
        setPullAmount(0);
        setFeedback("Masa untuk 10 ayunan lengkap telah direkod secara automatik.");
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [activeRun, phase]);

  const updateMass = (value) => {
    if (phase === "running") {
      return;
    }

    setMass(value);
    setPullAmount(0);
    setElapsed(0);
    setOscillationCount(0);
    setPhase("ready");
    setFeedback(`Jisim plastisin dipilih: ${value} g.`);
  };

  const pullBlade = () => {
    if (phase === "running") {
      return;
    }

    setPhase("pulled");
    setPullAmount(1);
    setElapsed(0);
    setOscillationCount(0);
    setFeedback("Bilah gergaji telah ditarik hingga garisan had. Tekan Lepaskan.");
  };

  const releaseBlade = () => {
    if (phase !== "pulled" || pullAmount < 0.82) {
      setFeedback("Tarik bilah gergaji hingga garisan had sebelum lepaskan.");
      return;
    }

    const selectedPeriod = getPeriod(mass);
    setActiveRun({
      mass,
      period: selectedPeriod,
      timeForTen: Number((selectedPeriod * targetOscillations).toFixed(2)),
    });
    setElapsed(0);
    setOscillationCount(0);
    setPhase("running");
    setFeedback("Bilah gergaji sedang berayun. Jam randik bermula secara automatik.");
  };

  const stopRun = () => {
    if (phase !== "running") {
      return;
    }

    setPhase("ready");
    setPullAmount(0);
    setFeedback("Eksperimen dihentikan. Bacaan hanya direkod selepas 10 ayunan lengkap.");
  };

  const reset = () => {
    setMass(30);
    setPhase("idle");
    setPullAmount(0);
    setElapsed(0);
    setOscillationCount(0);
    setActiveRun(null);
    setRecords([]);
    setQuizResult({ score: 0, total: inertiaQuiz.length });
    setFeedback("Tekan Tarik hingga garisan had, kemudian tekan Lepaskan.");
  };

  const updatePullFromPointer = (event) => {
    if (!draggingRef.current || phase === "running") {
      return;
    }

    const stage = event.currentTarget.closest(".inertiaStage");
    const rect = stage?.getBoundingClientRect() || event.currentTarget.getBoundingClientRect();
    const startY = rect.top + rect.height * 0.34;
    const limitY = rect.top + rect.height * 0.58;
    const nextPull = clamp((event.clientY - startY) / (limitY - startY), 0, 1);
    setPullAmount(nextPull);
    setPhase("pulled");
    setElapsed(0);
    setOscillationCount(0);
    setFeedback(nextPull >= 0.9 ? "Garisan had telah dicapai. Tekan Lepaskan." : "Tarik hujung bilah hingga garisan had.");
  };

  const handlePointerPullStart = (event) => {
    if (phase === "running") {
      return;
    }

    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updatePullFromPointer(event);
  };

  const handlePointerPullMove = (event) => {
    updatePullFromPointer(event);
  };

  const handlePointerPullEnd = (event) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <main className="electrolysisPage inertiaPage">
      <section className="electroHero inertiaHero">
        <a className="linearSim__back" href="/simulator">&larr; Semua Simulator</a>
        <span className="simulatorHero__kicker">Sains Tingkatan 4 &bull; Bab 11 Daya dan Gerakan</span>
        <div className="inertiaHero__grid">
          <div>
            <h1>Hubungan antara Jisim dengan Inersia</h1>
            <p>Eksperimen bilah gergaji dan plastisin</p>
          </div>
          <InertiaProgressPanel
            phase={phase}
            pulled={pulled}
            records={records}
            graphReady={graphReady}
            quizScore={quizResult.score}
            quizTotal={quizResult.total}
          />
          <InertiaIntroCards />
        </div>
      </section>

      <section className="inertiaLabGrid">
        <aside className="inertiaCard inertiaControlPanel">
          <div className="inertiaPanelTitle">
            <div>
              <h2>Pemboleh ubah dimanipulasikan</h2>
              <p>Jisim plastisin</p>
            </div>
          </div>
          <InertiaMassSlider mass={mass} disabled={phase === "running"} onChange={updateMass} />
          <div className="inertiaMassPreview">
            <img src="/assets/plasticine.png" alt="" draggable="false" style={{ "--mass-scale": 0.82 + ((mass - minMass) / (maxMass - minMass)) * 0.52 }} />
            <span>Saiz plastisin berubah mengikut jisim.</span>
          </div>
        </aside>

        <InertiaApparatus
          mass={mass}
          phase={phase}
          period={activePeriod}
          pullAmount={pullAmount}
          oscillation={oscillation}
          onPointerPullStart={handlePointerPullStart}
          onPointerPullMove={handlePointerPullMove}
          onPointerPullEnd={handlePointerPullEnd}
        />

        <InertiaStopwatch
          elapsed={elapsed}
          oscillationCount={oscillationCount}
          phase={phase}
          feedback={feedback}
          onPull={pullBlade}
          onRelease={releaseBlade}
          onStop={stopRun}
          onReset={reset}
        />
      </section>

      <section className="inertiaDataGrid">
        <InertiaResultsTable records={records} />
        <InertiaGraph records={records} />
      </section>

      <section className="inertiaCard inertiaConcept">
        <div>
          <span className="inertiaKicker">Konsep sains</span>
          <p>Semakin besar jisim plastisin, semakin besar inersia. Objek yang mempunyai inersia lebih besar lebih sukar mengubah keadaan gerakannya. Oleh itu, tempoh ayunan menjadi lebih lama.</p>
        </div>
      </section>

      <QuizCard
        title="Science Check (Jisim dan Inersia)"
        questions={inertiaQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
