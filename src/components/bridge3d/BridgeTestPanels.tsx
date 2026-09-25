import type {
  StructuralResult,
  TestResult,
  ValidationReport,
} from "../../features/bridge3d/types";

export function ValidationPanel({
  report,
  competitionMode,
  onTest,
  onClose,
}: {
  report: ValidationReport;
  competitionMode: boolean;
  onTest: () => void;
  onClose: () => void;
}) {
  return (
    <section className="bridge3d-validation" aria-label="Pemeriksaan sebelum ujian">
      <header><div><span>PRE-TEST INSPECTION</span><h2>Pemeriksaan jambatan</h2></div><button type="button" onClick={onClose}>×</button></header>
      <div className="bridge3d-dimensions">
        <div><span>Panjang</span><strong>{report.dimensions.lengthCm.toFixed(1)} cm</strong></div>
        <div><span>Lebar</span><strong>{report.dimensions.widthCm.toFixed(1)} cm</strong></div>
        <div><span>Tinggi</span><strong>{report.dimensions.heightCm.toFixed(1)} cm</strong></div>
      </div>
      <div className="bridge3d-validation-list">
        {report.items.map((item) => (
          <article key={item.id} className={`is-${item.severity}`}>
            <i>{item.severity === "pass" ? "✓" : item.severity === "warning" ? "!" : "×"}</i>
            <div><b>{item.label}</b><p>{item.detail}</p></div>
          </article>
        ))}
      </div>
      {!report.valid && competitionMode ? (
        <p className="bridge3d-blocked">Jambatan belum bersedia untuk diuji dalam Competition Mode.</p>
      ) : null}
      <button type="button" className="bridge3d-primary bridge3d-wide" disabled={!report.valid && competitionMode} onClick={onTest}>
        {report.valid ? "Sedia ke Test Rig" : "Teruskan sebagai latihan"}
      </button>
    </section>
  );
}

export function LoadTestPanel({
  mode,
  running,
  paused,
  currentLoadKg,
  completedLoadKg,
  remainingSeconds,
  incrementKg,
  maximumKg,
  holdDurationSeconds,
  analysis,
  onMode,
  onStart,
  onNext,
  onPause,
  onReset,
  onBuild,
}: {
  mode: "auto" | "manual";
  running: boolean;
  paused: boolean;
  currentLoadKg: number;
  completedLoadKg: number;
  remainingSeconds: number;
  incrementKg: number;
  maximumKg: number | null;
  holdDurationSeconds: number;
  analysis: StructuralResult | null;
  onMode: (mode: "auto" | "manual") => void;
  onStart: () => void;
  onNext: () => void;
  onPause: () => void;
  onReset: () => void;
  onBuild: () => void;
}) {
  const progress = remainingSeconds <= 0
    ? 100
    : Math.max(0, Math.min(100, (1 - remainingSeconds / holdDurationSeconds) * 100));
  return (
    <aside className="bridge3d-test-panel">
      <div className="bridge3d-section-title"><span>TEST RIG</span><b>Anggaran Simulasi</b></div>
      <div className="bridge3d-test-mode">
        <button type="button" className={mode === "auto" ? "is-active" : ""} onClick={() => onMode("auto")} disabled={running}>AUTO TEST</button>
        <button type="button" className={mode === "manual" ? "is-active" : ""} onClick={() => onMode("manual")} disabled={running}>MANUAL TEST</button>
      </div>
      <div className="bridge3d-load-readout">
        <span>BEBAN SEMASA</span>
        <strong>{currentLoadKg.toFixed(0)} <small>kg</small></strong>
        <p>Selesai: {completedLoadKg.toFixed(0)} kg · Kenaikan: {incrementKg} kg</p>
        {maximumKg !== null ? <small>Had profil: {maximumKg} kg</small> : <small>Tiada had maksimum</small>}
      </div>
      {running ? (
        <div className="bridge3d-countdown">
          <strong>{remainingSeconds.toFixed(1)}s</strong>
          <span><i style={{ width: `${progress}%` }} /></span>
          <p>{paused ? "Ujian dijeda" : "Menahan beban peringkat ini…"}</p>
        </div>
      ) : null}
      {analysis ? (
        <div className={`bridge3d-analysis-status ${analysis.firstFailure ? "is-failed" : "is-safe"}`}>
          <b>{analysis.firstFailure ? "KEGAGALAN DIKESAN" : analysis.stable ? "STRUKTUR BERTAHAN" : "STRUKTUR TIDAK STABIL"}</b>
          <span>{analysis.message}</span>
        </div>
      ) : null}
      <div className="bridge3d-test-actions">
        {!running && currentLoadKg === 0 ? <button type="button" className="bridge3d-primary" onClick={onStart}>▶ Mulakan ujian</button> : null}
        {mode === "manual" && !running && currentLoadKg > 0 && !analysis?.firstFailure ? <button type="button" className="bridge3d-primary" onClick={onNext}>+ Tambah beban seterusnya</button> : null}
        {running ? <button type="button" onClick={onPause}>{paused ? "▶ Sambung" : "❚❚ Jeda"}</button> : null}
        <button type="button" onClick={onReset}>↻ Reset Test</button>
        <button type="button" onClick={onBuild}>← Kembali membina</button>
      </div>
      <div className="bridge3d-force-legend">
        <span><i className="tension" />Tension</span>
        <span><i className="compression" />Compression</span>
        <span><i className="warning" />Hampir had</span>
        <span><i className="failed" />Gagal</span>
      </div>
    </aside>
  );
}

