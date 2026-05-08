export default function ControlsPanel({
  heightCm,
  setHeightCm,
  massKg,
  setMassKg,
  cartCount,
  setCartCount,
  running,
  paused,
  onStart,
  onPause,
  onReset,
  onGenerateData,
}) {
  return (
    <aside className="linearPanel linearPanel--controls">
      <h2>Kawalan Simulasi</h2>

      <label>
        <span>Ketinggian cerun</span>
        <strong>{heightCm} cm</strong>
        <input
          type="range"
          min="0"
          max="60"
          value={heightCm}
          onChange={(event) => setHeightCm(Number(event.target.value))}
        />
      </label>

      <label>
        <span>Jisim troli</span>
        <strong>{massKg.toFixed(1)} kg</strong>
        <input
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={massKg}
          onChange={(event) => setMassKg(Number(event.target.value))}
        />
      </label>

      <label>
        <span>Bilangan troli</span>
        <strong>{cartCount} troli</strong>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={cartCount}
          onChange={(event) => setCartCount(Number(event.target.value))}
        />
      </label>

      <div className="linearSim__actions">
        <button type="button" onClick={onStart}>
          Mula
        </button>
        <button
          type="button"
          onClick={onPause}
          aria-label={paused ? "Sambung simulasi" : "Pause simulasi"}
          title={paused ? "Sambung simulasi" : "Pause simulasi"}
          disabled={!running}
        >
          {paused ? "▶" : "||"}
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button type="button" onClick={onGenerateData}>
          Jana Data
        </button>
      </div>
    </aside>
  );
}
