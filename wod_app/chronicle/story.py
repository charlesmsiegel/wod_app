from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
chronicles = load_tables(engine)['chronicles']

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

    def __repr__(self) -> str:
        return self.name

Base.metadata.create_all(engine)
