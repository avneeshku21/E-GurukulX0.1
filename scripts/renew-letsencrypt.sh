#!/bin/sh
set -eu

docker compose run --rm certbot renew --webroot -w /var/www/certbot
docker compose exec frontend nginx -s reload