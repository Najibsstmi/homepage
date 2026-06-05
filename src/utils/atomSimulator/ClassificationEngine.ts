import {
  ATOM_ELEMENTS,
  FORMULA_ORDER,
  KNOWN_COMPOUNDS,
  type ElementSymbol,
  type KnownCompound,
  type MatterCategory,
} from "../../data/atomSimulator/CompoundDatabase";

export type AtomNode = {
  id: string;
  element: ElementSymbol;
  x: number;
  y: number;
};

export type BondKind = "covalent" | "ionic";

export type AtomBond = {
  id: string;
  from: string;
  to: string;
  kind: BondKind;
};

export type ElementCounts = Partial<Record<ElementSymbol, number>>;

export type UnitAnalysis = {
  id: string;
  category: MatterCategory;
  formula: string;
  primaryFormula: string;
  name: string;
  typeLabel: string;
  atomCount: number;
  bondCount: number;
  uniqueElementCount: number;
  elementCounts: ElementCounts;
  atomIds: string[];
  description: string;
  tone: "neutral" | "cyan" | "green" | "amber" | "rose" | "teal";
};

export type MatterAnalysis = UnitAnalysis & {
  isEmpty: boolean;
  isMixture: boolean;
  isStable: boolean;
  instabilityReason?: string;
  unitCount: number;
  units: UnitAnalysis[];
};

export const BOND_DISTANCE_PX = 86;

export function getBondKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(":");
}

export function isIonicPair(first: ElementSymbol, second: ElementSymbol) {
  return (
    (first === "Na" && second === "Cl") ||
    (first === "Cl" && second === "Na")
  );
}

export function getBondKind(first: ElementSymbol, second: ElementSymbol): BondKind {
  return isIonicPair(first, second) ? "ionic" : "covalent";
}

export function countElements(atoms: AtomNode[]) {
  return atoms.reduce<ElementCounts>((counts, atom) => {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
    return counts;
  }, {});
}

export function getCompositionKey(counts: ElementCounts) {
  return FORMULA_ORDER
    .filter((element) => Boolean(counts[element]))
    .map((element) => `${element}${counts[element]}`)
    .join("|");
}

export function getKnownCompound(counts: ElementCounts) {
  const key = getCompositionKey(counts);
  return KNOWN_COMPOUNDS.find((compound) => getCompositionKey(compound.composition) === key);
}

export function getFormula(counts: ElementCounts) {
  const known = getKnownCompound(counts);

  if (known) {
    return known.formula;
  }

  return FORMULA_ORDER
    .filter((element) => Boolean(counts[element]))
    .map((element) => `${element}${counts[element] && counts[element] > 1 ? counts[element] : ""}`)
    .join("");
}

export function getConnectedGroups(atoms: AtomNode[], bonds: AtomBond[]) {
  const adjacency = new Map<string, string[]>();
  const atomIds = new Set(atoms.map((atom) => atom.id));

  atoms.forEach((atom) => adjacency.set(atom.id, []));
  bonds.forEach((bond) => {
    if (!atomIds.has(bond.from) || !atomIds.has(bond.to)) {
      return;
    }

    adjacency.get(bond.from)?.push(bond.to);
    adjacency.get(bond.to)?.push(bond.from);
  });

  const visited = new Set<string>();
  const groups: string[][] = [];

  atoms.forEach((atom) => {
    if (visited.has(atom.id)) {
      return;
    }

    const group: string[] = [];
    const stack = [atom.id];

    while (stack.length) {
      const current = stack.pop();

      if (!current || visited.has(current)) {
        continue;
      }

      visited.add(current);
      group.push(current);
      adjacency.get(current)?.forEach((next) => {
        if (!visited.has(next)) {
          stack.push(next);
        }
      });
    }

    groups.push(group);
  });

  return groups;
}

