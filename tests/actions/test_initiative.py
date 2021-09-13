import unittest
from unittest import mock
from unittest.mock import Mock
from wod_app.actions import initiative


class TestInitiative(unittest.TestCase):
    def test_init(self):
        mocker = Mock()
        mocker.side_effect = [3]
        with mock.patch('random.randint', mocker):
            self.assertEqual(initiative(3, 2), 8)
