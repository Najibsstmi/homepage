export type RefractionMedium = "water" | "glass";
export type RaySide = -1 | 1;

export const REFRACTIVE_INDEX = {
  air: 1,
  water: 1.33,
  glass: 1.5,
} as const;

export const REFRACTION_POINT = { x: 570, y: 371 } as const;

export type RayPoint = {
  x: number;
  y: number;
};

export type RefractionGeometry = {
  lens: RayPoint;
  refractedEnd: RayPoint;
  reflectedEnd: RayPoint;
  refractedAngle: number;
  flashlightRotation: number;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function calculateRefractionAngle(
  incidenceAngle: number,
  destinationIndex: number,
  sourceIndex = REFRACTIVE_INDEX.air,
) {
  const safeIncidence = Math.min(89.9, Math.max(0, incidenceAngle));
  const sineRatio =
    (sourceIndex / destinationIndex) * Math.sin(toRadians(safeIncidence));

  return toDegrees(Math.asin(Math.min(1, Math.max(-1, sineRatio))));
}

export function getRefractionGeometry({
  incidenceAngle,
  destinationIndex,
  side,
  sourceRadius = 310,
  refractedLength = 220,
  reflectedLength = 210,
}: {
  incidenceAngle: number;
  destinationIndex: number;
  side: RaySide;
  sourceRadius?: number;
  refractedLength?: number;
  reflectedLength?: number;
}): RefractionGeometry {
  const incidenceRadians = toRadians(incidenceAngle);
  const refractedAngle = calculateRefractionAngle(
    incidenceAngle,
    destinationIndex,
  );
  const refractionRadians = toRadians(refractedAngle);

  const lens = {
    x: REFRACTION_POINT.x + side * Math.sin(incidenceRadians) * sourceRadius,
    y: REFRACTION_POINT.y - Math.cos(incidenceRadians) * sourceRadius,
  };
  const refractedEnd = {
    x:
      REFRACTION_POINT.x -
      side * Math.sin(refractionRadians) * refractedLength,
    y: REFRACTION_POINT.y + Math.cos(refractionRadians) * refractedLength,
  };
  const reflectedEnd = {
    x:
      REFRACTION_POINT.x -
      side * Math.sin(incidenceRadians) * reflectedLength,
    y: REFRACTION_POINT.y - Math.cos(incidenceRadians) * reflectedLength,
  };
  const flashlightDirection = toDegrees(
    Math.atan2(
      REFRACTION_POINT.y - lens.y,
      REFRACTION_POINT.x - lens.x,
    ),
  );

  return {
    lens,
    refractedEnd,
    reflectedEnd,
    refractedAngle,
    flashlightRotation: flashlightDirection - 13.4,
  };
}
