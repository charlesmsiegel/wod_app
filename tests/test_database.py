import os
import unittest

from wod_app.database import Database


class TestDatabase(unittest.TestCase):
    def setUp(self) -> None:
        self.db = Database('temp_db.sqlite')
        return super().setUp()

    def tearDown(self) -> None:
        self.db.connection.close()
        os.remove('temp_db.sqlite')
        return super().tearDown()

    def test_create_table(self):
        # TODO: create test for creating tables
        pass

    def test_insert_row(self):
        # TODO: create test for inserting row
        pass
