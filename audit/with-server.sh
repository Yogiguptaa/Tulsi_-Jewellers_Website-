#!/usr/bin/env bash
# audit/with-server.sh — run the Next dev server around a command.
#
# The audit harness needs a live server, and a server spawned in an earlier
# shell does not reliably outlive that shell on Windows. This wrapper starts the
# server, waits until it actually answers HTTP, runs the command you pass, then
# stops the server it started (and only that one).
#
# Usage: bash audit/with-server.sh node audit/run-audit.mjs http://localhost:3210
set -uo pipefail

PORT="${AUDIT_PORT:-3210}"
BASE="http://localhost:${PORT}"
LOG=".next-dev.log"

node node_modules/next/dist/bin/next dev -p "$PORT" > "$LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null
  fi
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/" 2>/dev/null || true)
  if [ "$code" = "200" ]; then ready=1; break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then break; fi
  sleep 1
done

if [ "$ready" != "1" ]; then
  echo "✖ dev server never became ready on $BASE — last log lines:" >&2
  tail -20 "$LOG" >&2
  exit 1
fi

echo "✓ dev server ready on $BASE (pid $SERVER_PID)"
"$@"
status=$?
echo "— command exited $status"
exit $status
