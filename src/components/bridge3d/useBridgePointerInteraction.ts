import { useThree } from "@react-three/fiber";
import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { Raycaster, Vector2, Vector3 } from "three";
import type { OrbitControls } from "three-stdlib";
import { displayLabel } from "../../features/bridge3d/displayLabels";
import { distance3 } from "../../features/bridge3d/model";
import {
  constrainPosition, constraintAxis, coordinates, movementPlane, resolveSnapTarget,
  type AddMode, type DragConstraint, type SnapTarget,
} from "../../features/bridge3d/interaction";
import type { BridgeDesign, BuildPlane, BuildTool, Selection, Vector3Data } from "../../features/bridge3d/types";

export interface PointerOptions {
  design: BridgeDesign; tool: BuildTool; plane: BuildPlane; addMode: AddMode;
  crossConstraint: DragConstraint; visibility: string; enabled: boolean; resetKey: number;
  onTarget: (target: SnapTarget | null) => void;
  onSelect: (selection: Selection) => void;
  onMoveNode: (id: string, point: Vector3Data) => void;
  onHoverInfo: (message: string) => void;
}

export function useBridgePointerInteraction(options: PointerOptions, controls: RefObject<OrbitControls | null>) {
  const { gl, camera } = useThree();
  const [preview, setPreview] = useState<{ id: string; position: Vector3Data } | null>(null);
  const [hover, setHover] = useState<SnapTarget | null>(null);
  const targetCallback = useEffectEvent(options.onTarget);
  const selectCallback = useEffectEvent(options.onSelect);
  const moveCallback = useEffectEvent(options.onMoveNode);
  const statusCallback = useEffectEvent(options.onHoverInfo);
  const { design, tool, plane, addMode, crossConstraint, visibility, enabled, resetKey } = options;

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new Raycaster();
    const pointers = new Set<number>();
    let gesture: { pointerId: number; x: number; y: number; moved: boolean;
      target: SnapTarget | null; origin?: Vector3Data; last?: Vector3Data; dragging: boolean } | null = null;
    const ray = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      raycaster.setFromCamera(new Vector2(pointer.x / rect.width * 2 - 1, 1 - pointer.y / rect.height * 2), camera);
      return { rect, pointer };
    };
    const resolve = (event: PointerEvent) => {
      const { rect, pointer } = ray(event);
      return resolveSnapTarget({ design, camera, ray: raycaster.ray, pointer,
        width: rect.width, height: rect.height, touch: event.pointerType !== "mouse",
        mode: tool === "add" ? addMode : "nodes", plane, cross: crossConstraint, visibility });
    };
    const unblock = () => { if (controls.current) controls.current.enabled = true; };
    const release = () => {
      const id = gesture?.pointerId;
      gesture = null;
      unblock();
      if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      setPreview(null);
    };
    const cancel = () => { release(); setHover(null); };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointers.add(event.pointerId);
      if (pointers.size > 1) { cancel(); return; }
      const target = resolve(event);
      setHover(target);
      const dragging = enabled && tool === "move" && target?.kind === "node";
      gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false,
        target, dragging, origin: dragging ? { ...target.position } : undefined };
      if (dragging || (enabled && tool === "add" && target)) {
        if (controls.current) controls.current.enabled = false;
        event.preventDefault();
        event.stopImmediatePropagation();
        canvas.setPointerCapture(event.pointerId);
        if (dragging) {
          selectCallback({ kind: "node", id: target.id });
          statusCallback(`Alih ${target.label} · seret pada satah ${plane === "base" ? "XZ" : plane === "cross" ? crossConstraint.toUpperCase() : "XY"}`);
        }
      }
    };
    const move = (event: PointerEvent) => {
      if (pointers.size > 1) return;
      if (gesture && event.pointerId === gesture.pointerId) {
        if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7) gesture.moved = true;
        if (gesture.dragging && gesture.origin && gesture.target?.kind === "node") {
          const nodeId = gesture.target.id;
          const origin = gesture.origin;
          event.preventDefault(); event.stopImmediatePropagation();
          ray(event);
          const hit = raycaster.ray.intersectPlane(movementPlane(gesture.origin, plane, crossConstraint), new Vector3());
          if (!hit || !gesture.moved) return;
          let position = constrainPosition(hit, gesture.origin, plane, crossConstraint);
          const locked = constraintAxis(plane, crossConstraint);
          const near = design.nodes.filter((node) => node.id !== nodeId
            && Math.abs(node.position[locked] - origin[locked]) < 1e-5)
            .sort((a, b) => distance3(a.position, hit) - distance3(b.position, hit))[0];
          if (near && distance3(near.position, hit) < 0.6) position = { ...near.position };
          gesture.last = position;
          setPreview({ id: gesture.target.id, position });
          const lengths = design.members.filter((member) => member.nodeA === nodeId || member.nodeB === nodeId)
            .map((member) => {
              const other = design.nodes.find((node) => node.id === (member.nodeA === nodeId ? member.nodeB : member.nodeA));
              return other ? distance3(other.position, position) : 0;
            });
          statusCallback(`Alih ${displayLabel(design, "node", gesture.target.id)} · ${coordinates(position)} · Lidi ${lengths.map((length) => length.toFixed(1)).join(" / ")} cm${near && distance3(near.position, position) < 0.1 ? " · Nod bertindih: pilih lokasi lain" : ""}`);
          return;
        }
        if (gesture.moved) { setHover(null); return; }
      }
      const target = resolve(event);
      setHover(target);
      if (target) statusCallback(target.kind === "grid" ? target.label : `Sasaran: ${target.label}`);
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const current = gesture;
      const upTarget = current.moved ? null : resolve(event);
      release();
      if (current.dragging) {
        event.stopImmediatePropagation();
        if (current.moved && current.last && current.target?.kind === "node") moveCallback(current.target.id, current.last);
      } else if (!current.moved && pointers.size === 0) {
        if (enabled && tool === "add") targetCallback(upTarget);
        else if (upTarget?.kind === "node" || upTarget?.kind === "member") {
          selectCallback({ kind: upTarget.kind, id: upTarget.id });
          if (tool === "move" && upTarget.kind === "member") statusCallback("Pilih hujung lidi yang hendak dialih.");
        } else selectCallback(null);
      }
    };
    const cancelled = (event: PointerEvent) => { pointers.delete(event.pointerId); cancel(); statusCallback("Tindakan dibatalkan."); };
    const lost = (event: PointerEvent) => { if (gesture?.pointerId === event.pointerId) cancelled(event); };
    const leave = () => { if (!gesture) setHover(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    canvas.addEventListener("pointerdown", down, true);
    canvas.addEventListener("pointermove", move, true);
    canvas.addEventListener("pointerup", up, true);
    canvas.addEventListener("pointercancel", cancelled, true);
    canvas.addEventListener("lostpointercapture", lost, true);
    canvas.addEventListener("pointerleave", leave);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape);
    return () => {
      canvas.removeEventListener("pointerdown", down, true);
      canvas.removeEventListener("pointermove", move, true);
      canvas.removeEventListener("pointerup", up, true);
      canvas.removeEventListener("pointercancel", cancelled, true);
      canvas.removeEventListener("lostpointercapture", lost, true);
      canvas.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", escape);
      cancel();
    };
  }, [gl, camera, controls, design, tool, plane, addMode, crossConstraint, visibility, enabled, resetKey]);

  const previewDesign = preview ? { ...design, nodes: design.nodes.map((node) =>
    node.id === preview.id ? { ...node, position: preview.position } : node) } : design;
  return { previewDesign, hover, draggingId: preview?.id ?? null };
}
