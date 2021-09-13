from sqlalchemy import Column, Integer, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from .combataction import CombatAction
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
tables = load_tables(engine)


Base = declarative_base()


class MartialArtsManeuver(CombatAction):
    __tablename__ = "martial_arts_maneuvers"

    id = Column(Integer, ForeignKey('combat_actions.id'), primary_key=True)
    style = Column(Text())
    min_martial_arts = Column(Integer(), default=0)
    min_athletics = Column(Integer(), default=0)
    acro_sub = Column(Boolean(), default=False)

    __mapper_args__ = {
        'polymorphic_identity': 'martial_arts_maneuver',
    }

    def __repr__(self) -> str:
        return self.name


CombatAction.metadata.create_all(engine)
