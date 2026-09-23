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

Full checklist for humans and AI assistants: [`docs/ai-setup.md`](../docs/ai-setup.md).

**Never** kill/restart the host app from *inside* one of its AI sessions.

## macOS / Linux

[`scripts/launch-with-port.sh`](launch-with-port.sh) is the simple equivalent of
the launcher above:

```bash
scripts/launch-with-port.sh <app-path> [port] [profile] [image]
```

It starts the app with a CDP port, waits for the port, then runs `ewp apply`.
It does not wait for the renderer or verify the skin, so it can occasionally
land before the app is ready; run `ewp apply` again if the wallpaper does not
appear. The Windows launcher does that retry for you.

**Never** kill/restart the host app from *inside* one of its AI sessions.
