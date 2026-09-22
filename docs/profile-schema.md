# Profile schema

A profile is a JSON object.

```json
{
  "id": "my-app",
  "displayName": "My App (unofficial)",
  "processName": "MyApp",
  "exeHints": ["C:/Program Files/MyApp/MyApp.exe"],
  "defaultPort": 9346,
  "rootSelectors": ["html", "body", "#root", "#app"],
  "chromeSelectors": ["main", ".sidebar", "[data-sidebar]"],
  "keepOpaque": [".preview-panel", ".dialog"],
  "selectionRestore": "[data-sidebar] [aria-current='page']"
}
```

| Field | Meaning |
| --- | --- |
| `id` | Stable id |
| `displayName` | Human name (keep vendor names only as compatibility labels) |
| `processName` / `exeHints` | Optional discovery hints (`%LOCALAPPDATA%` style env is allowed in docs; resolve yourself) |
| `defaultPort` | CDP port |
| `rootSelectors` | Full-window surfaces that may host the wallpaper |
| `chromeSelectors` | Chrome to clear (`background-color` + `background-image`) |
| `keepOpaque` | Documented content surfaces — **not** cleared |
| `selectionRestore` | Optional neutral wash if clearing would erase selection state |

Optional `themeCss`: path to extra CSS merged before chrome-clear rules.
