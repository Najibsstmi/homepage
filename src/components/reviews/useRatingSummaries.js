import { useCallback, useEffect, useState } from "react";
import {
  fetchRatingSummaries,
  isReviewServiceConfigured,
} from "./reviewApi";

export default function useRatingSummaries(simulatorId) {
  const [summaries, setSummaries] = useState({});
  const [status, setStatus] = useState(() =>
    isReviewServiceConfigured() ? "idle" : "unconfigured"
  );
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isReviewServiceConfigured()) {
      setStatus("unconfigured");
      setError("");
      setSummaries({});
      return {};
    }

    setStatus("loading");
    setError("");

    try {
      const nextSummaries = await fetchRatingSummaries({ simulatorId });
      setSummaries(nextSummaries);
      setStatus("ready");
      return nextSummaries;
    } catch (nextError) {
      setError(nextError.message || "Gagal mendapatkan summary review.");
      setStatus("error");
      return {};
    }
  }, [simulatorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    configured: isReviewServiceConfigured(),
    error,
    refresh,
    status,
    summaries,
  };
}
