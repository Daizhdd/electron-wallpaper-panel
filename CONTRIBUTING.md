# Contributing

Thanks for helping.

## Scope

- Runtime wallpaper / veil / composer transparency for Electron apps.
- Profiles and probes.
- Docs and translations.

Out of scope: product recoloring, “official theme” branding, patching app bundles, piracy helpers.

## Dev loop

```bash
node --check lib/cdp.js
node --check bin/ewp.js
node --check skin-panel.js
node bin/ewp.js help
```

## Profiles

- Prefer stable `data-*` / class **prefixes** over hashed names.
- Document the app version you calibrated (`docs/calibration.md`).
- Never commit absolute personal paths or screenshots with private accounts.

## License

By contributing you agree your changes are MIT-licensed.
