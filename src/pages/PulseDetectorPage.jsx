import { useCallback, useEffect, useRef, useState } from "react";
import PPGWaveform from "../components/PPGWaveform";
import useCamera from "../hooks/useCamera";
import {
  analyzePPG,
  choosePPGChannel,
  evaluateContact,
  inspectFrame,
  measurementProgress,
} from "../utils/ppgProcessor";
import { downloadPulseCsv } from "../utils/csvExport";
import "./PulseDetectorPage.css";

const CONDITIONS = [
  { id: "rest", label: "Semasa rehat", short: "Rehat" },
  { id: "activity", label: "Selepas aktiviti fizikal", short: "Selepas aktiviti" },
  { id: "recovery", label: "Semasa pemulihan", short: "Pemulihan" },
];

const STATUS = {
  IDLE: ["Kamera Tidak Aktif", "Letakkan telefon di permukaan stabil sebelum bermula."],
  CAMERA_REQUEST: ["Meminta Kebenaran Kamera", "Sila benarkan akses kamera belakang."],
  FINGER_SEARCH: ["Mencari Jari", "Letakkan hujung jari pada kamera belakang."],
  STABILIZING: ["Isyarat Dikesan", "Kekalkan jari dan telefon dalam keadaan pegun."],
  MEASURING: ["Mengukur", "Jangan tekan terlalu kuat atau gerakkan telefon."],
  LOW_SIGNAL: ["Isyarat Lemah", "Laraskan jari perlahan-lahan. Masa berguna dijeda."],
  RESULT: ["Selesai", "Pengukuran melepasi semakan kualiti isyarat."],
  ERROR: ["Ralat Kamera", "Pengukuran tidak dapat diteruskan."],
  CANCELLED: ["Dihentikan", "Kamera telah dimatikan dan rakaman tidak disimpan."],
};

const formatSeconds = (milliseconds) => Math.max(0, Math.floor(milliseconds / 1000));

