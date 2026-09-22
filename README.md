# electron-wallpaper-panel

Unofficial **wallpaper / glass-skin** toolkit for Electron desktop assistants.

You get a floating control panel (drag & drop image, file picker, path field,
live sliders for veil/opacity) plus a small CLI to inject and restore styles
over Chrome DevTools Protocol (CDP).

> **Unofficial.** This project is **not affiliated with, endorsed by, or sponsored by**
> Xiaomi, Mimo, WorkBuddy, or any other app vendor. Use at your own risk.
> App updates may break selectors — that is expected.

## How it works

1. Start the target Electron app with `--remote-debugging-port=9346`.
2. `ewp` injects CSS + a floating panel into the renderer.
3. Chrome surfaces (sidebar / main / composer chrome) are cleared so the image shows.
4. Content surfaces (preview panels, cards, menus) stay opaque on purpose.

No app files are patched. Everything is runtime-only and reversible (`ewp restore`).

## Requirements

- Node.js 18+ (uses built-in `WebSocket` / `fetch`)
- A Chromium/Electron app that accepts `--remote-debugging-port`

## Quick start

```bash
# 1) start your app with a debug port (example)
"/path/to/App.exe" --remote-debugging-port=9346

# 2) apply a wallpaper
node bin/ewp.js apply --profile profiles/mimo-desktop.json --image ./wallpaper.jpg

# 3) restore native look
node bin/ewp.js restore --profile profiles/mimo-desktop.json
```

After `apply`, a **「图」/ picture** button appears at the bottom-right of the app
window. Click it for drag-and-drop, file pick, path apply, and live sliders:

- **Background veil** 0–100%
- **Composer / input opacity** 0–100%

## Profiles

Profiles live in [`profiles/`](profiles/) and describe app-specific CSS and
process names. Built-in:

| File | Target |
| --- | --- |
| `profiles/mimo-desktop.json` | Xiaomi MiMo Desktop (unofficial) |
| `profiles/workbuddy.json` | WorkBuddy (unofficial) |
| `profiles/generic-electron.json` | Best-effort generic Electron |

Copy a profile and adjust `chromeSelectors` / `keepOpaque` after app updates
using the probe scripts (`node bin/ewp.js probe`).

## CLI

```text
ewp apply   --profile <file> [--image <path>] [--port 9346] [--scrim 0-1]
ewp restore --profile <file> [--port 9346]
ewp status  [--port 9346]
ewp probe   [--port 9346] [--mode stack|opaque|theme]
```

- `--image` is embedded as a data URL (no network).
- Without `--image`, the panel’s drag-and-drop / file picker is the primary path.
- Scrim auto-guess is approximate (mean luminance); fine-tune with the slider.

## Safety notes

- **Never** run the restart helpers from *inside* a session of the app you are about
  to kill — that kills your own session. Restart the app yourself.
- Debug port should stay on **loopback** only.
- Do not point this at apps you do not own or administer on shared machines without permission.

## Why not a native plugin?

Most of these desktop apps do not expose a UI-extension API. Runtime CSS + a small
injected panel is the practical unofficial route. It is intentionally layout-safe:
no product recoloring, no fake “official theme store”.

## Disclaimer (please read)

- Trademarks belong to their owners. Naming compatibility does not imply endorsement.
- This tool can break after host app upgrades. Check issues / re-probe selectors.
- Provided **AS IS**, without warranty of any kind.

## License

MIT — see [LICENSE](LICENSE).
