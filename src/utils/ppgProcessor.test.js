import { describe, expect, it, vi } from "vitest";
import {
  analyzePPG,
  choosePPGChannel,
  evaluateContact,
  measurementProgress,
} from "./ppgProcessor";
import { releaseMediaStream } from "../hooks/useCamera";

const random = (seed = 42) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

function makeSignal({ bpm, seconds = 32, rate = 30, noise = 0.08, drift = 0, irregular = false, missing = false, motion = false }) {
  const rand = random(Math.round(bpm * 17 + noise * 100));
  const samples = [];
  let time = 0;
  let frame = 0;
  while (time < seconds * 1000) {
    const secondsNow = time / 1000;
    const fundamental = Math.sin(2 * Math.PI * (bpm / 60) * secondsNow);
    const harmonic = 0.22 * Math.sin(4 * Math.PI * (bpm / 60) * secondsNow + 0.5);
    let value = 120 + 2.8 * fundamental + harmonic + drift * Math.sin(2 * Math.PI * 0.11 * secondsNow) + (rand() - 0.5) * noise * 5;
    if (motion && frame % 211 >= 0 && frame % 211 < 2) value += frame % 2 ? 13 : -13;
    if (!missing || frame % 37 !== 0) samples.push({ time, value });
    const jitter = irregular ? (rand() - 0.5) * 18 : 0;
    time += Math.max(12, 1000 / rate + jitter);
    frame += 1;
  }
  return samples;
}

describe("PPG signal processing", () => {
  [60, 75, 90, 120, 150].forEach((bpm) => {
    it(`estimates ${bpm} BPM without presenting a fabricated result`, () => {
      const result = analyzePPG(makeSignal({ bpm }));
      expect(result.reliable).toBe(true);
      expect(result.bpm).toBeCloseTo(bpm, -0.6);
      expect(Math.abs(result.timeBpm - result.frequencyBpm)).toBeLessThan(bpm * 0.16);
    });
  });

  it("handles variable sampling rates and irregular timestamps", () => {
    for (const rate of [17, 24, 30, 48]) {
      const result = analyzePPG(makeSignal({ bpm: 78, rate, irregular: true, missing: true, drift: 2.5 }));
      expect(result.reliable).toBe(true);
      expect(Math.abs(result.bpm - 78)).toBeLessThanOrEqual(4);
    }
  });

  it("contains brief motion artifacts without losing the pulse estimate", () => {
    const result = analyzePPG(makeSignal({ bpm: 92, motion: true, irregular: true }));
    expect(result.reliable).toBe(true);
    expect(Math.abs(result.bpm - 92)).toBeLessThanOrEqual(5);
  });

  it("rejects low-SNR and no-pulse inputs", () => {
    const rand = random(991);
    const lowSnr = Array.from({ length: 900 }, (_, index) => ({
      time: index * (1000 / 30),
      value: 120 + (rand() - 0.5) * 12 + Math.sin(2 * Math.PI * (80 / 60) * index / 30) * 0.05,
    }));
    const flat = Array.from({ length: 900 }, (_, index) => ({ time: index * (1000 / 30), value: 120 }));
    expect(analyzePPG(lowSnr).reliable).toBe(false);
    expect(analyzePPG(lowSnr).bpm).toBeNull();
    expect(analyzePPG(flat).reliable).toBe(false);
    expect(analyzePPG(flat).bpm).toBeNull();
  });

  it("detects likely sudden finger removal", () => {
    const goodFrames = Array.from({ length: 45 }, (_, index) => ({
      red: 180 + Math.sin(index / 4) * 2,
      green: 70,
      blue: 55,
      brightness: 102,
      chroma: 1.22,
      redShare: 0.59,
      clipping: 0.02,
    }));
    expect(evaluateContact(goodFrames).detected).toBe(true);
    const removed = Array.from({ length: 45 }, () => ({ red: 70, green: 73, blue: 75, brightness: 73, chroma: 0.07, redShare: 0.32, clipping: 0 }));
    expect(evaluateContact(removed).detected).toBe(false);
  });

  it("selects an unclipped pulsatile channel", () => {
    const history = Array.from({ length: 60 }, (_, index) => ({
      red: 253 + Math.sin(index) * 0.1,
      green: 82 + Math.sin(index / 4) * 2.4,
      blue: 35 + Math.sin(index / 3) * 0.2,
      clipping: 0.9,
      redClipping: 0.95,
      greenClipping: 0,
      blueClipping: 0,
    }));
    expect(choosePPGChannel(history)).toBe("green");
  });

  it("reserves 100 percent for a validated result", () => {
    expect(measurementProgress(30000)).toBe(96);
    expect(measurementProgress(45000)).toBe(96);
    expect(measurementProgress(30000, true)).toBe(100);
  });
});

describe("camera cleanup", () => {
  it("stops every media track", () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    releaseMediaStream({ getTracks: () => tracks });
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
  });
});
