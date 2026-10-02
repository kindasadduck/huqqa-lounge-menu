"""Convert source photos into web-ready WebP files.

Usage:
    uv run --with pillow scripts/build_images.py <food_photo_dir> [<food_photo_dir> ...]

Every PNG/JPG/WebP under the given directories (plus source/drinks) becomes:
    assets/img/<slug>-sm.webp   160x160 center crop, for row thumbnails
    assets/img/<slug>.webp      1200px on the long side, for cards and the lightbox
The slug is derived from the file name, so menu-data.js refers to photos by slug.
"""

import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
TR = str.maketrans("ıİğĞşŞçÇöÖüÜ", "iIgGsScCoOuU")


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name.translate(TR))
    name = name.encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-")


def convert(src: Path) -> str:
    slug = slugify(src.stem)
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")

    large = img.copy()
    large.thumbnail((1200, 1200), Image.LANCZOS)
    large.save(OUT / f"{slug}.webp", "WEBP", quality=78, method=6)

    thumb = ImageOps.fit(img, (160, 160), Image.LANCZOS)
    thumb.save(OUT / f"{slug}-sm.webp", "WEBP", quality=80, method=6)
    return slug


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    dirs = [Path(d) for d in sys.argv[1:]] + [ROOT / "source" / "drinks"]
    files = sorted(
        p for d in dirs for p in d.rglob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    )
    seen = {}
    for f in files:
        slug = convert(f)
        if slug in seen:
            print(f"WARNING: {f} and {seen[slug]} share slug {slug}")
        seen[slug] = f
    print(f"{len(seen)} photos -> {OUT}")


if __name__ == "__main__":
    main()
