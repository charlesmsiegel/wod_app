import os
import unittest
import json

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String
from wod_app.utils import load_config, load_tables


class TestUtilFuncs(unittest.TestCase):
    """Tests the functions in wod_app."""

    def setUp(self) -> None:
        config = {
            "DB_NAME": "sqlite:///tmp.sqlite"
        }
        with open('tmp.json', 'w') as f:
            json.dump(config, f)

    def tearDown(self) -> None:
        if os.path.exists('tmp.json'):
            os.remove('tmp.json')
        if os.path.exists('tmp.sqlite'):
            os.remove('tmp.sqlite')

    def test_load_config(self) -> None:
        config = load_config('tmp.json')
        self.assertEqual(config['DB_NAME'], 'sqlite:///tmp.sqlite')

    def test_load_tables(self) -> None:
        engine = create_engine('sqlite:///tmp.sqlite')
        self.assertEqual(load_tables(engine).keys(), dict().keys())
        meta = MetaData()

        Table(
            'students', meta,
            Column('id', Integer, primary_key=True),
            Column('name', String),
            Column('lastname', String),
        )
        meta.create_all(engine)
        self.assertEqual(load_tables(engine).keys(), {"students": 0}.keys())
