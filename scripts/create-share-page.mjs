import fs from "node:fs";
import path from "node:path";

const defaults = {
  siteUrl: "https://www.cikgustem.com",
  imageWidth: "1200",
  imageHeight: "630",
};

const args = process.argv.slice(2);
const options = {};

for (const arg of args) {
  if (!arg.startsWith("--")) {
    continue;
  }

  const [rawKey, ...rest] = arg.slice(2).split("=");
  const key = rawKey.trim();
  const value = rest.join("=").trim();

  if (!key) {
    continue;
  }

  if (value) {
    options[key] = value;
  } else {
    options[key] = "true";
  }
}

if (options.help === "true") {
  console.log(`
Usage:
  npm run create:share -- --slug=nama-post --title="Tajuk" --description="Meta desc"
    --target=anchor-post --image=og-post.jpg [--ogDescription="..."] [--twitterDescription="..."]
    [--siteUrl=https://www.cikgustem.com] [--imageWidth=1200] [--imageHeight=630]
    [--imageAlt="Preview post"] [--force] [--dry-run]

Required:
  --slug
  --title
  --description
  --target
  --image

Output:
  public/share-<slug>.html
`);
  process.exit(0);
}

const slug = options.slug;
const title = options.title;
const description = options.description;
const target = options.target;
const image = options.image;

const missing = [
  ["slug", slug],
  ["title", title],
  ["description", description],
  ["target", target],
  ["image", image],
].filter(([, value]) => !value);

if (missing.length > 0) {
  console.error(
    `Missing required options: ${missing.map(([key]) => `--${key}`).join(", ")}`
  );
  console.error("Run `npm run create:share -- --help` for usage.");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/i.test(slug)) {
  console.error("`--slug` must contain only letters, numbers, and hyphens.");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/i.test(target)) {
  console.error("`--target` must contain only letters, numbers, and hyphens.");
  process.exit(1);
}

const siteUrl = (options.siteUrl || defaults.siteUrl).replace(/\/$/, "");
const ogDescription = options.ogDescription || description;
const twitterDescription = options.twitterDescription || ogDescription;
const imageWidth = options.imageWidth || defaults.imageWidth;
const imageHeight = options.imageHeight || defaults.imageHeight;
const imageAlt = options.imageAlt || `Preview ${title}`;
const outputPath = path.resolve("public", `share-${slug}.html`);

if (fs.existsSync(outputPath) && options.force !== "true") {
  console.error(
    `File already exists: ${outputPath}\nUse --force=true if you want to overwrite it.`
  );
  process.exit(1);
}

const html = `<!doctype html>
<html lang="ms">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta
      name="description"
      content="${escapeHtml(description)}"
    />
    <link rel="canonical" href="${siteUrl}/share-${slug}.html" />

    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ms_MY" />
    <meta property="og:site_name" content="CikguSTEM" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta
      property="og:description"
      content="${escapeHtml(ogDescription)}"
    />
    <meta property="og:image" content="${siteUrl}/${escapeAttribute(image)}" />
    <meta property="og:image:width" content="${escapeAttribute(imageWidth)}" />
    <meta property="og:image:height" content="${escapeAttribute(imageHeight)}" />
    <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />
    <meta property="og:url" content="${siteUrl}/share-${slug}.html" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta
      name="twitter:description"
      content="${escapeHtml(twitterDescription)}"
    />
    <meta name="twitter:image" content="${siteUrl}/${escapeAttribute(image)}" />

    <meta http-equiv="refresh" content="0; url=/?page=inovasi#${target}" />
    <script>
      (function () {
        var params = new URLSearchParams(window.location.search);
        var target = params.get("target") || "${target}";
        var safeTarget = /^[a-z0-9-]+$/i.test(target) ? target : "${target}";
        var basePath = window.location.pathname.replace(/\\/[^/]*$/, "/");
        window.location.replace(basePath + "?page=inovasi#" + safeTarget);
      })();
    </script>
  </head>
  <body>
    <p>Mengarahkan ke halaman Inovasi ${escapeHtml(title)}...</p>
    <p>
      Jika tidak bergerak automatik,
      <a href="/?page=inovasi#${target}">klik di sini</a>.
    </p>
  </body>
</html>
`;

if (options["dry-run"] === "true") {
  console.log(html);
  process.exit(0);
}

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Created ${outputPath}`);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
}