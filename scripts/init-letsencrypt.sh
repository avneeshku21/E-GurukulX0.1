#!/bin/sh
set -eu

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing .env in repo root. Copy .env.example to .env and fill DOMAIN, WWW_DOMAIN, CERTBOT_EMAIL, VITE_APP_URL, and ALLOWED_ORIGINS."
  exit 1
fi

set -a
. ./.env
set +a

if [ -z "${DOMAIN:-}" ] || [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "DOMAIN and CERTBOT_EMAIL must be set in .env"
  exit 1
fi

if [ -z "${WWW_DOMAIN:-}" ]; then
  DOMAINS="-d ${DOMAIN}"
else
  DOMAINS="-d ${DOMAIN} -d ${WWW_DOMAIN}"
fi

RSA_KEY_SIZE=4096
DATA_PATH=./data/certbot
STAGING_ARG=

if [ "${CERTBOT_STAGING:-0}" = "1" ]; then
  STAGING_ARG="--staging"
fi

mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
mkdir -p "$DATA_PATH/www"

if [ ! -f "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo "Creating temporary certificate for $DOMAIN ..."
  docker compose run --rm --entrypoint \
    "openssl req -x509 -nodes -newkey rsa:1024 -days 1 -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem -subj '/CN=localhost'" \
    -v "${PWD}/data/certbot/conf:/etc/letsencrypt" \
    certbot
  cp "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" "$DATA_PATH/conf/live/$DOMAIN/chain.pem"
fi

docker compose up -d frontend backend

echo "Requesting Let's Encrypt certificate for $DOMAIN ..."
docker compose run --rm certbot certonly --webroot -w /var/www/certbot $STAGING_ARG \
  --email "$CERTBOT_EMAIL" \
  $DOMAINS \
  --rsa-key-size "$RSA_KEY_SIZE" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

docker compose exec frontend nginx -s reload

echo "Certificate setup complete."