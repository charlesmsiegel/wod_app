"""Smoke tests for the fully static Garou sky experience."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


class GarouSiteTests(unittest.TestCase):
    def test_page_and_scripts_exist(self):
        app = ROOT / "apps" / "garou"
        for path in ("index.html", "garou.js", "garou.css", "sky-data.js",
                     "garou-astro.js", "umbral-data.js", "vendor/astronomy.browser.min.js"):
            with self.subTest(path=path):
                self.assertTrue((app / path).is_file())
        html = (app / "index.html").read_text(encoding="utf-8")
        self.assertIn('id="sky-mode-title"', html)
        self.assertIn('id="anthelios-omen"', html)
        self.assertIn('garou.js?v=', html)
        for script in ("vendor/astronomy.browser.min.js", "sky-data.js",
                       "garou-astro.js", "umbral-data.js", "garou.js"):
            self.assertIn(f'src="{script}', html)

    def test_static_build_includes_both_apps(self):
        import tempfile
        import serve
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "site"
            serve.build(target)
            self.assertTrue((target / "apps" / "tarot" / "data.json").exists())
            self.assertTrue((target / "apps" / "garou" / "index.html").exists())
            self.assertTrue((target / "apps" / "garou" / "umbral-data.js").exists())
            self.assertTrue((target / "apps" / "garou" / "vendor" /
                             "astronomy.browser.min.js").exists())
            homepage = (target / "index.html").read_text(encoding="utf-8")
            self.assertIn("apps/garou/", homepage)
            self.assertIn("apps/tarot/", homepage)


if __name__ == "__main__":
    unittest.main()
