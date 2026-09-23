# Screenshots

Public-safe only. This set was captured straight from the renderer over CDP
(`Page.captureScreenshot` on a loopback debug port), so no desktop background,
window chrome of other apps, or OS-level screen watermark ends up in the image.
Sensitive UI was redacted before capture: account id, private conversation titles
and the author's own working notes are hidden.

| File | What it shows |
| --- | --- |
| `window.png` | Whole app window with the wallpaper applied, panel closed |
| `panel.png` | Close-up of the floating panel and its launcher button |
| `veil-compare.jpg` | The same wallpaper at 85% and 8% background veil |
| `before-after.jpg` | Native UI above, runtime wallpaper skin below |

Notes:

- Every shot uses the same window size, the same wallpaper and the same content,
  so each comparison differs by exactly one variable.
- `window.png` is the README hero image.
- Files are kept small on purpose (~1 MB total) and are excluded from the
  published npm package via the `docs/**/*.md` pattern in `package.json`.

**Do not** commit screenshots with personal avatars, user ids, tokens or private
chats. Re-read this list before replacing any file here.
