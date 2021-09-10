import unittest
from wod_app.chronicle import Scene


class TestScene(unittest.TestCase):
    def test_repr(self) -> None:
        s = Scene(name="Test Scene")
        self.assertEqual(repr(s), "Test Scene")
