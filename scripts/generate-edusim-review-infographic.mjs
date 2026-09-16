import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = path.resolve("output");
await fs.mkdir(outDir, { recursive: true });

const totalReviews = 89;
const avgRating = 4.81;
const highRatingPercent = 98.9;
const writtenReviews = 54;
const simulatorIds = 18;

const ratingData = [
  { label: "5 bintang", value: 73, color: "#16a34a" },
  { label: "4 bintang", value: 15, color: "#22c55e" },
  { label: "3 bintang", value: 1, color: "#f59e0b" },
];

const userTypes = [
  { label: "Guru", value: 58, color: "#2563eb" },
  { label: "Murid", value: 29, color: "#14b8a6" },
  { label: "Orang Awam", value: 2, color: "#f97316" },
];

const simulatorCounts = [
  { label: "Aloi / Kenali Aloi", value: 14 },
  { label: "Gerakan Linear", value: 13 },
  { label: "Atom, Molekul & Sebatian", value: 12 },
  { label: "Inersia", value: 9 },
  { label: "Elektrokimia", value: 8 },
  { label: "Tenaga Nuklear", value: 7 },
];

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function donut(cx, cy, r, width, data) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let current = -Math.PI / 2;
  return data
    .map((item) => {
      const angle = (item.value / total) * Math.PI * 2;
      const end = current + angle;
      const large = angle > Math.PI ? 1 : 0;
      const x1 = cx + Math.cos(current) * r;
      const y1 = cy + Math.sin(current) * r;
      const x2 = cx + Math.cos(end) * r;
      const y2 = cy + Math.sin(end) * r;
      current = end;
      return `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${item.color}" stroke-width="${width}" stroke-linecap="round" />`;
    })
    .join("\n");
}

