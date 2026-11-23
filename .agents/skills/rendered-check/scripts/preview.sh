#!/usr/bin/env bash
# preview.sh start|stop|status
# Runs `shopify theme dev` for Gamma-Dev on port 9293 from this checkout, after confirming the store.
# Port 9292 is left for Chris's own preview and is refused. Set THEME=<id> to reuse a specific development
# theme and PREVIEW_PATH=<dir> to serve another copy (e.g. a `git archive` of a baseline commit).
#
# The script only ever signals a process it started. Each start records the owning worktree, the served
# path, the port and the process's pid and start time; status and stop check all of them against the live
# process before they report or kill, and start refuses to reuse a preview whose owner or path differs.
# PREVIEW_PORT and STATE_DIR exist so the ownership checks can be tested with stand-ins.
set -euo pipefail

STORE=gamma-dev-2318.myshopify.com
SHOP_ID=gid://shopify/Shop/81927143660
RESERVED_PORT=9292
PORT=${PREVIEW_PORT:-9293}
REPO=$(realpath "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)")
ROOT=$(realpath -m "${PREVIEW_PATH:-$REPO}")
RUN=${STATE_DIR:-${TMPDIR:-/tmp}}/gamma-preview-$PORT
LOG=$RUN.log
STATE=$RUN.state

[ "$PORT" != "$RESERVED_PORT" ] || { echo "Port $RESERVED_PORT is Chris's own preview; refusing to use it." >&2; exit 2; }

field() { sed -n "s/^$1=//p" "$STATE" | head -1; }
alive() { kill -0 "$1" 2>/dev/null; }
started() { LC_ALL=C ps -o lstart= -p "$1" 2>/dev/null | sed 's/^ *//; s/ *$//'; }
args() { LC_ALL=C ps -o args= -p "$1" 2>/dev/null; }
listening() { ss -ltn 2>/dev/null | grep -q ":$PORT "; }

# owner: none | stale (nothing live matches the record) | mine | other:<why>
# "mine" needs the recorded pid to be live with the recorded start time and this port's `theme dev`
# command line, and the recorded worktree to be this one.
owner() {
  [ -f "$STATE" ] || { echo none; return; }
  local pid; pid=$(field pid)
  if [ -z "$pid" ] || ! alive "$pid"; then echo stale; return; fi
  if [ "$(started "$pid")" != "$(field started)" ]; then echo stale; return; fi
  case "$(args "$pid")" in
    *" theme dev "*"--port $PORT"*) ;;
    *) echo stale; return ;;
  esac
  if [ "$(field repo)" != "$REPO" ]; then echo "other:worktree $(field repo) serving $(field root)"; return; fi
  echo mine
}

# For status and stop, an unset PREVIEW_PATH means "the path this worktree started".
path_matches() { [ -z "${PREVIEW_PATH:-}" ] || [ "$(field root)" = "$ROOT" ]; }

case "${1:-}" in
  start)
    o=$(owner)
    case "$o" in
      mine)
        if [ "$(field root)" != "$ROOT" ]; then
          echo "A preview from this worktree already serves $(field root), not $ROOT; stop it first." >&2; exit 1
        fi
        echo "Already running (pid $(field pid)): http://127.0.0.1:$PORT"; exit 0 ;;
      other:*)
        echo "Port $PORT belongs to a preview from ${o#other:}; not touching it. Stop it from that worktree." >&2; exit 1 ;;
      stale) echo "Dropping a stale preview record (pid $(field pid) is gone or isn't that preview)."; rm -f "$STATE" ;;
    esac
    if listening; then echo "Port $PORT is in use by a process this script didn't start; not touching it." >&2; exit 1; fi
    id=$(shopify store execute -s "$STORE" -q '{ shop { id } }' 2>/dev/null | grep -o 'gid://shopify/Shop/[0-9]*' || true)
    if [ "$id" != "$SHOP_ID" ]; then echo "Store check failed (got '${id:-nothing}'); not starting." >&2; exit 1; fi
    # The storefront password comes from .env; it is never printed.
    set -a; . "$REPO/.env"; set +a
    nohup shopify theme dev -s "$STORE" --path "$ROOT" --port "$PORT" --live-reload off ${THEME:+--theme "$THEME"} \
      > "$LOG" 2>&1 &
    pid=$!
    printf 'pid=%s\nstarted=%s\nrepo=%s\nroot=%s\nport=%s\n' "$pid" "$(started "$pid")" "$REPO" "$ROOT" "$PORT" > "$STATE"
    for _ in $(seq 1 120); do
      grep -qE "127.0.0.1:$PORT|verify your identity|rror" "$LOG" && break
      sleep "${POLL_SECONDS:-3}"
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
    o=$(owner)
    case "$o" in
      none) echo "Not running"; exit 0 ;;
      stale) echo "Not running (dropping a stale record; no process was signalled)"; rm -f "$STATE"; exit 0 ;;
      other:*) echo "Refusing to stop: the preview on port $PORT belongs to ${o#other:}." >&2; exit 1 ;;
    esac
    if ! path_matches; then
      echo "Refusing to stop: this worktree's preview serves $(field root), not $ROOT." >&2; exit 1
    fi
    pid=$(field pid)
    kill "$pid"
    for _ in $(seq 1 50); do alive "$pid" || break; sleep 0.1; done
    if alive "$pid"; then echo "Sent TERM to pid $pid but it is still running; record kept." >&2; exit 1; fi
    rm -f "$STATE"
    echo "Stopped pid $pid"
    ;;
  status)
    o=$(owner)
    case "$o" in
      none)
        if listening; then echo "Not running from here; port $PORT is in use by a process this script didn't start."; exit 1; fi
        echo "Not running" ;;
      stale) echo "Not running (stale record for pid $(field pid))"; listening && echo "Port $PORT is in use by another process."; exit 1 ;;
      other:*) echo "Not ours: port $PORT belongs to a preview from ${o#other:}."; exit 1 ;;
      mine)
        if ! path_matches; then echo "This worktree's preview serves $(field root), not $ROOT."; exit 1; fi
        echo "Running (pid $(field pid), serving $(field root)): http://127.0.0.1:$PORT" ;;
    esac
    ;;
  *)
    echo "usage: $0 start|stop|status" >&2
    exit 2
    ;;
esac
