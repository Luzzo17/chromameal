#!/bin/sh
set -eu

: "${APP_KEY:?Set APP_KEY in Render environment variables}"
: "${DB_URL:?Set DB_URL to the Neon PostgreSQL connection string}"

export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost:10000}}"
export SANCTUM_STATEFUL_DOMAINS="${SANCTUM_STATEFUL_DOMAINS:-${RENDER_EXTERNAL_HOSTNAME:-localhost:10000}}"

php artisan config:cache
php artisan migrate --force

exec apache2-foreground
