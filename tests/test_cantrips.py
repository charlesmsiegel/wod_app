import copy
import json
import sys
import tempfile
import threading
import unittest
import urllib.request
from collections import Counter
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


class CantripCatalogueTests(unittest.TestCase):
    def loader(self):
        from apps.cantrips import data
        return data

    def test_catalogue_keeps_all_cards_and_honest_source_gaps(self):
        payload = self.loader().build_data()
        cards = payload['cards']
        self.assertEqual(len(cards), 168)
        self.assertEqual(len({c['id'] for c in cards}), 168)
        self.assertEqual(Counter(c['category'] for c in cards),
                         {'Art': 30, 'Bunks': 103, 'Realms': 25, 'Treasure': 10})
        self.assertEqual(sum(bool(c['source']['front']) for c in cards), 157)
        self.assertEqual(sum(not c['source']['back'] for c in cards if c['category'] == 'Realms'), 2)
        for card in cards:
            self.assertTrue(card['summary'], card['id'])
            for side in ('frontImage', 'backImage'):
                if card[side]:
                    self.assertTrue(card[side].startswith('images/'))
        for card in cards:
            if card['family'] == 'Nightmare' and card['name'] != 'Headaches':
                self.assertFalse(card['source']['front'])
                self.assertEqual(card['recovery'], 'missing-confirmed-front')

    def test_printed_names_preserve_checklist_aliases(self):
        cards = {c['name']: c for c in self.loader().build_data()['cards']}
        for name, alias in [('Flicker Flash', 'Flicher Flash'),
                            ('Protocol', 'Protocol Sovereign'),
                            ('Orb of Coulion', 'Orb of Ebullion')]:
            self.assertIn(alias, cards[name]['aliases'])
        graffiti = cards['Graffiti']
        self.assertEqual((graffiti['level'], graffiti['successes']), (3, 3))
        self.assertEqual((cards['Gnis Gnos']['level'], cards['Gnis Gnos']['successes']), (1, 2))
        self.assertEqual(cards['Protocol']['attribute'], 'Charisma')
        self.assertEqual(cards['Raw Material']['ability'], 'Science')

    def fixture(self, directory):
        loader = self.loader()
        catalogue = json.loads((loader.APP_DIR / 'catalogue.json').read_text(encoding='utf-8'))
        tiny = copy.deepcopy(catalogue)
        tiny['cards'] = [tiny['cards'][0]]
        Path(directory, 'catalogue.json').write_text(json.dumps(tiny), encoding='utf-8')
        return tiny

    def test_replaceable_slots_quote_relative_urls(self):
        with tempfile.TemporaryDirectory() as temporary:
            tiny = self.fixture(temporary)
            tiny['cards'][0]['front'] = 'images/custom/Face #1%.png'
            Path(temporary, 'catalogue.json').write_text(json.dumps(tiny), encoding='utf-8')
            image = Path(temporary, tiny['cards'][0]['front'])
            image.parent.mkdir(parents=True)
            image.write_bytes(b'local-test-image')
            card = self.loader().build_data(temporary)['cards'][0]
            self.assertEqual(card['frontImage'], 'images/custom/Face%20%231%25.png')
            self.assertEqual(card['backKind'], 'text')

    def test_image_paths_are_confined_and_never_urls_or_hidden(self):
        with tempfile.TemporaryDirectory() as temporary:
            tiny = self.fixture(temporary)
            for unsafe in ['../outside.png', '/outside.png', 'C:/outside.png',
                           'images/../../outside.png', 'https://example.com/image.png',
                           'images/.private/card.png', 'images\\card.png']:
                with self.subTest(unsafe=unsafe):
                    tiny['cards'][0]['front'] = unsafe
                    Path(temporary, 'catalogue.json').write_text(json.dumps(tiny), encoding='utf-8')
                    with self.assertRaises(ValueError):
                        self.loader().build_data(temporary)

    def test_duplicate_identity_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            tiny = self.fixture(temporary)
            tiny['cards'] *= 2
            Path(temporary, 'catalogue.json').write_text(json.dumps(tiny), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'duplicate'):
                self.loader().build_data(temporary)


class CantripIntegrationTests(unittest.TestCase):
    def test_generated_route_and_head(self):
        import serve
        server = ThreadingHTTPServer(('127.0.0.1', 0), serve.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            url = f'http://127.0.0.1:{server.server_port}/apps/cantrips/data.json'
            with urllib.request.urlopen(url) as response:
                self.assertEqual(len(json.load(response)['cards']), 168)
            with urllib.request.urlopen(urllib.request.Request(url, method='HEAD')) as response:
                self.assertEqual(response.status, 200)
                self.assertIn('application/json', response.headers['Content-Type'])
                self.assertEqual(response.read(), b'')
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_static_build_contains_data_and_client(self):
        import serve
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary, 'site')
            serve.build(out)
            self.assertEqual(len(json.loads((out / 'apps/cantrips/data.json').read_text(encoding='utf-8'))['cards']), 168)
            self.assertTrue((out / 'apps/cantrips/index.html').is_file())
            self.assertTrue((out / 'apps/cantrips/cantrips.js').is_file())
            self.assertFalse((out / 'apps/cantrips/data.py').exists())


class CantripImporterTests(unittest.TestCase):
    loader = CantripCatalogueTests.loader
    fixture = CantripCatalogueTests.fixture
    def test_import_copies_only_confirmed_slots_and_preserves_existing_replacements(self):
        from apps.cantrips.import_images import import_images
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            app = root / 'app'
            app.mkdir()
            tiny = self.fixture(app)
            tiny['cards'][0]['source'].update(front='cards/front.png', back='', ai='cards/front_ai_.png')
            (app / 'catalogue.json').write_text(json.dumps(tiny), encoding='utf-8')
            source = root / 'source'
            (source / 'cards').mkdir(parents=True)
            (source / 'cards/front.png').write_bytes(b'faithful')
            (source / 'cards/front_ai_.png').write_bytes(b'AI')
            report = import_images(source, app, dry_run=True)
            target = app / tiny['cards'][0]['front']
            self.assertEqual(report['planned'], 1)
            self.assertFalse(target.exists())
            report = import_images(source, app)
            self.assertEqual(report['copied'], 1)
            self.assertEqual(target.read_bytes(), b'faithful')
            target.write_bytes(b'my replacement')
            import_images(source, app)
            self.assertEqual(target.read_bytes(), b'my replacement')
            self.assertFalse(any('_ai_' in p.name for p in app.rglob('*')))


if __name__ == '__main__':
    unittest.main()
