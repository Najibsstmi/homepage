export default function DraggableMaterial({ id, title, subtitle, placed, onDragStart }) {
  const visualType =
    id === "powder" && title.includes("PbBr")
      ? "leadBromide"
      : id === "powder" && title.includes("NaCl")
        ? "saltScoop"
        : id;

  return (
    <button
      type="button"
      className={`electroMaterial electroMaterial--visual${placed ? " electroMaterial--placed" : ""}`}
      draggable={!placed}
      onDragStart={(event) => onDragStart(event, id)}
      disabled={placed}
    >
      {visualType === "leadBromide" && (
        <span className="powderScoop" aria-hidden="true">
          <span className="powderScoop__pile" />
          <span className="powderScoop__spoon" />
          <span className="powderScoop__handle" />
        </span>
      )}
      {visualType === "electrodes" && (
        <span className="carbonElectrodeIcon" aria-hidden="true">
          <span />
          <span />
        </span>
      )}
      {visualType === "burner" && (
        <span className="burnerIcon" aria-hidden="true">
          <span className="burnerIcon__flame" />
          <span className="burnerIcon__tube" />
          <span className="burnerIcon__base" />
        </span>
      )}
      {visualType === "saltScoop" && (
        <span className="powderScoop powderScoop--salt" aria-hidden="true">
          <span className="powderScoop__pile" />
          <span className="powderScoop__spoon" />
          <span className="powderScoop__handle" />
        </span>
      )}
      {visualType === "water" && (
        <span className="waterBeakerIcon" aria-hidden="true">
          <span className="waterBeakerIcon__glass" />
          <span className="waterBeakerIcon__water" />
        </span>
      )}
      <span>{title}</span>
      <small>{placed ? "Sudah diletakkan" : subtitle}</small>
    </button>
  );
}
