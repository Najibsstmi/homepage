export type ElementSymbol = "H" | "O" | "C" | "N" | "Na" | "Cl";

export type ElementDefinition = {
  symbol: ElementSymbol;
  name: string;
  valency: number;
  family: "metal" | "nonmetal";
  colorStart: string;
  colorEnd: string;
};

export type MatterCategory =
  | "ATOM"
  | "UNSUR"
  | "MOLEKUL UNSUR"
  | "SEBATIAN MOLEKUL"
  | "SEBATIAN IONIK"
  | "ION"
  | "SEBATIAN MOLEKUL TIDAK DIKENALI"
  | "CAMPURAN"
  | "BELUM DIBINA";

export type KnownCompound = {
  formula: string;
  name: string;
  category: MatterCategory;
  typeLabel: string;
  expectedBonds: number;
  composition: Partial<Record<ElementSymbol, number>>;
  description: string;
};

export type AtomChallenge = {
  id: string;
  title: string;
  targetFormula: string;
  targetCategory: MatterCategory;
  hint: string;
};

export type AtomQuizQuestion = {
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};

export const ATOM_ELEMENTS: Record<ElementSymbol, ElementDefinition> = {
  H: {
    symbol: "H",
    name: "Hidrogen",
    valency: 1,
    family: "nonmetal",
    colorStart: "#ff6b6b",
    colorEnd: "#dc2626",
  },
  O: {
    symbol: "O",
    name: "Oksigen",
    valency: 2,
    family: "nonmetal",
    colorStart: "#2dd4bf",
    colorEnd: "#0f766e",
  },
  C: {
    symbol: "C",
    name: "Karbon",
    valency: 4,
    family: "nonmetal",
    colorStart: "#38bdf8",
    colorEnd: "#0369a1",
  },
  N: {
    symbol: "N",
    name: "Nitrogen",
    valency: 3,
    family: "nonmetal",
    colorStart: "#a7f3d0",
    colorEnd: "#059669",
  },
  Na: {
    symbol: "Na",
    name: "Natrium",
    valency: 1,
    family: "metal",
    colorStart: "#fbbf24",
    colorEnd: "#f97316",
  },
  Cl: {
    symbol: "Cl",
    name: "Klorin",
    valency: 1,
    family: "nonmetal",
    colorStart: "#22d3ee",
    colorEnd: "#0891b2",
  },
};

export const FORMULA_ORDER: ElementSymbol[] = ["C", "H", "N", "O", "Na", "Cl"];

