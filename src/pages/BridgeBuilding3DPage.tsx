import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import BridgeCanvas, {
  type CameraView,
  type VisibilityMode,
} from "../components/bridge3d/BridgeCanvas";
import BridgeInspector from "../components/bridge3d/BridgeInspector";
import {
  LoadTestPanel,
  TestResultPanel,
  ValidationPanel,
} from "../components/bridge3d/BridgeTestPanels";
import BridgeToolbar from "../components/bridge3d/BridgeToolbar";
import CompetitionSetup from "../components/bridge3d/CompetitionSetup";
import { calculateBridgeMass, getInventorySummary } from "../features/bridge3d/inventory";
import { getNextLoadKg, hasReachedMaximumLoad } from "../features/bridge3d/loadTest";
import {
  addMember,
  applyGlue,
  createEmptyDesign,
  createStarterDesign,
  deleteMember,
  mirrorSide,
  moveNode,
  replaceMember,
} from "../features/bridge3d/model";
import {
  deleteSavedDesign,
  exportDesign,
  importDesign,
  loadSavedDesigns,
  saveDesign,
} from "../features/bridge3d/persistence";
import {
  cloneProfile,
  duplicateProfile,
  loadProfiles,
  OFFICIAL_2026_PROFILE,
  OFFICIAL_2026_PROFILE_ID,
  saveProfiles,
} from "../features/bridge3d/profile";
import { createTestResult } from "../features/bridge3d/scoring";
import { analyseBridge } from "../features/bridge3d/solver";
import type {
  BridgeDesign,
  BuildPlane,
  BuildTool,
  CompetitionProfile,
  MemberRole,
  Selection,
  StructuralResult,
  TestResult,
  Vector3Data,
} from "../features/bridge3d/types";
import { useBridgeHistory } from "../features/bridge3d/useBridgeHistory";
import { validateBridge } from "../features/bridge3d/validation";
import "./BridgeBuilding3DPage.css";

type WorkflowStage = "welcome" | "build" | "validate" | "test" | "result" | "analysis";

function SimpleModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="bridge3d-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bridge3d-simple-modal" role="dialog" aria-modal="true">
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Tutup">×</button></header>
        {children}
      </section>
    </div>
  );
}

