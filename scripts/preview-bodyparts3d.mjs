import { readFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
const file = process.argv[2] || 'tmp/bodyparts3d/draft.glb';
const b=await readFile(file), gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const scene=gltf.scene; scene.updateMatrixWorld(true);
const box=new Box3().setFromObject(scene), center=box.getCenter(new Vector3()), size=box.getSize(new Vector3());
const width=600,height=1100,scale=Math.min(width/(size.x*1.3),height/(size.y*1.1));
await mkdir('tmp/bodyparts3d/previews',{recursive:true});
for(const view of ['front','back','side']) {
 const rgba=new Uint8Array(width*height*4), depth=new Float32Array(width*height); depth.fill(-Infinity);
 for(let i=0;i<width*height;i++){rgba[i*4]=18;rgba[i*4+1]=43;rgba[i*4+2]=54;rgba[i*4+3]=255;}
 const p=new Vector3(); const triangles=[];
 scene.traverse(o=>{ if(!o.isMesh)return; const pos=o.geometry.getAttribute('position'),index=o.geometry.index; const count=index?index.count:pos.count;
  const coords=[];
  for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).sub(center); const x=view==='side'?p.z:view==='back'?-p.x:p.x, z=view==='side'?p.x:view==='back'?-p.z:p.z; coords.push([width/2+x*scale,height/2-p.y*scale,z]);}
  for(let i=0;i+2<count;i+=3){let a=coords[index?index.getX(i):i],b=coords[index?index.getX(i+1):i+1],c=coords[index?index.getX(i+2):i+2]; triangles.push([a,b,c]);}
 });
 for(const [a,b,c] of triangles){
  const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); if(Math.abs(area)<0.01)continue;
  const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  const dx1=b[0]-a[0],dy1=b[1]-a[1],dz1=(b[2]-a[2])*scale,dx2=c[0]-a[0],dy2=c[1]-a[1],dz2=(c[2]-a[2])*scale;
  const nx=dy1*dz2-dz1*dy2,ny=dz1*dx2-dx1*dz2,nz=dx1*dy2-dy1*dx2; const len=Math.hypot(nx,ny,nz)||1; const light=.58+.42*Math.abs((nx*.25+ny*-.35+nz*.9)/len); 
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const u=((x-a[0])*(c[1]-a[1])-(y-a[1])*(c[0]-a[0]))/area,v=((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]))/area;if(u<0||v<0||u+v>1)continue;const z=a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]),i=y*width+x;if(z>depth[i]){depth[i]=z;rgba[i*4]=225*light;rgba[i*4+1]=216*light;rgba[i*4+2]=196*light;}}
 }
 await sharp(rgba,{raw:{width,height,channels:4}}).png().toFile(`tmp/bodyparts3d/previews/${view}.png`);
 console.log(view,triangles.length,'triangles');
}
