import unittest
from wod_app.character.mage import M20MageCharacter


class TestM20MageCharacter(unittest.TestCase):
    def test_repr(self) -> None:
        m = M20MageCharacter(name="Test M20MageCharacter")
        self.assertEqual(repr(m), "Test M20MageCharacter")
