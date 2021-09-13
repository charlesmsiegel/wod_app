import json
from sqlalchemy import Table, Column, Integer, Text, ForeignKey, MetaData
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


class Action(Base):
    """Provides the base class Action on the table actions. Will be
    extended to every other action type
    """
    __tablename__ = "actions"
    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    type = Column(Text())
    roll = Column(Text())
    difficulty = Column(Integer(), default=6)

    __mapper_args__ = {
        'polymorphic_identity': 'action',
        'polymorphic_on': "type"
    }

    def __repr__(self) -> str:
        return self.name


Base.metadata.create_all(engine)