function statCard(x, y, w, h, value, label, note, accent) {
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="10" height="${h}" rx="5" fill="${accent}"/>
    <text x="${x + 34}" y="${y + 58}" class="stat" fill="#0f172a">${esc(value)}</text>
    <text x="${x + 34}" y="${y + 94}" class="label">${esc(label)}</text>
    <text x="${x + 34}" y="${y + 122}" class="note">${esc(note)}</text>
  </g>`;
}

const maxSimulator = Math.max(...simulatorCounts.map((item) => item.value));
const bars = simulatorCounts
  .map((item, index) => {
    const y = 556 + index * 38;
    const barStart = 410;
    const barTotal = 320;
    const barWidth = Math.round((item.value / maxSimulator) * barTotal);
    return `
    <text x="102" y="${y + 20}" class="bar-label">${esc(item.label)}</text>
    <rect x="${barStart}" y="${y}" width="${barTotal}" height="26" rx="13" fill="#e0f2fe"/>
    <rect x="${barStart}" y="${y}" width="${barWidth}" height="26" rx="13" fill="#0ea5e9"/>
    <text x="${barStart + barWidth + 14}" y="${y + 20}" class="bar-value">${item.value}</text>`;
  })
  .join("\n");

const ratingLegend = ratingData
  .map((item, index) => {
    const y = 698 + index * 27;
    return `
    <circle cx="868" cy="${y}" r="8" fill="${item.color}"/>
    <text x="888" y="${y + 6}" class="legend">${esc(item.label)}: ${item.value}</text>`;
  })
  .join("\n");

const userLegend = userTypes
  .map((item, index) => {
    const y = 596 + index * 42;
    return `
    <circle cx="1210" cy="${y}" r="9" fill="${item.color}"/>
    <text x="1230" y="${y + 6}" class="legend">${esc(item.label)}: ${item.value}</text>`;
  })
  .join("\n");

const quotes = [
  "Simulasi ini menjadikan pembelajaran lebih interaktif dan berkesan.",
  "Simulator mudah difahami. Murid boleh tambah kefahaman.",
  "Aplikasi ini sangat membantu saya dalam memahami sains.",
];

const quoteBlocks = quotes
  .map((quote, index) => {
  const y = 910 + index * 47;
    return `
    <g>
      <circle cx="108" cy="${y - 9}" r="18" fill="#dbeafe"/>
      <text x="101" y="${y - 1}" class="quote-mark">“</text>
      <text x="144" y="${y}" class="quote">${esc(quote)}</text>
    </g>`;
  })
  .join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fbff"/>
      <stop offset="1" stop-color="#eefdf8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.11"/>
    </filter>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
      .kicker { font-size: 28px; font-weight: 700; fill: #0369a1; letter-spacing: 0; }
      .title { font-size: 70px; font-weight: 800; fill: #0f172a; letter-spacing: 0; }
      .subtitle { font-size: 30px; fill: #475569; }
      .section { font-size: 28px; font-weight: 800; fill: #0f172a; }
      .stat { font-size: 54px; font-weight: 800; }
      .label { font-size: 24px; font-weight: 700; fill: #334155; }
      .note { font-size: 20px; fill: #64748b; }
      .bar-label { font-size: 23px; font-weight: 700; fill: #334155; }
      .bar-value { font-size: 22px; font-weight: 800; fill: #075985; }
      .legend { font-size: 19px; fill: #334155; }
      .donut-number { font-size: 38px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .donut-label { font-size: 18px; fill: #64748b; text-anchor: middle; }
      .tag { font-size: 22px; font-weight: 800; fill: #0f766e; }
      .quote { font-size: 25px; font-weight: 700; fill: #1e293b; }
      .quote-mark { font-size: 32px; font-weight: 800; fill: #2563eb; }
      .source { font-size: 20px; fill: #64748b; }
    </style>
  </defs>

  <rect width="1920" height="1080" fill="url(#bg)"/>
  <circle cx="1660" cy="120" r="190" fill="#dbeafe" opacity="0.55"/>
  <circle cx="1760" cy="880" r="250" fill="#ccfbf1" opacity="0.55"/>

  <text x="92" y="95" class="kicker">DAPATAN REVIEW PENGGUNA</text>
  <text x="92" y="172" class="title">EduSim Membantu PdP Sains Lebih Interaktif</text>
  <text x="94" y="220" class="subtitle">Analisis ringkas daripada Google Sheet “REVIEW SIMULATOR” | Jun hingga Sep 2026</text>

  <g filter="url(#shadow)">
    ${statCard(92, 286, 392, 148, totalReviews, "review pengguna", "Guru, Murid dan Orang Awam", "#2563eb")}
    ${statCard(520, 286, 392, 148, avgRating.toFixed(2) + "/5", "purata rating", "rating keseluruhan sangat positif", "#16a34a")}
    ${statCard(948, 286, 392, 148, highRatingPercent + "%", "rating 4-5 bintang", "88 daripada 89 review", "#14b8a6")}
    ${statCard(1376, 286, 452, 148, simulatorIds, "simulator ada review", writtenReviews + " ulasan bertulis direkodkan", "#f97316")}
  </g>

  <g filter="url(#shadow)">
    <rect x="80" y="468" width="700" height="305" rx="26" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="102" y="526" class="section">Simulator Paling Banyak Mendapat Review</text>
    ${bars}

    <rect x="820" y="468" width="348" height="305" rx="26" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="850" y="526" class="section">Taburan Rating</text>
    ${donut(990, 622, 56, 20, ratingData)}
    <text x="990" y="618" class="donut-number">82%</text>
    <text x="990" y="644" class="donut-label">5 bintang</text>
    ${ratingLegend}

    <rect x="1198" y="468" width="630" height="305" rx="26" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="1228" y="526" class="section">Profil Pengguna Review</text>
    ${donut(1586, 633, 70, 24, userTypes)}
    <text x="1586" y="628" class="donut-number">65%</text>
    <text x="1586" y="654" class="donut-label">Guru</text>
    ${userLegend}
  </g>

  <g filter="url(#shadow)">
    <rect x="80" y="806" width="1122" height="224" rx="26" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="102" y="864" class="section">Suara Pengguna</text>
    ${quoteBlocks}

    <rect x="1232" y="806" width="596" height="224" rx="26" fill="#ecfeff" stroke="#bae6fd" stroke-width="2"/>
    <text x="1262" y="864" class="section">Tema Impak</text>
    <text x="1280" y="922" class="tag">Mudah difahami</text>
    <text x="1532" y="922" class="tag">Interaktif</text>
    <text x="1280" y="976" class="tag">Sesuai untuk PdP</text>
    <text x="1532" y="976" class="tag">Pembelajaran kendiri</text>
  </g>

  <text x="92" y="1054" class="source">Sumber: REVIEW SIMULATOR, Sheet1. Nota: “Aloi” dan “Kenali Aloi” digabungkan sebagai pengalaman simulator yang sama.</text>
</svg>`;

const svgPath = path.join(outDir, "edusim-review-data-canva.svg");
const pngPath = path.join(outDir, "edusim-review-data-canva.png");

await fs.writeFile(svgPath, svg, "utf8");
await sharp(Buffer.from(svg)).png().toFile(pngPath);

console.log(JSON.stringify({ svgPath, pngPath }, null, 2));
