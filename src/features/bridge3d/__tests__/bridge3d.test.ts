import { describe, expect, it } from "vitest";
import { calculateBridgeMass, consumeStickSegment, createStickInventory } from "../inventory";
import { getNextLoadKg, isHoldCycleComplete } from "../loadTest";
import { addMember, applyGlue, createEmptyDesign, createStarterDesign } from "../model";
import {
  cloneProfile,
  getEffectiveClearanceZones,
  OFFICIAL_2026_PROFILE,
  OFFICIAL_PIPE_CLEARANCE_ID,
  OFFICIAL_PLATE_CLEARANCE_ID,
} from "../profile";
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

  it("I. detects a member crossing the testing-plate clearance", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: -10, y: 2.5, z: 0 }, { x: 10, y: 2.5, z: 0 }, "cross").design;
    const clearance = validateBridge(design).items.find((item) => item.id === "plate-clearance");
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
    const plateClearance = report.items.find((item) => item.id === "plate-clearance");
    const pipeClearance = report.items.find((item) => item.id === "pipe-clearance");
    expect(plateClearance?.severity, JSON.stringify(plateClearance)).toBe("pass");
    expect(pipeClearance?.severity, JSON.stringify(pipeClearance)).toBe("pass");
    expect(report.valid, JSON.stringify(report.items.filter((item) => item.severity === "error"))).toBe(true);
    const analysis = analyseBridge(design, 5);
    expect(analysis.stable).toBe(true);
    expect(analysis.firstFailure, JSON.stringify(analysis.firstFailure)).toBeNull();
  });
});

