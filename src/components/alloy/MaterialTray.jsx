export default function MaterialTray({
  selectedMaterial,
  dropHeight,
  onSelectMaterial,
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

      <div className="alloyMaterialCard alloyBallCard alloyBallCard--static">
        <span className="steelBallIcon" />
        <strong>Bebola keluli 1 kg</strong>
        <small>Jisim tetap, sudah tergantung pada radas</small>
      </div>

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
