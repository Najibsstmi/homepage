import { useEffect, useMemo, useRef, useState } from "react";
import AnalysisPanel from "./AnalysisPanel";
import ControlsPanel from "./ControlsPanel";
import QuizCard from "./quiz/QuizCard";
import TapeChart from "./TapeChart";
import TickerTape from "./TickerTape";
import TrackAnimation from "./TrackAnimation";
import { linearMotionQuiz } from "../data/simulatorQuizzes";

const trackLengthCm = 200;
const tickerInterval = 0.02;
const segmentTicks = 10;
const segmentTime = tickerInterval * segmentTicks;

function buildModel(heightCm, massKg, cartCount) {
  const systemMass = Math.max(massKg, cartCount);
  const extraLoad = Math.max(systemMass - cartCount, 0);
  const massFactor = Math.max(0.86, 1 - (systemMass - 1) * 0.035);
  const acceleration = heightCm === 0 ? 0 : (heightCm / 60) * 135 * massFactor;
  const travelTime = acceleration > 0 ? Math.sqrt((2 * trackLengthCm) / acceleration) : 0;

  return {
    acceleration,
    travelTime,
    systemMass,
    extraLoad,
  };
}

function buildLiveData(acceleration, elapsedTime) {
  if (acceleration <= 0 || elapsedTime <= 0) {
    return {
      tickerDots: [],
      segments: [],
      firstDotDistance: 0,
      lastDotDistance: 0,
      initialVelocity: 0,
      finalVelocity: 0,
    };
  }

  const tickCount = Math.floor(elapsedTime / tickerInterval);
  const tickerDots = Array.from({ length: tickCount + 1 }, (_, tick) => {
    const time = tick * tickerInterval;
    const distance = Math.min(0.5 * acceleration * time * time, trackLengthCm);
    const velocity = acceleration * time;

    return {
      tick,
      time,
      distance,
      velocity,
    };
  });

  const segments = [];
  for (let startTick = 0; startTick < tickCount; startTick += segmentTicks) {
    const dotsInSegment = tickerDots.slice(startTick, Math.min(startTick + segmentTicks + 1, tickerDots.length));
    if (dotsInSegment.length < 2) {
      continue;
    }

    const start = dotsInSegment[0];
    const end = dotsInSegment[dotsInSegment.length - 1];
    const lengthCm = Math.max(end.distance - start.distance, 0);
    const segmentDuration = Math.max(end.time - start.time, tickerInterval);

    segments.push({
      index: segments.length + 1,
      startTime: start.time,
      endTime: end.time,
      lengthCm,
      averageVelocity: lengthCm / segmentDuration,
      displayWidth: Math.min(Math.max(lengthCm * 2.4, 70), 260),
      dots: dotsInSegment.slice(1).map((dot, dotIndex) => {
        const position = lengthCm > 0 ? ((dot.distance - start.distance) / lengthCm) * 100 : dotIndex * 10;

        return {
          tick: dot.tick,
          position: Math.min(Math.max(position, 4), 96),
        };
      }),
    });
  }

  const firstDotDistance = tickerDots[1]?.distance - tickerDots[0]?.distance || 0;
  const lastDotDistance =
    tickerDots.length > 1
      ? tickerDots[tickerDots.length - 1].distance - tickerDots[tickerDots.length - 2].distance
      : 0;

  return {
    tickerDots,
    segments,
    firstDotDistance,
    lastDotDistance,
    initialVelocity: firstDotDistance / tickerInterval,
    finalVelocity: lastDotDistance / tickerInterval,
  };
}

