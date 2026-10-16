"""Load tarot decks and spreads into a plain dict for the web page.

Standard library only, with no web framework, so this can sit behind
``serve.py``, a Django view, or a static build step.

Layout of the app folder::

    decks/<deck-id>/meanings.md   card text (see README for the format)
    decks/<deck-id>/deck.json     optional settings (aspect ratio, ...)
    decks/<deck-id>/images/       card images, matched to cards by filename
    spreads/<spread-id>.json      one file per spread
"""

import json
import re
from pathlib import Path
from urllib.parse import quote

APP_DIR = Path(__file__).resolve().parent

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
BACK_NAMES = {"back", "card back", "cardback", "reverse"}

RANKS = ["ace", "two", "three", "four", "five", "six", "seven", "eight",
         "nine", "ten", "page", "knight", "queen", "king"]
COURT_RANKS = {"page", "knight", "queen", "king"}

# Extra names a suit heading (or an image filename) may use.
SUIT_ALIASES = {
    "questing": ["wands"],
    "primordialism": ["primordial", "cups"],
    "dynamism": ["dynamic", "swords"],
    "pattern": ["pentacles", "coins"],
}

CARD_FIELDS = {"meaning", "upright", "reversed", "association", "image"}
FILENAME_STOPWORDS = {"the", "of", "card", "tarot", "mage"}

ROMAN = ["0", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
         "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx",
         "xxi"]


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _split_heading(heading):
    """'Page of Primordialism (Caul)' -> ('Page of Primordialism', 'Caul')."""
    match = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", heading)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return heading.strip(), None


def _paragraphs(lines):
    text = "\n".join(lines).strip()
    return [" ".join(p.split()) for p in re.split(r"\n\s*\n", text) if p.strip()]


def _read_block(lines):
    """Split a block into leading 'Field: value' lines and the text after."""
    fields, rest = {}, []
    for i, line in enumerate(lines):
        if not line.strip() and not fields:
            continue
        match = re.match(r"^([A-Za-z ]+):\s*(.*)$", line)
        if match and not rest and match.group(1).strip():
            fields[match.group(1).strip().lower()] = match.group(2).strip()
            continue
        rest = lines[i:]
        break
    return fields, _paragraphs(rest)


def parse_meanings(text):
    """Parse a meanings.md file into deck info, suits and cards.

    The first ``#`` heading is the deck title. Each later ``#`` heading starts
    a suit (``# Major Arcana`` for the trumps). ``##`` headings are cards.
    """
    sections = []  # (level, heading, lines)
    for line in text.splitlines():
        match = re.match(r"^(#{1,2})\s+(.*)$", line)
        if match:
            sections.append((len(match.group(1)), match.group(2).strip(), []))
        elif sections:
            sections[-1][2].append(line)

    if not sections or sections[0][0] != 1:
        raise ValueError("meanings file must start with a '# Deck title' heading")

    deck = {"name": sections[0][1], "description": _paragraphs(sections[0][2])}
    suits, cards = [], []
    current_suit = None

    for level, heading, lines in sections[1:]:
        if level == 1:
            fields, paragraphs = _read_block(lines)
            if heading.lower() == "major arcana":
                current_suit = None
                continue
            current_suit = {
                "id": slugify(heading),
                "name": heading,
                "fields": fields,
                "description": paragraphs,
            }
            suits.append(current_suit)
            continue

        fields, paragraphs = _read_block(lines)
        unknown = set(fields) - CARD_FIELDS
        if unknown:
            raise ValueError(f"{heading}: unknown field(s) {sorted(unknown)}")
        title, subtitle = _split_heading(heading)
        card = {
            "name": title,
            "subtitle": subtitle,
            "meaning": fields.get("meaning", ""),
            "upright": fields.get("upright", ""),
            "reversed": fields.get("reversed", ""),
            "association": fields.get("association", ""),
            "text": paragraphs,
            "imageFile": fields.get("image"),
        }
        if current_suit is None:
            match = re.match(r"^(\d+)\s+(.*)$", title)
            if not match:
                raise ValueError(f"major arcana card '{heading}' needs a number")
            card.update(arcana="major", number=int(match.group(1)),
                        name=match.group(2), suit=None, rank=None)
        else:
            rank = title.split()[0].lower()
            if rank not in RANKS:
                raise ValueError(f"{heading}: unknown rank '{rank}'")
            card.update(arcana="minor", number=None, suit=current_suit["id"],
                        rank=rank, court=rank in COURT_RANKS)
        card["id"] = slugify(card["name"])
        cards.append(card)

    ids = [c["id"] for c in cards]
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        raise ValueError(f"duplicate cards: {sorted(duplicates)}")
    return {"deck": deck, "suits": suits, "cards": cards}


# --- image matching -------------------------------------------------------

def _tokens(text):
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    out = []
    for token in tokens:
        if token in FILENAME_STOPWORDS:
            continue
        out.append(str(int(token)) if token.isdigit() else token)
    return out


