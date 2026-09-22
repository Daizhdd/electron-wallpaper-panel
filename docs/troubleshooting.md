# Probes & troubleshooting

When `apply` reports success but the image is invisible:

1. `node bin/ewp.js probe --port 9346`  
   Point traces show which ancestor still paints an opaque background.
2. Update `chromeSelectors` in your profile with the stable class/attribute names you see.
3. Re-run `apply`.

## Rules of thumb

- Prefer stable prefixes / `data-*` attributes over hashed CSS-module classes.
- Clear **chrome** only (sidebar, main shell, composer frame). Keep preview panels opaque.
- Pair-clear `background-color` **and** `background-image` on composer-like surfaces.
- Theme colors / `data-theme` are app-owned — validate contrast in the app’s own Appearance settings.

## Version sensitivity

Profiles are calibrated per app version. After a host update, re-run `probe` and adjust selectors.
Prefix matching (e.g. `[class*="gridView"]`) lasts longer than full hashed class names.
