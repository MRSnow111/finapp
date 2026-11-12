"""CLI FinApp.

Использование:
    python -m app.cli create-admin <email> <name> <password>
    python -m app.cli backup <файл-назначение>
    python -m app.cli recolor-categories
"""
import sqlite3
import sys

from ..database import DB_PATH, SessionLocal, Base, engine
from ..models import User  # noqa: F401 — регистрация моделей

# Старые стандартные цвета -> цвета текущей палитры
LEGACY_DEFAULT_COLORS = {
    "#f97316": "#8EB69B",  # Продукты
    "#0ea5e9": "#6FAFA4",  # Транспорт
    "#8b5cf6": "#7FA6D0",  # Жильё
    "#ef4444": "#E08A78",  # Здоровье
    "#ec4899": "#D9B26A",  # Развлечения
    "#14b8a6": "#9AA8E0",  # Одежда
    "#6b7280": "#7C9A8B",  # Прочее
    "#16a34a": "#8EE3A6",  # Зарплата
    "#22c55e": "#B8DCC3",  # Подарок
}


def create_admin(db, email: str, name: str, password: str) -> None:
    from ..core.security import hash_password

    if len(password) < 10:
        print("Ошибка: пароль должен быть не короче 10 символов")
        sys.exit(1)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"Ошибка: пользователь с email {email} уже существует")
        sys.exit(1)

    admin = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Администратор {name} ({email}) создан, id={admin.id}")


def backup(dest: str) -> None:
    """Безопасный онлайн-бэкап SQLite (как `sqlite3 .backup`)."""
    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(dest)
    try:
        src.backup(dst)
        dst.commit()
    finally:
        dst.close()
        src.close()
    print(f"Бэкап сохранён: {dest}")


def recolor_categories(db) -> None:
    """Перекрашивает стандартные категории, созданные со старой палитрой.

    Категории, у которых цвет меняли вручную (не входит в LEGACY_DEFAULT_COLORS),
    не трогаем.
    """
    from ..models.category import Category

    changed = 0
    for old, new in LEGACY_DEFAULT_COLORS.items():
        rows = db.query(Category).filter(Category.color == old).all()
        for row in rows:
            row.color = new
        changed += len(rows)
    db.commit()
    print(f"Перекрашено категорий: {changed}")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "backup":
        if len(sys.argv) != 3:
            print("Использование: python -m app.cli backup <файл-назначение>")
            sys.exit(1)
        backup(sys.argv[2])
        return

    # Для остальных команд создаём таблицы при первом запуске
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if command == "create-admin":
            if len(sys.argv) != 5:
                print("Использование: python -m app.cli create-admin <email> <name> <password>")
                sys.exit(1)
            create_admin(db, sys.argv[2], sys.argv[3], sys.argv[4])
        elif command == "recolor-categories":
            recolor_categories(db)
        else:
            print(f"Неизвестная команда: {command}")
            print(__doc__)
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
