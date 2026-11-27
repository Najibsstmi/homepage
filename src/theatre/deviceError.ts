export function deviceError(error:unknown, loadingModel:boolean):string {
  const name=error instanceof Error?error.name:''
  if(loadingModel)return 'Model wajah gagal dimuat. Semak sambungan ke laman ini dan cuba aktifkan kamera semula.'
  if(name==='NotAllowedError'||name==='SecurityError')return 'Akses ditolak. Benarkan kamera atau mikrofon dalam tetapan laman dan cuba lagi.'
  if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'Peranti tidak ditemui. Sambungkan kamera atau mikrofon dan cuba lagi.'
  if(name==='NotReadableError'||name==='TrackStartError')return 'Peranti sedang digunakan atau tidak dapat dibaca. Tutup aplikasi lain dan cuba lagi.'
  if(name==='OverconstrainedError')return 'Tetapan kamera tidak disokong oleh peranti ini. Cuba pelayar atau peranti lain.'
  return `Peranti tidak dapat dimulakan (${name || 'ralat'}). Semak sambungan dan cuba lagi.`
}
