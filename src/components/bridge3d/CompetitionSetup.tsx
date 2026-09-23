import { useState } from "react";
import {
  getEffectiveClearanceZones,
  getOfficialValue,
  OFFICIAL_2026_PROFILE_ID,
  OFFICIAL_PIPE_CLEARANCE_ID,
  OFFICIAL_PLATE_CLEARANCE_ID,
} from "../../features/bridge3d/profile";
import type { CompetitionProfile } from "../../features/bridge3d/types";

function NumericField({
  label,
  path,
  value,
  unit,
  nullable = false,
  onChange,
}: {
  label: string;
  path: string;
  value: number | null;
  unit?: string;
  nullable?: boolean;
  onChange: (value: number | null) => void;
}) {
  const official = getOfficialValue(path);
  const custom = value !== official;
  return (
    <label className="bridge3d-settings-field">
      <span>{label}{custom ? <em>CUSTOM</em> : null}</span>
      <div><input
        type="number"
        step="any"
        value={value ?? ""}
        placeholder={nullable ? "Tanpa had" : undefined}
        onChange={(event) => onChange(event.target.value === "" && nullable ? null : Number(event.target.value))}
      />{unit ? <b>{unit}</b> : null}</div>
      {typeof official === "number" ? <small>Rasmi 2026: {official} {unit ?? ""}</small> : null}
      {custom && (typeof official === "number" || official === null) ? (
        <button type="button" className="bridge3d-restore-value" onClick={() => onChange(official as number | null)}>
          Pulih nilai rasmi{official === null ? " (tanpa had)" : ""}
        </button>
      ) : null}
    </label>
  );
}

