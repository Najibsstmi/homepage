import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  getRefractionGeometry,
  REFRACTION_POINT,
  REFRACTIVE_INDEX,
  type RaySide,
  type RefractionMedium,
} from "../utils/refractionPhysics";
import "./LightRefractionSimulatorPage.css";

const VIEWBOX = { width: 1000, height: 620 } as const;
const MIN_ANGLE = 8;
const MAX_ANGLE = 68;
const DEFAULT_ANGLE = 38;
const FLASHLIGHT = {
  width: 270,
  height: 135,
  lensAnchorX: 0.93,
  lensAnchorY: 0.55,
} as const;

const MEDIUMS = {
  water: {
    label: "Air",
    transitionLabel: "Udara → Air",
    icon: "💧",
    index: REFRACTIVE_INDEX.water,
    asset: "/PEMBIASAN%20CAHAYA/air.webp",
    assetBox: { x: 120, y: 167, width: 760, height: 507 },
  },
  glass: {
    label: "Kaca",
    transitionLabel: "Udara → Kaca",
    icon: "◇",
    index: REFRACTIVE_INDEX.glass,
    asset: "/PEMBIASAN%20CAHAYA/glass-block.webp",
    assetBox: { x: 120, y: 232, width: 760, height: 507 },
  },
} as const;

const HINTS = [
  "Seret lampu suluh untuk mengubah arah cahaya.",
  "Cuba sudut yang lebih besar dan perhatikan sinar di dalam medium.",
  "Bandingkan air dengan kaca pada sudut tuju yang sama.",
];

type LightRefractionSimulatorPageProps = {
  reviewPanel?: ReactNode;
};

type ToggleProps = {
  checked: boolean;
  label: string;
  note: string;
  onChange: () => void;
};

function Toggle({ checked, label, note, onChange }: ToggleProps) {
  return (
    <button
      className="refract-toggle"
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
      <span className="refract-switch" aria-hidden="true" />
    </button>
  );
}

function polarPoint(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: REFRACTION_POINT.x + Math.cos(radians) * radius,
    y: REFRACTION_POINT.y + Math.sin(radians) * radius,
  };
}

