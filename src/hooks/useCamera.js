import { useCallback, useEffect, useRef, useState } from "react";

export const releaseMediaStream = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const cameraErrorMessage = (error) => {
  if (!window.isSecureContext) return "Akses kamera memerlukan HTTPS atau localhost.";
  if (error?.name === "NotAllowedError") return "Kebenaran kamera ditolak. Benarkan akses kamera dalam tetapan pelayar.";
  if (error?.name === "NotFoundError") return "Kamera belakang tidak ditemui pada peranti ini.";
  if (error?.name === "NotReadableError") return "Kamera mungkin sedang digunakan oleh aplikasi lain.";
  if (error?.name === "OverconstrainedError") return "Tetapan kamera ini tidak disokong oleh peranti.";
  return "Kamera tidak dapat dimulakan. Semak kebenaran dan cuba semula.";
};

export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [torch, setTorch] = useState({ supported: false, enabled: false, message: "" });
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    releaseMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setTorch((current) => ({ ...current, enabled: false }));
  }, []);

  const start = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = window.isSecureContext
        ? "Pelayar ini tidak menyokong akses kamera MediaDevices."
        : "Akses kamera memerlukan HTTPS atau localhost.";
      setError(message);
      throw new Error(message);
    }
    stop();
    const preferred = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, min: 15 },
      },
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(preferred);
      } catch (initialError) {
        if (initialError?.name === "NotAllowedError" || initialError?.name === "NotFoundError") throw initialError;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } });
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Paparan kamera belum tersedia.");
      video.srcObject = stream;
      await video.play();
      setActive(true);

      const track = stream.getVideoTracks()[0];
      const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
      const torchSupported = Boolean(capabilities.torch);
      if (!torchSupported) {
        setTorch({ supported: false, enabled: false, message: "Lampu suluh tidak disokong oleh pelayar atau kamera ini." });
      } else {
        try {
          await track.applyConstraints({ advanced: [{ torch: true }] });
          setTorch({ supported: true, enabled: true, message: "Lampu suluh kamera dihidupkan." });
        } catch {
          setTorch({ supported: true, enabled: false, message: "Lampu suluh tersedia tetapi tidak dapat dihidupkan secara automatik." });
        }
      }
      return stream;
    } catch (cameraError) {
      stop();
      const message = cameraErrorMessage(cameraError);
      setError(message);
      throw new Error(message);
    }
  }, [stop]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torch.supported) return;
    const nextValue = !torch.enabled;
    try {
      await track.applyConstraints({ advanced: [{ torch: nextValue }] });
      setTorch({ supported: true, enabled: nextValue, message: nextValue ? "Lampu suluh kamera dihidupkan." : "Lampu suluh kamera dimatikan." });
    } catch {
      setTorch((current) => ({ ...current, message: "Tetapan lampu suluh tidak dapat diubah pada peranti ini." }));
    }
  }, [torch.enabled, torch.supported]);

  useEffect(() => stop, [stop]);

  return { videoRef, streamRef, active, torch, error, start, stop, toggleTorch };
}
