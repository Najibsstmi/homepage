import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.resolve(
  "public",
  "assets",
  "kesan kekurangan mikronutrien",
);
const outputDirectory = path.join(sourceDirectory, "processed");
const plantDirectory = path.join(outputDirectory, "plants");
const solutionDirectory = path.join(outputDirectory, "solutions");

const plantSheet = path.join(sourceDirectory, "asset 7.png");
const checkpoints = [0, 2, 4, 7, 10, 14];
const solutionRows = ["complete", "no-n", "no-p", "no-k"];
const columns = [
  { left: 150, width: 200 },
  { left: 350, width: 200 },
  { left: 550, width: 240 },
  { left: 790, width: 230 },
  { left: 1020, width: 255 },
  { left: 1275, width: 261 },
];
const rows = [
  { top: 130, height: 240 },
  { top: 365, height: 210 },
  { top: 560, height: 215 },
  { top: 755, height: 215 },
];
const anchors = [
  [
    { x: 225, y: 289 },
    { x: 449, y: 297 },
    { x: 674, y: 296 },
    { x: 902, y: 295 },
    { x: 1154, y: 304 },
    { x: 1395, y: 299 },
  ],
  [
    { x: 219, y: 498 },
    { x: 453, y: 507 },
    { x: 670, y: 502 },
    { x: 903, y: 503 },
    { x: 1145, y: 501 },
    { x: 1391, y: 500 },
  ],
  [
    { x: 218, y: 688 },
    { x: 456, y: 695 },
    { x: 674, y: 695 },
    { x: 907, y: 695 },
    { x: 1151, y: 692 },
    { x: 1395, y: 695 },
  ],
  [
    { x: 216, y: 881 },
    { x: 454, y: 890 },
    { x: 674, y: 892 },
    { x: 908, y: 888 },
    { x: 1154, y: 890 },
    { x: 1402, y: 898 },
  ],
];

const canvas = { width: 480, height: 520, anchorX: 240, anchorY: 300 };
const plantScale = 1.72;

async function convertBackground() {
  await sharp(path.join(sourceDirectory, "background statik 1.png"))
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(outputDirectory, "lab-background.webp"));
}

async function removeWhiteBackground(source, destination, options = {}) {
  const { data, info } = await sharp(source)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(info.width * info.height * 4);

  for (let index = 0, target = 0; index < data.length; index += 3, target += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const distanceFromWhite = Math.hypot(255 - red, 255 - green, 255 - blue);
    const alpha = Math.max(0, Math.min(255, Math.round((distanceFromWhite - 3) * 8.5)));

    output[target] = red;
    output[target + 1] = green;
    output[target + 2] = blue;
    let adjustedAlpha = alpha;
    if (options.revealTubeInteriors) {
      const pixel = target / 4;
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      const insideTube = [153, 409, 665, 921].some((center) => Math.abs(x - center) < 57);
      const insideUpperLiquid = y >= 360 && y < 545;
      const insideLowerLiquid = y >= 586 && y < 770;
      if (insideTube && (insideUpperLiquid || insideLowerLiquid)) {
        adjustedAlpha = Math.min(adjustedAlpha, 105);
      }
    }
    output[target + 3] = adjustedAlpha;
  }

  await sharp(output, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 5 })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(destination);
}

async function createApparatus() {
  await removeWhiteBackground(
    path.join(sourceDirectory, "set tabung uji.png"),
    path.join(outputDirectory, "apparatus.webp"),
    { revealTubeInteriors: true },
  );
}

async function createSolutionBottles() {
  const source = path.join(sourceDirectory, "sset 4.png");
  const names = ["complete", "no-n", "no-p", "no-k"];
  const bottleCrops = [
    { left: 0, width: 384 },
    { left: 384, width: 384 },
    { left: 768, width: 384 },
    { left: 1152, width: 383 },
  ];

  await Promise.all(
    bottleCrops.map(async (crop, index) => {
      const { data, info } = await sharp(source)
        .extract({ ...crop, top: 70, height: 850 })
        .raw()
        .toBuffer({ resolveWithObject: true });

      for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
        const alphaIndex = pixel * info.channels + 3;
        data[alphaIndex] = Math.max(
          0,
          Math.min(255, Math.round((data[alphaIndex] - 54) * 1.55)),
        );
      }

      await sharp(data, {
        raw: { width: info.width, height: info.height, channels: info.channels },
      })
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
        .webp({ quality: 90, alphaQuality: 100, effort: 6 })
        .toFile(path.join(solutionDirectory, `${names[index]}.webp`));
    }),
  );
}

