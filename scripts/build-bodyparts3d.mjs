// Convert a reviewed mapping of BodyParts3D OBJ elements into a grouped GLB.
import { readFile, writeFile } from 'node:fs/promises';
import { Box3, Group, MeshStandardMaterial, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// GLTFExporter uses FileReader for its embedded GLB buffer. Node supplies Blob.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); }).catch((error) => this.onerror?.(error)); }
  readAsDataURL(blob) { blob.arrayBuffer().then((value) => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }).catch((error) => this.onerror?.(error)); }
};
const [mapPath, outputPath] = process.argv.slice(2);
if (!mapPath || !outputPath) throw new Error('Usage: node scripts/build-bodyparts3d.mjs <reviewed-mapping.json> <output.glb>');
const mapping = JSON.parse(await readFile(mapPath, 'utf8'));
if (mapping.status !== 'reviewed' && !outputPath.replaceAll('\\', '/').startsWith('tmp/')) throw new Error('Unreviewed mapping may only be exported under tmp/');
const bones = JSON.parse(await readFile('src/data/skeletonBones.json', 'utf8'));
const scene = new Group(); scene.name = 'HumanSkeleton';
const root = new Group(); root.name = 'AnatomicalCoordinates'; scene.add(root);
const material = new MeshStandardMaterial({ color: 0xe9dfc9, roughness: 0.75 });
const loader = new OBJLoader(); const seen = new Set();
for (const bone of bones) {
  const entry = mapping.groups[bone.id];
  if (!entry?.elementIds?.length) throw new Error(`Missing elements: ${bone.id}`);
  const component = new Group(); component.name = bone.id; root.add(component);
  for (const id of entry.elementIds) {
    if (!/^FJ[0-9]+M?$/.test(id) || seen.has(id)) throw new Error(`Invalid or duplicate element: ${id}`);
    seen.add(id);
    const obj = loader.parse(await readFile(`tmp/bodyparts3d/selected/${id}.obj`, 'utf8'));
    obj.traverse((child) => {
      if (child.isMesh) {
        // OBJLoader emits expanded triangles; index identical vertices without changing shape.
        child.geometry = mergeVertices(child.geometry, 1e-5);
        child.material = material;
        child.name = id;
      }
    });
    component.add(obj);
  }
  const centre = new Box3().setFromObject(component).getCenter(new Vector3());
  if (!Number.isFinite(centre.x + centre.y + centre.z)) throw new Error(`Invalid component geometry: ${bone.id}`);
  for (const child of component.children) child.position.sub(centre);
  component.position.copy(centre);
}
// BodyParts3D is in millimetres with Z up; rotate into Three.js Y-up space.
root.rotation.x = -Math.PI / 2; root.scale.setScalar(0.001);
scene.updateMatrixWorld(true);
const bounds = new Box3().setFromObject(root); const centre = bounds.getCenter(new Vector3());
root.position.sub(centre); scene.updateMatrixWorld(true);
const data = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true });
await writeFile(outputPath, Buffer.from(data));
console.log(`Exported ${bones.length} groups from ${seen.size} source meshes to ${outputPath}`);
