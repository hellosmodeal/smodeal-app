#!/usr/bin/env bash
set -euo pipefail

directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker compose --env-file "$directory/appwrite.local" -f "$directory/compose.yaml" -p smodeal-qa down
