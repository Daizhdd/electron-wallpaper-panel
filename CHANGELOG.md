# Changelog

## 0.2.1

- README (en/zh): add explicit post-install steps — clone/install does not auto-skin;
  start with `--remote-debugging-port`, then `apply` / `restore`
- Fix English install clone URL (was a `<you>` placeholder)
- `postinstall` prints the same next steps after `npm install`
  (uses `node bin/ewp.js`, not `npx ewp`)
- Add double-click launcher scripts (`start-mimo-skinned.*`, `wait-ready.js`,
  `repoint-mimo-shortcuts.ps1`) that wait for the renderer, apply the skin,
  and verify it stuck — so a cold start keeps the wallpaper
- Launcher paths are config-driven (`scripts/launcher.config.json` ←
  `launcher.config.example.json`) with auto-detect from profile `exeHints` /
  running process / existing shortcuts; cloning does not silently rewrite
  your shortcuts until you run `repoint-mimo-shortcuts.ps1`

## 0.2.0

- Panel UI is now localised (`locales/en-US.json`, `locales/zh-CN.json`) and follows
  the host app language automatically; `--lang` / `EWP_LANG` force one explicitly
- The floating button uses a neutral icon instead of a Chinese glyph, so it no longer
  mixes scripts in a non-Chinese UI
- Panel re-renders when the resolved language changes, so `--lang` works on a live app
- `locales/` added to the published package

## 0.1.0

- Initial public shape: CLI (`apply` / `restore` / `status` / `probe`)
- Floating panel: drop / file pick / path, live veil + input opacity sliders
- Profiles: `mimo-desktop`, `workbuddy`, `generic-electron`
- Runtime-only CSS injection (no app file patching), fully reversible
- MIT license + unofficial disclaimer
