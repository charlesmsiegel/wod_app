import sqlite3
import os


class Database:
    def __init__(
        self,
        database_file: str,
    ) -> None:
        self.filename = database_file
        self.connection = sqlite3.connect(self.filename)
        self.cursor = self.connection.cursor()
        self.create_data_tables()

    def create_data_tables(self):
        # TODO: write function create_data_tables
        # TODO: Write function so that it creates a table from args
        query = """
        CREATE TABLE IF NOT EXISTS chronicles (
            chronicle_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            storyteller TEXT NOT NULL,
            theme TEXT NOT NULL,
            mood TEXT NOT NULL
        );
        """
        self.cursor.execute(query)

    def create_record(self, table_name, prop_names, vector):
        # TODO: write function to create_record
        names = ",".join(prop_names)

        props = map(str, vector)
        props = [f"'{x}'" for x in props]
        props = ",".join(props)
        query = f"""
        INSERT INTO {table_name} ({names}) 
        VALUES ({props})
        """
        self.cursor.execute(query)
        self.connection.commit()

    def load_table(self, table_name):
        query = f"""
        SELECT * FROM {table_name}
        """
        return self.cursor.execute(query)

    def get_record(self, table_name, object_id):
        query = f"""
        SELECT * from {table_name} WHERE id = {object_id}
        """
        return self.cursor.execute(query)
