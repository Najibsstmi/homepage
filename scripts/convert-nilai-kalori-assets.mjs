import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const assetDir = path.join(projectRoot, "public", "assets", "nilai kalori");
const webpOptions = {
  quality: 86,
  alphaQuality: 100,
  smartSubsample: true,
};

const directAssets = [
  {
    output: "makmal.webp",
    candidates: ["makmal.png"],
  },
  {
    output: "calorimeter.webp",
    candidates: ["calorimeter.png"],
    removeWhiteBackground: true,
  },
  {
    output: "digital-termometer.webp",
    candidates: ["digital termometer.png"],
  },
  {
    output: "jarum-plastisin.webp",
    candidates: [
      "ChatGPT Image Jul 13, 2025 11_32_58 AM.png",
      "ChatGPT Image Jul 13, 2026, 11_32_58 AM.png",
    ],
  },
];

const panelAssets = [
  {
    key: "kacang-tanah",
    candidates: ["kacang tanah.png"],
  },
  {
    key: "ikan-bilis",
    candidates: ["ikan bilis.png", "ikab bilis.png"],
  },
  {
    key: "roti",
    candidates: ["roti.png"],
  },
];

const panelStates = ["normal", "terbakar", "hangus"];

async function findSource(candidates) {
  for (const candidate of candidates) {
    const sourcePath = path.join(assetDir, candidate);
    try {
      await fs.access(sourcePath);
      return sourcePath;
    } catch {
      // Try the next known source filename.
    }
  }

  throw new Error(`Fail sumber tidak ditemui: ${candidates.join(" atau ")}`);
}

async function convertDirectAsset(asset) {
  const sourcePath = await findSource(asset.candidates);
  const outputPath = path.join(assetDir, asset.output);

  if (asset.removeWhiteBackground) {
    await convertWithEdgeWhiteTransparency(sourcePath, outputPath);
  } else {
    await sharp(sourcePath).webp(webpOptions).toFile(outputPath);
  }

  console.log(`OK ${path.basename(sourcePath)} -> ${asset.output}`);
}

async function convertWithEdgeWhiteTransparency(sourcePath, outputPath) {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const visited = new Uint8Array(info.width * info.height);
  const queue = [];

  const indexFor = (x, y) => y * info.width + x;
  const offsetFor = (x, y) => indexFor(x, y) * info.channels;
  const isBrightNeutralAt = (offset, edgeOnly = false) => {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const brightness = (red + green + blue) / 3;

    return (
      alpha > 0 &&
      brightness >= (edgeOnly ? 232 : 210) &&
      maxChannel - minChannel <= (edgeOnly ? 34 : 42)
    );
  };
  const isEdgeWhite = (x, y) => {
    const offset = offsetFor(x, y);

    return isBrightNeutralAt(offset, true);
  };
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) return;
    const index = indexFor(x, y);
    if (visited[index] || !isEdgeWhite(x, y)) return;
    visited[index] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, info.height - 1);
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(0, y);
    enqueue(info.width - 1, y);
  }

  let cursor = 0;
  while (cursor < queue.length) {
    const [x, y] = queue[cursor];
    cursor += 1;
    data[offsetFor(x, y) + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  for (let offset = 0; offset < data.length; offset += info.channels) {
    if (isBrightNeutralAt(offset)) {
      data[offset + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .webp(webpOptions)
    .toFile(outputPath);
}

async function convertPanelAsset(asset) {
  const sourcePath = await findSource(asset.candidates);
  const metadata = await sharp(sourcePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Dimensi imej tidak dapat dibaca: ${path.basename(sourcePath)}`);
  }

  const panelWidth = Math.floor(metadata.width / 3);

  for (const [index, state] of panelStates.entries()) {
    const left = index * panelWidth;
    const width = index === panelStates.length - 1 ? metadata.width - left : panelWidth;
    const outputName = `${asset.key}-${state}.webp`;
    const outputPath = path.join(assetDir, outputName);
    const panelBuffer = await sharp(sourcePath)
      .extract({
        left,
        top: 0,
        width,
        height: metadata.height,
      })
      .toBuffer();

    await sharp(panelBuffer)
      .trim({
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        threshold: 8,
      })
      .extend({
        top: 28,
        right: 28,
        bottom: 28,
        left: 28,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp(webpOptions)
      .toFile(outputPath);

    console.log(`OK ${path.basename(sourcePath)} panel ${index + 1} -> ${outputName}`);
  }
}

async function main() {
  await fs.access(assetDir);

  for (const asset of directAssets) {
    await convertDirectAsset(asset);
  }

  for (const asset of panelAssets) {
    await convertPanelAsset(asset);
  }
}

main().catch((error) => {
  console.error(`Ralat penukaran aset nilai kalori: ${error.message}`);
  process.exitCode = 1;
});
