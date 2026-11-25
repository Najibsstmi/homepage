import { Matrix4, Quaternion, Vector3 } from 'three';

// Extract anatomical transforms in the scene's coordinate system, not parent-local space.
export function buildSkeletonManifest(scene, bones) {
  scene.updateMatrixWorld(true);
  const errors = [];
  const byName = new Map();
  scene.traverse((node) => {
    const list = byName.get(node.name) ?? [];
    list.push(node);
    byName.set(node.name, list);
  });
  const selected = new Map();
  for (const bone of bones) {
    const matches = byName.get(bone.id) ?? [];
    if (matches.length !== 1) errors.push(`${bone.id}: expected one node, found ${matches.length}`);
    else selected.set(matches[0], bone);
  }
  const rootInverse = new Matrix4().copy(scene.matrixWorld).invert();
  const components = [];
  for (const [node, bone] of selected) {
    let parent = node.parent;
    while (parent && parent !== scene) {
      if (selected.has(parent)) errors.push(`${bone.id}: nested inside another component`);
      parent = parent.parent;
    }
    let meshes = 0;
    node.traverse((child) => {
      if (child.isMesh) {
        meshes++;
        const positions = child.geometry?.getAttribute('position');
        if (!positions || positions.count < 3) errors.push(`${bone.id}: empty geometry in ${child.name || '(unnamed mesh)'}`);
        else {
          for (let i = 0; i < positions.count; i++) {
            if (![positions.getX(i), positions.getY(i), positions.getZ(i)].every(Number.isFinite)) {
              errors.push(`${bone.id}: non-finite geometry in ${child.name || '(unnamed mesh)'}`);
              break;
            }
          }
        }
      }
      if (child.isSkinnedMesh || child.morphTargetInfluences?.length) errors.push(`${bone.id}: skinned or morph meshes are not supported`);
    });
    if (!meshes) errors.push(`${bone.id}: component contains no mesh`);
    const matrix = new Matrix4().multiplyMatrices(rootInverse, node.matrixWorld);
    const position = new Vector3(), quaternion = new Quaternion(), scale = new Vector3();
    matrix.decompose(position, quaternion, scale);
    const reconstructed = new Matrix4().compose(position, quaternion, scale);
    if (matrix.elements.some((value, index) => !Number.isFinite(value) || Math.abs(value - reconstructed.elements[index]) > 1e-5)) {
      errors.push(`${bone.id}: transform contains shear or non-finite values; apply transforms before export`);
    }
    if (Math.min(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)) < 1e-8) errors.push(`${bone.id}: zero scale`);
    components.push({ ...bone, targetPosition: position.toArray(), targetQuaternion: quaternion.toArray(), targetScale: scale.toArray(), meshCount: meshes });
  }
  scene.traverse((node) => {
    if (!node.isMesh) return;
    let owner = node;
    while (owner && !selected.has(owner)) owner = owner.parent;
    if (!owner) errors.push(`Unassigned mesh: ${node.name || '(unnamed)'}`);
  });
  if (errors.length) throw new Error(`Skeleton import rejected:\n${errors.join('\n')}`);
  return { version: 1, coordinateSpace: 'scene', components };
}
