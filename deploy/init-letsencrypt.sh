#!/usr/bin/env bash
# Первичное получение сертификата Let's Encrypt.
# Запуск на хосте из корня проекта:
#   ./deploy/init-letsencrypt.sh <domain> <email>
set -euo pipefail

DOMAIN="${1:?Укажите домен: ./deploy/init-letsencrypt.sh example.com admin@example.com}"
EMAIL="${2:?Укажите email}"
SSL_DIR="./ssl"

echo "==> 1/5 Создаю заглушку сертификата (нужна для старта nginx с 443)"
if [ ! -f "$SSL_DIR/live/$DOMAIN/fullchain.pem" ]; then
  mkdir -p "$SSL_DIR/live/$DOMAIN"
  docker compose run --rm --entrypoint sh certbot -c "
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj '/CN=$DOMAIN'"
fi

echo "==> 2/5 Стартую api и nginx с временным HTTP-конфигом"
sed "s/<domain>/${DOMAIN}/g" nginx/nginx.init.conf > nginx/rendered.conf
docker compose up -d api nginx
sleep 2

echo "==> 3/5 Прошу сертификат у Let's Encrypt"
# Удаляем дамми-сертификат, иначе certbot не выдаст настоящий для того же имени.
# Порт 80 не пробрасываем: его уже держит контейнер nginx, certbot пишет в общий webroot.
docker compose run --rm --entrypoint sh certbot -c \
  "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf"
docker compose run --rm \
  --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

echo "==> 4/5 Включаю прод-конфиг с HTTPS и перезапускаю nginx"
sed "s/<domain>/${DOMAIN}/g" nginx/nginx.prod.conf > nginx/rendered.conf
docker compose up -d --force-recreate nginx

echo "==> 5/5 Готово."
echo "Откройте https://$DOMAIN — должен быть валидный сертификат."
echo "Продление: certbot проверяет каждые 12ч, nginx перечитывает сертификаты каждые 6ч."
