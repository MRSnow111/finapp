#!/usr/bin/env bash
# Ежедневный бэкап SQLite в ./backups, хранение 14 дней.
# Cron (пользователь finapp):
#   3 4 * * * /path/to/finapp/deploy/backup.sh >> /path/to/finapp/backups/backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p backups
NAME="app-$(date +%F).db"
docker compose exec -T api python -m app.cli backup "/backups/$NAME"

# Ретеншн: удаляем файлы старше 14 дней
find backups -name 'app-*.db' -mtime +14 -delete

echo "Бэкап завершён: $NAME"
