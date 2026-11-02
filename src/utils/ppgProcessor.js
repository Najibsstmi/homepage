const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const measurementProgress = (usableMilliseconds, resultReady = false) => {
  if (resultReady) return 100;
  return 16 + Math.min(80, (Math.max(0, usableMilliseconds) / 30000) * 80);
};

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
};

export function resampleSignal(samples, targetHz) {
  if (samples.length < 3) return [];
  const start = samples[0].time;
  const end = samples.at(-1).time;
  const step = 1000 / targetHz;
  const output = [];
  let sourceIndex = 1;

  for (let time = start; time <= end; time += step) {
    while (sourceIndex < samples.length && samples[sourceIndex].time < time) sourceIndex += 1;
    if (sourceIndex >= samples.length) break;
    const before = samples[sourceIndex - 1];
    const after = samples[sourceIndex];
    const gap = after.time - before.time;
    if (gap <= 0 || gap > 500) continue;
    const mix = (time - before.time) / gap;
    output.push({ time, value: before.value + (after.value - before.value) * mix });
  }

  return output;
}

function movingAverage(values, windowSize) {
  const output = new Array(values.length).fill(0);
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index];
    if (index >= windowSize) sum -= values[index - windowSize];
    output[index] = sum / Math.min(index + 1, windowSize);
  }
  return output;
}

function lowPass(values, cutoffHz, sampleRate) {
  if (!values.length) return [];
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  const forward = new Array(values.length);
  forward[0] = values[0];
  for (let index = 1; index < values.length; index += 1) {
    forward[index] = forward[index - 1] + alpha * (values[index] - forward[index - 1]);
  }
  const backward = new Array(values.length);
  backward[values.length - 1] = forward[values.length - 1];
  for (let index = values.length - 2; index >= 0; index -= 1) {
    backward[index] = backward[index + 1] + alpha * (forward[index] - backward[index + 1]);
  }
  return backward;
}

export function preprocessSignal(samples, requestedRate) {
  if (samples.length < 10) return { sampleRate: requestedRate || 30, filtered: [], artifactRatio: 1 };
  const intervals = samples.slice(1).map((sample, index) => sample.time - samples[index].time).filter((gap) => gap > 5 && gap < 500);
  const measuredRate = intervals.length ? 1000 / median(intervals) : 30;
  const sampleRate = clamp(requestedRate || measuredRate, 12, 60);
  const resampled = resampleSignal(samples, sampleRate);
  if (resampled.length < 10) return { sampleRate, filtered: [], artifactRatio: 1 };

  const rawValues = resampled.map((sample) => sample.value);
  const baseline = movingAverage(rawValues, Math.max(3, Math.round(sampleRate * 1.25)));
  let detrended = rawValues.map((value, index) => value - baseline[index]);
  const differences = detrended.slice(1).map((value, index) => Math.abs(value - detrended[index]));
  const differenceMedian = median(differences) || 1e-6;
  let artifactCount = 0;
  detrended = detrended.map((value, index) => {
    if (index === 0) return value;
    if (Math.abs(value - detrended[index - 1]) > differenceMedian * 8) {
      artifactCount += 1;
      return detrended[index - 1];
    }
    return value;
  });

  const smoothed = lowPass(detrended, 3.5, sampleRate);
  const residualBaseline = movingAverage(smoothed, Math.max(3, Math.round(sampleRate / 0.7)));
  const bandPassed = smoothed.map((value, index) => value - residualBaseline[index]);
  const scale = standardDeviation(bandPassed) || 1;
  const filtered = resampled.map((sample, index) => ({
    time: sample.time,
    value: clamp(bandPassed[index] / scale, -5, 5),
  }));

  return { sampleRate, filtered, artifactRatio: artifactCount / Math.max(1, detrended.length) };
}

