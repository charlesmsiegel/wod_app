"""Copy confirmed faithful archive images into replaceable app slots.

Run from the repository: python -m apps.cantrips.import_images "PATH/TO/cantrip cards"
Use --dry-run to inspect counts; existing images survive unless --replace is given.
This offline command is never called by the web app or the static data loader.
"""
import argparse
import json
import shutil
from pathlib import Path

from .data import APP_DIR, confined_path


def import_images(source_dir, app_dir=APP_DIR, *, replace=False, dry_run=False):
    source_dir, app_dir = Path(source_dir).resolve(), Path(app_dir).resolve()
    catalogue = json.loads((app_dir / 'catalogue.json').read_text(encoding='utf-8'))
    report = {'planned': 0, 'copied': 0, 'existing': 0, 'unavailable': 0}
    seen = set()
    for card in catalogue['cards']:
        for side in ('front', 'back'):
            relative = card['source'].get(side)
            if not relative:
                report['unavailable'] += 1
                continue
            # Only confirmed faithful cards/ paths are eligible. AI and candidates
            # remain archive evidence, never automatic substitutes for a missing scan.
            if '_ai_' in relative.lower():
                raise ValueError(f'AI derivative in confirmed {side} mapping: {relative}')
            source = confined_path(source_dir, relative, directory='cards')
            target = confined_path(app_dir, card[side])
            if target in seen:
                continue
            if not source.is_file():
                report['unavailable'] += 1
                continue
            seen.add(target)
            if target.exists() and not replace:
                report['existing'] += 1
                continue
            report['planned'] += 1
            if not dry_run:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
                report['copied'] += 1
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', help='recovered archive folder containing cards/')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--replace', action='store_true', help='overwrite existing local image slots')
    args = parser.parse_args()
    print(json.dumps(import_images(args.source, replace=args.replace, dry_run=args.dry_run), indent=2))


if __name__ == '__main__':
    main()
