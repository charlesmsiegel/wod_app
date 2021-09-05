from sqlalchemy import Table, Column, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import json

with open('config.json', 'r') as f:
    config = json.load(f)


engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()

class Chronicle(Base):
    __tablename__ = "chronicles"

    id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    storyteller = Column(Text())
    mood = Column(Text())
    theme = Column(Text())
    # Location
    # Characters
    # Game Lines
    # Permitted Books

    def __repr__(self) -> str:
        return f"{self.name}"

Base.metadata.create_all(engine)
