"""The portable names app survives the normal static-site build."""
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


class LocalLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and 'src' in attrs:
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.assets.append(attrs['href'])
        if tag == 'a':
            self.links.append(attrs.get('href', ''))


class NamesSiteTests(unittest.TestCase):
    def test_built_homepage_links_to_names_after_garou(self):
        import serve
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / 'site'
            serve.build(target)
            homepage = LocalLinks()
            homepage.feed((target / 'index.html').read_text(encoding='utf-8'))
            self.assertIn('apps/names/', homepage.links)
            self.assertGreater(homepage.links.index('apps/names/'),
                               homepage.links.index('apps/garou/'))
            page = target / 'apps' / 'names' / 'index.html'
            self.assertTrue(page.is_file())
            document = LocalLinks()
            document.feed(page.read_text(encoding='utf-8'))
            self.assertEqual(len(document.assets), 4)
            for link in document.assets:
                self.assertFalse(link.startswith(('/', 'http:','https:')))
                self.assertTrue((page.parent / link.split('?', 1)[0]).is_file(), link)


if __name__ == '__main__':
    unittest.main()
