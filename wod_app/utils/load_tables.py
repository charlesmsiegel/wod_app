from sqlalchemy import MetaData


def load_tables(engine):
    md = MetaData(bind=engine)
    md.reflect()
    return md.tables
