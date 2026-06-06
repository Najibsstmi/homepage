import { useEffect, useState } from "react";
import RatingForm from "./RatingForm";
import RatingSummary from "./RatingSummary";
import { fetchRatingSummaries } from "./reviewApi";

export default function SimulatorReviewPanel({
  simulatorId,
  simulatorTitle,
  summary,
  summaryStatus = "idle",
  compact = false,
  onReviewSubmitted,
}) {
  const [localSummary, setLocalSummary] = useState(summary);
  const [localStatus, setLocalStatus] = useState(summaryStatus);

  useEffect(() => {
    setLocalSummary(summary);
    setLocalStatus(summaryStatus);
  }, [summary, summaryStatus]);

  const refreshCurrentSummary = async () => {
    setLocalStatus("loading");

    try {
      const summaries = await fetchRatingSummaries({ simulatorId });
      setLocalSummary(summaries[simulatorId]);
      setLocalStatus("ready");
      onReviewSubmitted?.(summaries);
    } catch {
      setLocalStatus("error");
    }
  };

  const handleSubmitted = (result) => {
    if (result?.summary) {
      setLocalSummary(result.summary);
      setLocalStatus("ready");
    }

    refreshCurrentSummary();
  };

  const previewAverage = Number(localSummary?.average || 0);
  const previewCount = Number(localSummary?.count || 0);

  return (
    <section
      className={`simulatorReviewPanel${compact ? " simulatorReviewPanel--compact" : ""}`}
      aria-label={`Review simulator ${simulatorTitle || simulatorId}`}
    >
      {!compact && (
        <div className="simulatorReviewPanel__header">
          <span className="simulatorHero__kicker">Review Simulator</span>
          <h2>Nilai pengalaman menggunakan simulator ini</h2>
        </div>
      )}

      <RatingSummary summary={localSummary} status={localStatus} compact={compact} />
      <RatingForm
        simulatorId={simulatorId}
        compact={compact}
        previewAverage={previewAverage}
        previewCount={previewCount}
        onSubmitted={handleSubmitted}
      />
    </section>
  );
}