describe("Bridge Building 3D official clearance geometry", () => {
  const zoneById = (profile: typeof OFFICIAL_2026_PROFILE, id: string) =>
    getEffectiveClearanceZones(profile).find((zone) => zone.id === id);
  const item = (design: ReturnType<typeof createEmptyDesign>, id: string) =>
    validateBridge(design).items.find((entry) => entry.id === id);

  it("1. uses a default pipe diameter of 5.5 cm", () => {
    expect(OFFICIAL_2026_PROFILE.bridgeRules.pipeClearanceDiameterCm).toBe(5.5);
    const pipe = zoneById(OFFICIAL_2026_PROFILE, OFFICIAL_PIPE_CLEARANCE_ID);
    expect(pipe?.kind).toBe("cylinder");
    if (pipe?.kind === "cylinder") expect(pipe.diameterCm).toBe(5.5);
  });

  it("2. derives a 2.75 cm pipe radius", () => {
    const pipe = zoneById(OFFICIAL_2026_PROFILE, OFFICIAL_PIPE_CLEARANCE_ID);
    expect(pipe?.kind).toBe("cylinder");
    if (pipe?.kind === "cylinder") expect(pipe.diameterCm / 2).toBe(2.75);
  });

  it("3. derives positive pipe centre Y from skewer radius plus pipe radius", () => {
    const pipe = zoneById(OFFICIAL_2026_PROFILE, OFFICIAL_PIPE_CLEARANCE_ID);
    const expected = OFFICIAL_2026_PROFILE.materialRules.skewerDiameterCm / 2
      + OFFICIAL_2026_PROFILE.bridgeRules.pipeClearanceDiameterCm / 2;
    expect(pipe?.centre.y).toBe(expected);
    expect(pipe?.centre.y).toBe(2.95);
  });

  it("4. keeps the pipe above the base with its bottom tangent to the skewer surface", () => {
    const pipe = zoneById(OFFICIAL_2026_PROFILE, OFFICIAL_PIPE_CLEARANCE_ID);
    expect(pipe?.kind).toBe("cylinder");
    if (pipe?.kind === "cylinder") {
      const bottom = pipe.centre.y - pipe.diameterCm / 2;
      expect(bottom).toBeCloseTo(OFFICIAL_2026_PROFILE.materialRules.skewerDiameterCm / 2, 8);
      expect(bottom).toBeGreaterThan(0);
    }
  });

  it("5. immediately applies a pipe diameter override to geometry and validation", () => {
    const baseProfile = cloneProfile(OFFICIAL_2026_PROFILE);
    let design = createEmptyDesign(baseProfile, "practice");
    design = addMember(design, { x: 10, y: 6, z: 0 }, { x: 15, y: 6, z: 0 }, "cross").design;
    expect(item(design, "pipe-clearance")?.severity).toBe("pass");

    const override = cloneProfile(baseProfile);
    override.bridgeRules.pipeClearanceDiameterCm = 6;
    const pipe = zoneById(override, OFFICIAL_PIPE_CLEARANCE_ID);
    expect(pipe?.kind).toBe("cylinder");
    if (pipe?.kind === "cylinder") {
      expect(pipe.diameterCm).toBe(6);
      expect(pipe.centre.y).toBe(3.2);
    }
    design = { ...design, profileSnapshot: override };
    expect(item(design, "pipe-clearance")?.severity).toBe("error");
  });

  it("6. immediately applies central width and height overrides to geometry and validation", () => {
    const baseProfile = cloneProfile(OFFICIAL_2026_PROFILE);
    let design = createEmptyDesign(baseProfile, "practice");
    design = addMember(design, { x: 0, y: 6, z: -1 }, { x: 0, y: 6, z: 1 }, "cross").design;
    expect(item(design, "plate-clearance")?.severity).toBe("pass");

    const override = cloneProfile(baseProfile);
    override.bridgeRules.centralClearanceWidthCm = 6;
    override.bridgeRules.centralClearanceHeightCm = 7;
    const plate = zoneById(override, OFFICIAL_PLATE_CLEARANCE_ID);
    expect(plate?.kind).toBe("box");
    if (plate?.kind === "box") {
      expect(plate.size).toEqual({ x: 6, y: 7, z: 6 });
      expect(plate.centre.y).toBe(3.5);
    }
    design = { ...design, profileSnapshot: override };
    expect(item(design, "plate-clearance")?.severity).toBe("error");
  });

  it("7. ignores stale stored official zones so no second diameter source survives", () => {
    const profile = cloneProfile(OFFICIAL_2026_PROFILE);
    profile.bridgeRules.pipeClearanceDiameterCm = 6;
    profile.restrictedZones.push({
      id: OFFICIAL_PIPE_CLEARANCE_ID,
      kind: "cylinder",
      label: "stale",
      axis: "x",
      centre: { x: 0, y: -99, z: 0 },
      lengthCm: 1,
      diameterCm: 99,
      restriction: "clearance",
    });
    const officialPipes = getEffectiveClearanceZones(profile)
      .filter((zone) => zone.id === OFFICIAL_PIPE_CLEARANCE_ID);
    expect(officialPipes).toHaveLength(1);
    expect(officialPipes[0].kind).toBe("cylinder");
    if (officialPipes[0].kind === "cylinder") expect(officialPipes[0].diameterCm).toBe(6);
  });

  it("8. fails plate clearance when a physical skewer body intrudes", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: -1, y: 2.5, z: 2.6 }, { x: 1, y: 2.5, z: 2.6 }, "cross").design;
    expect(item(design, "plate-clearance")?.severity).toBe("error");
  });

  it("9. fails pipe clearance for a member in the longitudinal passage", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: 10, y: 2.95, z: 0 }, { x: 15, y: 2.95, z: 0 }, "cross").design;
    expect(item(design, "pipe-clearance")?.severity).toBe("error");
    expect(item(design, "plate-clearance")?.severity).toBe("pass");
  });

  it("10. passes both checks when a member is outside both volumes", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: 10, y: 8, z: 4 }, { x: 15, y: 8, z: 4 }, "cross").design;
    expect(item(design, "plate-clearance")?.severity).toBe("pass");
    expect(item(design, "pipe-clearance")?.severity).toBe("pass");
  });

  it("allows a base member that is exactly tangent to the pipe guide", () => {
    let design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design = addMember(design, { x: 10, y: 0, z: -4 }, { x: 10, y: 0, z: 4 }, "base", "baseBinding").design;
    expect(item(design, "pipe-clearance")?.severity).toBe("pass");
  });

  it("11. keeps the Warren starter clear of both official volumes", () => {
    const design = createStarterDesign(cloneProfile(OFFICIAL_2026_PROFILE));
    expect(item(design, "plate-clearance")?.severity).toBe("pass");
    expect(item(design, "pipe-clearance")?.severity).toBe("pass");
  });

  it("12. never adds clearance guides to bridge mass", () => {
    const design = createStarterDesign(cloneProfile(OFFICIAL_2026_PROFILE));
    const glueUsed = design.joints.reduce((sum, joint) => sum + joint.glueUsedCm, 0);
    const before = calculateBridgeMass(design.sticks, glueUsed, design.profileSnapshot);
    getEffectiveClearanceZones(design.profileSnapshot);
    const after = calculateBridgeMass(design.sticks, glueUsed, design.profileSnapshot);
    expect(after).toEqual(before);
  });

  it("flags applied glue when its physical sphere obstructs a clearance volume", () => {
    const design = createEmptyDesign(cloneProfile(OFFICIAL_2026_PROFILE), "practice");
    design.nodes.push({ id: "glue-node", position: { x: 0, y: 2.5, z: 0 } });
    design.joints.push({
      id: "glue-joint",
      nodeId: "glue-node",
      connectedMemberIds: [],
      glueUsedCm: 0.5,
      glueMassGram: null,
      state: "glued",
    });
    const plate = item(design, "plate-clearance");
    expect(plate?.severity).toBe("error");
    expect(plate?.relatedIds).toContain("glue-joint");
  });
});
