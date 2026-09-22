from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from sqlalchemy import text
import os

load_dotenv()

engine = create_engine(os.getenv("SUPABASE_URI"), echo=True)
session = Session(engine)

with engine.connect() as connection:
    result = connection.execute(text('SELECT * FROM "userTable"'))
    for row in result:
        print(row.username)