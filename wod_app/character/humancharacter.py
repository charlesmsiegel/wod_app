from sqlalchemy import Column, Integer, ForeignKey, Text, PickleType, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from .character import Character
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
tables = load_tables(engine)


Base = declarative_base()


class HumanCharacter(Character):
    """Class for human characters. Provides the
    human_character table.
    """
    __tablename__ = "human_characters"

    id = Column(Integer, ForeignKey('characters.id'), primary_key=True)

    
    nature = Column(Text())
    demeanor = Column(Text())

    specialties = Column(PickleType)

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
    
    # TODO: Common Abilities
    # TODO: Common Backgrounds

    willpower = Column(Integer(), default=3)
    temporary_willpower = Column(Integer(), default=3)

    bashing_levels = Column(Integer(), default=0)
    lethal_levels = Column(Integer(), default=0)
    aggravated_levels = Column(Integer(), default=0)

    health_tracker = [0, 0, -1, -1, -2, -2, -5, -1000]

    # TODO: merits_and_flaws, languages

    xp = Column(Integer(), default=0)
    spent_xp = Column(Integer(), default=0)
    notes = Column(Text())
    childhood = Column(Text())
    history = Column(Text())
    goals = Column(Text())
    age = Column(Integer())
    apparent_age = Column(Integer())
    date_of_birth = Column(Date())
    hair = Column(Text())
    eyes = Column(Text())
    ethnicity = Column(Text())
    nationality = Column(Text())
    height = Column(Float())
    weight = Column(Integer())
    sex = Column(Text())
    description = Column(Text())

    def health(self) -> int:
        return self.bashing_levels + self.lethal_levels + self.aggravated_levels

    def health_penalty(self) -> int:
        return self.health_tracker[self.health()]

    __mapper_args__ = {
        'polymorphic_identity': 'human_character',
    }

    def __repr__(self) -> str:
        return self.name


Character.metadata.create_all(engine)