function arcPath(radius: number, startAngle: number, endAngle: number) {
  const start = polarPoint(radius, startAngle);
  const end = polarPoint(radius, endAngle);
  const sweep = endAngle > startAngle ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

export default function LightRefractionSimulatorPage({
  reviewPanel,
}: LightRefractionSimulatorPageProps) {
  const [medium, setMedium] = useState<RefractionMedium>("water");
  const [incidenceAngle, setIncidenceAngle] = useState(DEFAULT_ANGLE);
  const [sourceSide, setSourceSide] = useState<RaySide>(-1);
  const [showNormal, setShowNormal] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [showReflection, setShowReflection] = useState(false);
  const [showDragHint, setShowDragHint] = useState(true);
  const [hintIndex, setHintIndex] = useState(0);
  const [feedback, setFeedback] = useState(
    "Cahaya membengkok mendekati garis normal.",
  );
  const sceneSvgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);

  const mediumConfig = MEDIUMS[medium];
  const geometry = useMemo(
    () =>
      getRefractionGeometry({
        incidenceAngle,
        destinationIndex: mediumConfig.index,
        side: sourceSide,
      }),
    [incidenceAngle, mediumConfig.index, sourceSide],
  );

  const roundedIncidence = Math.round(incidenceAngle);
  const roundedRefraction = Math.round(geometry.refractedAngle);
  const incidentArcEnd = -90 + sourceSide * incidenceAngle;
  const refractedArcEnd = 90 + sourceSide * geometry.refractedAngle;
  const incidenceLabelPoint = polarPoint(
    83,
    (-90 + incidentArcEnd) / 2,
  );
  const refractionLabelPoint = polarPoint(
    78,
    (90 + refractedArcEnd) / 2,
  );
  const flashlightX =
    geometry.lens.x - FLASHLIGHT.width * FLASHLIGHT.lensAnchorX;
  const flashlightY =
    geometry.lens.y - FLASHLIGHT.height * FLASHLIGHT.lensAnchorY;

  useEffect(() => {
    const descriptionMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const canonicalLink = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    const previousTitle = document.title;
    const previousDescription = descriptionMeta?.content;
    const previousCanonical = canonicalLink?.href;

    document.title = "Pembiasan Cahaya | EduSim";
    descriptionMeta?.setAttribute(
      "content",
      "Teroka bagaimana cahaya berubah arah apabila bergerak dari udara ke air atau kaca.",
    );
    canonicalLink?.setAttribute(
      "href",
      "https://www.cikgustem.com/simulator/pembiasan-cahaya",
    );

    return () => {
      document.title = previousTitle;
      if (previousDescription !== undefined) {
        descriptionMeta?.setAttribute("content", previousDescription);
      }
      if (previousCanonical !== undefined) {
        canonicalLink?.setAttribute("href", previousCanonical);
      }
    };
  }, []);

  const applyPointerPosition = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = sceneSvgRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      const sceneX = ((clientX - bounds.left) / bounds.width) * VIEWBOX.width;
      const sceneY = ((clientY - bounds.top) / bounds.height) * VIEWBOX.height;
      const nextSide: RaySide = sceneX < REFRACTION_POINT.x ? -1 : 1;
      const horizontalDistance = Math.abs(sceneX - REFRACTION_POINT.x);
      const verticalDistance = Math.max(30, REFRACTION_POINT.y - sceneY);
      const nextAngle =
        (Math.atan2(horizontalDistance, verticalDistance) * 180) / Math.PI;

      setSourceSide(nextSide);
      setIncidenceAngle(Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, nextAngle)));
      setShowDragHint(false);
      setFeedback("Sudut berubah — sinar biasan dikira semula serta-merta.");
    },
    [],
  );

  const handlePointerDown = (event: ReactPointerEvent<SVGGElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    applyPointerPosition(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    if (draggingRef.current) {
      applyPointerPosition(event.clientX, event.clientY);
    }
  };

  const endPointerDrag = (event: ReactPointerEvent<SVGGElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const nudgeAngle = (amount: number) => {
    setIncidenceAngle((current) =>
      Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, current + amount)),
    );
    setShowDragHint(false);
  };

  const handleFlashlightKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      nudgeAngle(-2);
    } else if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      nudgeAngle(2);
    } else if (event.key === "Home") {
      event.preventDefault();
      setIncidenceAngle(MIN_ANGLE);
    } else if (event.key === "End") {
      event.preventDefault();
      setIncidenceAngle(MAX_ANGLE);
    }
  };

  const chooseMedium = (nextMedium: RefractionMedium) => {
    setMedium(nextMedium);
    setFeedback(
      nextMedium === "glass"
        ? "Kaca membiaskan cahaya lebih kuat daripada air pada sudut tuju yang sama."
        : "Perhatikan sinar apabila cahaya memasuki air.",
    );
  };

  const reset = () => {
    setMedium("water");
    setIncidenceAngle(DEFAULT_ANGLE);
    setSourceSide(-1);
    setShowNormal(true);
    setShowAngles(true);
    setShowReflection(false);
    setShowDragHint(true);
    setHintIndex(0);
    setFeedback("Cahaya membengkok mendekati garis normal.");
  };

  const showNextHint = () => {
    const nextHint = (hintIndex + 1) % HINTS.length;
    setHintIndex(nextHint);
    setFeedback(HINTS[nextHint]);
  };

  return (
    <main className="refract-page">
      <header className="refract-header">
        <div>
          <a className="refract-backLink" href="/simulator">
            ← Semua simulator
          </a>
          <span className="refract-eyebrow">
            EduSim · Sains Tingkatan 1 · Kurikulum 2027
          </span>
          <h1>Pembiasan Cahaya</h1>
          <p>Seret lampu suluh dan lihat cahaya berubah arah.</p>
        </div>
        <div className="refract-header__badge">UBAH · LIHAT · FAHAM</div>
      </header>

      <section className="refract-workbench" aria-label="Simulator pembiasan cahaya">
        <section className="refract-sceneCard">
          <div className="refract-sceneCard__topline">
            <div>
              <span>Teroka secara langsung</span>
              <strong>{mediumConfig.transitionLabel}</strong>
            </div>
            <div className="refract-anglePills" aria-live="polite">
              <span>i = {roundedIncidence}°</span>
              <span>r = {roundedRefraction}°</span>
            </div>
          </div>

          <div className="refract-scene">
            <img
              className="refract-background"
              src="/PEMBIASAN%20CAHAYA/background.webp"
              alt=""
              draggable="false"
            />

            <svg
              className="refract-mediumLayer"
              viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {(Object.keys(MEDIUMS) as RefractionMedium[]).map((mediumId) => {
                const config = MEDIUMS[mediumId];
                return (
                  <image
                    key={mediumId}
                    className={medium === mediumId ? "is-active" : ""}
                    href={config.asset}
                    x={config.assetBox.x}
                    y={config.assetBox.y}
                    width={config.assetBox.width}
                    height={config.assetBox.height}
                    preserveAspectRatio="xMidYMid meet"
                  />
                );
              })}
            </svg>

            <svg
              className="refract-rayLayer"
              viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Sudut tuju ${roundedIncidence} darjah. Sudut biasan dalam ${mediumConfig.label.toLocaleLowerCase("ms-MY")} ${roundedRefraction} darjah.`}
            >
              <defs>
                <filter id="refract-ray-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <marker
                  id="refract-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>

              <line
                className="refract-boundary"
                x1="105"
                y1={REFRACTION_POINT.y}
                x2="895"
                y2={REFRACTION_POINT.y}
              />
              {showNormal && (
                <line
                  className="refract-normal"
                  x1={REFRACTION_POINT.x}
                  y1="54"
                  x2={REFRACTION_POINT.x}
                  y2="594"
                />
              )}
              <line
                className="refract-ray refract-ray--incident"
                x1={geometry.lens.x}
                y1={geometry.lens.y}
                x2={REFRACTION_POINT.x}
                y2={REFRACTION_POINT.y}
                markerEnd="url(#refract-arrow)"
              />
              <line
                className="refract-ray refract-ray--refracted"
                x1={REFRACTION_POINT.x}
                y1={REFRACTION_POINT.y}
                x2={geometry.refractedEnd.x}
                y2={geometry.refractedEnd.y}
                markerEnd="url(#refract-arrow)"
              />
              {showReflection && (
                <line
                  className="refract-ray refract-ray--reflected"
                  x1={REFRACTION_POINT.x}
                  y1={REFRACTION_POINT.y}
                  x2={geometry.reflectedEnd.x}
                  y2={geometry.reflectedEnd.y}
                  markerEnd="url(#refract-arrow)"
                />
              )}
              <circle
                className="refract-incidencePoint"
                cx={REFRACTION_POINT.x}
                cy={REFRACTION_POINT.y}
                r="5"
              />

              {showAngles && (
                <g className="refract-angleMarks">
                  <path d={arcPath(58, -90, incidentArcEnd)} />
                  <path d={arcPath(54, 90, refractedArcEnd)} />
                  <text x={incidenceLabelPoint.x} y={incidenceLabelPoint.y}>
                    i = {roundedIncidence}°
                  </text>
                  <text x={refractionLabelPoint.x} y={refractionLabelPoint.y}>
                    r = {roundedRefraction}°
                  </text>
                </g>
              )}

            </svg>

            <svg
              ref={sceneSvgRef}
              className="refract-flashlightLayer"
              viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
              preserveAspectRatio="none"
              aria-hidden="false"
            >
              <g
                className="refract-flashlight"
                role="slider"
                tabIndex={0}
                aria-label="Sudut lampu suluh"
                aria-valuemin={MIN_ANGLE}
                aria-valuemax={MAX_ANGLE}
                aria-valuenow={roundedIncidence}
                aria-valuetext={`${roundedIncidence} darjah dari garis normal`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endPointerDrag}
                onPointerCancel={endPointerDrag}
                onKeyDown={handleFlashlightKeyDown}
                transform={`rotate(${geometry.flashlightRotation} ${geometry.lens.x} ${geometry.lens.y})`}
              >
                <image
                  href="/PEMBIASAN%20CAHAYA/flashlight.webp"
                  x={flashlightX}
                  y={flashlightY}
                  width={FLASHLIGHT.width}
                  height={FLASHLIGHT.height}
                  preserveAspectRatio="none"
                />
                <rect
                  className="refract-flashlight__hitArea"
                  x={flashlightX + 10}
                  y={flashlightY + 8}
                  width={FLASHLIGHT.width - 16}
                  height={FLASHLIGHT.height - 16}
                  rx="42"
                />
                <circle
                  className="refract-lensAnchor"
                  cx={geometry.lens.x}
                  cy={geometry.lens.y}
                  r="5"
                />
              </g>
            </svg>

            <div className="refract-mediumBadge refract-mediumBadge--air">
              <strong>Udara</strong>
              <span>Indeks biasan (n) ≈ 1.00</span>
            </div>
            <div className="refract-mediumBadge refract-mediumBadge--target">
              <strong>{mediumConfig.label}</strong>
              <span>Indeks biasan (n) ≈ {mediumConfig.index.toFixed(2)}</span>
            </div>

            {showDragHint && (
              <div className="refract-dragHint">
                <span aria-hidden="true">↔</span>
                Seret lampu suluh
              </div>
            )}
            <div className="refract-sceneFeedback" aria-live="polite">
              {feedback}
            </div>
          </div>

          <div className="refract-sceneActions" aria-label="Kawalan sudut alternatif">
            <button
              type="button"
              aria-label="Kurangkan sudut tuju"
              onClick={() => nudgeAngle(-3)}
            >
              − Sudut
            </button>
            <button
              type="button"
              aria-label="Tambah sudut tuju"
              onClick={() => nudgeAngle(3)}
            >
              + Sudut
            </button>
            <span>Alternatif papan kekunci: gunakan kekunci anak panah pada lampu.</span>
          </div>
        </section>

        <aside className="refract-controls" aria-label="Kawalan pembiasan cahaya">
          <div className="refract-panelHeading">
            <span>Pilih medium</span>
            <strong>Cahaya memasuki...</strong>
          </div>

          <div className="refract-mediumChoices">
            {(Object.keys(MEDIUMS) as RefractionMedium[]).map((mediumId) => {
              const config = MEDIUMS[mediumId];
              return (
                <button
                  key={mediumId}
                  type="button"
                  aria-pressed={medium === mediumId}
                  onClick={() => chooseMedium(mediumId)}
                >
                  <span aria-hidden="true">{config.icon}</span>
                  <strong>{config.transitionLabel}</strong>
                </button>
              );
            })}
          </div>

          <div className="refract-angleSummary" aria-live="polite">
            <div>
              <span>Sudut tuju</span>
              <strong>i = {roundedIncidence}°</strong>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <span>Sudut biasan</span>
              <strong>r = {roundedRefraction}°</strong>
            </div>
          </div>

          <div className="refract-panelHeading refract-panelHeading--options">
            <span>Paparan</span>
            <strong>Lihat yang penting</strong>
          </div>
          <div className="refract-toggleList">
            <Toggle
              checked={showNormal}
              label="Garis normal"
              note="Tegak lurus pada permukaan"
              onChange={() => setShowNormal((current) => !current)}
            />
            <Toggle
              checked={showAngles}
              label="Sudut i dan r"
              note="Diukur dari garis normal"
              onChange={() => setShowAngles((current) => !current)}
            />
            <Toggle
              checked={showReflection}
              label="Sinar pantulan"
              note="Pilihan tambahan"
              onChange={() => setShowReflection((current) => !current)}
            />
          </div>

          <div className="refract-controlActions">
            <button type="button" className="refract-hintButton" onClick={showNextHint}>
              💡 Petunjuk
            </button>
            <button type="button" className="refract-resetButton" onClick={reset}>
              ↻ Set Semula
            </button>
          </div>

          <p className="refract-conceptNote">
            Sinar memasuki medium lebih tumpat secara optik lalu membengkok
            <strong> mendekati garis normal</strong>.
          </p>
        </aside>
      </section>

      {reviewPanel && <section className="refract-review">{reviewPanel}</section>}
    </main>
  );
}
