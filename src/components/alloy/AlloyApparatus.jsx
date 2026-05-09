import { alloyMaterials, getIndentDepth } from "../../data/alloyQuestions";

export default function AlloyApparatus({
  selectedMaterial,
  ballPlaced,
  dropHeight,
  dropping,
  latestResult,
  completed,
  onDropItem,
  onRelease,
  onReset,
}) {
  const material = selectedMaterial ? alloyMaterials[selectedMaterial] : null;
  const previewDepth = selectedMaterial ? getIndentDepth(selectedMaterial, dropHeight) : 0;
  const depth = latestResult ? latestResult.depth : previewDepth;
  const dentScale = Math.min(Math.max(depth / 7, 0.18), 1);
  const impactClass =
    latestResult && !ballPlaced && !dropping
      ? latestResult.materialId === "pure"
        ? "alloySteelBall--impactPure"
        : "alloySteelBall--impactAlloy"
      : "";
  const ballClass = ["alloySteelBall", impactClass, ballPlaced ? "alloySteelBall--placed" : "", dropping ? "alloySteelBall--drop" : ""]
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
          <button type="button" onClick={onRelease} disabled={!selectedMaterial || !ballPlaced || dropping}>
            Lepaskan bebola
          </button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="alloyRig" aria-label="Simulasi bebola keluli dijatuhkan ke atas bongkah">
        <svg viewBox="0 0 760 430" role="img" aria-label="Radas eksperimen mengkaji kedalaman lekukan">
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

          <rect className="alloyRig__bg" x="0" y="0" width="760" height="430" rx="26" />
          <line className="alloyStand" x1="128" y1="70" x2="128" y2="342" />
          <line className="alloyStand" x1="88" y1="342" x2="668" y2="342" />
          <line className="alloyGuide" x1="360" y1="92" x2="360" y2="218" />
          <text className="alloySvgLabel" x="148" y="82">Kaki retort</text>
          <text className="alloySvgLabel" x="382" y="126">Laluan jatuhan</text>

          <g transform="translate(360 104)">
            <g className={ballClass}>
              <circle r="30" />
              <ellipse cx="-10" cy="-10" rx="9" ry="6" />
            </g>
          </g>
          <text className="alloySvgLabel alloySvgLabel--center" x="360" y="52">Bebola keluli</text>

          <g transform="translate(225 252)">
            <ellipse className="alloyBlockShadow" cx="155" cy="92" rx="190" ry="18" />
            <rect
              className={`alloyBlock alloyBlock--${selectedMaterial || "empty"}`}
              x="0"
              y="0"
              width="310"
              height="92"
              rx="16"
            />
            {selectedMaterial && (
              <ellipse
                className="alloyDent"
                cx="155"
                cy="18"
                rx={42 + dentScale * 18}
                ry={8 + dentScale * 20}
              />
            )}
            {!selectedMaterial && <text className="alloyDropHint" x="155" y="52">Letak bongkah di sini</text>}
            {selectedMaterial && (
              <>
                <text className="alloyBlockText" x="155" y="58">{material.shortLabel}</text>
                <text className="alloyDepthText" x="155" y="120">Lekukan: {depth.toFixed(1)} mm</text>
              </>
            )}
          </g>
        </svg>
      </div>

      {completed && <div className="alloyBadge">Aloi lebih keras</div>}
    </section>
  );
}
