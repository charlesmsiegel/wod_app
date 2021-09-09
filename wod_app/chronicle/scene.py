import json
from sqlalchemy import Table, Column, Integer, Text, DateTime, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.sql.schema import ForeignKey
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
stories = load_tables(engine)['stories']

Base = declarative_base()

class Scene(Base):
    """Class providing the table 'scenes' This stores the relevant information
    for a scene."""
    __tablename__ = 'scenes'
    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    date = Column(DateTime())
    story = Column(ForeignKey(stories.c.id))
    # location,
    # characters,

Base.metadata.create_all(engine)