export function detectPeaks(filtered, sampleRate) {
  if (filtered.length < sampleRate * 4) return [];
  const values = filtered.map((sample) => sample.value);
  const localRange = Math.max(3, Math.round(sampleRate * 0.18));
  const candidates = [];
  for (let index = localRange; index < values.length - localRange; index += 1) {
    const value = values[index];
    if (value <= values[index - 1] || value < values[index + 1]) continue;
    const leftFloor = Math.min(...values.slice(index - localRange, index));
    const rightFloor = Math.min(...values.slice(index + 1, index + localRange + 1));
    const prominence = value - Math.max(leftFloor, rightFloor);
    if (prominence > 0.35) candidates.push({ ...filtered[index], prominence });
  }

  const peaks = [];
  const refractoryMs = 340;
  candidates.forEach((candidate) => {
    const previous = peaks.at(-1);
    if (!previous || candidate.time - previous.time >= refractoryMs) {
      peaks.push(candidate);
    } else if (candidate.value > previous.value) {
      peaks[peaks.length - 1] = candidate;
    }
  });
  return peaks;
}

export function frequencyEstimate(filtered) {
  if (filtered.length < 60) return { bpm: null, periodicity: 0 };
  const durationSeconds = (filtered.at(-1).time - filtered[0].time) / 1000;
  if (durationSeconds < 4) return { bpm: null, periodicity: 0 };
  const mean = filtered.reduce((sum, sample) => sum + sample.value, 0) / filtered.length;
  const values = filtered.map((sample) => sample.value - mean);
  let best = { power: 0, frequency: 0 };
  let totalPower = 0;
  const tested = [];
  for (let frequency = 0.7; frequency <= 3.5; frequency += 0.015) {
    let real = 0;
    let imaginary = 0;
    values.forEach((value, index) => {
      const seconds = (filtered[index].time - filtered[0].time) / 1000;
      real += value * Math.cos(2 * Math.PI * frequency * seconds);
      imaginary += value * Math.sin(2 * Math.PI * frequency * seconds);
    });
    const power = (real ** 2 + imaginary ** 2) / values.length ** 2;
    tested.push(power);
    totalPower += power;
    if (power > best.power) best = { power, frequency };
  }
  const backgroundPower = median(tested) || 1e-9;
  const periodicity = clamp((best.power / backgroundPower - 1) / 18, 0, 1);
  return { bpm: best.frequency ? best.frequency * 60 : null, periodicity, spectralPower: best.power / Math.max(totalPower, 1e-9) };
}

export function analyzePPG(samples, exposureScore = 1) {
  const { sampleRate, filtered, artifactRatio } = preprocessSignal(samples);
  const peaks = detectPeaks(filtered, sampleRate);
  let intervals = peaks.slice(1).map((peak, index) => peak.time - peaks[index].time).filter((gap) => gap >= 360 && gap <= 1430);
  if (intervals.length >= 3) {
    const center = median(intervals);
    intervals = intervals.filter((gap) => Math.abs(gap - center) / center < 0.28);
  }
  const intervalMedian = median(intervals);
  const timeBpm = intervalMedian ? 60000 / intervalMedian : null;
  const frequency = frequencyEstimate(filtered);
  const frequencyBpm = frequency.bpm;
  const agreement = timeBpm && frequencyBpm ? Math.abs(timeBpm - frequencyBpm) / ((timeBpm + frequencyBpm) / 2) : 1;
  const intervalVariation = intervals.length > 2 ? standardDeviation(intervals) / Math.max(median(intervals), 1) : 1;
  const duration = filtered.length ? (filtered.at(-1).time - filtered[0].time) / 1000 : 0;
  const peakCoverage = clamp(intervals.length / Math.max(4, duration * 0.75), 0, 1);
  const consistency = clamp(1 - intervalVariation / 0.22, 0, 1);
  const agreementScore = clamp(1 - agreement / 0.16, 0, 1);
  const artifactScore = clamp(1 - artifactRatio / 0.08, 0, 1);
  const score = 0.3 * frequency.periodicity + 0.22 * consistency + 0.18 * agreementScore + 0.12 * peakCoverage + 0.1 * artifactScore + 0.08 * exposureScore;
  const plausible = timeBpm >= 42 && timeBpm <= 210 && frequencyBpm >= 42 && frequencyBpm <= 210;
  const reliable = duration >= 8 && intervals.length >= 5 && plausible && agreement <= 0.16 && score >= 0.52;
  const bpm = reliable ? Math.round((timeBpm * 0.65 + frequencyBpm * 0.35)) : null;
  const quality = score >= 0.72 && reliable ? "Baik" : score >= 0.48 ? "Sederhana" : "Lemah";

  return {
    bpm,
    reliable,
    quality,
    qualityScore: score,
    filtered,
    peaks,
    timeBpm,
    frequencyBpm,
    agreement,
    artifactRatio,
    sampleRate,
    validIntervals: intervals,
  };
}

