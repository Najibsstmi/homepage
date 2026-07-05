import { useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  NITROGEN_ASSETS,
  NITROGEN_BACKGROUND,
  NITROGEN_CHALLENGES,
  NITROGEN_PROCESSES,
  type NitrogenChallenge,
  type NitrogenHotspotArea,
  type NitrogenProcess,
  type NitrogenProcessId,
} from "../data/nitrogenCycleData";
import "./NitrogenCycleSimulatorPage.css";

type SimulatorMode = "explore" | "challenge";
type ChallengeFeedback =
  | { type: "success" | "error" | "warning"; message: string }
  | null;
type NitrogenAssetKey = keyof typeof NITROGEN_ASSETS;
const PRELOAD_ASSET_KEYS: readonly NitrogenAssetKey[] = [
  "background",
  "legume",
  "cow",
  "fallenLeaves",
  "river",
  "bacteria",
  "lightning",
];

function areaStyle(area: NitrogenHotspotArea): CSSProperties {
  return {
    left: area.left,
    top: area.top,
    width: area.width,
    height: area.height,
  };
}

function useImagePreloads(hrefs: readonly string[]) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const links = hrefs.map((href) => {
      const existing = Array.from(
        document.head.querySelectorAll<HTMLLinkElement>(
          'link[data-nitrogen-preload="true"]',
        ),
      ).find((link) => link.href === new URL(href, window.location.href).href);

      if (existing) {
        return null;
      }

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.dataset.nitrogenPreload = "true";
      document.head.appendChild(link);

      return link;
    });

    return () => {
      links.forEach((link) => link?.remove());
    };
  }, [hrefs]);
}

function getProcessAssetKeys(
  processId: NitrogenProcessId | null,
): NitrogenAssetKey[] {
  if (!processId) {
    return [];
  }

  const assetsByProcess: Record<NitrogenProcessId, NitrogenAssetKey[]> = {
    lightning: ["lightning"],
    fixation: ["bacteria", "legume"],
    decomposition: ["fallenLeaves", "bacteria"],
    nitrification: ["bacteria"],
    absorption: ["legume"],
    feeding: ["cow"],
    denitrification: ["river", "bacteria"],
  };

  return assetsByProcess[processId];
}

function getChallengeAssetKeys(
  challenge: NitrogenChallenge | undefined,
): NitrogenAssetKey[] {
  if (!challenge) {
    return [];
  }

  const assetsByRecovery: Record<NitrogenChallenge["recovery"], NitrogenAssetKey[]> = {
    legume: ["legume", "bacteria"],
    river: ["river"],
    soil: ["bacteria", "legume"],
    decomposition: ["fallenLeaves", "bacteria"],
    denitrification: ["river", "bacteria"],
  };

  return assetsByRecovery[challenge.recovery];
}

function uniqueAssetUrls(keys: readonly NitrogenAssetKey[]) {
  return Array.from(new Set(keys.map((key) => NITROGEN_ASSETS[key])));
}

function LazyOverlayAssets({ urls }: { urls: string[] }) {
  if (!urls.length) {
    return null;
  }

  return (
    <div className="nitrogenLazyAssetRack" aria-hidden="true">
      {urls.map((url) => (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
        />
      ))}
    </div>
  );
}

function getStatusLabel(
  processId: NitrogenProcessId,
  activeProcessId: NitrogenProcessId | null,
  completedProcessIds: NitrogenProcessId[],
) {
  if (completedProcessIds.includes(processId)) {
    return "selesai";
  }

  if (activeProcessId === processId) {
    return "sedang aktif";
  }

  return "belum diteroka";
}

