import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Color, Material, Mesh, MeshStandardMaterial, Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';
import bones from '../data/skeletonBones.json';
import { isPlacementAtTarget, type GameState } from './game';

type Filter = 'all' | 'axial' | 'appendicular';
type Props = { mode: 'build' | 'explore'; game: GameState; selected: string | null; filter: Filter; compare: boolean; hint: boolean; incorrect: boolean; onSelect: (id: string) => void; onPlace: (id: string, success: boolean) => void };
const ids = bones.map(b => b.id);
function setWorldPosition(object: Object3D, position: Vector3) {
  if (!object.parent) return;
  object.parent.updateWorldMatrix(true, false);
  object.position.copy(object.parent.worldToLocal(position.clone()));
}
function materialFor(mesh: Mesh, ghost: boolean) {
  const convert = (source: Material) => {
    const m = source.clone() as MeshStandardMaterial;
    if (ghost) { m.transparent = true; m.opacity = 0.12; m.depthWrite = false; }
    return m;
  };
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
}
export function AssemblyScene(props: Props) {
  const { scene } = useGLTF('/skeleton/skeleton.glb');
  const { camera, gl, controls, viewport } = useThree();
  const latest = useRef(props);
  useLayoutEffect(() => { latest.current = props; });
  const dragging = useRef(false);
  const state = useMemo(() => {
    const model = scene.clone(true), ghost = scene.clone(true);
    model.updateMatrixWorld(true); ghost.updateMatrixWorld(true);
    const targets = new Map<string, { local: Vector3; world: Vector3 }>();
    const nodes = new Map<string, Object3D>();
    for (const id of ids) {
      const component = model.getObjectByName(id);
      if (component) { nodes.set(id, component); targets.set(id, { local: component.position.clone(), world: component.getWorldPosition(new Vector3()) }); }
    }
    model.traverse(o => { if (o instanceof Mesh) materialFor(o, false); });
    ghost.traverse(o => { if (o instanceof Mesh) materialFor(o, true); });
    return { model, ghost, targets, nodes };
  }, [scene]);
  useEffect(() => () => { for (const root of [state.model, state.ghost]) root.traverse(o => { if (o instanceof Mesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); }, [state]);
  const stagingPosition = (target: Vector3) => {
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const width = viewport.getCurrentViewport(camera, target).width;
    const edge = Math.max(0.2, Math.min(0.72, width / 2 - 0.22));
    const current = target.dot(right);
    const destination = current > 0.08 ? -edge : edge;
    return target.clone().addScaledVector(right, destination - current);
  };
  const { mode, selected, game, filter, compare, hint, incorrect } = props;
  useEffect(() => {
    for (const bone of bones) {
      const node = state.model.getObjectByName(bone.id), ghostNode = state.ghost.getObjectByName(bone.id);
      if (!node || !ghostNode) continue;
      const installed = game.installed.includes(bone.id);
      node.visible = mode === 'explore' ? (filter === 'all' || filter === bone.category) : installed || selected === bone.id;
      ghostNode.visible = mode === 'build' && !installed;
      for (const [root, isGhost] of [[node, false], [ghostNode, true]] as const) root.traverse(child => {
        if (!(child instanceof Mesh)) return;
        for (const m of (Array.isArray(child.material) ? child.material : [child.material])) {
          if (!(m instanceof MeshStandardMaterial)) continue;
          m.color = new Color(isGhost ? (hint && bone.id === selected ? '#55e6a5' : '#b3d7df') : (mode === 'build' && incorrect && bone.id === selected ? '#f46e68' : mode === 'explore' && bone.id === selected ? '#5de6c5' : mode === 'explore' && compare ? (bone.category === 'axial' ? '#4b9ff5' : '#f39b45') : '#e9dfc9'));
          if (isGhost) m.opacity = hint && bone.id === selected ? 0.72 : 0.12;
        }
      });
    }
  }, [state, mode, selected, game.installed, filter, compare, hint, incorrect]);
  useEffect(() => {
    if (props.mode !== 'build' || !props.selected || props.game.installed.includes(props.selected)) return;
    const node = state.model.getObjectByName(props.selected), target = state.targets.get(props.selected);
    if (node && target) setWorldPosition(node, stagingPosition(target.world));
  // Camera changes should not move a bone already being manipulated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, props.mode, props.selected, props.game.installed]);
  useFrame(() => {
    for (const id of ids) {
      const node = state.nodes.get(id), target = state.targets.get(id);
      if (!node || !target) continue;
      if (latest.current.mode === 'explore' || latest.current.game.installed.includes(id)) {
        node.position.lerp(target.local, 0.18);
        if (node.position.distanceToSquared(target.local) < 1e-10) node.position.copy(target.local);
      } else if (latest.current.selected !== id) node.position.copy(target.local);
    }
  });
  useEffect(() => {
    const canvas = gl.domElement, ray = new Raycaster(), mouse = new Vector2(), plane = new Plane();
    let pointerId: number | null = null, downX = 0, downY = 0, moved = false, offset = new Vector3();
    const orbit = controls as unknown as { enabled: boolean } | null;
    const setRay = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); ray.setFromCamera(mouse, camera); };
    const intersectPlane = (event: PointerEvent, world: Vector3) => {
      setRay(event); plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()), world);
      return ray.ray.intersectPlane(plane, new Vector3());
    };
    const down = (event: PointerEvent) => {
      const { mode, selected } = latest.current;
      setRay(event);
      if (mode === 'explore') {
        const hits = ray.intersectObject(state.model, true);
        for (const hit of hits) { let node: Object3D | null = hit.object; while (node && node !== state.model) { if (!node.visible) break; if (ids.includes(node.name)) { latest.current.onSelect(node.name); return; } node = node.parent; } }
        return;
      }
      if (!selected) return;
      const node = state.model.getObjectByName(selected), target = state.targets.get(selected);
      if (!node || !target) return;
      downX = event.clientX; downY = event.clientY; moved = false; pointerId = event.pointerId;
      state.model.updateMatrixWorld(true);
      const hits = ray.intersectObject(node, true);
      if (hits.length) {
        dragging.current = true;
        if (orbit) orbit.enabled = false;
        const world = node.getWorldPosition(new Vector3());
        const hit = intersectPlane(event, target.world);
        offset = hit ? world.sub(hit) : new Vector3();
        const normal = camera.getWorldDirection(new Vector3());
        offset.addScaledVector(normal, -offset.dot(normal));
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) moved = true;
      const id = latest.current.selected;
      if (!dragging.current || !id) return;
      const node = state.model.getObjectByName(id), target = state.targets.get(id);
      if (!node || !target) return;
      const point = intersectPlane(event, target.world);
      if (point) setWorldPosition(node, point.add(offset));
      event.preventDefault(); event.stopImmediatePropagation();
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const id = latest.current.selected, wasDragging = dragging.current;
      dragging.current = false; pointerId = null;
      if (orbit) orbit.enabled = true;
      if (!id) return;
      const node = state.model.getObjectByName(id), target = state.targets.get(id);
      if (!node || !target) return;
      // A tap on the guide places the selected component at the projected point.
      let position: Vector3 | null = null;
      if (wasDragging && moved) position = node.getWorldPosition(new Vector3());
      else if (!wasDragging && !moved) position = intersectPlane(event, target.world);
      if (!position) return;
      const correct = isPlacementAtTarget(id, position, state.targets);
      if (!correct) { setWorldPosition(node, stagingPosition(target.world)); }
      else if (!wasDragging) setWorldPosition(node, position);
      latest.current.onPlace(id, correct);
      event.preventDefault();
    };
    const cancel = () => { dragging.current = false; pointerId = null; if (orbit) orbit.enabled = true; };
    canvas.addEventListener('pointerdown', down, true); canvas.addEventListener('pointermove', move, true); canvas.addEventListener('pointerup', up, true); canvas.addEventListener('pointercancel', cancel, true);
    return () => { cancel(); canvas.removeEventListener('pointerdown', down, true); canvas.removeEventListener('pointermove', move, true); canvas.removeEventListener('pointerup', up, true); canvas.removeEventListener('pointercancel', cancel, true); };
  // Rebind when the viewport changes so the staging area stays visible on small screens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, controls, gl, state, viewport]);
  return <><primitive object={state.ghost} /><primitive object={state.model} /></>;
}