function Welcome({ onStarter, onEmpty }: { onStarter: () => void; onEmpty: () => void }) {
  return (
    <div className="bridge3d-welcome">
      <div className="bridge3d-welcome__visual" aria-hidden="true">
        <div className="bridge3d-mini-bridge">
          {Array.from({ length: 6 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}
        </div>
      </div>
      <div>
        <span>CABARAN KEJURUTERAAN 3D</span>
        <h2>Bina jambatan lidi yang ringan, kukuh dan cekap.</h2>
        <p>Susun truss kiri dan kanan, tambah lantai serta cross bracing, gunakan gam secara strategik, kemudian uji sehingga gagal.</p>
        <div className="bridge3d-welcome__steps">
          <b>1 BINA</b><i>→</i><b>2 SAHKAN</b><i>→</i><b>3 UJI</b><i>→</i><b>4 ANALISIS</b><i>→</i><b>5 BAIKI</b>
        </div>
        <div className="bridge3d-welcome__actions">
          <button type="button" className="bridge3d-primary" onClick={onStarter}>Mulakan dengan rangka latihan</button>
          <button type="button" onClick={onEmpty}>Mulakan reka bentuk kosong</button>
        </div>
        <small>Keputusan kekuatan ialah Anggaran Simulasi sehingga bahan dikalibrasi oleh guru.</small>
      </div>
    </div>
  );
}

export default function BridgeBuilding3DPage({ reviewPanel }: { reviewPanel?: ReactNode }) {
  const initialProfiles = useMemo(() => loadProfiles(), []);
  const [profiles, setProfiles] = useState<CompetitionProfile[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState(initialProfiles[0]?.id ?? OFFICIAL_2026_PROFILE_ID);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? cloneProfile(OFFICIAL_2026_PROFILE);
  const history = useBridgeHistory(createEmptyDesign(activeProfile));
  const { design, commit, replace, undo, redo, canUndo, canRedo } = history;

  const [stage, setStage] = useState<WorkflowStage>("welcome");
  const [tool, setTool] = useState<BuildTool>("select");
  const [plane, setPlane] = useState<BuildPlane>("left");
  const [selection, setSelection] = useState<Selection>(null);
  const [pendingStart, setPendingStart] = useState<Vector3Data | null>(null);
  const [cameraView, setCameraView] = useState<CameraView>("perspective");
  const [cameraNonce, setCameraNonce] = useState(0);
  const [visibility, setVisibility] = useState<VisibilityMode>("all");
  const [ghostOtherSide, setGhostOtherSide] = useState(true);
  const [showClearance, setShowClearance] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<BridgeDesign[]>(loadSavedDesigns);
  const [saveName, setSaveName] = useState(design.name);
  const [feedback, setFeedback] = useState("Pilih satah binaan dan alat Tambah Lidi untuk bermula.");
  const [snapInfo, setSnapInfo] = useState("Grid 1 cm aktif");
  const [glueAmount, setGlueAmount] = useState(0.5);
  const [mirrorDirection, setMirrorDirection] = useState<"leftToRight" | "rightToLeft" | null>(null);

  const validation = useMemo(() => validateBridge(design), [design]);
  const inventorySummary = useMemo(() => getInventorySummary(design.sticks), [design.sticks]);
  const glueUsed = design.joints.reduce((sum, joint) => sum + joint.glueUsedCm, 0);
  const mass = useMemo(
    () => calculateBridgeMass(design.sticks, glueUsed, design.profileSnapshot),
    [design.profileSnapshot, design.sticks, glueUsed],
  );

  const [testMode, setTestMode] = useState<"auto" | "manual">("auto");
  const [testRunning, setTestRunning] = useState(false);
  const [testPaused, setTestPaused] = useState(false);
  const [currentLoadKg, setCurrentLoadKg] = useState(0);
  const [completedLoadKg, setCompletedLoadKg] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(design.profileSnapshot.loadTestRules.holdDurationSeconds);
  const [analysis, setAnalysis] = useState<StructuralResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [deformed, setDeformed] = useState(false);
  const failureAtRef = useRef<number | null>(null);

  const showFeedback = (message: string) => setFeedback(message);

  const handlePoint = (point: Vector3Data, label: string) => {
    if (tool !== "add") return;
    setSnapInfo(label);
    if (!pendingStart) {
      setPendingStart(point);
      showFeedback("Titik mula dipilih. Gerakkan penuding dan pilih titik akhir.");
      return;
    }
    const result = addMember(design, pendingStart, point, plane);
    if (!result.ok) {
      showFeedback(result.reason ?? "Lidi tidak dapat ditambah.");
      return;
    }
    commit(result.design);
    setPendingStart(null);
    setSelection(result.member ? { kind: "member", id: result.member.id } : null);
    showFeedback(`Lidi ${result.member?.lengthCm.toFixed(1)} cm ditambah daripada ${result.member?.sourceStickId}.`);
  };

  const handleSelect = (next: Selection) => {
    if (next?.kind === "member" && tool === "delete") {
      commit(deleteMember(design, next.id));
      setSelection(null);
      showFeedback("Lidi dipadam dan segmen dikembalikan sebagai offcut.");
      return;
    }
    if (next?.kind === "node" && tool === "glue") {
      const joint = design.joints.find((item) => item.nodeId === next.id);
      if (joint) handleGlue(joint.id);
      return;
    }
    setSelection(next);
  };

  const handleGlue = (jointId: string) => {
    const result = applyGlue(design, jointId, glueAmount);
    if (result.ok) {
      commit(result.design);
      showFeedback(`${glueAmount.toFixed(2)} cm gam ditambah pada sambungan.`);
    } else showFeedback(result.reason ?? "Gam tidak dapat ditambah.");
  };

  const updateMemberRole = (memberId: string, role: MemberRole) => {
    commit({ ...design, members: design.members.map((member) => member.id === memberId ? { ...member, role } : member) });
  };

  const updateNodePosition = (nodeId: string, position: Vector3Data) => {
    const next = moveNode(design, nodeId, position);
    if (next === design) {
      showFeedback("Nod tidak dapat dialih: kedudukan bertindih atau bahan lidi tidak mencukupi.");
      return;
    }
    commit(next);
    showFeedback("Nod dialih dan penggunaan segmen lidi dikira semula.");
  };

  const handleReplaceMember = (memberId: string) => {
    const result = replaceMember(design, memberId);
    if (!result.ok) {
      showFeedback(result.reason ?? "Lidi tidak dapat diganti.");
      return;
    }
    commit(result.design);
    setSelection(result.member ? { kind: "member", id: result.member.id } : null);
    showFeedback("Lidi diganti menggunakan inventori fizikal.");
  };

  const changePlane = (next: BuildPlane) => {
    setPlane(next);
    setPendingStart(null);
    const viewMap: Record<BuildPlane, CameraView> = { left: "front", right: "rear", base: "top", cross: "perspective" };
    setCameraView(viewMap[next]);
    setCameraNonce((value) => value + 1);
  };

  const applyProfile = (profile: CompetitionProfile) => {
    setProfiles((current) => current.map((item) => item.id === profile.id ? profile : item));
    commit({ ...design, profileId: profile.id, profileSnapshot: structuredClone(profile) });
  };

  const selectProfile = (id: string) => {
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    setActiveProfileId(id);
    commit({ ...design, profileId: id, profileSnapshot: structuredClone(profile) });
  };

  const saveActiveProfile = () => {
    let nextProfiles = profiles;
    let profile = activeProfile;
    if (profile.id === OFFICIAL_2026_PROFILE_ID && profile.modified) {
      profile = { ...duplicateProfile(profile, `${profile.name} (Custom)`), year: profile.year };
      nextProfiles = [...profiles, profile];
      setActiveProfileId(profile.id);
      commit({ ...design, profileId: profile.id, profileSnapshot: structuredClone(profile) });
    } else {
      nextProfiles = profiles.map((item) => item.id === profile.id ? profile : item);
    }
    setProfiles(nextProfiles);
    saveProfiles(nextProfiles);
    showFeedback("Profil pertandingan disimpan dalam pelayar.");
  };

  const duplicateActiveProfile = () => {
    const copy = duplicateProfile(activeProfile);
    const next = [...profiles, copy];
    setProfiles(next);
    setActiveProfileId(copy.id);
    saveProfiles(next);
    commit({ ...design, profileId: copy.id, profileSnapshot: structuredClone(copy) });
  };

  const resetProfile = () => {
    const official = cloneProfile(OFFICIAL_2026_PROFILE);
    if (activeProfileId === OFFICIAL_2026_PROFILE_ID) {
      setProfiles((current) => current.map((item) => item.id === OFFICIAL_2026_PROFILE_ID ? official : item));
      commit({ ...design, profileSnapshot: official });
    } else {
      const reset = { ...official, id: activeProfileId, name: activeProfile.name, modified: true };
      setProfiles((current) => current.map((item) => item.id === activeProfileId ? reset : item));
      commit({ ...design, profileSnapshot: reset });
    }
  };

  const mirrorPreview = mirrorDirection ? mirrorSide(design, mirrorDirection) : null;
  const confirmMirror = () => {
    if (!mirrorPreview) return;
    if (mirrorPreview.ok) {
      commit(mirrorPreview.design);
      showFeedback("Struktur sisi dicerminkan dan inventori sebenar telah digunakan.");
    } else showFeedback(mirrorPreview.reason ?? "Bahan tidak mencukupi untuk mirror.");
    setMirrorDirection(null);
  };

  const resetTest = () => {
    setTestRunning(false);
    setTestPaused(false);
    setCurrentLoadKg(0);
    setCompletedLoadKg(0);
    setRemainingSeconds(design.profileSnapshot.loadTestRules.holdDurationSeconds);
    setAnalysis(null);
    setTestResult(null);
    setDeformed(false);
    failureAtRef.current = null;
  };

  const startLoadStage = useCallback((loadKg: number) => {
    const result = analyseBridge(design, loadKg);
    const hold = design.profileSnapshot.loadTestRules.holdDurationSeconds;
    const utilization = result.firstFailure?.utilization ?? 0;
    failureAtRef.current = result.firstFailure
      ? Math.max(0.4, Math.min(hold - 0.05, Number.isFinite(utilization) ? hold / Math.max(1.01, utilization) : 0.4))
      : null;
    setCurrentLoadKg(loadKg);
    setRemainingSeconds(hold);
    setAnalysis(result);
    setTestRunning(true);
    setTestPaused(false);
    setDeformed(false);
  }, [design]);

  const finishWithResult = useCallback((failed: boolean, elapsed: number) => {
    const result = createTestResult({
      maximumCompletedLoadKg: completedLoadKg,
      failedStageLoadKg: failed ? currentLoadKg : null,
      failureTimeSeconds: failed ? elapsed : null,
      bridgeMassGram: mass.massGram,
      firstFailure: failed ? analysis?.firstFailure ?? null : null,
      estimate: mass.estimated || Boolean(analysis?.estimate),
      profile: design.profileSnapshot,
    });
    setTestRunning(false);
    setDeformed(failed);
    setTestResult(result);
    setStage("result");
  }, [analysis?.firstFailure, analysis?.estimate, completedLoadKg, currentLoadKg, design.profileSnapshot, mass.estimated, mass.massGram]);

  useEffect(() => {
    if (!testRunning || testPaused || stage !== "test") return undefined;
    const tick = window.setInterval(() => {
      setRemainingSeconds((current) => {
        const hold = design.profileSnapshot.loadTestRules.holdDurationSeconds;
        const next = Math.max(0, current - 0.1);
        const elapsed = hold - next;
        if (failureAtRef.current !== null && elapsed >= failureAtRef.current) {
          window.clearInterval(tick);
          window.setTimeout(() => finishWithResult(true, failureAtRef.current ?? elapsed), 0);
          return next;
        }
        if (next <= 0) {
          window.clearInterval(tick);
          const nextCompleted = currentLoadKg;
          setCompletedLoadKg(nextCompleted);
          const nextLoad = getNextLoadKg(nextCompleted, design.profileSnapshot);
          const reachedMaximum = hasReachedMaximumLoad(nextCompleted, design.profileSnapshot);
          if (testMode === "auto" && !reachedMaximum) {
            window.setTimeout(() => {
              setCompletedLoadKg(nextCompleted);
              startLoadStage(nextLoad);
            }, 150);
          } else if (reachedMaximum) {
            window.setTimeout(() => {
              const result = createTestResult({
                maximumCompletedLoadKg: nextCompleted,
                failedStageLoadKg: null,
                failureTimeSeconds: null,
                bridgeMassGram: mass.massGram,
                firstFailure: null,
                estimate: mass.estimated || Boolean(analysis?.estimate),
                profile: design.profileSnapshot,
              });
              setTestRunning(false);
              setTestResult(result);
              setStage("result");
            }, 0);
          } else {
            setTestRunning(false);
          }
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(tick);
  }, [analysis?.estimate, currentLoadKg, design, finishWithResult, mass.estimated, mass.massGram, stage, startLoadStage, testMode, testPaused, testRunning]);

  const beginTest = () => {
    setStage("test");
    resetTest();
    setCameraView("perspective");
    setCameraNonce((value) => value + 1);
  };

  const startTest = () => startLoadStage(design.profileSnapshot.loadTestRules.incrementKg);
  const nextManualLoad = () => startLoadStage(completedLoadKg + design.profileSnapshot.loadTestRules.incrementKg);

  const saveCurrentDesign = () => {
    const named = { ...design, name: saveName || design.name };
    commit(named);
    saveDesign(named);
    setSavedDesigns(loadSavedDesigns());
    showFeedback("Reka bentuk disimpan dalam pelayar.");
  };

  const openDesign = (nextDesign: BridgeDesign) => {
    replace(nextDesign);
    setSaveName(nextDesign.name);
    if (!profiles.some((profile) => profile.id === nextDesign.profileId)) {
      setProfiles((current) => [...current, cloneProfile(nextDesign.profileSnapshot)]);
    }
    setActiveProfileId(nextDesign.profileId);
    setStage("build");
    setSelection(null);
  };

  return (
    <main className="bridge3d-page">
      <header className="bridge3d-header">
        <a href="/simulator" aria-label="Kembali ke senarai simulator" className="bridge3d-brand"><span>B3</span><div><b>EduSim</b><small>Engineering Studio</small></div></a>
        <div className="bridge3d-title"><span>BRIDGE BUILDING 3D</span><h1>Bina <i>•</i> Uji <i>•</i> Analisis <i>•</i> Baiki</h1></div>
        <div className="bridge3d-header__actions">
          <button type="button" onClick={() => setFilesOpen(true)}>▣ Reka bentuk</button>
          <button type="button" onClick={() => setSettingsOpen(true)}>⚙ Peraturan</button>
        </div>
      </header>

      <nav className="bridge3d-workflow" aria-label="Aliran simulator">
        {(["build", "validate", "test", "analysis"] as const).map((item, index) => (
          <button
            type="button"
            key={item}
            className={(stage === item || (stage === "result" && item === "analysis")) ? "is-active" : ""}
            onClick={() => {
              if (item === "build") setStage("build");
              if (item === "validate") setStage("validate");
              if (item === "test" && (validation.valid || design.mode === "practice")) beginTest();
              if (item === "analysis" && testResult) setStage("analysis");
            }}
          ><b>{index + 1}</b><span>{item === "build" ? "Bina" : item === "validate" ? "Sahkan" : item === "test" ? "Uji" : "Analisis"}</span></button>
        ))}
      </nav>

      {stage === "welcome" ? <Welcome
        onStarter={() => { const starter = createStarterDesign(activeProfile); replace(starter); setStage("build"); setSaveName(starter.name); }}
        onEmpty={() => { const empty = createEmptyDesign(activeProfile); replace(empty); setStage("build"); setSaveName(empty.name); }}
      /> : null}

      {stage !== "welcome" ? (
        <div className={`bridge3d-studio is-${stage}`}>
          {stage === "build" || stage === "validate" ? (
            <BridgeToolbar
              tool={tool}
              plane={plane}
              cameraView={cameraView}
              visibility={visibility}
              ghostOtherSide={ghostOtherSide}
              showClearance={showClearance}
              canUndo={canUndo}
              canRedo={canRedo}
              onTool={(next) => { setTool(next); setPendingStart(null); }}
              onPlane={changePlane}
              onView={(view) => { setCameraView(view); setCameraNonce((value) => value + 1); }}
              onVisibility={setVisibility}
              onGhost={() => setGhostOtherSide((value) => !value)}
              onClearance={() => setShowClearance((value) => !value)}
              onUndo={() => { undo(); setSelection(null); }}
              onRedo={() => { redo(); setSelection(null); }}
              onFit={() => setCameraNonce((value) => value + 1)}
            />
          ) : null}

          <section className="bridge3d-viewport-shell">
            <div className="bridge3d-viewport-topbar">
              <div><span>{stage === "build" || stage === "validate" ? "3D WORKBENCH" : stage === "test" ? "3D TEST RIG" : "FORCE ANALYSIS"}</span><b>{design.name}</b></div>
              <div className="bridge3d-dimension-chips">
                <span className={validation.items.find((item) => item.id === "length")?.severity === "pass" ? "is-valid" : "is-invalid"}>L {validation.dimensions.lengthCm.toFixed(1)} cm</span>
                <span className={validation.items.find((item) => item.id === "width")?.severity === "pass" ? "is-valid" : "is-invalid"}>W {validation.dimensions.widthCm.toFixed(1)} cm</span>
                <span className={validation.items.find((item) => item.id === "height")?.severity === "pass" ? "is-valid" : "is-invalid"}>H {validation.dimensions.heightCm.toFixed(1)} cm</span>
              </div>
            </div>
            <BridgeCanvas
              design={design}
              tool={tool}
              plane={plane}
              selection={selection}
              pendingStart={pendingStart}
              cameraView={cameraView}
              cameraNonce={cameraNonce}
              visibility={visibility}
              ghostOtherSide={ghostOtherSide}
              showClearance={showClearance}
              stage={stage === "analysis" || stage === "result" ? "analysis" : stage === "test" ? "test" : "build"}
              loadKg={currentLoadKg}
              analysis={analysis}
              deformed={deformed || stage === "analysis"}
              onPoint={handlePoint}
              onSelect={handleSelect}
              onHoverInfo={setSnapInfo}
            />
            <div className="bridge3d-viewport-status"><span>{snapInfo}</span><b>1 unit = 1 cm</b><span>{pendingStart ? "Pilih titik akhir" : "Orbit: seret · Zum: roda tetikus"}</span></div>
          </section>

          {stage === "build" || stage === "validate" || stage === "analysis" ? (
            <BridgeInspector
              design={design}
              selection={selection}
              analysis={analysis}
              glueAmount={glueAmount}
              onGlueAmount={setGlueAmount}
              onMoveNode={updateNodePosition}
              onDeleteMember={(id) => { commit(deleteMember(design, id)); setSelection(null); }}
              onReplaceMember={handleReplaceMember}
              onRole={updateMemberRole}
              onGlue={handleGlue}
              onInventoryMode={(mode) => commit({ ...design, selectedInventoryMode: mode })}
              readOnly={stage === "analysis"}
            />
          ) : null}

          {stage === "test" ? (
            <LoadTestPanel
              mode={testMode}
              running={testRunning}
              paused={testPaused}
              currentLoadKg={currentLoadKg}
              completedLoadKg={completedLoadKg}
              remainingSeconds={remainingSeconds}
              incrementKg={design.profileSnapshot.loadTestRules.incrementKg}
              maximumKg={design.profileSnapshot.loadTestRules.maximumTestLoadKg}
              holdDurationSeconds={design.profileSnapshot.loadTestRules.holdDurationSeconds}
              analysis={analysis}
              onMode={setTestMode}
              onStart={startTest}
              onNext={nextManualLoad}
              onPause={() => setTestPaused((value) => !value)}
              onReset={resetTest}
              onBuild={() => { resetTest(); setStage("build"); }}
            />
          ) : null}

          {stage === "build" || stage === "validate" ? <footer className="bridge3d-actionbar">
            <div><b>{design.mode === "competition" ? "COMPETITION MODE" : "PRACTICE MODE"}</b><button type="button" onClick={() => commit({ ...design, mode: design.mode === "competition" ? "practice" : "competition" })}>Tukar mod</button></div>
            <div className="bridge3d-mirror-actions">
              <button type="button" onClick={() => setMirrorDirection("leftToRight")}>Mirror kiri → kanan</button>
              <button type="button" onClick={() => setMirrorDirection("rightToLeft")}>Mirror kanan → kiri</button>
            </div>
            <div><span>{feedback}</span><button type="button" className="bridge3d-primary" onClick={() => setStage("validate")}>READY TO TEST →</button></div>
          </footer> : null}
        </div>
      ) : null}

      {stage === "validate" ? <ValidationPanel report={validation} competitionMode={design.mode === "competition"} onTest={beginTest} onClose={() => setStage("build")} /> : null}
      {stage === "result" && testResult ? <TestResultPanel
        result={testResult}
        onReplay={() => { setStage("test"); setDeformed(false); window.setTimeout(() => setDeformed(true), 120); }}
        onAnalysis={() => setStage("analysis")}
        onBuild={() => setStage("build")}
        onRetry={() => { resetTest(); setStage("test"); }}
      /> : null}

      {stage === "analysis" && testResult ? (
        <div className="bridge3d-analysis-drawer">
          <h2>Force Analysis</h2>
          <p>Klik lidi dalam model untuk memeriksa daya, tegangan/mampatan, stress dan utilisasi.</p>
          <div><button type="button" onClick={() => setDeformed((value) => !value)}>Tukar bentuk asal / terlentur</button><button type="button" onClick={() => setStage("build")}>Baiki reka bentuk</button></div>
        </div>
      ) : null}

      {settingsOpen ? <CompetitionSetup
        key={activeProfile.id}
        profile={activeProfile}
        profiles={profiles}
        onSelectProfile={selectProfile}
        onChange={applyProfile}
        onSave={saveActiveProfile}
        onDuplicate={duplicateActiveProfile}
        onReset={resetProfile}
        onClose={() => setSettingsOpen(false)}
      /> : null}

      {filesOpen ? (
        <SimpleModal title="Reka bentuk tersimpan" onClose={() => setFilesOpen(false)}>
          <label className="bridge3d-save-name">Nama reka bentuk<input value={saveName} onChange={(event) => setSaveName(event.target.value)} /></label>
          <div className="bridge3d-file-actions">
            <button type="button" className="bridge3d-primary" onClick={saveCurrentDesign}>Simpan Design</button>
            <button type="button" onClick={() => exportDesign(design)}>Eksport JSON</button>
            <label className="bridge3d-import-button">Import JSON<input type="file" accept="application/json" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try { const imported = await importDesign(file); openDesign(imported); setFilesOpen(false); }
              catch (error) { showFeedback(error instanceof Error ? error.message : "Import gagal."); }
            }} /></label>
            <button type="button" onClick={() => { const empty = createEmptyDesign(activeProfile); openDesign(empty); setFilesOpen(false); }}>New Design</button>
          </div>
          <div className="bridge3d-saved-list">
            {savedDesigns.length ? savedDesigns.map((saved) => (
              <article key={saved.id}><div><b>{saved.name}</b><span>{new Date(saved.updatedAt).toLocaleString("ms-MY")}</span></div><button type="button" onClick={() => { openDesign(saved); setFilesOpen(false); }}>Load</button><button type="button" onClick={() => { deleteSavedDesign(saved.id); setSavedDesigns(loadSavedDesigns()); }}>Padam</button></article>
            )) : <p>Belum ada reka bentuk disimpan.</p>}
          </div>
        </SimpleModal>
      ) : null}

      {mirrorDirection && mirrorPreview ? (
        <SimpleModal title="Sahkan Mirror" onClose={() => setMirrorDirection(null)}>
          <div className="bridge3d-mirror-summary">
            <p>Arah: <b>{mirrorDirection === "leftToRight" ? "Kiri → Kanan" : "Kanan → Kiri"}</b></p>
            <p>Jumlah panjang diperlukan: <b>{mirrorPreview.requiredLengthCm.toFixed(1)} cm</b></p>
            <p>Bahan tersedia: <b>{inventorySummary.availableLengthCm.toFixed(1)} cm</b></p>
            {!mirrorPreview.ok ? <p className="is-error">{mirrorPreview.reason}</p> : null}
          </div>
          <div className="bridge3d-modal-actions"><button type="button" onClick={() => setMirrorDirection(null)}>Batal</button><button type="button" className="bridge3d-primary" disabled={!mirrorPreview.ok} onClick={confirmMirror}>Cipta struktur sebenar</button></div>
        </SimpleModal>
      ) : null}

      <section className="bridge3d-education-note">
        <b>Prinsip utama</b><span>Batang panjang dalam mampatan lebih mudah buckling. Triangulasi dan cross bracing membantu kestabilan, tetapi setiap lidi dan gam menambah jisim.</span>
      </section>
      {reviewPanel ? <div className="bridge3d-review">{reviewPanel}</div> : null}
    </main>
  );
}
