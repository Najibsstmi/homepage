import type { CompetitionProfile, TestResult } from "./types";

export function getTimeScore(failureTimeSeconds: number | null, profile: CompetitionProfile) {
  if (failureTimeSeconds === null || failureTimeSeconds <= 0) return 0;
  const rounded = profile.loadTestRules.failureTimeRounding === "nearest"
    ? Math.round(failureTimeSeconds)
    : Math.floor(failureTimeSeconds);
  const entry = [...profile.loadTestRules.timeScoreTable]
    .sort((a, b) => a.second - b.second)
    .filter((item) => item.second <= rounded)
    .at(-1);
  return entry?.score ?? 0;
}

export function calculateTestingScore(
  maximumCompletedLoadKg: number,
  failureTimeSeconds: number | null,
  profile: CompetitionProfile,
) {
  return Math.round((maximumCompletedLoadKg + getTimeScore(failureTimeSeconds, profile)) * 100) / 100;
}

export function calculateEfficiency(testingScore: number, bridgeMassGram: number | null) {
  if (bridgeMassGram === null || bridgeMassGram <= 0) return null;
  return Math.round(((testingScore / bridgeMassGram) * 100) * 100) / 100;
}

export function createTestResult(input: {
  maximumCompletedLoadKg: number;
  failedStageLoadKg: number | null;
  failureTimeSeconds: number | null;
  bridgeMassGram: number | null;
  firstFailure: TestResult["firstFailure"];
  estimate: boolean;
  profile: CompetitionProfile;
}): TestResult {
  const timeScore = getTimeScore(input.failureTimeSeconds, input.profile);
  const testingScore = calculateTestingScore(input.maximumCompletedLoadKg, input.failureTimeSeconds, input.profile);
  return {
    maximumCompletedLoadKg: input.maximumCompletedLoadKg,
    failedStageLoadKg: input.failedStageLoadKg,
    failureTimeSeconds: input.failureTimeSeconds,
    timeScore,
    testingScore,
    bridgeMassGram: input.bridgeMassGram,
    efficiency: calculateEfficiency(testingScore, input.bridgeMassGram),
    firstFailure: input.firstFailure,
    estimate: input.estimate,
  };
}
