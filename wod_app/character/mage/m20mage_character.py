import json
from sqlalchemy import Table, Column, Integer, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from character import Character

with open('config.json', 'r') as f:
    config = json.load(f)


engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()


class M20MageCharacter(Character):
    """Class for Mage characters under M20 rules. Provides the
    m20_mage_character table.
    """
    __tablename__ = "m20_mage_character"
    # Abilities
    ## Talents
    alertness = Column(Integer(), default=0)
    art = Column(Integer(), default=0)
    athletics = Column(Integer(), default=0)
    awareness = Column(Integer(), default=0)
    brawl = Column(Integer(), default=0)
    empathy = Column(Integer(), default=0)
    expression = Column(Integer(), default=0)
    intimidation = Column(Integer(), default=0)
    leadership = Column(Integer(), default=0)
    streetwise = Column(Integer(), default=0)
    subterfuge = Column(Integer(), default=0)
    ## Skills
    crafts = Column(Integer(), default=0)
    drive = Column(Integer(), default=0)
    etiquette = Column(Integer(), default=0)
    firearms = Column(Integer(), default=0)
    martial_arts = Column(Integer(), default=0)
    meditation = Column(Integer(), default=0)
    melee = Column(Integer(), default=0)
    research = Column(Integer(), default=0)
    stealth = Column(Integer(), default=0)
    survival = Column(Integer(), default=0)
    technology = Column(Integer(), default=0)
    ## Knowledges
    academics = Column(Integer(), default=0)
    computer = Column(Integer(), default=0)
    cosmology = Column(Integer(), default=0)
    enigmas = Column(Integer(), default=0)
    esoterica = Column(Integer(), default=0)
    investigation = Column(Integer(), default=0)
    law = Column(Integer(), default=0)
    medicine = Column(Integer(), default=0)
    occult = Column(Integer(), default=0)
    politics = Column(Integer(), default=0)
    science = Column(Integer(), default=0)

    arete = Column(Integer(), default=1)

    # Spheres
    correspondence = Column(Integer(), default=0)
    entropy = Column(Integer(), default=0)
    forces = Column(Integer(), default=0)
    life = Column(Integer(), default=0)
    matter = Column(Integer(), default=0)
    mind = Column(Integer(), default=0)
    prime = Column(Integer(), default=0)
    spirit = Column(Integer(), default=0)
    time = Column(Integer(), default=0)

    willpower = Column(Integer(), default=5)
    temporary_willpower = Column(Integer(), default=5)

    quintessences = Column(Integer(), default=0)
    paradox = Column(Integer(), default=0)
    permanent_paradox = Column(Integer(), default=0)

    __mapper_args__ = {
        'polymorphic_identity':'m20_mage_character',
    }

Base.metadata.create_all(engine)
