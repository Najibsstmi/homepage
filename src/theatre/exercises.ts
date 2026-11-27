import type { FeedbackRules } from './movement'
export type Studio = 'face' | 'transition' | 'voice'
export type ReferenceMedia = { id:string; kind:'video' | 'image'; src:string; title:string; alt?:string; captionsSrc?:string }
export type Stage = { instruction: string; duration: number; objectives: string[]; transition: 'gradual' | 'abrupt'; referenceMedia?: ReferenceMedia[] }
export type Exercise = {
  id: string; studio: Studio; title: string; description: string; objective: string
  curriculum: string; difficulty: 'Asas' | 'Pertengahan' | 'Lanjutan'; instructions: string[]
  scenario?: string; dialogue?: string; duration?: number; movementObjectives: string[]
  feedbackRules: FeedbackRules; referenceMedia?: ReferenceMedia[]
  validation: 'perlu semakan guru'; stages?: Stage[]
}
const common = { curriculum: 'KSSM Seni Teater SSeM Tingkatan 1 · Bidang Lakonan · SP 1.1.1', validation: 'perlu semakan guru' as const, feedbackRules: { movementThreshold: 0.04, minimumSamples: 5, minimumCoverage: 0.65, minimumDuration: 1, maximumGap: 0.3, intensityThresholds: {ringan: 0.02, sederhana: 0.04, kuat: 0.08} } }
const faces: Array<[string,string[]]> = [
  ['Gembira',['mouthSmileLeft','mouthSmileRight','cheekSquintLeft','cheekSquintRight']],
  ['Sedih',['browInnerUp','mouthFrownLeft','mouthFrownRight']],
  ['Marah',['browDownLeft','browDownRight','jawForward']],
  ['Takut',['browInnerUp','eyeWideLeft','eyeWideRight','jawOpen']],
  ['Terkejut',['browInnerUp','eyeWideLeft','eyeWideRight','jawOpen']],
  ['Jijik',['noseSneerLeft','noseSneerRight','mouthUpperUpLeft','mouthUpperUpRight']],
]
export const exercises: Exercise[] = [
  ...faces.map(([title, movementObjectives]) => ({...common, id: `face-${title}`, studio: 'face' as const, title, description: `Gunakan ${title.toLocaleLowerCase('ms-MY')} sebagai arahan lakonan.`, objective: 'Teroka pergerakan wajah bagi membina watak.', difficulty: 'Asas' as const, instructions: ['Kalibrasi wajah neutral.', 'Cuba variasi pergerakan yang selesa, kemudian tahan selama tiga saat.'], movementObjectives})),
  {...common,id:'gift',studio:'transition',title:'Hadiah Misteri',description:'Watak menerima hadiah dan menyedari ia satu gurauan.',objective:'Teroka perubahan pergerakan mengikut isyarat.',difficulty:'Asas',instructions:['Baca situasi dan sediakan wajah neutral.'],scenario:'Hadiah yang diterima mengandungi sesuatu yang tidak dijangka.',movementObjectives:['mouthSmileLeft','mouthSmileRight','eyeWideLeft','eyeWideRight','jawOpen'],stages:[{instruction:'Gembira',duration:5,objectives:['mouthSmileLeft','mouthSmileRight'],transition:'gradual'},{instruction:'Terkejut',duration:5,objectives:['eyeWideLeft','eyeWideRight','jawOpen'],transition:'abrupt'},{instruction:'Ketawa',duration:5,objectives:['mouthSmileLeft','mouthSmileRight','jawOpen'],transition:'gradual'}]},
  {...common,id:'visitor',studio:'transition',title:'Tetamu di Pintu',description:'Watak mendengar ketukan dan mengenali tetamu.',objective:'Cuba perubahan mendadak dan beransur.',difficulty:'Pertengahan',instructions:['Bayangkan bunyi ketukan di pintu.'],scenario:'Pada mulanya waspada, kemudian terkejut dan akhirnya lega.',movementObjectives:['browDownLeft','eyeWideLeft','mouthSmileLeft','mouthSmileRight'],stages:[{instruction:'Waspada',duration:4,objectives:['browDownLeft','browDownRight'],transition:'gradual'},{instruction:'Terkejut',duration:4,objectives:['eyeWideLeft','eyeWideRight'],transition:'abrupt'},{instruction:'Lega',duration:6,objectives:['mouthSmileLeft','mouthSmileRight'],transition:'gradual'}]},
  ...([['Pernafasan','Bernafas secara semula jadi dan hembus perlahan tanpa menahan nafas.','Hembus dengan selesa sambil mengeluarkan bunyi lembut.'],['Projeksi Suara','Sampaikan dialog dengan jelas tanpa menjerit.','Apa yang ada di dalam kotak ini?'],['Intonasi','Ulang dialog dengan corak nada yang berlainan.','Apa yang ada di dalam kotak ini?'],['Artikulasi','Sebut dengan jelas; dengar semula untuk menilai sebutan sendiri.','Baju biru baru di bawah bangku.'],['Tempo dan Jeda','Cuba tempo berbeza dan beri ruang kepada jeda dramatik.','Tunggu sebentar... saya ada sesuatu untuk kamu.']] as const).map(([title,description,dialogue])=>({...common,id:`voice-${title}`,studio:'voice' as const,title,description,objective:description,difficulty:'Asas' as const,instructions:[description,'Berhenti jika suara atau pernafasan terasa tidak selesa.'],dialogue,movementObjectives:[]}))
]
export const labels: Record<Studio, string> = {face:'Ekspresi Wajah', transition:'Transisi Ekspresi', voice:'Teknik Vokal'}
