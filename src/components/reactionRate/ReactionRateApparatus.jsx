import ReactionAtomicView from "./ReactionAtomicView";
import {
  getConcentrationProgress,
  getTemperatureProgress,
} from "../../data/reactionRateData";

const thiosulfateWordEquation = "Natrium tiosulfat + asid sulfurik → natrium sulfat + sulfur dioksida + sulfur + air";
const zincWordEquation = "Zink + asid hidroklorik → zink klorida + gas hidrogen";

function ConcentrationFormula() {
  return thiosulfateWordEquation;
}

function ConcentrationUnit({ label }) {
  return (
    <>
      {label.replace(" mol dm-3", "")} mol dm<sup>-3</sup>
    </>
  );
}

function ReactionTemperatureApparatus({
  option,
  running,
  activeExperiment,
  elapsed,
  temperatureRuns,
  temperatureFeedback,
  activeTemperatureRun,
  onStart,
  onStop,
  onReset,
}) {
  const latestRecord = Array.isArray(temperatureRuns)
    ? [...temperatureRuns].reverse().find((run) => run.temperature === option.temperature)
    : null;
  const isActive = running && activeExperiment === "temperature" && activeTemperatureRun?.temperature === option.temperature;
  const displayTime = isActive ? elapsed : latestRecord?.time || 0;
  const visualProgress = isActive ? getTemperatureProgress(elapsed, activeTemperatureRun) : latestRecord ? 1 : 0;
  const xOpacity = Math.max(0, 1 - Math.max(0, visualProgress - 0.08) / 0.78);
  const xBlur = Math.min(12, visualProgress * 10);
  const cloudOpacity = Math.min(0.92, 0.05 + visualProgress * 0.88);
  const reactionSpeed = Math.max(0.82, 2.75 - ((option.temperature - 30) / 30) * 1.75);
  const bubbleCount = Math.min(26, Math.round(7 + visualProgress * 12 + (option.temperature - 30) / 3));
  const sulfurDots = Array.from({ length: 38 }, (_, index) => ({
    x: 234 + ((index * 31) % 210),
    y: 278 + ((index * 19) % 82),
    r: 2 + (index % 3),
  }));

  return (
    <section className="electroPanel reactionApparatus reactionApparatus--temperature">
      <div className="reactionApparatus__top">
        <div>
          <h2>Radas Eksperimen</h2>
          <p>Faktor Suhu: natrium tiosulfat dan asid sulfurik</p>
          <strong className="reactionConcentrationBadge reactionTemperatureBadge">{option.temperature}°C</strong>
        </div>
        <div className="reactionActions reactionActions--temperature">
          <button type="button" className="alloyReleaseButton" onClick={onStart} disabled={running}>
            Mula tindak balas
          </button>
          <button type="button" className="reactionStopButton" onClick={onStop} disabled={!isActive}>
            STOP
          </button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="reactionConcentrationEquation" aria-label="Persamaan tindak balas">
        <ConcentrationFormula />
      </div>

      <div
        className="reactionTemperatureStage"
        style={{
          "--temp-x-opacity": xOpacity,
          "--temp-x-blur": `${xBlur}px`,
          "--temp-cloud-opacity": cloudOpacity,
          "--x-opacity": xOpacity,
          "--x-blur": `${xBlur}px`,
          "--cloud-opacity": cloudOpacity,
          "--temp-particle-speed": `${reactionSpeed}s`,
        }}
      >
        <section className="reactionTopViewCard" aria-label="Pandangan atas kelalang">
          <div>
            <h3>Pandangan atas kelalang</h3>
            <p>Lihat tanda X melalui larutan dari atas.</p>
          </div>
          <div className="reactionTopViewCircle">
            <span className="reactionTopViewLiquid" />
            <span className="reactionTopViewCloud" />
            <strong>X</strong>
          </div>
          <em>{visualProgress >= 0.92 ? "X tidak kelihatan" : visualProgress >= 0.72 ? "X hampir hilang" : "X masih kelihatan"}</em>
        </section>

        <section className="reactionTemperatureMacro" aria-label="Kelalang kon dengan tanda X di bawahnya">
          <div className="reactionViewHeader">
            <div>
              <span>Pandangan makro</span>
              <strong>Natrium tiosulfat + asid sulfurik</strong>
            </div>
            <em>{displayTime.toFixed(1)} s</em>
          </div>

          <svg viewBox="0 0 780 430" role="img" aria-label="Asid sulfurik dituangkan ke dalam kelalang kon berisi natrium tiosulfat">
            <defs>
              <linearGradient id="temperatureLiquid" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.66" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.42" />
              </linearGradient>
              <linearGradient id="temperatureGlass" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.18" />
                <stop offset="46%" stopColor="#ffffff" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
              </linearGradient>
              <clipPath id="temperatureFlaskClip">
                <path d="M 278 66 L 392 66 L 392 136 L 486 358 Q 498 388 462 394 L 208 394 Q 172 388 184 358 L 278 136 Z" />
              </clipPath>
            </defs>
            <rect className="reactionStageBg" x="0" y="0" width="780" height="430" rx="24" />
            <rect className="reactionLabWall" x="38" y="34" width="704" height="264" rx="22" />
            <rect className="reactionBench reactionTemperatureBench" x="54" y="388" width="672" height="18" rx="4" />
            <rect className="reactionPaperSheet reactionTemperaturePaper" x="164" y="348" width="342" height="46" rx="9" />
            <text
              className="reactionTemperatureX"
              x="334"
              y="384"
              style={{ opacity: xOpacity, filter: `blur(${xBlur}px)` }}
            >
              X
            </text>

            <g className={isActive ? "reactionTemperatureAcid reactionTemperatureAcid--active" : "reactionTemperatureAcid"}>
              <rect className="reactionAcidBeaker" x="560" y="92" width="106" height="82" rx="16" />
              <path className="reactionTemperatureAcidFill" d="M 572 136 C 596 128, 624 144, 652 132 L 652 160 L 572 160 Z" />
              <text className="reactionSvgLabel reactionSvgLabel--center" x="612" y="116">
                <tspan x="612">Asid</tspan>
                <tspan x="612" dy="18">sulfurik</tspan>
              </text>
              <path className="reactionPourLine reactionTemperaturePourLine" d="M 558 164 C 508 178, 464 198, 394 230" />
            </g>

            <path className="reactionConcentrationFlask reactionTemperatureFlask" d="M 278 66 L 392 66 L 392 136 L 486 358 Q 498 388 462 394 L 208 394 Q 172 388 184 358 L 278 136 Z" />
            <g clipPath="url(#temperatureFlaskClip)">
              <path className="reactionTemperatureLiquid" d="M 190 294 C 248 278, 336 306, 478 286 L 492 358 Q 502 382 462 388 L 210 388 Q 172 382 182 358 Z" />
              <path className="reactionTemperatureCloud" d="M 184 248 C 248 232, 340 266, 492 242 L 504 394 L 174 394 Z" />
              {sulfurDots.map((dot, index) => (
                <circle
                  key={index}
                  className="reactionSulfurDot reactionTemperatureSulfurDot"
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                  style={{ opacity: visualProgress > 0.12 ? Math.min(0.92, visualProgress + (index % 5) * 0.06) : 0 }}
                />
              ))}
              {Array.from({ length: bubbleCount }, (_, index) => (
                <circle
                  key={`bubble-${index}`}
                  className={isActive ? "reactionTemperatureBubble reactionTemperatureBubble--active" : "reactionTemperatureBubble"}
                  cx={224 + (index % 9) * 27}
                  cy={344 - (index % 6) * 13}
                  r={3 + (index % 3)}
                  style={{
                    animationDelay: `${index * -0.14}s`,
                    animationDuration: `${Math.max(0.65, reactionSpeed * 0.7)}s`,
                    opacity: isActive || latestRecord ? 0.75 : 0,
                  }}
                />
              ))}
            </g>
            <path className="reactionConcentrationSurface" d="M 216 294 C 276 280, 354 301, 456 286" />
            <line className="reactionConcentrationNeck" x1="282" y1="70" x2="388" y2="70" />
            <text className="reactionSvgLabel reactionSvgLabel--center" x="334" y="50">Kelalang kon</text>
            <text className="reactionSvgLabel reactionSvgLabel--center" x="334" y="174">Natrium tiosulfat</text>
            <text className="reactionSvgLabel reactionSvgLabel--center" x="334" y="328">Larutan semakin keruh</text>
            <text className="reactionSvgLabel reactionSvgLabel--center" x="334" y="420">Kertas putih bertanda X</text>
          </svg>
        </section>

        <div className="reactionTemperatureSide">
          <section className="reactionStopwatchCard reactionTemperatureStopwatch" aria-label="Jam randik digital">
            <span>Jam randik</span>
            <strong>{displayTime.toFixed(1)} s</strong>
            <p>Tekan STOP apabila tanda X dalam pandangan atas tidak kelihatan.</p>
            <div className={temperatureFeedback.includes("direkodkan") ? "reactionStopFeedback reactionStopFeedback--ok" : "reactionStopFeedback"}>
              {temperatureFeedback}
            </div>
          </section>
        </div>

      </div>
    </section>
  );
}

