import json
from sqlalchemy import Table, Column, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.sql.schema import MetaData
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Base = declarative_base()


class Chronicle(Base):
    """Base Class that establishes the table 'chronicles'. This stores the
    information for a Chroncile. The rows of the chronicles table are:
        id              Integer     primary key
        name            Text        unique
        storyteller     Text
        mood            Text
        theme           Text
    """
    __tablename__ = "chronicles"

    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    storyteller = Column(Text())
    mood = Column(Text())
    theme = Column(Text())

    def __repr__(self) -> str:
        return self.name


Base.metadata.create_all(engine)
