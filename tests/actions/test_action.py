import unittest
from wod_app.actions import Action


class TestAction(unittest.TestCase):
    def test_repr(self) -> None:
        c = Action(name="Test Action")
        self.assertEqual(repr(c), "Test Action")
