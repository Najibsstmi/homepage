import { useEffect, useMemo, useState } from "react";
import "./AlloyDiscoverySimulatorPage.css";

const HOTSPOTS = [
  {
    id: "airplane",
    object: "Kapal terbang",
    kind: "alloy",
    alloy: "Duralumin",
    composition: "Aluminium, kuprum, magnesium dan mangan",
    properties: "Ringan, kuat dan tahan kakisan",
    uses: "Membuat badan kapal terbang",
    area: { left: 61.5, top: 5, width: 29, height: 14 },
  },
  {
    id: "medal",
    object: "Pingat",
    kind: "alloy",
    alloy: "Gangsa",
    composition: "Kuprum dan timah",
    properties: "Keras, tahan kakisan dan warna menarik",
    uses: "Membuat pingat, tugu dan ukiran logam",
    area: { left: 42.4, top: 76.2, width: 7.6, height: 8.8 },
  },
  {
    id: "instruments",
    object: "Alat muzik",
    kind: "alloy",
    alloy: "Loyang",
    composition: "Kuprum dan zink",
    properties: "Kuat, berkilat, mudah ditempa dan berwarna keemasan",
    uses: "Membuat alat muzik seperti trompet dan saksofon",
    area: { left: 61.5, top: 43, width: 36.5, height: 40 },
  },
  {
    id: "decorations",
    object: "Barangan hiasan",
    kind: "alloy",
    alloy: "Piuter",
    composition: "Timah, kuprum dan antimoni",
    properties: "Permukaan berkilau dan tahan kakisan",
    uses: "Membuat barangan hiasan seperti bingkai gambar dan bekas hiasan",
    area: { left: 0.7, top: 56, width: 25.5, height: 25 },
  },
  {
    id: "fence",
    object: "Pagar logam hadapan",
    kind: "alloy",
    alloy: "Keluli",
    composition: "Besi dan karbon",
    properties: "Keras dan kuat",
    uses: "Membina bangunan, jambatan, pagar dan landasan kereta api",
    area: { left: 0, top: 84.5, width: 100, height: 15.5 },
  },
  {
    id: "lamp",
    object: "Tiang lampu",
    kind: "alloy",
    alloy: "Keluli",
    composition: "Besi dan karbon",
    properties: "Keras dan kuat",
    uses: "Membuat struktur seperti tiang lampu dan pagar",
    area: { left: 2.5, top: 20, width: 8.5, height: 36 },
  },
  {
    id: "tree",
    object: "Pokok",
    kind: "non-alloy",
    message: "Ini bukan aloi. Pokok ialah organisma hidup dan tidak diperbuat daripada logam.",
    area: { left: 0, top: 0, width: 12, height: 20 },
  },
  {
    id: "cloud",
    object: "Awan",
    kind: "non-alloy",
    message: "Ini bukan aloi. Awan terdiri daripada titisan air halus di atmosfera.",
    area: { left: 78, top: 0, width: 18, height: 11 },
  },
  {
    id: "plants",
    object: "Rumput dan bunga",
    kind: "non-alloy",
    message: "Ini bukan aloi. Tumbuhan bukan logam dan bukan campuran logam.",
    area: { left: 27, top: 53, width: 14, height: 12 },
  },
  {
    id: "sky",
    object: "Langit",
    kind: "non-alloy",
    message: "Ini bukan aloi. Langit bukan bahan logam.",
    area: { left: 18, top: 13, width: 12, height: 11 },
  },
];

const ALLOYS_TO_FIND = ["Duralumin", "Gangsa", "Loyang", "Piuter", "Keluli"];

function AlloyIcon({ type }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></>,
    hint: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.4 14.7A7 7 0 1 1 15.6 14.7c-.9.7-1.4 1.7-1.6 2.3h-4c-.2-.7-.7-1.6-1.6-2.3Z" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[type]}
    </svg>
  );
}

