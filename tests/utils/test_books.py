import unittest
from wod_app.utils import Book


class TestBook(unittest.TestCase):
    def test_repr(self) -> None:
        b = Book(name="Test Book")
        self.assertEqual(repr(b), "Test Book")
