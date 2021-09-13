import unittest
from wod_app.character import Character


class TestCharacter(unittest.TestCase):
    def test_repr(self) -> None:
        c = Character(name="Test Character")
        self.assertEqual(repr(c), "Test Character")