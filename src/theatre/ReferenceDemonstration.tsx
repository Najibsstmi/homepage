import { useState } from 'react'
import type { ReferenceMedia } from './exercises'

/** Reference files must be hosted with the application, never captured from a student. */
function isLocalAsset(path:string) { return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') }
export function ReferenceDemonstration({items=[]}:{items?:ReferenceMedia[]}) {
  const [selected,setSelected]=useState(0)
  const available=items.filter(item=>isLocalAsset(item.src) && (!item.captionsSrc || isLocalAsset(item.captionsSrc)))
  const item=available[selected]??available[0]
  if(!item)return <div className="theatre-reference-placeholder"><strong>Contoh arahan bertulis</strong><p>Belum ada demonstrasi yang disahkan guru. Gunakan arahan latihan dan bincang variasi bersama guru.</p></div>
  return <div className="theatre-reference">{available.length>1&&<label>Demonstrasi <select value={item.id} onChange={e=>setSelected(available.findIndex(x=>x.id===e.target.value))}>{available.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>}
    <h3>{item.title}</h3>{item.kind==='video'?<video key={item.src} controls playsInline preload="metadata" src={item.src}>{item.captionsSrc&&<track kind="captions" src={item.captionsSrc} srcLang="ms" label="Bahasa Melayu" default/>}Pelayar tidak menyokong video.</video>:<img src={item.src} alt={item.alt||item.title}/>}<p>Rujukan untuk latihan; guru menilai pilihan artistik dalam konteks.</p></div>
}
