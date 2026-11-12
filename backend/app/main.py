from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import User, Invite, Category, Transaction  # noqa: F401 — регистрация моделей
from .api import router as api_router

# Создание таблиц (в проде — Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinApp API",
    description="Личный учёт доходов и расходов",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в проде заменить на домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "FinApp API"}
