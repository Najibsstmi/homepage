/** Idealised school experiment near Earth's surface; SI units throughout. */
export const GRAVITY = 9.81;
export const DROP_HEIGHT = 1.2;
export type FallingObject = "paper" | "feather" | "ball";
// Effective terminal speeds model differences in mass, area and drag coefficient.
export const TERMINAL_SPEED: Record<FallingObject, number> = {
  paper: 0.65,
  feather: 0.38,
  ball: 12,
};

/** Solution of dv/dt = g(1 - v²/vt²), released from rest. */
export function fallenDistance(time: number, vacuum: boolean, object: FallingObject) {
  const t = Math.max(0, time);
  if (vacuum) return 0.5 * GRAVITY * t * t;
  const vt = TERMINAL_SPEED[object];
  const x = GRAVITY * t / vt;
  const logCosh = x + Math.log1p(Math.exp(-2 * x)) - Math.LN2;
  return (vt * vt / GRAVITY) * logCosh;
}

export function landingTime(vacuum: boolean, object: FallingObject) {
  if (vacuum) return Math.sqrt(2 * DROP_HEIGHT / GRAVITY);
  let low = 0;
  let high = DROP_HEIGHT / TERMINAL_SPEED[object] + 2;
  for (let i = 0; i < 60; i++) {
    const middle = (low + high) / 2;
    if (fallenDistance(middle, false, object) < DROP_HEIGHT) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
