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

The \`apps/garou/\` app includes three compact experiences:

- **Night sky:** enter a local date/time and coordinates, or permit browser
  geolocation, to see real astronomical positions for selected stars,
  constellations, the Moon, Sun, and planets on a north-up azimuth/altitude
  chart. The sky catalogue is intentionally curated rather than exhaustive.
- **Umbral overlay:** **Step sideways** toggles between the ordinary physical
  sky and a Garou interpretation of it. The overlay adds sourcebook-grounded
  tribal constellation lore (e.g., Diana for Orion among the Black Furies,
  Fenris for Ursa Major among the Get, the Fianna's Plough), spirit-star
  names (Matagar/Sirius and Vegarda/Polaris), and the ancestral Milky Way
  for Uktena and Wendigo. Choose a tribe to focus its traditions.
  **Anthelios is off by default**, as it belongs to an Apocalypse-era
  storyline; when shown its position is deliberately *illustrative*, in
  the general sector between Ursa Major and Leo, not a real coordinate.
  Vulcan/Hakahe, Rorg, Songan and Yakecen are **unlocated Umbral features**,
  not false entries in the physical astronomical ephemerides.
- **Lunar calendar:** the Garou year begins with the first full moon *after*
  the northern spring equinox. Exactly 12 full-to-full lunar months receive
  the published patrons Nerigal through Shantar. Any additional lunation
  before the following year is explicitly **unnamed**; Rorg is a thirteenth
  *sign*, not a canonical leap-month patron.
- **Read the heavens:** a short original scene/interpretive prompt using
  lunar patron, phase, and bright constellations, plus optional birth and
  First Change sign readings. These are original prose, not book text.

### Cosmology and precision

The astronomical data is calculated in-browser by [Astronomy Engine](https://github.com/cosinekitty/astronomy), bundled under MIT. Real physical
star positions are calculated from approximate J2000 coordinates and the
Milky Way's actual galactic equator (not a made-up constellation arc).
Umbral objects that lack documented physical positions **never** receive
supposedly exact astronomical coordinates. The optional Anthelios glyph is
only a visible marker of the *region described by the book*; it is explicitly
labeled symbolic in the UI.

The physical chart and the overlay are **different visual modes**, but
neither changes physical sky coordinates. Calendar boundaries use exact
astronomical instants, not fixed civil dates. The northern spring equinox
anchors the calendar even if your observer is in the southern hemisphere.

The lore primarily follows *Rage Across the Heavens* (1999), specifically
pp. 63–81 (printed page numbers) for lunar astrology, tribal constellations,
and other celestial objects. Some short atmospheric interpretations are
original. Users may enable location sharing, but coordinates stay in
browser localStorage only. The site has no server-side account or API key.

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
apps/garou/              static calendar / chart / reading; vendored Astronomy Engine
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

To enable publishing, go to **Settings → Pages → Build and deployment**
and choose **GitHub Actions** as the source. The published pages will be
under `https://charlesmsiegel.github.io/wod_app/` if your GitHub plan and
Pages settings permit it.

**Important:** GitHub Free permits Pages from public repositories; Pages
from a **private source repository** requires GitHub Pro, Team, or Enterprise.
For a personal repository, GitHub Pages is normally **publicly accessible
even when the source repository is private**. The artwork permissions and
any other published data must allow public distribution.

You can inspect the production output locally:

```sh
python serve.py --build dist
python -m http.server --directory dist 8001
```

### Installing the full Mage Tarot deck for Pages

If you have the prepared archive `Mage_Tarot_web_assets_for_wod_app.zip`,
a local checkout can import all 78 optimized card faces and the back:

```sh
python scripts/install_tarot_cards.py Mage_Tarot_web_assets_for_wod_app.zip
python -m unittest discover -s tests
python serve.py --build dist
git add apps/tarot/decks/mage/images/
git commit -m "Add web-optimized Mage Tarot card art"
git push origin main
```

The installer verifies that all 78 card faces match the deck's expected
names, checks the back, and refuses incomplete or unsafe archives.
The zipped art is not committed by this patch, since the GitHub connector
can create text blobs but does not take native binary attachments.
Only publish scans if you have rights to distribute them on the public site.

## Tests

```sh
python -m unittest discover -s tests
node --test tests/test_garou.mjs
node --test tests/test_garou_ui.mjs
```


## Dark Pack

The homepage and both tools include the official Dark Pack logo loaded from
Paradox's official asset CDN, an unofficial-project notice, and the required
copyright/trademark text. This is a free, unofficial fan project. The Dark Pack
agreement limits reproduction of copyrighted material to a reasonable extent;
using its logo does **not** automatically authorize distributing every image
from a commercial tarot deck. Confirm distribution permission for full-card
images before making the public site serve them.
