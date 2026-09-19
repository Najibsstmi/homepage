import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Test the actual TypeScript model without adding a test-runner dependency.
const source = await readFile(new URL("../src/utils/freeFallPhysics.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const { GRAVITY, DROP_HEIGHT, TERMINAL_SPEED, fallenDistance, landingTime } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

for (const object of ["paper", "feather", "ball"]) {
  close(landingTime(true, object), Math.sqrt(2 * DROP_HEIGHT / GRAVITY));
  for (const vacuum of [false, true]) {
    const end = landingTime(vacuum, object);
    close(fallenDistance(0, vacuum, object), 0);
    close(fallenDistance(end, vacuum, object), DROP_HEIGHT);
    assert.ok(fallenDistance(end - 0.001, vacuum, object) < DROP_HEIGHT);
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const distance = fallenDistance(end * i / 100, vacuum, object);
      assert.ok(distance >= previous && distance <= DROP_HEIGHT + 1e-9);
      previous = distance;
    }
  }
  assert.ok(landingTime(false, object) > landingTime(true, object));
  const time = 0.2;
  const velocity = (fallenDistance(time + 1e-6, false, object) - fallenDistance(time, false, object)) / 1e-6;
  assert.ok(velocity > 0 && velocity < TERMINAL_SPEED[object]);
}
assert.ok(landingTime(false, "feather") > landingTime(false, "paper"));
assert.ok(landingTime(false, "paper") > landingTime(false, "ball"));
assert.equal(landingTime(true, "feather"), landingTime(true, "ball"));
for (let time = 0; time < 0.5; time += 0.01) close(fallenDistance(time, true, "feather"), fallenDistance(time, true, "ball"));
console.log("PASS: release from rest, SI free fall, drag, monotonic trajectories, landing boundary, air ordering and vacuum synchronisation.");
console.table(Object.fromEntries(["paper", "feather", "ball"].map(object => [object, { air: landingTime(false, object), vacuum: landingTime(true, object) }])));
