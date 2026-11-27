import { useCallback, useEffect, useRef, useState } from 'react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import type { Blend, MovementSample } from './movement'
import { CALIBRATION_SECONDS, calibrationCoverage, evaluateCalibration, type CalibrationReport } from './calibration'
import { containVideo, mirroredPoint } from './videoGeometry'
import { addVoice, emptyVoice, measureAudio, type AudioMeasurement, type VoiceSummary } from './audio'
import { deviceError } from './deviceError'

type Kind = 'face' | 'voice'
const initialMeasure: AudioMeasurement = {rms:0,db:-100,hz:null,clipping:false,voiced:false}
export function useStudioMedia(kind:Kind, onFace:(values:Blend, now:number)=>void) {
  const video=useRef<HTMLVideoElement>(null), canvas=useRef<HTMLCanvasElement>(null)
  const stream=useRef<MediaStream|null>(null), detector=useRef<FaceLandmarker|null>(null), context=useRef<AudioContext|null>(null), frame=useRef(0), generation=useRef(0), last=useRef(0)
  const recorder=useRef<MediaRecorder|null>(null), chunks=useRef<Blob[]>([]), url=useRef('')
  const latest=useRef<Blend|null>(null), baseline=useRef<Blend|null>(null), collecting=useRef<MovementSample[]|null>(null), calibrationStart=useRef(0), calibrationTick=useRef(0)
  const noiseValues=useRef<number[]|null>(null), noiseStart=useRef(0), noise=useRef(0), voiceRunning=useRef(false), voiceData=useRef<VoiceSummary>(emptyVoice()), silent=useRef(true), lastAudio=useRef(0)
  const faceCallback=useRef(onFace)
  const showOverlay=useRef(false)
  const [active,setActive]=useState(false), [loading,setLoading]=useState(false), [status,setStatus]=useState('Peranti belum diaktifkan.'), [tracking,setTracking]=useState('Belum ada data.'), [overlay,setOverlay]=useState(false), [quality,setQuality]=useState<'good'|'poor'|'unknown'>('unknown'), [calibrated,setCalibrated]=useState(false), [isCalibrating,setIsCalibrating]=useState(false)
  const [videoSize,setVideoSize]=useState({width:0,height:0})
  const [trackingDetails,setTrackingDetails]=useState({face:'Belum dikesan',position:'Belum tersedia',lighting:'Belum tersedia'})
  const [calibrationProgress,setCalibrationProgress]=useState({elapsed:0,samples:0,coverage:0})
  const [calibrationReport,setCalibrationReport]=useState<CalibrationReport|null>(null)
  const [measure,setMeasure]=useState(initialMeasure), [noiseLevel,setNoiseLevel]=useState<number|null>(null), [summary,setSummary]=useState<VoiceSummary>(emptyVoice()), [previous,setPrevious]=useState<VoiceSummary|null>(null), [recording,setRecording]=useState(false), [audioUrl,setAudioUrl]=useState('')
  useEffect(()=>{showOverlay.current=overlay;faceCallback.current=onFace},[overlay,onFace])
  const release=useCallback(()=>{
    generation.current++;cancelAnimationFrame(frame.current);collecting.current=null;noiseValues.current=null;voiceRunning.current=false
    if(recorder.current){recorder.current.ondataavailable=null;recorder.current.onstop=null;if(recorder.current.state!=='inactive')recorder.current.stop();recorder.current=null}chunks.current=[]
    stream.current?.getTracks().forEach(t=>t.stop());stream.current=null
    if(video.current)video.current.srcObject=null
    detector.current?.close();detector.current=null
    if(context.current){void context.current.close().catch(()=>{});context.current=null}
    latest.current=null;baseline.current=null;noise.current=0;setNoiseLevel(null);setMeasure(initialMeasure);setQuality('unknown');setTracking('Peranti dihentikan.');setTrackingDetails({face:'Belum dikesan',position:'Belum tersedia',lighting:'Belum tersedia'});setVideoSize({width:0,height:0});setCalibrationReport(null);setCalibrationProgress({elapsed:0,samples:0,coverage:0});setCalibrated(false);setIsCalibrating(false);setActive(false);setLoading(false);setRecording(false)
  },[])
  const clearRecording=useCallback(()=>{if(url.current)URL.revokeObjectURL(url.current);url.current='';setAudioUrl('')},[])
  useEffect(()=>()=>{release();if(url.current)URL.revokeObjectURL(url.current)},[release])
  const activate=async()=>{
    if(loading || active)return
    if(!navigator.mediaDevices?.getUserMedia){setStatus('Kamera atau mikrofon memerlukan pelayar moden dan HTTPS.');return}
    const id=++generation.current;let loadingModel=false;setLoading(true);setStatus('Meminta kebenaran peranti…')
    try {
      const acquired=await navigator.mediaDevices.getUserMedia(kind==='voice'?{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}:{video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false})
      if(id!==generation.current){acquired.getTracks().forEach(t=>t.stop());return}stream.current=acquired
      acquired.getTracks().forEach(t=>{t.onended=()=>{if(id===generation.current){release();setStatus('Peranti terputus. Aktifkan semula untuk mencuba lagi.')}}})
      if(kind==='face') {
        if(!video.current)throw new Error('Pratonton kamera tidak tersedia')
        video.current.srcObject=acquired;await video.current.play();if(id!==generation.current)return;setStatus('Memuatkan model wajah pada peranti…');loadingModel=true
        const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision')
        const files=await FilesetResolver.forVisionTasks('/theatre/wasm')
        if(id!==generation.current)return
        const model=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/theatre/face_landmarker.task'},runningMode:'VIDEO',numFaces:2,outputFaceBlendshapes:true})
        if(id!==generation.current){model.close();return}detector.current=model;loadingModel=false
        const lightCanvas=document.createElement('canvas');lightCanvas.width=32;lightCanvas.height=24;const light=lightCanvas.getContext('2d',{willReadFrequently:true})
        const loop=(now:number)=>{if(id!==generation.current)return;if(now-last.current>=100 && video.current && detector.current && video.current.readyState>=2){last.current=now
          try {
            const res=detector.current.detectForVideo(video.current,now);const faces=res.faceLandmarks;const c=canvas.current,g=c?.getContext('2d');if(c&&g){const w=c.clientWidth*devicePixelRatio,h=c.clientHeight*devicePixelRatio;if(c.width!==w||c.height!==h){c.width=w;c.height=h}g.clearRect(0,0,c.width,c.height);if(showOverlay.current&&faces.length===1){const geometry=containVideo(video.current.videoWidth,video.current.videoHeight,c.width,c.height);if(geometry){g.fillStyle='#69c5a5';for(const p of faces[0]){const point=mirroredPoint(geometry,p.x,p.y);g.beginPath();g.arc(point.x,point.y,1.3*devicePixelRatio,0,7);g.fill()}}}}
            let dim=false;if(light){light.drawImage(video.current,0,0,32,24);const pixels=light.getImageData(0,0,32,24).data;let sum=0;for(let i=0;i<pixels.length;i+=4)sum+=(pixels[i]+pixels[i+1]+pixels[i+2])/3;dim=sum/(pixels.length/4)<35}
            if(faces.length!==1){latest.current=null;setQuality('poor');setTrackingDetails({face:faces.length>1?'Lebih daripada satu wajah':'Tidak dikesan',position:'Tidak dapat dinilai',lighting:dim?'Gelap (anggaran)':light?'Memadai (anggaran)':'Tidak tersedia'});setTracking(faces.length>1?'Lebih daripada satu wajah. Pastikan hanya seorang dalam kamera.':'Wajah tidak dikesan. Hadap kamera dan tambah pencahayaan.')}else{const points=faces[0], minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));const small=maxX-minX<.18;const edge=minX<.03||maxX>.97||minY<.03||maxY>.97
              const values:Blend={};for(const x of res.faceBlendshapes[0]?.categories??[])values[x.categoryName]=x.score
              const valid=!small&&!edge&&!dim&&Object.keys(values).length>0;latest.current=valid?values:null;setQuality(valid?'good':'poor');setTrackingDetails({face:'Satu wajah dikesan',position:small?'Terlalu jauh':edge?'Wajah terpotong':'Dalam bingkai',lighting:dim?'Gelap (anggaran)':light?'Memadai (anggaran)':'Tidak tersedia'})
              setTracking(dim?'Imej gelap. Tambah cahaya di hadapan wajah.':small?'Dekatkan wajah kepada kamera.':edge?'Letakkan seluruh wajah di tengah bingkai.':'Wajah dikesan · kedudukan dan cahaya memadai.')
              if(valid){if(collecting.current)collecting.current.push({time:(now-calibrationStart.current)/1000,values});faceCallback.current(values,now)}
            }

          }catch{release();setStatus('Analisis wajah terhenti. Cuba aktifkan semula kamera.');return}
        }
        if(collecting.current && now-calibrationTick.current>=250){calibrationTick.current=now;const elapsed=Math.min(CALIBRATION_SECONDS,Math.max(0,(now-calibrationStart.current)/1000));setCalibrationProgress({elapsed,samples:collecting.current.length,coverage:calibrationCoverage(collecting.current,elapsed)});if(elapsed>=CALIBRATION_SECONDS){const result=evaluateCalibration(collecting.current,CALIBRATION_SECONDS,(now-calibrationStart.current)/1000);baseline.current=result.baseline;collecting.current=null;setCalibrationReport(result.report);setCalibrated(!!result.baseline);setIsCalibrating(false);setStatus(result.baseline?'Kalibrasi neutral selesai.':'Kalibrasi gagal. Semak kedudukan dan cuba lagi.')}}
        frame.current=requestAnimationFrame(loop)};frame.current=requestAnimationFrame(loop);setStatus('Kamera aktif · data diproses pada peranti.')
      }else{
        const ctx=new AudioContext();context.current=ctx;await ctx.resume();if(id!==generation.current)return;const analyser=ctx.createAnalyser();analyser.fftSize=2048;ctx.createMediaStreamSource(acquired).connect(analyser);const data=new Float32Array(analyser.fftSize)
        const loop=(now:number)=>{if(id!==generation.current)return;if(now-last.current>=100){last.current=now;analyser.getFloatTimeDomainData(data);const m=measureAudio(data,ctx.sampleRate,noise.current);setMeasure(m)
          if(noiseValues.current){noiseValues.current.push(m.rms);if(now-noiseStart.current>=2000){const a=noiseValues.current;noise.current=a.reduce((x,y)=>x+y,0)/a.length;noiseValues.current=null;setNoiseLevel(noise.current);setIsCalibrating(false);setStatus(noise.current>.05?'Bunyi latar tinggi. Cari tempat lebih senyap dan kalibrasi semula.':'Kalibrasi mikrofon selesai. Ukuran bergantung pada peranti dan jarak.')}}
          if(voiceRunning.current){const dt=lastAudio.current?Math.min(.25,(now-lastAudio.current)/1000):0;lastAudio.current=now;const next=dt>0?addVoice(voiceData.current,m,dt,noise.current,silent.current):voiceData.current;silent.current=m.rms<Math.max(.015,noise.current*2);voiceData.current=next;setSummary(next)}
          const c=canvas.current,g=c?.getContext('2d');if(c&&g&&c.clientWidth){const w=c.clientWidth*devicePixelRatio,h=c.clientHeight*devicePixelRatio;if(c.width!==w||c.height!==h){c.width=w;c.height=h}g.clearRect(0,0,w,h);g.strokeStyle='#d8b477';g.lineWidth=2*devicePixelRatio;g.beginPath();data.forEach((v,i)=>{const x=i/(data.length-1)*w,y=h/2-v*h*.45;if(i)g.lineTo(x,y);else g.moveTo(x,y)});g.stroke()}
        }frame.current=requestAnimationFrame(loop)};frame.current=requestAnimationFrame(loop);setStatus('Mikrofon aktif · data diproses pada peranti.')
      }
      if(id===generation.current){setActive(true);setLoading(false)}
    } catch(error){if(id===generation.current){release();setStatus(deviceError(error,loadingModel))}}
  }
  const onVideoMetadata=()=>{const element=video.current;if(element?.videoWidth&&element.videoHeight)setVideoSize({width:element.videoWidth,height:element.videoHeight})}
  const getBaseline=useCallback(()=>baseline.current,[])
  const beginCalibration=()=>{if(!active)return;setIsCalibrating(true);if(kind==='face'){baseline.current=null;setCalibrated(false);setCalibrationReport(null);setCalibrationProgress({elapsed:0,samples:0,coverage:0});collecting.current=[];calibrationStart.current=performance.now();calibrationTick.current=0;setStatus('Kekalkan wajah neutral selama dua saat.')}else{noiseValues.current=[];noiseStart.current=performance.now();setStatus('Diam selama dua saat untuk mengukur bunyi latar.')}}
  const beginVoice=()=>{if(voiceData.current.duration>0)setPrevious(voiceData.current);voiceData.current=emptyVoice();setSummary(emptyVoice());silent.current=true;lastAudio.current=0;voiceRunning.current=true}
  const resetVoice=()=>{voiceRunning.current=false;voiceData.current=emptyVoice();lastAudio.current=0;setSummary(emptyVoice());setPrevious(null)}
  const endVoice=()=>{voiceRunning.current=false;lastAudio.current=0;setSummary({...voiceData.current})}
  const toggleRecord=()=>{if(!stream.current||typeof MediaRecorder==='undefined'){setStatus('Rakaman tidak disokong oleh pelayar ini.');return}if(recording){recorder.current?.stop();setRecording(false);return}try{chunks.current=[];const rec=new MediaRecorder(stream.current);recorder.current=rec;const id=generation.current;rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};rec.onstop=()=>{if(id!==generation.current)return;if(chunks.current.length){if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(new Blob(chunks.current,{type:rec.mimeType}));setAudioUrl(url.current);chunks.current=[]}};rec.start();setRecording(true)}catch{setStatus('Rakaman tidak dapat dimulakan.')}}
  return {video,canvas,videoSize,onVideoMetadata,trackingDetails,calibrationProgress,calibrationReport,active,loading,status,setStatus,tracking,quality,overlay,setOverlay,calibrated,isCalibrating,getBaseline,measure,noiseLevel,summary,previous,recording,audioUrl,activate,release,clearRecording,beginCalibration,beginVoice,endVoice,resetVoice,toggleRecord}
}


