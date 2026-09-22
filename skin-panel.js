/* Floating wallpaper control panel — self-contained, no network. */
(() => {
  if (window.__ewpPanelBoot) return;
  window.__ewpPanelBoot = true;

  const PANEL_ID = 'ewp-panel';
  const FAB_ID = 'ewp-fab';
  const STYLE_ID = 'ewp-panel-style';

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
      reader.onerror = () => reject(new Error('read failed'));
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
        img.onerror = () => reject(new Error('image decode failed'));
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
      fab.title = 'Wallpaper panel';
      fab.textContent = '图';
      document.documentElement.appendChild(fab);
    }

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.hidden = true;
      panel.innerHTML =
        '<div class="sp-title"><span>Wallpaper</span><button class="sp-x" type="button">✕</button></div>' +
        '<div class="sp-drop" id="ewp-drop"><div><b>Drop image</b><br/>or click to pick</div></div>' +
        '<input type="file" id="ewp-file" accept="image/*" hidden />' +
        '<div class="sp-row"><input type="text" id="ewp-path" placeholder="Image full path" />' +
        '<button class="sp-btn" type="button" id="ewp-path-btn">Path</button></div>' +
        '<div class="sp-label"><span>Background veil</span><span id="ewp-scrim-v">40%</span></div>' +
        '<input type="range" id="ewp-scrim" min="0" max="100" value="40" />' +
        '<div class="sp-label"><span>Input opacity</span><span id="ewp-comp-v">0%</span></div>' +
        '<input type="range" id="ewp-comp" min="0" max="100" value="0" />' +
        '<div class="sp-actions"><button class="sp-btn primary" type="button" id="ewp-apply">Apply</button>' +
        '<button class="sp-btn" type="button" id="ewp-reset">Reset</button></div>' +
        '<div class="sp-msg" id="ewp-msg"></div>' +
        '<div class="sp-hint">Veil 0 = raw image. Input opacity 0 = transparent chrome.<br/>' +
        'Unofficial runtime skin. Restart the app with debug port after updates.</div>';
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
        msg('Applied dropped image');
      } catch (err) {
        msg('Drop failed: ' + err.message, false);
      }
    };
    file.onchange = async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try {
        await loadFile(f);
        msg('Applied selected file');
      } catch (err) {
        msg('Pick failed: ' + err.message, false);
      }
      file.value = '';
    };

    panel.querySelector('#ewp-path-btn').onclick = () => {
      const p = (panel.querySelector('#ewp-path').value || '').trim().replace(/^["']|["']$/g, '');
      if (!p) {
        msg('Enter a path', false);
        return;
      }
      let uri = p;
      if (!/^(https?:|data:|file:)/i.test(p)) {
        const norm = p.replace(/\\/g, '/');
        uri = 'file:///' + norm.replace(/^\//, '');
      }
      setWallpaperUri(uri);
      msg('Tried path. Prefer drop/pick if nothing shows.');
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
      msg('Applied slider values');
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
      msg('Reset (style removed)');
    };
  }

  mount();
  window.__ewpPanelTimer = setInterval(() => {
    if (!document.getElementById(FAB_ID) || !document.getElementById(PANEL_ID)) mount();
  }, 1500);
})();