export function inspectFrame(imageData) {
  const data = imageData.data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let clipped = 0;
  let redClipped = 0;
  let greenClipped = 0;
  let blueClipped = 0;
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    red += r;
    green += g;
    blue += b;
    if (Math.max(r, g, b) > 250 || Math.max(r, g, b) < 8) clipped += 1;
    if (r > 250 || r < 8) redClipped += 1;
    if (g > 250 || g < 8) greenClipped += 1;
    if (b > 250 || b < 8) blueClipped += 1;
  }
  const pixels = data.length / 4;
  red /= pixels;
  green /= pixels;
  blue /= pixels;
  const brightness = (red + green + blue) / 3;
  const channelMean = brightness || 1;
  const chroma = (Math.max(red, green, blue) - Math.min(red, green, blue)) / channelMean;
  return {
    red,
    green,
    blue,
    brightness,
    chroma,
    redShare: red / Math.max(red + green + blue, 1),
    clipping: clipped / pixels,
    redClipping: redClipped / pixels,
    greenClipping: greenClipped / pixels,
    blueClipping: blueClipped / pixels,
  };
}

export function choosePPGChannel(history) {
  const recent = history.slice(-90);
  if (recent.length < 20) return "green";
  const preferences = { red: 1, green: 1.2, blue: 0.55 };
  const scores = ["red", "green", "blue"].map((channel) => {
    const values = recent.map((frame) => frame[channel]);
    const mean = median(values);
    const variation = standardDeviation(values) / Math.max(mean, 1);
    const clipping = median(
      recent.map((frame) => frame[`${channel}Clipping`] ?? frame.clipping ?? 0),
    );
    const exposurePenalty = mean < 12 || mean > 248 ? 0.08 : 1;
    return {
      channel,
      score:
        variation *
        (1 - clamp(clipping, 0, 0.95)) *
        preferences[channel] *
        exposurePenalty,
    };
  });
  scores.sort((first, second) => second.score - first.score);
  return scores[0].channel;
}

export function evaluateContact(history) {
  if (history.length < 20) return { detected: false, stable: false, exposureScore: 0, reason: "Menganalisis cahaya dan warna…" };
  const recent = history.slice(-45);
  const brightness = median(recent.map((item) => item.brightness));
  const redShare = median(recent.map((item) => item.redShare));
  const chroma = median(recent.map((item) => item.chroma));
  const clipping = median(recent.map((item) => item.clipping));
  const redVariation = standardDeviation(recent.map((item) => item.red)) / Math.max(median(recent.map((item) => item.red)), 1);
  const greenVariation = standardDeviation(recent.map((item) => item.green)) / Math.max(median(recent.map((item) => item.green)), 1);
  const brightnessVariation = standardDeviation(recent.map((item) => item.brightness)) / Math.max(brightness, 1);
  const exposureScore = clamp(1 - Math.abs(brightness - 125) / 125 - clipping * 1.8, 0, 1);
  const colorCompatible = redShare > 0.37 && chroma > 0.16;
  const exposureCompatible = brightness > 18 && brightness < 244 && clipping < 0.45;
  const pulseVariation = Math.max(redVariation, greenVariation);
  const hasTemporalSignal = pulseVariation > 0.001 && pulseVariation < 0.12;
  const stable = brightnessVariation < 0.11;
  let reason = "Letakkan hujung jari pada kamera belakang.";
  if (!exposureCompatible) reason = brightness <= 18 ? "Imej terlalu gelap. Laraskan kedudukan jari." : "Imej terlalu terang. Jangan tekan terlalu kuat.";
  else if (colorCompatible && !stable) reason = "Telefon atau jari bergerak. Kekalkan kedudukan.";
  else if (colorCompatible && !hasTemporalSignal) reason = "Isyarat terlalu lemah. Cuba laraskan kedudukan jari.";
  return { detected: colorCompatible && exposureCompatible && hasTemporalSignal, stable, exposureScore, reason, redVariation, greenVariation, brightnessVariation };
}