export function getMoleculeGroup(atomId: string, atoms: AtomNode[], bonds: AtomBond[]) {
  return getConnectedGroups(atoms, bonds).find((group) => group.includes(atomId)) || [atomId];
}

export function canFormBond(firstId: string, secondId: string, atoms: AtomNode[], bonds: AtomBond[]) {
  if (firstId === secondId || bonds.some((bond) => getBondKey(bond.from, bond.to) === getBondKey(firstId, secondId))) {
    return false;
  }

  const first = atoms.find((atom) => atom.id === firstId);
  const second = atoms.find((atom) => atom.id === secondId);

  if (!first || !second) {
    return false;
  }

  const firstDefinition = ATOM_ELEMENTS[first.element];
  const secondDefinition = ATOM_ELEMENTS[second.element];
  const involvesMetal = firstDefinition.family === "metal" || secondDefinition.family === "metal";

  if (involvesMetal && !isIonicPair(first.element, second.element)) {
    return false;
  }

  const firstBondCount = bonds.filter((bond) => bond.from === firstId || bond.to === firstId).length;
  const secondBondCount = bonds.filter((bond) => bond.from === secondId || bond.to === secondId).length;

  return firstBondCount < firstDefinition.valency && secondBondCount < secondDefinition.valency;
}

export function classifyMatter(atoms: AtomNode[], bonds: AtomBond[]): MatterAnalysis {
  if (!atoms.length) {
    return {
      id: "empty",
      category: "BELUM DIBINA",
      formula: "-",
      primaryFormula: "-",
      name: "Tiada model",
      typeLabel: "Seret atom ke papan",
      atomCount: 0,
      bondCount: 0,
      uniqueElementCount: 0,
      elementCounts: {},
      atomIds: [],
      description: "Papan binaan masih kosong.",
      tone: "neutral",
      isEmpty: true,
      isMixture: false,
      isStable: true,
      unitCount: 0,
      units: [],
    };
  }

  const instabilityReason = getStructureInstabilityReason(atoms, bonds);

  if (instabilityReason) {
    return {
      id: "unstable-structure",
      category: "STRUKTUR TIDAK STABIL",
      formula: getFormula(countElements(atoms)) || "-",
      primaryFormula: getFormula(countElements(atoms)) || "-",
      name: "Struktur tidak stabil",
      typeLabel: "Struktur tidak sah",
      atomCount: atoms.length,
      bondCount: bonds.length,
      uniqueElementCount: countUniqueElements(atoms),
      elementCounts: countElements(atoms),
      atomIds: atoms.map((atom) => atom.id),
      description: `Struktur tidak stabil. ${instabilityReason}`,
      tone: "rose",
      isEmpty: false,
      isMixture: false,
      isStable: false,
      instabilityReason,
      unitCount: 0,
      units: [],
    };
  }

  const groups = getConnectedGroups(atoms, bonds);
  const units = groups.map((group, index) => classifyUnit(`unit-${index + 1}`, group, atoms, bonds));

  if (units.length === 1) {
    return {
      ...units[0],
      isEmpty: false,
      isMixture: false,
      isStable: true,
      unitCount: 1,
      units,
    };
  }

  const allSingleUnbondedAtoms = units.every((unit) => unit.atomCount === 1 && unit.bondCount === 0);
  const allSameFormula = units.every((unit) => unit.primaryFormula === units[0].primaryFormula);

  if (allSingleUnbondedAtoms && allSameFormula) {
    const symbol = units[0].primaryFormula as ElementSymbol;
    const element = ATOM_ELEMENTS[symbol];

    return {
      id: "same-unbonded-element",
      category: "UNSUR",
      formula: element.symbol,
      primaryFormula: element.symbol,
      name: `Unsur ${element.name}`,
      typeLabel: "Atom unsur berasingan",
      atomCount: atoms.length,
      bondCount: bonds.length,
      uniqueElementCount: 1,
      elementCounts: { [symbol]: atoms.length },
      atomIds: atoms.map((atom) => atom.id),
      description: `Mengandungi atom ${element.name} yang sama dan tidak berikatan antara satu sama lain.`,
      tone: "cyan",
      isEmpty: false,
      isMixture: false,
      isStable: true,
      unitCount: atoms.length,
      units,
    };
  }

  if (allSameFormula) {
    const first = units[0];

    return {
      ...first,
      id: "same-discrete-units",
      formula: `${units.length}${first.primaryFormula}`,
      atomCount: atoms.length,
      bondCount: bonds.length,
      uniqueElementCount: countUniqueElements(atoms),
      atomIds: atoms.map((atom) => atom.id),
      description: `${units.length} unit ${first.name.toLowerCase()} yang sama. Unit diskrit yang sama bukan campuran.`,
      isEmpty: false,
      isMixture: false,
      isStable: true,
      unitCount: units.length,
      units,
    };
  }

  const formulaCounts = new Map<string, number>();
  units.forEach((unit) => {
    formulaCounts.set(unit.primaryFormula, (formulaCounts.get(unit.primaryFormula) || 0) + 1);
  });

  const mixtureFormula = Array.from(formulaCounts.entries())
    .map(([formula, count]) => (count > 1 ? `${count}${formula}` : formula))
    .join(" + ");
  const hasCompound = units.some((unit) => unit.category.includes("SEBATIAN"));
  const hasIon = units.some((unit) => unit.category === "ION");
  const hasElement = units.some((unit) => unit.category === "ATOM" || unit.category === "UNSUR" || unit.category === "MOLEKUL UNSUR");
  const mixtureLabels = [
    hasElement ? "unsur" : "",
    hasCompound ? "sebatian" : "",
    hasIon ? "ion" : "",
  ].filter(Boolean);

  return {
    id: "mixture",
    category: "CAMPURAN",
    formula: mixtureFormula,
    primaryFormula: mixtureFormula,
    name: "Campuran",
    typeLabel: mixtureLabels.length ? `Campuran ${mixtureLabels.join(" dan ")}` : "Campuran bahan",
    atomCount: atoms.length,
    bondCount: bonds.length,
    uniqueElementCount: countUniqueElements(atoms),
    elementCounts: countElements(atoms),
    atomIds: atoms.map((atom) => atom.id),
    description: "Mengandungi lebih daripada satu bahan dan tiada ikatan baharu terbentuk antara unit berasingan.",
    tone: "amber",
    isEmpty: false,
    isMixture: true,
    isStable: true,
    unitCount: units.length,
    units,
  };
}

