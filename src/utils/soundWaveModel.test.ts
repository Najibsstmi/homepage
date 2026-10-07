import { describe, expect, it } from "vitest";
import {
  buildWavePath,
  mapAmplitudeToGain,
  mapAmplitudeToVisual,
  mapFrequencyToCycles,
} from "./soundWaveModel";

describe("sound wave model", () => {
  it("maps amplitude independently from frequency", () => {
    expect(mapAmplitudeToVisual(20)).toBeLessThan(mapAmplitudeToVisual(80));
    expect(mapAmplitudeToGain(20)).toBeLessThan(mapAmplitudeToGain(80));
    expect(mapFrequencyToCycles(400)).toBe(mapFrequencyToCycles(400));
  });

  it("maps frequency to more visual cycles without changing amplitude", () => {
    expect(mapFrequencyToCycles(200)).toBeLessThan(mapFrequencyToCycles(800));
    expect(mapAmplitudeToVisual(55)).toBe(mapAmplitudeToVisual(55));
    expect(mapAmplitudeToGain(55)).toBe(mapAmplitudeToGain(55));
  });

  it("keeps mappings within safe limits", () => {
    expect(mapAmplitudeToVisual(-20)).toBe(2);
    expect(mapAmplitudeToVisual(120)).toBe(110);
    expect(mapAmplitudeToGain(0)).toBe(0);
    expect(mapAmplitudeToGain(100)).toBeCloseTo(0.12);
    expect(mapFrequencyToCycles(0)).toBe(2.5);
    expect(mapFrequencyToCycles(2000)).toBe(10.5);
  });

  it("builds a path that starts and ends at the calibrated anchors", () => {
    const path = buildWavePath({
      start: { x: 10, y: 20 },
      end: { x: 110, y: 30 },
      amplitude: 24,
      cycles: 4,
      samples: 40,
    });

    expect(path.startsWith("M 10.00 20.00")).toBe(true);
    expect(path.endsWith("110.00 30.00")).toBe(true);
    expect(path.match(/ L /g)).toHaveLength(40);
  });
});
