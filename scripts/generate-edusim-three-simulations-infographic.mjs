import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = path.resolve("output");
await fs.mkdir(outDir, { recursive: true });

const simulations = [
  {
    title: "Atom, Molekul & Sebatian",
    id: "atom-molekul-sebatian",
    reviews: 12,
    avg: 4.75,
    fiveStar: 10,
    fourStar: 1,
    threeStar: 1,
    users: { Guru: 6, Murid: 5, "Orang Awam": 1 },
    color: "#2563eb",
    light: "#dbeafe",
    quote: "Membantu murid membezakan atom, molekul dan sebatian.",
    theme: "Konsep zarah lebih konkrit",
    icon: "atom",
  },
  {
    title: "Tenaga Nuklear",
    id: "tenaga-nuklear",
    reviews: 7,
    avg: 4.71,
    fiveStar: 5,
    fourStar: 2,
    threeStar: 0,
    users: { Guru: 5, Murid: 2, "Orang Awam": 0 },
    color: "#16a34a",
    light: "#dcfce7",
    quote: "Murid lebih mudah faham aliran tenaga daripada reaktor ke elektrik.",
    theme: "Proses abstrak menjadi jelas",
    icon: "nuclear",
  },
  {
    title: "Sel Elektrokimia",
    id: "sel-kimia",
    reviews: 3,
    avg: 4.67,
    fiveStar: 2,
    fourStar: 1,
    threeStar: 0,
    users: { Guru: 1, Murid: 2, "Orang Awam": 0 },
    color: "#f97316",
    light: "#ffedd5",
    quote: "Senang dan mudah difahami.",
    theme: "Mudah digunakan dan difahami",
    icon: "cell",
  },
];

const totalReviews = simulations.reduce((sum, item) => sum + item.reviews, 0);
const totalRating = simulations.reduce((sum, item) => {
  return sum + item.fiveStar * 5 + item.fourStar * 4 + item.threeStar * 3;
}, 0);
const avgRating = totalRating / totalReviews;
const positiveReviews = simulations.reduce((sum, item) => sum + item.fiveStar + item.fourStar, 0);
const positivePercent = (positiveReviews / totalReviews) * 100;
const writtenComments = 15;

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function icon(type, x, y, color) {
  if (type === "atom") {
    return `
      <g transform="translate(${x} ${y})" stroke="${color}" stroke-width="5" fill="none" opacity="0.95">
        <ellipse cx="0" cy="0" rx="46" ry="16"/>
        <ellipse cx="0" cy="0" rx="46" ry="16" transform="rotate(60)"/>
        <ellipse cx="0" cy="0" rx="46" ry="16" transform="rotate(120)"/>
        <circle cx="0" cy="0" r="8" fill="${color}" stroke="none"/>
      </g>`;
  }
  if (type === "nuclear") {
    return `
      <g transform="translate(${x} ${y})" fill="${color}" opacity="0.95">
        <circle cx="0" cy="0" r="12"/>
        <path d="M0,-52 C20,-52 36,-39 42,-22 C26,-18 12,-14 0,-6 C-12,-14 -26,-18 -42,-22 C-36,-39 -20,-52 0,-52Z"/>
        <path d="M45,26 C35,44 17,54 -1,51 C4,35 7,21 5,7 C18,0 29,-9 40,-22 C52,-10 55,9 45,26Z"/>
        <path d="M-45,26 C-55,9 -52,-10 -40,-22 C-29,-9 -18,0 -5,7 C-7,21 -4,35 1,51 C-17,54 -35,44 -45,26Z"/>
      </g>`;
  }
  return `
    <g transform="translate(${x} ${y})" stroke="${color}" stroke-width="6" fill="none" opacity="0.95">
      <rect x="-38" y="-45" width="76" height="90" rx="16"/>
      <path d="M-18 -58 L-18 -45 M18 -58 L18 -45"/>
      <path d="M-18 -58 L18 -58"/>
      <path d="M-20 4 H20 M0 -16 V24"/>
      <circle cx="-20" cy="4" r="5" fill="${color}" stroke="none"/>
      <circle cx="20" cy="4" r="5" fill="${color}" stroke="none"/>
    </g>`;
}

function ratingBar(x, y, width, counts, color) {
  const total = counts.reduce((sum, count) => sum + count.value, 0);
  let currentX = x;
  const segments = counts
    .map((count) => {
      const segmentWidth = Math.max(0, Math.round((count.value / total) * width));
      const part = `<rect x="${currentX}" y="${y}" width="${segmentWidth}" height="18" rx="9" fill="${count.color}"/>`;
      currentX += segmentWidth;
      return part;
    })
    .join("\n");
  return `
    <rect x="${x}" y="${y}" width="${width}" height="18" rx="9" fill="#e2e8f0"/>
    ${segments}
    <text x="${x}" y="${y + 48}" class="small">5★ ${counts[0].value}   4★ ${counts[1].value}   3★ ${counts[2].value}</text>`;
}

