import { useState } from "react";
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
  const [dragActive, setDragActive] = useState(false);
  const material = selectedMaterial ? alloyMaterials[selectedMaterial] : null;
  const previewDepth = selectedMaterial ? getIndentDepth(selectedMaterial) : 0;
  const depth = latestResult ? latestResult.depth : previewDepth;
  const dentScale = Math.min(Math.max(depth / 7, 0.18), 1);
  const showDent = Boolean(latestResult && latestResult.materialId === selectedMaterial && !dropping);
  const weightReleased = dropping || showDent;
  const showWeightOverlay = dropping || showDent;
  const sceneClass = [
    "alloyScene",
    weightReleased ? "alloyScene--released" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sceneImageSrc = weightReleased ? "/assets/background aloi released.png" : "/assets/background aloi.png";
  const dropTargetClass = [
    "alloyDropTarget",
    dragActive ? "alloyDropTarget--active" : "",
    selectedMaterial ? "alloyDropTarget--filled" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const specimenStyle = {
    "--dent-width": `${34 + dentScale * 24}%`,
    "--dent-height": `${18 + dentScale * 30}%`,
    "--dent-left": "68%",
  };
  const weightClass = [
    "alloyFallingWeight",
    dropping ? `alloyFallingWeight--drop${selectedMaterial === "pure" ? "Pure" : "Alloy"}` : "",
    showDent ? `alloyFallingWeight--resting alloyFallingWeight--resting${selectedMaterial === "pure" ? "Pure" : "Alloy"}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    onDropItem(event.dataTransfer.getData("text/plain"));
  };

  return (
    <section className="electroPanel alloyApparatus">
      <div className="alloyApparatus__top">
        <div>
          <h2>Radas Ujian Kekerasan</h2>
          <p>{material ? `Bongkah dipilih: ${material.label}` : "Seret jenis bongkah ke ruang bertanda di tengah meja."}</p>
        </div>
        <div className="alloyApparatus__actions">
          <button className="alloyReleaseButton" type="button" onClick={onRelease} disabled={!selectedMaterial || dropping}>
            <span aria-hidden="true">1 kg</span>
            Jatuhkan pemberat
          </button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="alloyRig">
        <div className={sceneClass} aria-label="Simulasi pemberat dijatuhkan ke atas bongkah di tengah radas">
          <img
            className="alloyScene__image"
            src={sceneImageSrc}
            alt=""
            draggable="false"
          />

          <div
            className={dropTargetClass}
            aria-label="Kawasan tengah untuk meletakkan bongkah"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!selectedMaterial && <span>Seret bongkah ke sini</span>}
          </div>

          {selectedMaterial && (
            <div className={`alloySpecimen alloySpecimen--${selectedMaterial}`} style={specimenStyle}>
              {showDent && <span className="alloySpecimen__dent" aria-hidden="true" />}
              <span className="alloySpecimen__label">{material.shortLabel}</span>
            </div>
          )}

          {showWeightOverlay && (
            <div className={weightClass} aria-hidden="true">
              <span>1 kg</span>
            </div>
          )}

          {showDent && (
            <div className="alloyMeasureCue">
              <strong>Langkah 2</strong>
              Ukur kedalaman lekukan di bawah
            </div>
          )}
        </div>
      </div>

      {showDent && (
        <div className="alloyMeasureNext">
          <div>
            <strong>Teruskan dengan ukuran</strong>
            <span>Masukkan bacaan kedalaman lekukan sebelum keputusan dipaparkan.</span>
          </div>
          <a href="#alloy-measurement">Pergi ke borang ukuran</a>
        </div>
      )}

      {completed && <div className="alloyBadge">Aloi lebih keras</div>}
    </section>
  );
}
