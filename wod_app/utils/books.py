from sqlalchemy import Column, Integer, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from .load_config import load_config


config = load_config()
engine = create_engine(config['DB_NAME'])


Base = declarative_base()

class Book(Base):
    """Class providing the table 'books' This stores the relevant information
    for a book entry."""
    __tablename__ = 'books'
    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    game_line = Column(Text())
    edition = Column(Integer())
    community_content = Column(Boolean, default=False)

Base.metadata.create_all(engine)
