#!/usr/bin/env python3
"""Install the web-optimized Mage Tarot card scans from a local ZIP.

Usage:
    python scripts/install_tarot_cards.py Mage_Tarot_web_assets_for_wod_app.zip

The supplied ZIP should contain all 78 cards and one back as WebP files
under apps/tarot/decks/mage/images/. The installer validates the complete
deck before extracting. It never sends the files to a remote server.
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from apps.tarot import data as tarot_data  # noqa: E402

PREFIX = "apps/tarot/decks/mage/images/"
TARGET = ROOT / PREFIX


def inspect_archive(archive: ZipFile) -> tuple[list[tuple[str, str]], str]:
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
    image_members = []
    for info in archive.infolist():
        name = info.filename
        if not name.startswith(PREFIX):
            continue
        suffix = Path(name).suffix.lower()
        if info.is_dir() or suffix not in allowed:
            continue
        tail = name[len(PREFIX):]
        if (not tail or "/" in tail or "\\" in tail or tail.startswith(".")
                or Path(tail).name != tail):
            raise ValueError(f"Unsafe or unexpected ZIP member: {name}")
        image_members.append((name, tail))
    if len(image_members) != 79:
        raise ValueError(f"Expected 78 tarot cards and a back; found {len(image_members)} image files")
    names = [tail for _, tail in image_members]
    if len(set(name.lower() for name in names)) != 79:
        raise ValueError("Duplicate or case-colliding card filenames")

    parsed = tarot_data.parse_meanings(
        (ROOT / "apps/tarot/decks/mage/meanings.md").read_text(encoding="utf-8")
    )
    matches, back, unmatched = tarot_data.match_images(
        parsed["cards"], parsed["suits"], names
    )
    if unmatched or not back or len(matches) != 78:
        missing = sorted(c["name"] for c in parsed["cards"] if c["id"] not in matches)
        raise ValueError(
            f"Incomplete tarot archive: {len(matches)}/78 cards, back={back!r}; "
            f"missing={missing}; unmatched={unmatched}"
        )
    return image_members, back


def install(path: Path, dry_run: bool = False) -> None:
    with ZipFile(path) as z:
        members, back = inspect_archive(z)
        if dry_run:
            print(f"VALIDATED: {len(members)-1} card faces and {back}")
            return
        TARGET.mkdir(parents=True, exist_ok=True)
        for zip_name, target_name in members:
            with z.open(zip_name) as source, (TARGET / target_name).open("wb") as target:
                shutil.copyfileobj(source, target)
        print(f"Installed 78 card faces and {back} in {TARGET}")
        print("To publish: git add apps/tarot/decks/mage/images/")
        print('            git commit -m "Add web-optimized Mage Tarot card art"')
        print("            git push origin main")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip_file", type=Path, help="Web-optimized Mage Tarot asset archive")
    parser.add_argument("--dry-run", action="store_true", help="Only validate the ZIP")
    args = parser.parse_args()
    try:
        install(args.zip_file, dry_run=args.dry_run)
    except (ValueError, BadZipFile, OSError) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
