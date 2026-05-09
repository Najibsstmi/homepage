export default function MaterialTray({
  selectedMaterial,
  ballPlaced,
  dropHeight,
  onSelectMaterial,
  onPlaceBall,
  onHeightChange,
}) {
  const handleDragStart = (event, id) => {
    event.dataTransfer.setData("text/plain", id);
  };

  return (
    <aside className="electroPanel alloyTray">
      <h2>Bahan & Radas</h2>

      {[
        ["pure", "Logam tulen", "Lekukan dijangka lebih dalam"],
        ["alloy", "Aloi", "Lekukan dijangka lebih cetek"],
      ].map(([id, title, subtitle]) => (
        <button
          key={id}
          type="button"
          draggable
          onDragStart={(event) => handleDragStart(event, id)}
          onClick={() => onSelectMaterial(id)}
          className={`alloyMaterialCard ${selectedMaterial === id ? "alloyMaterialCard--active" : ""}`}
        >
          <span className={`alloyBlockIcon alloyBlockIcon--${id}`} />
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </button>
      ))}

      <button
        type="button"
        draggable
        onDragStart={(event) => handleDragStart(event, "steel-ball")}
        onClick={onPlaceBall}
        className={`alloyMaterialCard alloyBallCard ${ballPlaced ? "alloyMaterialCard--active" : ""}`}
      >
        <span className="steelBallIcon" />
        <strong>Bebola keluli</strong>
        <small>Seret atau tekan untuk letak di atas bongkah</small>
      </button>

      <label className="alloyHeightControl">
        <span>Ketinggian jatuhan</span>
        <strong>{dropHeight === "low" ? "Rendah" : dropHeight === "high" ? "Tinggi" : "Sederhana"}</strong>
        <select value={dropHeight} onChange={(event) => onHeightChange(event.target.value)}>
          <option value="low">Rendah</option>
          <option value="medium">Sederhana</option>
          <option value="high">Tinggi</option>
        </select>
      </label>

      <div className="electroNote">
        <strong>Nota ringkas</strong>
        <p>
          Semakin cetek lekukan, semakin keras bongkah. Aloi lebih keras kerana atom berlainan
          saiz menghalang lapisan atom daripada menggelongsor.
        </p>
      </div>
    </aside>
  );
}
