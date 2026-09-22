# Launch helpers (optional)

Start a target Electron app with a loopback CDP port, then run `ewp`.

## PowerShell

```powershell
# scripts/launch-with-port.ps1
param(
  [Parameter(Mandatory)][string]$AppPath,
  [int]$Port = 9346,
  [string]$Profile = "profiles/generic-electron.json",
  [string]$Image
)
Start-Process -FilePath $AppPath -ArgumentList "--remote-debugging-port=$Port"
# wait for port
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  try {
    $c = New-Object Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', $Port); $c.Close(); break
  } catch { Start-Sleep -Milliseconds 400 }
}
$args2 = @('bin/ewp.js','apply','--profile',$Profile,'--port',"$Port")
if ($Image) { $args2 += @('--image', $Image) }
node @args2
```

## Bash

```bash
#!/usr/bin/env bash
# scripts/launch-with-port.sh
set -euo pipefail
APP_PATH="${1:?app path}"
PORT="${2:-9346}"
PROFILE="${3:-profiles/generic-electron.json}"
IMAGE="${4:-}"
"$APP_PATH" --remote-debugging-port="$PORT" &
for _ in $(seq 1 60); do
  if (echo >/dev/tcp/127.0.0.1/"$PORT") >/dev/null 2>&1; then break; fi
  sleep 0.4
done
if [[ -n "$IMAGE" ]]; then
  node bin/ewp.js apply --profile "$PROFILE" --port "$PORT" --image "$IMAGE"
else
  node bin/ewp.js apply --profile "$PROFILE" --port "$PORT"
fi
```

**Never** kill/restart the host app from *inside* one of its AI sessions.
