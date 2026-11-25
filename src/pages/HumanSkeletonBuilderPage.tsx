import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import bones from '../data/skeletonBones.json';
import { AssemblyScene } from '../skeleton/AssemblyScene';
import { useAssemblyGame } from '../skeleton/useAssemblyGame';
import { metrics } from '../skeleton/game';
import './HumanSkeletonBuilderPage.css';

type Filter = 'all' | 'axial' | 'appendicular';
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
function formatTime(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }
export default function HumanSkeletonBuilderPage() {
  const [availability, setAvailability] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [filter, setFilter] = useState<Filter>('all');
  const [compare, setCompare] = useState(false);
  const [view, setView] = useState('front');
  const { game, mode, setMode, selected, setSelected, hint, feedback, place, select, showHint, undo, reset } = useAssemblyGame();
  const complete = game.installed.length === bones.length;
  const active = bones.find(bone => bone.id === selected);
  const stats = metrics(game);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetch('/skeleton/manifest.json', { signal: controller.signal }), fetch('/skeleton/skeleton.glb', { method: 'HEAD', signal: controller.signal })])
      .then(async ([manifest, model]) => {
        if (!manifest.ok || !model.ok || !(manifest.headers.get('content-type') || '').includes('json')) throw new Error('missing');
        const data = await manifest.json();
        if (!Array.isArray(data.components) || data.components.length !== bones.length || !bones.every(bone => data.components.some((entry: { id?: string }) => entry.id === bone.id))) throw new Error('invalid manifest');
        setAvailability('ready');
      }).catch(() => { if (!controller.signal.aborted) setAvailability('missing'); });
    return () => controller.abort();
  }, []);
  const switchMode = (value: 'build' | 'explore') => { setMode(value); setSelected(null); setCompare(false); };
  const visibleBones = bones.filter(bone => (filter === 'all' || bone.category === filter) && (mode === 'explore' || !game.installed.includes(bone.id)));
  return <main className="skeleton-page">
    <header className="skeleton-header"><div><a href="/simulator">← Semua simulasi</a><p>SAINS TINGKATAN 4 · BAB 6</p><h1>Bina Rangka Manusia 3D</h1><span>Standard Pembelajaran 6.1.5 · Sistem rangka manusia</span></div><span className="skeleton-badge">MODEL DALAM SEMAKAN ANATOMI</span></header>
    <div className="skeleton-mode" aria-label="Mod simulasi"><button aria-pressed={mode === 'build'} onClick={() => switchMode('build')}>Bina rangka</button><button aria-pressed={mode === 'explore'} onClick={() => switchMode('explore')}>Terokai rangka</button><span>{game.installed.length} / {bones.length} komponen</span><progress max={bones.length} value={game.installed.length}/><span>{Math.round(stats.progress)}%</span></div>
    <div className="skeleton-layout">
      {!(mode === 'build' && complete) && <section className="skeleton-inventory"><h2>Komponen rangka</h2><p>{mode === 'build' ? 'Pilih tulang yang belum dipasang.' : 'Pilih tulang untuk melihat maklumat.'}</p><label htmlFor="skeleton-filter">Kategori</label><select id="skeleton-filter" value={filter} onChange={e => setFilter(e.target.value as Filter)}><option value="all">Semua tulang</option><option value="axial">Rangka paksi</option><option value="appendicular">Rangka apendaj</option></select><div className="skeleton-list">{visibleBones.map(bone => <button className={selected === bone.id ? 'active' : ''} key={bone.id} onClick={() => mode === 'build' ? select(bone.id) : setSelected(bone.id)}><img src={`/skeleton/thumbnails/${bone.id}.png`} alt=""/><strong>{bone.nameMs}{bone.side === 'left' ? ' · kiri' : bone.side === 'right' ? ' · kanan' : ''}</strong></button>)}</div></section>}
      <section className="skeleton-stage" aria-label="Ruang model 3D">
        {availability === 'loading' ? <p>Memuatkan model anatomi…</p> : availability === 'missing' ? <div className="skeleton-placeholder"><h2>Model 3D tidak tersedia</h2><p>Semak sambungan dan muat semula halaman.</p></div> : <ViewerBoundary><Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 1.5]} style={{ touchAction: 'none' }}><ambientLight intensity={1.4}/><directionalLight position={[4, 5, 8]} intensity={2}/><Suspense fallback={null}><AssemblyScene mode={mode} game={game} selected={selected} filter={filter} compare={compare} hint={hint} incorrect={feedback.startsWith('Belum')} onSelect={setSelected} onPlace={place}/></Suspense><OrbitControls makeDefault/><CameraView view={view}/></Canvas><div className="skeleton-tools"><button onClick={() => setView('front')}>Hadapan</button><button onClick={() => setView('back')}>Belakang</button><button onClick={() => setView('side')}>Sisi</button>{mode === 'explore' && <button aria-pressed={compare} onClick={() => setCompare(!compare)}>Bandingkan</button>}</div></ViewerBoundary>}
        {mode === 'build' && <div className={`skeleton-feedback ${feedback.startsWith('Belum') ? 'wrong' : ''}`} role="status">{feedback}</div>}
        {mode === 'build' && complete && <div className="skeleton-completion" role="dialog" aria-label="Rangka lengkap"><h2>Tahniah! Anda berjaya membina rangka manusia lengkap.</h2><p>Masa: {formatTime(game.elapsedSeconds)} · Ketepatan: {Math.round(stats.accuracy)}% · Percubaan: {game.attempts}</p><button onClick={() => switchMode('explore')}>Terokai rangka 3D</button><button onClick={undo}>Batal pemasangan terakhir</button><button onClick={reset}>Cuba semula</button></div>}
      </section>
      <aside className="skeleton-info"><p>MAKLUMAT TULANG</p>{active ? <><h2>{active.nameMs}</h2><dl><dt>Kategori</dt><dd>{active.category === 'axial' ? 'Rangka paksi' : 'Rangka apendaj'}</dd><dt>Bahagian</dt><dd>{active.group}</dd><dt>Sisi anatomi</dt><dd>{active.side === 'left' ? 'Kiri' : active.side === 'right' ? 'Kanan' : 'Garis tengah'}</dd></dl></> : <><h2>Pilih satu komponen</h2><p>Pilih nama dalam senarai untuk melihat maklumat.</p></>}
        {mode === 'build' && <><hr/><h2>Kemajuan</h2><dl><dt>Masa</dt><dd>{formatTime(game.elapsedSeconds)}</dd><dt>Percubaan</dt><dd>{game.attempts}</dd><dt>Percubaan salah</dt><dd>{game.mistakes}</dd><dt>Ketepatan</dt><dd>{Math.round(stats.accuracy)}%</dd><dt>Petunjuk digunakan</dt><dd>{game.hints}</dd></dl><div className="skeleton-actions"><button disabled={!selected || complete} onClick={showHint}>Papar petunjuk</button><button disabled={!game.installed.length || complete} onClick={undo}>Batal pemasangan</button><button onClick={reset}>Mula semula</button></div></>}
        <hr/><p>Model ini masih dalam semakan anatomi. BodyParts3D © The Database Center for Life Science. Mesh diubah dan dikelompokkan daripada versi 4.0; <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/">CC BY-SA 2.1 Japan</a>. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html">Notis sumber</a>.</p></aside>
    </div>
  </main>;
}