function classifyUnit(id: string, groupIds: string[], atoms: AtomNode[], bonds: AtomBond[]): UnitAnalysis {
  const groupSet = new Set(groupIds);
  const groupAtoms = atoms.filter((atom) => groupSet.has(atom.id));
  const groupBonds = bonds.filter((bond) => groupSet.has(bond.from) && groupSet.has(bond.to));
  const elementCounts = countElements(groupAtoms);
  const uniqueElementCount = Object.keys(elementCounts).length;
  const formula = getFormula(elementCounts);

  if (groupAtoms.length === 1) {
    const atom = groupAtoms[0];
    const element = ATOM_ELEMENTS[atom.element];

    return {
      id,
      category: "ATOM",
      formula: element.symbol,
      primaryFormula: element.symbol,
      name: `Atom ${element.name}`,
      typeLabel: "Atom tunggal",
      atomCount: 1,
      bondCount: 0,
      uniqueElementCount: 1,
      elementCounts,
      atomIds: groupIds,
      description: `Satu atom ${element.name} belum berikatan dengan atom lain.`,
      tone: "neutral",
    };
  }

  if (uniqueElementCount === 1) {
    const elementSymbol = Object.keys(elementCounts)[0] as ElementSymbol;
    const element = ATOM_ELEMENTS[elementSymbol];

    if (!groupBonds.length) {
      return {
        id,
        category: "UNSUR",
        formula,
        primaryFormula: formula,
        name: `Unsur ${element.name}`,
        typeLabel: "Atom unsur berasingan",
        atomCount: groupAtoms.length,
        bondCount: 0,
        uniqueElementCount,
        elementCounts,
        atomIds: groupIds,
        description: `Semua atom ialah ${element.name} dan belum membentuk ikatan kimia.`,
        tone: "cyan",
      };
    }

    const known = getKnownCompound(elementCounts);

    return known && groupBonds.length >= known.expectedBonds
      ? fromKnownCompound(id, groupIds, elementCounts, groupAtoms.length, groupBonds.length, known)
      : {
          id,
          category: "MOLEKUL UNSUR",
          formula,
          primaryFormula: formula,
          name: `Molekul ${element.name}`,
          typeLabel: "Molekul unsur",
          atomCount: groupAtoms.length,
          bondCount: groupBonds.length,
          uniqueElementCount,
          elementCounts,
          atomIds: groupIds,
          description: `Atom ${element.name} yang sama berikatan antara satu sama lain.`,
          tone: "green",
        };
  }

  const known = getKnownCompound(elementCounts);

  if (known && known.category === "SEBATIAN IONIK") {
    return fromKnownCompound(id, groupIds, elementCounts, groupAtoms.length, groupBonds.length, known);
  }

  if (known && groupBonds.length >= known.expectedBonds) {
    return fromKnownCompound(id, groupIds, elementCounts, groupAtoms.length, groupBonds.length, known);
  }

  return {
    id,
    category: "SEBATIAN MOLEKUL TIDAK DIKENALI",
    formula,
    primaryFormula: formula,
    name: "Sebatian tidak dikenali",
    typeLabel: "Sebatian molekul belum dipadankan",
    atomCount: groupAtoms.length,
    bondCount: groupBonds.length,
    uniqueElementCount,
    elementCounts,
    atomIds: groupIds,
    description: "Susunan ikatan tidak sepadan dengan contoh sebatian biasa. Cuba susun semula atom.",
    tone: "rose",
  };
}

