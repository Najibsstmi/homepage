import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReferenceDemonstration } from './ReferenceDemonstration'
import { deviceError } from './deviceError'
describe('reference demonstrations',()=>{
 it('labels empty and external-only references as placeholders',()=>{expect(renderToStaticMarkup(<ReferenceDemonstration/>)).toContain('Belum ada demonstrasi');expect(renderToStaticMarkup(<ReferenceDemonstration items={[{id:'1',kind:'image',src:'//example.com/test.jpg',title:'External'}]}/>)).toContain('Belum ada demonstrasi')})
 it('renders multiple local choices and captions for video',()=>{const html=renderToStaticMarkup(<ReferenceDemonstration items={[{id:'1',kind:'video',src:'/theatre/test.webm',title:'Contoh',captionsSrc:'/theatre/test.vtt'},{id:'2',kind:'image',src:'/theatre/test.jpg',title:'Imej',alt:'Panduan'}]}/>);expect(html).toContain('controls');expect(html).toContain('captions');expect(html).toContain('/theatre/test.vtt');expect(html).toContain('Imej')})
 it('renders a local image with alternative text',()=>{expect(renderToStaticMarkup(<ReferenceDemonstration items={[{id:'2',kind:'image',src:'/theatre/test.jpg',title:'Imej',alt:'Panduan'}]}/>)).toContain('alt="Panduan"')})
})
describe('device failures',()=>{it('gives distinct, actionable permission, busy and model errors',()=>{expect(deviceError(new DOMException('','NotAllowedError'),false)).toContain('Akses ditolak');expect(deviceError(new DOMException('','NotReadableError'),false)).toContain('aplikasi lain');expect(deviceError(new Error(''),true)).toContain('Model wajah')})})
