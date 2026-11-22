#!/usr/bin/env bash
# profile.sh <outdir> <runs> <path>...
# Liquid render profiles (speedscope JSON) of Gamma-Dev pages from `shopify theme profile`, <runs> per
# page, 1.5 s apart: <outdir>/<page>.<n>.json. Profiles the development theme of the running preview,
# or THEME=<id>. Summarize with profile_summary.py.
set -euo pipefail
STORE=gamma-dev-2318.myshopify.com
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
out=$1; runs=$2; shift 2
theme=${THEME:-$(grep -o 'preview_theme_id=[0-9]*' "${TMPDIR:-/tmp}/gamma-preview-9293.log" 2>/dev/null | head -1 | cut -d= -f2 || true)}
[ -n "$theme" ] || { echo "No theme: start the preview (rendered-check) or set THEME=<id>." >&2; exit 1; }
set -a; . "$REPO/.env"; set +a   # storefront password, never printed
mkdir -p "$out"
for page in "$@"; do
  name=$(echo "$page" | sed 's#^/##; s#[/?=&]#_#g'); name=${name:-home}
  for i in $(seq 1 "$runs"); do
    if ! timeout 180 shopify theme profile -s "$STORE" -t "$theme" --url "$page" --json > "$out/$name.$i.json" 2>/dev/null; then
      echo "failed: $page run $i" >&2; rm -f "$out/$name.$i.json"
    fi
    sleep 1.5
  done
  echo "$page: $(ls "$out/$name".*.json 2>/dev/null | wc -l) profiles"
done
