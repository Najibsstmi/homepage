const DEVICE_STORAGE_KEY = "edusim_review_device_id";
const SUMMARY_CALLBACK_PREFIX = "__edusimReviewSummary";
const DEFAULT_REVIEW_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxzDAvLDRNI4FhuailXth0j4Sri46mLLh5JeLCHRTj9DYcJ9TyKtK9aCl8mLgnrps9B/exec";

export const REVIEW_WEB_APP_URL =
  import.meta.env.VITE_REVIEW_SIMULATOR_WEB_APP_URL?.trim() ||
  DEFAULT_REVIEW_WEB_APP_URL;

export const isReviewServiceConfigured = () => REVIEW_WEB_APP_URL.length > 0;

const randomId = (prefix) => {
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomPart}`;
};

export const getDeviceId = () => {
  if (typeof window === "undefined") {
    return randomId("server-device");
  }

  const existingDeviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = randomId("edusim-device");
  window.localStorage.setItem(DEVICE_STORAGE_KEY, nextDeviceId);
  return nextDeviceId;
};

const wait = (duration) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

const buildWebAppUrl = (params = {}) => {
  const url = new URL(REVIEW_WEB_APP_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

export const fetchRatingSummaries = ({ simulatorId } = {}) =>
  new Promise((resolve, reject) => {
    if (!isReviewServiceConfigured()) {
      resolve({});
      return;
    }

    if (typeof window === "undefined") {
      resolve({});
      return;
    }

    const callbackName = `${SUMMARY_CALLBACK_PREFIX}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const script = document.createElement("script");
    let timeoutId;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (payload) => {
      cleanup();

      if (!payload?.ok) {
        reject(new Error(payload?.error || "Gagal mendapatkan summary review."));
        return;
      }

      resolve(payload.summaries || {});
    };

    script.src = buildWebAppUrl({
      action: "summary",
      callback: callbackName,
      simulator_id: simulatorId,
    });
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Gagal memuatkan summary review."));
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Summary review mengambil masa terlalu lama."));
    }, 10000);

    document.body.appendChild(script);
  });

export const submitRating = async ({ simulatorId, rating, userType, comment }) => {
  if (!isReviewServiceConfigured()) {
    throw new Error("URL Apps Script belum ditetapkan.");
  }

  if (typeof window === "undefined") {
    throw new Error("Review hanya boleh dihantar dari pelayar.");
  }

  const requestId = randomId("review-request");
  const body = new URLSearchParams({
    response_mode: "json",
    request_id: requestId,
    simulator_id: simulatorId,
    device_id: getDeviceId(),
    user_type: userType,
    comment: comment || "",
    rating: String(rating),
  });

  await fetch(REVIEW_WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    body,
  });

  await wait(650);

  return {
    ok: true,
    request_id: requestId,
    simulator_id: simulatorId,
  };
};
