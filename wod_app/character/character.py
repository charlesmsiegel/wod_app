import json
from sqlalchemy import Table, Column, Integer, Text, ForeignKey, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
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
    nature = Column(Text())
    demeanor = Column(Text())
    type = Column(Text())

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

    __mapper_args__ = {
        'polymorphic_identity': 'character',
        'polymorphic_on': "type"
    }


Base.metadata.create_all(engine)
