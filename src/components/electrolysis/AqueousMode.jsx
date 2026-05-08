import IonAnimation from "./IonAnimation";

export default function AqueousMode({
  aqueousItems,
  circuitOn,
  showIons,
  onDropMaterial,
  onToggleCircuit,
  onToggleIons,
}) {
  const ready = aqueousItems.water && aqueousItems.powder && aqueousItems.electrodes;
  const bulbOn = ready && circuitOn;

  const handleDrop = (event) => {
    event.preventDefault();
    onDropMaterial(event.dataTransfer.getData("text/plain"));
  };

  return (
    <section className="electroPanel aqueousPanel">
      <div className="electroApparatus__top">
        <div>
          <h2>Mode Akueus NaCl</h2>
          <p>
            {bulbOn
              ? "Larutan akueus NaCl mengkonduksikan elektrik. Mentol menyala."
              : ready
                ? "Radas lengkap. Hidupkan suis litar untuk menyalakan mentol."
                : "Masukkan air suling, NaCl dan elektrod karbon ke dalam bikar."}
          </p>
        </div>
        <div className="aqueousActions">
          <label>
            <input type="checkbox" checked={showIons} onChange={(event) => onToggleIons(event.target.checked)} />
            Pamerkan pergerakan ion
          </label>
          <button
            type="button"
            className={`burnerSwitch ${circuitOn ? "burnerSwitch--on" : "burnerSwitch--off"}`}
            disabled={!ready}
            onClick={onToggleCircuit}
          >
            <span>{circuitOn ? "LITAR ON" : "LITAR OFF"}</span>
            <i />
          </button>
        </div>
      </div>

      <div className="electroSvgDrop" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <svg className="electroSvg" viewBox="0 0 900 560" role="img" aria-label="Radas elektrolisis akueus natrium klorida">
          <rect className="apparatusBg" x="0" y="0" width="900" height="560" rx="28" />
          <g className="battery">
            <rect x="370" y="38" width="160" height="44" rx="10" />
            <line x1="422" y1="30" x2="422" y2="90" />
            <line x1="478" y1="42" x2="478" y2="78" />
            <text x="450" y="22">Bateri</text>
            <text x="403" y="66">+</text>
            <text x="495" y="66">-</text>
          </g>

          <path className="wire" d="M 370 60 H 358" />
          <path className="wire" d="M 266 60 H 238 V 118" />
          <path className="wire" d="M 530 60 H 650 V 150 H 592" />
          <path className="wire" d="M 238 118 V 150 H 312" />
          <text className="apparatusLabel" x="674" y="92">Wayar penyambung</text>
          <g className={`circuitSwitch ${circuitOn ? "circuitSwitch--on" : ""}`} transform="translate(266 60)">
            <line x1="0" y1="0" x2="38" y2="0" />
            <line x1="58" y1="0" x2="92" y2="0" />
            <line className="switchBlade" x1="38" y1="0" x2="58" y2={circuitOn ? 0 : -18} />
            <text x="46" y="-24">Suis</text>
          </g>

          <g className={`bulb ${bulbOn ? "bulb--on" : ""}`}>
            <circle cx="112" cy="118" r="31" />
            <path d="M 94 150 H 130" />
            <text x="112" y="180">Mentol</text>
          </g>
          <path className="wire" d="M 238 118 H 143" />
          <path className="wire" d="M 81 118 H 52 V 60 H 370" />

          <g className="beaker">
            <path className="beakerWall" d="M 260 170 V 420 C 260 462 642 462 642 420 V 170" />
            <path className="beakerLip" d="M 244 170 C 348 158 548 158 658 170" />
            <text x="450" y="492">Bikar</text>
            {aqueousItems.water && <path className="aqueousLiquid" d="M 282 284 C 350 270 420 298 486 280 C 552 264 610 284 624 280 V 414 C 624 438 282 438 282 414 Z" />}
            {aqueousItems.powder && <text className="aqueousSolute" x="452" y="350">NaCl(aq)</text>}
            {aqueousItems.electrodes ? (
              <g className="electrodes">
                <rect x="304" y="150" width="16" height="220" rx="5" />
                <rect x="584" y="150" width="16" height="220" rx="5" />
                <text x="280" y="138">Anod karbon</text>
                <text x="630" y="138">Katod karbon</text>
              </g>
            ) : (
              <g className="electrodeGhost">
                <rect x="304" y="150" width="16" height="220" rx="5" />
                <rect x="584" y="150" width="16" height="220" rx="5" />
                <text x="452" y="228">Seret elektrod karbon ke sini</text>
              </g>
            )}
            {(showIons || bulbOn) && <IonAnimation active={bulbOn} cation="Na⁺" anion="Cl⁻" />}
          </g>

          <text className="materialLabel" x="450" y="526">Larutan akueus natrium klorida, NaCl</text>
        </svg>
      </div>
    </section>
  );
}
