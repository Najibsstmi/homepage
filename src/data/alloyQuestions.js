export const alloyMaterials = {
  pure: {
    id: "pure",
    label: "Logam tulen",
    shortLabel: "Logam tulen",
    baseDepth: 6,
    depthAnswer: "Dalam",
    hardnessAnswer: "Kurang keras",
    inference:
      "Logam tulen menghasilkan lekukan lebih dalam kerana lapisan atom yang sama saiz mudah menggelongsor.",
  },
  alloy: {
    id: "alloy",
    label: "Aloi",
    shortLabel: "Aloi",
    baseDepth: 2.5,
    depthAnswer: "Cetek",
    hardnessAnswer: "Lebih keras",
    inference:
      "Aloi menghasilkan lekukan lebih cetek kerana atom berlainan saiz menghalang lapisan atom daripada menggelongsor.",
  },
};

export const dropHeights = {
  low: { label: "Rendah", factor: 0.82 },
  medium: { label: "Sederhana", factor: 1 },
  high: { label: "Tinggi", factor: 1.18 },
};

export const alloyObservationRows = Object.values(alloyMaterials);

export function getIndentDepth(materialId, dropHeight) {
  const material = alloyMaterials[materialId];
  const height = dropHeights[dropHeight] || dropHeights.medium;
  return material ? material.baseDepth * height.factor : 0;
}

export function checkAlloyReflection(answer, concept) {
  const text = answer.toLowerCase();

  if (concept === "deeper") {
    return text.includes("logam") && (text.includes("tulen") || text.includes("pure"));
  }

  if (concept === "harder") {
    return text.includes("aloi");
  }

  if (concept === "atomic") {
    return (
      text.includes("atom") &&
      (text.includes("berlainan") || text.includes("saiz")) &&
      (text.includes("gelongsor") || text.includes("menggelongsor") || text.includes("lapisan"))
    );
  }

  if (concept === "relationship") {
    return (
      (text.includes("cetek") || text.includes("kurang")) &&
      (text.includes("keras") || text.includes("kekerasan")) &&
      (text.includes("dalam") || text.includes("lekukan"))
    );
  }

  return false;
}
