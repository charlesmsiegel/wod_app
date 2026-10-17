# Cantrip card artwork

This directory includes 221 verified image files from the confirmed faithful
archive mappings: 157 card fronts and 154 printed-reverse slots. The 311 installed
sides share files where the published backs are identical. The app uses text
fallbacks for unavailable sides and also works without artwork.

From the repository root, import the confirmed faithful archive:

```powershell
python -m apps.cantrips.import_images "C:/Users/charl/OneDrive/Desktop/cantrip cards" --dry-run
python -m apps.cantrips.import_images "C:/Users/charl/OneDrive/Desktop/cantrip cards"
```

The 168 records in `../catalogue.json` are the editable manifest. `front` and
`back` name the exact app-relative destination slots; `source.front` and
`source.back` document their original archive paths. The importer copies only
those confirmed faithful mappings, never `source.ai` or partial candidates.
The source SHA-256 fields describe the archive's original recovered inputs;
the ready-to-use PNG files can have different hashes from those original files.
Identical ordinary Bunk backs share `images/bunk-back.png`. Individual Art,
Realm and Treasure reverses contain their own text and stay paired to each card.
The two incorrect Nature text reverses and eleven unrecovered Nightmare fronts
remain missing. Nightmare backs are also unavailable in this archive.

Replace an image in its slot and reload, or edit its manifest path to another file
under `images/`. PNG, JPG, JPEG, WebP, GIF, AVIF and SVG are supported. Paths must
be relative, visible and confined to this directory. Spaces, `#` and `%` in file
names are percent-encoded by the loader. Existing custom replacements survive
imports unless `--replace` is requested.

The importer runs only when explicitly invoked on your local archive. The web
app and static build never read that external folder. A clean checkout includes
the verified images, and the static build copies them with the app. Replacements
can be committed at the same paths without changing the card catalogue.
