import { ContactShadows, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getEffectiveClearanceZones } from "../../features/bridge3d/profile";
import { APPLIED_GLUE_RADIUS_CM } from "../../features/bridge3d/validation";
import { buildPlaneOrigin, movementPlane, type AddMode, type DragConstraint, type SnapTarget } from "../../features/bridge3d/interaction";
import { useBridgePointerInteraction } from "./useBridgePointerInteraction";
import type {
  BridgeDesign,
  BridgeMember,
  BuildPlane,
  BuildTool,
  Selection,
  StructuralResult,
  Vector3Data,
} from "../../features/bridge3d/types";

export type CameraView = "perspective" | "front" | "rear" | "left" | "right" | "top" | "bottom";
export type VisibilityMode = "all" | "hideFront" | "hideRear" | "xray";

interface BridgeCanvasProps {
  design: BridgeDesign;
  tool: BuildTool;
  plane: BuildPlane;
  selection: Selection;
  pendingStart: SnapTarget | null;
  addMode: AddMode;
  crossConstraint: DragConstraint;
  interactionNonce: number;
  interactionEnabled: boolean;
  onMoveNode: (id: string, position: Vector3Data) => void;
  cameraView: CameraView;
  cameraNonce: number;
  visibility: VisibilityMode;
  ghostOtherSide: boolean;
  showClearance: boolean;
  stage: "build" | "test" | "analysis";
  loadKg: number;
  analysis: StructuralResult | null;
  deformed: boolean;
  onPoint: (target: SnapTarget | null) => void;
  onSelect: (selection: Selection) => void;
  onHoverInfo: (text: string) => void;
}

const toVector = (point: Vector3Data) => new THREE.Vector3(point.x, point.y, point.z);

function CameraController({
  view,
  nonce,
  controls,
}: {
  view: CameraView;
  nonce: number;
  controls: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    const positions: Record<CameraView, [number, number, number]> = {
      perspective: [55, 32, 55],
      front: [0, 10, 62],
      rear: [0, 10, -62],
      left: [-62, 10, 0],
      right: [62, 10, 0],
      top: [0, 70, 0.01],
      bottom: [0, -48, 0.01],
    };
    camera.position.set(...positions[view]);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 5, 0);
    if (controls.current) {
      controls.current.target.set(0, 5, 0);
      controls.current.update();
    }
  }, [camera, controls, nonce, view]);
  return null;
}

function CylinderBetween({
  start,
  end,
  radius,
  color,
  opacity = 1,
  emissive = "#000000",
  onClick,
}: {
  start: Vector3Data;
  end: Vector3Data;
  radius: number;
  color: string;
  opacity?: number;
  emissive?: string;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const geometry = useMemo(() => {
    const a = toVector(start);
    const b = toVector(end);
    const direction = b.clone().sub(a);
    const length = direction.length();
    const midpoint = a.clone().add(b).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    );
    return { length, midpoint, quaternion };
  }, [end, start]);
  return (
    <mesh position={geometry.midpoint} quaternion={geometry.quaternion} onClick={onClick} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, geometry.length, 10]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.22}
        roughness={0.67}
        metalness={0.02}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity > 0.45}
      />
    </mesh>
  );
}

