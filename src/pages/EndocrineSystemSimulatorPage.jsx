import { useEffect, useMemo, useState } from "react";

const endocrineGlands = [
  {
    id: "pituitary",
    label: "Pituitari",
    shortLabel: "Pi",
    location: "Bahagian otak",
    hormone: "Hormon pertumbuhan",
    color: "#f9a8d4",
    source: { x: 50, y: 14 },
    markers: [{ x: 50, y: 14, scale: 0.72 }],
    targets: [
      {
        name: "Tulang",
        type: "bone",
        x: 47,
        y: 86,
        response: "Pertumbuhan tulang dirangsang.",
        detail: "Tulang membesar dan memanjang dengan lebih teratur.",
      },
      {
        name: "Otot",
        type: "muscle",
        x: 33,
        y: 39,
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
    source: { x: 50, y: 20 },
    markers: [{ x: 50, y: 20, scale: 0.6 }],
    targets: [
      {
        name: "Sel badan",
        type: "cell",
        x: 62,
        y: 47,
        response: "Metabolisme sel dikawal.",
        detail: "Sel menggunakan tenaga pada kadar yang sesuai.",
      },
      {
        name: "Pertumbuhan badan",
        type: "growth",
        x: 38,
        y: 60,
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
    source: { x: 50, y: 45 },
    markers: [
      { x: 44, y: 45, scale: 0.68 },
      { x: 56, y: 45, scale: 0.68 },
    ],
    targets: [
      {
        name: "Jantung",
        type: "heart",
        x: 48,
        y: 34,
        response: "Denyutan jantung meningkat.",
        detail: "Lebih banyak darah dipam ke seluruh badan.",
      },
      {
        name: "Otot rangka",
        type: "muscle",
        x: 32,
        y: 42,
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
    source: { x: 51, y: 40.5 },
    markers: [{ x: 51, y: 40.5, scale: 0.74 }],
    targets: [
      {
        name: "Hati",
        type: "liver",
        x: 44,
        y: 39,
        response: "Glukosa berlebihan disimpan.",
        detail: "Glukosa ditukarkan kepada glikogen di dalam hati.",
      },
      {
        name: "Sel badan",
        type: "cell",
        x: 65,
        y: 48,
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
    location: "Pelvis, sisi kelengkang",
    hormone: "Estrogen",
    color: "#f472b6",
    source: { x: 50, y: 51.4 },
    markers: [
      { x: 47.8, y: 51.4, scale: 0.52 },
      { x: 52.2, y: 51.4, scale: 0.52 },
    ],
    targets: [
      {
        name: "Organ pembiakan perempuan",
        type: "reproductive",
        x: 50,
        y: 51.4,
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
    location: "Kelengkang lelaki",
    hormone: "Testosteron",
    color: "#60a5fa",
    source: { x: 50, y: 53.1 },
    markers: [
      { x: 49.1, y: 53.1, scale: 0.5 },
      { x: 50.9, y: 53.1, scale: 0.5 },
    ],
    targets: [
      {
        name: "Organ pembiakan lelaki",
        type: "reproductive",
        x: 50,
        y: 53.1,
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
  "M50 14 C50 20 50 27 50 34 C50 42 50 50 50 56",
  "M48.7 30 C48.2 37 48.2 45 48.8 52",
  "M51.3 30 C51.8 37 51.8 45 51.2 52",
  "M50 15 C48.7 16.6 48.1 18.4 48.4 20.6",
  "M50 15 C51.3 16.6 51.9 18.4 51.6 20.6",
  "M50 30 C48.5 31.2 47.7 33.5 47.8 36.2",
  "M50 30 C51.5 31.2 52.3 33.5 52.2 36.2",
  "M49 42 C47.8 44.2 47.3 47 47.4 50.4",
  "M51 42 C52.2 44.2 52.7 47 52.6 50.4",
  "M48.9 50 C47.9 51.1 47.3 52.2 47.2 53.3",
  "M51.1 50 C52.1 51.1 52.7 52.2 52.8 53.3",
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
                  data-gland-id={gland.id}
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

            <svg className="endocrineVesselLayer" viewBox="0 0 100 100" aria-hidden="true">
              {vesselPaths.map((path, index) => (
                <path
                  key={`blood-vessel-${index}`}
                  className="endocrineVessel"
                  d={path}
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
                viewBox="0 0 100 100"
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
              <span><i className="legendBlood" /> Salur darah</span>
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
