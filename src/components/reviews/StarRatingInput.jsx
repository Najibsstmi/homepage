import { useEffect, useState } from "react";

export const ratingLabels = {
  1: "kurang suka",
  2: "biasa sahaja",
  3: "okay",
  4: "suka",
  5: "sangat suka",
};

export default function StarRatingInput({ value = 0, onChange, disabled = false }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [poppingRating, setPoppingRating] = useState(0);
  const activeRating = hoveredRating || value;

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
        {activeRating ? `${activeRating} bintang - ${ratingLabels[activeRating]}` : "Pilih rating"}
      </span>
    </div>
  );
}
