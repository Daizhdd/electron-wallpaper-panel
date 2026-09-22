#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { apply, restore, evalOnPage, testPort } = require('../lib/cdp');

function fail(msg) {
  console.error('error:', msg);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function loadProfile(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) fail(`profile not found: ${abs}`);
  const p = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (!p.id) fail('profile.id required');
  return p;
}

function resolvePort(args, profile) {
  const n = Number(args.port || process.env.EWP_PORT || (profile && profile.defaultPort) || 9346);
  return Number.isFinite(n) ? n : 9346;
}

const PROBE_EXPR = `(() => {
  const cn = el => { const c = el && el.className; return (typeof c === 'string') ? c : (c && c.baseVal) || ''; };
  const vw = innerWidth, vh = innerHeight;
  const theme = document.documentElement.getAttribute('data-theme');
  const skin = document.documentElement.getAttribute('data-ewp-skin') || document.documentElement.getAttribute('data-mimo-skin');
  const trace = [[5,5],[vw/2,5],[5,vh/2],[vw/2,vh/2],[vw-5,vh/2],[vw/2,vh-5]].map(([x,y]) => {
    const stack = [];
    let el = document.elementFromPoint(x, y);
    let n = 0;
    while (el && el.tagName !== 'HTML' && n < 12) {
      const s = getComputedStyle(el);
      stack.push(el.tagName + (el.id ? '#'+el.id : '') + '.' + cn(el).slice(0,60) + ' | bg=' + s.backgroundColor);
      el = el.parentElement; n++;
    }
    return 'POINT ' + Math.round(x) + ',' + Math.round(y) + '\\n  ' + stack.join('\\n  ');
  }).join('\\n\\n');
  return 'theme=' + theme + ' skin=' + skin + ' vp=' + vw + 'x' + vh + '\\n\\n' + trace;
})()`;

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));

  if (!cmd || cmd === 'help' || cmd === '--help') {
    console.log(`electron-wallpaper-panel (unofficial)

usage:
  ewp apply   --profile profiles/mimo-desktop.json [--image file.jpg] [--port 9346] [--scrim 0-1]
  ewp restore [--port 9346]
  ewp status  [--port 9346]
  ewp probe   [--port 9346]
`);
    return;
  }

  if (cmd === 'status') {
    const port = resolvePort(args, null);
    const ok = await testPort(port);
    console.log(JSON.stringify({ port, cdp: ok }, null, 2));
    if (!ok) process.exitCode = 1;
    return;
  }

  if (cmd === 'probe') {
    const port = resolvePort(args, null);
    if (!(await testPort(port))) fail(`CDP port ${port} is closed. Start the app with --remote-debugging-port=${port}`);
    const text = await evalOnPage(port, PROBE_EXPR);
    console.log(text);
    return;
  }

  const profileArg = args.profile || 'profiles/generic-electron.json';
  const profile = loadProfile(profileArg);
  const port = resolvePort(args, profile);

  if (!(await testPort(port))) {
    fail(`CDP port ${port} is closed. Start the target app with --remote-debugging-port=${port}`);
  }

  if (cmd === 'apply') {
    const image = args.image ? path.resolve(String(args.image)) : null;
    if (image && !fs.existsSync(image)) fail(`image not found: ${image}`);
    const scrim = args.scrim != null && args.scrim !== true ? Number(args.scrim) : undefined;
    const result = await apply(port, profile, { imagePath: image, scrim });
    console.log('applied:', result);
    return;
  }

  if (cmd === 'restore') {
    const result = await restore(port);
    console.log('restore:', result);
    return;
  }

  fail(`unknown command: ${cmd}`);
}

main().catch(e => fail(e.message || String(e)));
