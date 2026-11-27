import type { Blend, MovementSample } from './movement'
import { hasReliableCoverage, stageResults, type FeedbackRules } from './movement'
import type { Stage } from './exercises'
const groups=[{label:'Kening',keys:['browInnerUp','browDownLeft','browDownRight']},{label:'Mata',keys:['eyeWideLeft','eyeWideRight','eyeBlinkLeft','eyeBlinkRight']},{label:'Sudut bibir',keys:['mouthSmileLeft','mouthSmileRight','mouthFrownLeft','mouthFrownRight']},{label:'Rahang',keys:['jawOpen','jawForward']}]
export type FaceObservation={label:string; observed:boolean; meanChange:number; coverage:number; count:number}
export function faceObservations(samples:MovementSample[],baseline:Blend,targets:string[],duration:number,rules:FeedbackRules):FaceObservation[] {
  return groups.flatMap(group=>{const keys=group.keys.filter(k=>targets.includes(k));if(!keys.length)return []
    const stage:Stage={instruction:group.label,duration:Math.max(duration,1),objectives:keys,transition:'gradual'}
    const result=stageResults([stage],samples,baseline,rules.movementThreshold,rules.maximumGap)[0]
    if(!hasReliableCoverage(result,duration,rules))return []
    const changes=samples.filter(s=>s.time<duration&&keys.every(key=>Number.isFinite(s.values[key])&&Number.isFinite(baseline[key]))).map(s=>keys.reduce((sum,key)=>sum+Math.abs(s.values[key]-baseline[key]),0)/keys.length)
    if(!changes.length)return []
    const meanChange=changes.reduce((a,b)=>a+b,0)/changes.length
    return [{label:group.label,observed:meanChange>=rules.movementThreshold,meanChange,coverage:result.coverage,count:changes.length}]
  })
}
