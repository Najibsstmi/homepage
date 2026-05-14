import {
  factorOrder,
  reactionFactors,
  sizeOptionIds,
  sulfuricAcidConcentration,
  temperatureCompletionTarget,
  zincMass,
} from "../../data/reactionRateData";
import TemperatureThermometerControl from "./TemperatureThermometerControl";

const thiosulfateWordEquation = "Natrium tiosulfat + asid sulfurik → natrium sulfat + sulfur dioksida + sulfur + air";
const zincWordEquation = "Zink + asid hidroklorik → zink klorida + gas hidrogen";

function UnitLabel({ value }) {
  return (
    <>
      {value.replace(" mol dm-3", "")} mol dm<sup>-3</sup>
    </>
  );
}

export default function ReactionFactorPanel({
  activeFactor,
  selectedOptions,
  completedRuns,
  concentrationRuns = {},
  temperatureRuns = {},
  running,
  selectedTemperature = 30,
  onFactorChange,
  onOptionChange,
  onTemperatureChange,
}) {
  const factor = reactionFactors[activeFactor];
  const selectedOption = selectedOptions[activeFactor] || factor.options[0].id;
  const isConcentration = activeFactor === "concentration";
  const isTemperature = activeFactor === "temperature";
  const temperatureDoneCount = Array.isArray(temperatureRuns)
    ? temperatureRuns.length
    : Object.keys(temperatureRuns).length;

  return (
    <aside className="electroPanel reactionFactorPanel">
      <div className="reactionFactorPanel__head">
        <h2>Faktor &amp; Bahan</h2>
        <div className="reactionTabs" role="tablist" aria-label="Faktor kadar tindak balas">
          {factorOrder.map((id) => (
            <button
              key={id}
              type="button"
              className={activeFactor === id ? "reactionTab reactionTab--active" : "reactionTab"}
              disabled={running}
              onClick={() => onFactorChange(id)}
            >
              {reactionFactors[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className={activeFactor === "size" ? "reactionFactorPanel__body reactionFactorPanel__body--withStatus" : "reactionFactorPanel__body"}>
        <div className="reactionFactorInfo">
          <div className="reactionFactorInfo__text">
            <span>Pemboleh ubah dimanipulasikan</span>
            <strong>{factor.variable}</strong>
            {!isConcentration && factor.prompt && <p>{factor.prompt}</p>}
          </div>

          {isTemperature ? (
            <div className="reactionTemperaturePanelReadout" aria-live="polite">
              <div className="reactionTemperaturePanelReadout__head">
                <span>Suhu semasa</span>
                <small>{Math.min(temperatureDoneCount, temperatureCompletionTarget)}/{temperatureCompletionTarget} bacaan selesai</small>
              </div>
              <TemperatureThermometerControl
                temperature={selectedTemperature}
                running={running}
                onChange={onTemperatureChange}
              />
            </div>
          ) : (
            <div
              className={isConcentration ? "reactionOptionList reactionOptionList--concentration" : "reactionOptionList"}
              aria-label={`Pilihan ${factor.label}`}
            >
              {factor.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={selectedOption === option.id ? "reactionOption reactionOption--active" : "reactionOption"}
                  disabled={running}
                  onClick={() => onOptionChange(activeFactor, option.id)}
                >
                  <span>{isConcentration ? <UnitLabel value={option.label} /> : option.label}</span>
                  {isConcentration ? (
                    <small>{concentrationRuns[option.id] ? "Selesai" : "Belum diuji"}</small>
                  ) : (
                    option.note && <small>{option.note}</small>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="reactionFactorStack">
          {isTemperature ? (
            <>
              <div className="reactionMassCard">
                <span>Bahan tetap</span>
                <strong>Asid sulfurik <UnitLabel value={sulfuricAcidConcentration} /></strong>
              </div>

              <div className="electroNote reactionEquation">
                <strong>Eksperimen utama</strong>
                <p>{thiosulfateWordEquation}</p>
              </div>
            </>
          ) : isConcentration ? (
            <>
              <div className="reactionMassCard">
                <span>Bahan tetap</span>
                <strong>Asid sulfurik <UnitLabel value={sulfuricAcidConcentration} /></strong>
              </div>

              <div className="electroNote reactionEquation">
                <strong>Eksperimen utama</strong>
                <p>{thiosulfateWordEquation}</p>
              </div>
            </>
          ) : (
            <>
              <div className="reactionMassCard">
                <span>Jisim zink</span>
                <strong>{zincMass} g (tetap)</strong>
              </div>

              <div className="electroNote reactionEquation">
                <strong>Eksperimen utama</strong>
                <p>{zincWordEquation}</p>
              </div>
            </>
          )}
        </div>

        {activeFactor === "size" && (
          <div className="reactionRunStatus">
            <strong>Status eksperimen</strong>
            <div className="reactionRunStatus__grid">
              {sizeOptionIds.map((id) => {
                const option = factor.options.find((item) => item.id === id);
                const done = Boolean(completedRuns[id]);
                return (
                  <div key={id} className={done ? "reactionRunStatus__row reactionRunStatus__row--done" : "reactionRunStatus__row"}>
                    <span>{option?.label}</span>
                    <small>{done ? "Selesai" : "Belum diuji"}</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