export const KNOWN_COMPOUNDS: KnownCompound[] = [
  {
    formula: "H2",
    name: "Molekul hidrogen",
    category: "MOLEKUL UNSUR",
    typeLabel: "Molekul unsur",
    expectedBonds: 1,
    composition: { H: 2 },
    description: "Dua atom hidrogen yang sama berikatan membentuk molekul unsur.",
  },
  {
    formula: "O2",
    name: "Molekul oksigen",
    category: "MOLEKUL UNSUR",
    typeLabel: "Molekul unsur",
    expectedBonds: 1,
    composition: { O: 2 },
    description: "Dua atom oksigen yang sama berikatan membentuk molekul unsur.",
  },
  {
    formula: "N2",
    name: "Molekul nitrogen",
    category: "MOLEKUL UNSUR",
    typeLabel: "Molekul unsur",
    expectedBonds: 1,
    composition: { N: 2 },
    description: "Dua atom nitrogen yang sama berikatan membentuk molekul unsur.",
  },
  {
    formula: "Cl2",
    name: "Molekul klorin",
    category: "MOLEKUL UNSUR",
    typeLabel: "Molekul unsur",
    expectedBonds: 1,
    composition: { Cl: 2 },
    description: "Dua atom klorin yang sama berikatan membentuk molekul unsur.",
  },
  {
    formula: "H2O",
    name: "Air",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Sebatian kovalen diskrit",
    expectedBonds: 2,
    composition: { H: 2, O: 1 },
    description: "Mengandungi atom hidrogen dan oksigen yang berikatan secara kimia.",
  },
  {
    formula: "CO2",
    name: "Karbon dioksida",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Sebatian kovalen diskrit",
    expectedBonds: 2,
    composition: { C: 1, O: 2 },
    description: "Mengandungi atom karbon dan oksigen yang membentuk molekul sebatian.",
  },
  {
    formula: "NH3",
    name: "Ammonia",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Molekul / sebatian molekul",
    expectedBonds: 3,
    composition: { N: 1, H: 3 },
    description: "Ammonia ialah molekul sebatian yang mengandungi satu atom nitrogen dan tiga atom hidrogen.",
  },
  {
    formula: "CH4",
    name: "Metana",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Sebatian kovalen diskrit",
    expectedBonds: 4,
    composition: { C: 1, H: 4 },
    description: "Mengandungi atom karbon dan hidrogen yang membentuk molekul sebatian.",
  },
  {
    formula: "NaCl",
    name: "Natrium klorida",
    category: "SEBATIAN IONIK",
    typeLabel: "Sebatian ionik",
    expectedBonds: 1,
    composition: { Na: 1, Cl: 1 },
    description:
      "Sebatian ionik terbentuk melalui pemindahan elektron dan daya tarikan elektrostatik antara ion positif dan ion negatif.",
  },
  {
    formula: "CO",
    name: "Karbon monoksida",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Sebatian kovalen diskrit",
    expectedBonds: 1,
    composition: { C: 1, O: 1 },
    description: "Mengandungi atom karbon dan oksigen yang berikatan secara kimia.",
  },
  {
    formula: "NO",
    name: "Nitrogen oksida",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Molekul / sebatian molekul",
    expectedBonds: 1,
    composition: { N: 1, O: 1 },
    description: "Nitrogen oksida ialah molekul sebatian yang mengandungi nitrogen dan oksigen.",
  },
  {
    formula: "NO2",
    name: "Nitrogen dioksida",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Molekul / sebatian molekul",
    expectedBonds: 2,
    composition: { N: 1, O: 2 },
    description: "Nitrogen dioksida ialah molekul sebatian yang mengandungi satu atom nitrogen dan dua atom oksigen.",
  },
  {
    formula: "NO3-",
    name: "Ion nitrat",
    category: "ION",
    typeLabel: "Ion poliatom",
    expectedBonds: 3,
    composition: { N: 1, O: 3 },
    description: "Ion nitrat ialah ion poliatom bercas negatif yang mengandungi satu atom nitrogen dan tiga atom oksigen.",
  },
  {
    formula: "NH4+",
    name: "Ion ammonium",
    category: "ION",
    typeLabel: "Ion poliatom",
    expectedBonds: 4,
    composition: { N: 1, H: 4 },
    description: "Ion ammonium ialah ion poliatom bercas positif yang mengandungi satu atom nitrogen dan empat atom hidrogen.",
  },
  {
    formula: "H2O2",
    name: "Hidrogen peroksida",
    category: "SEBATIAN MOLEKUL",
    typeLabel: "Sebatian kovalen diskrit",
    expectedBonds: 3,
    composition: { H: 2, O: 2 },
    description: "Mengandungi atom hidrogen dan oksigen yang membentuk molekul sebatian.",
  },
];

export const ATOM_CHALLENGES: AtomChallenge[] = [
  {
    id: "oxygen",
    title: "Bina molekul oksigen",
    targetFormula: "O2",
    targetCategory: "MOLEKUL UNSUR",
    hint: "Sasaran terdiri daripada dua atom oksigen yang berikatan.",
  },
  {
    id: "hydrogen",
    title: "Bina molekul hidrogen",
    targetFormula: "H2",
    targetCategory: "MOLEKUL UNSUR",
    hint: "Sasaran terdiri daripada dua atom hidrogen yang berikatan.",
  },
  {
    id: "water",
    title: "Bina sebatian air",
    targetFormula: "H2O",
    targetCategory: "SEBATIAN MOLEKUL",
    hint: "Sasaran mempunyai dua atom hidrogen dan satu atom oksigen.",
  },
  {
    id: "carbon-dioxide",
    title: "Bina karbon dioksida",
    targetFormula: "CO2",
    targetCategory: "SEBATIAN MOLEKUL",
    hint: "Sasaran mempunyai satu atom karbon dan dua atom oksigen.",
  },
  {
    id: "sodium-chloride",
    title: "Bina natrium klorida",
    targetFormula: "NaCl",
    targetCategory: "SEBATIAN IONIK",
    hint: "Sasaran ialah pasangan ion Na+ dan Cl-.",
  },
];

