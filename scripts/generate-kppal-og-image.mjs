import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.resolve("public");
const posterPath = path.join(publicDir, "kppal-2026-poster.jpg");
const outputPath = path.join(publicDir, "og-edusim-kppal-2026.jpg");
const posterBase64 = (await fs.readFile(posterPath)).toString("base64");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#061326" />
      <stop offset="0.58" stop-color="#0b2344" />
      <stop offset="1" stop-color="#064866" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#29d7f4" />
      <stop offset="1" stop-color="#67e8f9" />
    </linearGradient>
    <clipPath id="posterClip">
      <rect x="882" y="44" width="270" height="542" rx="20" />
    </clipPath>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000814" flood-opacity="0.45" />
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#background)" />
  <circle cx="1065" cy="80" r="255" fill="#138bb1" opacity="0.12" />
  <circle cx="725" cy="640" r="265" fill="#1fd1ed" opacity="0.08" />
  <rect x="48" y="44" width="10" height="78" rx="5" fill="url(#accent)" />

  <text x="82" y="78" fill="#6ce8f7" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="3">CIKGUSTEM · KAJIAN TINDAKAN</text>
  <text x="82" y="150" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800">EduSim AI</text>
  <text x="82" y="218" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="49" font-weight="750">Dari Bilik Darjah</text>
  <text x="82" y="275" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="49" font-weight="750">Menuju Pentas Kolokium</text>

  <text x="82" y="332" fill="#b9cee6" font-family="Arial, Helvetica, sans-serif" font-size="25">Atom · Molekul · Sebatian · Simulasi Digital</text>
  <rect x="82" y="365" width="730" height="2" fill="#4d729b" opacity="0.7" />

  <g font-family="Arial, Helvetica, sans-serif">
    <rect x="82" y="402" width="210" height="114" rx="18" fill="#0a1a31" stroke="#2c4c70" />
    <text x="106" y="451" fill="#ffffff" font-size="38" font-weight="800">13</text>
    <text x="106" y="485" fill="#9fb9d4" font-size="20">murid terlibat</text>

    <rect x="308" y="402" width="210" height="114" rx="18" fill="#0a1a31" stroke="#2c4c70" />
    <text x="332" y="451" fill="#ffffff" font-size="38" font-weight="800">12</text>
    <text x="332" y="485" fill="#9fb9d4" font-size="20">murid meningkat</text>

    <rect x="534" y="402" width="278" height="114" rx="18" fill="#07314a" stroke="#20c7e7" />
    <text x="558" y="451" fill="#48e6ff" font-size="38" font-weight="800">92.3%</text>
    <text x="558" y="485" fill="#bdeef6" font-size="20">meningkat ≥ 1 tahap</text>
  </g>

  <rect x="82" y="549" width="512" height="46" rx="23" fill="url(#accent)" />
  <text x="338" y="580" text-anchor="middle" fill="#031323" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">MENUJU KPPAL 2026</text>

  <g filter="url(#shadow)">
    <rect x="874" y="36" width="286" height="558" rx="24" fill="#ffffff" opacity="0.18" />
    <image x="882" y="44" width="270" height="542" preserveAspectRatio="xMidYMid slice" clip-path="url(#posterClip)" href="data:image/jpeg;base64,${posterBase64}" />
    <rect x="882" y="44" width="270" height="542" rx="20" fill="none" stroke="#d9f8ff" stroke-width="2" opacity="0.75" />
  </g>
</svg>`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
  .toFile(outputPath);

console.log(`Generated ${outputPath}`);
