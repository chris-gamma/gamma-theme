#!/usr/bin/env bash
# preview.sh start|stop|status
# Runs `shopify theme dev` for Gamma-Dev on port 9293 from this checkout, after confirming the store.
# Port 9292 is left for Chris's own preview. Set THEME=<id> to reuse a specific development theme and
# PREVIEW_PATH=<dir> to serve another copy (e.g. a `git archive` of a baseline commit).
set -euo pipefail

STORE=gamma-dev-2318.myshopify.com
SHOP_ID=gid://shopify/Shop/81927143660
PORT=9293
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
ROOT=${PREVIEW_PATH:-$REPO}
RUN=${TMPDIR:-/tmp}/gamma-preview-$PORT
LOG=$RUN.log
PID=$RUN.pid

running() { [ -f "$PID" ] && kill -0 "$(cat "$PID")" 2>/dev/null; }

case "${1:-}" in
  start)
    if running; then echo "Already running (pid $(cat "$PID")): http://127.0.0.1:$PORT"; exit 0; fi
    if ss -ltn 2>/dev/null | grep -q ":$PORT "; then echo "Port $PORT is in use by another process." >&2; exit 1; fi
    id=$(shopify store execute -s "$STORE" -q '{ shop { id } }' 2>/dev/null | grep -o 'gid://shopify/Shop/[0-9]*' || true)
    if [ "$id" != "$SHOP_ID" ]; then echo "Store check failed (got '${id:-nothing}'); not starting." >&2; exit 1; fi
    # The storefront password comes from .env; it is never printed.
    set -a; . "$REPO/.env"; set +a
    nohup shopify theme dev -s "$STORE" --path "$ROOT" --port "$PORT" --live-reload off ${THEME:+--theme "$THEME"} \
      > "$LOG" 2>&1 &
    echo $! > "$PID"
    for _ in $(seq 1 120); do
      grep -qE "127.0.0.1:$PORT|verify your identity|rror" "$LOG" && break
      sleep 3
    done
    if grep -q 'verify your identity' "$LOG"; then
      echo "Shopify wants an identity check; send Chris this link:" >&2
      grep -o 'https://admin.shopify.com/[^ ]*' "$LOG" | head -1 >&2
      exit 1
    fi
    if ! grep -q "127.0.0.1:$PORT" "$LOG"; then echo "Preview didn't start; see $LOG" >&2; exit 1; fi
    echo "Preview: http://127.0.0.1:$PORT  ($(grep -o 'preview_theme_id=[0-9]*' "$LOG" | head -1))  log: $LOG"
    ;;
  stop)
    if running; then kill "$(cat "$PID")" && echo "Stopped pid $(cat "$PID")"; else echo "Not running"; fi
    rm -f "$PID"
    ;;
  status)
    if running; then echo "Running (pid $(cat "$PID")): http://127.0.0.1:$PORT"; else echo "Not running"; fi
    ;;
  *)
    echo "usage: $0 start|stop|status" >&2
    exit 2
    ;;
esac
