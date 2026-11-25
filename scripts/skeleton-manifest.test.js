import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene } from 'three';
import { buildSkeletonManifest } from './skeleton-manifest.mjs';

const bone = { id: 'Femur_L', side: 'left' };
function model() {
  const scene = new Scene();
  const parent = new Group(); parent.position.set(3, 4, 5); parent.rotation.z = Math.PI / 2;
  const component = new Group(); component.name = bone.id; component.position.set(2, 0, 0);
  component.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
  parent.add(component); scene.add(parent);
  return { scene, parent, component };
}
describe('skeleton import', () => {
  it('records transforms in scene space through nested parents', () => {
    const { scene } = model();
    const entry = buildSkeletonManifest(scene, [bone]).components[0];
    expect(entry.targetPosition[0]).toBeCloseTo(3);
    expect(entry.targetPosition[1]).toBeCloseTo(6);
    expect(entry.targetQuaternion[2]).toBeCloseTo(Math.SQRT1_2);
  });
  it('rejects missing, duplicate, and unassigned meshes', () => {
    const { scene, parent, component } = model();
    expect(() => buildSkeletonManifest(scene, [{ id: 'missing' }])).toThrow('expected one node');
    parent.add(component.clone());
    expect(() => buildSkeletonManifest(scene, [bone])).toThrow('found 2');
  });
  it('rejects components nested inside another component', () => {
    const { scene, component } = model();
    const child = new Group(); child.name = 'Tibia_L'; child.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial())); component.add(child);
    expect(() => buildSkeletonManifest(scene, [bone, { id: 'Tibia_L' }])).toThrow('nested inside');
  });
});
