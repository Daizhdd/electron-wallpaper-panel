#!/usr/bin/env bash
set -euo pipefail
APP_PATH="${1:?usage: launch-with-port.sh /path/to/App [port] [profile] [image]}"
PORT="${2:-9346}"
PROFILE="${3:-profiles/generic-electron.json}"
IMAGE="${4:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$APP_PATH" --remote-debugging-port="$PORT" &
for _ in $(seq 1 60); do
  if (echo >/dev/tcp/127.0.0.1/"$PORT") >/dev/null 2>&1; then break; fi
  sleep 0.4
done
if [[ -n "$IMAGE" ]]; then
  node "$ROOT/bin/ewp.js" apply --profile "$PROFILE" --port "$PORT" --image "$IMAGE"
else
  node "$ROOT/bin/ewp.js" apply --profile "$PROFILE" --port "$PORT"
fi
