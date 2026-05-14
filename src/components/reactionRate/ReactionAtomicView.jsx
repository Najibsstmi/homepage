import { useMemo } from "react";

const hIonSeeds = [
  { x: 12, y: 22, tx: 58, ty: 72 },
  { x: 18, y: 48, tx: 66, ty: 76 },
  { x: 10, y: 68, tx: 52, ty: 82 },
  { x: 30, y: 32, tx: 73, ty: 72 },
  { x: 26, y: 78, tx: 61, ty: 88 },
  { x: 40, y: 54, tx: 80, ty: 80 },
  { x: 34, y: 16, tx: 67, ty: 66 },
  { x: 46, y: 70, tx: 88, ty: 83 },
  { x: 22, y: 62, tx: 57, ty: 77 },
  { x: 8, y: 38, tx: 48, ty: 74 },
  { x: 38, y: 86, tx: 71, ty: 91 },
  { x: 48, y: 42, tx: 84, ty: 75 },
];

const chlorideSeeds = [
  { x: 70, y: 20 },
  { x: 82, y: 35 },
  { x: 58, y: 39 },
  { x: 88, y: 58 },
  { x: 51, y: 23 },
  { x: 74, y: 62 },
];

const zincSeeds = [
  { x: 47, y: 80 },
  { x: 56, y: 76 },
  { x: 65, y: 82 },
  { x: 74, y: 78 },
  { x: 84, y: 84 },
  { x: 51, y: 90 },
  { x: 60, y: 91 },
  { x: 70, y: 92 },
  { x: 81, y: 92 },
  { x: 40, y: 88 },
  { x: 54, y: 68 },
  { x: 64, y: 66 },
  { x: 75, y: 69 },
  { x: 86, y: 73 },
  { x: 45, y: 72 },
  { x: 91, y: 88 },
];

const flashSeeds = [
  { x: 58, y: 72 },
  { x: 70, y: 78 },
  { x: 50, y: 82 },
  { x: 82, y: 84 },
];

const hydrogenBubbleSeeds = [
  { x: 62, size: 28 },
  { x: 75, size: 22 },
  { x: 55, size: 18 },
  { x: 84, size: 25 },
  { x: 68, size: 15 },
];

function getHydrogenIonCount(factorId, optionId) {
  if (factorId === "size" && optionId === "powder") {
    return 11;
  }

  if (factorId === "concentration") {
    if (optionId === "concentrated") {
      return 12;
    }

    if (optionId === "medium") {
      return 9;
    }

    return 6;
  }

  return 8;
}

function getMotionSpeed(factorId, option) {
  if (factorId === "size" && option.id === "powder") {
    return 0.88;
  }

  if (factorId === "temperature") {
    if (option.id === "high") {
      return 0.9;
    }

    if (option.id === "low") {
      return 2.15;
    }
  }

  return Math.max(1.05, 2.05 - option.rate * 0.46);
}

function getZincCount(factorId, optionId, progress, completed) {
  const initialCount = factorId === "size" && optionId === "powder" ? 16 : 9;
  const remainingRatio = completed ? 0.08 : Math.max(0.08, 1 - progress * 0.9);
  return Math.max(completed ? 1 : 2, Math.ceil(initialCount * remainingRatio));
}

function getSuccessCount(factorId, optionId, rate) {
  if (factorId === "size" && optionId === "powder") {
    return 4;
  }

  if (factorId === "catalyst" && optionId === "with") {
    return 4;
  }

  if (rate >= 1.2) {
    return 3;
  }

  return 2;
}

