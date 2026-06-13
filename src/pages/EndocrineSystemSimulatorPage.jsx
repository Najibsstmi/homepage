import { useEffect, useMemo, useState } from "react";

const endocrineGlands = [
  {
    id: "pituitary",
    label: "Pituitari",
    shortLabel: "Pi",
    location: "Bahagian otak",
    hormone: "Hormon pertumbuhan",
    color: "#f9a8d4",
    source: { x: 50, y: 16 },
    markers: [{ x: 50, y: 16, scale: 0.86 }],
    targets: [
      {
        name: "Tulang",
        type: "bone",
        x: 48,
        y: 93,
        response: "Pertumbuhan tulang dirangsang.",
        detail: "Tulang membesar dan memanjang dengan lebih teratur.",
      },
      {
        name: "Otot",
        type: "muscle",
        x: 33,
        y: 55,
        response: "Jisim otot dikekalkan.",
        detail: "Otot menerima isyarat untuk menyokong pertumbuhan badan.",
      },
    ],
    effects: [
      "Merangsang pertumbuhan.",
      "Mengekalkan jisim otot dan tulang.",
    ],
  },
  {
    id: "thyroid",
    label: "Tiroid",
    shortLabel: "Ti",
    location: "Leher",
    hormone: "Tiroksina",
    color: "#fb7185",
    source: { x: 50, y: 25 },
    markers: [{ x: 50, y: 25, scale: 0.9 }],
    targets: [
      {
        name: "Sel badan",
        type: "cell",
        x: 62,
        y: 55,
        response: "Metabolisme sel dikawal.",
        detail: "Sel menggunakan tenaga pada kadar yang sesuai.",
      },
      {
        name: "Pertumbuhan badan",
        type: "growth",
        x: 38,
        y: 64,
        response: "Perkembangan fizikal dan mental disokong.",
        detail: "Badan menerima isyarat untuk berkembang secara seimbang.",
      },
    ],
    effects: [
      "Mengawal kadar metabolisme.",
      "Mengawal pertumbuhan dan perkembangan fizikal serta mental.",
    ],
  },
  {
    id: "adrenal",
    label: "Adrenal",
    shortLabel: "Ad",
    location: "Atas ginjal",
    hormone: "Adrenalin",
    color: "#f59e0b",
    source: { x: 50, y: 54 },
    markers: [
      { x: 42, y: 53, scale: 0.8 },
      { x: 58, y: 53, scale: 0.8 },
    ],
    targets: [
      {
        name: "Jantung",
        type: "heart",
        x: 50,
        y: 39,
        response: "Denyutan jantung meningkat.",
        detail: "Lebih banyak darah dipam ke seluruh badan.",
      },
      {
        name: "Otot rangka",
        type: "muscle",
        x: 31,
        y: 49,
        response: "Otot bertindak dengan lebih cepat.",
        detail: "Badan bersedia untuk tindak balas kecemasan.",
      },
    ],
    effects: [
      "Meningkatkan denyutan jantung.",
      "Meningkatkan aras glukosa darah.",
      "Menyediakan badan untuk kecemasan.",
    ],
  },
  {
    id: "pancreas",
    label: "Pankreas",
    shortLabel: "Pa",
    location: "Rongga abdomen",
    hormone: "Insulin",
    color: "#fbbf24",
    source: { x: 51, y: 58 },
    markers: [{ x: 51, y: 58, scale: 1 }],
    targets: [
      {
        name: "Hati",
        type: "liver",
        x: 44,
        y: 51,
        response: "Glukosa berlebihan disimpan.",
        detail: "Glukosa ditukarkan kepada glikogen di dalam hati.",
      },
      {
        name: "Sel badan",
        type: "cell",
        x: 65,
        y: 64,
        response: "Sel menyerap glukosa.",
        detail: "Aras glukosa darah kembali lebih seimbang.",
      },
    ],
    effects: [
      "Mengawal aras glukosa darah.",
      "Menukarkan glukosa berlebihan kepada glikogen.",
    ],
  },
  {
    id: "ovary",
    label: "Ovari",
    shortLabel: "Ov",
    location: "Pelvis perempuan",
    hormone: "Estrogen",
    color: "#f472b6",
    source: { x: 50, y: 75 },
    markers: [
      { x: 45, y: 75, scale: 0.76 },
      { x: 55, y: 75, scale: 0.76 },
    ],
    targets: [
      {
        name: "Organ pembiakan perempuan",
        type: "reproductive",
        x: 50,
        y: 75,
        response: "Ciri seks sekunder perempuan dikawal.",
        detail: "Uterus disediakan untuk penempelan embrio.",
      },
    ],
    effects: [
      "Mengawal ciri seks sekunder perempuan.",
      "Merangsang penghasilan ovum.",
      "Menyediakan uterus untuk penempelan embrio.",
    ],
  },
  {
    id: "testis",
    label: "Testis",
    shortLabel: "Te",
    location: "Pelvis lelaki",
    hormone: "Testosteron",
    color: "#60a5fa",
    source: { x: 50, y: 82 },
    markers: [{ x: 50, y: 82, scale: 0.86 }],
    targets: [
      {
        name: "Organ pembiakan lelaki",
        type: "reproductive",
        x: 50,
        y: 82,
        response: "Ciri seks sekunder lelaki dikawal.",
        detail: "Penghasilan sperma dirangsang.",
      },
    ],
    effects: [
      "Mengawal ciri seks sekunder lelaki.",
      "Merangsang penghasilan sperma.",
    ],
  },
];

