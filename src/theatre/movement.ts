import type { Stage } from './exercises'
export type Blend = Record<string, number>
export type MovementSample = { time: number; values: Blend }
export type FeedbackRules = { movementThreshold: number; minimumSamples: number; minimumCoverage: number; minimumDuration: number; maximumGap: number; intensityThresholds: { ringan:number; sederhana:number; kuat:number } }

/** Neutral baseline is only meaningful if tracking covered the calibration window. */
export function calibrate(samples: Blend[]): Blend | null {
  if (samples.length < 5) return null
  const keys=Object.keys(samples[0]); if(!keys.length||samples.some(s=>keys.some(key=>!Number.isFinite(s[key]))))return null
  const result: Blend = {}; for (const key of keys) result[key] = samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length
  return result
}
export function calibrateWindow(samples:MovementSample[], duration=2):Blend|null {
  if(samples.length<10||samples[0].time>.5||samples[samples.length-1].time<duration-.5)return null
  if(samples.some((s,i)=>i>0&&(s.time-samples[i-1].time>.5||s.time<samples[i-1].time)))return null
  return calibrate(samples.map(s=>s.values))
}
export function movement(values: Blend, baseline: Blend, targets: string[]): number | null {
  if(!targets.length || targets.some(key=>!Number.isFinite(values[key])||!Number.isFinite(baseline[key])))return null
  return targets.reduce((sum, key) => sum + Math.abs(values[key]-baseline[key]), 0) / targets.length
}
export function stageAt(stages: Stage[], elapsed: number): number {
  let end=0; for(let i=0;i<stages.length;i++){end+=stages[i].duration;if(elapsed<end)return i} return Math.max(0,stages.length-1)
}
export function totalDuration(stages: Stage[]) { return stages.reduce((sum,s)=>sum+s.duration,0) }
export function elapsedAt(accumulated: number, startedAt: number, now: number) { return accumulated + Math.max(0, now-startedAt)/1000 }
export function stageResults(stages: Stage[], samples: MovementSample[], baseline: Blend, threshold=.04, maximumGap=.3) {
  let start=0
  return stages.map(stage=>{
    const end=start+stage.duration
    const data=samples.filter(s=>s.time>=start&&s.time<end).map(s=>({time:s.time,value:movement(s.values,baseline,stage.objectives)})).filter((s):s is {time:number,value:number}=>s.value!==null)
    const values=data.map(s=>s.value), variation=values.length?Math.max(...values)-Math.min(...values):null
    const hold=values.slice(Math.floor(values.length/2)), holdMean=hold.reduce((a,b)=>a+b,0)/(hold.length||1)
    const stability=hold.length>=3?Math.sqrt(hold.reduce((sum,x)=>sum+(x-holdMean)**2,0)/hold.length):null
    // Missing frames do not count as observed time; never bridge a long tracking gap.
    let coverage=0,durationAbove=0
    for(let i=0;i<data.length-1;i++){const gap=data[i+1].time-data[i].time;if(gap>0&&gap<=maximumGap){coverage+=gap;if(data[i].value>=threshold)durationAbove+=gap}}
    const first=data.find(s=>s.value>=threshold), initial=data[0]?.value
    const change=initial===undefined?undefined:data.find(s=>Math.abs(s.value-initial)>=threshold)
    const cueObserved=!!data.length&&data[0].time-start<=maximumGap*2
    const result={...stage,start,end,samples:data.length,coverage,onset:cueObserved&&first?first.time-start:null,transitionOnset:cueObserved&&change?change.time-start:null,cueObserved,durationAbove,variation,stability};start=end;return result
  })
}
export function hasReliableCoverage(result:ReturnType<typeof stageResults>[number], observedDuration:number, rules:FeedbackRules):boolean {
  return observedDuration>=rules.minimumDuration&&result.samples>=rules.minimumSamples&&result.coverage>=observedDuration*rules.minimumCoverage
}
