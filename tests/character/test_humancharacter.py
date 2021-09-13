import unittest
from wod_app.character import HumanCharacter


class TestCharacter(unittest.TestCase):
    def test_repr(self) -> None:
        c = HumanCharacter(name="Test Character")
        self.assertEqual(repr(c), "Test Character")

    def test_health(self) -> None:
        c = HumanCharacter(name="Test Character", bashing_levels=1,
                           lethal_levels=2, aggravated_levels=2)
        self.assertEqual(c.health(), 5)

    def test_penalty(self) -> None:
        c = HumanCharacter(name="Test Character", bashing_levels=1,
                           lethal_levels=2, aggravated_levels=2)
        self.assertEqual(c.health_penalty(), -2)
