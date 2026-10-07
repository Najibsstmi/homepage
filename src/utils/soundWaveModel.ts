export const SOUND_AMPLITUDE_MIN = 0;
export const SOUND_AMPLITUDE_MAX = 100;
export const SOUND_FREQUENCY_MIN = 200;
export const SOUND_FREQUENCY_MAX = 1000;

export type WavePoint = {
  x: number;
  y: number;
};

type WavePathOptions = {
  start: WavePoint;
  end: WavePoint;
  amplitude: number;
  cycles: number;
  phase?: number;
  samples?: number;
};

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Maps the relative 0–100 control to a safe visual height in the scene. */
export function mapAmplitudeToVisual(amplitude: number) {
  const normalized =
    clamp(amplitude, SOUND_AMPLITUDE_MIN, SOUND_AMPLITUDE_MAX) /
    SOUND_AMPLITUDE_MAX;

  return 2 + normalized * 108;
}

/** Maps the relative amplitude control to a conservative Web Audio gain. */
export function mapAmplitudeToGain(amplitude: number) {
  const normalized =
    clamp(amplitude, SOUND_AMPLITUDE_MIN, SOUND_AMPLITUDE_MAX) /
    SOUND_AMPLITUDE_MAX;

  if (normalized === 0) {
    return 0;
  }

  return Math.pow(normalized, 1.6) * 0.12;
}

/**
 * Maps audible frequency to a readable on-screen cycle count. Audio Hz is not
 * used directly because hundreds of cycles would make the SVG illegible.
 */
export function mapFrequencyToCycles(frequency: number) {
  const normalized =
    (clamp(frequency, SOUND_FREQUENCY_MIN, SOUND_FREQUENCY_MAX) -
      SOUND_FREQUENCY_MIN) /
    (SOUND_FREQUENCY_MAX - SOUND_FREQUENCY_MIN);

  return 2.5 + normalized * 8;
}

/** Builds a smooth sine path along the line between the speaker and the ear. */
export function buildWavePath({
  start,
  end,
  amplitude,
  cycles,
  phase = 0,
  samples = 180,
}: WavePathOptions) {
  const safeSamples = Math.max(24, Math.round(samples));
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpendicularX = -dy / length;
  const perpendicularY = dx / length;
  const commands: string[] = [];

  for (let index = 0; index <= safeSamples; index += 1) {
    const progress = index / safeSamples;
    const envelope = Math.sin(Math.PI * progress);
    const offset =
      Math.sin(progress * cycles * Math.PI * 2 - phase) *
      amplitude *
      envelope;
    const x = start.x + dx * progress + perpendicularX * offset;
    const y = start.y + dy * progress + perpendicularY * offset;

    commands.push(`${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return commands.join(" ");
}
