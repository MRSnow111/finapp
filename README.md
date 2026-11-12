# FinApp

Личный учёт доходов и расходов. Веб-версия v1 с регистрацией по приглашению.

## Стек

- Фронтенд: React + TypeScript + Vite, Tailwind CSS, Recharts
- Бэкенд: FastAPI (Python), SQLAlchemy
- База: SQLite (volume контейнера)
- Веб-сервер: Nginx (статика + reverse proxy `/api`), HTTPS через certbot

## Запуск для разработки

```bash
cd frontend && npm install && npm run build   # или npm run dev + proxy на :8123
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r ../requirements.txt
uvicorn app.main:app --port 8123
```

В dev nginx можно не поднимать: Vite (`npm run dev`) проксирует `/api` на `127.0.0.1:8123`.

## API

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | /api/auth/register | по инвайту | Регистрация (код + email + имя + пароль) |
| POST | /api/auth/login | публичный | Вход, сессия в httpOnly cookie |
| POST | /api/auth/logout | любой | Выход (сброс cookie) |
| GET | /api/auth/me | по сессии | Текущий пользователь |
| GET/POST/PUT/DELETE | /api/categories | по сессии | Категории текущего пользователя |
| GET/POST/PUT/DELETE | /api/transactions | по сессии | Операции текущего пользователя |
| GET | /api/users | admin | Список пользователей |
| POST | /api/users/{id}/block, /unblock | admin | Блокировка аккаунта |
| POST/GET/DELETE | /api/invites | admin | Создание, список, отзыв инвайтов |

Сессия: JWT в httpOnly cookie `finapp_session`, SameSite=Lax, Secure (в проде).
Вход: не более 5 неудачных попыток за 15 минут на email и IP.
Инвайт: одноразовый, привязан к email, срок действия 7 дней, показывается один раз.
Суммы хранятся в копейках (`amount_minor`), деньги — `1 234,56 ₽`, даты — `9 ноября 2026`.

## Деплой на хост (Ubuntu)

```bash
# 1. Разовая настройка (sudo): пользователь finapp, ufw, автообновления
sudo ./deploy/setup-host.sh

# 2. Секреты и каталоги (от пользователя finapp)
cp .env.example .env
openssl rand -hex 32          # вставить в .env как SESSION_SECRET (значение change-me не годится, сервер не стартует)
chmod 600 .env
mkdir -p backups

# 3. Только API: nginx пока не нужен, и без rendered.conf он не стартует
docker compose up -d --build api

# 4. Первый администратор
docker compose exec api python -m app.cli create-admin <email> <name> <password>

# 5. HTTPS: выдаёт сертификат, поднимает nginx и certbot, переводит nginx на 443
./deploy/init-letsencrypt.sh <domain> <email>
```

Требования: домен A-записью указывает на хост, порты 80/443 проброшены на хост.

## Обслуживание

```bash
# Ежедневный бэкап (cron): 3 4 * * * /path/to/finapp/deploy/backup.sh
./deploy/backup.sh            # бэкап SQLite в ./backups, хранение 14 дней

# Обновление (cron еженедельно): 0 5 * * 0 /path/to/finapp/deploy/update.sh
./deploy/update.sh            # бэкап + git pull + compose up -d --build
```

Бэкап из контейнера: `docker compose exec api python -m app.cli backup /backups/app-YYYY-MM-DD.db`.

## Структура

```
backend/app/        FastAPI: модели, схемы, API, core (сессии), CLI
frontend/src/       React: страницы, компоненты, services, utils
nginx/              nginx.init.conf (первичная выдача серт.), nginx.prod.conf (HTTPS), nginx.dev.conf
deploy/             setup-host.sh, init-letsencrypt.sh, backup.sh, update.sh
docker-compose.yml  api, nginx, certbot
```

## Этапы

1. Каркас — ✅
2. Авторизация (вход, инвайты, админ-команда) — ✅
3. Операции и категории (CRUD) — ✅
4. Главная и статистика — ✅
5. Деплой (Nginx, certbot, ufw, бэкапы) — ✅ конфиги и скрипты; финальная проверка на хосте
6. Полировка (профиль, тема, экспорт/импорт) — ✅
