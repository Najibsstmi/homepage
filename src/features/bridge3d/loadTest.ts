import type { CompetitionProfile } from "./types";

export function getNextLoadKg(completedLoadKg: number, profile: CompetitionProfile) {
  const candidate = completedLoadKg + profile.loadTestRules.incrementKg;
  const maximum = profile.loadTestRules.maximumTestLoadKg;
  return maximum === null ? candidate : Math.min(candidate, maximum);
}

export function isHoldCycleComplete(elapsedSeconds: number, profile: CompetitionProfile) {
  return elapsedSeconds + 1e-9 >= profile.loadTestRules.holdDurationSeconds;
}

export function hasReachedMaximumLoad(completedLoadKg: number, profile: CompetitionProfile) {
  const maximum = profile.loadTestRules.maximumTestLoadKg;
  return maximum !== null && completedLoadKg >= maximum;
}
