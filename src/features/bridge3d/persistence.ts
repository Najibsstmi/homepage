import type { BridgeDesign } from "./types";

const DESIGN_STORAGE_KEY = "edusim-bridge3d-designs-v1";

export function loadSavedDesigns(): BridgeDesign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(DESIGN_STORAGE_KEY) ?? "[]") as BridgeDesign[];
  } catch {
    return [];
  }
}

export function saveDesign(design: BridgeDesign) {
  if (typeof window === "undefined") return;
  const designs = loadSavedDesigns();
  const payload = { ...design, updatedAt: new Date().toISOString() };
  const index = designs.findIndex((item) => item.id === design.id);
  if (index >= 0) designs[index] = payload;
  else designs.push(payload);
  window.localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designs));
}

export function deleteSavedDesign(designId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DESIGN_STORAGE_KEY,
    JSON.stringify(loadSavedDesigns().filter((design) => design.id !== designId)),
  );
}

export function exportDesign(design: BridgeDesign) {
  const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${design.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "bridge-design"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importDesign(file: File): Promise<BridgeDesign> {
  const parsed = JSON.parse(await file.text()) as BridgeDesign;
  if (!parsed.id || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.members) || !Array.isArray(parsed.sticks)) {
    throw new Error("Fail reka bentuk tidak sah.");
  }
  return parsed;
}
