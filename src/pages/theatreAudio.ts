/** Estimate fundamental frequency from the first strong autocorrelation peak. */
export function pitch(data: Float32Array, rate: number): number | null {
  let sum = 0; for (const value of data) sum += value * value
  if (Math.sqrt(sum / data.length) < .015) return null
  const minLag = Math.floor(rate / 500), maxLag = Math.min(Math.floor(rate / 70), Math.floor(data.length / 2))
  const correlations = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let ab = 0, aa = 0, bb = 0
    for (let i = 0; i < data.length - lag; i += 2) { ab += data[i] * data[i + lag]; aa += data[i] * data[i]; bb += data[i + lag] * data[i + lag] }
    correlations[lag] = ab / Math.sqrt(aa * bb || 1)
  }
  // The first strong peak avoids selecting an equally correlated multiple of the period.
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    const a=correlations[lag-1], b=correlations[lag], c=correlations[lag+1]
    if (b >= .85 && b >= a && b > c) {
      const denominator = a - 2 * b + c
      const correction = Math.abs(denominator) > 1e-8 ? Math.max(-.5, Math.min(.5, .5 * (a-c) / denominator)) : 0
      return rate / (lag + correction)
    }
  }
  return null
}
