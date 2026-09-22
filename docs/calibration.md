# Calibration notes (public)

Profiles change when host apps update. Record what you tested.

## mimo-desktop

| Field | Value |
| --- | --- |
| Host | Xiaomi MiMo Desktop (unofficial compatibility) |
| Notes | Calibrated on 26.922 / Electron 41 via static UI class scan + live CDP probes |
| Port | 9346 |

Re-run `node bin/ewp.js probe` after host upgrades and adjust `chromeSelectors`.

## workbuddy

| Field | Value |
| --- | --- |
| Host | WorkBuddy (unofficial compatibility) |
| Notes | Selectors follow known chrome classes; hashed grid classes use prefix match |
| Port | 9336 (default in profile) |

## generic-electron

Best-effort only. Expect to edit selectors per app.
