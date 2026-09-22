# Changelog

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
