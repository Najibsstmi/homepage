import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildWavePath,
  mapAmplitudeToGain,
  mapAmplitudeToVisual,
  mapFrequencyToCycles,
} from "../utils/soundWaveModel";
import "./SoundWaveSimulatorPage.css";

const DEFAULT_AMPLITUDE = 55;
const DEFAULT_FREQUENCY = 400;
const SCENE_WIDTH = 1672;
const SCENE_HEIGHT = 941;

// Calibrated against public/bunyi/statik-utama.webp (1672 × 941).
const SPEAKER_ANCHOR = { x: 292, y: 438 } as const;
const EAR_ANCHOR = { x: 1528, y: 488 } as const;

type SoundWaveSimulatorPageProps = {
  reviewPanel?: ReactNode;
};

type ChangedControl = "amplitude" | "frequency" | "initial";

type ComparisonCardProps = {
  title: string;
  description: string;
  amplitude: number;
  frequency: number;
  active: boolean;
  onClick: () => void;
};

function MiniWave({ amplitude, frequency }: Pick<ComparisonCardProps, "amplitude" | "frequency">) {
  const path = buildWavePath({
    start: { x: 5, y: 29 },
    end: { x: 175, y: 29 },
    amplitude: Math.min(21, Math.max(2, mapAmplitudeToVisual(amplitude) * 0.19)),
    cycles: mapFrequencyToCycles(frequency),
    samples: 90,
  });

  return (
    <svg className="sound-miniWave" viewBox="0 0 180 58" aria-hidden="true">
      <line x1="4" y1="29" x2="176" y2="29" />
      <path d={path} />
    </svg>
  );
}

