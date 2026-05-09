import ReactionAtomicView from "./ReactionAtomicView";

export default function ReactionRateApparatus({ factor, option, running, elapsed, volume, progress, completed, canRun, onStart, onReset }) {
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
          <p>Zn + 2HCl {"->"} ZnCl2 + H2</p>
        </div>
        <div className="reactionActions">
          <button type="button" className="alloyReleaseButton" onClick={onStart} disabled={running || !canRun}>
            Mula eksperimen
          </button>
          <button type="button" onClick={onReset}>Reset semua</button>
        </div>
      </div>

      <div className="reactionStage">
        <section className="reactionMacroView" aria-label="Eksperimen sebenar kadar tindak balas">
          <div className="reactionViewHeader">
            <div>
              <span>Makro view</span>
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
              <text className="reactionSvgLabel" x="665" y="78">Gas H2</text>
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
          <small>{!canRun ? "Atomic view berubah mengikut faktor. Graf kuantitatif disediakan untuk saiz bahan." : running ? "Tindak balas sedang berlaku..." : completed ? "Eksperimen selesai." : "Pilih keadaan dan tekan mula."}</small>
          <i><b style={{ width: `${progress * 100}%` }} /></i>
        </div>
      </div>
    </section>
  );
}
