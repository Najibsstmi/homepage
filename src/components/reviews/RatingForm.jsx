import { useState } from "react";
import { submitRating } from "./reviewApi";
import StarRatingInput from "./StarRatingInput";

const userTypes = ["Murid", "Guru", "Orang Awam"];

export default function RatingForm({ simulatorId, compact = false, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [userType, setUserType] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const isSubmitting = status === "submitting";
  const canSubmit = rating > 0 && userType && !isSubmitting;

  const handleRatingChange = (nextRating) => {
    setRating(nextRating);
    setStatus("idle");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      setStatus("error");
      setMessage("Pilih rating dan jenis pengguna dahulu.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const result = await submitRating({
        simulatorId,
        rating,
        userType,
        comment: comment.trim(),
      });

      setStatus("success");
      setMessage("Terima kasih atas penilaian anda!");
      setComment("");
      onSubmitted?.(result);
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Rating gagal dihantar. Sila cuba lagi.");
    }
  };

  return (
    <form
      className={`ratingForm${compact ? " ratingForm--compact" : ""}`}
      onSubmit={handleSubmit}
    >
      <StarRatingInput value={rating} onChange={handleRatingChange} disabled={isSubmitting} />

      {rating > 0 && (
        <div className="ratingForm__fields">
          <div className="ratingForm__userTypes" aria-label="Pilih jenis pengguna">
            {userTypes.map((type) => (
              <button
                type="button"
                key={type}
                className={userType === type ? "ratingForm__userType--active" : ""}
                onClick={() => setUserType(type)}
                disabled={isSubmitting}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="ratingForm__comment">
            <span>Komen ringkas optional</span>
            <textarea
              value={comment}
              rows={compact ? 2 : 3}
              maxLength={300}
              placeholder="Contoh: Simulator ini mudah difahami."
              onChange={(event) => setComment(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <button className="ratingForm__submit" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Menghantar..." : "Hantar Review"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`ratingForm__message ratingForm__message--${status}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
