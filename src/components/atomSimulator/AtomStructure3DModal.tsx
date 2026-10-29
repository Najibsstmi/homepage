import { Bounds, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ATOM_ELEMENTS, type ElementSymbol } from "../../data/atomSimulator/CompoundDatabase";
import type { AtomBond, AtomNode } from "../../utils/atomSimulator/ClassificationEngine";
import ChemicalFormula from "./ChemicalFormula";

type AtomStructure3DModalProps = {
  atoms: AtomNode[];
  bonds: AtomBond[];
  formula: string;
  name: string;
  onClose: () => void;
};

type Point3D = [number, number, number];

const atomRadii: Record<ElementSymbol, number> = {
  H: 0.48,
  O: 0.64,
  C: 0.68,
  N: 0.65,
  Na: 0.76,
  Cl: 0.73,
};

export default function AtomStructure3DModal({
  atoms,
  bonds,
  formula,
  name,
  onClose,
}: AtomStructure3DModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="atom3DOverlay" role="presentation" onMouseDown={onClose}>
      <section
        className="atom3DModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atom-3d-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="atom3DModal__header">
          <div>
            <span>Model Molekul Interaktif</span>
            <h2 id="atom-3d-title">Paparan 3D</h2>
            <p>
              <ChemicalFormula value={formula} /> · {name}
            </p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Tutup paparan 3D">
            Tutup
          </button>
        </header>

        <div
          className="atom3DViewport"
          role="img"
          aria-label={`Model tiga dimensi ${name}, formula ${formula}`}
        >
          <Canvas camera={{ position: [0, 0.5, 12], fov: 44 }} dpr={[1, 1.75]}>
            <color attach="background" args={["#071426"]} />
            <ambientLight intensity={1.25} />
            <directionalLight position={[5, 7, 8]} intensity={2.2} color="#e0f2fe" />
            <pointLight position={[-6, -3, 5]} intensity={28} color="#22d3ee" distance={18} />
            <Bounds fit clip observe margin={1.55}>
              <AtomModel atoms={atoms} bonds={bonds} />
            </Bounds>
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.08}
              minDistance={3}
              maxDistance={30}
            />
          </Canvas>
        </div>

        <footer className="atom3DModal__footer">
          <span>Seret untuk memutar</span>
          <span>Skrol atau cubit untuk zum</span>
          <span>Klik kanan untuk mengalih model</span>
        </footer>
      </section>
    </div>
  );
}

function AtomModel({ atoms, bonds }: { atoms: AtomNode[]; bonds: AtomBond[] }) {
  const positions = useMemo(() => getAtomPositions(atoms), [atoms]);

  return (
    <group>
      {bonds.map((bond) => {
        const start = positions.get(bond.from);
        const end = positions.get(bond.to);

        return start && end ? (
          <BondMesh key={bond.id} start={start} end={end} kind={bond.kind} />
        ) : null;
      })}

      {atoms.map((atom) => {
        const definition = ATOM_ELEMENTS[atom.element];
        const position = positions.get(atom.id) ?? [0, 0, 0];

        return (
          <group key={atom.id} position={position}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[atomRadii[atom.element], 40, 40]} />
              <meshStandardMaterial
                color={definition.colorEnd}
                roughness={0.28}
                metalness={0.08}
                emissive={definition.colorStart}
                emissiveIntensity={0.16}
              />
            </mesh>
            <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
              <span className="atom3DLabel">{definition.symbol}</span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function BondMesh({ start, end, kind }: { start: Point3D; end: Point3D; kind: AtomBond["kind"] }) {
  const geometry = useMemo(() => {
    const startVector = new THREE.Vector3(...start);
    const endVector = new THREE.Vector3(...end);
    const midpoint = startVector.clone().add(endVector).multiplyScalar(0.5);
    const direction = endVector.clone().sub(startVector);
    const length = direction.length();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    );

    return { midpoint, length, quaternion };
  }, [end, start]);

  return (
    <mesh position={geometry.midpoint} quaternion={geometry.quaternion}>
      <cylinderGeometry args={[kind === "ionic" ? 0.09 : 0.12, kind === "ionic" ? 0.09 : 0.12, geometry.length, 20]} />
      <meshStandardMaterial
        color={kind === "ionic" ? "#2dd4bf" : "#cbd5e1"}
        emissive={kind === "ionic" ? "#0f766e" : "#334155"}
        emissiveIntensity={0.22}
        roughness={0.34}
        metalness={0.32}
      />
    </mesh>
  );
}

function getAtomPositions(atoms: AtomNode[]) {
  const positions = new Map<string, Point3D>();

  if (!atoms.length) {
    return positions;
  }

  const centerX = atoms.reduce((sum, atom) => sum + atom.x, 0) / atoms.length;
  const centerY = atoms.reduce((sum, atom) => sum + atom.y, 0) / atoms.length;
  const xRange = Math.max(...atoms.map((atom) => atom.x)) - Math.min(...atoms.map((atom) => atom.x));
  const yRange = Math.max(...atoms.map((atom) => atom.y)) - Math.min(...atoms.map((atom) => atom.y));
  const scale = 8 / Math.max(xRange, yRange, 24);

  atoms.forEach((atom, index) => {
    const depth = atoms.length === 1 ? 0 : ((index % 3) - 1) * 0.34;
    positions.set(atom.id, [
      (atom.x - centerX) * scale,
      (centerY - atom.y) * scale,
      depth,
    ]);
  });

  return positions;
}
