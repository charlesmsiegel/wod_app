"""Validate ZIP import of the complete Mage Tarot without checking in test art."""
import io
import sys
import unittest
from pathlib import Path
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from apps.tarot import data  # noqa:E402
from scripts import install_tarot_cards as installer  # noqa:E402


def archive(omit_last=False):
    cards=data.parse_meanings((ROOT/"apps/tarot/decks/mage/meanings.md").read_text(encoding="utf-8"))["cards"]
    names=[c["name"]+".webp" for c in cards]+["back.webp"]
    if omit_last: names.pop(-2)
    contents=io.BytesIO()
    with ZipFile(contents,"w") as z:
        for name in names:
            z.writestr(installer.PREFIX+name,b"RIFF")
        z.writestr("tarot_image_manifest.json","{}")
    contents.seek(0)
    return contents


class TarotAssetImportTests(unittest.TestCase):
    def test_complete_deck_is_accepted(self):
        with ZipFile(archive()) as z:
            members,back=installer.inspect_archive(z)
        self.assertEqual(len(members),79)
        self.assertEqual(back,"back.webp")

    def test_missing_card_rejected(self):
        with ZipFile(archive(omit_last=True)) as z:
            with self.assertRaisesRegex(ValueError,"Expected 78 tarot cards"):
                installer.inspect_archive(z)

    def test_unrelated_files_ignored(self):
        with ZipFile(archive()) as z:
            names=[i.filename for i in z.infolist()]
        self.assertIn("tarot_image_manifest.json",names)


if __name__=="__main__":
    unittest.main()