function OverlayLabel({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return <span className={`nitrogenOverlayLabel ${className}`}>{children}</span>;
}

function BacteriaCluster({ className }: { className: string }) {
  return (
    <span className={`nitrogenBacteriaCluster ${className}`} aria-hidden="true">
      <img
        src={NITROGEN_ASSETS.bacteria}
        alt=""
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </span>
  );
}

function FlowArrow({
  className,
  d,
}: {
  className: string;
  d: string;
}) {
  const markerId = useId().replace(/:/g, "");

  return (
    <svg
      className={`nitrogenFlowArrow ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="6"
          viewBox="0 -3 6 6"
          refX="5.6"
          refY="0"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path className="nitrogenFlowArrow__head" d="M 0 -2.5 L 6 0 L 0 2.5 Z" />
        </marker>
      </defs>
      <path
        className="nitrogenFlowArrow__path"
        d={d}
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}

function ProcessOverlay({
  processId,
  animationKey,
}: {
  processId: NitrogenProcessId | null;
  animationKey: number;
}) {
  if (!processId) {
    return null;
  }

  return (
    <div
      key={`${processId}-${animationKey}`}
      className={`nitrogenProcessOverlay nitrogenProcessOverlay--${processId}`}
      aria-hidden="true"
    >
      {processId === "fixation" && (
        <>
          <OverlayLabel className="nitrogenOverlayLabel--n2SkyA">
            gas nitrogen (N2)
          </OverlayLabel>
          <FlowArrow
            className="nitrogenFlowArrow--fixationAtmosphere"
            d="M 16 51 L 16 58"
          />
          <BacteriaCluster className="nitrogenBacteriaCluster--rhizobium" />
          <OverlayLabel className="nitrogenOverlayLabel--rhizobium">
            bakteria pengikat nitrogen
          </OverlayLabel>
          <FlowArrow
            className="nitrogenFlowArrow--fixationToNitrate"
            d="M 22 66 L 27 70"
          />
          <OverlayLabel className="nitrogenOverlayLabel--ammoniumRoot">
            ion nitrat (NO3-)
          </OverlayLabel>
        </>
      )}

      {processId === "lightning" && (
        <>
          <OverlayLabel className="nitrogenOverlayLabel--lightningN2">
            gas nitrogen (N2)
          </OverlayLabel>
          <img
            className="nitrogenLightningImage nitrogenLightningImage--one"
            src={NITROGEN_ASSETS.lightning}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
          />
          <img
            className="nitrogenLightningImage nitrogenLightningImage--two"
            src={NITROGEN_ASSETS.lightning}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
          />
          <img
            className="nitrogenLightningImage nitrogenLightningImage--three"
            src={NITROGEN_ASSETS.lightning}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
          />
          <FlowArrow
            className="nitrogenFlowArrow--lightningToSoil"
            d="M 42 36 L 42 67"
          />
          <OverlayLabel className="nitrogenOverlayLabel--lightningNitrate">
            ion nitrat (NO3-)
          </OverlayLabel>
        </>
      )}

      {processId === "decomposition" && (
        <>
          <span className="nitrogenLeaf nitrogenLeaf--one" />
          <span className="nitrogenLeaf nitrogenLeaf--two" />
          <BacteriaCluster className="nitrogenBacteriaCluster--decomposer" />
          <FlowArrow
            className="nitrogenFlowArrow--decompositionSoil"
            d="M 70 66 L 70 78"
          />
          <OverlayLabel className="nitrogenOverlayLabel--decompositionAmmonium">
            sebatian ammonium
          </OverlayLabel>
        </>
      )}

      {processId === "nitrification" && (
        <>
          <OverlayLabel className="nitrogenOverlayLabel--nitrificationAmmonium">
            sebatian ammonium
          </OverlayLabel>
          <BacteriaCluster className="nitrogenBacteriaCluster--nitrosomonas" />
          <OverlayLabel className="nitrogenOverlayLabel--nitrosomonas">
            bakteria penitritan
          </OverlayLabel>
          <FlowArrow
            className="nitrogenFlowArrow--nitrificationStepOne"
            d="M 41.5 80 L 45 80"
          />
          <OverlayLabel className="nitrogenOverlayLabel--nitrite">
            ion nitrit (NO2-)
          </OverlayLabel>
          <BacteriaCluster className="nitrogenBacteriaCluster--nitrobacter" />
          <OverlayLabel className="nitrogenOverlayLabel--nitrobacter">
            bakteria penitritan
          </OverlayLabel>
          <FlowArrow
            className="nitrogenFlowArrow--nitrificationStepTwo"
            d="M 62 80 L 65.5 80"
          />
          <OverlayLabel className="nitrogenOverlayLabel--nitrate">
            ion nitrat (NO3-)
          </OverlayLabel>
        </>
      )}

      {processId === "absorption" && (
        <>
          <span className="nitrogenPlantGlow nitrogenPlantGlow--legume" />
          <span className="nitrogenPlantGlow nitrogenPlantGlow--crop" />
          <OverlayLabel className="nitrogenOverlayLabel--rootNitrateA">
            ion nitrat (NO3-)
          </OverlayLabel>
          <OverlayLabel className="nitrogenOverlayLabel--rootNitrateB">
            ion nitrat (NO3-)
          </OverlayLabel>
          <FlowArrow
            className="nitrogenFlowArrow--ionPathLeft"
            d="M 16 72 L 26 50"
          />
          <FlowArrow
            className="nitrogenFlowArrow--ionPathRight"
            d="M 50 73 L 36 51"
          />
        </>
      )}

      {processId === "feeding" && (
        <>
          <span className="nitrogenMouthCue" />
          <FlowArrow
            className="nitrogenFlowArrow--feedingTransfer"
            d="M 35 44 L 53 41"
          />
          <span className="nitrogenTransferParticle nitrogenTransferParticle--one" />
          <span className="nitrogenTransferParticle nitrogenTransferParticle--two" />
          <span className="nitrogenTransferParticle nitrogenTransferParticle--three" />
        </>
      )}

      {processId === "denitrification" && (
        <>
          <OverlayLabel className="nitrogenOverlayLabel--denitrificationNitrate">
            ion nitrat (NO3-)
          </OverlayLabel>
          <BacteriaCluster className="nitrogenBacteriaCluster--denitrification" />
          <OverlayLabel className="nitrogenOverlayLabel--denitrifier">
            bakteria pendenitritan
          </OverlayLabel>
          <FlowArrow
            className="nitrogenFlowArrow--denitrificationUp"
            d="M 82 70 L 82 36"
          />
          <OverlayLabel className="nitrogenOverlayLabel--denitrificationN2A">
            gas nitrogen (N2)
          </OverlayLabel>
        </>
      )}
    </div>
  );
}

export function ProcessPanel({
  activeProcessId,
  completedProcessIds,
  onReplayProcess,
  mobileOpen,
  onCloseMobile,
}: {
  activeProcessId: NitrogenProcessId | null;
  completedProcessIds: NitrogenProcessId[];
  onReplayProcess: (processId: NitrogenProcessId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <aside
      id="nitrogen-process-panel"
      className={`nitrogenPanel nitrogenProcessPanel${
        mobileOpen ? " is-mobile-open" : ""
      }`}
    >
      <div className="nitrogenPanelHeader">
        <span>Panel proses</span>
        <strong>{completedProcessIds.length}/{NITROGEN_PROCESSES.length}</strong>
        <button
          type="button"
          className="nitrogenProcessPanel__close"
          onClick={onCloseMobile}
        >
          Tutup
        </button>
      </div>
      <div className="nitrogenProcessList">
        {NITROGEN_PROCESSES.map((process, index) => {
          const completed = completedProcessIds.includes(process.id);
          const active = activeProcessId === process.id;
          const previousCompleted =
            index === 0 || completedProcessIds.includes(NITROGEN_PROCESSES[index - 1].id);
          const unlocked = completed || active || previousCompleted;
          const status = !unlocked
            ? "dikunci"
            : !completed && !active
              ? "langkah seterusnya"
              : getStatusLabel(process.id, activeProcessId, completedProcessIds);

          return (
            <button
              key={process.id}
              type="button"
              className={`nitrogenProcessItem${
                active ? " is-active" : ""
              }${completed ? " is-completed" : ""}${!unlocked ? " is-locked" : ""}`}
              disabled={!unlocked}
              onClick={() => onReplayProcess(process.id)}
            >
              <span className="nitrogenProcessItem__number">
                {completed ? "✓" : index + 1}
              </span>
              <span>
                <b>{process.shortTitle}</b>
                <small>{status}</small>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ExplanationPanel({ process }: { process: NitrogenProcess | null }) {
  return (
    <aside className="nitrogenPanel nitrogenExplanationPanel">
      <div className="nitrogenPanelHeader">
        <span>Panel penerangan</span>
      </div>
      {process ? (
        <>
          <h2>{process.panelTitle}</h2>
          <p>{process.description}</p>
          <section className="nitrogenLearningCard" aria-labelledby="nitrogen-learning-title">
            <span>Apa yang saya pelajari?</span>
            <h3 id="nitrogen-learning-title">{process.shortTitle}</h3>
            <dl>
              <div>
                <dt>Sebelum</dt>
                <dd>{process.before}</dd>
              </div>
              <div>
                <dt>Selepas</dt>
                <dd>{process.after}</dd>
              </div>
              <div>
                <dt>Kepentingan</dt>
                <dd>{process.importance}</dd>
              </div>
            </dl>
          </section>
        </>
      ) : (
        <div className="nitrogenEmptyState">
          <strong>Belum ada proses aktif.</strong>
          <p>Pilih hotspot pada scene ekosistem untuk melihat animasi proses.</p>
        </div>
      )}
    </aside>
  );
}

function ExploreScene({
  activeProcessId,
  completedProcessIds,
  animationKey,
  onSelectProcess,
}: {
  activeProcessId: NitrogenProcessId | null;
  completedProcessIds: NitrogenProcessId[];
  animationKey: number;
  onSelectProcess: (processId: NitrogenProcessId) => void;
}) {
  return (
    <div className="nitrogenSceneFrame">
      <div className={`nitrogenScene${activeProcessId ? " has-active-process" : ""}`}>
        <img
          src={NITROGEN_BACKGROUND}
          alt="Scene ekosistem kitar nitrogen dengan pokok kekacang, tanaman, lembu, pokok besar, sungai dan tanah."
          loading="eager"
          decoding="async"
        />
        <ProcessOverlay processId={activeProcessId} animationKey={animationKey} />
        {NITROGEN_PROCESSES.map((process, index) => {
          const completed = completedProcessIds.includes(process.id);
          const active = activeProcessId === process.id;
          const previousCompleted =
            index === 0 || completedProcessIds.includes(NITROGEN_PROCESSES[index - 1].id);
          const unlocked = completed || active || previousCompleted;

          return (
            <button
              key={process.id}
              type="button"
              className={`nitrogenHotspot${active ? " is-active" : ""}${
                completed ? " is-completed" : ""
              }${!unlocked ? " is-locked" : ""}`}
              style={areaStyle(process.hotspot)}
              aria-label={`Langkah ${index + 1}: ${process.hotspotLabel}: ${process.title}${
                unlocked ? "" : " dikunci"
              }`}
              disabled={!unlocked}
              onClick={() => onSelectProcess(process.id)}
            >
              <span className="nitrogenHotspot__pin" aria-hidden="true">
                {completed ? "✓" : index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExploreProgress({
  activeProcessId,
  completedProcessIds,
  onReplayProcess,
}: {
  activeProcessId: NitrogenProcessId | null;
  completedProcessIds: NitrogenProcessId[];
  onReplayProcess: (processId: NitrogenProcessId) => void;
}) {
  const progress = Math.round(
    (completedProcessIds.length / NITROGEN_PROCESSES.length) * 100,
  );

  return (
    <section className="nitrogenBottomProgress" aria-label="Kemajuan proses kitar nitrogen">
      <div className="nitrogenBottomProgress__bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="nitrogenBottomProgress__steps">
        {NITROGEN_PROCESSES.map((process, index) => {
          const completed = completedProcessIds.includes(process.id);
          const active = activeProcessId === process.id;
          const previousCompleted =
            index === 0 || completedProcessIds.includes(NITROGEN_PROCESSES[index - 1].id);
          const unlocked = completed || active || previousCompleted;

          return (
            <button
              key={process.id}
              type="button"
              className={`${active ? "is-active" : ""}${completed ? " is-completed" : ""}${
                !unlocked ? " is-locked" : ""
              }`}
              disabled={!unlocked}
              onClick={() => onReplayProcess(process.id)}
            >
              <span>{index + 1}</span>
              <small>{process.shortTitle}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChallengeRecovery({
  challenge,
  visible,
}: {
  challenge: NitrogenChallenge;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={`nitrogenChallengeRecovery nitrogenChallengeRecovery--${challenge.recovery}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

function ChallengeScene({
  challenge,
  foundClueIds,
  solved,
  onCollectClue,
}: {
  challenge: NitrogenChallenge;
  foundClueIds: string[];
  solved: boolean;
  onCollectClue: (clueId: string) => void;
}) {
  return (
    <div className="nitrogenSceneFrame nitrogenSceneFrame--challenge">
      <div className="nitrogenScene">
        <img
          src={NITROGEN_BACKGROUND}
          alt="Scene ekosistem untuk siasatan cabaran kitar nitrogen."
          loading="eager"
          decoding="async"
        />
        <ChallengeRecovery challenge={challenge} visible={solved} />
        {challenge.clueHotspots.map((clue) => {
          const found = foundClueIds.includes(clue.id);

          return (
            <button
              key={clue.id}
              type="button"
              className={`nitrogenHotspot nitrogenHotspot--challenge${
                found ? " is-completed" : ""
              }`}
              style={areaStyle(clue.hotspot)}
              aria-label={`Kumpul petunjuk: ${clue.label}`}
              onClick={() => onCollectClue(clue.id)}
            >
              <span className="nitrogenHotspot__pin" aria-hidden="true">
                {found ? "✓" : "+"}
              </span>
              {found && <span className="nitrogenHotspot__caption">{clue.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChallengeOptions({
  challenge,
  canAnswer,
  selectedCauseId,
  selectedActionId,
  onSelectCause,
  onSelectAction,
}: {
  challenge: NitrogenChallenge;
  canAnswer: boolean;
  selectedCauseId: string;
  selectedActionId: string;
  onSelectCause: (id: string) => void;
  onSelectAction: (id: string) => void;
}) {
  return (
    <div className="nitrogenChallengeOptions">
      <fieldset disabled={!canAnswer}>
        <legend>Punca masalah</legend>
        {challenge.causeOptions.map((option) => (
          <label key={option.id} className={selectedCauseId === option.id ? "is-selected" : ""}>
            <input
              type="radio"
              name={`cause-${challenge.id}`}
              checked={selectedCauseId === option.id}
              onChange={() => onSelectCause(option.id)}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>
      <fieldset disabled={!canAnswer}>
        <legend>Tindakan sesuai</legend>
        {challenge.actionOptions.map((option) => (
          <label key={option.id} className={selectedActionId === option.id ? "is-selected" : ""}>
            <input
              type="radio"
              name={`action-${challenge.id}`}
              checked={selectedActionId === option.id}
              onChange={() => onSelectAction(option.id)}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function ChallengeProgress({
  score,
  challengeIndex,
  solvedChallengeIds,
  onJumpToChallenge,
}: {
  score: number;
  challengeIndex: number;
  solvedChallengeIds: string[];
  onJumpToChallenge: (index: number) => void;
}) {
  return (
    <section className="nitrogenChallengeFooter" aria-label="Markah dan progress challenge">
      <div className="nitrogenChallengeScore">
        <span>Markah</span>
        <strong>{score}</strong>
      </div>
      <div className="nitrogenChallengeDots">
        {NITROGEN_CHALLENGES.map((challenge, index) => {
          const solved = solvedChallengeIds.includes(challenge.id);
          const isCurrent = challengeIndex === index;
          const canOpen = solved || isCurrent;

          return (
            <button
              key={challenge.id}
              type="button"
              className={`${isCurrent ? "is-active" : ""}${solved ? " is-completed" : ""}`}
              disabled={!canOpen}
              onClick={() => onJumpToChallenge(index)}
              aria-label={`Cabaran ${index + 1}${solved ? " selesai" : ""}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function NitrogenCycleSimulatorPage({
  reviewPanel,
}: {
  reviewPanel?: ReactNode;
}) {
  const [mode, setMode] = useState<SimulatorMode>("explore");
  const [activeProcessId, setActiveProcessId] = useState<NitrogenProcessId | null>(null);
  const [completedProcessIds, setCompletedProcessIds] = useState<NitrogenProcessId[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [foundCluesByChallenge, setFoundCluesByChallenge] = useState<Record<string, string[]>>({});
  const [selectedCauseId, setSelectedCauseId] = useState("");
  const [selectedActionId, setSelectedActionId] = useState("");
  const [challengeFeedback, setChallengeFeedback] = useState<ChallengeFeedback>(null);
  const [challengeScore, setChallengeScore] = useState(0);
  const [solvedChallengeIds, setSolvedChallengeIds] = useState<string[]>([]);

  const activeProcess = useMemo(
    () =>
      NITROGEN_PROCESSES.find((process) => process.id === activeProcessId) ?? null,
    [activeProcessId],
  );
  const exploreComplete = completedProcessIds.length === NITROGEN_PROCESSES.length;
  const currentChallenge = NITROGEN_CHALLENGES[challengeIndex];
  const foundClueIds = currentChallenge
    ? foundCluesByChallenge[currentChallenge.id] ?? []
    : [];
  const currentChallengeSolved = currentChallenge
    ? solvedChallengeIds.includes(currentChallenge.id)
    : false;
  const canAnswerChallenge = foundClueIds.length >= 2;
  const challengeComplete = solvedChallengeIds.length === NITROGEN_CHALLENGES.length;
  const preloadAssetUrls = useMemo(
    () => uniqueAssetUrls(PRELOAD_ASSET_KEYS),
    [],
  );
  const lazyAssetUrls = useMemo(
    () =>
      uniqueAssetUrls(
        mode === "challenge"
          ? getChallengeAssetKeys(currentChallenge)
          : getProcessAssetKeys(activeProcessId),
      ),
    [activeProcessId, currentChallenge, mode],
  );

  useImagePreloads(preloadAssetUrls);

  useEffect(() => {
    if (!activeProcessId) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCompletedProcessIds((current) =>
        current.includes(activeProcessId) ? current : [...current, activeProcessId],
      );
    }, 3800);

    return () => window.clearTimeout(timer);
  }, [activeProcessId, animationKey]);

  const selectProcess = (processId: NitrogenProcessId) => {
    setActiveProcessId(processId);
    setAnimationKey((current) => current + 1);
  };

  const clearChallengeAnswer = () => {
    setSelectedCauseId("");
    setSelectedActionId("");
    setChallengeFeedback(null);
  };

  const resetExplore = () => {
    setActiveProcessId(null);
    setCompletedProcessIds([]);
    setAnimationKey(0);
    setMode("explore");
  };

  const resetChallenge = () => {
    setChallengeIndex(0);
    setFoundCluesByChallenge({});
    setSelectedCauseId("");
    setSelectedActionId("");
    setChallengeFeedback(null);
    setChallengeScore(0);
    setSolvedChallengeIds([]);
  };

  const resetCurrentMode = () => {
    if (mode === "challenge") {
      resetChallenge();
      return;
    }

    resetExplore();
  };

  const openChallengeMode = () => {
    if (!exploreComplete) {
      return;
    }

    setMode("challenge");
  };

  const collectClue = (clueId: string) => {
    if (!currentChallenge) {
      return;
    }

    setFoundCluesByChallenge((current) => {
      const existing = current[currentChallenge.id] ?? [];

      if (existing.includes(clueId)) {
        return current;
      }

      return {
        ...current,
        [currentChallenge.id]: [...existing, clueId],
      };
    });

    if (challengeFeedback?.type !== "success") {
      setChallengeFeedback(null);
    }
  };

  const submitChallenge = () => {
    if (!currentChallenge || currentChallengeSolved) {
      return;
    }

    if (!canAnswerChallenge) {
      setChallengeFeedback({
        type: "warning",
        message: "Kumpul sekurang-kurangnya dua petunjuk dahulu.",
      });
      return;
    }

    if (!selectedCauseId || !selectedActionId) {
      setChallengeFeedback({
        type: "warning",
        message: "Pilih punca masalah dan tindakan sesuai.",
      });
      return;
    }

    const causeCorrect =
      currentChallenge.causeOptions.find((option) => option.id === selectedCauseId)
        ?.correct ?? false;
    const actionCorrect =
      currentChallenge.actionOptions.find((option) => option.id === selectedActionId)
        ?.correct ?? false;

    if (!causeCorrect || !actionCorrect) {
      setChallengeFeedback({
        type: "error",
        message: "Jawapan belum tepat. Semak petunjuk dan siasat lagi.",
      });
      return;
    }

    setSolvedChallengeIds((current) =>
      current.includes(currentChallenge.id) ? current : [...current, currentChallenge.id],
    );
    setChallengeScore((current) => current + 20);
    setChallengeFeedback({
      type: "success",
      message: `${currentChallenge.result} ${currentChallenge.concept}`,
    });
  };

  const goToNextChallenge = () => {
    if (challengeIndex < NITROGEN_CHALLENGES.length - 1) {
      clearChallengeAnswer();
      setChallengeIndex((current) => current + 1);
    }
  };

  const jumpToChallenge = (index: number) => {
    const targetChallenge = NITROGEN_CHALLENGES[index];

    if (!targetChallenge) {
      return;
    }

    if (index === challengeIndex || solvedChallengeIds.includes(targetChallenge.id)) {
      clearChallengeAnswer();
      setChallengeIndex(index);
    }
  };

  return (
    <main className="nitrogenSimulator">
      <LazyOverlayAssets urls={lazyAssetUrls} />
      <header className="nitrogenHeader">
        <div className="nitrogenHeader__title">
          <span>Sains Tingkatan 5 · Bab 2.3</span>
          <h1>KITAR NITROGEN</h1>
          <p>Teroka perjalanan nitrogen dalam ekosistem</p>
        </div>

        <div className="nitrogenModeSwitch" role="tablist" aria-label="Mod simulator">
          <button
            type="button"
            className={mode === "explore" ? "is-active" : ""}
            aria-selected={mode === "explore"}
            role="tab"
            onClick={() => setMode("explore")}
          >
            Explore
          </button>
          <button
            type="button"
            className={mode === "challenge" ? "is-active" : ""}
            aria-selected={mode === "challenge"}
            role="tab"
            disabled={!exploreComplete}
            onClick={openChallengeMode}
          >
            Challenge
          </button>
        </div>

        <div className="nitrogenHeader__actions">
          <button type="button" onClick={resetCurrentMode}>
            Reset
          </button>
          <button
            type="button"
            className={guideOpen ? "is-active" : ""}
            onClick={() => setGuideOpen((current) => !current)}
          >
            Panduan
          </button>
        </div>
      </header>

      {guideOpen && (
        <section className="nitrogenGuidePanel" aria-label="Panduan simulator">
          <strong>Explore dahulu, kemudian Challenge.</strong>
          <p>
            Klik hotspot pada scene untuk melihat proses kitar nitrogen. Challenge
            dibuka selepas semua proses selesai diteroka.
          </p>
        </section>
      )}

      {mode === "explore" && (
        <>
          <section className="nitrogenExploreLayout">
            <section className="nitrogenSceneColumn" aria-label="Main simulation area">
              <ExploreScene
                activeProcessId={activeProcessId}
                completedProcessIds={completedProcessIds}
                animationKey={animationKey}
                onSelectProcess={selectProcess}
              />
              <ExploreProgress
                activeProcessId={activeProcessId}
                completedProcessIds={completedProcessIds}
                onReplayProcess={selectProcess}
              />
              {exploreComplete && (
                <div className="nitrogenUnlockNotice" role="status">
                  <strong>Explore Mode selesai.</strong>
                  <button type="button" onClick={openChallengeMode}>
                    Buka Challenge Mode
                  </button>
                </div>
              )}
            </section>

            <ExplanationPanel process={activeProcess} />
          </section>
        </>
      )}

      {mode === "challenge" && currentChallenge && (
        <section className="nitrogenChallengeLayout">
          <aside className="nitrogenPanel nitrogenReportPanel">
            <div className="nitrogenPanelHeader">
              <span>Challenge Mode</span>
              <strong>
                {challengeIndex + 1}/{NITROGEN_CHALLENGES.length}
              </strong>
            </div>
            <h2>Siasat masalah ekosistem</h2>
            <div className="nitrogenFarmReport">
              <span>Laporan Ladang</span>
              <p>{currentChallenge.report}</p>
            </div>
            <p className="nitrogenChallengeHint">
              Petunjuk diperlukan: {Math.min(foundClueIds.length, 2)}/2
            </p>
          </aside>

          <section className="nitrogenSceneColumn" aria-label="Scene cabaran">
            <ChallengeScene
              challenge={currentChallenge}
              foundClueIds={foundClueIds}
              solved={currentChallengeSolved}
              onCollectClue={collectClue}
            />
            <ChallengeProgress
              score={challengeScore}
              challengeIndex={challengeIndex}
              solvedChallengeIds={solvedChallengeIds}
              onJumpToChallenge={jumpToChallenge}
            />
          </section>

          <aside className="nitrogenPanel nitrogenChallengePanel">
            <div className="nitrogenPanelHeader">
              <span>Petunjuk dijumpai</span>
              <strong>{foundClueIds.length}</strong>
            </div>
            <ul className="nitrogenClueList" aria-live="polite">
              {currentChallenge.clueHotspots.map((clue) => {
                const found = foundClueIds.includes(clue.id);

                return (
                  <li key={clue.id} className={found ? "is-found" : ""}>
                    <span>{found ? "✓" : ""}</span>
                    <p>{found ? clue.clue : "Belum disiasat"}</p>
                  </li>
                );
              })}
            </ul>

            <ChallengeOptions
              challenge={currentChallenge}
              canAnswer={canAnswerChallenge && !currentChallengeSolved}
              selectedCauseId={selectedCauseId}
              selectedActionId={selectedActionId}
              onSelectCause={setSelectedCauseId}
              onSelectAction={setSelectedActionId}
            />

            {challengeFeedback && (
              <div className={`nitrogenFeedback nitrogenFeedback--${challengeFeedback.type}`} role="status">
                {challengeFeedback.message}
              </div>
            )}

            <div className="nitrogenChallengeActions">
              <button
                type="button"
                className="nitrogenPrimaryButton"
                disabled={currentChallengeSolved}
                onClick={submitChallenge}
              >
                Semak Jawapan
              </button>
              <button
                type="button"
                disabled={!currentChallengeSolved || challengeIndex === NITROGEN_CHALLENGES.length - 1}
                onClick={goToNextChallenge}
              >
                Cabaran Seterusnya
              </button>
            </div>

            {challengeComplete && (
              <div className="nitrogenChallengeComplete" role="status">
                <strong>Semua cabaran selesai.</strong>
                <p>Skor akhir: {challengeScore}/100</p>
                <button type="button" onClick={resetChallenge}>
                  Reset Challenge
                </button>
              </div>
            )}
          </aside>
        </section>
      )}

      {reviewPanel}
    </main>
  );
}
