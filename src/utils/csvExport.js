const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function downloadPulseCsv(result, experimentRows = []) {
  const rows = [
    ["EduSim Pulse Detector"],
    ["Tarikh", result?.date ?? ""],
    ["BPM", result?.bpm ?? ""],
    ["Kualiti Isyarat", result?.quality ?? ""],
    ["Tempoh (s)", result?.duration ?? ""],
    [],
    ["Keadaan Eksperimen", "Kadar Denyutan Nadi (BPM)"],
    ...experimentRows.map((row) => [row.label, row.bpm ?? ""]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `edusim-nadi-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
