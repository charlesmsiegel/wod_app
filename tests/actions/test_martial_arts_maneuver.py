import unittest
from wod_app.actions import MartialArtsManeuver


class TestMartialArtsManeuver(unittest.TestCase):
    def test_repr(self) -> None:
        c = MartialArtsManeuver(name="Test MartialArtsManeuver")
        self.assertEqual(repr(c), "Test MartialArtsManeuver")
