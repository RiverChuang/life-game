/* ============================================================
 * 人生遊戲 · 存檔（里程碑 1：存在瀏覽器本機）
 * 里程碑 4 會在這裡加上 Google 雲端硬碟同步。
 * ============================================================ */
(function (root) {
  'use strict';
  const PREFIX = 'lifegame.';
  const SLOTS = 10;

  function get(key) {
    try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }
  function set(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }
  function del(key) { try { localStorage.removeItem(PREFIX + key); } catch (e) { /* 忽略 */ } }

  function meta(S) {
    return { name: S.name, ageM: S.ageM, year: S.year, month: S.month, savedAt: Date.now(), ver: S.ver, ended: !!S.ended };
  }

  const Save = {
    SLOTS,
    auto() {
      const S = LG.state();
      if (!S) return true;
      return set('auto', { meta: meta(S), state: S });
    },
    loadAuto() { return get('auto'); },
    slot(n) { return get('slot.' + n); },
    saveSlot(n, label) {
      const S = LG.state();
      const m = meta(S);
      if (label) m.label = label;
      return set('slot.' + n, { meta: m, state: S });
    },
    delSlot(n) { del('slot.' + n); },
    list() {
      const out = [];
      for (let i = 1; i <= SLOTS; i++) out.push({ n: i, data: get('slot.' + i) });
      return out;
    },
    settings() { return Object.assign({ speed: 700, autoSkipReview: false }, get('settings') || {}); },
    saveSettings(s) { set('settings', s); },
    exportFile() {
      const S = LG.state();
      const blob = new Blob([JSON.stringify({ meta: meta(S), state: S })], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '人生遊戲_' + S.name + '_' + Math.floor(S.ageM / 12) + '歲.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    importFile(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          try {
            const o = JSON.parse(r.result);
            LG.load(o.state || o);
            resolve();
          } catch (e) { reject(e); }
        };
        r.onerror = reject;
        r.readAsText(file);
      });
    }
  };
  root.Save = Save;
})(window);
