export default function ElectrolysisApparatus({
  hasPowder,
  burnerOn,
  circuitOn,
  bulbOn,
  learningMessage,
  onDropMaterial,
  onToggleBurner,
  onToggleCircuit,
}) {
  const molten = hasPowder && burnerOn;

  const handleDrop = (event, target) => {
    event.preventDefault();
    onDropMaterial(event.dataTransfer.getData("text/plain"), target);
  };

  const stageClassName = [
    "electroSvgDrop",
    "electroStaticScene",
    hasPowder ? "electroStaticScene--powder" : "",
    molten ? "electroStaticScene--molten" : "",
    burnerOn ? "electroStaticScene--heated" : "",
    circuitOn ? "electroStaticScene--circuitOn" : "",
    bulbOn ? "electroStaticScene--bulbOn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="electroPanel electroApparatus" aria-label="Radas elektrolisis leburan Plumbum (II) bromida">
      <div className="electroApparatus__top">
        <div>
          <h2>Radas elektrolisis PbBr₂</h2>
          <p>Status bahan: {molten ? "Leburan PbBr₂" : hasPowder ? "Serbuk PbBr₂" : "Belum dimasukkan"}</p>
        </div>
        <button
          type="button"
          className={`burnerSwitch ${circuitOn ? "burnerSwitch--on" : "burnerSwitch--off"}`}
          onClick={onToggleCircuit}
          disabled={!hasPowder}
        >
          <span>{circuitOn ? "LITAR ON" : "LITAR OFF"}</span>
          <i />
        </button>
      </div>

      <div
        className={stageClassName}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, "apparatus")}
        role="img"
        aria-label="Radas elektrolisis Plumbum (II) bromida dengan bateri, suis, mentol, elektrod karbon, mangkuk pijar dan penunu Bunsen"
      >
        <div className="electroSceneInstruction">
          <strong>Langkah sekarang</strong>
          <p>{learningMessage}</p>
        </div>

        <span className="electroBulbGlow" aria-hidden="true" />
        <span className="electroHeatGlow" aria-hidden="true" />
        <span className="electroFlame" aria-hidden="true" />
        <span className="electroSwitchOpenMask" aria-hidden="true" />
        <span className="electroSwitchBlade" aria-hidden="true" />

        {hasPowder && (
          <span className="electroPbMaterial" aria-hidden="true" />
        )}

        {bulbOn && (
          <p className="electroBulbNote">
            Mentol menyala kerana ion Pb²⁺ dan Br⁻ bebas bergerak dalam leburan PbBr₂ lalu membawa cas elektrik.
          </p>
        )}

        <div className="burnerControlDock">
          <button
            type="button"
            className={`burnerSwitch ${burnerOn ? "burnerSwitch--on" : "burnerSwitch--off"}`}
            onClick={onToggleBurner}
            disabled={!hasPowder}
            aria-label={burnerOn ? "Matikan penunu Bunsen" : "Hidupkan penunu Bunsen"}
          >
            <span>{burnerOn ? "MATIKAN PENUNU" : "HIDUPKAN PENUNU"}</span>
            <i />
          </button>
        </div>
      </div>
    </section>
  );
}
