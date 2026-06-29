#!/usr/bin/env sh
set -eu

BASE="${1:-https://localhost}"

curl -fsSIL "$BASE" >/dev/null
curl -fsSIL "$BASE/download/" >/dev/null

printf 'ok: %s\n' "$BASE"
