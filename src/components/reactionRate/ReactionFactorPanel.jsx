import {
  factorOrder,
  reactionFactors,
  sizeOptionIds,
  sulfuricAcidConcentration,
  zincMass,
} from "../../data/reactionRateData";

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
  running,
  onFactorChange,
  onOptionChange,
}) {
  const factor = reactionFactors[activeFactor];
  const selectedOption = selectedOptions[activeFactor] || factor.options[0].id;
  const isConcentration = activeFactor === "concentration";

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
        </div>

        <div className="reactionFactorStack">
          {isConcentration ? (
            <>
              <div className="reactionMassCard">
                <span>Bahan tetap</span>
                <strong>H<sub>2</sub>SO<sub>4</sub> <UnitLabel value={sulfuricAcidConcentration} /></strong>
              </div>

              <div className="electroNote reactionEquation">
                <strong>Eksperimen utama</strong>
                <p>
                  Na<sub>2</sub>S<sub>2</sub>O<sub>3</sub> + H<sub>2</sub>SO<sub>4</sub> &rarr; Na<sub>2</sub>SO<sub>4</sub> + SO<sub>2</sub> + S + H<sub>2</sub>O
                </p>
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
                <p>Zn + 2HCl {'->'} ZnCl2 + H2</p>
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
