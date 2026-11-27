import type { Blend, MovementSample } from './movement'
import { calibrateWindow } from './movement'
export const CALIBRATION_SECONDS = 2
export type CalibrationReport = { duration:number; samples:number; coverage:number; variation:number|null; tracking:'memadai'|'tidak mencukupi'; reason:string|null }
export function calibrationCoverage(samples:MovementSample[],duration:number):number {
  if(duration<=0)return 0
  let observed=0;for(let i=1;i<samples.length;i++){const gap=samples[i].time-samples[i-1].time;if(gap>0&&gap<=.5)observed+=gap}
  return Math.min(1,observed/duration)
}
export function evaluateCalibration(samples:MovementSample[], duration=CALIBRATION_SECONDS, actualDuration=duration): {baseline:Blend|null; report:CalibrationReport} {
  const baseline=calibrateWindow(samples,duration)
  const coverage=calibrationCoverage(samples,actualDuration)
  let variation:number|null=null
  if(baseline&&samples.length){const keys=Object.keys(baseline);variation=keys.reduce((total,key)=>total+Math.sqrt(samples.reduce((sum,s)=>sum+(s.values[key]-baseline[key])**2,0)/samples.length),0)/keys.length}
  const reason=baseline?null:samples.length<10?'Terlalu sedikit sampel wajah.':samples[0].time>.5?'Wajah tidak dikesan pada awal kalibrasi.':samples[samples.length-1].time<duration-.5?'Wajah tidak dapat dijejak sehingga akhir kalibrasi.':'Penjejakan terputus atau data wajah tidak lengkap.'
  return {baseline,report:{duration:actualDuration,samples:samples.length,coverage,variation,tracking:baseline?'memadai':'tidak mencukupi',reason}}
}
