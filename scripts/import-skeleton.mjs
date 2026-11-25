import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildSkeletonManifest } from './skeleton-manifest.mjs';

const [input, attributionFile, outputDirectory = 'public/skeleton'] = process.argv.slice(2);
if (!input || !attributionFile || extname(input).toLowerCase() !== '.glb') {
  console.error('Usage: node scripts/import-skeleton.mjs <prepared.glb> <attribution.json> [output-directory]');
  process.exit(1);
}
try {
  const attribution = JSON.parse(await readFile(attributionFile, 'utf8'));
  for (const key of ['source', 'creator', 'license', 'licenseUrl', 'modifications']) {
    if (typeof attribution[key] !== 'string' || !attribution[key].trim()) throw new Error(`Attribution requires a nonempty ${key}`);
  }
  const bones = JSON.parse(await readFile(new URL('../src/data/skeletonBones.json', import.meta.url), 'utf8'));
  const bytes = await readFile(input);
  // GLB must embed all geometry and use untextured materials; this importer runs without a DOM.
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  const manifest = buildSkeletonManifest(gltf.scene, bones);
  const output = resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  await copyFile(input, resolve(output, 'skeleton.glb'));
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ ...manifest, attribution, inputFile: basename(input) }, null, 2) + '\n');
  console.log(`Imported ${manifest.components.length} components to ${output}. Anatomical and licence review are still required.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
