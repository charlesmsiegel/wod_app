import unittest
from wod_app.chronicle import Story


class TestStory(unittest.TestCase):
    def test_repr(self) -> None:
        s = Story(name="Test Story")
        self.assertEqual(repr(s), "Test Story")