export default function AlloyDiscoverySimulatorPage({ reviewPanel }) {
  const [foundAlloys, setFoundAlloys] = useState(() => new Set());
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [imageSource, setImageSource] = useState("/assets/aloi.png");
  const [imageUnavailable, setImageUnavailable] = useState(false);

  const isComplete = foundAlloys.size === ALLOYS_TO_FIND.length;
  const progress = Math.round((foundAlloys.size / ALLOYS_TO_FIND.length) * 100);
  const activeIsFinalFind = activeHotspot?.kind === "alloy" && isComplete;

  const orderedFoundAlloys = useMemo(
    () => ALLOYS_TO_FIND.filter((alloy) => foundAlloys.has(alloy)),
    [foundAlloys],
  );

  useEffect(() => {
    if (!activeHotspot) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveHotspot(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeHotspot]);

  const selectHotspot = (hotspot) => {
    if (hotspot.kind === "alloy") {
      setFoundAlloys((current) => {
        if (current.has(hotspot.alloy)) return current;
        const next = new Set(current);
        next.add(hotspot.alloy);
        return next;
      });
    }
    setActiveHotspot(hotspot);
  };

  const resetSimulator = () => {
    setFoundAlloys(new Set());
    setActiveHotspot(null);
    setShowHints(false);
  };

  const handleImageError = () => {
    if (imageSource.endsWith(".png")) {
      setImageSource("/assets/aloi.jpg");
      return;
    }
    setImageUnavailable(true);
  };

  return (
    <main className="alloyDiscoveryPage">
      <section className="alloyDiscoveryHero">
        <div className="alloyDiscoveryHero__copy">
          <span className="alloyDiscoveryHero__kicker">Sains Tingkatan 4 · Bab 9 Kimia Industri</span>
          <h1>ALOI: Kenali Aloi di Sekeliling Kita</h1>
          <p>Klik objek dalam gambar dan siasat bahan yang digunakan dalam kehidupan harian.</p>
        </div>
        <div className="alloyDiscoveryHero__badge" aria-label={`${foundAlloys.size} daripada 5 aloi ditemui`}>
          <span>{foundAlloys.size}</span>
          <small>/ 5 ditemui</small>
        </div>
      </section>

      {reviewPanel}

      <section className="alloyDiscoveryLayout">
        <div className="alloySceneCard">
          <div className="alloySceneCard__topline">
            <div>
              <span className="alloySceneCard__eyebrow">Zon eksplorasi</span>
              <h2>Apakah objek yang diperbuat daripada aloi?</h2>
            </div>
            <button
              type="button"
              className={`alloyHintButton${showHints ? " is-active" : ""}`}
              aria-pressed={showHints}
              onClick={() => setShowHints((current) => !current)}
            >
              <AlloyIcon type="hint" />
              {showHints ? "Sembunyi Petunjuk" : "Tunjuk Petunjuk"}
            </button>
          </div>

          <div className={`alloyScene${showHints ? " show-hints" : ""}`}>
            {!imageUnavailable ? (
              <img
                src={imageSource}
                alt="Pemandangan bandar dengan kapal terbang, pemenang pingat, alat muzik, barangan hiasan, pagar dan tiang lampu"
                onError={handleImageError}
              />
            ) : (
              <div className="alloyScene__error" role="alert">
                Gambar latar tidak dapat dimuatkan. Pastikan fail aloi.png atau aloi.jpg berada dalam folder assets.
              </div>
            )}

            {!imageUnavailable && HOTSPOTS.map((hotspot) => {
              const found = hotspot.kind === "alloy" && foundAlloys.has(hotspot.alloy);
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  className={`alloyHotspot alloyHotspot--${hotspot.kind}${found ? " is-found" : ""}`}
                  style={{
                    left: `${hotspot.area.left}%`,
                    top: `${hotspot.area.top}%`,
                    width: `${hotspot.area.width}%`,
                    height: `${hotspot.area.height}%`,
                  }}
                  aria-label={`Periksa ${hotspot.object}`}
                  onClick={() => selectHotspot(hotspot)}
                >
                  <span className="alloyHotspot__hint" aria-hidden="true" />
                  <span className="alloyHotspot__sr">{hotspot.object}</span>
                </button>
              );
            })}
          </div>

          <div className="alloySceneCard__caption">
            <AlloyIcon type="search" />
            <span>Gerakkan kursor untuk mencari objek, kemudian klik untuk menyemak jawapan.</span>
          </div>
        </div>

        <aside className="alloyMissionCard">
          <div className="alloyMissionCard__header">
            <span className="alloyMissionCard__step">Misi pencarian</span>
            <h2>Cari 5 jenis aloi</h2>
            <p>Satu jenis aloi mungkin digunakan pada lebih daripada satu objek.</p>
          </div>

          <div className="alloyProgress" aria-label={`Kemajuan ${progress}%`}>
            <div className="alloyProgress__labels">
              <span>Aloi ditemui</span>
              <strong>{foundAlloys.size} / {ALLOYS_TO_FIND.length}</strong>
            </div>
            <div className="alloyProgress__track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="alloyChecklist" aria-label="Senarai aloi yang perlu dicari">
            {ALLOYS_TO_FIND.map((alloy) => {
              const found = orderedFoundAlloys.includes(alloy);
              return (
                <li key={alloy} className={found ? "is-found" : ""}>
                  <span className="alloyChecklist__box">
                    {found && <AlloyIcon type="check" />}
                  </span>
                  <span>{alloy}</span>
                  {found && <small>Ditemui</small>}
                </li>
              );
            })}
          </ul>

          {isComplete && (
            <div className="alloyMissionComplete" role="status">
              <span>🎉</span>
              <p><strong>Syabas!</strong> Semua jenis aloi telah ditemui.</p>
            </div>
          )}

          <button type="button" className="alloyResetButton" onClick={resetSimulator}>
            <AlloyIcon type="reset" />
            Reset Simulator
          </button>
        </aside>
      </section>

      {activeHotspot && (
        <div className="alloyModalBackdrop" role="presentation" onMouseDown={() => setActiveHotspot(null)}>
          <section
            className={`alloyInfoModal alloyInfoModal--${activeHotspot.kind}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alloy-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="alloyInfoModal__close"
              aria-label="Tutup popup"
              onClick={() => setActiveHotspot(null)}
            >
              <AlloyIcon type="close" />
            </button>

            {activeIsFinalFind && (
              <div className="alloyCelebration" role="status">
                <span>🎊</span>
                <p>Tahniah! Anda berjaya mengenal pasti semua aloi di sekitar kita.</p>
              </div>
            )}

            <div className="alloyInfoModal__heading">
              <span className="alloyInfoModal__symbol">
                {activeHotspot.kind === "alloy" ? "⚙️" : "🌿"}
              </span>
              <div>
                <span className="alloyInfoModal__status">
                  {activeHotspot.kind === "alloy" ? "Aloi" : "Bukan Aloi"}
                </span>
                <h2 id="alloy-modal-title">{activeHotspot.object}</h2>
              </div>
            </div>

            {activeHotspot.kind === "alloy" ? (
              <div className="alloyInfoModal__content">
                <div className="alloyNamePlate">
                  <span>Nama aloi</span>
                  <strong>{activeHotspot.alloy}</strong>
                </div>
                <dl className="alloyFacts">
                  <div>
                    <dt>Komposisi</dt>
                    <dd>{activeHotspot.composition}</dd>
                  </div>
                  <div>
                    <dt>Sifat</dt>
                    <dd>{activeHotspot.properties}</dd>
                  </div>
                  <div>
                    <dt>Kegunaan</dt>
                    <dd>{activeHotspot.uses}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="alloyCorrection">{activeHotspot.message}</p>
            )}

            <button type="button" className="alloyModalDoneButton" onClick={() => setActiveHotspot(null)}>
              Tutup
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
