import { pitch } from '../pages/theatreAudio'
export type AudioMeasurement = { rms:number; db:number; hz:number|null; clipping:boolean; voiced:boolean }
export function measureAudio(samples: Float32Array, rate:number, noise:number): AudioMeasurement {
  let square=0, peak=0;for(const x of samples){square+=x*x;peak=Math.max(peak,Math.abs(x))}
  const rms=Math.sqrt(square/Math.max(1,samples.length));const hz=rms>Math.max(.015,noise*2)?pitch(samples,rate):null
  return {rms,db:20*Math.log10(Math.max(rms,.00001)),hz,clipping:peak>=.99,voiced:hz!==null}
}
export type VoiceSummary = { duration:number; voiced:number; silence:number; pauses:number; meanRms:number; pitches:(number|null)[]; clipping:boolean }
export function emptyVoice():VoiceSummary{return {duration:0,voiced:0,silence:0,pauses:0,meanRms:0,pitches:[],clipping:false}}
export function addVoice(summary:VoiceSummary, m:AudioMeasurement, dt:number, noise:number, wasSilent:boolean):VoiceSummary {
  const silent=m.rms<Math.max(.015,noise*2);const duration=summary.duration+dt
  return {duration,voiced:summary.voiced+(m.voiced?dt:0),silence:summary.silence+(silent?dt:0),pauses:summary.pauses+(silent&&!wasSilent?1:0),meanRms:(summary.meanRms*summary.duration+m.rms*dt)/duration,pitches:[...summary.pitches,m.hz].slice(-300),clipping:summary.clipping||m.clipping}
}
