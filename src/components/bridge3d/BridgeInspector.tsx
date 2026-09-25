import { useMemo, useState } from "react";
import { calculateBridgeMass, getInventorySummary } from "../../features/bridge3d/inventory";
import { displayLabel } from "../../features/bridge3d/displayLabels";
import type {
  BridgeDesign,
  MemberRole,
  Selection,
  StructuralResult,
  Vector3Data,
} from "../../features/bridge3d/types";

function NodeEditor({
  position,
  onMove,
}: {
  position: Vector3Data;
  onMove: (position: Vector3Data) => void;
}) {
  const [draft, setDraft] = useState(position);
  return (
    <div className="bridge3d-coordinate-editor">
      {(["x", "y", "z"] as const).map((axis) => (
        <label key={axis}>{axis.toUpperCase()} (cm)
          <input
            type="number"
            step="1"
            value={draft[axis]}
            onChange={(event) => setDraft((current) => ({ ...current, [axis]: Number(event.target.value) }))}
          />
        </label>
      ))}
      <button type="button" onClick={() => onMove(draft)}>Gunakan koordinat</button>
    </div>
  );
}

export default function BridgeInspector({
  design,
  selection,
  analysis,
  glueAmount,
  onGlueAmount,
  onMoveNode,
  onDeleteMember,
  onReplaceMember,
  onRole,
  onGlue,
  onInventoryMode,
  onSelectNode,
  readOnly = false,
}: {
  design: BridgeDesign;
  selection: Selection;
  analysis: StructuralResult | null;
  glueAmount: number;
  onGlueAmount: (amount: number) => void;
  onMoveNode: (nodeId: string, position: Vector3Data) => void;
  onDeleteMember: (memberId: string) => void;
  onReplaceMember: (memberId: string) => void;
  onRole: (memberId: string, role: MemberRole) => void;
  onGlue: (jointId: string) => void;
  onInventoryMode: (mode: BridgeDesign["selectedInventoryMode"]) => void;
  onSelectNode: (id: string) => void;
  readOnly?: boolean;
}) {
  const [showSticks, setShowSticks] = useState(false);
  const inventory = useMemo(() => getInventorySummary(design.sticks), [design.sticks]);
  const glueUsed = design.joints.reduce((sum, joint) => sum + joint.glueUsedCm, 0);
  const glueTotal = design.profileSnapshot.materialRules.glueRefillCount
    * design.profileSnapshot.materialRules.glueRefillLengthCm;
  const mass = calculateBridgeMass(design.sticks, glueUsed, design.profileSnapshot);
  const node = selection?.kind === "node" ? design.nodes.find((item) => item.id === selection.id) : null;
  const member = selection?.kind === "member" ? design.members.find((item) => item.id === selection.id) : null;
  const joint = selection?.kind === "joint"
    ? design.joints.find((item) => item.id === selection.id)
    : node ? design.joints.find((item) => item.nodeId === node.id) : null;
  const memberAnalysis = member ? analysis?.members.find((item) => item.memberId === member.id) : null;
  const jointAnalysis = joint ? analysis?.joints.find((item) => item.jointId === joint.id) : null;
  const selectionLabel = selection?.kind === "node" ? "NOD"
    : selection?.kind === "member" ? "LIDI"
      : selection?.kind === "joint" ? "SAMBUNGAN" : "TIADA PILIHAN";
  const sideLabels = { left: "Truss kiri", right: "Truss kanan", base: "Tapak", cross: "Cross bracing" };

  return (
    <aside className="bridge3d-inspector">
      <section>
        <div className="bridge3d-section-title"><span>PEMERIKSA</span><b>{selectionLabel}</b></div>
        {!selection ? <p className="bridge3d-muted">Klik nod atau lidi pada model 3D untuk melihat butiran.</p> : null}
        {node ? (
          <div className="bridge3d-detail-card">
            <h3>{displayLabel(design, "node", node.id)}</h3>
            <p>{joint?.connectedMemberIds.length ?? 0} lidi bersambung</p>
            {!readOnly ? <details className="bridge3d-precision" open>
              <summary>Koordinat tepat (lanjutan)</summary>
              <p>Untuk alih dengan jari/mouse, pilih alat Alih pada ruang 3D.</p>
              <NodeEditor key={`${node.id}:${node.position.x}:${node.position.y}:${node.position.z}`}
                position={node.position} onMove={(position) => onMoveNode(node.id, position)} />
            </details> : null}
            {joint && !readOnly ? (
              <button type="button" className="bridge3d-secondary" onClick={() => onGlue(joint.id)}>
                Gunakan {glueAmount.toFixed(2)} cm gam
              </button>
            ) : null}
          </div>
        ) : null}
        {member ? (
          <div className="bridge3d-detail-card">
            <h3>{displayLabel(design, "member", member.id)}</h3>
            <dl>
              <div><dt>Panjang</dt><dd>{member.lengthCm.toFixed(2)} cm</dd></div>
              <div><dt>Sumber</dt><dd>{member.sourceStickId.replace("stick-", "Lidi fizikal ")}</dd></div>
              <div><dt>Bahagian</dt><dd>{sideLabels[member.side]}</dd></div>
              {memberAnalysis ? <><div><dt>Daya</dt><dd>{memberAnalysis.forceN.toFixed(1)} N</dd></div><div><dt>Keadaan</dt><dd>{memberAnalysis.mode === "tension" ? "Tegangan" : memberAnalysis.mode === "compression" ? "Mampatan" : "Neutral"}</dd></div><div><dt>Utilisasi</dt><dd>{(memberAnalysis.utilization * 100).toFixed(0)}%</dd></div></> : null}
            </dl>
            <label>Peranan
              <select disabled={readOnly} value={member.role} onChange={(event) => onRole(member.id, event.target.value as MemberRole)}>
                <option value="truss">Truss</option>
                <option value="baseLongitudinal">Tapak memanjang</option>
                <option value="baseBinding">Pengikat tapak</option>
                <option value="crossBracing">Cross bracing</option>
              </select>
            </label>
            {!readOnly ? <div className="bridge3d-member-actions">
              <button type="button" onClick={() => onSelectNode(member.nodeA)}>Alih hujung A · {displayLabel(design, "node", member.nodeA)}</button>
              <button type="button" onClick={() => onSelectNode(member.nodeB)}>Alih hujung B · {displayLabel(design, "node", member.nodeB)}</button>
              <button type="button" onClick={() => onReplaceMember(member.id)}>Ganti lidi</button>
              <button type="button" className="bridge3d-danger" onClick={() => onDeleteMember(member.id)}>Padam lidi</button>
            </div> : null}
            {design.members.some((item) => item.id !== member.id && item.physicalPieceId === (member.physicalPieceId ?? member.id))
              ? <p>Bahagian ini berkongsi satu lidi fizikal. Padam atau ganti akan melibatkan keseluruhan lidi asal.</p> : null}
          </div>
        ) : null}
        {joint && !node ? (
          <div className="bridge3d-detail-card">
            <h3>{displayLabel(design, "joint", joint.id)}</h3>
            <p>{joint.connectedMemberIds.length} lidi · {joint.glueUsedCm.toFixed(2)} cm gam</p>
            {jointAnalysis ? <p>Kapasiti {jointAnalysis.capacityN.toFixed(1)} N · Utilisasi {(jointAnalysis.utilization * 100).toFixed(0)}%</p> : null}
            {!readOnly ? <button type="button" onClick={() => onGlue(joint.id)}>Tambah gam</button> : null}
          </div>
        ) : null}
      </section>

      {!readOnly ? <section>
        <div className="bridge3d-section-title"><span>GAM</span><b>{glueUsed.toFixed(2)} / {glueTotal.toFixed(2)} cm</b></div>
        <label>Jumlah setiap klik
          <input type="range" min="0.1" max="2" step="0.1" value={glueAmount} onChange={(event) => onGlueAmount(Number(event.target.value))} />
          <output>{glueAmount.toFixed(2)} cm</output>
        </label>
      </section> : null}

      {!readOnly ? <section>
        <div className="bridge3d-section-title"><span>INVENTORI LIDI</span><b>{inventory.sticksStarted}/{design.sticks.length} dimulakan</b></div>
        <div className="bridge3d-inventory-summary">
          <span><b>{inventory.sticksUntouched}</b> belum digunakan</span>
          <span><b>{inventory.usableOffcuts}</b> offcut</span>
          <span><b>{inventory.totalLengthUsedCm.toFixed(1)}</b> cm digunakan</span>
        </div>
        <label>Ambil bahan
          <select value={design.selectedInventoryMode} onChange={(event) => onInventoryMode(event.target.value as BridgeDesign["selectedInventoryMode"])}>
            <option value="auto">Auto: offcut dahulu</option>
            <option value="new">Lidi baharu</option>
            <option value="offcut">Offcut sahaja</option>
          </select>
        </label>
        <button type="button" className="bridge3d-link-button" onClick={() => setShowSticks((value) => !value)}>
          {showSticks ? "Sembunyikan senarai" : "Lihat 30 lidi"}
        </button>
        {showSticks ? (
          <div className="bridge3d-stick-list">
            {design.sticks.map((stick) => {
              const remaining = stick.remainingSegments.reduce((sum, segment) => sum + segment.lengthCm, 0);
              return (
                <div key={stick.id}>
                  <span>{stick.id.replace("stick-", "Lidi ")}</span>
                  <i><em style={{ width: `${Math.min(100, remaining / stick.originalLengthCm * 100)}%` }} /></i>
                  <b>{remaining.toFixed(1)} cm</b>
                </div>
              );
            })}
          </div>
        ) : null}
      </section> : null}

      <section className="bridge3d-mass-card">
        <span>JISIM JAMBATAN</span>
        <strong>{mass.massGram?.toFixed(2) ?? "—"} g</strong>
        <small>{mass.estimated ? "Anggaran Simulasi · masukkan kalibrasi untuk nilai eksperimen" : "Berdasarkan kalibrasi guru"}</small>
      </section>
    </aside>
  );
}
