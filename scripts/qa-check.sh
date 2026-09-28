#!/usr/bin/env bash
set -euo pipefail

repository="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository"
if [[ ! -f .env.qa.local ]]; then
  echo 'Initialisez Appwrite local suivant infra/qa/README.md.' >&2
  exit 1
fi

# Ne réutiliser aucun serveur existant : il pourrait viser un autre projet.
if curl --silent --max-time 2 http://127.0.0.1:18671/ >/dev/null; then
  echo 'Le port de recette 18671 est déjà occupé. Arrêtez son serveur avant la recette.' >&2
  exit 1
fi
log_file="$(mktemp "${TMPDIR:-/tmp}/smodeal-qa-vite.XXXXXX")"
chmod 600 "$log_file"
node --env-file=.env.qa.local node_modules/vite/bin/vite.js dev \
  --host 127.0.0.1 --port 18671 --strictPort >"$log_file" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; rm -f "$log_file"' EXIT

ready=false
for ((attempt = 0; attempt < 30; attempt++)); do
  if ! kill -0 "$server_pid" 2>/dev/null; then
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
  run src/features/qa/appwrite.integration.test.ts
