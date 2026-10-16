import json
import shutil
import sys
import tempfile
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from apps.tarot import data  # noqa: E402

MAGE = ROOT / "apps" / "tarot" / "decks" / "mage"


def mage_deck():
    return data.parse_meanings((MAGE / "meanings.md").read_text(encoding="utf-8"))


class MageDeckTextTests(unittest.TestCase):
    """The transcribed Mage Tarot text parses into a complete deck."""

    @classmethod
    def setUpClass(cls):
        cls.parsed = mage_deck()
        cls.cards = cls.parsed["cards"]

    def test_has_all_78_cards(self):
        self.assertEqual(len(self.cards), 78)

    def test_major_arcana_numbered_0_to_21(self):
        majors = [c for c in self.cards if c["arcana"] == "major"]
        self.assertEqual([c["number"] for c in majors], list(range(22)))
        self.assertEqual(majors[0]["name"], "The Fool")
        self.assertEqual(majors[21]["name"], "Gaia")

    def test_each_suit_has_ace_to_king(self):
        self.assertEqual([s["id"] for s in self.parsed["suits"]],
                         ["questing", "primordialism", "dynamism", "pattern"])
        for suit in self.parsed["suits"]:
            ranks = [c["rank"] for c in self.cards if c["suit"] == suit["id"]]
            self.assertEqual(ranks, data.RANKS, suit["id"])
            self.assertTrue(suit["fields"]["tarot suit"])
            self.assertTrue(suit["fields"]["faction"])

    def test_every_card_has_its_text(self):
        for card in self.cards:
            for field in ("meaning", "upright", "reversed", "association"):
                self.assertTrue(card[field], f"{card['name']} has no {field}")
            self.assertTrue(card["text"], f"{card['name']} has no description")

    def test_subtitles_are_split_from_names(self):
        knight = next(c for c in self.cards if c["id"] == "knight-of-pattern")
        self.assertEqual(knight["name"], "Knight of Pattern")
        self.assertEqual(knight["subtitle"], "Cyberknight")

    def test_court_cards_flagged(self):
        courts = [c["name"] for c in self.cards if c.get("court")]
        self.assertEqual(len(courts), 16)


