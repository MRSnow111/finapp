#!/usr/bin/env bash
# Первичная настройка хоста Ubuntu.
# Запуск от пользователя с sudo (один раз):
#   sudo ./deploy/setup-host.sh <домен>
# Делает:
#   1) системного пользователя finapp (владелец проекта и данных, docker без sudo)
#   2) ufw: открыты только 22 (SSH по ключу), 80, 443
#   3) unattended-upgrades
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Запустите через sudo: sudo $0"
  exit 1
fi

if ! command -v docker >/dev/null; then
  echo "Установите Docker (https://docs.docker.com/engine/install/ubuntu/)"
  exit 1
fi

# 1) Пользователь finapp
if ! id finapp >/dev/null 2>&1; then
  useradd -m -s /bin/bash finapp
  echo "Создан пользователь finapp. Задайте пароль при необходимости: sudo passwd finapp"
fi
usermod -aG docker finapp

# 2) Файрвол
if command -v ufw >/dev/null; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
  ufw status verbose
fi

# 3) Автообновления безопасности
if command -v unattended-upgrade >/dev/null; then
  echo "unattended-upgrades уже установлен"
else
  apt-get update -q
  apt-get install -y -q unattended-upgrades
  dpkg-reconfigure --priority=low unattended-upgrades || true
fi

# 4) Права на каталог проекта (если скрипт лежит в нём)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
chown -R finapp:finapp "$PROJECT_DIR"
echo "Каталог проекта передан пользователю finapp: $PROJECT_DIR"

echo
echo "Готово. Дальше (от пользователя finapp):"
echo "  1. cp .env.example .env && nano .env   # SESSION_SECRET: openssl rand -hex 32"
echo "  2. mkdir -p backups && docker compose up -d --build api"
echo "  3. docker compose exec api python -m app.cli create-admin <email> <name> <password>"
echo "  4. ./deploy/init-letsencrypt.sh <domain> <email>   # поднимает nginx и certbot"
echo "  5. crontab -e:  3 4 * * * $PROJECT_DIR/deploy/backup.sh >> $PROJECT_DIR/backups/backup.log 2>&1"
