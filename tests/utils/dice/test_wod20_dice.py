"""
Simple class to This module collects all tests for diceroller
"""


from unittest import TestCase, mock
from unittest.mock import Mock
from wod_app.utils.dice import wod20_diceroller


class DicerollerTest(TestCase):
    """
    Tests the diceroller's functionality
    """
    def test_botch(self):
        mocker = Mock()
        mocker.side_effect = [1, 1, 3, 4, 5]
        with mock.patch('random.randint', mocker):
            self.assertEqual(wod20_diceroller(5), -2)

    def test_failure_with_1s(self):
        mocker = Mock()
        mocker.side_effect = [1, 1, 7, 4, 5]
        with mock.patch('random.randint', mocker):
            self.assertEqual(wod20_diceroller(5), 0)

    def test_failure(self):
        mocker = Mock()
        mocker.side_effect = [4, 2, 3, 4, 5]
        with mock.patch('random.randint', mocker):
            self.assertEqual(wod20_diceroller(5), 0)

    def test_success(self):
        mocker = Mock()
        mocker.side_effect = [6, 7, 3, 4, 5]
        with mock.patch('random.randint', mocker):
            self.assertEqual(wod20_diceroller(5), 2)

    def test_specialty(self):
        mocker = Mock()
        mocker.side_effect = [10, 10, 3, 6, 5]
        with mock.patch('random.randint', mocker):
            self.assertEqual(wod20_diceroller(5, specialty=True), 5)

    def test_difficulty(self):
        mocker = Mock()
        mocker.side_effect = [4, 2, 3, 4, 5]
        with mock.patch('random.randint', mocker):
            self.assertEqual(wod20_diceroller(5, difficulty=5), 1)