function ReactionConcentrationApparatus({
  option,
  running,
  activeExperiment,
  elapsed,
  concentrationRuns,
  concentrationFeedback,
  activeConcentrationRun,
  onStart,
  onStop,
  onReset,
}) {
  const record = concentrationRuns[option.id];
  const isActive = running && activeExperiment === "concentration" && activeConcentrationRun?.optionId === option.id;
  const displayTime = isActive ? elapsed : record?.time || 0;
  const visualProgress = isActive ? getConcentrationProgress(elapsed, option.id) : record ? 1 : 0;
  const xOpacity = Math.max(0.02, 1 - Math.max(0, visualProgress - 0.08) / 0.78);
  const xBlur = Math.min(10, visualProgress * 9);
  const cloudOpacity = Math.min(0.9, 0.08 + visualProgress * 0.82);
  const sulfurDots = Array.from({ length: 34 }, (_, index) => ({
    x: 158 + ((index * 29) % 170),
    y: 280 + ((index * 17) % 70),
    r: 2 + (index % 3),
  }));
  return (
    <section className="electroPanel reactionApparatus reactionApparatus--concentration">
      <div className="reactionApparatus__top">
        <div>
          <h2>Radas Eksperimen</h2>
          <p>Faktor Kepekatan</p>
          <strong className="reactionConcentrationBadge">
            <ConcentrationUnit label={option.label} />
          </strong>
        </div>
        <div className="reactionActions reactionActions--concentration">
          <button type="button" className="alloyReleaseButton" onClick={onStart} disabled={running}>
            Mula tindak balas
          </button>
          <button type="button" className="reactionStopButton" onClick={onStop} disabled={!isActive}>
            STOP
          </button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="reactionConcentrationEquation" aria-label="Persamaan tindak balas">
        <ConcentrationFormula />
      </div>

      <div
        className="reactionConcentrationStage"
        style={{
          "--x-opacity": xOpacity,
          "--x-blur": `${xBlur}px`,
          "--cloud-opacity": cloudOpacity,
        }}
      >
        <section className="reactionTopViewCard" aria-label="Pandangan atas kelalang">
          <div>
            <h3>Pandangan atas kelalang</h3>
            <p>Lihat tanda X melalui larutan dari atas.</p>
          </div>
          <div className="reactionTopViewCircle">
            <span className="reactionTopViewLiquid" />
            <span className="reactionTopViewCloud" />
            <strong>X</strong>
          </div>
          <em>{visualProgress >= 0.92 ? "X tidak kelihatan" : visualProgress >= 0.72 ? "X hampir hilang" : "X masih kelihatan"}</em>
        </section>

        <section className="reactionConcentrationMacro" aria-label="Kelalang kon natrium tiosulfat dan asid sulfurik">
          <svg viewBox="0 0 520 430" role="img" aria-label="Kelalang kon mengandungi natrium tiosulfat dan larutan menjadi keruh">
            <defs>
              <linearGradient id="thiosulfateLiquid" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.62" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.38" />
              </linearGradient>
              <linearGradient id="concentrationGlass" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.18" />
                <stop offset="44%" stopColor="#ffffff" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
              </linearGradient>
              <clipPath id="concentrationFlaskClip">
                <path d="M 210 60 L 310 60 L 310 130 L 390 354 Q 400 384 368 390 L 152 390 Q 120 384 130 354 L 210 130 Z" />
              </clipPath>
            </defs>
            <rect className="reactionStageBg" x="0" y="0" width="520" height="430" rx="24" />
            <rect className="reactionBench" x="72" y="388" width="376" height="14" rx="3" />
            <rect className="reactionPaperSheet" x="116" y="348" width="300" height="44" rx="8" />
            <text className="reactionSvgLabel reactionSvgLabel--center" x="266" y="420">Kertas putih di bawah kelalang</text>

            <path className="reactionConcentrationFlask" d="M 210 60 L 310 60 L 310 130 L 390 354 Q 400 384 368 390 L 152 390 Q 120 384 130 354 L 210 130 Z" />
            <g clipPath="url(#concentrationFlaskClip)">
              <path className="reactionConcentrationLiquid" d="M 140 292 C 194 276, 276 306, 382 286 L 394 354 Q 402 376 368 382 L 154 382 Q 120 376 128 354 Z" />
              <path className="reactionConcentrationCloud" d="M 130 258 C 190 236, 274 268, 392 246 L 402 386 L 122 386 Z" />
              {sulfurDots.map((dot, index) => (
                <circle
                  key={index}
                  className="reactionSulfurDot"
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                  style={{ opacity: visualProgress > 0.16 ? Math.min(0.92, visualProgress + (index % 4) * 0.08) : 0 }}
                />
              ))}
            </g>
            <path className="reactionConcentrationSurface" d="M 164 292 C 210 280, 280 300, 356 286" />
            <line className="reactionConcentrationNeck" x1="212" y1="64" x2="308" y2="64" />
            <text className="reactionSvgLabel reactionSvgLabel--center" x="260" y="49">Kelalang kon</text>
            <text className="reactionSvgLabel reactionSvgLabel--center" x="260" y="168">Natrium tiosulfat</text>
            <text className="reactionSvgLabel reactionSvgLabel--center" x="260" y="328">Larutan semakin keruh</text>

            <g className={isActive ? "reactionAcidPour reactionAcidPour--active" : "reactionAcidPour"}>
              <rect className="reactionAcidBeaker" x="392" y="80" width="76" height="66" rx="12" />
              <text className="reactionSvgLabel reactionSvgLabel--center" x="430" y="108">
                <tspan x="430">Asid</tspan>
                <tspan x="430" dy="18">sulfurik</tspan>
              </text>
              <path className="reactionPourLine" d="M 392 138 C 362 158, 340 178, 314 204" />
            </g>
          </svg>
        </section>

        <section className="reactionStopwatchCard" aria-label="Jam randik digital">
          <span>Jam randik</span>
          <strong>{displayTime.toFixed(1)} s</strong>
          <p>Tekan STOP apabila tanda X dalam pandangan atas tidak kelihatan.</p>
          <div className={concentrationFeedback.includes("direkodkan") ? "reactionStopFeedback reactionStopFeedback--ok" : "reactionStopFeedback"}>
            {concentrationFeedback}
          </div>
        </section>
      </div>

    </section>
  );
}

