import sqlite3
import os

class Database:
    def __init__(
        self,
        database_file: str,
        ) -> None:
        self.filename = database_file
        if not os.path.exists(self.filename):
            self.create_data_tables()
        self.connection = sqlite3.connect(self.filename)

    def create_data_tables(self):
        pass
