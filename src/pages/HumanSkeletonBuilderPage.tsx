import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Color, Material, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import bones from '../data/skeletonBones.json';
import './HumanSkeletonBuilderPage.css';

type Filter = 'all' | 'axial' | 'appendicular';
type Bone = typeof bones[number];
const modelUrl = '/skeleton/skeleton.glb';

class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="skeleton-placeholder"><h2>Model tidak dapat dimuatkan</h2><p>Semak sambungan dan muat semula halaman.</p></div> : this.props.children; }
}

function CameraView({ view }: { view: string }) {
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls as unknown as { target: Vector3; update: () => void } | null;
    const distance = Math.max(camera.position.distanceTo(orbit?.target ?? new Vector3()), 2);
    orbit?.target.set(0, 0, 0);
    if (view === 'front') camera.position.set(0, 0, distance);
    if (view === 'back') camera.position.set(0, 0, -distance);
    if (view === 'side') camera.position.set(distance, 0, 0);
    camera.lookAt(0, 0, 0); orbit?.update(); invalidate();
  }, [camera, controls, invalidate, view]);
  return null;
}

function AnatomicalModel({ selected, filter, compare, onSelect }: { selected: string | null; filter: Filter; compare: boolean; onSelect: (id: string) => void }) {
  const { scene } = useGLTF(modelUrl);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => {
      if (object instanceof Mesh) object.material = Array.isArray(object.material) ? object.material.map((m: Material) => m.clone()) : object.material.clone();
    });
    return copy;
  }, [scene]);
  useEffect(() => () => { model.traverse((object) => { if (object instanceof Mesh) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose()); }); }, [model]);
  useEffect(() => {
    for (const bone of bones) {
      const component = model.getObjectByName(bone.id);
      if (!component) continue;
      component.visible = filter === 'all' || filter === bone.category;
      component.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        for (const material of (Array.isArray(child.material) ? child.material : [child.material])) {
          if (!(material instanceof MeshStandardMaterial)) continue;
          material.color = new Color(bone.id === selected ? '#5de6c5' : compare ? (bone.category === 'axial' ? '#4b9ff5' : '#f39b45') : '#e9dfc9');
        }
      });
    }
  }, [model, selected, filter, compare]);
  const pick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    let current: Object3D | null = event.object;
    while (current && current !== model) {
      if (bones.some((bone) => bone.id === current?.name)) { onSelect(current.name); return; }
      current = current.parent;
    }
  };
  return <primitive object={model} onClick={pick} />;
}

export default function HumanSkeletonBuilderPage() {
  const [availability, setAvailability] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [filter, setFilter] = useState<Filter>('all');
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState('front');
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetch('/skeleton/manifest.json', { signal: controller.signal }), fetch(modelUrl, { method: 'HEAD', signal: controller.signal })])
      .then(async ([manifest, model]) => {
        if (!manifest.ok || !model.ok || !(manifest.headers.get('content-type') || '').includes('json')) throw new Error('missing');
        const data = await manifest.json();
        if (!Array.isArray(data.components) || data.components.length !== 36 || !bones.every((bone) => data.components.some((entry: { id?: string }) => entry.id === bone.id))) throw new Error('invalid manifest');
        setAvailability('ready');
      }).catch(() => { if (!controller.signal.aborted) setAvailability('missing'); });
    return () => controller.abort();
  }, []);
  const active: Bone | undefined = bones.find((bone) => bone.id === selected);
  return <main className="skeleton-page">
    <header className="skeleton-header"><div><a href="/simulator">← Semua simulasi</a><p>SAINS TINGKATAN 4 · BAB 6</p><h1>Human Skeleton Builder 3D</h1><span>Bina rangka manusia · Standard Pembelajaran 6.1.5</span></div><span className="skeleton-badge">DALAM PEMBANGUNAN</span></header>
    <div className="skeleton-layout"><section className="skeleton-inventory"><h2>Komponen rangka</h2><p>36 komponen pembelajaran</p><label htmlFor="skeleton-filter">Kategori</label><select id="skeleton-filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}><option value="all">Semua tulang</option><option value="axial">Rangka paksi</option><option value="appendicular">Rangka apendaj</option></select><div className="skeleton-list">{bones.filter((bone) => filter === 'all' || bone.category === filter).map((bone) => <button className={selected === bone.id ? 'active' : ''} key={bone.id} onClick={() => setSelected(bone.id)}><strong>{bone.nameMs}{bone.side === 'left' ? ' · kiri' : bone.side === 'right' ? ' · kanan' : ''}</strong><small>{bone.nameEn}</small></button>)}</div></section>
    <section className="skeleton-stage" aria-label="Ruang model 3D">{availability === 'loading' ? <p>Memeriksa model anatomi…</p> : availability === 'missing' ? <div className="skeleton-placeholder"><span>MODEL ANATOMI</span><h2>Model 3D belum tersedia</h2><p>Model rangka sebenar sedang disediakan dan disahkan. Aktiviti pemasangan belum tersedia.</p></div> : <ViewerBoundary><Canvas camera={{ position: [0, 0, 3], fov: 45 }}><ambientLight intensity={1.4}/><directionalLight position={[4, 5, 8]} intensity={2}/><Suspense fallback={null}><AnatomicalModel selected={selected} filter={filter} compare={compare} onSelect={setSelected}/></Suspense><OrbitControls makeDefault/><CameraView view={view}/></Canvas><div className="skeleton-tools"><button onClick={() => setView('front')}>Hadapan</button><button onClick={() => setView('back')}>Belakang</button><button onClick={() => setView('side')}>Sisi</button><button aria-pressed={compare} onClick={() => setCompare(!compare)}>Bandingkan</button></div></ViewerBoundary>}</section>
    <aside className="skeleton-info"><p>MAKLUMAT TULANG</p>{active ? <><h2>{active.nameMs}</h2><p>{active.nameEn}</p><dl><dt>Kategori</dt><dd>{active.category === 'axial' ? 'Rangka paksi' : 'Rangka apendaj'}</dd><dt>Bahagian</dt><dd>{active.group}</dd><dt>Sisi anatomi</dt><dd>{active.side === 'left' ? 'Kiri' : active.side === 'right' ? 'Kanan' : 'Garis tengah'}</dd></dl></> : <><h2>Pilih satu komponen</h2><p>Pilih nama dalam senarai untuk melihat kategori dan kedudukannya.</p></>}<hr/><p>Model ini masih dalam semakan anatomi; aktiviti pemasangan belum tersedia.</p><p>BodyParts3D © The Database Center for Life Science. Mesh diubah dan dikelompokkan daripada versi 4.0; <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/">CC BY-SA 2.1 Japan</a>. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html">Notis sumber</a>.</p></aside></div>
  </main>;
}
