import { useMemo, useState } from "react";

const contactAreaOptions = [
  { area: 0.035, label: "Kecil", scale: 0.72 },
  { area: 0.06, label: "Sederhana", scale: 1 },
  { area: 0.09, label: "Besar", scale: 1.28 },
];

const tyreCount = 4;

const loadOptions = [
  { id: "empty", label: "Kosong", victims: "0 mangsa", force: 2500 },
  { id: "two", label: "2 mangsa", victims: "2 mangsa", force: 3000 },
  { id: "four", label: "4 mangsa", victims: "4 mangsa", force: 3500 },
  { id: "six", label: "6 mangsa", victims: "6 mangsa", force: 4000 },
];

const mudResistance = 12000;

const variableOptions = [
  { value: "area", label: "Luas permukaan tapak tayar (PM)" },
  { value: "depth", label: "Kedalaman tayar tenggelam dalam lumpur (PB)" },
];

const trendOptions = [
  { value: "increase", label: "Bertambah" },
  { value: "decrease", label: "Berkurang" },
];

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("ms-MY", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function getStatus(depth) {
  if (depth <= 15) {
    return {
      status: "BERJAYA",
      tone: "success",
      message:
        "Ambulans berjaya sampai ke kampung. Tekanan rendah kerana luas sentuhan besar.",
    };
  }

  if (depth <= 30) {
    return {
      status: "BERGERAK PERLAHAN",
      tone: "warning",
      message: "Ambulans masih boleh bergerak tetapi tayar tenggelam sebahagian.",
    };
  }

  return {
    status: "TERSANGKUT",
    tone: "danger",
    message: "Tekanan terlalu tinggi menyebabkan tayar tenggelam dalam lumpur.",
  };
}

function Fraction({ numerator, denominator }) {
  return (
    <span className="mudPressureFraction" aria-hidden="true">
      <span>{numerator}</span>
      <span>{denominator}</span>
    </span>
  );
}

function TyreVisual({ position }) {
  return (
    <span className={`mudPressureTyreSlot mudPressureTyreSlot--${position}`} aria-hidden="true">
      <span className="mudPressureTyre">
        <span />
      </span>
      <i className="mudPressureContactPatch" />
    </span>
  );
}

function VariableSelect({ value, expected, label, onChange }) {
  return (
    <label
      className={`mudPressureVariableBox${
        value
          ? value === expected
            ? " mudPressureVariableBox--correct"
            : " mudPressureVariableBox--incorrect"
          : ""
      }`}
    >
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        <option value="">Pilih pemboleh ubah</option>
        {variableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrendSelect({ value, expected, label, onChange }) {
  return (
    <label
      className={`mudPressureVariableBox mudPressureTrendBox${
        value
          ? value === expected
            ? " mudPressureVariableBox--correct"
            : " mudPressureVariableBox--incorrect"
          : ""
      }`}
    >
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        <option value="">Pilih perubahan</option>
        {trendOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function MudPressureRescueSimulatorPage({ reviewPanel }) {
  const [areaPerTyre, setAreaPerTyre] = useState(0.06);
  const [loadId, setLoadId] = useState("four");
  const [tyresInstalled, setTyresInstalled] = useState(false);
  const [ambulanceInstalled, setAmbulanceInstalled] = useState(false);
  const [missionStarted, setMissionStarted] = useState(false);
  const [missionNote, setMissionNote] = useState(
    "Pilih tetapan, pasang tayar dan ambulans, kemudian mulakan misi."
  );
  const [records, setRecords] = useState([]);
  const [variableAnswers, setVariableAnswers] = useState({
    problemCause: "",
    problemEffect: "",
    hypothesisCause: "",
    hypothesisCauseTrend: "",
    hypothesisEffect: "",
    hypothesisEffectTrend: "",
  });

  const selectedContactArea =
    contactAreaOptions.find((option) => option.area === areaPerTyre) || contactAreaOptions[1];
  const selectedLoad = loadOptions.find((option) => option.id === loadId) || loadOptions[2];

  const metrics = useMemo(() => {
    const totalArea = selectedContactArea.area * tyreCount;
    const pressure = selectedLoad.force / totalArea;
    const sinkDepth = Math.min(50, Math.max(3, (pressure / mudResistance) * 25));
    const statusInfo = getStatus(sinkDepth);

    return {
      totalArea,
      pressure,
      sinkDepth,
      ...statusInfo,
    };
  }, [selectedContactArea.area, selectedLoad.force]);

  const sinkOffset = missionStarted ? Math.min(82, Math.round(metrics.sinkDepth * 1.62)) : 0;
  const canStartMission = tyresInstalled && ambulanceInstalled;
  const problemComplete = Boolean(variableAnswers.problemCause && variableAnswers.problemEffect);
  const problemCorrect =
    variableAnswers.problemCause === "area" && variableAnswers.problemEffect === "depth";
  const hypothesisComplete = Boolean(
    variableAnswers.hypothesisCause &&
    variableAnswers.hypothesisCauseTrend &&
    variableAnswers.hypothesisEffect &&
    variableAnswers.hypothesisEffectTrend
  );
  const hypothesisCorrect =
    variableAnswers.hypothesisCause === "area" &&
    variableAnswers.hypothesisCauseTrend === "increase" &&
    variableAnswers.hypothesisEffect === "depth" &&
    variableAnswers.hypothesisEffectTrend === "decrease";

  const clearMissionRun = () => {
    setMissionStarted(false);
  };

  const selectContactArea = (area) => {
    setAreaPerTyre(area);
    clearMissionRun();
    setMissionNote("Luas tapak satu tayar dikemas kini. Perhatikan perubahan tekanan.");
  };

  const selectLoad = (id) => {
    setLoadId(id);
    clearMissionRun();
    setMissionNote("Muatan ambulans dikemas kini. Daya yang dikenakan pada lumpur berubah.");
  };

  const installTyres = () => {
    setTyresInstalled(true);
    setMissionStarted(false);
    setMissionNote("Tayar sudah dipasang pada permukaan lumpur. Seterusnya pasang ambulans.");
  };

  const installAmbulance = () => {
    if (!tyresInstalled) {
      setMissionNote("Pasang tayar dahulu sebelum ambulans diletakkan di atasnya.");
      return;
    }

    setAmbulanceInstalled(true);
    setMissionStarted(false);
    setMissionNote("Ambulans sudah dipasang. Tekan Mulakan Misi untuk menguji tekanan.");
  };

  const startMission = () => {
    if (!canStartMission) {
      setMissionNote("Pasang tayar dan ambulans sebelum memulakan misi.");
      return;
    }

    const record = {
      id: Date.now(),
      areaPerTyre: selectedContactArea.area,
      loadLabel: selectedLoad.label,
      force: selectedLoad.force,
      area: metrics.totalArea,
      pressure: metrics.pressure,
      sinkDepth: metrics.sinkDepth,
      status: metrics.status,
    };

    setMissionStarted(true);
    setMissionNote(metrics.message);
    setRecords((current) => [record, ...current].slice(0, 6));
  };

  const resetSimulator = () => {
    setAreaPerTyre(0.06);
    setLoadId("four");
    setTyresInstalled(false);
    setAmbulanceInstalled(false);
    setMissionStarted(false);
    setMissionNote("Simulator telah direset. Pilih tetapan baharu untuk menguji misi.");
    setRecords([]);
    setVariableAnswers({
      problemCause: "",
      problemEffect: "",
      hypothesisCause: "",
      hypothesisCauseTrend: "",
      hypothesisEffect: "",
      hypothesisEffectTrend: "",
    });
  };

  return (
    <main className="mudPressurePage">
      <section className="mudPressureHero">
        <div>
          <span className="simulatorHero__kicker">Sains Tingkatan 5 - Bab 8 Daya dan Tekanan</span>
          <h1>Tekanan: Misi Menyelamat Ambulans di Kawasan Banjir Lumpur</h1>
          <p>
            Uji bagaimana luas permukaan tapak tayar dan muatan ambulans mengubah tekanan
            serta kedalaman tayar tenggelam dalam lumpur.
          </p>
        </div>

        <div className="mudPressureHeroCards" aria-label="Objektif dan konsep sains">
          <article>
            <span>Objektif</span>
            <p>Reka ambulans yang boleh merentasi lumpur dan sampai ke kampung dengan selamat.</p>
          </article>
          <article>
            <span>Konsep Sains</span>
            <p>
              Tekanan (P) ialah Daya (F) dibahagi dengan Luas Permukaan Tapak (A).
              Tekanan berkurang apabila luas permukaan tapak bertambah.
            </p>
            <div className="mudPressureEquation mudPressureEquation--symbolic" aria-label="P sama dengan F dibahagi A">
              <span>P =</span>
              <Fraction numerator="F" denominator="A" />
            </div>
          </article>
        </div>
      </section>

      {reviewPanel}

      <section className="mudPressureLayout" aria-label="Simulator tekanan pepejal">
        <aside className="mudPressurePanel mudPressureControlPanel">
          <div className="mudPressurePanelHeader">
            <span>Pilihan Murid</span>
            <strong>Tetapkan reka bentuk ambulans</strong>
          </div>

          <div className="mudPressureControlGroup">
            <h2>1. Pilih luas tapak satu tayar</h2>
            <div className="mudPressureTyreChoices">
              {contactAreaOptions.map((option) => (
                <button
                  type="button"
                  key={option.area}
                  className={`mudPressureChoice mudPressureTyreChoice${
                    areaPerTyre === option.area ? " mudPressureChoice--selected" : ""
                  }`}
                  onClick={() => selectContactArea(option.area)}
                >
                  <span
                    className="mudPressureTyreIcon"
                    style={{ "--contact-scale": option.scale }}
                    aria-hidden="true"
                  >
                    <i />
                  </span>
                  <strong>
                    {formatNumber(option.area, 3)} m<sup>2</sup>
                  </strong>
                  <small>{option.label}</small>
                </button>
              ))}
            </div>
            <p className="mudPressureFixedTyreNote">
              Kiraan menggunakan 4 tayar. Pandangan sisi memaparkan 2 tayar sahaja.
            </p>
          </div>

          <div className="mudPressureControlGroup">
            <h2>2. Pilih muatan ambulans</h2>
            <div className="mudPressureLoadList">
              {loadOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`mudPressureLoadButton${loadId === option.id ? " active" : ""}`}
                  onClick={() => selectLoad(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>Berat = {formatNumber(option.force)} N</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mudPressureActions" aria-label="Butang simulator">
            <button type="button" onClick={installTyres}>
              Pasang Tayar
            </button>
            <button type="button" onClick={installAmbulance}>
              Pasang Ambulans
            </button>
            <button type="button" className="mudPressureStartButton" onClick={startMission}>
              Mulakan Misi
            </button>
            <button type="button" className="mudPressureResetButton" onClick={resetSimulator}>
              Reset
            </button>
          </div>
        </aside>

        <section className="mudPressureStagePanel" aria-label="Kawasan simulasi banjir lumpur">
          <div className="mudPressureStageHeader">
            <div>
              <span>Laluan Ujian Lumpur</span>
              <strong>{canStartMission ? "Sedia untuk diuji" : "Pasang tayar dan ambulans"}</strong>
            </div>
            <p>{missionNote}</p>
          </div>

          <div
            className={`mudPressureScene${
              missionStarted ? " mudPressureScene--started" : ""
            } mudPressureScene--${metrics.tone}`}
            style={{
              "--sink-offset": `${sinkOffset}px`,
              "--contact-scale": selectedContactArea.scale,
            }}
          >
            <div className="mudPressureDropZone">
              {!tyresInstalled && <span>Klik Pasang Tayar untuk mula</span>}
              {tyresInstalled && !ambulanceInstalled && <span>Tayar sudah berada di permukaan lumpur</span>}
            </div>

            {(tyresInstalled || ambulanceInstalled) && (
              <div className="mudPressureVehicleRig" aria-hidden="true">
                {ambulanceInstalled && (
                  <div className="mudPressureAmbulanceBody">
                    <img
                      src="/assets/ambulance.png"
                      alt=""
                      className="mudPressureAmbulanceImage"
                      draggable="false"
                    />
                  </div>
                )}

                {tyresInstalled && (
                  <div className="mudPressureTyreSlots">
                    <TyreVisual position="rear" />
                    <TyreVisual position="front" />
                  </div>
                )}
              </div>
            )}

            {missionStarted && metrics.sinkDepth > 30 && (
              <div className="mudPressureSplash" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}

            {missionStarted && (
              <div className="mudPressureDepthTag" aria-hidden="true">
                {formatNumber(metrics.sinkDepth, 1)} cm
              </div>
            )}
          </div>
        </section>

        <aside className="mudPressurePanel mudPressureReadoutPanel">
          <div className="mudPressurePanelHeader mudPressurePanelHeader--blue">
            <span>3. Maklumat Ambulans</span>
            <strong>Daya, luas permukaan dan kedalaman</strong>
          </div>

          <div className="mudPressureReadoutGrid">
            <article>
              <span>Berat ambulans, F</span>
              <strong>{formatNumber(selectedLoad.force)} N</strong>
            </article>
            <article>
              <span>Jumlah luas sentuhan, A</span>
              <strong>
                {formatNumber(metrics.totalArea, 3)} m<sup>2</sup>
              </strong>
            </article>
            <article>
              <span>Tekanan, P</span>
              <strong>{formatNumber(metrics.pressure)} Pa</strong>
            </article>
            <article>
              <span>Kedalaman tenggelam</span>
              <strong>
                {missionStarted ? `${formatNumber(metrics.sinkDepth, 1)} cm` : "-- cm"}
              </strong>
            </article>
          </div>

          <div className="mudPressureWorking">
            <span>4. Pengiraan Tekanan</span>
            <strong className="mudPressureWorkingFormula">
              Tekanan (P) ialah Daya (F) dibahagi dengan Luas Permukaan Tapak (A)
            </strong>
            <div className="mudPressureEquation mudPressureEquation--symbolic" aria-label="P sama dengan F dibahagi A">
              <span>P =</span>
              <Fraction numerator="F" denominator="A" />
            </div>
            <p>
              A = 4 x {formatNumber(selectedContactArea.area, 3)} m<sup>2</sup> = {" "}
              <strong>{formatNumber(metrics.totalArea, 3)} m<sup>2</sup></strong>
            </p>
            <div className="mudPressureEquation mudPressureEquation--operation" aria-label="Jalan kerja pengiraan tekanan">
              <span>P =</span>
              <Fraction
                numerator={<>{formatNumber(selectedLoad.force)} N</>}
                denominator={<>{formatNumber(metrics.totalArea, 3)} m<sup>2</sup></>}
              />
              <span>=</span>
              <strong>{formatNumber(metrics.pressure)} Pa</strong>
            </div>
            <small>
              1 Pa = 1 N m<sup>-2</sup>
            </small>
          </div>

          <div className={`mudPressureStatus mudPressureStatus--${missionStarted ? metrics.tone : "idle"}`}>
            <span>Status Misi</span>
            <strong>{missionStarted ? metrics.status : "BELUM DIUJI"}</strong>
            <p>{missionStarted ? metrics.message : "Mulakan misi untuk melihat kesan tekanan pada lumpur."}</p>
          </div>
        </aside>
      </section>

      <section className="mudPressureLearningGrid" aria-label="Langkah penggunaan dan analisis">
        <article className="mudPressureLearningCard mudPressureKpsCard">
          <span>5. Bina KPS (IBSE)</span>
          <p><strong>Pernyataan masalah:</strong></p>
          <div className="mudPressureProblemStatement">
            <span>Apakah kesan</span>
            <VariableSelect
              value={variableAnswers.problemCause}
              expected="area"
              label="Pilih pemboleh ubah sebelum perkataan kepada dalam pernyataan masalah"
              onChange={(value) =>
                setVariableAnswers((current) => ({ ...current, problemCause: value }))
              }
            />
            <span>kepada</span>
            <span className="mudPressureInlineChoice">
              <VariableSelect
                value={variableAnswers.problemEffect}
                expected="depth"
                label="Pilih pemboleh ubah selepas perkataan kepada dalam pernyataan masalah"
                onChange={(value) =>
                  setVariableAnswers((current) => ({ ...current, problemEffect: value }))
                }
              />
              <span>?</span>
            </span>
          </div>
          <p
            className={`mudPressureVariableFeedback${
              problemComplete
                ? problemCorrect
                  ? " mudPressureVariableFeedback--correct"
                  : " mudPressureVariableFeedback--incorrect"
                : ""
            }`}
          >
            {!problemComplete
              ? "Lengkapkan kedua-dua ruang pernyataan masalah."
              : problemCorrect
                ? "Betul. Pernyataan masalah menunjukkan kesan PM kepada PB."
                : "Belum tepat. Letakkan PM dahulu dan PB selepas perkataan kepada."}
          </p>
          <p><strong>Hipotesis:</strong></p>
          <div className="mudPressureProblemStatement mudPressureHypothesisStatement">
            <span>Jika</span>
            <span className="mudPressureInlineChoice">
              <VariableSelect
                value={variableAnswers.hypothesisCause}
                expected="area"
                label="Pilih pemboleh ubah pada awal hipotesis"
                onChange={(value) =>
                  setVariableAnswers((current) => ({ ...current, hypothesisCause: value }))
                }
              />
              <span>,</span>
            </span>
            <span className="mudPressureInlineChoice">
              <TrendSelect
                value={variableAnswers.hypothesisCauseTrend}
                expected="increase"
                label="Pilih arah perubahan pemboleh ubah pertama dalam hipotesis"
                onChange={(value) =>
                  setVariableAnswers((current) => ({
                    ...current,
                    hypothesisCauseTrend: value,
                  }))
                }
              />
              <span>,</span>
            </span>
            <span>maka</span>
            <span className="mudPressureInlineChoice">
              <VariableSelect
                value={variableAnswers.hypothesisEffect}
                expected="depth"
                label="Pilih pemboleh ubah pada akhir hipotesis"
                onChange={(value) =>
                  setVariableAnswers((current) => ({ ...current, hypothesisEffect: value }))
                }
              />
              <span>,</span>
            </span>
            <span className="mudPressureInlineChoice">
              <TrendSelect
                value={variableAnswers.hypothesisEffectTrend}
                expected="decrease"
                label="Pilih arah perubahan pemboleh ubah kedua dalam hipotesis"
                onChange={(value) =>
                  setVariableAnswers((current) => ({
                    ...current,
                    hypothesisEffectTrend: value,
                  }))
                }
              />
              <span>.</span>
            </span>
          </div>
          <p
            className={`mudPressureVariableFeedback${
              hypothesisComplete
                ? hypothesisCorrect
                  ? " mudPressureVariableFeedback--correct"
                  : " mudPressureVariableFeedback--incorrect"
                : ""
            }`}
          >
            {!hypothesisComplete
              ? "Lengkapkan keempat-empat ruang hipotesis."
              : hypothesisCorrect
                ? "Betul. Apabila luas permukaan tapak tayar bertambah, kedalaman tayar tenggelam berkurang."
                : "Belum tepat. Semak pemboleh ubah dan arah perubahan dalam hipotesis."}
          </p>
          <div className="mudPressureVariableLegend">
            <span><strong>PM</strong> Pemboleh ubah dimanipulasikan</span>
            <span><strong>PB</strong> Pemboleh ubah bergerak balas</span>
            <span><strong>DM</strong> Berat ambulans, 4 tayar dan jenis lumpur</span>
          </div>
        </article>

      </section>

      <section className="mudPressureRecords" aria-label="Rekod ujian terkini">
        <div className="mudPressureRecordsHeader">
          <div>
            <span>Rekod Ujian</span>
            <h2>6 ujian terkini</h2>
          </div>
          <p>Gunakan jadual ini untuk membuat inferens hubungan luas sentuhan dengan tekanan.</p>
        </div>

        <div className="mudPressureTableWrap">
          <table>
            <thead>
              <tr>
                <th>Luas satu tayar</th>
                <th>Muatan</th>
                <th>Daya</th>
                <th>Jumlah luas, A</th>
                <th>Tekanan</th>
                <th>Kedalaman</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7}>Belum ada rekod. Tekan Mulakan Misi untuk merekod ujian.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {formatNumber(record.areaPerTyre, 3)} m<sup>2</sup>
                    </td>
                    <td>{record.loadLabel}</td>
                    <td>{formatNumber(record.force)} N</td>
                    <td>
                      {formatNumber(record.area, 3)} m<sup>2</sup>
                    </td>
                    <td>{formatNumber(record.pressure)} Pa</td>
                    <td>{formatNumber(record.sinkDepth, 1)} cm</td>
                    <td>{record.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
