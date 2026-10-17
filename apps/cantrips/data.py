"""Load a text-first cantrip catalogue and resolve explicitly named local images.

The catalogue is also the editable image manifest. Its source paths document the
recovery archive; only paths below this app's images/ are ever served as artwork.
"""
import json
from pathlib import Path, PurePosixPath
from urllib.parse import quote

APP_DIR = Path(__file__).resolve().parent
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg'}


def confined_path(root, relative, directory='images'):
    """Resolve a manifest slot, rejecting traversal, URLs, hidden paths and symlinks out."""
    if not isinstance(relative, str) or '\\' in relative or ':' in relative:
        raise ValueError(f'invalid local image path: {relative!r}')
    path = PurePosixPath(relative)
    if (not relative or path.is_absolute() or path.parts[0] != directory
            or any(part.startswith('.') for part in path.parts)
            or path.suffix.lower() not in IMAGE_EXTENSIONS):
        raise ValueError(f'image must be a visible file below {directory}/: {relative!r}')
    root = Path(root).resolve()
    target = (root / path).resolve()
    try:
        target.relative_to(root / directory)
    except ValueError as error:
        raise ValueError(f'image escapes {directory}/: {relative!r}') from error
    return target


def build_data(app_dir=APP_DIR):
    """JSON for both the local server and a portable static build; no external reads."""
    app_dir = Path(app_dir)
    catalogue = json.loads((app_dir / 'catalogue.json').read_text(encoding='utf-8'))
    cards, identities = [], set()
    for entry in catalogue['cards']:
        card = dict(entry)
        identity = card['id']
        if identity in identities:
            raise ValueError(f'duplicate card identity: {identity}')
        identities.add(identity)
        for side in ('front', 'back'):
            relative = card[side]
            target = confined_path(app_dir, relative)
            card[side + 'Image'] = quote(relative, safe='/') if target.is_file() else None
        cards.append(card)
    return {**catalogue, 'cards': cards,
            'imagesInstalled': sum(bool(c['frontImage']) for c in cards),
            'backsInstalled': sum(bool(c['backImage']) for c in cards)}


if __name__ == '__main__':
    print(json.dumps(build_data(), ensure_ascii=False, indent=2))
