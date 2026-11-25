import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildSkeletonManifest } from './skeleton-manifest.mjs';

it('loads the actual BodyParts3D GLB with 36 usable scene-space components', async () => {
  const bytes = await readFile('public/skeleton/skeleton.glb');
  const bones = JSON.parse(await readFile('src/data/skeletonBones.json', 'utf8'));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const result = buildSkeletonManifest(gltf.scene, bones);
  expect(result.components).toHaveLength(36);
  expect(new Set(result.components.map((component) => component.id)).size).toBe(36);
  const bounds = new Box3().setFromObject(gltf.scene).getSize(new Vector3());
  expect(bounds.y).toBeGreaterThan(1.4);
  expect(bounds.y).toBeLessThan(2.2);
  expect(bounds.x).toBeGreaterThan(0.4);
  expect(bounds.x).toBeLessThan(1.2);
  expect(bounds.z).toBeGreaterThan(0.1);
  expect(bounds.z).toBeLessThan(0.6);
  const center = (name) => new Box3().setFromObject(gltf.scene.getObjectByName(name)).getCenter(new Vector3());
  // Coarse landmark checks do not replace a human anatomical review.
  expect(center('Radius_L').x).toBeGreaterThan(center('Ulna_L').x);
  expect(center('Radius_R').x).toBeLessThan(center('Ulna_R').x);
  expect(center('Tibia_L').x).toBeLessThan(center('Fibula_L').x);
  expect(center('Tibia_R').x).toBeGreaterThan(center('Fibula_R').x);
  expect(center('Patella_L').z).toBeGreaterThan(center('Tibia_L').z);
});