function HeartIcon({ beating }) {
  return (
    <span className={`pulseHeart${beating ? " pulseHeart--beating" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.2-4.5-9.5-9.1C.3 7.6 2.8 3.5 7 3.5c2.2 0 3.7 1.2 5 2.8 1.3-1.6 2.8-2.8 5-2.8 4.2 0 6.7 4.1 4.5 8.4C19.2 16.5 12 21 12 21Z" /></svg>
    </span>
  );
}

export default function PulseDetectorPage({ reviewPanel }) {
  const camera = useCamera();
  const { videoRef, active: cameraActive, start: startCamera, stop: stopCamera } = camera;
  const [stage, setStage] = useState("IDLE");
  const [message, setMessage] = useState(STATUS.IDLE[1]);
  const [progress, setProgress] = useState(0);
  const [liveBpm, setLiveBpm] = useState(null);
  const [quality, setQuality] = useState("Lemah");
  const [waveform, setWaveform] = useState([]);
  const [result, setResult] = useState(null);
  const [savedNotice, setSavedNotice] = useState("");
  const [activeMode, setActiveMode] = useState("general");
  const [selectedCondition, setSelectedCondition] = useState("rest");
  const [experiment, setExperiment] = useState(() => CONDITIONS.map((item) => ({ ...item, bpm: null, source: null })));
  const [manualValues, setManualValues] = useState({ rest: "", activity: "", recovery: "" });
  const [notes, setNotes] = useState({ hypothesis: "", interpretation: "", conclusion: "" });
  const stageRef = useRef(stage);
  const frameHistoryRef = useRef([]);
  const samplesRef = useRef([]);
  const contactSinceRef = useRef(null);
  const stabilizationRef = useRef(null);
  const usableMsRef = useRef(0);
  const lastFrameRef = useRef(null);
  const sessionStartedRef = useRef(null);
  const lastAnalysisRef = useRef(0);
  const lastProgressUiRef = useRef(0);
  const exposureRef = useRef(0);
  const pulseChannelRef = useRef("green");
  const conditionRef = useRef(null);
  const canvasRef = useRef(null);
  const callbackRef = useRef(null);
  stageRef.current = stage;

  const stopFrameLoop = useCallback(() => {
    const video = videoRef.current;
    if (video && callbackRef.current && typeof video.cancelVideoFrameCallback === "function") {
      video.cancelVideoFrameCallback(callbackRef.current);
    }
    callbackRef.current = null;
  }, [videoRef]);

  const finishWithResult = useCallback((analysis) => {
    const now = new Date();
    const finalResult = {
      bpm: analysis.bpm,
      quality: analysis.quality,
      duration: Math.round(usableMsRef.current / 1000),
      date: new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium", timeStyle: "short" }).format(now),
      timestamp: now.toISOString(),
      waveform: analysis.filtered.slice(-300),
    };
    setResult(finalResult);
    setLiveBpm(finalResult.bpm);
    setQuality(finalResult.quality);
    setWaveform(analysis.filtered);
    setStage("RESULT");
    setMessage("Bacaan hanya anggaran pendidikan berdasarkan isyarat kamera yang disahkan.");
    setProgress(100);
    if (conditionRef.current) {
      setExperiment((rows) => rows.map((row) => row.id === conditionRef.current ? { ...row, bpm: finalResult.bpm, source: "kamera" } : row));
    }
    stopFrameLoop();
    stopCamera();
  }, [stopCamera, stopFrameLoop]);

  const processVideoFrame = useCallback((time) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !cameraActive) return;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = 72;
    canvas.height = 72;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const sourceSize = Math.min(video.videoWidth, video.videoHeight) * 0.5;
    const sourceX = (video.videoWidth - sourceSize) / 2;
    const sourceY = (video.videoHeight - sourceSize) / 2;
    try {
      context.drawImage(video, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 72, 72);
      const metrics = { ...inspectFrame(context.getImageData(0, 0, 72, 72)), time };
      frameHistoryRef.current.push(metrics);
      if (frameHistoryRef.current.length > 90) frameHistoryRef.current.shift();
      const contact = evaluateContact(frameHistoryRef.current);
      exposureRef.current = contact.exposureScore;
      const currentStage = stageRef.current;
      const previousTime = lastFrameRef.current;
      lastFrameRef.current = time;
      const delta = previousTime ? Math.min(150, Math.max(0, time - previousTime)) : 0;

      if (currentStage === "FINGER_SEARCH") {
        setMessage(contact.reason);
        if (contact.detected && contact.stable) {
          contactSinceRef.current ??= time;
          if (time - contactSinceRef.current > 1400) {
            stabilizationRef.current = time;
            stageRef.current = "STABILIZING";
            setStage("STABILIZING");
            setMessage("Isyarat dikesan. Jangan gerakkan jari selama 5 saat.");
          }
        } else contactSinceRef.current = null;
      } else if (currentStage === "STABILIZING") {
        if (!contact.detected || !contact.stable) {
          stageRef.current = "FINGER_SEARCH";
          setStage("FINGER_SEARCH");
          setProgress(0);
          contactSinceRef.current = null;
          setMessage(contact.reason);
        } else {
          const stableMs = time - stabilizationRef.current;
          if (time - lastProgressUiRef.current > 180) {
            lastProgressUiRef.current = time;
            setProgress(Math.min(16, (stableMs / 5000) * 16));
          }
          if (stableMs >= 5000) {
            pulseChannelRef.current = choosePPGChannel(frameHistoryRef.current);
            samplesRef.current = [];
            usableMsRef.current = 0;
            lastAnalysisRef.current = time;
            stageRef.current = "MEASURING";
            setStage("MEASURING");
            setMessage("Isyarat stabil. Pengukuran 30 saat sedang dijalankan.");
          }
        }
      } else if (currentStage === "MEASURING" || currentStage === "LOW_SIGNAL") {
        if (contact.detected && contact.stable) {
          if (currentStage === "LOW_SIGNAL") {
            stageRef.current = "MEASURING";
            setStage("MEASURING");
            setMessage("Isyarat pulih. Pengukuran diteruskan.");
          }
          usableMsRef.current += delta;
          const selectedSignal = metrics[pulseChannelRef.current];
          const previousSample = samplesRef.current.at(-1);
          if (!previousSample || time - previousSample.time >= 10) {
            samplesRef.current.push({ time, value: selectedSignal });
            const minimumTime = time - 40000;
            while (samplesRef.current[0]?.time < minimumTime) samplesRef.current.shift();
          }
          if (time - lastProgressUiRef.current > 180) {
            lastProgressUiRef.current = time;
            setProgress(measurementProgress(usableMsRef.current));
          }
          if (time - lastAnalysisRef.current > 800 && samplesRef.current.length > 80) {
            lastAnalysisRef.current = time;
            const analysis = analyzePPG(samplesRef.current, exposureRef.current);
            setWaveform(analysis.filtered);
            setQuality(analysis.quality);
            setLiveBpm(analysis.reliable ? analysis.bpm : null);
            if (usableMsRef.current >= 30000) {
              if (analysis.reliable && analysis.quality !== "Lemah") finishWithResult(analysis);
              else {
                setLiveBpm(null);
                setMessage("30 saat lengkap. Sistem sedang mengesahkan corak denyutan—kekalkan jari pegun.");
                if (usableMsRef.current >= 45000) {
                  stageRef.current = "ERROR";
                  setStage("ERROR");
                  setMessage("Corak denyutan masih tidak cukup jelas selepas pengesahan tambahan. Laraskan jari dan ukur semula.");
                  stopFrameLoop();
                  stopCamera();
                }
              }
            }
          }
        } else {
          stageRef.current = "LOW_SIGNAL";
          setStage("LOW_SIGNAL");
          setLiveBpm(null);
          setMessage(contact.reason || "Isyarat terputus. Pastikan jari menutup kanta sepenuhnya.");
        }
      }

      if (sessionStartedRef.current && time - sessionStartedRef.current > 75000 && stageRef.current !== "RESULT") {
        stageRef.current = "ERROR";
        setStage("ERROR");
        setMessage("Isyarat yang boleh dipercayai tidak diperoleh dalam masa yang dibenarkan. Cuba semula.");
        stopFrameLoop();
        stopCamera();
      }
    } catch {
      // A transient canvas read can fail while camera dimensions change; the next frame retries.
    }
  }, [cameraActive, finishWithResult, stopCamera, stopFrameLoop, videoRef]);

  useEffect(() => {
    if (!cameraActive) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    let fallbackId;
    if (typeof video.requestVideoFrameCallback === "function") {
      const next = (now) => {
        processVideoFrame(now);
        if (cameraActive) callbackRef.current = video.requestVideoFrameCallback(next);
      };
      callbackRef.current = video.requestVideoFrameCallback(next);
    } else {
      fallbackId = window.setInterval(() => processVideoFrame(performance.now()), 1000 / 24);
    }
    return () => {
      if (fallbackId) window.clearInterval(fallbackId);
      stopFrameLoop();
    };
  }, [cameraActive, processVideoFrame, stopFrameLoop, videoRef]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && cameraActive) {
        stopFrameLoop();
        stopCamera();
        stageRef.current = "CANCELLED";
        setStage("CANCELLED");
        setLiveBpm(null);
        setMessage("Pengukuran dihentikan kerana aplikasi dipindahkan ke latar belakang atau skrin dikunci.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [cameraActive, stopCamera, stopFrameLoop]);

  const startMeasurement = async (condition = null) => {
    if (condition) setSelectedCondition(condition);
    conditionRef.current = condition;
    setStage("CAMERA_REQUEST");
    stageRef.current = "CAMERA_REQUEST";
    setMessage(STATUS.CAMERA_REQUEST[1]);
    setProgress(0);
    setLiveBpm(null);
    setQuality("Lemah");
    setResult(null);
    setWaveform([]);
    setSavedNotice("");
    frameHistoryRef.current = [];
    samplesRef.current = [];
    contactSinceRef.current = null;
    stabilizationRef.current = null;
    usableMsRef.current = 0;
    lastFrameRef.current = null;
    pulseChannelRef.current = "green";
    try {
      await startCamera();
      sessionStartedRef.current = performance.now();
      stageRef.current = "FINGER_SEARCH";
      setStage("FINGER_SEARCH");
      setMessage("Letakkan hujung jari pada kamera belakang. Pastikan kanta ditutup sepenuhnya.");
    } catch (error) {
      stageRef.current = "ERROR";
      setStage("ERROR");
      setMessage(error.message);
    }
  };

  const stopMeasurement = () => {
    stopFrameLoop();
    stopCamera();
    stageRef.current = "CANCELLED";
    setStage("CANCELLED");
    setLiveBpm(null);
    setMessage("Pengukuran dihentikan. Tiada rakaman video disimpan.");
  };

  const saveResult = () => {
    if (!result) return;
    const existing = JSON.parse(localStorage.getItem("edusim:pulse-results") || "[]");
    localStorage.setItem("edusim:pulse-results", JSON.stringify([...existing, result].slice(-20)));
    setSavedNotice("Keputusan disimpan pada peranti ini sahaja.");
  };

  const applyManualValue = (condition) => {
    const bpm = Number(manualValues[condition]);
    if (!Number.isFinite(bpm) || bpm < 35 || bpm > 220) return;
    setExperiment((rows) => rows.map((row) => row.id === condition ? { ...row, bpm: Math.round(bpm), source: "manual" } : row));
  };

  const switchMode = (mode) => {
    if (isRunning || mode === activeMode) return;
    conditionRef.current = null;
    setActiveMode(mode);
    setStage("IDLE");
    stageRef.current = "IDLE";
    setMessage(mode === "experiment"
      ? "Pilih keadaan eksperimen, kemudian mulakan pengukuran."
      : STATUS.IDLE[1]);
    setProgress(0);
    setLiveBpm(null);
    setQuality("Lemah");
    setWaveform([]);
    setResult(null);
    setSavedNotice("");
  };

  const status = STATUS[stage] || STATUS.IDLE;
  const isRunning = cameraActive && ["FINGER_SEARCH", "STABILIZING", "MEASURING", "LOW_SIGNAL"].includes(stage);
  const maxChart = Math.max(100, ...experiment.map((row) => row.bpm || 0));

  return (
    <main className="pulsePage">
      <header className="pulseHeader">
        <a className="pulseBack" href="/simulator" aria-label="Kembali ke simulator">← Simulator</a>
        <div className="pulseHeader__brand"><span className="pulseBrandMark">E</span><div><strong>EduSim Pulse Detector</strong><span>Pengukuran Kadar Denyutan Nadi</span></div></div>
        <span className="pulseClassTag">Sains Tingkatan 4</span>
      </header>

      <section className="pulseHero">
        <div className="pulseHero__copy">
          <span className="pulseEyebrow"><i /> INSTRUMEN PPG PENDIDIKAN</span>
          <h1><span>Ukur denyutan.</span><em>Fahami sainsnya.</em></h1>
          <p>Anggaran kadar denyutan nadi daripada perubahan cahaya pada hujung jari melalui kamera telefon.</p>
          <div className="pulseHero__actions">
            <a className="pulseHeroButton pulseHeroButton--primary" href="#pulse-instrument"><span aria-hidden="true">▶</span> Mula Simulator</a>
            <a className="pulseHeroButton" href="#pulse-guide"><span aria-hidden="true">▣</span> Panduan Penggunaan</a>
          </div>
        </div>
        <div className="pulseHeroVisual">
          <div className="pulseHeroVisual__halo" aria-hidden="true">
            <svg viewBox="0 0 220 220"><path d="M110 184S37 141 37 82c0-31 22-51 49-51 13 0 25 6 34 17 9-11 21-17 34-17 27 0 49 20 49 51 0 59-73 102-93 102Z" /><path d="M29 117h45l13-28 21 58 20-45 14 15h50" /></svg>
          </div>
          <img src="/assets/pulse-detector-phone.png" alt="Ilustrasi tangan memegang telefon dengan paparan Pulse Detector 72 BPM" />
          <span className="pulseHeroVisual__caption">Visual ilustrasi</span>
        </div>
      </section>

      <nav className="pulseModeSwitcher" aria-label="Pilih kegunaan Pulse Detector">
        <button className={activeMode === "general" ? "active" : ""} type="button" disabled={isRunning} aria-pressed={activeMode === "general"} onClick={() => switchMode("general")}>
          <span>01</span><div><strong>Pengukuran Umum</strong><small>Ukur kadar denyutan nadi individu</small></div>
        </button>
        <button className={activeMode === "experiment" ? "active" : ""} type="button" disabled={isRunning} aria-pressed={activeMode === "experiment"} onClick={() => switchMode("experiment")}>
          <span>02</span><div><strong>Eksperimen Sains</strong><small>Bandingkan rehat, aktiviti dan pemulihan</small></div>
        </button>
        <div className="pulseModePrivacy"><svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5l-8-3Zm0 5a2 2 0 0 1 2 2v1h1v5H9v-5h1V9a2 2 0 0 1 2-2Z" /></svg><div><strong>Privasi Terjamin</strong><small>Analisis berlaku pada peranti. Video tidak dihantar ke pelayan.</small></div></div>
      </nav>

      {activeMode === "experiment" && <section className="pulseExperimentSetup">
        <div><span>MOD EKSPERIMEN</span><h2>Pilih keadaan yang hendak diukur</h2><p>Setiap bacaan kamera akan direkodkan pada keadaan yang dipilih sahaja.</p></div>
        <div className="pulseConditionTabs">{CONDITIONS.map((condition) => <button key={condition.id} className={selectedCondition === condition.id ? "active" : ""} type="button" disabled={isRunning} onClick={() => setSelectedCondition(condition.id)}>{condition.label}</button>)}</div>
      </section>}

      <section id="pulse-instrument" className="pulseInstrument" aria-label="Instrumen pengukuran nadi">
        <div className="pulseCameraPanel">
          <div className="pulsePanelHeading"><div><span>KAMERA BELAKANG · {activeMode === "experiment" ? "MOD EKSPERIMEN" : "MOD UMUM"}</span><strong>{status[0]}</strong></div><span className={`pulseLive ${cameraActive ? "pulseLive--active" : ""}`}><i />{cameraActive ? " AKTIF" : " MATI"}</span></div>
          <div className="pulseCameraFrame">
            <video ref={videoRef} muted playsInline aria-label="Paparan kamera belakang" />
            {!cameraActive && <div className="pulseCameraEmpty"><svg viewBox="0 0 24 24"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Zm8 3.2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" /></svg><span>Kamera dimulakan hanya selepas anda menekan butang mula</span></div>}
            {cameraActive && <div className="pulseRoi"><span>Letak jari di sini</span></div>}
            <div className="pulseScanLines" />
          </div>
          <div className="pulseStatusMessage"><i className={`pulseStatusDot pulseStatusDot--${stage.toLowerCase()}`} /><p>{message}</p></div>
          {camera.torch.message && cameraActive && <button className="pulseTorch" type="button" disabled={!camera.torch.supported} onClick={camera.toggleTorch}>◉ {camera.torch.message}</button>}
        </div>

        <div className="pulseReadout">
          <div className="pulseReadout__top"><span>DENYUTAN SEMINIT</span><span className={`qualityPill qualityPill--${quality.toLowerCase()}`}>{quality}</span></div>
          <div className="pulseBpm"><HeartIcon beating={Boolean(liveBpm && isRunning)} /><strong>{liveBpm ?? "--"}</strong><span>BPM</span></div>
          <div className="pulseWavePanel"><div className="pulseWaveTitle"><span>GELOMBANG PPG</span><small>Isyarat optik sebenar · 10 saat</small></div><PPGWaveform samples={waveform} running={isRunning} /></div>
          <div className="pulseProgress"><div><span>Kemajuan pengukuran</span><strong>{Math.round(progress)}%</strong></div><progress max="100" value={progress} /></div>
        </div>
      </section>

      <section className="pulseActions">
        {!isRunning ? <button className="pulseButton pulseButton--primary" type="button" onClick={() => startMeasurement(activeMode === "experiment" ? selectedCondition : null)}><span>♥</span>{result ? "Ukur Semula" : activeMode === "experiment" ? `Ukur: ${CONDITIONS.find((item) => item.id === selectedCondition)?.short}` : "Mula Pengukuran Umum"}</button> : <button className="pulseButton pulseButton--stop" type="button" onClick={stopMeasurement}>■ Hentikan</button>}
        <button className="pulseButton" type="button" onClick={saveResult} disabled={!result}>Simpan Keputusan</button>
        <button className="pulseButton" type="button" onClick={() => downloadPulseCsv(result, experiment)} disabled={!result && !experiment.some((row) => row.bpm)}>Muat Turun CSV</button>
        {savedNotice && <span className="pulseSaved">✓ {savedNotice}</span>}
      </section>

      {result && <section className="pulseResult"><div><span>KEPUTUSAN DISAHKAN OLEH SEMAKAN ISYARAT</span><h2>{result.bpm} <small>BPM</small></h2></div><dl><div><dt>Kualiti Isyarat</dt><dd>{result.quality}</dd></div><div><dt>Tempoh</dt><dd>{result.duration} saat</dd></div><div><dt>Tarikh &amp; masa</dt><dd>{result.date}</dd></div></dl><p>Ini ialah anggaran pendidikan, bukan diagnosis atau bacaan peranti perubatan.</p></section>}

      <section id="pulse-guide" className="pulseHowTo"><div className="pulseSectionTitle"><span>01</span><div><p>PANDUAN PENGUKURAN</p><h2>Dapatkan isyarat yang lebih jelas</h2></div></div><div className="pulseTips">{[["1", "Tutup kanta", "Letakkan hujung jari tepat di atas kamera belakang."], ["2", "Sentuhan ringan", "Jangan tekan terlalu kuat kerana aliran darah boleh berkurang."], ["3", "Kekal pegun", "Letakkan telefon di atas meja dan elakkan pergerakan."], ["4", "Tunggu 35 saat", "5 saat penstabilan diikuti 30 saat isyarat berguna."]].map(([number, title, copy]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>

      {activeMode === "experiment" && <section className="pulseExperiment">
        <div className="pulseSectionTitle"><span>02</span><div><p>REKOD DAN ANALISIS</p><h2>Kesan Aktiviti Fizikal terhadap Kadar Denyutan Nadi</h2></div></div>
        <p className="pulseExperiment__intro">Bacaan bagi {CONDITIONS.find((item) => item.id === selectedCondition)?.label.toLowerCase()} akan dimasukkan ke jadual selepas pengukuran berjaya. Lakukan aktiviti fizikal ringan sahaja dan berhenti jika tidak selesa.</p>
        <div className="pulseExperimentGrid">
          <div className="pulseTableWrap"><table><thead><tr><th>Keadaan</th><th>BPM</th><th>Sumber</th></tr></thead><tbody>{experiment.map((row) => <tr key={row.id}><td>{row.label}</td><td>{row.bpm ?? "—"}</td><td>{row.source === "kamera" ? "Kamera" : row.source === "manual" ? "Manual" : "Belum diukur"}</td></tr>)}</tbody></table><details><summary>Telefon tidak dapat mengukur? Masukkan bacaan manual</summary>{CONDITIONS.map((condition) => <div className="pulseManual" key={condition.id}><label htmlFor={`manual-${condition.id}`}>{condition.short}</label><input id={`manual-${condition.id}`} inputMode="numeric" placeholder="BPM" value={manualValues[condition.id]} onChange={(event) => setManualValues((values) => ({ ...values, [condition.id]: event.target.value }))} /><button type="button" onClick={() => applyManualValue(condition.id)}>Rekod</button></div>)}</details></div>
          <div className="pulseChart" aria-label="Carta bar perbandingan BPM">{experiment.map((row) => <div className="pulseBarRow" key={row.id}><span>{row.short}</span><div><i style={{ width: row.bpm ? `${Math.max(8, (row.bpm / maxChart) * 100)}%` : "0%" }} /></div><strong>{row.bpm ?? "—"}</strong></div>)}</div>
        </div>
        <div className="pulseVariables"><article><span>PEMBOLEH UBAH DIMANIPULASIKAN</span><p>Keadaan aktiviti fizikal</p></article><article><span>PEMBOLEH UBAH BERGERAK BALAS</span><p>Kadar denyutan nadi (BPM)</p></article><article><span>PEMBOLEH UBAH DIMALARKAN</span><p>Individu, kaedah dan tempoh pengukuran</p></article></div>
        <div className="pulseScienceNotes"><label>Hipotesis<textarea value={notes.hypothesis} onChange={(event) => setNotes((value) => ({ ...value, hypothesis: event.target.value }))} placeholder="Tulis hubungan antara aktiviti fizikal dengan kadar denyutan nadi…" /></label><label>Interpretasi graf<textarea value={notes.interpretation} onChange={(event) => setNotes((value) => ({ ...value, interpretation: event.target.value }))} placeholder="Bandingkan bacaan bagi ketiga-tiga keadaan…" /></label><label>Kesimpulan<textarea value={notes.conclusion} onChange={(event) => setNotes((value) => ({ ...value, conclusion: event.target.value }))} placeholder="Nyatakan sama ada hipotesis diterima…" /></label></div>
      </section>}

      <section className="pulseSafety"><div><strong>ⓘ Prototip pendidikan, bukan alat perubatan</strong><p>Anggaran kamera boleh terjejas oleh pergerakan, pencahayaan, tekanan jari, kadar bingkai dan ritma nadi tidak sekata. Jangan gunakan hasil untuk mendiagnosis penyakit atau menentukan seseorang sihat atau tidak sihat.</p></div><ul><li>Data video diproses secara setempat</li><li>Tiada rakaman kamera disimpan</li><li>Kamera dihentikan apabila aplikasi ditutup atau dilatarbelakangkan</li></ul></section>
      {reviewPanel}
      <footer className="pulseFooter"><span>EduSim AI · Sains Tingkatan 4</span><span>Photoplethysmography (PPG) · Untuk pembelajaran sahaja</span></footer>
    </main>
  );
}
