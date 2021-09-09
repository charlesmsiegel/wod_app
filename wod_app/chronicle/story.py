import json
from sqlalchemy import Table, Column, Integer, Text, MetaData, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine


with open('config.json', 'r') as f:
    config = json.load(f)


engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
md = MetaData(bind=engine)
md.reflect()
chronicles = md.tables['chronicles']

Base = declarative_base()

class Story(Base):
    """Class providing the table 'stories' This stores the relevant information
    for a story."""
    __tablename__ = 'stories'
    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    chronicle_id = Column(Integer(), ForeignKey(chronicles.c.id))
    # plot_summary,
    # key_npcs,
    # pcs,
    # key_locations,

Base.metadata.create_all(engine)
