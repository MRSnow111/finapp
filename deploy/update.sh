#!/usr/bin/env bash
# Обновление приложения на хосте.
# Cron еженедельно (в 5:00 воскресенья), или запуск вручную:
#   0 5 * * 0 /path/to/finapp/deploy/update.sh >> /path/to/finapp/backups/update.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Бэкап перед обновлением"
./deploy/backup.sh

echo "==> git pull"
git pull --ff-only

echo "==> Пересборка и перезапуск"
docker compose up -d --build

echo "==> Удаление неиспользуемых образов"
docker image prune -f

echo "Обновление завершено: $(date)"
