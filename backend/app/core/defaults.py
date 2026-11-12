"""Стандартный набор категорий, создаваемый при регистрации."""
from sqlalchemy.orm import Session

from ..models.category import Category

# Цвета подобраны под палитру приложения: приглушённые, с холодным уклоном
STANDARD_CATEGORIES: list[dict] = [
    # Расходы
    {"name": "Продукты", "type": "EXPENSE", "color": "#8EB69B", "icon": "shopping-cart"},
    {"name": "Транспорт", "type": "EXPENSE", "color": "#6FAFA4", "icon": "car"},
    {"name": "Жильё", "type": "EXPENSE", "color": "#7FA6D0", "icon": "home"},
    {"name": "Здоровье", "type": "EXPENSE", "color": "#E08A78", "icon": "heart"},
    {"name": "Развлечения", "type": "EXPENSE", "color": "#D9B26A", "icon": "gamepad"},
    {"name": "Одежда", "type": "EXPENSE", "color": "#9AA8E0", "icon": "shirt"},
    {"name": "Прочее", "type": "BOTH", "color": "#7C9A8B", "icon": "circle"},
    # Доходы
    {"name": "Зарплата", "type": "INCOME", "color": "#8EE3A6", "icon": "briefcase"},
    {"name": "Подарок", "type": "INCOME", "color": "#B8DCC3", "icon": "gift"},
]


def create_default_categories(db: Session, user_id: int) -> None:
    db.add_all([Category(user_id=user_id, **c) for c in STANDARD_CATEGORIES])