export default function ReactionAtomicView({ factor, option, running, progress, completed, canRun }) {
  const factorId = factor?.id || "size";
  const isPowder = factorId === "size" && option.id === "powder";
  const isActive = running || completed || !canRun;
  const hIonCount = getHydrogenIonCount(factorId, option.id);
  const zincCount = getZincCount(factorId, option.id, progress, completed);
  const successCount = getSuccessCount(factorId, option.id, option.rate);
  const speed = getMotionSpeed(factorId, option);
  const zincOpacity = Math.max(0.18, 1 - progress * 0.82);

  const hIons = useMemo(() => hIonSeeds.slice(0, hIonCount), [hIonCount]);
  const zincAtoms = useMemo(() => zincSeeds.slice(0, zincCount), [zincCount]);
  const flashes = useMemo(() => flashSeeds.slice(0, successCount), [successCount]);

  return (
    <section
      className={[
        "reactionAtomicView",
        isActive ? "reactionAtomicView--active" : "",
        "reactionAtomicView--zinc",
        isPowder ? "reactionAtomicView--powder" : "",
      ].join(" ")}
      style={{
        "--atomic-speed": `${speed}s`,
        "--atomic-speed-slow": `${speed * 1.45}s`,
        "--atomic-bubble-speed": `${speed * 1.65}s`,
        "--atomic-flash-speed": `${speed * 1.05}s`,
        "--atomic-zinc-speed": `${speed * 1.55}s`,
        "--atomic-zinc-opacity": zincOpacity,
      }}
      aria-label="Pandangan zarah perlanggaran ion hidrogen dengan zink"
    >
      <div className="reactionAtomicView__head">
        <div>
          <h3>Pandangan zarah</h3>
          <p>{factor.label}: {option.label}</p>
        </div>
        <strong className="reactionAtomicMaterial">Zink sahaja</strong>
      </div>

      <div className="reactionAtomicChamber">
        <div className="reactionAtomicChamber__liquid" />
        <div className="reactionAtomicChamber__surface" />

        {zincAtoms.map((atom, index) => (
          <span
            key={`zn-${index}`}
            className="reactionAtomicSolid reactionAtomicSolid--zinc"
            style={{
              "--x": `${atom.x}%`,
              "--y": `${atom.y}%`,
              "--delay": `${index * -0.08}s`,
            }}
          >
            {""}
          </span>
        ))}

        {hIons.map((ion, index) => (
          <span
            key={`h-${index}`}
            className="reactionAtomicIon reactionAtomicIon--h"
            style={{
              "--x": `${ion.x}%`,
              "--y": `${ion.y}%`,
              "--tx": `${ion.tx}%`,
              "--ty": `${ion.ty}%`,
              "--delay": `${index * -0.16}s`,
            }}
          >
            {""}
          </span>
        ))}

        {chlorideSeeds.map((ion, index) => (
          <span
            key={`cl-${index}`}
            className="reactionAtomicIon reactionAtomicIon--cl"
            style={{
              "--x": `${ion.x}%`,
              "--y": `${ion.y}%`,
              "--delay": `${index * -0.3}s`,
            }}
          >
            {""}
          </span>
        ))}

        {flashes.slice(0, 2).map((flash, index) => (
          <span
            key={`zn2-${index}`}
            className="reactionAtomicIon reactionAtomicIon--zn2"
            style={{
              "--x": `${flash.x + 4}%`,
              "--y": `${flash.y - 6}%`,
              "--delay": `${index * -0.55}s`,
            }}
          >
            {""}
          </span>
        ))}

        {flashes.map((flash, index) => (
          <span
            key={`flash-${index}`}
            className="reactionAtomicFlash"
            style={{
              "--x": `${flash.x}%`,
              "--y": `${flash.y}%`,
              "--delay": `${index * -0.24}s`,
            }}
          />
        ))}

        {hydrogenBubbleSeeds.map((bubble, index) => (
          <span
            key={`h2-${index}`}
            className="reactionAtomicBubble reactionAtomicBubble--h2"
            style={{
              "--x": `${bubble.x}%`,
              "--size": `${bubble.size}px`,
              "--delay": `${index * -0.35}s`,
            }}
          >
            {""}
          </span>
        ))}

        {factorId === "catalyst" && option.id === "with" && <span className="reactionAtomicCatalyst">Mangkin</span>}
      </div>

      <div className="reactionAtomicLegend" aria-label="Label zarah">
        <span><i className="reactionAtomicLegend__dot reactionAtomicLegend__dot--h" />Ion hidrogen</span>
        <span><i className="reactionAtomicLegend__dot reactionAtomicLegend__dot--cl" />Ion klorida</span>
        <span><i className="reactionAtomicLegend__dot reactionAtomicLegend__dot--zn" />Zink</span>
        <span><i className="reactionAtomicLegend__dot reactionAtomicLegend__dot--zn2" />Ion zink</span>
        <span><i className="reactionAtomicLegend__dot reactionAtomicLegend__dot--h2" />Hidrogen</span>
      </div>
    </section>
  );
}