export function TestResultPanel({
  result,
  failureLabel,
  onReplay,
  onAnalysis,
  onBuild,
  onRetry,
}: {
  result: TestResult;
  failureLabel: string;
  onReplay: () => void;
  onAnalysis: () => void;
  onBuild: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="bridge3d-result">
      <header><span>TEST RESULT</span><h2>{result.firstFailure ? "Jambatan telah gagal" : "Ujian selesai"}</h2><p>{result.estimate ? "Anggaran Simulasi — keputusan bergantung pada kalibrasi bahan." : "Keputusan menggunakan kalibrasi guru."}</p></header>
      <div className="bridge3d-result-grid">
        <div><span>Beban lengkap</span><strong>{result.maximumCompletedLoadKg.toFixed(1)} kg</strong></div>
        <div><span>Peringkat gagal</span><strong>{result.failedStageLoadKg?.toFixed(1) ?? "—"} kg</strong></div>
        <div><span>Masa kegagalan</span><strong>{result.failureTimeSeconds?.toFixed(1) ?? "—"} s</strong></div>
        <div><span>Skor masa</span><strong>{result.timeScore.toFixed(1)}</strong></div>
        <div className="is-primary"><span>Testing Score</span><strong>{result.testingScore.toFixed(2)}</strong></div>
        <div><span>Jisim jambatan</span><strong>{result.bridgeMassGram?.toFixed(2) ?? "—"} g</strong></div>
        <div className="is-primary"><span>Efficiency</span><strong>{result.efficiency?.toFixed(2) ?? "—"}</strong></div>
      </div>
      {result.firstFailure ? (
        <article className="bridge3d-first-failure">
          <span>FIRST FAILURE</span>
          <h3>{failureLabel}</h3>
          <b>{result.firstFailure.mode}</b>
          <p>{Number.isFinite(result.firstFailure.utilization)
            ? `Utilisasi ${(result.firstFailure.utilization * 100).toFixed(0)}%`
            : "Mekanisme struktur tidak stabil"}</p>
        </article>
      ) : null}
      <div className="bridge3d-learning-grid">
        <article><b>Lebih banyak bahan</b><p>Boleh menambah kekuatan, tetapi turut menambah jisim jambatan.</p></article>
        <article><b>Batang mampatan</b><p>Batang yang panjang lebih mudah mengalami buckling.</p></article>
        <article><b>Triangulasi</b><p>Struktur segi tiga membantu mengekalkan bentuk rangka.</p></article>
      </div>
      <div className="bridge3d-result-actions">
        <button type="button" onClick={onReplay}>↺ {result.firstFailure ? "Replay Failure" : "Replay Ujian"}</button>
        <button type="button" onClick={onAnalysis}>Force Analysis</button>
        <button type="button" onClick={onBuild}>Baiki reka bentuk</button>
        <button type="button" className="bridge3d-primary" onClick={onRetry}>Cuba lagi</button>
      </div>
    </section>
  );
}
