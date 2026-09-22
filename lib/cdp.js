'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const STYLE_ID = 'ewp-wallpaper-skin';

function getJSON(port, p) {
  return new Promise((res, rej) => {
    http
      .get({ host: '127.0.0.1', port, path: p }, r => {
        let d = '';
        r.on('data', c => (d += c));
        r.on('end', () => {
          try {
            res(JSON.parse(d));
          } catch (e) {
            rej(e);
          }
        });
      })
      .on('error', rej);
  });
}

async function withPage(port, fn) {
  const list = await getJSON(port, '/json/list');
  const page = list.find(t => t.type === 'page') || list[0];
  if (!page) throw new Error(`no page target on port ${port}`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise(res => {
      const myId = ++id;
      pending.set(myId, res);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  await new Promise(r => {
    ws.onopen = r;
  });
  try {
    return await fn(send, page);
  } finally {
    ws.close();
  }
}

function testPort(port) {
  return new Promise(resolve => {
    const socket = require('net').createConnection({ host: '127.0.0.1', port });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function mimeFor(p) {
  const e = path.extname(p || '').toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  if (e === '.gif') return 'image/gif';
  if (e === '.bmp') return 'image/bmp';
  return 'image/jpeg';
}

function loadImageDataUri(imagePath) {
  const buf = fs.readFileSync(imagePath);
  return `url(data:${mimeFor(imagePath)};base64,${buf.toString('base64')})`;
}

function loadPanelJs() {
  return fs.readFileSync(path.join(__dirname, '..', 'skin-panel.js'), 'utf8');
}

function loadLocales() {
  const dir = path.join(__dirname, '..', 'locales');
  const out = {};
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (!name.toLowerCase().endsWith('.json')) continue;
    try {
      out[name.slice(0, -'.json'.length)] = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    } catch {
      /* skip a malformed locale instead of failing the whole apply */
    }
  }
  return out;
}

function loadCss(themeCssPath) {
  const base = fs.readFileSync(path.join(__dirname, '..', 'theme', 'wallpaper.css'), 'utf8');
  const composer = fs.readFileSync(path.join(__dirname, '..', 'theme', 'composer.css'), 'utf8');
  let app = '';
  if (themeCssPath) {
    app = fs.readFileSync(themeCssPath, 'utf8');
  }
  return [app, base, composer].filter(Boolean).join('\n');
}

function buildChromeClearCss(profile) {
  const roots = (profile.rootSelectors || ['html', 'body'])
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => (s === 'html' || s === 'body' ? `html[data-ewp-skin] ${s}` : `html[data-ewp-skin] ${s}`));
  // Always paint wallpaper host on html itself (see wallpaper.css)
  const rootBlock = ['html[data-ewp-skin]'].concat(roots).join(',\n');
  const chrome = (profile.chromeSelectors || []).join(',\n  ');
  const sel = (profile.selectionRestore || '').trim();
  return `
${rootBlock} {
  /* wallpaper base handled in wallpaper.css; keep rule for cascade order */
}

html[data-ewp-skin] :is(
  ${chrome}
) {
  background-color: transparent !important;
  background-image: none !important;
}

${
  sel
    ? `html[data-ewp-skin] ${sel} {
  background-color: rgba(128, 128, 128, 0.25) !important;
}`
    : ''
}
`;
}

async function apply(port, profile, { imagePath, scrim, lang } = {}) {
  const wallpaper = imagePath ? loadImageDataUri(imagePath) : '';
  const chromeCss = buildChromeClearCss(profile);
  const themeCss = loadCss(profile.themeCss || null);
  const payload = `:root{--ewp-wallpaper:${wallpaper || 'none'};}\n` + themeCss + '\n' + chromeCss;
  const panelJs = loadPanelJs();
  const i18n = { locales: loadLocales(), forced: lang || undefined };

  const expr = `(() => {
    window.__EWP_I18N = ${JSON.stringify(i18n)};
    document.documentElement.setAttribute('data-ewp-skin', 'on');
    let el = document.getElementById(${JSON.stringify(STYLE_ID)});
    if (!el) {
      el = document.createElement('style');
      el.id = ${JSON.stringify(STYLE_ID)};
      document.documentElement.appendChild(el);
    }
    el.textContent = ${JSON.stringify(payload)};
    ${
      scrim != null
        ? `document.documentElement.style.setProperty('--ewp-scrim', ${JSON.stringify(
            `rgba(255,255,255,${Number(scrim)})`
          )});`
        : ''
    }
    try {
${panelJs}
    } catch (e) { return 'css ok, panel failed: ' + e.message; }
    return 'ok';
  })()`;

  return withPage(port, async send => {
    const out = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (out.result && out.result.exceptionDetails) {
      throw new Error(JSON.stringify(out.result.exceptionDetails));
    }
    return (out.result && out.result.result && out.result.result.value) || 'ok';
  });
}

async function restore(port) {
  const expr = `(() => {
    const s = document.getElementById(${JSON.stringify(STYLE_ID)});
    if (s) s.remove();
    ['mimo-skin-panel', 'ewp-panel', 'mimo-skin-fab', 'ewp-fab', 'mimo-skin-panel-style', 'ewp-panel-style'].forEach(id => {
      const n = document.getElementById(id); if (n) n.remove();
    });
    if (window.__mimoSkinPanelTimer) { clearInterval(window.__mimoSkinPanelTimer); window.__mimoSkinPanelTimer = null; }
    if (window.__ewpPanelTimer) { clearInterval(window.__ewpPanelTimer); window.__ewpPanelTimer = null; }
    window.__mimoSkinPanelBoot = false;
    window.__ewpPanelBoot = false;
    document.documentElement.removeAttribute('data-ewp-skin');
    document.documentElement.removeAttribute('data-mimo-skin');
    ['--ewp-wallpaper','--ewp-scrim','--ewp-composer-alpha','--mimo-wallpaper','--skin-scrim','--skin-composer-alpha'].forEach(n =>
      document.documentElement.style.removeProperty(n));
    return 'restored';
  })()`;
  return withPage(port, async send => {
    const out = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return (out.result && out.result.result && out.result.result.value) || 'restored';
  });
}

async function evalOnPage(port, expression) {
  return withPage(port, async send => {
    const out = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (out.result && out.result.exceptionDetails) {
      throw new Error(JSON.stringify(out.result.exceptionDetails));
    }
    const v = out.result && out.result.result ? out.result.result.value : undefined;
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  });
}

module.exports = {
  STYLE_ID,
  testPort,
  apply,
  restore,
  evalOnPage,
  withPage,
  getJSON,
  loadLocales
};
