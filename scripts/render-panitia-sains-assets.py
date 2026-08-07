import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image


MAX_SIZE = (1600, 2200)
WEBP_QUALITY = 78


def render_pdf(asset):
    pdf_path = Path(asset["renderPath"])
    output_dir = Path(asset["outputDirAbs"])
    output_dir.mkdir(parents=True, exist_ok=True)

    rendered_pages = []
    document = pdfium.PdfDocument(str(pdf_path))

    for index in range(len(document)):
        page = document[index]
        image = page.render(scale=2.0).to_pil().convert("RGB")
        image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

        filename = f"page-{index + 1:02d}.webp"
        output_path = output_dir / filename
        image.save(output_path, "WEBP", quality=WEBP_QUALITY, method=6)

        rendered_pages.append(
            {
                "page": index + 1,
                "src": f"{asset['outputDirUrl']}/{filename}",
                "alt": f"{asset['title']} - halaman {index + 1}",
            }
        )

    return rendered_pages


def render_image(asset):
    source_path = Path(asset["renderPath"])
    output_dir = Path(asset["outputDirAbs"])
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(source_path).convert("RGB")
    image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

    filename = "page-01.webp"
    output_path = output_dir / filename
    image.save(output_path, "WEBP", quality=WEBP_QUALITY, method=6)

    return [
        {
            "page": 1,
            "src": f"{asset['outputDirUrl']}/{filename}",
            "alt": asset["title"],
        }
    ]


def main():
    config_path = Path(sys.argv[1])
    manifest_path = Path(sys.argv[2])
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRoot": config["sourceRoot"],
        "pages": {},
    }

    for page in config["pages"]:
        documents = []

        for asset in page["assets"]:
            pages = []
            error = asset.get("error", "")

            try:
                if not asset.get("renderPath"):
                    raise RuntimeError(error or "Tiada fail render.")

                extension = asset["renderExtension"].lower()

                if extension == ".pdf":
                    pages = render_pdf(asset)
                elif extension in {".jpg", ".jpeg", ".png", ".webp"}:
                    pages = render_image(asset)
                else:
                    raise RuntimeError(f"Jenis fail belum disokong untuk render: {extension}")
            except Exception as exc:  # Keep the page alive even if one document fails.
                error = str(exc)

            documents.append(
                {
                    "title": asset["title"],
                    "sourceName": asset["sourceName"],
                    "fileType": asset["fileType"],
                    "originalHref": asset.get("originalHref", ""),
                    "pages": pages,
                    "error": error,
                }
            )

        manifest["pages"][page["id"]] = documents

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    total_documents = sum(len(documents) for documents in manifest["pages"].values())
    total_pages = sum(
        len(document["pages"])
        for documents in manifest["pages"].values()
        for document in documents
    )
    print(f"Imported {total_documents} documents and {total_pages} WebP pages.")


if __name__ == "__main__":
    main()
