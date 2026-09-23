/* Floating wallpaper control panel — self-contained, no network. */
(() => {
  const PANEL_ID = 'ewp-panel';
  const FAB_ID = 'ewp-fab';
  const STYLE_ID = 'ewp-panel-style';

  // ---- i18n ---------------------------------------------------------------
  // `locales/*.json` are injected as window.__EWP_I18N.locales; FALLBACK keeps
  // the panel readable even if the payload was stripped. Resolution order:
  // explicit --lang / EWP_LANG  ->  navigator.language  ->  en-US.
  const FALLBACK = {
    'panel.title': 'Wallpaper',
    'panel.close': 'Close',
    'drop.title': 'Drop an image, or click to choose',
    'drop.strong': 'Drop image',
    'drop.weak': 'or click to pick',
    'path.placeholder': 'Image full path',
    'path.button': 'Path',
    veil: 'Background veil',
    opacity: 'Input opacity',
    apply: 'Apply',
    reset: 'Reset',
    'hint.line1': 'Veil 0 = raw image. Input opacity 0 = transparent chrome.',
    'hint.line2': 'Unofficial runtime skin. Restart the app with the debug port after updates.',
    'fab.title': 'Wallpaper panel',
    'fab.label': 'Wallpaper panel',
    'msg.dropped': 'Applied dropped image',
    'msg.dropFailed': 'Drop failed: %s',
    'msg.picked': 'Applied selected file',
    'msg.pickFailed': 'Pick failed: %s',
    'msg.enterPath': 'Enter a path',
    'msg.triedPath': 'Tried the path. Prefer drop or pick if nothing shows.',
    'msg.applied': 'Applied slider values',
    'msg.reset': 'Reset (style removed)',
    'err.readFailed': 'read failed',
    'err.decodeFailed': 'image decode failed'
  };

  const injected = (window.__EWP_I18N && window.__EWP_I18N.locales) || {};
  const catalog = Object.assign({}, injected);
  catalog['en-US'] = Object.assign({}, FALLBACK, catalog['en-US'] || {});

  function pickLocale() {
    const forced = window.__EWP_I18N && window.__EWP_I18N.forced;
    if (forced && catalog[forced]) return forced;
    const want = String(navigator.language || 'en').toLowerCase();
    const keys = Object.keys(catalog);
    return (
      keys.find(k => k.toLowerCase() === want) ||
      keys.find(k => k.toLowerCase().split('-')[0] === want.split('-')[0]) ||
      'en-US'
    );
  }

  const LOCALE = pickLocale();
  const L = Object.assign({}, FALLBACK, catalog[LOCALE] || {});
  const t = k => (L[k] == null ? k : L[k]);
  const tMsg = (k, v) => t(k).replace('%s', v);
  const esc = s =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const FAB_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<path d="M21 15l-5-5L5 21"/></svg>';

  // Re-mount when the resolved locale changes, so `--lang` works on a live app.
  if (window.__ewpPanelBoot && window.__ewpPanelLocale === LOCALE) return;
  if (window.__ewpPanelBoot) {
    [PANEL_ID, FAB_ID, STYLE_ID].forEach(id => {
      const n = document.getElementById(id);
      if (n) n.remove();
    });
    window.__ewpPanelBoot = false;
  }
  window.__ewpPanelBoot = true;
  window.__ewpPanelLocale = LOCALE;

  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      #${FAB_ID} {
        position: fixed; right: 14px; bottom: 72px; z-index: 99999;
        width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(128,128,128,.35);
        background: rgba(255,255,255,.85); color: #222; cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,.18); display: grid; place-items: center;
        font: 600 14px/1 system-ui, sans-serif; user-select: none; backdrop-filter: blur(8px);
      }
      #${PANEL_ID} {
        position: fixed; right: 14px; bottom: 122px; z-index: 99999;
        width: 300px; max-height: calc(100vh - 160px); overflow: auto;
        border-radius: 14px; border: 1px solid rgba(128,128,128,.28);
        background: rgba(255,255,255,.93); color: #1a1a1a;
        box-shadow: 0 12px 40px rgba(0,0,0,.22); padding: 14px;
        font: 13px/1.45 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
        backdrop-filter: blur(12px);
      }
      #${PANEL_ID}[hidden] { display: none !important; }
      #${PANEL_ID} .sp-title { display:flex; justify-content:space-between; align-items:center; font-weight:650; font-size:14px; margin-bottom:10px; }
      #${PANEL_ID} .sp-x { border:none; background:transparent; cursor:pointer; font-size:16px; width:28px; height:28px; border-radius:8px; color:#666; }
      #${PANEL_ID} .sp-drop {
        border:1.5px dashed rgba(128,128,128,.55); border-radius:12px; min-height:84px;
        display:grid; place-items:center; text-align:center; padding:12px; margin-bottom:10px;
        color:#555; cursor:pointer;
      }
      #${PANEL_ID} .sp-drop.drag { border-color:#3b82f6; background:rgba(59,130,246,.08); color:#1d4ed8; }
      #${PANEL_ID} .sp-row { display:flex; gap:8px; margin-bottom:8px; }
      #${PANEL_ID} .sp-row input[type=text] {
        flex:1; min-width:0; border:1px solid rgba(128,128,128,.35); border-radius:8px;
        padding:7px 9px; font:inherit; background:#fff; color:#111;
      }
      #${PANEL_ID} .sp-btn {
        border:1px solid rgba(128,128,128,.3); background:#f7f7f7; color:#222;
        border-radius:8px; padding:7px 12px; cursor:pointer; font:inherit; white-space:nowrap;
      }
      #${PANEL_ID} .sp-btn.primary { background:#151c13; color:#fff; border-color:#151c13; }
      #${PANEL_ID} .sp-label { display:flex; justify-content:space-between; margin:10px 0 4px; color:#444; font-size:12px; }
      #${PANEL_ID} input[type=range] { width:100%; accent-color:#3b82f6; }
      #${PANEL_ID} .sp-msg { min-height:18px; color:#2563eb; font-size:12px; margin-top:6px; }
      #${PANEL_ID} .sp-actions { display:flex; gap:8px; margin-top:10px; }
      #${PANEL_ID} .sp-actions .sp-btn { flex:1; text-align:center; }
      #${PANEL_ID} .sp-hint { color:#888; font-size:11px; margin-top:8px; line-height:1.5; }
    `;
    document.documentElement.appendChild(el);
  }

  function setVar(name, value) {
    if (value === null || value === undefined || value === '') {
      document.documentElement.style.removeProperty(name);
    } else {
      document.documentElement.style.setProperty(name, value);
    }
  }

  function applyScrim(v) {
    const theme = document.documentElement.getAttribute('data-theme');
    const a = (Number(v) / 100).toFixed(3);
    const veil =
      theme === 'dark' ? `rgba(0, 0, 0, ${a})` : `rgba(255, 255, 255, ${a})`;
    setVar('--ewp-scrim', veil);
    // also override legacy var if present
    setVar('--skin-scrim', veil);
  }

  function applyComposer(v) {
    const a = (Number(v) / 100).toFixed(3);
    setVar('--ewp-composer-alpha', a);
    setVar('--skin-composer-alpha', a);
  }

  function fileToDataUrl(file, maxW) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(t('err.readFailed')));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => reject(new Error(t('err.decodeFailed')));
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function meanLuma(uri) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 32, 32);
        try {
          const d = ctx.getImageData(0, 0, 32, 32).data;
          let sum = 0;
          for (let i = 0; i < d.length; i += 4) {
            sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          }
          resolve(sum / (d.length / 4));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = uri;
    });
  }

  function suggestScrim(luma) {
    if (luma == null) return 40;
    let a = 0;
    if (luma < 196) a = (196 - luma) / (255 - luma);
    return Math.round(Math.min(0.82, Math.max(0.4, a)) * 100);
  }

  function setWallpaperUri(uri) {
    setVar('--ewp-wallpaper', `url("${uri}")`);
    setVar('--mimo-wallpaper', `url("${uri}")`);
  }

  async function loadFile(file) {
    const uri = await fileToDataUrl(file, 2560);
    setWallpaperUri(uri);
    const luma = await meanLuma(uri);
    const s = suggestScrim(luma);
    const slider = document.getElementById('ewp-scrim');
    if (slider) {
      slider.value = String(s);
      applyScrim(s);
      const lab = document.getElementById('ewp-scrim-v');
      if (lab) lab.textContent = s + '%';
    }
  }

  function mount() {
    ensureCss();
    if (document.getElementById(FAB_ID) && document.getElementById(PANEL_ID)) return;

    let fab = document.getElementById(FAB_ID);
    if (!fab) {
      fab = document.createElement('button');
      fab.id = FAB_ID;
      fab.type = 'button';
      fab.title = t('fab.title');
      fab.setAttribute('aria-label', t('fab.label'));
      fab.innerHTML = FAB_ICON;
      document.documentElement.appendChild(fab);
    }

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.hidden = true;
      panel.innerHTML =
        '<div class="sp-title"><span>' + esc(t('panel.title')) + '</span>' +
        '<button class="sp-x" type="button" aria-label="' + esc(t('panel.close')) + '">✕</button></div>' +
        '<div class="sp-drop" id="ewp-drop" title="' + esc(t('drop.title')) + '">' +
        '<div><b>' + esc(t('drop.strong')) + '</b><br/>' + esc(t('drop.weak')) + '</div></div>' +
        '<input type="file" id="ewp-file" accept="image/*" hidden />' +
        '<div class="sp-row"><input type="text" id="ewp-path" placeholder="' + esc(t('path.placeholder')) + '" />' +
        '<button class="sp-btn" type="button" id="ewp-path-btn">' + esc(t('path.button')) + '</button></div>' +
        '<div class="sp-label"><span>' + esc(t('veil')) + '</span><span id="ewp-scrim-v">40%</span></div>' +
        '<input type="range" id="ewp-scrim" min="0" max="100" value="40" />' +
        '<div class="sp-label"><span>' + esc(t('opacity')) + '</span><span id="ewp-comp-v">0%</span></div>' +
        '<input type="range" id="ewp-comp" min="0" max="100" value="0" />' +
        '<div class="sp-actions"><button class="sp-btn primary" type="button" id="ewp-apply">' + esc(t('apply')) + '</button>' +
        '<button class="sp-btn" type="button" id="ewp-reset">' + esc(t('reset')) + '</button></div>' +
        '<div class="sp-msg" id="ewp-msg"></div>' +
        '<div class="sp-hint">' + esc(t('hint.line1')) + '<br/>' + esc(t('hint.line2')) + '</div>';
      document.documentElement.appendChild(panel);
    }

    const msg = (t, ok) => {
      const el = panel.querySelector('#ewp-msg');
      if (!el) return;
      el.textContent = t || '';
      el.style.color = ok === false ? '#d93025' : '#2563eb';
    };

    fab.onclick = () => {
      panel.hidden = !panel.hidden;
    };
    panel.querySelector('.sp-x').onclick = () => {
      panel.hidden = true;
    };

    const drop = panel.querySelector('#ewp-drop');
    const file = panel.querySelector('#ewp-file');
    drop.onclick = () => file.click();
    drop.ondragover = e => {
      e.preventDefault();
      drop.classList.add('drag');
    };
    drop.ondragleave = () => drop.classList.remove('drag');
    drop.ondrop = async e => {
      e.preventDefault();
      drop.classList.remove('drag');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      try {
        await loadFile(f);
        msg(t('msg.dropped'));
      } catch (err) {
        msg(tMsg('msg.dropFailed', err.message), false);
      }
    };
    file.onchange = async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try {
        await loadFile(f);
        msg(t('msg.picked'));
      } catch (err) {
        msg(tMsg('msg.pickFailed', err.message), false);
      }
      file.value = '';
    };

    panel.querySelector('#ewp-path-btn').onclick = () => {
      const p = (panel.querySelector('#ewp-path').value || '').trim().replace(/^["']|["']$/g, '');
      if (!p) {
        msg(t('msg.enterPath'), false);
        return;
      }
      let uri = p;
      if (!/^(https?:|data:|file:)/i.test(p)) {
        const norm = p.replace(/\\/g, '/');
        uri = 'file:///' + norm.replace(/^\//, '');
      }
      setWallpaperUri(uri);
      msg(t('msg.triedPath'));
    };

    panel.querySelector('#ewp-scrim').oninput = e => {
      const v = e.target.value;
      panel.querySelector('#ewp-scrim-v').textContent = v + '%';
      applyScrim(v);
    };
    panel.querySelector('#ewp-comp').oninput = e => {
      const v = e.target.value;
      panel.querySelector('#ewp-comp-v').textContent = v + '%';
      applyComposer(v);
    };

    panel.querySelector('#ewp-apply').onclick = () => {
      applyScrim(panel.querySelector('#ewp-scrim').value);
      applyComposer(panel.querySelector('#ewp-comp').value);
      msg(t('msg.applied'));
    };

    panel.querySelector('#ewp-reset').onclick = () => {
      setVar('--ewp-wallpaper', null);
      setVar('--ewp-scrim', null);
      setVar('--ewp-composer-alpha', null);
      setVar('--mimo-wallpaper', null);
      setVar('--skin-scrim', null);
      setVar('--skin-composer-alpha', null);
      panel.querySelector('#ewp-scrim').value = '40';
      panel.querySelector('#ewp-scrim-v').textContent = '40%';
      panel.querySelector('#ewp-comp').value = '0';
      panel.querySelector('#ewp-comp-v').textContent = '0%';
      document.documentElement.removeAttribute('data-ewp-skin');
      const st = document.getElementById('ewp-wallpaper-skin');
      if (st) st.remove();
      msg(t('msg.reset'));
    };
  }

  mount();
  window.__ewpPanelTimer = setInterval(() => {
    if (!document.getElementById(FAB_ID) || !document.getElementById(PANEL_ID)) mount();
  }, 1500);
})();
