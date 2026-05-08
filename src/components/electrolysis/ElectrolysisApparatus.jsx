export default function ElectrolysisApparatus({
  hasPowder,
  hasBurner,
  hasElectrodes,
  burnerOn,
  circuitOn,
  bulbOn,
  onDropMaterial,
  onToggleBurner,
  onToggleCircuit,
}) {
  const molten = hasPowder && hasElectrodes && burnerOn;

  const handleDrop = (event, target) => {
    event.preventDefault();
    onDropMaterial(event.dataTransfer.getData("text/plain"), target);
  };

  return (
    <section className="electroPanel electroApparatus" aria-label="Radas elektrolisis leburan plumbum bromida">
      <div className="electroApparatus__top">
        <div>
          <h2>Radas elektrolisis PbBr₂</h2>
          <p>Status bahan: {molten ? "Leburan PbBr₂" : hasPowder ? "Pepejal PbBr₂" : "Belum dimasukkan"}</p>
        </div>
        <button
          type="button"
          className={`burnerSwitch ${circuitOn ? "burnerSwitch--on" : "burnerSwitch--off"}`}
          onClick={onToggleCircuit}
          disabled={!hasPowder || !hasElectrodes}
        >
          <span>{circuitOn ? "LITAR ON" : "LITAR OFF"}</span>
          <i />
        </button>
      </div>

      <div
        className="electroSvgDrop"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, "apparatus")}
      >
        <svg className="electroSvg" viewBox="0 0 900 590" role="img" aria-label="Radas elektrolisis dengan bateri, mentol, elektrod dan mangkuk pijar">
          <defs>
            <radialGradient id="bulbGlow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <linearGradient id="moltenPb" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <rect className="apparatusBg" x="0" y="0" width="900" height="590" rx="28" />
          <g className="battery">
            <rect x="370" y="38" width="160" height="44" rx="10" />
            <line x1="422" y1="30" x2="422" y2="90" />
            <line x1="478" y1="42" x2="478" y2="78" />
            <text x="450" y="22">Bateri</text>
            <text x="403" y="66">+</text>
            <text x="495" y="66">-</text>
          </g>

          <path className="wire" d="M 370 60 H 262" />
          <path className="wire" d="M 170 60 H 54 V 132 H 87" />
          <path className="wire" d="M 230 132 H 149" />
          <path className="wire" d="M 230 132 V 238 H 306" />
          <path className="wire" d="M 530 60 H 716 V 180 H 626 V 248" />
          <text className="apparatusLabel" x="674" y="88">Wayar penyambung</text>
          <g className={`circuitSwitch ${circuitOn ? "circuitSwitch--on" : ""}`} transform="translate(170 60)">
            <line x1="0" y1="0" x2="38" y2="0" />
            <line x1="58" y1="0" x2="92" y2="0" />
            <line className="switchBlade" x1="38" y1="0" x2="58" y2={circuitOn ? 0 : -18} />
            <text x="46" y="-24">Suis</text>
          </g>

          <g className={`bulb ${bulbOn ? "bulb--on" : ""}`}>
            <circle cx="118" cy="132" r="31" />
            <path d="M 100 164 H 136" />
            <text x="118" y="192">Mentol</text>
          </g>

          {hasElectrodes ? (
            <g className="electrodes carbonRods">
              <rect x="306" y="176" width="20" height="154" rx="6" />
              <rect x="616" y="176" width="20" height="154" rx="6" />
              <text x="316" y="154">Elektrod karbon</text>
              <text x="626" y="154">Elektrod karbon</text>
            </g>
          ) : (
            <g className="electrodeGhost">
              <rect x="306" y="176" width="20" height="154" rx="6" />
              <rect x="616" y="176" width="20" height="154" rx="6" />
              <text x="466" y="228">Seret elektrod karbon ke sini</text>
            </g>
          )}

          <g
            className="crucibleDrop"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, "crucible")}
          >
            <path className="crucible" d="M 260 318 H 660 L 612 424 H 310 Z" />
            <path className="crucibleLip" d="M 238 314 H 684" />
            {hasPowder && !molten && (
              <path className="solidPb" d="M 310 358 C 356 342 420 366 468 354 C 528 338 572 358 616 348 L 596 398 H 330 Z" />
            )}
            {molten && (
              <>
                <path className="moltenPb" d="M 310 358 C 356 342 420 366 468 354 C 528 338 572 358 616 348 L 596 398 H 330 Z" />
                <g className="moltenIons">
                  <text x="372" y="378">Pb²⁺</text>
                  <text x="446" y="366">Br⁻</text>
                  <text x="520" y="386">Pb²⁺</text>
                  <text x="574" y="370">Br⁻</text>
                </g>
                <g className="heatVapour">
                  <path d="M 390 312 C 368 288 408 276 386 250" />
                  <path d="M 470 312 C 448 288 490 278 468 252" />
                  <path d="M 550 312 C 528 286 570 276 550 248" />
                </g>
              </>
            )}
            <text x="460" y="458">Mangkuk pijar</text>
          </g>

          <g className="tripod">
            <line x1="334" y1="432" x2="258" y2="536" />
            <line x1="594" y1="432" x2="678" y2="536" />
            <line x1="314" y1="432" x2="612" y2="432" />
            <text x="700" y="510">Kaki tiga</text>
          </g>

          {hasBurner && (
            <g className="burner burner--real" transform="translate(414 340)">
              {burnerOn && (
                <g className="flame">
                  <path d="M 48 0 C 8 48 24 86 48 102 C 74 84 88 48 48 0" />
                  <path d="M 48 30 C 28 58 36 84 48 92 C 62 76 68 56 48 30" />
                </g>
              )}
              <rect x="30" y="92" width="36" height="76" rx="8" />
              <rect x="16" y="162" width="64" height="18" rx="7" />
              <rect x="0" y="176" width="96" height="16" rx="8" />
              <text x="48" y="220">Penunu Bunsen</text>
            </g>
          )}

          <text className="materialLabel" x="180" y="372">
            {molten ? "Leburan plumbum(II) bromida, PbBr₂" : hasPowder ? "Pepejal plumbum(II) bromida, PbBr₂" : "Seret PbBr₂ ke mangkuk pijar"}
          </text>
          <text className="apparatusLabel" x="460" y="302">Bahan PbBr₂</text>
        </svg>

        {hasBurner && (
          <div className="burnerControlDock">
            <button
              type="button"
              className={`burnerSwitch ${burnerOn ? "burnerSwitch--on" : "burnerSwitch--off"}`}
              onClick={onToggleBurner}
              disabled={!hasPowder || !hasElectrodes}
              aria-label={burnerOn ? "Matikan penunu Bunsen" : "Hidupkan penunu Bunsen"}
            >
              <span>{burnerOn ? "PENUNU ON" : "PENUNU OFF"}</span>
              <i />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
