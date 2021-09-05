import json
from sqlalchemy import Table, Column, Integer, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

with open('config.json', 'r') as f:
    config = json.load(f)


engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()


class Character(Base):
    __tablename__ = "characters"
    character_id = Column(Integer(), primary_key=True)
    name = Column(Text(), unique=True)
    player = Column(Text())
    chronicle = Column(ForeignKey('chronicle.id'))
    nature = Column(Text())
    demeanor = Column(Text())

    # TODO: How to make specialties part of table?
    specialties = dict()

    # Attributes
    strength = Column(Integer(), default=1)
    dexterity = Column(Integer(), default=1)
    stamina = Column(Integer(), default=1)

    charisma = Column(Integer(), default=1)
    manipulation = Column(Integer(), default=1)
    appearance = Column(Integer(), default=1)

    perception = Column(Integer(), default=1)
    intelligence = Column(Integer(), default=1)
    wits = Column(Integer(), default=1)

    bashing_levels = Column(Integer(), default=0)
    lethal_levels = Column(Integer(), default=0)
    aggravated_levels = Column(Integer(), default=0)

    health_tracker = [0, 0, -1, -1, -2, -2, -5, -1000]

    def health(self) -> int:
        return self.bashing_levels + self.lethal_levels + self.aggravated_levels

    def health_penalty(self) -> int:
        return self.health_tracker[self.health()]


Base.metadata.create_all(engine)
