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
        # TODO: write function create_data_tables
        pass

    def create_record(self, table_name, object):
        # TODO: write function to create_record
        pass
    
    def load_table(self, table_name):
        query = f"""
        SELECT * FROM {table_name}
        """
        return self.connection.execute(query)

    def get_record(self, table_name, object_id):
        query = f"""
        SELECT * from {table_name} WHERE id = {object_id}
        """
        return self.connection.execute(query)