function fromKnownCompound(
  id: string,
  atomIds: string[],
  elementCounts: ElementCounts,
  atomCount: number,
  bondCount: number,
  compound: KnownCompound,
): UnitAnalysis {
  return {
    id,
    category: compound.category,
    formula: compound.formula,
    primaryFormula: compound.formula,
    name: compound.name,
    typeLabel: compound.typeLabel,
    atomCount,
    bondCount,
    uniqueElementCount: Object.keys(elementCounts).length,
    elementCounts,
    atomIds,
    description: compound.description,
    tone: compound.category === "SEBATIAN IONIK" || compound.category === "ION"
      ? "green"
      : compound.category === "MOLEKUL UNSUR"
        ? "cyan"
        : "green",
  };
}

function countUniqueElements(atoms: AtomNode[]) {
  return new Set(atoms.map((atom) => atom.element)).size;
}

function getStructureInstabilityReason(atoms: AtomNode[], bonds: AtomBond[]) {
  for (const atom of atoms) {
    const element = ATOM_ELEMENTS[atom.element];
    const atomBonds = bonds.filter((bond) => bond.from === atom.id || bond.to === atom.id);

    if (atom.element === "Na") {
      if (atomBonds.length > 1) {
        return "Natrium (Na) hanya dibenarkan mempunyai maksimum 1 ikatan ionik.";
      }

      if (atomBonds.some((bond) => bond.kind !== "ionic")) {
        return "Natrium (Na) mesti membentuk ikatan ionik sahaja dalam simulator ini.";
      }
    }

    if (atomBonds.length > element.valency) {
      return `${element.name} (${element.symbol}) melebihi valensi maksimum ${element.valency}.`;
    }
  }

  return "";
}
