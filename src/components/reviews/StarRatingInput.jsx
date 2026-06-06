import { useEffect, useState } from "react";

export const ratingLabels = {
  1: "kurang suka",
  2: "biasa sahaja",
  3: "okay",
  4: "suka",
  5: "sangat suka",
};

export default function StarRatingInput({
  value = 0,
  previewValue = 0,
  previewCount = 0,
  onChange,
  disabled = false,
}) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [poppingRating, setPoppingRating] = useState(0);
  const previewRating = previewCount > 0 ? Math.max(1, Math.min(5, Math.round(Number(previewValue || 0)))) : 0;
  const activeRating = hoveredRating || value || previewRating;
  const isPreviewingAverage = !hoveredRating && !value && previewRating > 0;

  useEffect(() => {
    if (!poppingRating) {
      return undefined;
    }

    const timer = window.setTimeout(() => setPoppingRating(0), 260);
    return () => window.clearTimeout(timer);
  }, [poppingRating]);

  const handleSelect = (rating) => {
    if (disabled) {
      return;
    }

    onChange?.(rating);
    setPoppingRating(rating);
  };

  return (
    <div className="starRatingInput" aria-label="Pilih rating 1 hingga 5 bintang">
      <div className="starRatingInput__buttons" onMouseLeave={() => setHoveredRating(0)}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            type="button"
            key={rating}
            className={[
              "starRatingInput__button",
              activeRating >= rating ? "starRatingInput__button--active" : "",
              isPreviewingAverage && activeRating >= rating ? "starRatingInput__button--preview" : "",
              poppingRating === rating ? "starRatingInput__button--pop" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`${rating} bintang, ${ratingLabels[rating]}`}
            aria-pressed={value === rating}
            disabled={disabled}
            onClick={() => handleSelect(rating)}
            onFocus={() => setHoveredRating(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
          >
            <span aria-hidden="true">★</span>
          </button>
        ))}
      </div>

      <span className="starRatingInput__hint">
        {value
          ? `${value} bintang - ${ratingLabels[value]}`
          : isPreviewingAverage
            ? `Purata ${Number(previewValue || 0).toFixed(1)} bintang - pilih rating anda`
            : hoveredRating
              ? `${hoveredRating} bintang - ${ratingLabels[hoveredRating]}`
              : "Pilih rating"}
      </span>
    </div>
  );
}