export const ATOM_QUIZ: AtomQuizQuestion[] = [
  {
    question: "Apakah maksud atom?",
    options: {
      A: "Zarah paling kecil bagi sesuatu unsur yang masih mengekalkan sifat unsur itu",
      B: "Campuran dua bahan yang tidak berikatan",
      C: "Sebatian yang hanya terbentuk daripada logam",
      D: "Molekul yang sentiasa bercas negatif",
    },
    answer: "A",
    explanation: "Atom ialah unit asas bagi sesuatu unsur.",
  },
  {
    question: "H2 tergolong dalam kategori apa?",
    options: {
      A: "Atom",
      B: "Molekul unsur",
      C: "Sebatian ionik",
      D: "Campuran",
    },
    answer: "B",
    explanation: "H2 mempunyai dua atom hidrogen yang sama berikatan.",
  },
  {
    question: "H2O tergolong dalam kategori apa?",
    options: {
      A: "Unsur",
      B: "Atom",
      C: "Sebatian molekul",
      D: "Campuran unsur",
    },
    answer: "C",
    explanation: "H2O mengandungi atom unsur berbeza yang berikatan secara kovalen.",
  },
  {
    question: "NaCl ialah sebatian jenis apa?",
    options: {
      A: "Sebatian ionik",
      B: "Molekul unsur",
      C: "Atom tunggal",
      D: "Campuran fizikal",
    },
    answer: "A",
    explanation: "NaCl terdiri daripada ion Na+ dan Cl- yang tertarik secara elektrostatik.",
  },
  {
    question: "Molekul unsur mengandungi berapa jenis unsur?",
    options: {
      A: "Satu jenis unsur sahaja",
      B: "Dua jenis unsur atau lebih",
      C: "Tiada unsur",
      D: "Hanya logam",
    },
    answer: "A",
    explanation: "Molekul unsur terbentuk daripada atom unsur yang sama.",
  },
  {
    question: "Jika dua atom H tidak berikatan, ia dikira sebagai apa?",
    options: {
      A: "Sebatian ionik",
      B: "Sebatian molekul",
      C: "Unsur",
      D: "Karbon dioksida",
    },
    answer: "C",
    explanation: "Atom yang sama dan tidak berikatan masih mewakili unsur yang sama.",
  },
  {
    question: "Apakah formula karbon dioksida?",
    options: {
      A: "CO",
      B: "CO2",
      C: "C2O",
      D: "NaCl",
    },
    answer: "B",
    explanation: "Karbon dioksida mempunyai satu atom karbon dan dua atom oksigen.",
  },
  {
    question: "Antara berikut yang manakah sebatian ionik?",
    options: {
      A: "H2",
      B: "O2",
      C: "NaCl",
      D: "CO2",
    },
    answer: "C",
    explanation: "NaCl terbentuk daripada ion positif natrium dan ion negatif klorida.",
  },
  {
    question: "Apakah perbezaan utama antara campuran dan sebatian?",
    options: {
      A: "Campuran mempunyai lebih daripada satu bahan tanpa ikatan kimia baharu",
      B: "Campuran sentiasa mempunyai formula tetap",
      C: "Sebatian tidak pernah mempunyai atom",
      D: "Sebatian hanya boleh wujud sebagai atom tunggal",
    },
    answer: "A",
    explanation: "Sebatian mempunyai ikatan kimia antara atom, manakala campuran mengandungi bahan berasingan.",
  },
  {
    question: "Apakah zarah yang terlibat dalam NaCl?",
    options: {
      A: "Ion Na+ dan ion Cl-",
      B: "Molekul H2 dan O2",
      C: "Atom karbon sahaja",
      D: "Elektron bebas sahaja tanpa ion",
    },
    answer: "A",
    explanation: "NaCl terdiri daripada ion natrium bercas positif dan ion klorida bercas negatif.",
  },
];
