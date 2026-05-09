import ReactionParticles from "./ReactionParticles";

export default function ReactionRateApparatus({ factor, option, running, elapsed, volume, progress, completed, canRun, onStart, onReset }) {
  const bubbleCount = Math.min(18, Math.max(4, Math.round(option.rate * 10)));
  const rateLevel = option.rate;
  const zincTotal = option.id === "powder" ? 30 : 10;
  const zincCount = completed ? (option.id === "large" ? 1 : 0) : Math.max(0, Math.ceil(zincTotal * (1 - progress * 0.94)));
  const gasHeight = Math.min(132, volume * 1.9);
  const waterLevel = 358;
  const buretGasTop = waterLevel - gasHeight;

  return (
    <section className="electroPanel reactionApparatus">
      <div className="reactionApparatus__top">
        <div>
          <h2>Radas Eksperimen</h2>
          <p>Zn + 2HCl {'->'} ZnCl2 + H2</p>
        </div>
        <div className="reactionActions">
          <button type="button" className="alloyReleaseButton" onClick={onStart} disabled={running || !canRun}>
            <span>▶</span>
            Mula eksperimen
          </button>
          <button type="button" onClick={onReset}>Reset semua</button>
        </div>
      </div>

      <div className="reactionStage">
        <svg viewBox="0 0 980 560" role="img" aria-label="Radas kadar tindak balas zink dan asid hidroklorik dengan buret terbalik">
          <defs>
            <linearGradient id="acidGradient" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.46" />
            </linearGradient>
            <linearGradient id="glassGradient" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.18" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="zincGradient" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          <rect className="reactionStageBg" x="0" y="0" width="980" height="560" rx="28" />

          <text className="reactionSvgMetric reactionSvgMetric--time" x="42" y="54">{elapsed}s</text>

          <g className="reactionRetortGroup">
            <line className="reactionRetort" x1="826" y1="88" x2="826" y2="460" />
            <rect className="reactionRetortBase" x="746" y="462" width="160" height="18" rx="4" />
            <line className="reactionRetortArm" x1="514" y1="176" x2="872" y2="176" />
            <rect className="reactionClamp" x="555" y="151" width="48" height="50" rx="7" />
            <rect className="reactionClamp" x="806" y="151" width="48" height="50" rx="7" />
            <text className="reactionSvgLabel" x="858" y="308">Kaki retort</text>
            <path className="reactionLeader" d="M 850 302 L 826 302" />
          </g>

          <g className="reactionBuretSetup">
            <path className="reactionBasin" d="M 472 332 Q 472 314 490 314 L 754 314 Q 772 314 772 332 L 760 422 Q 756 448 730 448 L 518 448 Q 492 448 488 422 Z" />
            <path className="reactionBasinWater" d="M 494 356 C 552 342, 624 370, 748 354 L 738 418 Q 734 434 718 436 L 528 436 Q 512 434 508 418 Z" />
            {Array.from({ length: 10 }, (_, index) => (
              <line key={index} className="reactionWaterLine" x1="508" x2="738" y1={374 + index * 6} y2={374 + index * 6} />
            ))}
            <text className="reactionSvgLabel" x="394" y="384">Besen</text>
            <path className="reactionLeader" d="M 450 378 L 502 378" />
            <text className="reactionSvgLabel" x="394" y="426">Air</text>
            <path className="reactionLeader" d="M 424 420 L 506 420" />

            <rect className="reactionBuret" x="574" y="58" width="38" height="320" rx="17" />
            <rect className="reactionBuretGas" x="581" y={buretGasTop} width="24" height={Math.max(4, gasHeight)} rx="10" />
            <line className="reactionBuretStem" x1="592" y1="50" x2="592" y2="20" />
            <line className="reactionBuretStem" x1="606" y1="50" x2="606" y2="20" />
            <rect className="reactionBuretTap" x="566" y="52" width="56" height="18" rx="8" />
            <circle className="reactionBuretTapKnob" cx="560" cy="61" r="7" />
            {Array.from({ length: 15 }, (_, index) => (
              <line
                key={index}
                className={index % 5 === 0 ? "reactionBuretMark reactionBuretMark--major" : "reactionBuretMark"}
                x1="577"
                x2={index % 5 === 0 ? "604" : "594"}
                y1={88 + index * 17}
                y2={88 + index * 17}
              />
            ))}
            <text className="reactionSvgLabel" x="640" y="104">Gas H2</text>
            <path className="reactionLeader" d="M 630 102 L 606 142" />
            <text className="reactionSvgLabel" x="632" y="260">Buret</text>
            <path className="reactionLeader" d="M 624 254 L 604 254" />
            <text className="reactionSvgMetric" x="706" y="70">{volume.toFixed(1)} cm3</text>
          </g>

          <g className="reactionFlaskSetup">
            <path className="reactionTube" d="M 258 230 L 258 118 Q 258 92 284 92 L 382 92 Q 398 92 410 105 L 592 342" />
            <path className="reactionTubeInside" d="M 270 230 L 270 126 Q 270 106 290 106 L 376 106 Q 388 106 397 116 L 582 346" />
            <text className="reactionSvgLabel" x="38" y="112">Salur penghantar</text>
            <path className="reactionLeader" d="M 188 110 L 258 110" />

            <path className="reactionFlask" d="M 198 226 L 306 226 L 306 292 L 362 424 Q 376 462 334 466 L 170 466 Q 128 462 142 424 L 198 292 Z" />
            <path className="reactionLiquid" d="M 166 406 C 208 386, 270 422, 338 400 L 350 430 Q 358 452 330 454 L 174 454 Q 146 452 154 430 Z" />
            <rect className="reactionStopper" x="202" y="202" width="96" height="36" rx="9" />
            <text className="reactionSvgLabel" x="44" y="342">Ketulan zink</text>
            <path className="reactionLeader" d="M 150 338 L 194 412" />
            <text className="reactionSvgLabel" x="182" y="516">Asid hidroklorik cair</text>
            <path className="reactionLeader" d="M 272 494 L 258 434" />
            <text className="reactionSvgLabel reactionSvgLabel--center" x="252" y="540">Jisim Zn tetap: 5 g</text>

            {Array.from({ length: bubbleCount }, (_, index) => (
              <circle
                key={index}
                className={running ? "reactionBubble reactionBubble--run" : "reactionBubble"}
                cx={188 + (index % 7) * 22}
                cy={402 - (index % 5) * 18}
                r={4 + (index % 3)}
                opacity={running || volume > 0 ? 1 : 0}
                style={{ animationDelay: `${index * -0.16}s`, animationDuration: `${Math.max(0.7, 1.55 - option.rate * 0.36)}s` }}
              />
            ))}

            {Array.from({ length: zincCount }, (_, index) => (
              <rect
                key={index}
                className={option.id === "powder" ? "reactionZinc reactionZinc--powder" : "reactionZinc"}
                x={174 + (index % 8) * 20}
                y={428 + Math.floor(index / 8) * 10}
                width={option.id === "large" ? 20 : 7}
                height={option.id === "large" ? 11 : 5}
                rx="3"
              />
            ))}
          </g>
        </svg>

        <ReactionParticles running={running} rateLevel={rateLevel} />
        <div className="reactionRunCard">
          <span>Status eksperimen</span>
          <strong>{option.label}</strong>
          <small>{!canRun ? "MVP perbandingan lengkap menggunakan faktor Saiz bahan." : running ? "Tindak balas sedang berlaku..." : completed ? "Eksperimen selesai." : "Pilih keadaan dan tekan mula."}</small>
          <i><b style={{ width: `${progress * 100}%` }} /></i>
        </div>
      </div>
    </section>
  );
}