export default function ReactionRateApparatus({
  factor,
  option,
  running,
  activeExperiment,
  elapsed,
  volume,
  progress,
  completed,
  concentrationRuns = {},
  temperatureRuns = {},
  concentrationFeedback,
  temperatureFeedback,
  activeConcentrationRun,
  activeTemperatureRun,
  canRun,
  onStart,
  onStop,
  onReset,
}) {
  if (factor.id === "temperature") {
    return (
      <ReactionTemperatureApparatus
        option={option}
        running={running}
        activeExperiment={activeExperiment}
        elapsed={elapsed}
        temperatureRuns={temperatureRuns}
        temperatureFeedback={temperatureFeedback}
        activeTemperatureRun={activeTemperatureRun}
        onStart={onStart}
        onStop={onStop}
        onReset={onReset}
      />
    );
  }

  if (factor.id === "concentration") {
    return (
      <ReactionConcentrationApparatus
        option={option}
        running={running}
        activeExperiment={activeExperiment}
        elapsed={elapsed}
        concentrationRuns={concentrationRuns}
        concentrationFeedback={concentrationFeedback}
        activeConcentrationRun={activeConcentrationRun}
        onStart={onStart}
        onStop={onStop}
        onReset={onReset}
      />
    );
  }

  const bubbleCount = Math.min(18, Math.max(4, Math.round(option.rate * 10)));
  const zincTotal = option.id === "powder" ? 30 : 10;
  const zincCount = completed ? (option.id === "large" ? 1 : 0) : Math.max(0, Math.ceil(zincTotal * (1 - progress * 0.94)));
  const buretTop = 52;
  const buretBottom = 318;
  const buretInnerHeight = buretBottom - buretTop;
  const gasHeight = volume > 0 ? Math.max(5, Math.min(buretInnerHeight - 12, volume * 3.65)) : 0;
  const buretWaterY = buretTop + gasHeight;
  const buretWaterHeight = Math.max(8, buretBottom - buretWaterY);
  const zincLabel = option.id === "powder" ? "Serbuk zink" : "Ketulan zink";

  return (
    <section className="electroPanel reactionApparatus">
      <div className="reactionApparatus__top">
        <div>
          <h2>Radas Eksperimen</h2>
          <p>{zincWordEquation}</p>
        </div>
        <div className="reactionActions">
          <button type="button" className="alloyReleaseButton" onClick={onStart} disabled={running || !canRun}>
            Mula tindak balas
          </button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="reactionStage">
        <section className="reactionMacroView" aria-label="Eksperimen sebenar kadar tindak balas">
          <div className="reactionViewHeader">
            <div>
              <span>Pandangan makro</span>
              <strong>Radas eksperimen sebenar</strong>
            </div>
            <em>{elapsed}s</em>
          </div>

          <svg viewBox="0 0 920 430" role="img" aria-label="Radas kadar tindak balas zink dan asid hidroklorik dengan buret terbalik">
            <defs>
              <linearGradient id="acidGradient" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="glassGradient" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.18" />
                <stop offset="48%" stopColor="#ffffff" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="zincGradient" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <clipPath id="reactionBuretClip">
                <path d="M 598 52 Q 598 30 620 30 Q 642 30 642 52 L 642 294 Q 642 318 620 322 Q 598 318 598 294 Z" />
              </clipPath>
            </defs>

            <rect className="reactionStageBg" x="0" y="0" width="920" height="430" rx="24" />

            <g className="reactionRetortGroup">
              <line className="reactionRetort" x1="815" y1="70" x2="815" y2="360" />
              <rect className="reactionRetortBase" x="742" y="360" width="150" height="18" rx="4" />
              <line className="reactionRetortArm" x1="535" y1="164" x2="855" y2="164" />
              <rect className="reactionClamp" x="582" y="139" width="48" height="50" rx="7" />
              <rect className="reactionClamp" x="794" y="139" width="44" height="50" rx="7" />
              <text className="reactionSvgLabel" x="792" y="230">Kaki retort</text>
              <path className="reactionLeader" d="M 785 224 L 815 224" />
            </g>

            <g className="reactionBuretSetup">
              <path className="reactionBasin" d="M 486 244 Q 486 225 505 225 L 744 225 Q 763 225 763 244 L 752 338 Q 748 365 720 365 L 526 365 Q 498 365 494 338 Z" />
              <path className="reactionBasinWater" d="M 504 275 C 556 263, 625 286, 745 273 L 737 334 Q 734 350 716 352 L 532 352 Q 514 350 512 334 Z" />
              {Array.from({ length: 9 }, (_, index) => (
                <line key={index} className="reactionWaterLine" x1="514" x2="736" y1={286 + index * 6} y2={286 + index * 6} />
              ))}
              <text className="reactionSvgLabel" x="420" y="268">Besen</text>
              <path className="reactionLeader" d="M 474 262 L 506 262" />
              <text className="reactionSvgLabel" x="424" y="310">Air</text>
              <path className="reactionLeader" d="M 456 304 L 512 304" />

              <path className="reactionBuret" d="M 598 52 Q 598 30 620 30 Q 642 30 642 52 L 642 294 Q 642 318 620 322 Q 598 318 598 294 Z" />
              <g clipPath="url(#reactionBuretClip)">
                <rect className="reactionBuretWaterFill" x="599" y={buretWaterY} width="42" height={buretWaterHeight} />
                <rect className="reactionBuretGas" x="599" y={buretTop} width="42" height={gasHeight} />
                {Array.from({ length: 9 }, (_, index) => (
                  <line key={index} className="reactionBuretWaterLine" x1="601" x2="639" y1={buretWaterY + 14 + index * 18} y2={buretWaterY + 14 + index * 18} />
                ))}
              </g>
              <line className="reactionBuretWaterLevel" x1="602" x2="638" y1={buretWaterY} y2={buretWaterY} />
              <line className="reactionBuretStem" x1="612" y1="28" x2="612" y2="8" />
              <line className="reactionBuretStem" x1="628" y1="28" x2="628" y2="8" />
              <rect className="reactionBuretTap" x="588" y="34" width="62" height="18" rx="8" />
              <circle className="reactionBuretTapKnob" cx="582" cy="43" r="7" />
              {Array.from({ length: 17 }, (_, index) => (
                <line
                  key={index}
                  className={index % 5 === 0 ? "reactionBuretMark reactionBuretMark--major" : "reactionBuretMark"}
                  x1="601"
                  x2={index % 5 === 0 ? "628" : "617"}
                  y1={66 + index * 13}
                  y2={66 + index * 13}
                />
              ))}
              <text className="reactionSvgLabel" x="664" y="126">Buret</text>
              <path className="reactionLeader" d="M 652 121 L 641 121" />
              <text className="reactionSvgLabel" x="665" y="78">Gas hidrogen</text>
              <path className="reactionLeader" d="M 653 74 L 631 86" />
              <text className="reactionSvgMetric" x="705" y="48">{volume.toFixed(1)} cm3</text>
            </g>

            <g className="reactionFlaskSetup">
              <path className="reactionTube" d="M 226 168 L 226 75 Q 226 56 246 56 L 362 56 Q 377 56 386 68 L 612 303" />
              <path className="reactionTubeInside" d="M 237 168 L 237 82 Q 237 68 251 68 L 356 68 Q 368 68 376 78 L 604 306" />
              <text className="reactionSvgLabel" x="42" y="78">Salur</text>
              <text className="reactionSvgLabel" x="42" y="101">penghantar</text>
              <path className="reactionLeader" d="M 142 85 L 226 85" />

              <path className="reactionFlask" d="M 178 165 L 278 165 L 278 230 L 342 354 Q 356 383 326 388 L 130 388 Q 100 383 114 354 L 178 230 Z" />
              <path className="reactionLiquid" d="M 134 326 C 176 314, 241 336, 322 322 L 334 354 Q 342 374 320 376 L 136 376 Q 114 374 122 354 Z" />
              <rect className="reactionStopper" x="182" y="142" width="92" height="34" rx="8" />
              <rect className="reactionStopper reactionStopper--cork" x="172" y="143" width="18" height="32" rx="3" />
              <text className="reactionSvgLabel" x="42" y="284">{zincLabel}</text>
              <path className="reactionLeader" d="M 150 280 L 178 350" />
              <text className="reactionSvgLabel" x="156" y="416">Asid hidroklorik cair</text>
              <path className="reactionLeader" d="M 278 397 L 258 346" />

              {Array.from({ length: bubbleCount }, (_, index) => (
                <circle
                  key={index}
                  className={running ? "reactionBubble reactionBubble--run" : "reactionBubble"}
                  cx={156 + (index % 7) * 24}
                  cy={326 - (index % 5) * 16}
                  r={4 + (index % 3)}
                  opacity={running || volume > 0 ? 1 : 0}
                  style={{ animationDelay: `${index * -0.16}s`, animationDuration: `${Math.max(0.7, 1.55 - option.rate * 0.36)}s` }}
                />
              ))}

              {Array.from({ length: zincCount }, (_, index) => (
                <rect
                  key={index}
                  className={option.id === "powder" ? "reactionZinc reactionZinc--powder" : "reactionZinc"}
                  x={148 + (index % 8) * 20}
                  y={354 + Math.floor(index / 8) * 9}
                  width={option.id === "large" ? 20 : 7}
                  height={option.id === "large" ? 10 : 5}
                  rx="3"
                />
              ))}
            </g>

            <g className={running ? "reactionGasTrail reactionGasTrail--run" : "reactionGasTrail"} aria-hidden="true">
              {Array.from({ length: 7 }, (_, index) => (
                <circle
                  key={index}
                  className="reactionTubeBubble"
                  r={3 + (index % 3)}
                  style={{ "--delay": `${index * 0.32}s` }}
                >
                  <animateMotion
                    path="M 220 324 C 218 250 226 184 226 88 Q 226 58 252 58 L 360 58 Q 376 58 388 70 L 610 303"
                    dur={`${Math.max(1.6, 3.6 - option.rate * 0.8)}s`}
                    begin={`${index * 0.28}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          </svg>
        </section>

        <ReactionAtomicView
          factor={factor}
          option={option}
          running={running}
          progress={progress}
          completed={completed}
          canRun={canRun}
        />

        <div className="reactionRunCard">
          <span>Status eksperimen</span>
          <strong>{option.label}</strong>
          <small>{!canRun ? "Pandangan zarah berubah mengikut faktor. Graf kuantitatif disediakan untuk saiz bahan." : running ? "Tindak balas sedang berlaku..." : completed ? "Eksperimen selesai." : "Pilih keadaan dan tekan Mula tindak balas."}</small>
          <i><b style={{ width: `${progress * 100}%` }} /></i>
        </div>
      </div>
    </section>
  );
}
