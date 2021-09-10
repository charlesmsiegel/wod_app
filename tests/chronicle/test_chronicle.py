import unittest
from wod_app.chronicle import Chronicle


class TestChronicle(unittest.TestCase):
    def test_repr(self) -> None:
        c = Chronicle(name="Test Chronicle")
        self.assertEqual(repr(c), "Test Chronicle")
