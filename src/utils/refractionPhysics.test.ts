import { describe, expect, it } from "vitest";
import {
  calculateRefractionAngle,
  getRefractionGeometry,
  REFRACTIVE_INDEX,
} from "./refractionPhysics";

describe("refraction physics", () => {
  it("keeps a perpendicular ray undeviated", () => {
    expect(calculateRefractionAngle(0, REFRACTIVE_INDEX.water)).toBeCloseTo(0);
    expect(calculateRefractionAngle(0, REFRACTIVE_INDEX.glass)).toBeCloseTo(0);
  });

  it("bends an air-to-water ray towards the normal", () => {
    const incidence = 40;
    const refraction = calculateRefractionAngle(
      incidence,
      REFRACTIVE_INDEX.water,
    );

    expect(refraction).toBeCloseTo(28.9, 1);
    expect(refraction).toBeLessThan(incidence);
  });

  it("bends more strongly in glass than in water", () => {
    const waterAngle = calculateRefractionAngle(50, REFRACTIVE_INDEX.water);
    const glassAngle = calculateRefractionAngle(50, REFRACTIVE_INDEX.glass);

    expect(glassAngle).toBeLessThan(waterAngle);
  });

  it("keeps the reflected angle equal to the incident angle", () => {
    const geometry = getRefractionGeometry({
      incidenceAngle: 35,
      destinationIndex: REFRACTIVE_INDEX.water,
      side: -1,
    });
    const reflectedDx = geometry.reflectedEnd.x - 570;
    const reflectedDy = 371 - geometry.reflectedEnd.y;
    const reflectedAngle =
      (Math.atan2(Math.abs(reflectedDx), reflectedDy) * 180) / Math.PI;

    expect(reflectedAngle).toBeCloseTo(35, 5);
  });
});