const quickSituations = [
  { id: "danger", label: "Situasi cemas", glandId: "adrenal" },
  { id: "meal", label: "Selepas makan", glandId: "pancreas" },
  { id: "growth", label: "Fasa membesar", glandId: "pituitary" },
  { id: "energy", label: "Tenaga harian", glandId: "thyroid" },
];

const vesselPaths = [
  { type: "artery", d: "M50 21 C50 32 49 42 49 54 C49 68 47 85 46 104 C45 122 44 135 43 144" },
  { type: "vein", d: "M53 22 C53 33 54 43 54 55 C54 69 56 86 57 104 C58 122 59 135 60 144" },
  { type: "artery", d: "M49 35 C38 39 32 45 25 57 C20 68 16 80 13 91" },
  { type: "vein", d: "M53 35 C64 39 70 45 77 57 C82 68 86 80 89 91" },
  { type: "artery", d: "M48 73 C39 84 34 99 33 116 C32 128 30 137 27 146" },
  { type: "vein", d: "M54 73 C62 84 67 99 68 116 C69 128 71 137 74 146" },
  { type: "artery", d: "M48 42 C44 41 42 39 39 36" },
  { type: "vein", d: "M54 42 C59 41 62 39 65 36" },
];

function buildHormonePath(source, target, index) {
  const drift = target.x >= source.x ? 9 : -9;
  const bend = index % 2 === 0 ? -5 : 5;
  const midY = (source.y + target.y) / 2 + bend;

  return `M ${source.x} ${source.y} C ${source.x + drift} ${midY} ${target.x - drift} ${midY} ${target.x} ${target.y}`;
}

function getProgress(selectedGland, showVessels, hormoneReleased, effectSeen) {
  return [
    Boolean(selectedGland),
    showVessels,
    hormoneReleased,
    effectSeen,
  ].filter(Boolean).length;
}