function simulationCard(sim, x, y) {
  const guru = sim.users.Guru;
  const murid = sim.users.Murid;
  const awam = sim.users["Orang Awam"];
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="540" height="392" rx="28" fill="#ffffff" stroke="${sim.light}" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="540" height="10" rx="5" fill="${sim.color}"/>
    <circle cx="${x + 458}" cy="${y + 88}" r="62" fill="${sim.light}"/>
    ${icon(sim.icon, x + 458, y + 88, sim.color)}
    <text x="${x + 34}" y="${y + 64}" class="card-title">${esc(sim.title)}</text>
    <text x="${x + 34}" y="${y + 100}" class="id">${esc(sim.id)}</text>

    <text x="${x + 34}" y="${y + 171}" class="big">${sim.reviews}</text>
    <text x="${x + 100}" y="${y + 164}" class="metric">review</text>
    <text x="${x + 255}" y="${y + 171}" class="big">${sim.avg.toFixed(2)}</text>
    <text x="${x + 350}" y="${y + 164}" class="metric">purata rating</text>

    ${ratingBar(x + 34, y + 207, 472, [
      { value: sim.fiveStar, color: sim.color },
      { value: sim.fourStar, color: "#86efac" },
      { value: sim.threeStar, color: "#fbbf24" },
    ], sim.color)}

    <text x="${x + 34}" y="${y + 305}" class="profile">Profil: Guru ${guru}   Murid ${murid}   Orang Awam ${awam}</text>
    <text x="${x + 34}" y="${y + 346}" class="quote">“${esc(sim.quote)}”</text>
    <text x="${x + 34}" y="${y + 378}" class="theme">${esc(sim.theme)}</text>
  </g>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fbff"/>
      <stop offset="1" stop-color="#eefdf8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.10"/>
    </filter>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; letter-spacing: 0; }
      .kicker { font-size: 28px; font-weight: 800; fill: #0369a1; }
      .title { font-size: 66px; font-weight: 800; fill: #0f172a; }
      .subtitle { font-size: 30px; fill: #475569; }
      .card-title { font-size: 32px; font-weight: 800; fill: #0f172a; }
      .id { font-size: 20px; fill: #64748b; }
      .big { font-size: 56px; font-weight: 800; fill: #0f172a; }
      .metric { font-size: 23px; font-weight: 700; fill: #475569; }
      .small { font-size: 22px; font-weight: 700; fill: #334155; }
      .profile { font-size: 22px; font-weight: 700; fill: #334155; }
      .quote { font-size: 23px; font-weight: 700; fill: #1e293b; }
      .theme { font-size: 22px; font-weight: 800; fill: #0f766e; }
      .summary-value { font-size: 54px; font-weight: 800; fill: #0f172a; }
      .summary-label { font-size: 24px; font-weight: 700; fill: #334155; }
      .summary-note { font-size: 20px; fill: #64748b; }
      .source { font-size: 20px; fill: #64748b; }
    </style>
  </defs>

  <rect width="1920" height="1080" fill="url(#bg)"/>
  <circle cx="1660" cy="130" r="190" fill="#dbeafe" opacity="0.55"/>
  <circle cx="1720" cy="910" r="245" fill="#ccfbf1" opacity="0.55"/>

  <text x="92" y="95" class="kicker">DAPATAN REVIEW PENGGUNA TERPILIH</text>
  <text x="92" y="170" class="title">Tiga Simulasi EduSim Dalam Fokus</text>
  <text x="94" y="220" class="subtitle">Atom Molekul &amp; Sebatian, Tenaga Nuklear dan Sel Elektrokimia | Data REVIEW SIMULATOR</text>

  <g filter="url(#shadow)">
    <rect x="92" y="286" width="392" height="142" rx="22" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="126" y="346" class="summary-value">${totalReviews}</text>
    <text x="126" y="382" class="summary-label">review terpilih</text>
    <text x="126" y="410" class="summary-note">hanya 3 simulasi fokus</text>

    <rect x="520" y="286" width="392" height="142" rx="22" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="554" y="346" class="summary-value">${avgRating.toFixed(2)}/5</text>
    <text x="554" y="382" class="summary-label">purata rating</text>
    <text x="554" y="410" class="summary-note">gabungan tiga simulator</text>

    <rect x="948" y="286" width="392" height="142" rx="22" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="982" y="346" class="summary-value">${positivePercent.toFixed(1)}%</text>
    <text x="982" y="382" class="summary-label">rating 4-5 bintang</text>
    <text x="982" y="410" class="summary-note">${positiveReviews} daripada ${totalReviews} review</text>

    <rect x="1376" y="286" width="452" height="142" rx="22" fill="#ffffff" stroke="#dbeafe" stroke-width="2"/>
    <text x="1410" y="346" class="summary-value">${writtenComments}</text>
    <text x="1410" y="382" class="summary-label">ulasan bertulis</text>
    <text x="1410" y="410" class="summary-note">bukti kualitatif pengguna</text>
  </g>

  ${simulationCard(simulations[0], 92, 492)}
  ${simulationCard(simulations[1], 690, 492)}
  ${simulationCard(simulations[2], 1288, 492)}

  <text x="92" y="1002" class="source">Nota data: “Sel Elektrokimia” dipadankan dengan simulator_id “sel-kimia”. “Elektrokimia-elektrolisis” tidak dimasukkan dalam visual ini.</text>
  <text x="92" y="1034" class="source">Sumber: Google Sheet REVIEW SIMULATOR, Sheet1. Julat dibaca: A1:G999.</text>
</svg>`;

const svgPath = path.join(outDir, "edusim-review-3-simulasi-canva.svg");
const pngPath = path.join(outDir, "edusim-review-3-simulasi-canva.png");

await fs.writeFile(svgPath, svg, "utf8");
await sharp(Buffer.from(svg)).png().toFile(pngPath);

console.log(JSON.stringify({ svgPath, pngPath }, null, 2));
