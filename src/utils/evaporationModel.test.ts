import { describe, expect, it } from "vitest";
import { getEvaporationRate, type EvaporationInputs } from "./evaporationModel";

const defaults: EvaporationInputs = {
  temperature: 30,
  airflow: 1,
  humidity: 55,
  vessel: "medium",
};

describe("evaporation educational model", () => {
  it("increases the rate when temperature rises", () => {
    expect(getEvaporationRate({ ...defaults, temperature: 50 })).toBeGreaterThan(
      getEvaporationRate({ ...defaults, temperature: 10 }),
    );
  });

  it("increases the rate when airflow strengthens", () => {
    expect(getEvaporationRate({ ...defaults, airflow: 2 })).toBeGreaterThan(
      getEvaporationRate({ ...defaults, airflow: 0 }),
    );
  });

  it("reduces the net rate when humidity rises", () => {
    expect(getEvaporationRate({ ...defaults, humidity: 90 })).toBeLessThan(
      getEvaporationRate({ ...defaults, humidity: 20 }),
    );
  });

  it("increases the rate with a wider exposed surface", () => {
    expect(getEvaporationRate({ ...defaults, vessel: "wide" })).toBeGreaterThan(
      getEvaporationRate({ ...defaults, vessel: "narrow" }),
    );
  });
});
