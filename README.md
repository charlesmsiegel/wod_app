# World of Darkness Tools

Small, atmospheric, self-contained experiences for World of Darkness games.
The tools are plain HTML, CSS and JavaScript, with a small standard-library
Python loader for the Mage Tarot data. They can run locally or be published as
static pages. No account, server-side database or API key is needed.

| Tool | What it does |
|------|--------------|
| [Mage Tarot Reader](apps/tarot/) | Deals spreads with The Mage: the Ascension Tarot and shows what each card means in its position. |
| [Garou Astrology](apps/garou/) | An astronomical Garou lunar calendar, interactive night sky, and compact astrology readings inspired by *Rage Across the Heavens*. |

## Running it

You need Python 3.9 or newer and nothing else.

```sh
python serve.py
```

This starts a local server and opens the tools homepage at
<http://localhost:8000/>. The tarot reader is at `/apps/tarot/` and Garou
astrology at `/apps/garou/`. Use `--port 9000` to pick another port
or `--no-browser` to skip opening a tab. Stop it with Ctrl+C.

Edits to card text, spreads or images show up on a browser reload. There's
no build step and no restart.

## Garou Astrology

The `apps/garou/` app is a compact astronomical almanac inspired by
*Rage Across the Heavens* (1999), with a scalable howling-wolf/moon emblem
in `icon.svg` that also serves as its browser favicon.

- **Physical sky:** Enter any supported date, local time and coordinates
  (or optionally grant browser geolocation) to plot actual bright stars,
  constellations, Sun, Moon and planets in azimuth/altitude coordinates.
- **Step sideways:** Toggle an **Umbral overlay** without changing physical
  sky coordinates. The overlay adds tribe-specific constellation traditions
  (e.g., Orion/Diana for the Black Furies, Ursa Major/Fenris for the Get,
  Ursa Major/The Plough for the Fianna), Garou star names such as
  Vegarda/Polaris and Matagar/Sirius, and the ancestral Milky Way for
  Uktena and Wendigo. A tribal filter highlights relevant stories.
- **Umbral phenomena:** The selected mode always displays a prominent
  **EARTH / UMBRA** state indicator. When "Show Anthelios" is enabled, an
  unmistakable red **Eye of the Wyrm** omen appears below the chart and
  can be selected for its lore even when its illustrative region is
  below the local physical horizon. A red chart marker appears only when
  that *approximate* sector is above the horizon; it is not a measured
  astronomical star coordinate. Hakahe's Vulcan, Rorg, Songan and
  Yakecen remain in the separate Umbral lore collection.
- **Lunisolar Garou calendar:** The first full moon after the northern
  spring equinox opens Nerigal's month. Twelve consecutive full-to-full
  intervals correspond to the patrons Nerigal–Shantar; any extra lunation
  before the following equinox-derived year is clearly left unnamed.
  Rorg is an unofficial *thirteenth sign*, not a canonical leap month.
- **Read the heavens:** Short original Storyteller prompts, current lunar
  auspice, and optional birth/First Change readings.

The astronomical engine runs entirely in the browser via the bundled MIT
[Astronomy Engine](https://github.com/cosinekitty/astronomy). The chart
catalogue is curated, not a complete stellar atlas. Constellation and
spirit lore is based on the book's printed pages 63–81; atmospheric prompts
are original. The app does not contact a location API and keeps optional
location preferences in local browser storage.

### Troubleshooting the live sky

The HTML, CSS, Garou code and sky-lore scripts use a shared versioned URL
to prevent cached pre-overlay JavaScript from being paired with newer HTML.
If the Umbral checkbox appears but the mode indicator remains stuck on
"Preparing the heavens…" or switching sides has no visual effect, use a
hard refresh (Ctrl+Shift+R), then check the page's error message.

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

Drop the image files into `apps/tarot/decks/mage-the-ascension/images/` and reload. Files
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

Artwork can be committed so the static GitHub Pages build includes card
faces and the back. Only add scans with permission for public distribution;
a private source repository does not make the resulting Pages site private.

### Card text: `meanings.md`

`apps/tarot/decks/mage-the-ascension/meanings.md` holds the text of all 78 cards,
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

The **Wraith: The Shroud** spread comes from *Mediums: Speakers With the
Dead*, printed pp. 32–33 (PDF pp. 34–35). A chosen significator for the
departed sits above four cards dealt left to right: Background, Arcanoi,
Fetters and Passions. The existing card panel shows the Wraith-specific
position question alongside the Mage card's usual upright/reversed meanings.
*Mediums* explicitly recommends the Mage Tarot; its example uses reversals.
Choose a representative court card manually, or use the reader's existing
random-court option as a digital convenience.

Preparation is described on printed pp. 29–31 (PDF pp. 31–33). The book
associates Sunday through Saturday with the Penitent, Silent, Skeletal,
Grim, Paupers, Emerald and Iron Legions respectively; Fate is outside this
weekday mapping. The candle colors are orange, pearl, red, yellow, purple,
pink/green and black in that same order. These are optional context for
the reading. The published death-date zodiac guidance can help select a
significator; it is not calculated automatically. Some fictional mediums
reserve Cups/Primordialism for Spectres, but the app imposes no such rule.

The Shroud is an interpretive spread, not a generator of ghost dialogue or
an exact Arcanos/Background rating. The layout and position subjects come
from the book; their question prompts are concise editorial paraphrases.
It reuses the existing shuffle, significator, reversals and card images.

### Adding a deck

Make a new folder beside `decks/mage-the-ascension/` with its own `meanings.md` and
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
  decks/mage-the-ascension/ meanings.md, deck.json, images/
  spreads/*.json          one file per spread
apps/garou/              interactive sky, Umbral overlay, icon.svg, calendar; vendor Astronomy Engine
tests/                   Python + Node astronomical tests
.github/workflows/pages.yml  test, build, and deploy
```

## Porting

The tarot page fetches `data.json`, which sits next to it. The Garou page is
fully static and loads local scripts; both tools use relative URLs. To
move a tool somewhere else:

- **Static hosting:** run `python serve.py --build dist`. This copies the
  pages and data files and writes each `data.json` ahead of time. Serve
  `dist/` from anywhere.
- **Django:** put `apps/tarot/` where Django serves static files, and add a
  view at `.../tarot/data.json` that returns
  `JsonResponse(apps.tarot.data.build_data())`. `data.py` uses only the
  standard library.

## GitHub Pages

The workflow at `.github/workflows/pages.yml` runs the Python suite and
astronomical Node tests, builds the static site and (on `main`) uploads and
deploys the generated `dist/` folder.

GitHub Pages is configured to publish the static build from `main` using
GitHub Actions. The site is available at
`https://charlesmsiegel.github.io/wod_app/`.

The repository and deployed site are public. The 78 Mage Tarot card faces
and back are already tracked under
`apps/tarot/decks/mage-the-ascension/images/`. Do not add the full original
uncompressed TIFF archive to Git history.

You can inspect the production output locally:

```sh
python serve.py --build dist
python -m http.server --directory dist 8001
```

## Tests

```sh
python -m unittest discover -s tests
node --test tests/test_garou.mjs
node --test tests/test_garou_ui.mjs
```


## Dark Pack

All pages display the official Dark Pack logo and required legal notice,
with a statement that this is an unofficial, free fan project. The logo is
loaded from Paradox's asset CDN. This project is not endorsed by Paradox;
users of the site should follow the [Dark Pack agreement](https://www.paradoxinteractive.com/games/world-of-darkness/community/dark-pack-agreement)
and its limits on the reproduction and distribution of copyrighted art.
