import { describe, expect, it } from "vitest";
import {
  classifyMatter,
  type AtomBond,
  type AtomNode,
} from "./ClassificationEngine";

function buildStraightChainAlkane(carbonCount: number) {
  const atoms: AtomNode[] = [];
  const bonds: AtomBond[] = [];

  for (let carbonIndex = 0; carbonIndex < carbonCount; carbonIndex += 1) {
    atoms.push({
      id: `c-${carbonIndex + 1}`,
      element: "C",
      x: carbonIndex * 10,
      y: 0,
    });

    if (carbonIndex > 0) {
      bonds.push({
        id: `cc-${carbonIndex}`,
        from: `c-${carbonIndex}`,
        to: `c-${carbonIndex + 1}`,
        kind: "covalent",
      });
    }
  }

  let hydrogenIndex = 0;
  for (let carbonIndex = 0; carbonIndex < carbonCount; carbonIndex += 1) {
    const hydrogenCount = carbonCount === 1 || carbonIndex === 0 || carbonIndex === carbonCount - 1 ? 3 : 2;
    const normalizedHydrogenCount = carbonCount === 1 ? 4 : hydrogenCount;

    for (let localIndex = 0; localIndex < normalizedHydrogenCount; localIndex += 1) {
      hydrogenIndex += 1;
      atoms.push({
        id: `h-${hydrogenIndex}`,
        element: "H",
        x: carbonIndex * 10,
        y: localIndex + 1,
      });
      bonds.push({
        id: `ch-${hydrogenIndex}`,
        from: `c-${carbonIndex + 1}`,
        to: `h-${hydrogenIndex}`,
        kind: "covalent",
      });
    }
  }

  return { atoms, bonds };
}

describe("alkane recognition", () => {
  const alkanes = [
    [1, "CH4", "Metana"],
    [2, "C2H6", "Etana"],
    [3, "C3H8", "Propana"],
    [4, "C4H10", "Butana"],
    [5, "C5H12", "Pentana"],
    [6, "C6H14", "Heksana"],
    [7, "C7H16", "Heptana"],
    [8, "C8H18", "Oktana"],
  ] as const;

  it.each(alkanes)("recognizes the C%s straight-chain alkane as %s", (carbonCount, formula, name) => {
    const { atoms, bonds } = buildStraightChainAlkane(carbonCount);
    const analysis = classifyMatter(atoms, bonds);

    expect(analysis.formula).toBe(formula);
    expect(analysis.name).toBe(name);
    expect(analysis.category).toBe("SEBATIAN MOLEKUL");
    expect(analysis.isStable).toBe(true);
  });

  it("does not name an incomplete propane structure as propane", () => {
    const { atoms, bonds } = buildStraightChainAlkane(3);
    const analysis = classifyMatter(atoms, bonds.slice(0, -1));

    expect(analysis.name).toBe("Campuran");
    expect(analysis.category).toBe("CAMPURAN");
  });
});
