export type VideoGeometry = { x:number; y:number; width:number; height:number }
/** The centred rectangle used by object-fit: contain, in CSS pixels. */
export function containVideo(videoWidth:number, videoHeight:number, boxWidth:number, boxHeight:number):VideoGeometry|null {
  if (![videoWidth,videoHeight,boxWidth,boxHeight].every(n=>Number.isFinite(n)&&n>0)) return null
  const scale=Math.min(boxWidth/videoWidth,boxHeight/videoHeight)
  const width=videoWidth*scale,height=videoHeight*scale
  return {x:(boxWidth-width)/2,y:(boxHeight-height)/2,width,height}
}
/** Landmarks are in the original, unmirrored image coordinate system. */
export function mirroredPoint(geometry:VideoGeometry, x:number, y:number) {
  return {x:geometry.x+(1-x)*geometry.width,y:geometry.y+y*geometry.height}
}
