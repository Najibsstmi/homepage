import { readFile, mkdir } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
import sharp from 'sharp';
const bytes=await readFile('public/skeleton/skeleton.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const bones=JSON.parse(await readFile('src/data/skeletonBones.json','utf8'));
await mkdir('public/skeleton/thumbnails',{recursive:true});
for (const bone of bones) {
 const root=scene.getObjectByName(bone.id), bounds=new Box3().setFromObject(root), center=bounds.getCenter(new Vector3()), size=bounds.getSize(new Vector3()), width=96, height=96, scale=80/Math.max(size.x,size.y,0.01), pixels=new Uint8Array(width*height*4), depth=new Float32Array(width*height);depth.fill(-Infinity);
 const p=new Vector3(); root.traverse(node=>{if(!node.isMesh)return; const positions=node.geometry.getAttribute('position'); for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(node.matrixWorld).sub(center); let x=Math.round(width/2+p.x*scale),y=Math.round(height/2-p.y*scale); if(x<1||x>=width-1||y<1||y>=height-1)continue;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let k=(y+dy)*width+x+dx;if(p.z>depth[k]){depth[k]=p.z;pixels[4*k]=228;pixels[4*k+1]=217;pixels[4*k+2]=193;pixels[4*k+3]=255;}} }});
 await sharp(pixels,{raw:{width,height,channels:4}}).png().toFile(`public/skeleton/thumbnails/${bone.id}.png`);
}
console.log(`Generated ${bones.length} mesh thumbnails`);
