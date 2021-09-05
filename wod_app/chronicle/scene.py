import json
from sqlalchemy import Table, Column, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.sql.schema import ForeignKey


with open('config.json', 'r') as f:
    config = json.load(f)


engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()

class Scene(Base):
    """Class providing the table 'scenes' This stores the relevant information
    for a scene."""
    __tablename__ = 'scenes'
    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    date = Column(DateTime())
    # story = Column(ForeignKey('stories.id'))
    # location,
    # characters,

Base.metadata.create_all(engine)
