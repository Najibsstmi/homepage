import { factorOrder, reactionFactors, sizeOptionIds, zincMass } from "../../data/reactionRateData";

export default function ReactionFactorPanel({ activeFactor, selectedOptions, completedRuns, running, onFactorChange, onOptionChange }) {
  const factor = reactionFactors[activeFactor];
  const selectedOption = selectedOptions[activeFactor] || factor.options[0].id;

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
              onClick={() => onFactorChange(id)}
            >
              {reactionFactors[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="reactionFactorInfo">
        <span>Pemboleh ubah dimanipulasikan</span>
        <strong>{factor.variable}</strong>
        {factor.prompt && <p>{factor.prompt}</p>}
        <div className="reactionOptionList" aria-label={`Pilihan ${factor.label}`}>
          {factor.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={selectedOption === option.id ? "reactionOption reactionOption--active" : "reactionOption"}
              disabled={running}
              onClick={() => onOptionChange(activeFactor, option.id)}
            >
              <span>{option.label}</span>
              {option.note && <small>{option.note}</small>}
            </button>
          ))}
        </div>
      </div>

      <div className="reactionMassCard">
        <span>Jisim zink</span>
        <strong>{zincMass} g (tetap)</strong>
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

      <div className="electroNote reactionEquation">
        <strong>Eksperimen utama</strong>
        <p>Zn + 2HCl {'->'} ZnCl2 + H2</p>
      </div>
    </aside>
  );
}
