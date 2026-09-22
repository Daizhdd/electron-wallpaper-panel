# Security

## Threat model

- Styles and a small control panel are injected into a **local renderer** over CDP.
- The Chrome DevTools Protocol port is a **powerful local control surface**. Anyone who
  can reach that port can evaluate JavaScript in the app.

## Rules

1. **Loopback only.** Never bind `--remote-debugging-port` to a LAN/WAN address.
2. **Do not leave the debug port open** on shared or untrusted machines.
3. **Do not run restart helpers from inside an AI session** of the app you are about to kill.
4. Treat wallpaper images as untrusted input only insofar as the browser decodes them
   (standard image decode). Prefer local files you know.

## Reporting

Open a GitHub issue for security-relevant bugs (e.g. accidental remote exposure of CDP helpers).
Do not attach private logs, tokens, or screenshots with personal accounts.
