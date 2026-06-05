const formatAverage = (average) => Number(average || 0).toFixed(1);

export default function RatingSummary({ summary, status = "idle", compact = false }) {
  const count = Number(summary?.count || 0);
  const average = Number(summary?.average || 0);
  const isLoading = status === "loading";

  if (isLoading) {
    return (
      <div className={`ratingSummary${compact ? " ratingSummary--compact" : ""}`}>
        <span className="ratingSummary__loading">Memuat review...</span>
      </div>
    );
  }

  if (!count) {
    return (
      <div className={`ratingSummary ratingSummary--empty${compact ? " ratingSummary--compact" : ""}`}>
        Belum ada review
      </div>
    );
  }

  return (
    <div className={`ratingSummary${compact ? " ratingSummary--compact" : ""}`}>
      <span className="ratingSummary__star" aria-hidden="true">★</span>
      <strong>{formatAverage(average)}</strong>
      <span>({count.toLocaleString("ms-MY")} ulasan)</span>
    </div>
  );
}
