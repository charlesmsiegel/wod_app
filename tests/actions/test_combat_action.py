import unittest
from wod_app.actions import CombatAction


class TestCombatAction(unittest.TestCase):
    def test_repr(self) -> None:
        c = CombatAction(name="Test CombatAction")
        self.assertEqual(repr(c), "Test CombatAction")
