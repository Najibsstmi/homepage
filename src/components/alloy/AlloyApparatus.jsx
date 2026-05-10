import { alloyMaterials, getIndentDepth } from "../../data/alloyQuestions";

export default function AlloyApparatus({
  selectedMaterial,
  dropping,
  latestResult,
  completed,
  onDropItem,
  onRelease,
  onReset,
}) {
  const material = selectedMaterial ? alloyMaterials[selectedMaterial] : null;
  const previewDepth = selectedMaterial ? getIndentDepth(selectedMaterial) : 0;
  const depth = latestResult ? latestResult.depth : previewDepth;
  const dentScale = Math.min(Math.max(depth / 7, 0.18), 1);
  const showDent = Boolean(latestResult && latestResult.materialId === selectedMaterial && !dropping);
  const impactClass =
    latestResult && !dropping
      ? latestResult.materialId === "pure"
        ? "alloySteelBall--impactPure"
        : "alloySteelBall--impactAlloy"
      : "";
  const dropClass = dropping ? (selectedMaterial === "pure" ? "alloySteelBall--dropPure" : "alloySteelBall--dropAlloy") : "";
  const ballClass = ["alloySteelBall", impactClass, dropClass]
    .filter(Boolean)
    .join(" ");

  const handleDrop = (event) => {
    event.preventDefault();
    onDropItem(event.dataTransfer.getData("text/plain"));
  };

  return (
    <section className="electroPanel alloyApparatus" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <div className="alloyApparatus__top">
        <div>
          <h2>Radas Ujian Kekerasan</h2>
          <p>{material ? `Bongkah dipilih: ${material.label}` : "Seret atau pilih jenis bongkah untuk memulakan eksperimen."}</p>
        </div>
        <div className="alloyApparatus__actions">
          <button className="alloyReleaseButton" type="button" onClick={onRelease} disabled={!selectedMaterial || dropping}>
            <span aria-hidden="true">1kg</span>
            Lepaskan bebola keluli
          </button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="alloyRig" aria-label="Simulasi bebola keluli dijatuhkan ke atas bongkah">
        <svg viewBox="0 0 760 500" role="img" aria-label="Radas eksperimen mengkaji kedalaman lekukan">
          <defs>
            <linearGradient id="alloyBlockPure" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="alloyBlockMixed" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
            <radialGradient id="steelBallGrad">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="68%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
          </defs>

          <rect className="alloyRig__bg" x="0" y="0" width="760" height="500" rx="26" />
          <line className="alloyStand" x1="130" y1="34" x2="130" y2="416" />
          <line className="alloyStand" x1="78" y1="416" x2="688" y2="416" />
          <line className="alloyStand alloyStand--rod" x1="130" y1="72" x2="430" y2="72" />
          <rect className="alloyClamp" x="112" y="52" width="36" height="54" rx="8" />
          <rect className="alloyClamp" x="405" y="58" width="52" height="30" rx="8" />
          <circle className="alloyClampBolt" cx="462" cy="73" r="8" />
          <line className="alloyString" x1="420" y1="86" x2="420" y2="182" />
          <line className="alloyGuide" x1="420" y1="88" x2="420" y2="324" />
          <text className="alloySvgLabel" x="158" y="48">Kaki retort</text>
          <text className="alloySvgLabel" x="468" y="76">Clamp dan benang</text>

          <g transform="translate(420 182)">
            <g className={ballClass}>
              <circle r="30" />
              <ellipse cx="-10" cy="-10" rx="9" ry="6" />
              <text className="alloyBallMass" x="0" y="54">1 kg</text>
            </g>
          </g>
          <text className="alloySvgLabel alloySvgLabel--center" x="420" y="132">Bebola keluli 1 kg</text>

          <g transform="translate(265 324)">
            <ellipse className="alloyBlockShadow" cx="155" cy="92" rx="190" ry="18" />
            <rect
              className={`alloyBlock alloyBlock--${selectedMaterial || "empty"}`}
              x="0"
              y="0"
              width="310"
              height="92"
              rx="16"
            />
            {showDent && (
              <ellipse
                className="alloyDent"
                cx="155"
                cy="8"
                rx={42 + dentScale * 18}
                ry={8 + dentScale * 20}
              />
            )}
            {!selectedMaterial && <text className="alloyDropHint" x="155" y="52">Letak bongkah di sini</text>}
            {selectedMaterial && (
              <>
                <text className="alloyBlockText" x="155" y="58">{material.shortLabel}</text>
                {showDent && <text className="alloyDepthText" x="155" y="120">Lekukan: {depth.toFixed(1)} mm</text>}
              </>
            )}
          </g>
        </svg>
      </div>

      {completed && <div className="alloyBadge">Aloi lebih keras</div>}
    </section>
  );
}