function LinearProgressPanel({ heightCm, started, completed, tapeCut, showData, segmentCount, quizScore, quizTotal }) {
  const motionStarter = completed ? 10 : started ? 8 : heightCm > 0 ? 5 : 0;
  const dataCollector = completed ? 10 : started ? Math.min(Math.max(segmentCount, 1), 10) : 0;
  const tapeAnalyst = tapeCut ? 10 : segmentCount > 0 ? 4 : 0;
  const graphInterpreter = tapeCut && showData && segmentCount > 0 ? 10 : showData ? 3 : 0;
  const scienceCheck = quizTotal > 0 ? Math.round((quizScore / quizTotal) * 10) : 0;
  const total = motionStarter + dataCollector + tapeAnalyst + graphInterpreter + scienceCheck;
  const badge = total >= 45 ? "Pakar Pita Detik" : total >= 30 ? "Penganalisis Gerakan" : total >= 14 ? "Pengumpul Data" : "Sedia Mula";
  const items = [
    ["Motion Starter", motionStarter],
    ["Data Collector", dataCollector],
    ["Tape Analyst", tapeAnalyst],
    ["Graph Interpreter", graphInterpreter],
    ["Science Check", scienceCheck],
  ];

  return (
    <aside className="linearProgressPanel" aria-label="Progress simulator gerakan linear">
      <div className="linearProgressPanel__header">
        <span>Motion Progress</span>
        <strong>{total}/50</strong>
      </div>
      <p>{badge}</p>
      <div className="linearProgressGrid">
        {items.map(([label, score]) => (
          <div className="linearProgressItem" key={label} style={{ "--score": `${score * 10}%` }}>
            <div>
              <span>{label}</span>
              <strong>{score}/10</strong>
            </div>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function LinearMotionSimulator() {
  const [heightCm, setHeightCm] = useState(0);
  const [massKg, setMassKg] = useState(1);
  const [cartCount, setCartCount] = useState(1);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showData, setShowData] = useState(true);
  const [tapeCut, setTapeCut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState("Sedia untuk dilepaskan.");
  const [quizResult, setQuizResult] = useState({ score: 0, total: linearMotionQuiz.length });
  const requestRef = useRef(null);
  const startedAtRef = useRef(0);
  const pausedElapsedRef = useRef(0);

  const model = useMemo(() => buildModel(heightCm, massKg, cartCount), [heightCm, massKg, cartCount]);
  const tickerElapsedTime = Math.floor(elapsedTime / tickerInterval) * tickerInterval;
  const liveData = useMemo(
    () => buildLiveData(model.acceleration, tickerElapsedTime),
    [model.acceleration, tickerElapsedTime]
  );
  const currentDistance = Math.min(0.5 * model.acceleration * elapsedTime * elapsedTime, trackLengthCm);
  const currentVelocityCms = model.acceleration * elapsedTime;
  const progress = trackLengthCm > 0 ? currentDistance / trackLengthCm : 0;
  const firstSegment = liveData.segments[0];
  const completedSegments =
    tapeCut && liveData.segments.length > 2 ? liveData.segments.slice(0, -1) : tapeCut ? liveData.segments : [];
  const longestSegment = completedSegments.reduce(
    (selected, segment) => (segment.lengthCm > selected.lengthCm ? segment : selected),
    { index: 0, lengthCm: 0 }
  );
  const segmentInitialVelocity = tapeCut && firstSegment ? firstSegment.lengthCm / segmentTime : 0;
  const segmentFinalVelocity = longestSegment.lengthCm ? longestSegment.lengthCm / segmentTime : 0;
  const segmentAnalysisTime =
    firstSegment && longestSegment.index > firstSegment.index
      ? (longestSegment.index - firstSegment.index) * segmentTime
      : segmentTime;
  const segmentAcceleration =
    tapeCut && liveData.segments.length > 1 ? (segmentFinalVelocity - segmentInitialVelocity) / segmentAnalysisTime : 0;

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const tick = (timestamp) => {
    const nextElapsed = (timestamp - startedAtRef.current) / 1000;
    const cappedElapsed = Math.min(nextElapsed, model.travelTime);

    setElapsedTime(cappedElapsed);

    if (cappedElapsed >= model.travelTime) {
      setRunning(false);
      setPaused(false);
      setCompleted(true);
      setMessage("Troli telah sampai ke dinding lembut.");
      return;
    }

    requestRef.current = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (requestRef.current) {
      window.cancelAnimationFrame(requestRef.current);
    }

    if (model.acceleration <= 0) {
      setRunning(false);
      setPaused(false);
      setCompleted(false);
      setTapeCut(false);
      setElapsedTime(0);
      pausedElapsedRef.current = 0;
      setMessage("Tiada pergerakan kerana landasan mendatar.");
      return;
    }

    setRunning(true);
    setPaused(false);
    setCompleted(false);
    setTapeCut(false);
    setElapsedTime(0);
    pausedElapsedRef.current = 0;
    setMessage("Troli sedang bergerak.");
    startedAtRef.current = performance.now();
    requestRef.current = window.requestAnimationFrame(tick);
  };

  const pause = () => {
    if (!running) {
      return;
    }

    if (!paused) {
      if (requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
      }
      pausedElapsedRef.current = elapsedTime;
      setPaused(true);
      setMessage("Simulasi dijeda.");
      return;
    }

    setPaused(false);
    setMessage("Troli sedang bergerak.");
    startedAtRef.current = performance.now() - pausedElapsedRef.current * 1000;
    requestRef.current = window.requestAnimationFrame(tick);
  };

  const reset = () => {
    if (requestRef.current) {
      window.cancelAnimationFrame(requestRef.current);
    }

    setHeightCm(0);
    setMassKg(1);
    setCartCount(1);
    setRunning(false);
    setPaused(false);
    setCompleted(false);
    setTapeCut(false);
    setElapsedTime(0);
    pausedElapsedRef.current = 0;
    setMessage("Sedia untuk dilepaskan.");
    setQuizResult({ score: 0, total: linearMotionQuiz.length });
  };

  return (
    <main className="linearSim">
      <section className="linearSim__hero">
        <span className="simulatorHero__kicker">Tingkatan 4 • Daya dan Gerakan</span>
        <h1>Gerakan Linear / Pita Detik</h1>
        <p>
          Ubah ketinggian cerun, jisim sistem dan bilangan troli untuk memerhati
          corak titik pada pita detik. Simulasi ini mengekalkan panjang landasan
          2.0 m dan menggunakan ticker timer 50 Hz seperti aktiviti KSSM.
        </p>
      </section>

      <section className="linearSim__workspace">
        <ControlsPanel
          heightCm={heightCm}
          setHeightCm={setHeightCm}
          massKg={massKg}
          setMassKg={setMassKg}
          cartCount={cartCount}
          setCartCount={setCartCount}
          running={running}
          paused={paused}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onGenerateData={() => setShowData((value) => !value)}
        />

        <TrackAnimation
          heightCm={heightCm}
          systemMass={model.systemMass}
          cartCount={cartCount}
          extraLoad={model.extraLoad}
          travelTime={completed || running || paused ? elapsedTime : 0}
          acceleration={completed || running || paused ? model.acceleration : 0}
          currentVelocityCms={currentVelocityCms}
          progress={progress}
          running={running}
          paused={paused}
          completed={completed}
          statusMessage={message}
        />

        <LinearProgressPanel
          heightCm={heightCm}
          started={elapsedTime > 0 || running || paused || completed}
          completed={completed}
          tapeCut={tapeCut}
          showData={showData}
          segmentCount={completedSegments.length || liveData.segments.length}
          quizScore={quizResult.score}
          quizTotal={quizResult.total}
        />
      </section>

      <TickerTape
        tickerDots={liveData.tickerDots}
        segments={liveData.segments}
        started={elapsedTime > 0 || running || paused || completed}
        isCut={tapeCut}
        onCut={() => setTapeCut(true)}
        active={running && !paused}
      />

      {showData && (
        <section className="linearData">
          <TapeChart segments={tapeCut ? completedSegments : []} />

          <div className="linearData__secondary">
          <div className="linearPanel">
            <h2>Jadual Data Pita Detik</h2>
            <div className="linearTableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Bil. pita</th>
                    <th>Masa (s)</th>
                    <th>Panjang pita (cm)</th>
                    <th>Halaju purata (cm s⁻¹)</th>
                  </tr>
                </thead>
                <tbody>
                  {!tapeCut || completedSegments.length === 0 ? (
                    <tr>
                      <td colSpan="4">Tekan butang Potong pita untuk menjana jadual.</td>
                    </tr>
                  ) : (
                    completedSegments.map((segment) => (
                      <tr key={segment.index}>
                        <td>Pita {segment.index}</td>
                        <td>{segment.endTime.toFixed(2)}</td>
                        <td>{segment.lengthCm.toFixed(2)}</td>
                        <td>{segment.averageVelocity.toFixed(1)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <AnalysisPanel
            firstSegmentLength={tapeCut ? firstSegment?.lengthCm || 0 : 0}
            lastSegmentLength={longestSegment.lengthCm || 0}
            initialVelocity={segmentInitialVelocity}
            finalVelocity={segmentFinalVelocity}
            acceleration={completed || running || paused ? segmentAcceleration : 0}
            travelTime={segmentAnalysisTime}
          />
          </div>
        </section>
      )}

      <QuizCard
        title="Science Check (Kuiz)"
        questions={linearMotionQuiz}
        onComplete={(score, total) => setQuizResult({ score, total })}
      />
    </main>
  );
}
