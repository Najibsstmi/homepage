export type Vector3Data = { x: number; y: number; z: number };

export type BuildPlane = "left" | "right" | "base" | "cross";
export type BuildTool = "select" | "add" | "glue" | "move" | "delete" | "measure";
export type MemberRole = "truss" | "baseLongitudinal" | "baseBinding" | "crossBracing";
export type MemberSide = "left" | "right" | "base" | "cross";
export type MemberState = "normal" | "warning" | "failed";
export type JointState = "unglued" | "glued" | "failed";
export type CompetitionMode = "competition" | "practice";

export interface BridgeNode {
  id: string;
  displayNumber?: number;
  position: Vector3Data;
}

export interface BridgeMember {
  id: string;
  displayNumber?: number;
  /** Analytical spans of one uncut physical piece share this identity. */
  physicalPieceId?: string;
  nodeA: string;
  nodeB: string;
  sourceStickId: string;
  sourceSegmentId: string;
  lengthCm: number;
  role: MemberRole;
  side: MemberSide;
  state: MemberState;
}

export interface GlueCurvePoint {
  glueCm: number;
  failureForceN: number;
}

export interface BridgeJoint {
  id: string;
  displayNumber?: number;
  nodeId: string;
  connectedMemberIds: string[];
  glueUsedCm: number;
  glueMassGram: number | null;
  state: JointState;
}

export interface StickUsage {
  memberId: string;
  sourceSegmentId: string;
  lengthCm: number;
  cutWasteCm: number;
}

export interface PhysicalStick {
  id: string;
  originalLengthCm: number;
  remainingSegments: Array<{ id: string; lengthCm: number }>;
  usedSegments: StickUsage[];
}

export interface RestrictedBoxZone {
  id: string;
  kind: "box";
  label: string;
  centre: Vector3Data;
  size: Vector3Data;
  restriction: "clearance" | "noGlue";
}

export interface RestrictedCylinderZone {
  id: string;
  kind: "cylinder";
  label: string;
  axis: "x" | "y" | "z";
  centre: Vector3Data;
  lengthCm: number;
  diameterCm: number;
  restriction: "clearance" | "noGlue";
}

export type RestrictedZone = RestrictedBoxZone | RestrictedCylinderZone;

export interface TimeScoreEntry {
  second: number;
  score: number;
}

export interface CompetitionProfile {
  id: string;
  name: string;
  year: number | null;
  officialBaseId: string | null;
  modified: boolean;
  bridgeRules: {
    minLengthCm: number;
    maxLengthCm: number;
    minWidthCm: number;
    maxWidthCm: number;
    maxHeightCm: number;
    centralClearanceWidthCm: number;
    centralClearanceHeightCm: number;
    pipeClearanceDiameterCm: number;
    maxBaseLongitudinalSticks: number;
    maxBaseBindingSticks: number;
    maxBaseLayers: number;
    maxOverlapRatio: number;
  };
  materialRules: {
    skewerCount: number;
    skewerLengthCm: number;
    skewerDiameterCm: number;
    glueRefillCount: number;
    glueRefillLengthCm: number;
    cutWasteCm: number;
  };
  loadTestRules: {
    incrementKg: number;
    holdDurationSeconds: number;
    maximumTestLoadKg: number | null;
    supportSpanCm: number;
    loadingZone: { centreXcm: number; widthCm: number; lengthCm: number };
    timeScoreTable: TimeScoreEntry[];
    failureTimeRounding: "floor" | "nearest";
  };
  materialCalibration: {
    averageSkewerMassGram: number | null;
    glueMassPerCmGram: number | null;
    tensileStrengthN: number | null;
    compressionStrengthN: number | null;
    youngModulusMPa: number | null;
    jointCalibration: GlueCurvePoint[];
  };
  restrictedZones: RestrictedZone[];
}

export interface BridgeDesign {
  id: string;
  name: string;
  profileId: string;
  profileSnapshot: CompetitionProfile;
  mode: CompetitionMode;
  createdAt: string;
  updatedAt: string;
  nodes: BridgeNode[];
  members: BridgeMember[];
  joints: BridgeJoint[];
  sticks: PhysicalStick[];
  selectedInventoryMode: "auto" | "new" | "offcut";
}

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "member"; id: string }
  | { kind: "joint"; id: string }
  | null;

export interface ValidationItem {
  id: string;
  severity: "pass" | "warning" | "error";
  label: string;
  detail: string;
  relatedIds?: string[];
}

export interface ValidationReport {
  valid: boolean;
  dimensions: { lengthCm: number; widthCm: number; heightCm: number };
  items: ValidationItem[];
}

export interface MemberAnalysis {
  memberId: string;
  forceN: number;
  stressMPa: number;
  mode: "tension" | "compression" | "neutral";
  utilization: number;
  bucklingCapacityN: number | null;
  status: "safe" | "warning" | "failed";
}

export interface JointAnalysis {
  jointId: string;
  resultantForceN: number;
  capacityN: number;
  utilization: number;
  status: "safe" | "warning" | "failed";
}

export interface StructuralResult {
  stable: boolean;
  estimate: boolean;
  message: string;
  loadKg: number;
  displacements: Record<string, Vector3Data>;
  members: MemberAnalysis[];
  joints: JointAnalysis[];
  firstFailure:
    | { kind: "member" | "joint" | "global"; id: string; mode: string; utilization: number }
    | null;
  loadContactNodeIds: string[];
}

export interface TestResult {
  maximumCompletedLoadKg: number;
  failedStageLoadKg: number | null;
  failureTimeSeconds: number | null;
  timeScore: number;
  testingScore: number;
  bridgeMassGram: number | null;
  efficiency: number | null;
  firstFailure: StructuralResult["firstFailure"];
  estimate: boolean;
}
