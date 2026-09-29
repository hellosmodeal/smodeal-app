#!/usr/bin/env bash
set -euo pipefail

repository="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository"
if [[ ! -f .env.qa.local ]]; then
  echo 'Initialisez Appwrite local suivant infra/qa/README.md.' >&2
  exit 1
fi

node --env-file=.env.qa.local -e '
if (
  process.env.APPWRITE_ENDPOINT !== "http://127.0.0.1:18670/v1" ||
  process.env.APPWRITE_PROJECT_ID !== "smodeal-qa" ||
  process.env.APPWRITE_DATABASE_ID !== "smodeal"
) {
  console.error("La recette exige Appwrite local smodeal-qa.")
  process.exit(1)
}
'

if [[ ! -f .qa-browser.local ]]; then
  qa_browser_password="$(openssl rand -base64 36 | tr -d '\n')"
  QA_BROWSER_PASSWORD="$qa_browser_password" SMODEAL_QA=1 \
    node --env-file=.env.qa.local scripts/qa-seed.server.ts --write
  unset qa_browser_password
fi

reuse_server=false
if curl --silent --max-time 2 http://127.0.0.1:18671/ >/dev/null; then
  if [[ "${SMODEAL_QA_REUSE_SERVER:-}" != '1' ]] || \
    ! grep --quiet --fixed-strings 'PUBLIC_SITE_URL=http://localhost:18671' .env.qa.local; then
    echo 'Le port de recette 18671 est déjà occupé. Utilisez SMODEAL_QA_REUSE_SERVER=1 seulement avec le serveur local de recette.' >&2
    exit 1
  fi
  reuse_server=true
fi

if [[ "$reuse_server" != true ]]; then
  log_file="$(mktemp "${TMPDIR:-/tmp}/smodeal-qa-vite.XXXXXX")"
  chmod 600 "$log_file"
  node --env-file=.env.qa.local node_modules/vite/bin/vite.js dev \
    --host 127.0.0.1 --port 18671 --strictPort >"$log_file" 2>&1 &
  server_pid=$!
  trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; rm -f "$log_file"' EXIT
fi

ready=false
for ((attempt = 0; attempt < 30; attempt++)); do
  if [[ "$reuse_server" != true ]] && ! kill -0 "$server_pid" 2>/dev/null; then
    echo 'Le serveur de recette n’a pas démarré.' >&2
    exit 1
  fi
  if curl --fail --silent --max-time 2 http://127.0.0.1:18671/ >/dev/null; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo 'Le serveur de recette ne répond pas après 30 essais.' >&2
  exit 1
fi

SMODEAL_QA=1 node --env-file=.env.qa.local node_modules/vitest/vitest.mjs \
  run src/features/qa
