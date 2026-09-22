// Printed after `npm install` — next steps for first-time users.
const lines = [
  '',
  'electron-wallpaper-panel — next steps',
  '-------------------------------------',
  'This package does NOT auto-skin any app. You must apply it yourself:',
  '',
  '  1) Start the target app with a loopback CDP port, e.g.',
  '       "/path/to/App.exe" --remote-debugging-port=9346',
  '',
  '  2) Apply a wallpaper (runtime only):',
  '       npx ewp apply --profile profiles/mimo-desktop.json --image ./wallpaper.jpg',
  '     or from a clone:',
  '       node bin/ewp.js apply --profile profiles/mimo-desktop.json --image ./wallpaper.jpg',
  '',
  '  3) Restore the native look:',
  '       npx ewp restore',
  '',
  'Details: README.md · 中文: README.zh-CN.md',
  'Optional helper: scripts/launch-with-port.ps1',
  '',
];
for (const line of lines) console.log(line);
