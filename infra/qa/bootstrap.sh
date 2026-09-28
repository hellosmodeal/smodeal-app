#!/usr/bin/env bash
set -euo pipefail

directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository="$(cd "$directory/../.." && pwd)"
credentials="$directory/console-admin.local"
environment="$repository/.env.qa.local"

if [[ -f "$environment" ]]; then
  chmod 600 "$environment"
  node "$directory/push-schema.mjs" "$environment" "$repository/appwrite.config.json"
  exit 0
fi

if [[ ! -f "$credentials" ]]; then
  umask 077
  {
    printf '%s\n' 'QA_ADMIN_EMAIL=qa-admin@smodeal.test'
    printf 'QA_ADMIN_PASSWORD='
    openssl rand -base64 36 | tr -d '\n'
    printf '\n'
  } >"$credentials"
  chmod 600 "$credentials"
fi

node "$directory/bootstrap.mjs" "$credentials" "$environment"
chmod 600 "$environment"
node "$directory/push-schema.mjs" "$environment" "$repository/appwrite.config.json"