function MemberMesh({
  member,
  design,
  selected,
  analysis,
  visibility,
  stage,
  deformed,
}: {
  member: BridgeMember;
  design: BridgeDesign;
  selected: boolean;
  analysis: StructuralResult | null;
  visibility: VisibilityMode;
  stage: BridgeCanvasProps["stage"];
  deformed: boolean;
}) {
  const nodeA = design.nodes.find((node) => node.id === member.nodeA);
  const nodeB = design.nodes.find((node) => node.id === member.nodeB);
  if (!nodeA || !nodeB) return null;
  if (visibility === "hideFront" && member.side === "right") return null;
  if (visibility === "hideRear" && member.side === "left") return null;
  const result = analysis?.members.find((item) => item.memberId === member.id);
  const forceColor = result?.status === "failed"
    ? "#2b3034"
    : result?.status === "warning"
      ? "#f0a629"
      : result?.mode === "tension"
        ? "#2b77d0"
        : result?.mode === "compression"
          ? "#d85245"
          : "#d5a365";
  const color = stage === "analysis" || analysis ? forceColor : "#d5a365";
  const displacementA = deformed ? analysis?.displacements[nodeA.id] : null;
  const displacementB = deformed ? analysis?.displacements[nodeB.id] : null;
  const exaggeration = 18;
  const start = displacementA ? {
    x: nodeA.position.x + displacementA.x * exaggeration,
    y: nodeA.position.y + displacementA.y * exaggeration,
    z: nodeA.position.z + displacementA.z * exaggeration,
  } : nodeA.position;
  const end = displacementB ? {
    x: nodeB.position.x + displacementB.x * exaggeration,
    y: nodeB.position.y + displacementB.y * exaggeration,
    z: nodeB.position.z + displacementB.z * exaggeration,
  } : nodeB.position;
  const hiddenSide = (member.side === "left" && visibility === "hideRear")
    || (member.side === "right" && visibility === "hideFront");
  const opacity = visibility === "xray" ? 0.36 : hiddenSide ? 0.18 : 1;
  return (
    <group>
      <CylinderBetween
        start={start}
        end={end}
        radius={design.profileSnapshot.materialRules.skewerDiameterCm / 2}
        color={selected ? "#ffca4f" : color}
        emissive={selected ? "#7d4f00" : "#000000"}
        opacity={opacity}
      />
    </group>
  );
}