class ParserTests(unittest.TestCase):
    def test_minimal_deck(self):
        parsed = data.parse_meanings(
            "# Tiny\n\nA test deck.\n\n# Major Arcana\n\n## 0 The Fool\n"
            "Meaning: Possibility\nUpright: Courage\nReversed: Folly\nAssociation: Marauders\n\n"
            "**The Faerie:** Clad in vestments.\n\nSecond paragraph.\n\n"
            "# Questing\nTarot Suit: Wands\n\nSuit text.\n\n## Ace of Questing\nMeaning: Birth\n")
        self.assertEqual(parsed["deck"]["name"], "Tiny")
        fool, ace = parsed["cards"]
        self.assertEqual(fool["text"], ["**The Faerie:** Clad in vestments.", "Second paragraph."])
        self.assertEqual(ace["suit"], "questing")
        self.assertEqual(ace["rank"], "ace")
        self.assertEqual(parsed["suits"][0]["description"], ["Suit text."])

    def test_unknown_field_is_an_error(self):
        with self.assertRaisesRegex(ValueError, "unknown field"):
            data.parse_meanings("# D\n\n# Major Arcana\n## 0 The Fool\nMeening: typo\n")

    def test_major_without_number_is_an_error(self):
        with self.assertRaisesRegex(ValueError, "needs a number"):
            data.parse_meanings("# D\n\n# Major Arcana\n## The Fool\nMeaning: x\n")

    def test_duplicate_cards_are_an_error(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            data.parse_meanings("# D\n\n# Major Arcana\n## 0 The Fool\n## 0 The Fool\n")


class ImageMatchingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parsed = mage_deck()
        cls.cards, cls.suits = parsed["cards"], parsed["suits"]

    def match(self, *filenames):
        return data.match_images(self.cards, self.suits, list(filenames))

    def test_common_naming_styles(self):
        cases = {
            "The Fool.jpg": "the-fool",
            "00-the-fool.png": "the-fool",
            "fool.webp": "the-fool",
            "XXI Gaia.jpg": "gaia",
            "21_gaia.jpg": "gaia",
            "Six of Pattern.jpg": "six-of-pattern",
            "six_of_pentacles.jpg": "six-of-pattern",
            "pentacles-06.jpg": "six-of-pattern",
            "cups 3.jpg": "three-of-primordialism",
            "three-of-primordial.jpg": "three-of-primordialism",
            "Queen of Dynamism (Sibil).jpg": "queen-of-dynamism",
            "swords_queen.jpg": "queen-of-dynamism",
            "wands 1.jpg": "ace-of-questing",
            "45-king-of-questing.jpg": "king-of-questing",
        }
        for filename, card_id in cases.items():
            matches, _, unmatched = self.match(filename)
            self.assertEqual(matches.get(card_id), filename, filename)
            self.assertEqual(unmatched, [], filename)

    def test_back_and_unmatched(self):
        matches, back, unmatched = self.match("card-back.jpg", "notes.png", "The Star.jpg")
        self.assertEqual(back, "card-back.jpg")
        self.assertEqual(unmatched, ["notes.png"])
        self.assertEqual(matches, {"the-star": "The Star.jpg"})

    def test_second_image_for_same_card_is_reported(self):
        matches, _, unmatched = self.match("the-star.jpg", "The Star.png")
        self.assertEqual(len(matches), 1)
        self.assertEqual(len(unmatched), 1)

    def test_image_field_overrides_matching(self):
        cards = [dict(c) for c in self.cards]
        star = next(c for c in cards if c["id"] == "the-star")
        star["imageFile"] = "scan_017.jpg"
        matches, _, unmatched = data.match_images(cards, self.suits, ["scan_017.jpg"])
        self.assertEqual(matches, {"the-star": "scan_017.jpg"})
        self.assertEqual(unmatched, [])


class SpreadTests(unittest.TestCase):
    def test_bundled_spreads_load(self):
        spreads = data.load_spreads(data.APP_DIR / "spreads")
        ids = [s["id"] for s in spreads]
        self.assertIn("celtic-cross", ids)
        celtic = spreads[ids.index("celtic-cross")]
        dealt = [p for p in celtic["positions"] if not p["significator"]]
        self.assertEqual(len(dealt), 10)
        self.assertEqual(sum(p["significator"] for p in celtic["positions"]), 1)
        for spread in spreads:
            labels = [p["label"] for p in spread["positions"]]
            self.assertEqual(len(labels), len(set(labels)), spread["id"])

    def test_invalid_spread_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.json"
            path.write_text(json.dumps({"name": "Bad", "positions": [{"label": "One", "x": 0}]}))
            with self.assertRaisesRegex(ValueError, "missing 'y'"):
                data.load_spread(path)


class BuildDataTests(unittest.TestCase):
    def test_app_without_images_still_builds(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = Path(tmp)
            (app / "decks" / "mage").mkdir(parents=True)
            shutil.copy(MAGE / "meanings.md", app / "decks" / "mage" / "meanings.md")
            shutil.copytree(data.APP_DIR / "spreads", app / "spreads")
            built = data.build_data(app)
            deck = built["decks"][0]
            self.assertEqual(len(deck["missingImages"]), 78)
            self.assertIsNone(deck["back"])
            self.assertTrue(all(c["image"] is None for c in deck["cards"]))
            json.dumps(built)

    def test_image_urls_are_relative_to_the_app(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = Path(tmp)
            images = app / "decks" / "mage" / "images"
            images.mkdir(parents=True)
            shutil.copy(MAGE / "meanings.md", images.parent / "meanings.md")
            (images / "The Fool.jpg").write_bytes(b"")
            (images / "The#Star?.jpg").write_bytes(b"")
            (app / "spreads").mkdir()
            shutil.copy(data.APP_DIR / "spreads" / "single-card.json", app / "spreads")
            deck = data.build_data(app)["decks"][0]
            cards = {c["id"]: c for c in deck["cards"]}
            self.assertEqual(cards["the-fool"]["image"], "decks/mage/images/The%20Fool.jpg")
            # Reserved URL characters in a file name are encoded, not read as a fragment or query.
            self.assertEqual(cards["the-star"]["image"], "decks/mage/images/The%23Star%3F.jpg")
            self.assertEqual(deck["aspect"], 0.575)


    def test_hidden_decks_spreads_and_images_are_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = Path(tmp)
            images = app / "decks" / "mage" / "images"
            images.mkdir(parents=True)
            shutil.copy(MAGE / "meanings.md", images.parent / "meanings.md")
            (images / "._The Fool.jpg").write_bytes(b"")  # macOS AppleDouble file
            (images / "The Fool.jpg").write_bytes(b"")
            private = app / "decks" / ".private"
            private.mkdir()
            shutil.copy(MAGE / "meanings.md", private / "meanings.md")
            (app / "spreads").mkdir()
            shutil.copy(data.APP_DIR / "spreads" / "single-card.json", app / "spreads")
            (app / "spreads" / ".draft.json").write_text("not json")
            built = data.build_data(app)
            self.assertEqual([d["id"] for d in built["decks"]], ["mage"])
            self.assertEqual([s["id"] for s in built["spreads"]], ["single-card"])
            deck = built["decks"][0]
            fool = next(c for c in deck["cards"] if c["id"] == "the-fool")
            self.assertEqual(fool["image"], "decks/mage/images/The%20Fool.jpg")
            self.assertEqual(deck["unmatchedImages"], [])


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import serve
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), serve.Handler)
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def get(self, path):
        with urllib.request.urlopen(self.base + path) as response:
            return response.status, response.read()

    def test_pages_and_data(self):
        self.assertEqual(self.get("/")[0], 200)
        status, body = self.get("/apps/tarot/")
        self.assertEqual(status, 200)
        self.assertIn(b"tarot.js", body)
        status, body = self.get("/apps/tarot/data.json")
        payload = json.loads(body)
        self.assertEqual(len(payload["decks"][0]["cards"]), 78)

    def test_hidden_files_are_not_served(self):
        for path in ("/.git/config", "/%2egit/config", "/%2Egit/HEAD", "/apps/%2e%2e/.git/config"):
            with self.assertRaises(urllib.error.HTTPError, msg=path) as caught:
                self.get(path)
            self.assertEqual(caught.exception.code, 404, path)

    def test_head_on_generated_data(self):
        request = urllib.request.Request(self.base + "/apps/tarot/data.json", method="HEAD")
        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Content-Type"], "application/json; charset=utf-8")
            self.assertGreater(int(response.headers["Content-Length"]), 0)
            self.assertEqual(response.read(), b"")


class StaticBuildTests(unittest.TestCase):
    def test_build_writes_data_json(self):
        import serve
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "site"
            serve.build(out)
            payload = json.loads((out / "apps" / "tarot" / "data.json").read_text(encoding="utf-8"))
            self.assertEqual(len(payload["decks"][0]["cards"]), 78)
            self.assertTrue((out / "apps" / "tarot" / "index.html").exists())
            self.assertFalse((out / "apps" / "tarot" / "data.py").exists())

    def test_build_leaves_out_hidden_files(self):
        import serve
        secret = serve.ROOT / "apps" / "tarot" / ".env-test-secret"
        hidden_dir = serve.ROOT / "apps" / "tarot" / ".hidden-test-dir"
        secret.write_text("SECRET=1")
        hidden_dir.mkdir()
        (hidden_dir / "file.txt").write_text("x")
        try:
            with tempfile.TemporaryDirectory() as tmp:
                out = Path(tmp) / "site"
                serve.build(out)
                self.assertFalse((out / "apps" / "tarot" / secret.name).exists())
                self.assertFalse((out / "apps" / "tarot" / hidden_dir.name).exists())
        finally:
            secret.unlink()
            shutil.rmtree(hidden_dir)

    def test_failed_build_keeps_previous_output(self):
        import serve

        def broken():
            raise ValueError("bad spread")

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "site"
            out.mkdir()
            (out / "previous.txt").write_text("still here")
            original = dict(serve.DATA_ROUTES)
            serve.DATA_ROUTES["/apps/tarot/data.json"] = broken
            try:
                with self.assertRaisesRegex(ValueError, "bad spread"):
                    serve.build(out)
            finally:
                serve.DATA_ROUTES.clear()
                serve.DATA_ROUTES.update(original)
            self.assertEqual((out / "previous.txt").read_text(), "still here")
            self.assertEqual(sorted(p.name for p in Path(tmp).iterdir()), ["site"])

    def test_build_replaces_previous_output(self):
        import serve
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "site"
            out.mkdir()
            (out / "stale.txt").write_text("old")
            serve.build(out)
            self.assertFalse((out / "stale.txt").exists())
            self.assertTrue((out / "apps" / "tarot" / "data.json").exists())
            self.assertEqual(sorted(p.name for p in Path(tmp).iterdir()), ["site"])

    def test_build_refuses_to_overwrite_sources(self):
        import serve
        for target in (serve.ROOT, serve.ROOT / "apps", serve.ROOT.parent):
            with self.assertRaises(SystemExit):
                serve.build(target)


if __name__ == "__main__":
    unittest.main()