function ComparisonCard({
  title,
  description,
  amplitude,
  frequency,
  active,
  onClick,
}: ComparisonCardProps) {
  return (
    <button
      className={`sound-compareCard${active ? " is-active" : ""}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="sound-compareCard__title">{title}</span>
      <MiniWave amplitude={amplitude} frequency={frequency} />
      <span className="sound-compareCard__description">{description}</span>
    </button>
  );
}

function getAmplitudeLabel(amplitude: number) {
  if (amplitude <= 35) return "rendah — bunyi perlahan";
  if (amplitude >= 70) return "tinggi — bunyi kuat";
  return "sederhana";
}

function getFrequencyLabel(frequency: number) {
  if (frequency <= 380) return "rendah — nada rendah";
  if (frequency >= 680) return "tinggi — nada tinggi";
  return "sederhana";
}

export default function SoundWaveSimulatorPage({
  reviewPanel,
}: SoundWaveSimulatorPageProps) {
  const [amplitude, setAmplitude] = useState(DEFAULT_AMPLITUDE);
  const [frequency, setFrequency] = useState(DEFAULT_FREQUENCY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [changedControl, setChangedControl] = useState<ChangedControl>("initial");
  const [audioNotice, setAudioNotice] = useState("");

  const wavePathRef = useRef<SVGPathElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const amplitudeRef = useRef(amplitude);
  const frequencyRef = useRef(frequency);
  const mountedRef = useRef(true);

  const visualAmplitude = mapAmplitudeToVisual(amplitude);
  const visualCycles = mapFrequencyToCycles(frequency);
  const staticWavePath = useMemo(
    () =>
      buildWavePath({
        start: SPEAKER_ANCHOR,
        end: EAR_ANCHOR,
        amplitude: visualAmplitude,
        cycles: visualCycles,
      }),
    [visualAmplitude, visualCycles],
  );

  const feedback = useMemo(() => {
    if (changedControl === "amplitude") {
      if (amplitude <= 35) {
        return "Amplitud lebih kecil menghasilkan bunyi yang lebih perlahan. Nada kekal sama.";
      }
      if (amplitude >= 70) {
        return "Amplitud lebih besar menghasilkan bunyi yang lebih kuat. Nada kekal sama.";
      }
      return "Amplitud sederhana menghasilkan kekuatan bunyi yang sederhana.";
    }

    if (changedControl === "frequency") {
      if (frequency <= 380) {
        return "Frekuensi lebih rendah menghasilkan nada yang lebih rendah. Kekuatan bunyi kekal sama.";
      }
      if (frequency >= 680) {
        return "Frekuensi lebih tinggi menghasilkan nada yang lebih tinggi. Kekuatan bunyi kekal sama.";
      }
      return "Frekuensi sederhana menghasilkan nada pertengahan.";
    }

    return "Ubah amplitud untuk kuat atau perlahan. Ubah frekuensi untuk tinggi atau rendah nada.";
  }, [amplitude, changedControl, frequency]);

  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);

  useEffect(() => {
    frequencyRef.current = frequency;
  }, [frequency]);

  useEffect(() => {
    const descriptionMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const canonicalLink = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    const previousTitle = document.title;
    const previousDescription = descriptionMeta?.content;
    const previousCanonical = canonicalLink?.href;

    document.title = "Gelombang Bunyi | EduSim";
    descriptionMeta?.setAttribute(
      "content",
      "Teroka hubungan amplitud dengan kekuatan bunyi serta frekuensi dengan nada melalui gelombang visual dan audio.",
    );
    canonicalLink?.setAttribute(
      "href",
      "https://www.cikgustem.com/simulator/gelombang-bunyi",
    );

    return () => {
      document.title = previousTitle;
      if (previousDescription !== undefined) {
        descriptionMeta?.setAttribute("content", previousDescription);
      }
      if (previousCanonical !== undefined) {
        canonicalLink?.setAttribute("href", previousCanonical);
      }
    };
  }, []);

  const stopAudio = useCallback((updateUi = true) => {
    const context = audioContextRef.current;
    const oscillator = oscillatorRef.current;
    const gainNode = gainRef.current;

    oscillatorRef.current = null;
    gainRef.current = null;

    if (context && oscillator && gainNode) {
      const now = context.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.045);

      try {
        oscillator.stop(now + 0.05);
      } catch {
        // The oscillator may already have been stopped during a rapid click.
      }

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    }

    if (updateUi && mountedRef.current) {
      setIsPlaying(false);
    }
  }, []);

  const startAudio = useCallback(async () => {
    if (oscillatorRef.current) return;

    try {
      let context = audioContextRef.current;
      if (!context || context.state === "closed") {
        const AudioContextConstructor = window.AudioContext;
        if (!AudioContextConstructor) {
          throw new Error("Web Audio API is unavailable");
        }
        context = new AudioContextConstructor();
        audioContextRef.current = context;
      }

      if (context.state === "suspended") {
        await context.resume();
      }

      if (!mountedRef.current || oscillatorRef.current) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const now = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequencyRef.current, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(
        mapAmplitudeToGain(amplitudeRef.current),
        now + 0.08,
      );
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorRef.current = oscillator;
      gainRef.current = gainNode;
      oscillator.start();
      setAudioNotice("");
      setIsPlaying(true);
    } catch {
      setAudioNotice("Audio tidak dapat dimulakan pada pelayar ini. Visual masih boleh diteroka.");
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const context = audioContextRef.current;
    const oscillator = oscillatorRef.current;
    const gainNode = gainRef.current;

    if (!context || !oscillator || !gainNode) return;

    const now = context.currentTime;
    oscillator.frequency.cancelScheduledValues(now);
    oscillator.frequency.setTargetAtTime(frequency, now, 0.025);
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(mapAmplitudeToGain(amplitude), now, 0.025);
  }, [amplitude, frequency]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const animate = (time: number) => {
      wavePathRef.current?.setAttribute(
        "d",
        buildWavePath({
          start: SPEAKER_ANCHOR,
          end: EAR_ANCHOR,
          amplitude: mapAmplitudeToVisual(amplitudeRef.current),
          cycles: mapFrequencyToCycles(frequencyRef.current),
          phase: time * 0.0032,
        }),
      );
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      stopAudio(false);
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== "closed") {
        void context.close();
      }
    };
  }, [stopAudio]);

  const handlePlayToggle = () => {
    if (oscillatorRef.current) {
      stopAudio();
    } else {
      void startAudio();
    }
  };

  const updateAmplitude = (nextAmplitude: number) => {
    setAmplitude(nextAmplitude);
    setChangedControl("amplitude");
  };

  const updateFrequency = (nextFrequency: number) => {
    setFrequency(nextFrequency);
    setChangedControl("frequency");
  };

  const resetSimulator = () => {
    stopAudio();
    setAmplitude(DEFAULT_AMPLITUDE);
    setFrequency(DEFAULT_FREQUENCY);
    setChangedControl("initial");
    setAudioNotice("");
  };

  return (
    <main className="sound-page">
      <header className="sound-header">
        <div>
          <a className="sound-backLink" href="/simulator">← Semua simulator</a>
          <span className="sound-eyebrow">EduSim · Sains Tingkatan 1 · Kurikulum 2027</span>
          <h1>Gelombang Bunyi</h1>
          <p>Ubah, lihat dan dengar hubungan amplitud dengan frekuensi.</p>
        </div>
        <span className="sound-header__badge">UBAH · LIHAT · DENGAR</span>
      </header>

      <section className="sound-lab" aria-label="Simulator gelombang bunyi">
        <div className="sound-sceneCard">
          <div className="sound-sceneCard__topline">
            <div>
              <span>Model visual gelombang</span>
              <strong>Pembesar suara → telinga</strong>
            </div>
            <div className="sound-liveValues" aria-live="polite">
              <span>Amplitud {amplitude}</span>
              <span>{frequency} Hz</span>
            </div>
          </div>

          <div className={`sound-scene${isPlaying ? " is-playing" : ""}`}>
            <img
              className="sound-background"
              src="/bunyi/statik-utama.webp"
              alt="Pembesar suara di sebelah kiri menghadap model telinga di sebelah kanan"
              draggable="false"
            />
            <svg
              className="sound-waveLayer"
              viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
              role="img"
              aria-label={`Model gelombang dengan amplitud ${amplitude} dan frekuensi ${frequency} hertz`}
            >
              <defs>
                <filter id="sound-wave-glow" x="-15%" y="-70%" width="130%" height="240%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="speaker-pulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fde047" stopOpacity="0.52" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>
              <line
                className="sound-baseline"
                x1={SPEAKER_ANCHOR.x}
                y1={SPEAKER_ANCHOR.y}
                x2={EAR_ANCHOR.x}
                y2={EAR_ANCHOR.y}
              />
              <circle
                className="sound-speakerPulse"
                cx={SPEAKER_ANCHOR.x}
                cy={SPEAKER_ANCHOR.y}
                r="80"
                fill="url(#speaker-pulse)"
              />
              <path
                ref={wavePathRef}
                className="sound-mainWave"
                d={staticWavePath}
                data-amplitude={visualAmplitude.toFixed(2)}
                data-cycles={visualCycles.toFixed(2)}
                filter="url(#sound-wave-glow)"
              />
            </svg>
            <div className="sound-modelNote">
              Gelombang ini ialah model visual amplitud dan frekuensi bunyi.
            </div>
          </div>

          <div className="sound-controls">
            <button
              className={`sound-playButton${isPlaying ? " is-playing" : ""}`}
              type="button"
              aria-pressed={isPlaying}
              onClick={handlePlayToggle}
            >
              <span aria-hidden="true">{isPlaying ? "■" : "▶"}</span>
              {isPlaying ? "Hentikan Bunyi" : "Mainkan Bunyi"}
            </button>

            <label className="sound-sliderControl">
              <span className="sound-sliderControl__heading">
                <span>
                  <strong>Amplitud</strong>
                  <small>Kuat / perlahan</small>
                </span>
                <output>{amplitude}</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={amplitude}
                aria-label="Amplitud bunyi"
                aria-valuetext={`${amplitude} daripada 100, ${getAmplitudeLabel(amplitude)}`}
                onChange={(event) => updateAmplitude(Number(event.target.value))}
              />
              <span className="sound-sliderControl__ends"><span>Rendah</span><span>Tinggi</span></span>
            </label>

            <label className="sound-sliderControl">
              <span className="sound-sliderControl__heading">
                <span>
                  <strong>Frekuensi</strong>
                  <small>Tinggi / rendah nada</small>
                </span>
                <output>{frequency} Hz</output>
              </span>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={frequency}
                aria-label="Frekuensi bunyi dalam hertz"
                aria-valuetext={`${frequency} hertz, ${getFrequencyLabel(frequency)}`}
                onChange={(event) => updateFrequency(Number(event.target.value))}
              />
              <span className="sound-sliderControl__ends"><span>200 Hz</span><span>1000 Hz</span></span>
            </label>

            <button className="sound-resetButton" type="button" onClick={resetSimulator}>
              ↻ Set Semula
            </button>
          </div>
          {audioNotice && <p className="sound-audioNotice" role="status">{audioNotice}</p>}
        </div>

        <section className="sound-compare" aria-labelledby="sound-compare-title">
          <div className="sound-sectionHeading">
            <span>Perbandingan cepat</span>
            <h2 id="sound-compare-title">Bandingkan</h2>
          </div>
          <div className="sound-compareGrid">
            <ComparisonCard
              title="Amplitud rendah"
              description="Bunyi perlahan"
              amplitude={22}
              frequency={frequency}
              active={amplitude === 22}
              onClick={() => updateAmplitude(22)}
            />
            <ComparisonCard
              title="Amplitud tinggi"
              description="Bunyi kuat"
              amplitude={85}
              frequency={frequency}
              active={amplitude === 85}
              onClick={() => updateAmplitude(85)}
            />
            <ComparisonCard
              title="Frekuensi rendah"
              description="Nada rendah"
              amplitude={amplitude}
              frequency={260}
              active={frequency === 260}
              onClick={() => updateFrequency(260)}
            />
            <ComparisonCard
              title="Frekuensi tinggi"
              description="Nada tinggi"
              amplitude={amplitude}
              frequency={820}
              active={frequency === 820}
              onClick={() => updateFrequency(820)}
            />
          </div>
        </section>

        <aside className="sound-feedback" aria-live="polite">
          <span aria-hidden="true">i</span>
          <div>
            <strong>Apa yang berlaku?</strong>
            <p>{feedback}</p>
          </div>
        </aside>
      </section>

      {reviewPanel && <section className="sound-review">{reviewPanel}</section>}
    </main>
  );
}