def _card_keys(card, suits_by_id):
    """Every normalised filename that should match this card."""
    name = _tokens(card["name"])
    keys = set()
    if card["arcana"] == "major":
        number = str(card["number"])
        for prefix in ([], [number], [ROMAN[card["number"]]]
                       if card["number"] < len(ROMAN) else []):
            keys.add(" ".join(prefix + name))
            keys.add(" ".join(name + prefix))
        return keys
    suit = suits_by_id[card["suit"]]
    suit_names = {suit["id"]} | set(SUIT_ALIASES.get(suit["id"], []))
    tarot_suit = suit["fields"].get("tarot suit")
    if tarot_suit:
        suit_names.add(tarot_suit.lower())
    ranks = {card["rank"]}
    index = RANKS.index(card["rank"]) + 1
    if index <= 10:
        ranks.add(str(index))
    subtitle = _tokens(card["subtitle"]) if card["subtitle"] else []
    for rank in ranks:
        for suit_name in suit_names:
            for extra in ([], subtitle):
                keys.add(" ".join([rank, suit_name] + extra))
                keys.add(" ".join([suit_name, rank] + extra))
    return keys


def match_images(cards, suits, filenames):
    """Map card ids to image filenames.

    Returns (matches, back_image, unmatched_files). A card's ``Image:`` field
    wins over automatic matching.
    """
    suits_by_id = {s["id"]: s for s in suits}
    key_to_card = {}
    for card in cards:
        for key in _card_keys(card, suits_by_id):
            key_to_card[key] = card["id"]

    matches, unmatched, back = {}, [], None
    lowered = {f.lower(): f for f in filenames}
    for card in cards:
        wanted = card.get("imageFile")
        if wanted and wanted.lower() in lowered:
            matches[card["id"]] = lowered[wanted.lower()]

    claimed = set(matches.values())
    for filename in sorted(filenames):
        if filename in claimed:
            continue
        stem = Path(filename).stem
        if " ".join(_tokens(stem)) in BACK_NAMES or slugify(stem) in {"back", "card-back"}:
            back = back or filename
            continue
        tokens = _tokens(stem)
        card_id = key_to_card.get(" ".join(tokens))
        if card_id is None and len(tokens) > 1 and tokens[0].isdigit():
            # Allow a sort prefix such as "23-two-of-questing.jpg".
            card_id = key_to_card.get(" ".join(tokens[1:]))
        if card_id is None or card_id in matches:
            unmatched.append(filename)
        else:
            matches[card_id] = filename
    return matches, back, unmatched


# --- spreads --------------------------------------------------------------

def load_spread(path):
    spread = json.loads(Path(path).read_text(encoding="utf-8"))
    spread.setdefault("id", Path(path).stem)
    spread.setdefault("description", "")
    spread.setdefault("order", 100)
    positions = spread.get("positions")
    if not spread.get("name") or not positions:
        raise ValueError(f"{path}: a spread needs a name and positions")
    for i, position in enumerate(positions):
        for key in ("label", "x", "y"):
            if key not in position:
                raise ValueError(f"{path}: position {i + 1} is missing '{key}'")
        position.setdefault("meaning", "")
        position.setdefault("rotate", 0)
        position["significator"] = bool(position.get("significator"))
    if sum(p["significator"] for p in positions) > 1:
        raise ValueError(f"{path}: only one significator position is allowed")
    return spread


def _visible(path):
    """Hidden files and folders (dot-names, incl. macOS '._' files) are never published."""
    return not path.name.startswith(".")


def load_spreads(spreads_dir):
    spreads = [load_spread(p) for p in sorted(Path(spreads_dir).glob("*.json")) if _visible(p)]
    return sorted(spreads, key=lambda s: (s["order"], s["name"]))


# --- whole app ------------------------------------------------------------

def load_deck(deck_dir, url_prefix=""):
    deck_dir = Path(deck_dir)
    parsed = parse_meanings((deck_dir / "meanings.md").read_text(encoding="utf-8"))
    settings_path = deck_dir / "deck.json"
    settings = json.loads(settings_path.read_text(encoding="utf-8")) if settings_path.exists() else {}

    image_dir = deck_dir / "images"
    filenames = [p.name for p in image_dir.iterdir()
                 if p.is_file() and _visible(p) and p.suffix.lower() in IMAGE_EXTENSIONS] if image_dir.is_dir() else []
    matches, back, unmatched = match_images(parsed["cards"], parsed["suits"], filenames)

    # Percent-encode so names containing spaces, '#', '?' or '%' still work as URLs.
    image_url = f"{url_prefix}decks/{quote(deck_dir.name)}/images/"
    for card in parsed["cards"]:
        filename = matches.get(card["id"])
        card["image"] = image_url + quote(filename) if filename else None
        card.pop("imageFile", None)

    deck = dict(parsed["deck"])
    deck.update(settings)
    deck.update(
        id=deck_dir.name,
        back=image_url + quote(back) if back else None,
        suits=parsed["suits"],
        cards=parsed["cards"],
        missingImages=[c["name"] for c in parsed["cards"] if not c["image"]],
        unmatchedImages=unmatched,
    )
    deck.setdefault("aspect", 0.575)
    return deck


def build_data(app_dir=APP_DIR, url_prefix=""):
    """Everything the page needs, as JSON-ready data."""
    app_dir = Path(app_dir)
    decks = [load_deck(d, url_prefix) for d in sorted((app_dir / "decks").iterdir())
             if _visible(d) and (d / "meanings.md").is_file()]
    return {"decks": decks, "spreads": load_spreads(app_dir / "spreads")}


if __name__ == "__main__":
    print(json.dumps(build_data(), indent=2, ensure_ascii=False))
