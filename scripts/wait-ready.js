'use strict';
const { evalOnPage, testPort } = require('../lib/cdp');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const port = Number(arg('--port', '9346'));
const timeoutMs = Number(arg('--timeout-ms', '60000'));

const expr = `(() => ({
  ready: document.readyState === "complete" || document.readyState === "interactive",
  hasApp: !!(document.getElementById("root") || document.getElementById("app")),
  title: document.title || ""
}))()`;

(async () => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await testPort(port))) {
      await new Promise(r => setTimeout(r, 400));
      continue;
    }
    try {
      const raw = await evalOnPage(port, expr);
      const j = JSON.parse(raw);
      if (j.ready && (j.hasApp || (j.title && j.title !== 'about:blank'))) {
        process.stdout.write('ready\n');
        process.exit(0);
      }
    } catch {
      // target not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  process.stderr.write('timeout\n');
  process.exit(1);
})().catch(e => {
  process.stderr.write(String((e && e.message) || e) + '\n');
  process.exit(1);
});
