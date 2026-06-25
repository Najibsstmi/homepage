import { useState } from "react";
import SimulatorReviewPanel from "./reviews/SimulatorReviewPanel";
import { shareSimulator } from "../utils/shareSimulator";

export default function SimulatorCard({
  simulator,
  ratingSummary,
  ratingStatus,
  onReviewSubmitted,
}) {
  const [shareStatus, setShareStatus] = useState("idle");

  const handleShare = async () => {
    const result = await shareSimulator(simulator);

    if (result === "cancelled") {
      return;
    }

    setShareStatus(result);
    window.setTimeout(() => setShareStatus("idle"), 1800);
  };

  const shareLabel =
    shareStatus === "copied"
      ? "Disalin"
      : shareStatus === "shared"
        ? "Dikongsi"
        : shareStatus === "unsupported"
          ? "Tidak dapat salin"
          : "Share";

  return (
    <article className="simulatorCard">
      <div className="simulatorCard__meta">
        <span>Tingkatan {simulator.tingkatan}</span>
        {simulator.bab && <span>{simulator.bab}</span>}
        {simulator.topik && <span>{simulator.topik}</span>}
      </div>

      <h3>{simulator.title}</h3>
      <p>{simulator.description}</p>

      <SimulatorReviewPanel
        simulatorId={simulator.id}
        simulatorTitle={simulator.title}
        summary={ratingSummary}
        summaryStatus={ratingStatus}
        compact
        onReviewSubmitted={onReviewSubmitted}
      />

      <div className="simulatorCard__actions">
        <a className="simulatorCard__button" href={simulator.path}>
          Buka Simulator
        </a>
        <button
          className="simulatorCard__shareButton"
          type="button"
          aria-label={`Kongsi ${simulator.title}`}
          onClick={handleShare}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.8 15.4 6.2M8.6 13.2l6.8 4.6" />
          </svg>
          <span>{shareLabel}</span>
        </button>
      </div>
    </article>
  );
}
