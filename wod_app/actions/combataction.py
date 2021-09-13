from sqlalchemy import Column, Integer, ForeignKey, Text, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from .action import Action
from ..utils import load_config, load_tables


config = load_config()
engine = create_engine(config['DB_NAME'])
Session = sessionmaker(bind=engine)
session = Session()
tables = load_tables(engine)


Base = declarative_base()


class CombatAction(Action):
    __tablename__ = "combat_actions"
    damage = Column(Text())
    damage_type = Column(String(1))
    actions = Column(Integer())

    id = Column(Integer, ForeignKey('actions.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'combat_action',
    }

    def __repr__(self) -> str:
        return self.name


Action.metadata.create_all(engine)
