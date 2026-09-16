import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.resolve("docs/edusim-user-guide/electrolysis");
const screenshotPath = path.join(dir, "05-akueus-pergerakan-ion.png");
const outSvg = path.join(dir, "page-01-elektrolisis-sebatian-ion.svg");
const outPng = path.join(dir, "page-01-elektrolisis-sebatian-ion.png");

const screenshot = await fs.readFile(screenshotPath);
const screenshotData = `data:image/png;base64,${screenshot.toString("base64")}`;

const width = 2079;
const height = 2953;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06131d"/>
      <stop offset="48%" stop-color="#0b1f2b"/>
      <stop offset="100%" stop-color="#f4f8f8"/>
    </linearGradient>
    <linearGradient id="heroGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#65f4d5" stop-opacity="0.34"/>
      <stop offset="50%" stop-color="#86a8ff" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#f7f9fb" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.07"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#00111b" flood-opacity="0.34"/>
    </filter>
    <clipPath id="screenClip">
      <rect x="150" y="790" width="1779" height="1080" rx="34"/>
    </clipPath>
    <style>
      .sans{font-family: Arial, Helvetica, sans-serif}
      .smallcap{font-size:31px;font-weight:700;letter-spacing:3px}
      .title{font-size:103px;font-weight:800;letter-spacing:0}
      .subtitle{font-size:40px;font-weight:500;letter-spacing:0}
      .body{font-size:32px;font-weight:400;letter-spacing:0}
      .bodyStrong{font-size:34px;font-weight:700;letter-spacing:0}
      .label{font-size:27px;font-weight:700;letter-spacing:0}
      .caption{font-size:25px;font-weight:400;letter-spacing:0}
      .stepNo{font-size:54px;font-weight:800;letter-spacing:0}
      .stepText{font-size:28px;font-weight:700;letter-spacing:0}
    </style>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <path d="M0 0H2079V2050C1680 2148 1201 2226 706 2171C404 2137 170 2052 0 1976Z" fill="#071722" opacity="0.88"/>
  <g opacity="0.13" stroke="#c5f8ee" stroke-width="1">
    ${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 92}" y1="0" x2="${i * 92}" y2="2160"/>`).join("")}
    ${Array.from({ length: 25 }, (_, i) => `<line x1="0" y1="${i * 92}" x2="2079" y2="${i * 92}"/>`).join("")}
  </g>
  <rect x="86" y="84" width="1907" height="2785" rx="42" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>

  <text class="sans smallcap" x="150" y="178" fill="#86f7df">EDUSIM USER GUIDE</text>
  <text class="sans title" x="150" y="316" fill="#ffffff">Elektrolisis</text>
  <text class="sans title" x="150" y="430" fill="#ffffff">Sebatian Ion</text>
  <text class="sans subtitle" x="154" y="505" fill="#d9f5f3">Tingkatan 5 • Bab 6 Elektrokimia</text>

  <text class="sans body" x="150" y="616" fill="#e9fbf8">Terokai bagaimana sebatian ion mengkonduksikan elektrik</text>
  <text class="sans body" x="150" y="666" fill="#e9fbf8">dalam keadaan pepejal, leburan dan larutan akueus.</text>

  <rect x="139" y="779" width="1801" height="1102" rx="42" fill="url(#heroGlow)" filter="url(#softShadow)"/>
  <rect x="150" y="790" width="1779" height="1080" rx="34" fill="#0a1824" stroke="#9ff5e4" stroke-opacity="0.36" stroke-width="2"/>
  <image href="${screenshotData}" x="184" y="824" width="1711" height="1012" preserveAspectRatio="xMidYMid meet" clip-path="url(#screenClip)"/>

  <g fill="none" stroke="#7cf5dc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1580 1010 C1700 940 1784 916 1856 900"/>
    <path d="M1390 1470 C1535 1510 1648 1580 1800 1635"/>
    <path d="M608 1606 C496 1656 392 1730 260 1810"/>
  </g>
  <g class="sans">
    <rect x="1515" y="842" width="384" height="108" rx="22" fill="#06131d" fill-opacity="0.82" stroke="#7cf5dc" stroke-opacity="0.6"/>
    <text class="label" x="1542" y="886" fill="#ffffff">Mentol menyala</text>
    <text class="caption" x="1542" y="925" fill="#bdfbf0">Arus elektrik mengalir</text>

    <rect x="1450" y="1580" width="448" height="120" rx="22" fill="#06131d" fill-opacity="0.82" stroke="#7cf5dc" stroke-opacity="0.6"/>
    <text class="label" x="1478" y="1626" fill="#ffffff">Ion bebas bergerak</text>
    <text class="caption" x="1478" y="1665" fill="#bdfbf0">Membawa cas dalam larutan</text>

    <rect x="156" y="1768" width="410" height="116" rx="22" fill="#06131d" fill-opacity="0.82" stroke="#7cf5dc" stroke-opacity="0.6"/>
    <text class="label" x="184" y="1812" fill="#ffffff">Suis litar</text>
    <text class="caption" x="184" y="1851" fill="#bdfbf0">Hidupkan untuk pemerhatian</text>
  </g>

  <rect x="150" y="1988" width="830" height="614" rx="34" fill="url(#panel)" stroke="#ffffff" stroke-opacity="0.20"/>
  <text class="sans bodyStrong" x="204" y="2070" fill="#ffffff">Apa yang akan anda lakukan?</text>
  <g class="sans">
    <text class="stepNo" x="204" y="2170" fill="#7cf5dc">01</text>
    <text class="stepText" x="300" y="2154" fill="#ffffff">Kenali bahan dan radas</text>
    <text class="stepText" x="300" y="2195" fill="#ffffff">elektrolisis.</text>

    <text class="stepNo" x="204" y="2288" fill="#7cf5dc">02</text>
    <text class="stepText" x="300" y="2273" fill="#ffffff">Uji pepejal dan leburan</text>
    <text class="stepText" x="300" y="2314" fill="#ffffff">plumbum(II) bromida.</text>

    <text class="stepNo" x="204" y="2406" fill="#7cf5dc">03</text>
    <text class="stepText" x="300" y="2391" fill="#ffffff">Bandingkan pemerhatian</text>
    <text class="stepText" x="300" y="2432" fill="#ffffff">pepejal, leburan dan akueus.</text>

    <text class="stepNo" x="204" y="2524" fill="#7cf5dc">04</text>
    <text class="stepText" x="300" y="2509" fill="#ffffff">Jawab kuiz untuk semak</text>
    <text class="stepText" x="300" y="2550" fill="#ffffff">kefahaman.</text>
  </g>

  <rect x="1040" y="1988" width="889" height="614" rx="34" fill="#f6fbfa" stroke="#d7eeea" stroke-width="2"/>
  <text class="sans bodyStrong" x="1094" y="2070" fill="#08202b">Fokus pembelajaran</text>
  <g class="sans body" fill="#17303a">
    <text x="1094" y="2164">• Pepejal ion tidak mengkonduksikan</text>
    <text x="1124" y="2210">elektrik kerana ion tidak bebas bergerak.</text>
    <text x="1094" y="2300">• Leburan dan larutan akueus boleh</text>
    <text x="1124" y="2346">mengkonduksikan elektrik.</text>
    <text x="1094" y="2436">• Mentol menyala apabila terdapat ion</text>
    <text x="1124" y="2482">bebas bergerak yang membawa cas.</text>
  </g>

  <rect x="150" y="2686" width="1779" height="120" rx="28" fill="#071722" fill-opacity="0.72" stroke="#7cf5dc" stroke-opacity="0.28"/>
  <text class="sans label" x="204" y="2736" fill="#7cf5dc">TIP MURID</text>
  <text class="sans body" x="204" y="2785" fill="#ffffff">Perhatikan mentol dahulu. Kemudian kaitkan pemerhatian dengan pergerakan ion.</text>
</svg>`;

await fs.writeFile(outSvg, svg, "utf8");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPng);

console.log(outPng);
