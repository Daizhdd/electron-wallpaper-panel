# Launch helpers (optional)

Start a target Electron app with a loopback CDP port, then run `ewp`.

## Double-click skinned launcher (Windows)

Cloning the repo does **not** change your shortcuts by itself. To get a
double-click flow that starts the app *and* applies the wallpaper:

### 1. Configure (once)

```powershell
Copy-Item scripts\launcher.config.example.json scripts\launcher.config.json
notepad scripts\launcher.config.json
```

| Field | Meaning |
|-------|---------|
| `appPath` | Full path to the app `.exe`. Leave `""` to auto-detect from profile `exeHints`, a running process, or an existing shortcut |
| `processName` | Process name used to detect/restart the app (from the profile) |
| `shortcutNames` | Desktop / Start Menu `.lnk` base names to repoint (without `.lnk`) |
| `port` | CDP port (default `9346`) |
| `profile` | Profile path relative to repo root |
| `image` | Wallpaper path (`""` = pick later in the floating panel) |
| `lang` | Panel language, e.g. `zh-CN` / `en-US` |

`launcher.config.json` is machine-local and gitignored. The example file is what
gets committed.

### 2. Repoint shortcuts (once)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\repoint-mimo-shortcuts.ps1
```

Backups land in `scripts\backup-shortcuts\`. Report: `scripts\shortcut-report.txt`.

### 3. What the launcher does

`start-mimo-skinned.bat` → `start-mimo-skinned.ps1`:

1. Starts the app with `--remote-debugging-port` (or reuses an instance that already has it)
2. Waits for the real renderer document (`wait-ready.js`)
3. Runs `ewp apply` with your profile/image
4. Checks the skin stuck and re-applies once if needed

Runtime log: `scripts/launcher.log`.

**Never** kill/restart the host app from *inside* one of its AI sessions.

## PowerShell one-shot

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