function isolateConnectedPlant(data, info, anchorX, anchorY) {
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const alphaAt = (pixel) => data[pixel * info.channels + 3];
  let start = -1;
  let shortestDistance = Number.POSITIVE_INFINITY;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const pixel = y * info.width + x;
      if (alphaAt(pixel) <= 5) continue;
      const distance = (x - anchorX) ** 2 + (y - anchorY) ** 2;
      if (distance < shortestDistance) {
        start = pixel;
        shortestDistance = distance;
      }
    }
  }

  if (start < 0) return data;
  let head = 0;
  let tail = 0;
  queue[tail] = start;
  tail += 1;
  visited[start] = 1;

  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) continue;
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (nextX < 0 || nextY < 0 || nextX >= info.width || nextY >= info.height) continue;
        const next = nextY * info.width + nextX;
        if (visited[next] || alphaAt(next) <= 5) continue;
        visited[next] = 1;
        queue[tail] = next;
        tail += 1;
      }
    }
  }

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!visited[pixel]) data[pixel * info.channels + 3] = 0;
  }

  for (let y = 0; y < info.height; y += 1) {
    let visiblePixels = 0;
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] > 5) visiblePixels += 1;
    }
    if (visiblePixels > info.width * 0.62) {
      for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
        const targetY = y + offsetY;
        if (targetY < 0 || targetY >= info.height) continue;
        for (let x = 0; x < info.width; x += 1) {
          data[(targetY * info.width + x) * info.channels + 3] = 0;
        }
      }
    }
  }
  return data;
}

async function createPlantState(rowIndex, columnIndex, destination) {
  const crop = { ...columns[columnIndex], ...rows[rowIndex] };
  const anchor = anchors[rowIndex][columnIndex];
  const resizedWidth = Math.round(crop.width * plantScale);
  const resizedHeight = Math.round(crop.height * plantScale);
  const anchorWithinCropX = (anchor.x - crop.left) * plantScale;
  const anchorWithinCropY = (anchor.y - crop.top) * plantScale;
  const left = Math.round(canvas.anchorX - anchorWithinCropX);
  const top = Math.round(canvas.anchorY - anchorWithinCropY);

  const { data, info } = await sharp(plantSheet)
    .extract(crop)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const isolatedPlant = isolateConnectedPlant(
    data,
    info,
    anchor.x - crop.left,
    anchor.y - crop.top,
  );
  const plant = await sharp(isolatedPlant, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .resize(resizedWidth, resizedHeight, { kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toBuffer();

  await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: plant, left, top }])
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(destination);
}

async function createPlantStates() {
  await createPlantState(0, 0, path.join(plantDirectory, "day-0.webp"));

  const jobs = [];
  for (let rowIndex = 0; rowIndex < solutionRows.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex < checkpoints.length; columnIndex += 1) {
      jobs.push(
        createPlantState(
          rowIndex,
          columnIndex,
          path.join(
            plantDirectory,
            `${solutionRows[rowIndex]}-day-${checkpoints[columnIndex]}.webp`,
          ),
        ),
      );
    }
  }
  await Promise.all(jobs);
}

async function main() {
  await Promise.all([
    mkdir(outputDirectory, { recursive: true }),
    mkdir(plantDirectory, { recursive: true }),
    mkdir(solutionDirectory, { recursive: true }),
  ]);

  await Promise.all([
    convertBackground(),
    createApparatus(),
    createSolutionBottles(),
    createPlantStates(),
  ]);

  console.log(`Processed macronutrient assets written to ${outputDirectory}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
