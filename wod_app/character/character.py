import json
from sqlalchemy import Table, Column, Integer, Text, ForeignKey, PickleType
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
chronicles = load_tables(engine)['chronicles']
Base = declarative_base()


class Character(Base):
    """Provides the base class Character on the table characters. Will be
    extended to every other character type
    """
    __tablename__ = "characters"
    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    player = Column(Text())
    concept = Column(Text())
    chronicle_id = Column(Integer(), ForeignKey(chronicles.c.id))
    type = Column(Text())

    __mapper_args__ = {
        'polymorphic_identity': 'character',
        'polymorphic_on': "type"
    }

    def __repr__(self) -> str:
        return self.name


Base.metadata.create_all(engine)
