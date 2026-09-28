#!/usr/bin/env bash
set -euo pipefail

directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
local_env="$directory/appwrite.local"

if [[ ! -f "$local_env" ]]; then
  umask 077
  openssl_key="$(openssl rand -hex 32)"
  notifications_secret="$(openssl rand -hex 32)"
  geo_secret="$(openssl rand -hex 32)"
  database_password="$(openssl rand -hex 24)"
  executor_secret="$(openssl rand -hex 32)"
  jobs_secret="$(openssl rand -hex 32)"

  sed \
    -e "s/__RANDOM_OPENSSL_KEY__/$openssl_key/" \
    -e "s/__RANDOM_NOTIFICATIONS_SECRET__/$notifications_secret/" \
    -e "s/__RANDOM_GEO_SECRET__/$geo_secret/" \
    -e "s/__RANDOM_DB_PASSWORD__/$database_password/" \
    -e "s/__RANDOM_EXECUTOR_SECRET__/$executor_secret/" \
    -e "s/__RANDOM_JOBS_SECRET__/$jobs_secret/" \
    "$directory/appwrite.local.example" >"$local_env"
  chmod 600 "$local_env"
fi

docker compose --env-file "$local_env" -f "$directory/compose.yaml" -p smodeal-qa up --detach --pull missing --wait --wait-timeout 180
