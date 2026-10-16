# Mage Tools

Table aids for *Mage: The Ascension*, built to run on a laptop at the table or
over a screen share. Each tool is plain HTML, CSS and JavaScript plus a small
standard-library Python loader, so it can be lifted into another project
(such as a Django site) without bringing a framework along.

| Tool | What it does |
|------|--------------|
| [Tarot Reader](apps/tarot/) | Deals Mage Tarot spreads and shows what each card means in its position. |

## Running it

You need Python 3.9 or newer and nothing else.

```sh
python serve.py
```

This starts a local server and opens the tarot reader at
<http://localhost:8000/apps/tarot/>. Use `--port 9000` to pick another port
or `--no-browser` to skip opening a tab. Stop it with Ctrl+C.

Edits to card text, spreads or images show up on a browser reload. There's
no build step and no restart.

## Tarot Reader

Pick a spread, choose a significator if the spread uses one, and press
**Deal**. Cards land face down. Click one, or press **Space** or **→**, to
turn it over. The side panel then shows:

- the position's name and what it stands for
- the card's Meaning and its upright or reversed keywords
- its Association and suit correspondences
- the book's descriptive text

The **Reading** tab lists the whole spread at a glance, and **Copy** puts it
on the clipboard as text.

Keys: **Space** / **→** next card, **←** previous card, **D** deal,
**A** reveal all, **Esc** clear the selection.

### Card images

Drop the image files into `apps/tarot/decks/mage/images/` and reload. Files
are matched to cards by name. Case, separators, a leading sort number and
the words "the" and "of" are all ignored, so any of these work:

```
The Fool.jpg      00-the-fool.png      xxi-gaia.jpg       21_gaia.webp
Six of Pattern.jpg     six_of_pentacles.png     pentacles-06.jpg
Queen of Dynamism (Sibil).jpg     swords_queen.jpg     cups 3.png
```

Suits can use their Mage or traditional names:

- Questing or Wands
- Primordialism, Primordial or Cups
- Dynamism, Dynamic or Swords
- Pattern, Pentacles or Coins

Name the card back `back.jpg` or `card-back.jpg`. A card without an image
is drawn as a plain text card. A notice at the bottom of the page lists
cards with no image and files that didn't match any card. If a file name
can't be made to match, add an `Image: filename.jpg` line to that card in
the meanings file.

The images folder is git-ignored, so the art stays on your machine. Remove
the rule from `.gitignore` if you want the images committed.

### Card text: `meanings.md`

`apps/tarot/decks/mage/meanings.md` holds the text of all 78 cards,
transcribed from *The Mage Tarot: Designs of Destiny* (used with
permission). The format is plain Markdown:

```markdown
# Deck title                  <- first heading: the deck's name

# Major Arcana                <- trumps; card headings start with the number

## 0 The Fool
Meaning: Possibility
Upright: Courage, Ecstasy, Creative Expression
Reversed: Stagnation, Eccentricity, Folly
Association: Marauders

**The Faerie:** Clad in the vestments of mortal experience...

# Questing                    <- every other top heading starts a suit
Tarot Suit: Wands             <- suit fields (shown with each card in the suit)
Faction: Traditions
Element: Fire

Suit description...

## Knight of Pattern (Cyberknight)    <- "(...)" becomes a subtitle
Meaning: Reliability
...
```

Card fields are `Meaning`, `Upright`, `Reversed`, `Association` and the
optional `Image`. Anything after the fields is the card's description.
`**bold**` and `*italic*` are supported.

### Adding a spread

Each file in `apps/tarot/spreads/` is one spread. To add one, copy a file
there and edit it:

```json
{
  "name": "Three Cards: Body, Mind, Spirit",
  "order": 40,
  "description": "Shown in the side panel.",
  "positions": [
    { "label": "Body",   "x": 2.28, "y": 0, "meaning": "The physical aspect, or the past." },
    { "label": "Mind",   "x": 1.14, "y": 0, "meaning": "The mind, or the present." },
    { "label": "Spirit", "x": 0,    "y": 0, "meaning": "The spirit, or the future." }
  ]
}
```

- `x` and `y` place the centre of each card. `x` is measured in card
  widths and `y` in card heights. The layout is centred and scaled to fit
  the screen, so only the relative positions matter.
- Positions are dealt in the order listed.
- `"rotate": 90` lays a card sideways, like the Cross in the Celtic Cross.
- `"significator": true` marks a position that holds the chosen
  significator instead of a dealt card. At most one per spread.
- `order` sorts the spread menu, lowest first.
- `"extend": { "dx": -1.14, "dy": 0, "label": "Card {n}", "meaning": "..." }`
  adds a **Draw another** button. Each extra card is placed `dx`/`dy` from
  the last one.

The bundled spreads come from the book:

- Celtic Cross
- Circular, as a week or a year
- Three-card Body, Mind, Spirit
- an open-ended Linear spread
- a Single Card for quick inspiration

### Adding a deck

Make a new folder beside `decks/mage/` with its own `meanings.md` and
`images/`. Add an optional `deck.json` too: `{"aspect": 0.58}` sets the
card's width-to-height ratio. When there is more than one deck, a deck
picker appears.

## Layout of the repository

```
serve.py                 local server and static-site builder (stdlib only)
index.html               list of tools
apps/tarot/
  index.html, tarot.css, tarot.js   the page (no dependencies, no build step)
  data.py                 reads decks and spreads, returns one JSON-ready dict
  decks/mage/             meanings.md, deck.json, images/
  spreads/*.json          one file per spread
tests/                   python -m unittest discover -s tests
```

## Porting

The page only fetches `data.json`, which sits next to it. Everything else is
a static file, and image paths in that JSON are relative to the page. To
move a tool somewhere else:

- **Static hosting:** run `python serve.py --build dist`. This copies the
  pages and data files and writes each `data.json` ahead of time. Serve
  `dist/` from anywhere.
- **Django:** put `apps/tarot/` where Django serves static files, and add a
  view at `.../tarot/data.json` that returns
  `JsonResponse(apps.tarot.data.build_data())`. `data.py` uses only the
  standard library.

## Tests

```sh
python -m unittest discover -s tests
```