function RestrictedZones({ design }: { design: BridgeDesign }) {
  const zones = getEffectiveClearanceZones(design.profileSnapshot);
  return (
    <group>
      {zones.map((zone) => zone.kind === "box" ? (
        <mesh key={zone.id} position={[zone.centre.x, zone.centre.y, zone.centre.z]}>
          <boxGeometry args={[zone.size.x, zone.size.y, zone.size.z]} />
          <meshBasicMaterial color="#ef8e51" transparent opacity={0.1} wireframe />
        </mesh>
      ) : (
        <mesh
          key={zone.id}
          position={[zone.centre.x, zone.centre.y, zone.centre.z]}
          rotation={zone.axis === "x" ? [0, 0, Math.PI / 2] : zone.axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
        >
          <cylinderGeometry args={[zone.diameterCm / 2, zone.diameterCm / 2, zone.lengthCm, 20, 1, true]} />
          <meshBasicMaterial color="#e86b4b" transparent opacity={0.1} wireframe />
        </mesh>
      ))}
    </group>
  );
}

function TestRig({ design }: { design: BridgeDesign }) {
  const span = design.profileSnapshot.loadTestRules.supportSpanCm;
  const zone = design.profileSnapshot.loadTestRules.loadingZone;
  return (
    <group>
      {[-span / 2, span / 2].map((x) => (
        <mesh key={x} position={[x, -1, 0]} receiveShadow>
          <boxGeometry args={[4, 2, 16]} />
          <meshStandardMaterial color="#65737d" metalness={0.7} roughness={0.32} />
        </mesh>
      ))}
      <mesh position={[zone.centreXcm, 11.2, 0]} castShadow>
        <boxGeometry args={[zone.lengthCm, 0.8, Math.max(zone.widthCm, 7)]} />
        <meshStandardMaterial color="#9da8ad" metalness={0.8} roughness={0.25} />
      </mesh>
      <CylinderBetween
        start={{ x: zone.centreXcm, y: 11.2, z: 0 }}
        end={{ x: zone.centreXcm, y: -6, z: 0 }}
        radius={0.18}
        color="#535e65"
      />
      <mesh position={[zone.centreXcm, -7.2, 0]} castShadow>
        <cylinderGeometry args={[2.4, 2.4, 2.4, 24]} />
        <meshStandardMaterial color="#28343c" metalness={0.72} roughness={0.28} />
      </mesh>
      <Line
        points={[[zone.centreXcm, 17, 0], [zone.centreXcm, 12.5, 0]]}
        color="#e95050"
        lineWidth={3}
      />
      <mesh position={[zone.centreXcm, 12.3, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.7, 1.6, 14]} />
        <meshBasicMaterial color="#e95050" />
      </mesh>
    </group>
  );
}

function BuildPlaneSurface({ design, plane, cross }: { design: BridgeDesign; plane: BuildPlane; cross: DragConstraint }) {
  const origin = buildPlaneOrigin(design, plane);
  const normal = movementPlane(origin, plane, cross).normal;
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  return <mesh position={[origin.x, normal.y ? origin.y : 18, origin.z]} quaternion={quaternion}>
    <planeGeometry args={[64, 42]} />
    <meshBasicMaterial color="#21898b" transparent opacity={0.065} side={THREE.DoubleSide} depthWrite={false} />
  </mesh>;
}

function Scene(props: BridgeCanvasProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { previewDesign, hover, draggingId } = useBridgePointerInteraction({
    design: props.design, tool: props.tool, plane: props.plane, addMode: props.addMode,
    crossConstraint: props.crossConstraint, visibility: props.visibility,
    enabled: props.interactionEnabled, resetKey: props.interactionNonce,
    onTarget: props.onPoint, onSelect: props.onSelect, onMoveNode: props.onMoveNode, onHoverInfo: props.onHoverInfo,
  }, controls);
  const selectedMember = props.selection?.kind === "member"
    ? props.design.members.find((member) => member.id === props.selection?.id) : null;
  const sourceGhostMembers = props.ghostOtherSide
    ? props.design.members.filter((member) => member.side === (props.plane === "right" ? "left" : "right"))
    : [];
  const nodeById = new Map(previewDesign.nodes.map((node) => [node.id, node]));
  return (
    <>
      <color attach="background" args={["#e8eef0"]} />
      <fog attach="fog" args={["#e8eef0", 75, 130]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[28, 42, 20]} intensity={2.2} castShadow shadow-mapSize={[1536, 1536]} />
      <CameraController view={props.cameraView} nonce={props.cameraNonce} controls={controls} />
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={14} maxDistance={130} />

      <gridHelper args={[60, 60, "#8fa3aa", "#c6d1d4"]} position={[0, -0.06, 0]} />
      <axesHelper args={[5]} />

      {props.stage !== "build" ? <TestRig design={props.design} /> : (
        <>
          {[-props.design.profileSnapshot.loadTestRules.supportSpanCm / 2, props.design.profileSnapshot.loadTestRules.supportSpanCm / 2].map((x) => (
            <mesh key={x} position={[x, -0.7, 0]} receiveShadow>
              <boxGeometry args={[3, 1.4, 15]} />
              <meshStandardMaterial color="#7a858b" metalness={0.5} roughness={0.42} />
            </mesh>
          ))}
        </>
      )}

      {props.showClearance ? <RestrictedZones design={props.design} /> : null}

      {props.design.members.map((member) => (
        <MemberMesh
          key={member.id}
          member={member}
          design={previewDesign}
          selected={props.selection?.kind === "member" && props.selection.id === member.id}
          analysis={props.analysis}
          visibility={props.visibility}
          stage={props.stage}
          deformed={props.deformed}
        />
      ))}

      {sourceGhostMembers.map((member) => {
        const a = nodeById.get(member.nodeA); const b = nodeById.get(member.nodeB);
        if (!a || !b) return null;
        return (
          <CylinderBetween
            key={`ghost-${member.id}`}
            start={{ ...a.position, z: -a.position.z }}
            end={{ ...b.position, z: -b.position.z }}
            radius={props.design.profileSnapshot.materialRules.skewerDiameterCm / 2}
            color="#2c9aa2"
            opacity={0.24}
          />
        );
      })}

      {previewDesign.nodes.map((node) => {
        const selected = (props.selection?.kind === "node" && props.selection.id === node.id)
          || selectedMember?.nodeA === node.id || selectedMember?.nodeB === node.id || draggingId === node.id;
        const pending = props.tool === "add" && props.pendingStart?.kind === "node" && props.pendingStart.id === node.id;
        const targeted = hover?.kind === "node" && hover.id === node.id;
        const joint = props.design.joints.find((item) => item.nodeId === node.id);
        const displaced = props.deformed ? props.analysis?.displacements[node.id] : null;
        const position: [number, number, number] = [
          node.position.x + (displaced?.x ?? 0) * 18,
          node.position.y + (displaced?.y ?? 0) * 18,
          node.position.z + (displaced?.z ?? 0) * 18,
        ];
        return (
          <group key={node.id} position={position}>
            <mesh>
              <sphereGeometry args={[pending || targeted ? 0.48 : selected ? 0.42 : props.tool === "add" ? 0.36 : 0.31, 14, 10]} />
              <meshStandardMaterial color={pending ? "#ffae19" : targeted ? "#2caed0" : selected ? "#ffcc55" : props.tool === "add" ? "#177d85" : "#5b4432"} roughness={0.6} />
            </mesh>
            {pending || targeted || selected ? <mesh>
              <sphereGeometry args={[0.7, 16, 12]} />
              <meshBasicMaterial color={pending ? "#ffb21d" : "#23a5ba"} wireframe transparent opacity={0.4} depthWrite={false} />
            </mesh> : null}
            {joint?.glueUsedCm ? (
              <mesh>
                <sphereGeometry args={[APPLIED_GLUE_RADIUS_CM, 12, 8]} />
                <meshPhysicalMaterial color="#f1dfb6" transparent opacity={0.5} roughness={0.42} />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {props.tool === "add" && props.pendingStart ? <mesh position={toVector(props.pendingStart.position)}>
        <sphereGeometry args={[0.65, 16, 12]} />
        <meshBasicMaterial color="#ffb21d" wireframe />
      </mesh> : null}
      {props.tool === "add" && props.pendingStart && hover
        && toVector(props.pendingStart.position).distanceTo(toVector(hover.position)) > 0.01 ? (
        <CylinderBetween start={props.pendingStart.position} end={hover.position}
          radius={props.design.profileSnapshot.materialRules.skewerDiameterCm / 2} color="#2a9da5" opacity={0.48} />
      ) : null}
      {hover && props.tool === "add" ? <mesh position={toVector(hover.position)}>
        <sphereGeometry args={[0.45, 12, 8]} />
        <meshBasicMaterial color="#2a9da5" transparent opacity={0.72} />
      </mesh> : null}
      {props.tool === "add" && props.addMode === "free" && props.interactionEnabled
        ? <BuildPlaneSurface design={props.design} plane={props.plane} cross={props.crossConstraint} /> : null}
      <ContactShadows position={[0, -1.45, 0]} opacity={0.24} scale={72} blur={2.6} far={20} />
    </>
  );
}

export default function BridgeCanvas(props: BridgeCanvasProps) {
  const clearanceZones = getEffectiveClearanceZones(props.design.profileSnapshot);
  return (
    <div className="bridge3d-canvas" aria-label="Ruang kerja pembinaan jambatan 3D">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [55, 32, 55], fov: 42, near: 0.1, far: 260 }}
      >
        <Scene {...props} />
      </Canvas>
      {props.showClearance ? (
        <div className="bridge3d-clearance-legend" aria-label="Petunjuk zon kelegaan">
          {clearanceZones.slice(0, 2).map((zone) => <span key={zone.id}>{zone.label}</span>)}
        </div>
      ) : null}
    </div>
  );
}
