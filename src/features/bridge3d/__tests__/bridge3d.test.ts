import { describe, expect, it } from "vitest";
import { calculateBridgeMass, consumeStickSegment, createStickInventory } from "../inventory";
import { getNextLoadKg, isHoldCycleComplete } from "../loadTest";
import { addMember, applyGlue, createEmptyDesign, createStarterDesign } from "../model";
import { cloneProfile, OFFICIAL_2026_PROFILE } from "../profile";
import { calculateEfficiency, calculateTestingScore } from "../scoring";
import { analyseBridge } from "../solver";
import { validateBridge } from "../validation";

describe("Bridge Building 3D competition logic", () => {
  it("A. loads the default 2026 competition profile", () => {
    const profile = OFFICIAL_2026_PROFILE;
    expect(profile.bridgeRules.minLengthCm).toBe(40);
    expect(profile.bridgeRules.maxLengthCm).toBe(45);
    expect(profile.materialRules.skewerCount).toBe(30);
    expect(profile.materialRules.skewerLengthCm).toBe(45);
    expect(profile.materialRules.glueRefillCount * profile.materialRules.glueRefillLengthCm).toBe(60);
    expect(profile.loadTestRules.maximumTestLoadKg).toBe(175);
  });

  it("B. immediately applies an overridden maximum bridge length", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: -21, y: 0, z: 0 }, { x: 21, y: 0, z: 0 }, "base", "truss").design;
    expect(validateBridge(design).items.find((item) => item.id === "length")?.severity).toBe("pass");
    const override = cloneProfile(design.profileSnapshot);
    override.bridgeRules.maxLengthCm = 41;
    expect(validateBridge({ ...design, profileSnapshot: override }).items.find((item) => item.id === "length")?.severity).toBe("error");
  });

  it("C. prevents a 31st physical skewer when the limit is 30", () => {
    let sticks = createStickInventory(OFFICIAL_2026_PROFILE);
    for (let index = 0; index < 30; index += 1) {
      const result = consumeStickSegment(sticks, `member-${index}`, 45, 0, "new");
      expect(result.ok).toBe(true);
      sticks = result.sticks;
    }
    expect(consumeStickSegment(sticks, "member-31", 1, 0, "new").ok).toBe(false);
  });

  it("D. keeps an offcut reusable after cutting a physical stick", () => {
    let sticks = createStickInventory(OFFICIAL_2026_PROFILE);
    const first = consumeStickSegment(sticks, "member-a", 17, 0, "auto");
    expect(first.ok).toBe(true);
    sticks = first.sticks;
    expect(sticks[0].remainingSegments[0].lengthCm).toBe(28);
    const second = consumeStickSegment(sticks, "member-b", 20, 0, "offcut");
    expect(second.ok).toBe(true);
    expect(second.sourceStickId).toBe("stick-01");
    expect(second.sticks[0].remainingSegments[0].lengthCm).toBe(8);
  });

  it("E. rejects base binding member number 8 in Competition Mode", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "competition");
    for (let index = 0; index < 7; index += 1) {
      const result = addMember(
        design,
        { x: -18 + index * 5, y: 0, z: -4 },
        { x: -18 + index * 5, y: 0, z: 4 },
        "base",
        "baseBinding",
      );
      expect(result.ok).toBe(true);
      design = result.design;
    }
    const eighth = addMember(design, { x: 18, y: 0, z: -4 }, { x: 18, y: 0, z: 4 }, "base", "baseBinding");
    expect(eighth.ok).toBe(false);
    expect(eighth.reason).toContain("maksimum 7");
  });

  it("F. fails validation when overlap exceeds the configured 50 percent", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: -20, y: 12, z: -5 }, { x: 10, y: 12, z: -5 }, "left").design;
    design = addMember(design, { x: -15, y: 12, z: -5 }, { x: 15, y: 12, z: -5 }, "left").design;
    expect(validateBridge(design).items.find((item) => item.id === "overlap")?.severity).toBe("error");
  });

  it("G. prevents glue inventory from exceeding 60 cm", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: -5, y: 8, z: -4 }, { x: 0, y: 8, z: -4 }, "left").design;
    design = addMember(design, { x: 0, y: 8, z: -4 }, { x: 5, y: 8, z: -4 }, "left").design;
    const joint = design.joints.find((item) => item.connectedMemberIds.length === 2);
    expect(joint).toBeTruthy();
    const full = applyGlue(design, joint!.id, 60);
    expect(full.ok).toBe(true);
    expect(applyGlue(full.design, joint!.id, 0.1).ok).toBe(false);
  });

  it("H. adds calibrated glue use to bridge mass", () => {
    const profile = cloneProfile(OFFICIAL_2026_PROFILE);
    profile.materialCalibration.averageSkewerMassGram = 3.2;
    profile.materialCalibration.glueMassPerCmGram = 0.2;
    const consumed = consumeStickSegment(createStickInventory(profile), "member-a", 17, 0, "auto");
    const dry = calculateBridgeMass(consumed.sticks, 0, profile);
    const glued = calculateBridgeMass(consumed.sticks, 1, profile);
    expect(glued.massGram! - dry.massGram!).toBeCloseTo(0.2, 2);
    expect(glued.estimated).toBe(false);
  });

  it("I. detects a member crossing a required clearance volume", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: -10, y: 2.5, z: 0 }, { x: 10, y: 2.5, z: 0 }, "cross").design;
    const clearance = validateBridge(design).items.find((item) => item.id === "clearance");
    expect(clearance?.severity).toBe("error");
  });

  it("J. increments the load by 5 kg from the default profile", () => {
    expect(getNextLoadKg(15, OFFICIAL_2026_PROFILE)).toBe(20);
  });

  it("K. completes a hold cycle only after 10 seconds", () => {
    expect(isHoldCycleComplete(9.9, OFFICIAL_2026_PROFILE)).toBe(false);
    expect(isHoldCycleComplete(10, OFFICIAL_2026_PROFILE)).toBe(true);
  });

  it("L. scores 95 kg completed plus 3.5 points for failure on second 7", () => {
    expect(calculateTestingScore(95, 7, OFFICIAL_2026_PROFILE)).toBe(98.5);
  });

  it("M. calculates efficiency 90 / 165 g × 100 as 54.55", () => {
    expect(calculateEfficiency(90, 165)).toBe(54.55);
  });

  it("N. changes simulator behaviour through profile override without code changes", () => {
    const profile = cloneProfile(OFFICIAL_2026_PROFILE);
    profile.loadTestRules.incrementKg = 2.5;
    profile.loadTestRules.holdDurationSeconds = 6;
    expect(getNextLoadKg(10, profile)).toBe(12.5);
    expect(isHoldCycleComplete(6, profile)).toBe(true);
  });

  it("keeps the guided starter bridge structurally stable for its first load stage", () => {
    const design = createStarterDesign(cloneProfile(OFFICIAL_2026_PROFILE));
    const report = validateBridge(design);
    const clearance = report.items.find((item) => item.id === "clearance");
    expect(clearance?.severity, JSON.stringify(clearance)).toBe("pass");
    expect(report.valid, JSON.stringify(report.items.filter((item) => item.severity === "error"))).toBe(true);
    const analysis = analyseBridge(design, 5);
    expect(analysis.stable).toBe(true);
    expect(analysis.firstFailure, JSON.stringify(analysis.firstFailure)).toBeNull();
  });
});