export default function CompetitionSetup({
  profile,
  profiles,
  onSelectProfile,
  onChange,
  onSave,
  onDuplicate,
  onReset,
  onClose,
}: {
  profile: CompetitionProfile;
  profiles: CompetitionProfile[];
  onSelectProfile: (id: string) => void;
  onChange: (profile: CompetitionProfile) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [curveText, setCurveText] = useState(() => JSON.stringify(profile.materialCalibration.jointCalibration, null, 2));
  const setPath = (path: string, value: unknown) => {
    const next = structuredClone(profile) as unknown as Record<string, unknown>;
    const keys = path.split(".");
    let target = next;
    keys.slice(0, -1).forEach((key) => {
      target = target[key] as Record<string, unknown>;
    });
    target[keys.at(-1) ?? ""] = value;
    next.modified = true;
    onChange(next as unknown as CompetitionProfile);
  };
  const fields = (
    section: keyof Pick<CompetitionProfile, "bridgeRules" | "materialRules" | "loadTestRules" | "materialCalibration">,
    configs: Array<[string, string, string?, boolean?]>,
  ) => configs.map(([key, label, unit, nullable]) => (
    <NumericField
      key={`${section}.${key}`}
      label={label}
      path={`${section}.${key}`}
      value={(profile[section] as unknown as Record<string, number | null>)[key]}
      unit={unit}
      nullable={nullable}
      onChange={(value) => setPath(`${section}.${key}`, value)}
    />
  ));
  const clearanceZones = getEffectiveClearanceZones(profile);
  const centralBox = clearanceZones.find((zone) => zone.id === OFFICIAL_PLATE_CLEARANCE_ID && zone.kind === "box");
  const pipe = clearanceZones.find((zone) => zone.id === OFFICIAL_PIPE_CLEARANCE_ID && zone.kind === "cylinder");
  const customZones = clearanceZones.filter((zone) =>
    zone.id !== OFFICIAL_PLATE_CLEARANCE_ID && zone.id !== OFFICIAL_PIPE_CLEARANCE_ID);

  return (
    <div className="bridge3d-modal-backdrop" role="presentation">
      <section className="bridge3d-settings" role="dialog" aria-modal="true" aria-labelledby="bridge-settings-title">
        <header>
          <div><span>ADVANCED</span><h2 id="bridge-settings-title">Peraturan Pertandingan</h2></div>
          <button type="button" onClick={onClose} aria-label="Tutup tetapan">×</button>
        </header>
        <div className="bridge3d-settings__profilebar">
          <label>Profil aktif
            <select value={profile.id} onChange={(event) => onSelectProfile(event.target.value)}>
              {profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>Nama profil
            <input value={profile.name} onChange={(event) => setPath("name", event.target.value)} />
          </label>
          <label>Tahun
            <input type="number" value={profile.year ?? ""} placeholder="Tiada" onChange={(event) => setPath("year", event.target.value === "" ? null : Number(event.target.value))} />
          </label>
          <span className={profile.modified ? "is-custom" : "is-official"}>
            {profile.id === OFFICIAL_2026_PROFILE_ID && !profile.modified ? "Peraturan Rasmi 2026" : "Custom / Modified"}
          </span>
        </div>
        <div className="bridge3d-settings__body">
          <details open>
            <summary>Ukuran Jambatan</summary>
            <div className="bridge3d-settings-grid">
              {fields("bridgeRules", [
                ["minLengthCm", "Panjang minimum", "cm"], ["maxLengthCm", "Panjang maksimum", "cm"],
                ["minWidthCm", "Lebar minimum", "cm"], ["maxWidthCm", "Lebar maksimum", "cm"],
                ["maxHeightCm", "Tinggi maksimum", "cm"],
                ["centralClearanceWidthCm", "Lebar ruang tengah", "cm"],
                ["centralClearanceHeightCm", "Tinggi ruang tengah", "cm"],
                ["pipeClearanceDiameterCm", "Diameter laluan paip", "cm"],
              ])}
            </div>
          </details>
          <details>
            <summary>Bahan dan Gam</summary>
            <div className="bridge3d-settings-grid">
              {fields("materialRules", [
                ["skewerCount", "Bilangan lidi"], ["skewerLengthCm", "Panjang sebatang", "cm"],
                ["skewerDiameterCm", "Diameter lidi", "cm"], ["cutWasteCm", "Kehilangan setiap potongan", "cm"],
                ["glueRefillCount", "Bilangan refill gam"], ["glueRefillLengthCm", "Panjang satu refill", "cm"],
              ])}
            </div>
          </details>
          <details>
            <summary>Peraturan Tapak dan Sambungan</summary>
            <div className="bridge3d-settings-grid">
              {fields("bridgeRules", [
                ["maxBaseLongitudinalSticks", "Maksimum lidi tapak memanjang"],
                ["maxBaseBindingSticks", "Maksimum lidi pengikat tapak"],
                ["maxBaseLayers", "Maksimum lapisan tapak"],
                ["maxOverlapRatio", "Nisbah pertindihan maksimum"],
              ])}
            </div>
          </details>
          <details>
            <summary>Test Rig, Beban dan Pemarkahan</summary>
            <div className="bridge3d-settings-grid">
              {fields("loadTestRules", [
                ["supportSpanCm", "Rentang sokongan", "cm"], ["incrementKg", "Kenaikan beban", "kg"],
                ["holdDurationSeconds", "Tempoh tahan", "s"], ["maximumTestLoadKg", "Beban ujian maksimum", "kg", true],
              ])}
              <NumericField label="Pusat zon beban" path="loadTestRules.loadingZone.centreXcm" value={profile.loadTestRules.loadingZone.centreXcm} unit="cm" onChange={(value) => setPath("loadTestRules.loadingZone.centreXcm", value ?? 0)} />
              <NumericField label="Lebar zon beban" path="loadTestRules.loadingZone.widthCm" value={profile.loadTestRules.loadingZone.widthCm} unit="cm" onChange={(value) => setPath("loadTestRules.loadingZone.widthCm", value ?? 0)} />
              <NumericField label="Panjang zon beban" path="loadTestRules.loadingZone.lengthCm" value={profile.loadTestRules.loadingZone.lengthCm} unit="cm" onChange={(value) => setPath("loadTestRules.loadingZone.lengthCm", value ?? 0)} />
            </div>
            <div className="bridge3d-score-table">
              {profile.loadTestRules.timeScoreTable.map((entry, index) => (
                <label key={`${entry.second}-${index}`}>
                  <input aria-label={`Saat pemarkahan ${index + 1}`} type="number" min="0" step="1" value={entry.second} onChange={(event) => {
                    const table = [...profile.loadTestRules.timeScoreTable];
                    table[index] = { ...entry, second: Number(event.target.value) };
                    setPath("loadTestRules.timeScoreTable", table);
                  }} />s
                  <input aria-label={`Skor masa ${index + 1}`} type="number" step="0.5" value={entry.score} onChange={(event) => {
                    const table = [...profile.loadTestRules.timeScoreTable];
                    table[index] = { ...entry, score: Number(event.target.value) };
                    setPath("loadTestRules.timeScoreTable", table);
                  }} />
                </label>
              ))}
            </div>
            <label className="bridge3d-settings-field">Pembundaran masa
              <select value={profile.loadTestRules.failureTimeRounding} onChange={(event) => setPath("loadTestRules.failureTimeRounding", event.target.value)}>
                <option value="floor">Turun kepada saat lengkap</option><option value="nearest">Saat terdekat</option>
              </select>
            </label>
          </details>
          <details>
            <summary>Zon Kelegaan</summary>
            <p className="bridge3d-settings-note">Geometri rasmi dijana terus daripada nilai “Ukuran Jambatan” di atas. Panduan ini tidak menambah jisim dan gam hanya melanggar syarat jika bentuknya memasuki ruang kelegaan.</p>
            <div className="bridge3d-clearance-preview">
              {centralBox?.kind === "box" ? <article>
                <b>{centralBox.label}</b>
                <span>Pusat Y {centralBox.centre.y.toFixed(2)} cm · bermula dari aras tapak</span>
              </article> : null}
              {pipe?.kind === "cylinder" ? <article>
                <b>{pipe.label}</b>
                <span>Paksi X · pusat Y {pipe.centre.y.toFixed(2)} cm · Z = {pipe.centre.z.toFixed(0)}</span>
              </article> : null}
              <article>
                <b>Zon custom / masa hadapan</b>
                <span>{customZones.length} zon tambahan dalam profil ini</span>
              </article>
            </div>
          </details>
          <details>
            <summary>Kalibrasi Bahan <em>BUKAN NILAI RASMI</em></summary>
            <p className="bridge3d-settings-note">Biarkan kosong jika belum diukur. Solver menggunakan anggaran pendidikan dan melabelkan keputusan sebagai “Anggaran Simulasi”.</p>
            <div className="bridge3d-settings-grid">
              {fields("materialCalibration", [
                ["averageSkewerMassGram", "Purata jisim sebatang lidi", "g", true],
                ["glueMassPerCmGram", "Jisim gam per cm", "g/cm", true],
                ["tensileStrengthN", "Kapasiti tegangan", "N", true],
                ["compressionStrengthN", "Kapasiti mampatan", "N", true],
                ["youngModulusMPa", "Modulus Young", "MPa", true],
              ])}
            </div>
            <label className="bridge3d-curve-field">Lengkung kalibrasi sambungan (JSON)
              <textarea value={curveText} onChange={(event) => setCurveText(event.target.value)} rows={5} />
              <button type="button" onClick={() => {
                try { setPath("materialCalibration.jointCalibration", JSON.parse(curveText)); }
                catch { setCurveText(JSON.stringify(profile.materialCalibration.jointCalibration, null, 2)); }
              }}>Gunakan lengkung</button>
            </label>
          </details>
        </div>
        <footer>
          <button type="button" onClick={onReset}>Reset ke rasmi</button>
          <button type="button" onClick={onDuplicate}>Duplicate profil</button>
          <button type="button" className="bridge3d-primary" onClick={onSave}>Simpan profil</button>
        </footer>
      </section>
    </div>
  );
}
