import { ContactShadows, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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
  pendingStart: Vector3Data | null;
  cameraView: CameraView;
  cameraNonce: number;
  visibility: VisibilityMode;
  ghostOtherSide: boolean;
  showClearance: boolean;
  stage: "build" | "test" | "analysis";
  loadKg: number;
  analysis: StructuralResult | null;
  deformed: boolean;
  onPoint: (point: Vector3Data, snapLabel: string) => void;
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
  onSelect,
}: {
  member: BridgeMember;
  design: BridgeDesign;
  selected: boolean;
  analysis: StructuralResult | null;
  visibility: VisibilityMode;
  stage: BridgeCanvasProps["stage"];
  deformed: boolean;
  onSelect: (selection: Selection) => void;
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
        onClick={(event) => {
          event.stopPropagation();
          onSelect({ kind: "member", id: member.id });
        }}
      />
      <CylinderBetween
        start={start}
        end={end}
        radius={0.6}
        color="#ffffff"
        opacity={0.001}
        onClick={(event) => {
          event.stopPropagation();
          onSelect({ kind: "member", id: member.id });
        }}
      />
    </group>
  );
}

function RestrictedZones({ design }: { design: BridgeDesign }) {
  return (
    <group>
      {design.profileSnapshot.restrictedZones.map((zone) => zone.kind === "box" ? (
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

function BuildPlaneSurface({
  plane,
  design,
  active,
  onHover,
  onPoint,
}: {
  plane: BuildPlane;
  design: BridgeDesign;
  active: boolean;
  onHover: (point: Vector3Data, snapLabel: string) => void;
  onPoint: (point: Vector3Data, snapLabel: string) => void;
}) {
  const width = design.profileSnapshot.bridgeRules.maxWidthCm;
  const position: [number, number, number] = plane === "left"
    ? [0, 18, -width / 2]
    : plane === "right"
      ? [0, 18, width / 2]
      : [0, 0, 0];
  const rotation: [number, number, number] = plane === "base" || plane === "cross"
    ? [-Math.PI / 2, 0, 0]
    : [0, 0, 0];
  const snap = (raw: THREE.Vector3) => {
    let point = { x: Math.round(raw.x), y: Math.max(0, Math.round(raw.y)), z: Math.round(raw.z) };
    if (plane === "left") point.z = -width / 2;
    if (plane === "right") point.z = width / 2;
    if (plane === "base") point.y = 0;
    const nearest = design.nodes
      .map((node) => ({ node, distance: Math.hypot(
        node.position.x - point.x,
        node.position.y - point.y,
        node.position.z - point.z,
      ) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance <= 1.4) {
      point = { ...nearest.node.position };
      return { point, label: `Snap: ${nearest.node.id.replace("node-", "Nod ").slice(0, 12)}` };
    }
    return { point, label: `Snap: Grid ${point.x}, ${point.y}, ${point.z} cm` };
  };
  if (!active) return null;
  return (
    <mesh
      position={position}
      rotation={rotation}
      onPointerMove={(event) => {
        event.stopPropagation();
        const snapped = snap(event.point);
        onHover(snapped.point, snapped.label);
      }}
      onClick={(event) => {
        event.stopPropagation();
        const snapped = snap(event.point);
        onPoint(snapped.point, snapped.label);
      }}
    >
      <planeGeometry args={[64, 42]} />
      <meshBasicMaterial transparent opacity={0.001} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function Scene(props: BridgeCanvasProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const [hoverPoint, setHoverPoint] = useState<Vector3Data | null>(null);
  const handleHover = (point: Vector3Data, label: string) => {
    setHoverPoint(point);
    const liveLength = props.pendingStart
      ? Math.hypot(
        point.x - props.pendingStart.x,
        point.y - props.pendingStart.y,
        point.z - props.pendingStart.z,
      )
      : null;
    props.onHoverInfo(liveLength === null ? label : `${label} · Panjang ${liveLength.toFixed(1)} cm`);
  };
  const sourceGhostMembers = props.ghostOtherSide
    ? props.design.members.filter((member) => member.side === (props.plane === "right" ? "left" : "right"))
    : [];
  const nodeById = new Map(props.design.nodes.map((node) => [node.id, node]));
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
          design={props.design}
          selected={props.selection?.kind === "member" && props.selection.id === member.id}
          analysis={props.analysis}
          visibility={props.visibility}
          stage={props.stage}
          deformed={props.deformed}
          onSelect={props.onSelect}
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

      {props.design.nodes.map((node) => {
        const selected = props.selection?.kind === "node" && props.selection.id === node.id;
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
              <sphereGeometry args={[selected ? 0.46 : 0.31, 14, 10]} />
              <meshStandardMaterial color={selected ? "#ffcc55" : "#5b4432"} roughness={0.6} />
            </mesh>
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                if (props.tool === "add") props.onPoint(node.position, `Snap: ${node.id}`);
                else props.onSelect({ kind: "node", id: node.id });
              }}
            >
              <sphereGeometry args={[0.78, 10, 8]} />
              <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
            </mesh>
            {joint?.glueUsedCm ? (
              <mesh
                scale={[1.15, 0.8, 1.15]}
                onClick={(event) => {
                  event.stopPropagation();
                  if (props.tool === "glue") props.onSelect({ kind: "node", id: node.id });
                  else props.onSelect({ kind: "joint", id: joint.id });
                }}
              >
                <sphereGeometry args={[0.42, 12, 8]} />
                <meshPhysicalMaterial color="#f1dfb6" transparent opacity={0.5} roughness={0.42} />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {props.pendingStart && hoverPoint ? (
        <CylinderBetween
          start={props.pendingStart}
          end={hoverPoint}
          radius={props.design.profileSnapshot.materialRules.skewerDiameterCm / 2}
          color="#2a9da5"
          opacity={0.48}
        />
      ) : null}
      {hoverPoint && props.tool === "add" ? (
        <mesh position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]}>
          <sphereGeometry args={[0.42, 12, 8]} />
          <meshBasicMaterial color="#2a9da5" transparent opacity={0.72} />
        </mesh>
      ) : null}

      <BuildPlaneSurface
        plane={props.plane}
        design={props.design}
        active={props.tool === "add" && props.stage === "build"}
        onHover={handleHover}
        onPoint={props.onPoint}
      />
      <ContactShadows position={[0, -1.45, 0]} opacity={0.24} scale={72} blur={2.6} far={20} />
    </>
  );
}

export default function BridgeCanvas(props: BridgeCanvasProps) {
  return (
    <div className="bridge3d-canvas" aria-label="Ruang kerja pembinaan jambatan 3D">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [55, 32, 55], fov: 42, near: 0.1, far: 260 }}
        onPointerMissed={() => props.onSelect(null)}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
