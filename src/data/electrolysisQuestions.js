export const observationRows = [
  {
    id: "solid",
    material: "Pepejal plumbum(II) bromida, PbBr₂",
    expectedBulb: "Tidak menyala",
    expectedConcept: "solid",
    scheme:
      "Pepejal plumbum(II) bromida tidak dapat mengkonduksikan elektrik kerana ion-ionnya tidak bebas bergerak.",
  },
  {
    id: "molten",
    material: "Leburan plumbum(II) bromida, PbBr₂",
    expectedBulb: "Menyala",
    expectedConcept: "molten",
    scheme:
      "Leburan plumbum(II) bromida dapat mengkonduksikan elektrik kerana ion-ionnya bebas bergerak.",
  },
  {
    id: "aqueous",
    material: "Larutan akueus natrium klorida, NaCl",
    expectedBulb: "Menyala",
    expectedConcept: "aqueous",
    scheme:
      "Larutan akueus natrium klorida dapat mengkonduksikan elektrik kerana ion-ionnya bebas bergerak dalam larutan akueus.",
  },
];

export const reflectionQuestions = [
  {
    id: "solid-reflect",
    question: "Mengapa pepejal PbBr₂ tidak mengkonduksikan elektrik?",
    keywords: ["ion", "tidak bebas", "bergerak"],
    hint: "Masukkan idea tentang ion yang tidak bebas bergerak.",
  },
  {
    id: "molten-reflect",
    question: "Mengapa leburan PbBr₂ mengkonduksikan elektrik?",
    keywords: ["ion", "bebas", "bergerak"],
    hint: "Masukkan idea tentang ion bebas bergerak dalam leburan.",
  },
  {
    id: "aqueous-reflect",
    question: "Apakah zarah yang bergerak dalam larutan akueus NaCl?",
    keywords: ["ion"],
    hint: "Nyatakan ion dalam larutan, contohnya Na⁺ dan Cl⁻.",
  },
];

export function checkInferenceWithAI(studentAnswer, expectedConcept) {
  // Later this function can be connected to OpenAI API or backend endpoint.
  return checkInferenceByKeyword(studentAnswer, expectedConcept);
}

export function checkInferenceByKeyword(studentAnswer, expectedConcept) {
  const answer = studentAnswer.toLowerCase();
  const hasConduct =
    answer.includes("mengkonduksikan") ||
    answer.includes("konduksi") ||
    answer.includes("mengalirkan") ||
    answer.includes("elektrik");
  const hasIon = answer.includes("ion");
  const hasFree = answer.includes("bebas") && answer.includes("bergerak");
  const hasNotFree =
    (answer.includes("tidak bebas") ||
      answer.includes("tak bebas") ||
      answer.includes("tiada ion yang bebas") ||
      answer.includes("tidak dapat bergerak")) &&
    answer.includes("bergerak");
  const hasAqueous = answer.includes("akueus") || answer.includes("larutan");

  if (expectedConcept === "solid") {
    return hasConduct && hasIon && hasNotFree;
  }

  if (expectedConcept === "aqueous") {
    return hasConduct && hasIon && hasFree && hasAqueous;
  }

  return hasConduct && hasIon && hasFree;
}