function EffectIcon({ type }) {
  return (
    <span className={`endocrineEffectIcon endocrineEffectIcon--${type}`} aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

export default function EndocrineSystemSimulatorPage({ reviewPanel }) {
  const [selectedGlandId, setSelectedGlandId] = useState("");
  const [showVessels, setShowVessels] = useState(false);
  const [hormoneReleased, setHormoneReleased] = useState(false);
  const [releaseTick, setReleaseTick] = useState(0);
  const [effectOpen, setEffectOpen] = useState(false);
  const [effectSeen, setEffectSeen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const selectedGland = useMemo(
    () => endocrineGlands.find((gland) => gland.id === selectedGlandId) || null,
    [selectedGlandId]
  );
  const progress = getProgress(selectedGland, showVessels, hormoneReleased, effectSeen);
  const complete = progress === 4;

  useEffect(() => {
    if (!hormoneReleased || !selectedGland) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setEffectOpen(true);
      setEffectSeen(true);
    }, 1850);

    return () => window.clearTimeout(timer);
  }, [hormoneReleased, selectedGland, releaseTick]);

  const selectGland = (id) => {
    setSelectedGlandId(id);
    setShowVessels(false);
    setHormoneReleased(false);
    setReleaseTick(0);
    setEffectOpen(false);
    setEffectSeen(false);
  };

  const revealVessels = () => {
    if (!selectedGland) {
      return;
    }

    setShowVessels(true);
  };

  const releaseHormone = () => {
    if (!selectedGland || !showVessels) {
      return;
    }

    setEffectOpen(false);
    setHormoneReleased(true);
    setReleaseTick((tick) => tick + 1);
  };

  const resetSimulation = () => {
    setSelectedGlandId("");
    setShowVessels(false);
    setHormoneReleased(false);
    setReleaseTick(0);
    setEffectOpen(false);
    setEffectSeen(false);
    setGuideOpen(false);
  };

  const targetSummary = selectedGland
    ? selectedGland.targets.map((target) => target.name).join(", ")
    : "Pilih kelenjar dahulu";

  return (
    <main className="endocrinePage">
      <section className="endocrineTopbar">
        <div className="endocrineBrand">
          <span className="endocrineBrand__icon" aria-hidden="true">
            <i />
          </span>
          <div>
            <span>EduSim Sains</span>
            <h1>Simulator Sistem Endokrin</h1>
          </div>
        </div>

        <p className="endocrineInstruction">
          Klik kelenjar, tunjuk salur darah, kemudian rembes hormon untuk melihat
          kesan pada organ sasaran.
        </p>

        <div className="endocrineHeaderActions">
          <button
            type="button"
            className="endocrineGhostButton"
            aria-expanded={guideOpen}
            onClick={() => setGuideOpen((open) => !open)}
          >
            <span className="endocrineInfoIcon" aria-hidden="true">i</span>
            Panduan
          </button>

          <div className="endocrineScore" aria-label={`Progress ${progress} daripada 4`}>
            <span aria-hidden="true" />
            <strong>{progress} / 4</strong>
            <small>Progress</small>
          </div>
        </div>
      </section>

      {guideOpen && (
        <section className="endocrineGuide" aria-label="Panduan ringkas">
          <strong>Langkah pembelajaran</strong>
          <ol>
            <li>Pilih satu kelenjar daripada panel kiri.</li>
            <li>Tekan Tunjuk Salur Darah untuk melihat laluan pengangkutan.</li>
            <li>Tekan Rembes Hormon dan perhatikan titik hormon bergerak.</li>
            <li>Baca popup kesan apabila hormon sampai ke organ sasaran.</li>
          </ol>
        </section>
      )}

      <section className="endocrineLayout" aria-label="Simulator sistem endokrin">
        <aside className="endocrinePanel endocrinePanel--left">
          <div className="endocrinePanelTitle">
            <span>Pilih Kelenjar</span>
            <strong>{selectedGland ? selectedGland.location : "Klik satu pilihan"}</strong>
          </div>

          <div className="endocrineGlandList">
            {endocrineGlands.map((gland) => {
              const selected = gland.id === selectedGlandId;

              return (
                <button
                  key={gland.id}
                  type="button"
                  className={`endocrineGlandButton${selected ? " endocrineGlandButton--selected" : ""}`}
                  onClick={() => selectGland(gland.id)}
                >
                  <span
                    className={`endocrineGlandIcon endocrineGlandIcon--${gland.id}`}
                    style={{ "--gland-color": gland.color }}
                    aria-hidden="true"
                  >
                    {gland.shortLabel}
                  </span>
                  <span>
                    <strong>{gland.label}</strong>
                    <small>{gland.hormone}</small>
                  </span>
                  {selected && <i className="endocrineCheck" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="endocrineQuickPanel">
            <div className="endocrineMiniTitle">
              <span aria-hidden="true" />
              Situasi Cepat
            </div>
            <div className="endocrineQuickList">
              {quickSituations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectedGlandId === item.glandId ? "endocrineQuickButton endocrineQuickButton--active" : "endocrineQuickButton"}
                  onClick={() => selectGland(item.glandId)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="endocrineStagePanel">
          <div className="endocrineControlDeck" aria-label="Kawalan simulasi">
            <button
              type="button"
              className={`endocrineActionButton endocrineActionButton--vessel${showVessels ? " endocrineActionButton--done" : ""}`}
              disabled={!selectedGland}
              onClick={revealVessels}
            >
              <span className="endocrineButtonIcon endocrineButtonIcon--vessel" aria-hidden="true" />
              <span>
                <small>1</small>
                Tunjuk Salur Darah
              </span>
            </button>

            <button
              type="button"
              className={`endocrineActionButton endocrineActionButton--release${hormoneReleased ? " endocrineActionButton--done" : ""}`}
              disabled={!selectedGland || !showVessels}
              onClick={releaseHormone}
            >
              <span className="endocrineButtonIcon endocrineButtonIcon--play" aria-hidden="true" />
              <span>
                <small>2</small>
                Rembes Hormon
              </span>
            </button>

            <button type="button" className="endocrineResetButton" onClick={resetSimulation}>
              <span aria-hidden="true" />
              Set Semula
            </button>
          </div>

          <div
            className={`endocrineBodyStage${showVessels ? " endocrineBodyStage--vessels" : ""}${hormoneReleased ? " endocrineBodyStage--released" : ""}`}
          >
            <img
              src="/assets/human body.png"
              alt="Badan manusia kosong tanpa label untuk simulator sistem endokrin"
              draggable="false"
            />

            <svg className="endocrineVesselLayer" viewBox="0 0 100 150" aria-hidden="true">
              {vesselPaths.map((path, index) => (
                <path
                  key={`${path.type}-${index}`}
                  className={`endocrineVessel endocrineVessel--${path.type}`}
                  d={path.d}
                />
              ))}
            </svg>

            {selectedGland && (
              <div className="endocrineOverlayLayer" aria-label={`Lokasi kelenjar ${selectedGland.label}`}>
                {selectedGland.markers.map((marker, index) => (
                  <button
                    key={`${selectedGland.id}-${index}`}
                    type="button"
                    className={`endocrineGlandMarker endocrineGlandMarker--${selectedGland.id}`}
                    style={{
                      "--x": `${marker.x}%`,
                      "--y": `${marker.y}%`,
                      "--scale": marker.scale,
                      "--gland-color": selectedGland.color,
                    }}
                    onClick={() => setGuideOpen(false)}
                    aria-label={`Kelenjar ${selectedGland.label}`}
                  >
                    <span>{selectedGland.shortLabel}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedGland && showVessels && (
              <div className="endocrineTargetLayer" aria-label="Organ sasaran">
                {selectedGland.targets.map((target) => (
                  <span
                    key={target.name}
                    className={`endocrineTargetPin${hormoneReleased ? " endocrineTargetPin--active" : ""}`}
                    style={{
                      "--x": `${target.x}%`,
                      "--y": `${target.y}%`,
                    }}
                  >
                    <span />
                  </span>
                ))}
              </div>
            )}

            {selectedGland && hormoneReleased && (
              <svg
                key={`${selectedGland.id}-${releaseTick}`}
                className="endocrineHormoneLayer"
                viewBox="0 0 100 150"
                aria-hidden="true"
              >
                {selectedGland.targets.map((target, index) => {
                  const route = buildHormonePath(selectedGland.source, target, index);

                  return (
                    <g key={target.name}>
                      <path className="endocrineHormoneRoute" d={route} />
                      {[0, 1, 2].map((dot) => (
                        <circle
                          key={`${target.name}-${dot}`}
                          className="endocrineHormoneDot"
                          r="1.22"
                        >
                          <animateMotion
                            dur={`${2.15 + index * 0.3}s`}
                            begin={`${dot * 0.28}s`}
                            repeatCount="indefinite"
                            path={route}
                          />
                        </circle>
                      ))}
                    </g>
                  );
                })}
              </svg>
            )}

            {!selectedGland && (
              <div className="endocrineStageHint">
                <strong>Pilih satu kelenjar</strong>
                <span>Kelenjar akan muncul sebagai overlay pada lokasi badan.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="endocrineSideStack">
          <section className="endocrinePanel endocrineLegend">
            <div className="endocrinePanelTitle">
              <span>Petunjuk</span>
              <strong>Simbol laluan hormon</strong>
            </div>
            <div className="endocrineLegendList">
              <span><i className="legendHormone" /> Hormon</span>
              <span><i className="legendArtery" /> Salur arteri</span>
              <span><i className="legendVein" /> Salur vena</span>
              <span><i className="legendTarget" /> Organ sasaran</span>
            </div>
          </section>

          <section className="endocrinePanel endocrineJourney">
            <div className="endocrinePanelTitle">
              <span>Perjalanan Hormon</span>
              <strong>{selectedGland ? selectedGland.label : "Belum dipilih"}</strong>
            </div>

            <div className="endocrineJourneyFlow">
              <article>
                <span>Kelenjar</span>
                <strong>{selectedGland ? selectedGland.label : "-"}</strong>
              </article>
              <article>
                <span>Hormon</span>
                <strong>{selectedGland ? selectedGland.hormone : "-"}</strong>
              </article>
              <article>
                <span>Organ sasaran</span>
                <strong>{targetSummary}</strong>
              </article>
            </div>

            {complete && (
              <div className="endocrineCompleteNote" role="status">
                Tahniah! Anda telah melihat cara hormon bergerak ke organ sasaran.
              </div>
            )}
          </section>
        </aside>
      </section>

      <section className="endocrineInfoBar">
        <strong>Info</strong>
        <p>
          Hormon dirembes oleh kelenjar endokrin dan dibawa oleh darah ke organ
          sasaran. Hormon bertindak mengawal dan menyelaras fungsi badan.
        </p>
      </section>

      {reviewPanel}

      {effectOpen && selectedGland && (
        <div className="endocrineModalBackdrop" role="presentation">
          <section
            className="endocrineEffectModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="endocrine-effect-title"
          >
            <button
              type="button"
              className="endocrineModalClose"
              aria-label="Tutup popup kesan hormon"
              onClick={() => setEffectOpen(false)}
            />
            <span className="endocrineModalKicker">Kesan hormon</span>
            <h2 id="endocrine-effect-title">Kesan {selectedGland.hormone}</h2>

            <div className="endocrineEffectGrid">
              {selectedGland.targets.map((target) => (
                <article key={target.name} className="endocrineEffectCard">
                  <div className="endocrineEffectCard__visual">
                    <EffectIcon type={target.type} />
                  </div>
                  <div>
                    <span>{target.name}</span>
                    <strong>{target.response}</strong>
                    <p>{target.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <ul className="endocrineEffectList">
              {selectedGland.effects.map((effect) => (
                <li key={effect}>{effect}</li>
              ))}
            </ul>

            <button
              type="button"
              className="endocrineModalButton"
              onClick={() => setEffectOpen(false)}
            >
              Tutup
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
