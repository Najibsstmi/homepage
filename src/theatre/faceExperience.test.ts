import { describe, expect, it } from 'vitest'
import { containVideo, mirroredPoint } from './videoGeometry'
import { CALIBRATION_SECONDS, calibrationCoverage, evaluateCalibration } from './calibration'
import { faceObservations } from './faceFeedback'
import { exercises } from './exercises'

describe('camera geometry',()=>{
 it('letterboxes a wide camera in a taller box without stretching',()=>{const g=containVideo(640,480,360,360)!;expect(g).toEqual({x:0,y:45,width:360,height:270});expect(mirroredPoint(g,0,0)).toEqual({x:360,y:45});expect(mirroredPoint(g,1,1)).toEqual({x:0,y:315})})
 it('pillarboxes a portrait camera and mirrors within its displayed rectangle',()=>{const g=containVideo(480,640,640,360)!;expect(g).toEqual({x:185,y:0,width:270,height:360});expect(mirroredPoint(g,.25,.5)).toEqual({x:387.5,y:180})})
 it('rejects missing video metadata',()=>{expect(containVideo(0,480,300,200)).toBeNull()})
})
describe('calibration report',()=>{
 const valid=Array.from({length:20},(_,i)=>({time:i/10,values:{browInnerUp:.2,jawOpen:.1}}))
 it('reports coverage and actual neutral variation for a valid calibration',()=>{const r=evaluateCalibration(valid);expect(r.baseline).not.toBeNull();expect(r.report.duration).toBe(CALIBRATION_SECONDS);expect(r.report.samples).toBe(20);expect(r.report.coverage).toBeCloseTo(.95);expect(r.report.variation).toBeCloseTo(0);expect(r.report.tracking).toBe('memadai')})
 it('reports failure when sample collection is sparse or interrupted',()=>{const sparse=valid.slice(0,4);const r=evaluateCalibration(sparse);expect(r.baseline).toBeNull();expect(r.report.reason).toContain('sedikit');expect(calibrationCoverage([],0)).toBe(0);expect(evaluateCalibration(valid.filter(s=>s.time<.5||s.time>1.5)).baseline).toBeNull()})
})
describe('student feedback',()=>{
 it('shows observable movement only for tracked targets with enough data',()=>{const exercise=exercises.find(e=>e.id==='face-Gembira')!;const baseline=Object.fromEntries(exercise.movementObjectives.map(k=>[k,0]));const samples=Array.from({length:20},(_,i)=>({time:i/10,values:Object.fromEntries(exercise.movementObjectives.map(k=>[k,.1]))}));const result=faceObservations(samples,baseline,exercise.movementObjectives,2,exercise.feedbackRules);expect(result.some(x=>x.label==='Sudut bibir'&&x.observed)).toBe(true);expect(faceObservations(samples.slice(0,4),baseline,exercise.movementObjectives,2,exercise.feedbackRules)).toEqual([])})
})
