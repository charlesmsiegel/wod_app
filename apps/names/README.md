# Names of the Awakened: implementation note

The model has two independent parts: a canonical arithmetic procedure on an
explicitly restricted handle alphabet, and a composition rule on supplied
Hermetic names. `names-core.js` contains pure calculations and composition;
`names.js` reads fields and renders only through `textContent`. The browser
never interprets a supplied name as markup or persists a name. The normal
static-site copier already handles this folder; no server route is needed.

Adept values follow *Tradition Book: Virtual Adepts Revised*, printed 43–45
(PDF 44–46), particularly printed 44. The rounding table is explicit so
root 1 maps to result 0 / Primordial. Unicode transliteration and values for
digits 1–9 would invent rules; unsupported inputs fail visibly instead.

Hermetic composition follows *Tradition Book: Order of Hermes Revised*,
printed 69 (PDF 71). The craft preview preserves the supplied public name;
birth-name insertion builds the full Shadow Name, then titles follow. A
one-word craft name places the birth name directly after it. A
manual override replaces the insertion without duplicating the birth name.
The True Name appends the prescribed Latin phrase and ten secret syllables.

The onset / vowel / coda generator and four grouping lengths are original
interface choices, not book tables. Each of ten slots stands for one intended
syllable. Manual edits preserve boundaries without any English pronunciation
heuristic. The sound combinations have no assigned meaning; accidental
real-language word matches cannot be excluded. Generation uses browser
`crypto.getRandomValues` with rejection sampling and has no weak RNG fallback.
Other Hermetic name scripts are preserved, while syllable slots use ASCII
letters for explicit delimiter-free editing.

Tests: `node --test tests/test_names.mjs` checks all nine roots, the published
C0y0te arithmetic, invalid alphabets / zeros, insertion / override / titles,
immutable edits, and repeated random ten-syllable outputs. The Python suite
builds a static site and resolves the homepage link and local script / style
URLs. Clipboard access still depends on browser permissions; manual selection
remains possible when unavailable. Screen-reader announcements and responsive
layout need real-browser review in addition to these deterministic tests.
