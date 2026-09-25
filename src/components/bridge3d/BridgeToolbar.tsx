import type { BuildPlane, BuildTool } from "../../features/bridge3d/types";
import type { CameraView, VisibilityMode } from "./BridgeCanvas";

const TOOLS: Array<{ id: BuildTool; icon: string; label: string }> = [
  { id: "select", icon: "↖", label: "Pilih" },
  { id: "add", icon: "+", label: "Tambah lidi" },
  { id: "glue", icon: "●", label: "Gam" },
  { id: "move", icon: "✥", label: "Alih" },
  { id: "delete", icon: "×", label: "Padam" },
  { id: "measure", icon: "↔", label: "Ukur" },
];

const PLANES: Array<{ id: BuildPlane; label: string }> = [
  { id: "left", label: "Truss kiri" },
  { id: "right", label: "Truss kanan" },
  { id: "base", label: "Tapak / lantai" },
  { id: "cross", label: "Cross bracing 3D" },
];

export default function BridgeToolbar({
  tool,
  plane,
  cameraView,
  visibility,
  ghostOtherSide,
  showClearance,
  canUndo,
  canRedo,
  onTool,
  onPlane,
  onView,
  onVisibility,
  onGhost,
  onClearance,
  onUndo,
  onRedo,
  onFit,
}: {
  tool: BuildTool;
  plane: BuildPlane;
  cameraView: CameraView;
  visibility: VisibilityMode;
  ghostOtherSide: boolean;
  showClearance: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: BuildTool) => void;
  onPlane: (plane: BuildPlane) => void;
  onView: (view: CameraView) => void;
  onVisibility: (visibility: VisibilityMode) => void;
  onGhost: () => void;
  onClearance: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
}) {
  return (
    <aside className="bridge3d-toolbar" aria-label="Alat pembinaan">
      <div className="bridge3d-toolbar__group">
        <span>ALAT</span>
        <div className="bridge3d-toolbar__tools">
          {TOOLS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={tool === item.id ? "is-active" : ""}
              aria-pressed={tool === item.id}
              onClick={() => onTool(item.id)}
              title={item.label}
            >
              <b>{item.icon}</b>{item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bridge3d-toolbar__group">
        <span>SATAH BINAAN</span>
        <select aria-label="Satah binaan" value={plane} onChange={(event) => onPlane(event.target.value as BuildPlane)}>
          {PLANES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
      </div>
      <div className="bridge3d-toolbar__group bridge3d-toolbar__compact">
        <span>PANDANGAN</span>
        <select aria-label="Pandangan" value={cameraView} onChange={(event) => onView(event.target.value as CameraView)}>
          <option value="perspective">Perspektif</option>
          <option value="front">Hadapan</option>
          <option value="rear">Belakang</option>
          <option value="left">Kiri</option>
          <option value="right">Kanan</option>
          <option value="top">Atas</option>
          <option value="bottom">Bawah</option>
        </select>
        <button type="button" onClick={onFit}>⌖ Fit Bridge</button>
      </div>
      <div className="bridge3d-toolbar__group bridge3d-toolbar__compact">
        <span>VISUAL</span>
        <select aria-label="Paparan struktur" value={visibility} onChange={(event) => onVisibility(event.target.value as VisibilityMode)}>
          <option value="all">Show All</option>
          <option value="hideFront">Hide Front</option>
          <option value="hideRear">Hide Rear</option>
          <option value="xray">X-Ray</option>
        </select>
        <button type="button" className={ghostOtherSide ? "is-active" : ""} onClick={onGhost}>Ghost sisi lain</button>
        <button type="button" className={showClearance ? "is-active" : ""} onClick={onClearance}>Zon kelegaan</button>
      </div>
      <div className="bridge3d-toolbar__history">
        <button type="button" onClick={onUndo} disabled={!canUndo}>↶ Undo</button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>↷ Redo</button>
      </div>
    </aside>
  );
}
