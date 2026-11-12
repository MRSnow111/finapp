from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Создание движка базы данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Путь к файлу БД (для бэкапов). make_url сохраняет абсолютный путь:
# sqlite:////data/app.db -> /data/app.db
DB_PATH = make_url(DATABASE_URL).database or "app.db"
if not os.path.isabs(DB_PATH):
    DB_PATH = os.path.abspath(DB_PATH)

# Создание сессии
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создание базового класса для моделей
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()