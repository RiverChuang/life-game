/* ============================================================
 * 人生遊戲 · 2D 遊戲畫面
 * 標題 → 建立角色（外表 → 出生 → 天賦）→ 每月：排行程 → 播放結果與事件 → 回顧／評價 → 人生總結
 * ============================================================ */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const D = LG.data;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
  const END_AGE = 99;

  let settings = Object.assign({ speed: 1500, evAuto: true, autoSkipReview: false, statsOpen: false, music: true, vol: 0.6 }, Save.settings());
  const ui = { tab: 'month', idx: 0, auto: false, timer: null, modal: null, endSeen: false, form: null, step: 1, sched: null, pickSlot: 0, pickK: 'all' };

  const STAT_COLOR = { hp: '#ff6b8b', iq: '#63aef7', ch: '#ffb340', md: '#4fc3a1', ft: '#ff8a5c', cr: '#a48cf7' };
  const STAT_ICON = { hp: '❤️', iq: '🧠', ch: '✨', md: '😊', ft: '💪', cr: '🎨' };
  const STAT_LB = Object.assign({}, D.STATS, { st: '壓力', gr: '成績', perf: '工作表現' });
  const CAT_C = { d: '#4fc3a1', o: '#f5b83d', x: '#ff7a6b', f: '#a48cf7', s: '#5aa7f0' };
  const ACT_K = { study: '學習', sport: '運動', art: '才藝', social: '社交', leisure: '休閒' };
  const ACT_C = { study: '#63aef7', sport: '#ff8a5c', art: '#a48cf7', social: '#ffb340', leisure: '#4fc3a1' };
  const itemColor = it => it.kind === 'act' ? (ACT_C[it.k] || '#5aa7f0') : CAT_C[it.k || 'd'] || '#4fc3a1';

  /* ---------------- 小工具 ---------------- */
  const dateText = S => S.year + ' 年 ' + S.month + ' 月';
  const hapFace = v => (v >= 75 ? '😄' : v >= 60 ? '🙂' : v >= 45 ? '😐' : '😟');
  const relWord = r => (r >= 70 ? '很親近' : r >= 40 ? '感情不錯' : r >= 10 ? '普通' : r >= -20 ? '有點疏遠' : '關係緊張');
  const fmtD = v => (Math.abs(v) < 1 ? (v > 0 ? '↑' : '↓') : (v > 0 ? '+' : '') + v);
  const money = n => LG.fmtMoney(n);

  function toast(msg) {
    const box = document.getElementById('toast');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 3700);
  }
  function flushToasts(S) {
    if (!S.toasts || !S.toasts.length) return;
    S.toasts.forEach((t, i) => setTimeout(() => toast(t.t === 'ach' ? '🏆 解鎖成就：' + t.v : t.t === 'goal' ? t.v : '✨ 你發現了自己的特質：' + t.v), i * 400));
    S.toasts = [];
  }
  function autosave() { if (!Save.auto()) toast('⚠️ 自動存檔失敗：瀏覽器儲存空間不足或被封鎖'); }

  function chipHtml(c) {
    if (STAT_LB[c.k]) {
      const good = c.k === 'st' ? c.v < 0 : c.v > 0;
      return '<span class="' + (good ? 'up' : 'dn') + '">' + STAT_LB[c.k] + ' ' + fmtD(c.v) + '</span>';
    }
    switch (c.k) {
      case '$': return '<span class="' + (c.v > 0 ? 'up' : 'dn') + '">💰 ' + (c.v > 0 ? '+' : '') + money(c.v) + '</span>';
      case 'pay': return '<span class="' + (c.v > 0 ? 'up' : 'dn') + '">月薪 ' + (c.v > 0 ? '+' : '') + money(c.v) + '</span>';
      case 'rel': return '<span class="' + (c.v > 0 ? 'up' : 'dn') + '">' + esc(c.n) + ' 好感 ' + fmtD(c.v) + '</span>';
      case 'tag': return '<span class="sp">🏷️ ' + esc(c.v) + '</span>';
      case 'ach': return '<span class="sp">🏆 ' + esc(c.v) + '</span>';
      case 'trait': return '<span class="sp">✨ 發現特質：' + esc(c.v) + '</span>';
      case 'wealth': return '<span class="sp">🏠 家境變成「' + esc(c.v) + '」</span>';
      case 'home': return '<span class="sp">🏠 ' + esc(c.v) + '</span>';
      case 'inv': return '<span class="sp">📈 每月投資 ' + money(c.v) + '</span>';
      case 'pet': return '<span class="sp">🐾 新成員：' + esc(c.v) + '</span>';
      case 'loss': return '<span class="dn">🕊️ 離別：' + esc(c.v) + '</span>';
      case 'move': return '<span class="sp">🚚 搬到' + esc(c.v) + '</span>';
      case 'npc': return '<span class="sp">👶 新家人：' + esc(c.v) + '</span>';
      case 'contrib': return '<span class="up">善行 +' + c.v + '</span>';
      case 'skill': return '<span class="sp">⭐ ' + esc(c.v) + '</span>';
      case 'perf': return '<span class="' + (c.v > 0 ? 'up' : 'dn') + '">工作表現 ' + fmtD(c.v) + '</span>';
      case 'subj': return '<span class="' + (c.v > 0 ? 'up' : 'dn') + '">' + esc(c.n) + (c.v > 0 ? ' ⭕' : ' ❌') + '</span>';
      default: return '';
    }
  }
  function headIcon(S, size) {
    return Art.headshot(Art.playerSpec(S, 'home', null, 'happy'), size);
  }

  /* ---------------- 視窗 ---------------- */
  function openModal(html, opt) {
    closeModal();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    if (opt && opt.dismiss) wrap.addEventListener('click', e => { if (e.target === wrap) { closeModal(); scheduleNext(); } });
    document.body.appendChild(wrap);
    ui.modal = Object.assign({ el: wrap }, opt || {});
    clearTimeout(ui.timer);
  }
  function setModalHtml(html) { if (ui.modal) ui.modal.el.querySelector('.modal').innerHTML = html; }
  function closeModal() { if (ui.modal) { ui.modal.el.remove(); ui.modal = null; } }

  /* ---------------- 標題畫面 ---------------- */
  function titleArt() {
    const fake = (age, g, hair, top, skin, hc, mood, pose) => Art.person({ age, g, hair, hairC: hc, skin, wear: 'casual', cols: { top, bottom: '#5b7fb5', skirt: g === 'F' }, mood, bmi: 20, pose });
    const bg = Art.scene('park', { month: 4 });
    return '<svg viewBox="0 0 400 240" class="title-svg">' + bg +
      '<g transform="translate(118 214) scale(1.4)"><g class="bob">' + fake(26, 'F', 'pony', '#a8d8b9', Art.SKINS[1], '#56382b', 'happy', 'wave') + '</g></g>' +
      '<g transform="translate(182 214) scale(1.4)"><g class="bob2">' + fake(6, 'M', 'spiky', '#ffd27a', Art.SKINS[2], '#2f2725', 'happy', 'cheer') + '</g></g>' +
      '<g transform="translate(236 214) scale(1.4)"><g class="bob">' + Art.person({ age: 0.8, g: 'F', skin: Art.SKINS[0], cols: { top: '#f2b5d4' }, mood: 'happy' }) + '</g></g>' +
      '<g transform="translate(292 214) scale(-1.4 1.4)"><g class="bob2">' + fake(16, 'M', 'side', '#9cc5f0', Art.SKINS[1], '#8b5a3c', 'normal') + '</g></g>' +
      '<g transform="translate(70 214) scale(1.3)">' + Art.pet('狗', '#d9a46a', 'happy') + '</g></svg>';
  }
  function showTitle() {
    stopAuto();
    closeModal();
    const auto = Save.loadAuto();
    const cont = auto && auto.state && !auto.state.ended;
    app.innerHTML =
      '<div class="title-screen">' +
      '<div class="title-hero">' + titleArt() + '<div class="logo-wrap"><div class="logo">人生遊戲</div><div class="logo-sub">自己的人生，自己決定</div></div></div>' +
      '<div class="title-menu">' +
      (cont ? '<button class="btn btn-primary btn-block" data-act="continue">▶ 繼續人生：' + esc(auto.meta.name) + '（' + LG.ageText(auto.meta.ageM) + '）</button>' : '') +
      '<button class="btn ' + (cont ? 'btn-soft' : 'btn-primary') + ' btn-block" data-act="new">🌱 開始新的人生（3 歲起）</button>' +
      '<button class="btn btn-soft btn-block" data-act="challenge">🎯 職業挑戰（從入行開始）</button>' +
      '<button class="btn btn-soft btn-block" data-act="load">📂 讀取存檔</button>' +
      '<button class="btn btn-ghost btn-block" data-act="import">匯入存檔檔案</button>' +
      '</div>' +
      '<div class="title-music">' + musicBtn() + '</div>' +
      '<span class="proto-badge">v' + LG.version + '・3–' + END_AGE + ' 歲養成・活動 ' + (LG.ACTS || []).length + ' 種・事件 ' + LG.events.length + ' 則・職業 ' + (LG.JOBS || []).length + ' 種</span>' +
      '</div>';
  }

  /* ---------------- 建立角色 ---------------- */
  const WEALTH_PTS = [0, 20, 10, 0, -15, -30];
  const TALENT_BASE = 40, TALENT_PTS = 60, TALENT_MAX = 80;
  function randomForm() {
    const g = Math.random() < 0.5 ? 'M' : 'F';
    const st = {};
    D.STAT_KEYS.forEach(k => { st[k] = TALENT_BASE; });
    return {
      name: rnd(D.SURN) + rnd(g === 'M' ? D.GIV_M : D.GIV_F), gender: g,
      height: g === 'M' ? 162 + Math.floor(Math.random() * 22) : 152 + Math.floor(Math.random() * 18),
      weight: g === 'M' ? 56 + Math.floor(Math.random() * 22) : 44 + Math.floor(Math.random() * 16),
      zodiac: rnd(Object.keys(D.ZODIAC)), mode: 'single',
      hair: g === 'M' ? rnd(['short', 'side', 'spiky', 'curly']) : rnd(['bob', 'long', 'pony', 'twin', 'bun']),
      hairC: rnd(['black', 'dark', 'brown', 'black']), skin: Math.floor(Math.random() * 4),
      birth: { wealth: 3, city: '台北市', struct: 'both', sibs: 1, st, traits: [] }
    };
  }
  function talentLeft(f) {
    const used = D.STAT_KEYS.reduce((a, k) => a + (f.birth.st[k] - TALENT_BASE), 0);
    return TALENT_PTS + WEALTH_PTS[f.birth.wealth] - used;
  }
  function previewSvg(f) {
    const bmi = f.weight / Math.pow(f.height / 100, 2);
    const base = { g: f.gender, hair: f.hair, hairC: Art.HAIR_C[f.hairC], skin: Art.SKINS[f.skin], mood: 'happy' };
    const kid = Art.person(Object.assign({}, base, { age: 7, wear: 'elem', bmi: 16, bag: '#e8655a' }));
    const adult = Art.person(Object.assign({}, base, { age: 28, wear: 'casual', cols: { top: '#9cc5f0', bottom: '#5b7fb5', skirt: f.gender === 'F' }, bmi, pose: 'wave' }));
    const old = Art.person(Object.assign({}, base, { age: 75, wear: 'elder', cols: { top: '#c9a97f' }, bmi, glasses: true }));
    const h = Math.max(0.92, Math.min(1.1, f.height / (f.gender === 'M' ? 172 : 160)));
    return '<svg viewBox="0 0 300 150" class="preview-svg"><rect width="300" height="150" rx="18" fill="#fff4e4"/><ellipse cx="150" cy="138" rx="130" ry="8" fill="#f1e2c8"/>' +
      '<g transform="translate(70 136) scale(1.25)"><g class="bob2">' + kid + '</g></g>' +
      '<g transform="translate(150 136) scale(' + (1.25 * h).toFixed(3) + ')"><g class="bob">' + adult + '</g></g>' +
      '<g transform="translate(230 136) scale(' + (1.2 * h).toFixed(3) + ')"><g class="bob2">' + old + '</g></g>' +
      '<text x="70" y="22" text-anchor="middle" font-size="11" fill="#8a82a0">7 歲</text><text x="150" y="22" text-anchor="middle" font-size="11" fill="#8a82a0">28 歲</text><text x="230" y="22" text-anchor="middle" font-size="11" fill="#8a82a0">75 歲</text></svg>';
  }
  function stepper(n) {
    return '<div class="wiz-steps">' + (ui.challenge ? ['外表', '家庭'] : ['外表', '家庭', '3 歲能力']).map((t, i) => '<span class="' + (i + 1 === n ? 'on' : i + 1 < n ? 'done' : '') + '">' + (i + 1) + '. ' + t + '</span>').join('') + '</div>';
  }
  function showCreate() {
    stopAuto();
    closeModal();
    ui.form = ui.form || randomForm();
    if (ui.step === 2) return showBirth();
    if (ui.step === 3) return showTalent();
    const f = ui.form;
    const zs = Object.keys(D.ZODIAC);
    app.innerHTML =
      '<div class="page">' +
      '<button class="btn btn-ghost" data-act="title">← 返回</button>' + stepper(1) +
      '<h2>你的樣子</h2><p class="muted small">從嬰兒到白髮蒼蒼，你的角色都會照著這個樣子長大。</p>' +
      '<div class="preview card" id="preview">' + previewSvg(f) + '</div>' +
      '<div class="field"><label for="f-name">姓名</label><div class="row"><input id="f-name" class="text-input grow" maxlength="8" value="' + esc(f.name) + '" autocomplete="off"><button class="icon-btn" data-act="rand-name" aria-label="隨機取名">🎲</button></div></div>' +
      '<div class="field"><label>性別</label><div class="seg">' +
      '<button data-act="f-gender" data-v="M" class="' + (f.gender === 'M' ? 'on' : '') + '">男生</button>' +
      '<button data-act="f-gender" data-v="F" class="' + (f.gender === 'F' ? 'on' : '') + '">女生</button></div></div>' +
      '<div class="field"><label>髮型</label><div class="chips">' + Art.HAIR_STYLES.map(h => '<button data-act="f-hair" data-v="' + h.k + '" class="' + (f.hair === h.k ? 'on' : '') + '">' + h.n + '</button>').join('') + '</div></div>' +
      '<div class="field"><label>髮色</label><div class="swatches">' + Art.HAIR_COLORS.map(h => '<button data-act="f-hairc" data-v="' + h.k + '" class="sw' + (f.hairC === h.k ? ' on' : '') + '" style="background:' + h.c + '" aria-label="' + h.n + '"></button>').join('') + '</div></div>' +
      '<div class="field"><label>膚色</label><div class="swatches">' + Art.SKINS.map((c, i) => '<button data-act="f-skin" data-v="' + i + '" class="sw' + (f.skin === i ? ' on' : '') + '" style="background:' + c + '" aria-label="膚色 ' + (i + 1) + '"></button>').join('') + '</div></div>' +
      '<div class="field"><label for="f-h">成年後的身高</label><div class="range-row"><input type="range" id="f-h" min="140" max="200" value="' + f.height + '"><span class="val" id="v-h">' + f.height + ' cm</span></div></div>' +
      '<div class="field"><label for="f-w">成年後的體重</label><div class="range-row"><input type="range" id="f-w" min="35" max="120" value="' + f.weight + '"><span class="val" id="v-w">' + f.weight + ' kg</span></div><p class="muted small">之後會隨運動與生活習慣改變。</p></div>' +
      '<div class="field"><label>星座</label><div class="chips">' + zs.map(z => '<button data-act="f-zodiac" data-v="' + z + '" class="' + (f.zodiac === z ? 'on' : '') + '">' + z.replace('座', '') + '</button>').join('') + '</div><p class="muted small">星座決定你的出生月份。</p></div>' +
      '<div class="field"><label>遊戲模式</label><div class="seg"><button class="on">單局獨立</button><button disabled>傳承制（之後推出）</button></div></div>' +
      '</div>' +
      '<div class="sticky-bottom"><div class="inner"><button class="btn btn-soft" data-act="rand-all">🎲 隨機</button><button class="btn btn-primary grow" data-act="wiz-next">下一步：家庭 →</button></div></div>';
    const h = document.getElementById('f-h'), w = document.getElementById('f-w'), n = document.getElementById('f-name');
    const upd = () => { document.getElementById('preview').innerHTML = previewSvg(f); };
    h.addEventListener('input', () => { f.height = +h.value; document.getElementById('v-h').textContent = h.value + ' cm'; upd(); });
    w.addEventListener('input', () => { f.weight = +w.value; document.getElementById('v-w').textContent = w.value + ' kg'; upd(); });
    n.addEventListener('input', () => { f.name = n.value; });
  }
  const WEALTH_D = ['', '日子過得很辛苦，但天賦點數最多。', '省吃儉用，生活還過得去。', '一般家庭，不愁吃穿。', '物質充裕，可以學很多才藝。', '含著金湯匙出生，天賦點數最少。'];
  function showBirth() {
    const f = ui.form, B = f.birth;
    app.innerHTML =
      '<div class="page">' +
      '<button class="btn btn-ghost" data-act="wiz-back">← 上一步</button>' + stepper(2) +
      '<h2>你出生在什麼樣的家？</h2><p class="muted small">家境越好，能用來分配的天賦點數越少。</p>' +
      '<div class="field"><label>家境</label>' + [1, 2, 3, 4, 5].map(w => '<button class="opt-card' + (B.wealth === w ? ' on' : '') + '" data-act="b-wealth" data-v="' + w + '"><b>' + D.WEALTH[w].n + '</b><span class="pts">' + (WEALTH_PTS[w] > 0 ? '+' + WEALTH_PTS[w] : WEALTH_PTS[w] < 0 ? WEALTH_PTS[w] : '±0') + ' 點</span><div class="small muted">' + WEALTH_D[w] + '</div></button>').join('') + '</div>' +
      '<div class="field"><label for="b-city">出生地</label><select id="b-city" class="text-input">' + D.CITIES.map(c => '<option value="' + c[0] + '"' + (B.city === c[0] ? ' selected' : '') + '>' + c[0] + '（' + D.TIER_N[c[1]] + '）</option>').join('') + '</select><p class="muted small">都市機會多但生活費高；偏鄉生活費低、步調慢。</p></div>' +
      '<div class="field"><label>家庭</label><div class="chips">' + Object.keys(D.STRUCTS).map(k => '<button data-act="b-struct" data-v="' + k + '" class="' + (B.struct === k ? 'on' : '') + '">' + D.STRUCTS[k].n + '</button>').join('') + '</div></div>' +
      '<div class="field"><label>兄弟姊妹</label><div class="seg seg5">' + [0, 1, 2, 3, 4].map(n => '<button data-act="b-sibs" data-v="' + n + '" class="' + (B.sibs === n ? 'on' : '') + '">' + (n ? n + ' 個' : '獨生') + '</button>').join('') + '</div></div>' +
      '</div>' +
      '<div class="sticky-bottom"><div class="inner">' + (ui.challenge ? '<button class="btn btn-primary grow" data-act="start-challenge">🎯 開始挑戰！</button>' : '<button class="btn btn-primary grow" data-act="wiz-next">下一步：3 歲能力 →</button>') + '</div></div>';
    document.getElementById('b-city').addEventListener('change', e => { B.city = e.target.value; });
  }
  function showTalent() {
    const f = ui.form, B = f.birth;
    const left = talentLeft(f);
    const conflict = t => (D.TRAIT_CONFLICT || []).some(([x, y]) => (t === x && B.traits.includes(y)) || (t === y && B.traits.includes(x)));
    app.innerHTML =
      '<div class="page">' +
      '<button class="btn btn-ghost" data-act="wiz-back">← 上一步</button>' + stepper(3) +
      '<h2>3 歲時的能力</h2><p class="muted small">遊戲從 3 歲開始。分配你 3 歲時的能力，每項從 ' + TALENT_BASE + ' 開始，最多 ' + TALENT_MAX + '。之後怎麼成長，看你每個月怎麼安排。</p>' +
      '<div class="left-pts' + (left < 0 ? ' neg' : '') + '">剩餘點數 <b>' + left + '</b>（家境「' + D.WEALTH[B.wealth].n + '」' + (WEALTH_PTS[B.wealth] > 0 ? '+' : '') + WEALTH_PTS[B.wealth] + '）</div>' +
      D.STAT_KEYS.map(k => '<div class="alloc-row card"><div class="grow"><div class="an">' + STAT_ICON[k] + ' ' + D.STATS[k] + ' <b>' + B.st[k] + '</b></div><div class="bar"><i style="width:' + B.st[k] + '%;background:' + STAT_COLOR[k] + '"></i></div></div>' +
        '<button class="step" data-act="t-stat" data-k="' + k + '" data-d="-5"' + (B.st[k] <= 10 ? ' disabled' : '') + ' aria-label="減少">−</button>' +
        '<button class="step" data-act="t-stat" data-k="' + k + '" data-d="5"' + (B.st[k] >= TALENT_MAX || left < 5 ? ' disabled' : '') + ' aria-label="增加">＋</button></div>').join('') +
      '<div class="field"><label>個性特質（最多選 2 個，也可以不選）</label><div class="trait-grid">' +
      Object.keys(D.TRAITS).map(t => { const on = B.traits.includes(t); const dis = !on && (B.traits.length >= 2 || conflict(t)); return '<button class="trait-opt' + (on ? ' on' : '') + '" data-act="t-trait" data-v="' + t + '"' + (dis ? ' disabled' : '') + '><b>' + t + '</b><span>' + D.TRAITS[t].d + '</span></button>'; }).join('') +
      '</div><p class="muted small">都不選的話，會隨機出現 2–3 個你還不知道的特質。</p></div>' +
      '</div>' +
      '<div class="sticky-bottom"><div class="inner"><button class="btn btn-soft" data-act="t-reset">重設</button><button class="btn btn-primary grow" data-act="start"' + (left < 0 ? ' disabled' : '') + '>誕生！</button></div></div>';
  }
  function startLife() {
    const f = ui.form;
    if (!f.name.trim()) { toast('請先輸入名字'); ui.step = 1; showCreate(); return; }
    if (talentLeft(f) < 0) { toast('天賦點數超過了'); return; }
    const B = f.birth;
    const birth = { wealth: B.wealth, city: B.city, struct: B.struct, sibs: B.sibs, st: Object.assign({}, B.st) };
    if (B.traits.length) birth.traits = B.traits.slice();
    LG.newGame({ name: f.name.trim(), gender: f.gender, height: f.height, weight: f.weight, zodiac: f.zodiac, mode: f.mode, look: { hair: f.hair, hairC: f.hairC, skin: Art.SKINS[f.skin] }, birth });
    ui.form = null; ui.step = 1; ui.endSeen = false; ui.tab = 'month'; ui.idx = 0; ui.sched = null;
    autosave();
    showGame();
  }

  /* ---------------- 主畫面 ---------------- */
  function musicBtn() {
    if (!window.Music || !Music.supported()) return '';
    return '<button class="icon-btn music-btn' + (settings.music ? ' on' : '') + '" data-act="music" aria-label="' + (settings.music ? '關閉音樂' : '開啟音樂') + '">' + (settings.music ? '🎵' : '🔇') + '</button>';
  }
  function musicTheme() {
    const S = LG.state();
    if (!window.Music) return;
    const a = S ? S.ageM / 12 : 10;
    Music.setTheme(a < 3 || a >= 70 ? 'calm' : 'day');
  }
  function topbar(S) {
    const st = LG.stageOf(S.ageM);
    return '<header class="topbar"><div class="avatar">' + headIcon(S, 46) + '</div>' +
      '<div class="who"><div class="nm">' + esc(S.name) + '<span class="stage-chip">' + st.n + '</span></div>' +
      '<div class="sub">' + LG.ageText(S.ageM) + '・' + dateText(S) + '</div><div class="sub2">' + esc(LG.schoolText()) + '</div></div>' +
      musicBtn() + '<button class="icon-btn" data-act="menu" aria-label="選單">☰</button></header>';
  }
  function statRow(label, icon, v, color) {
    v = Math.round(v);
    return '<div class="stat"><div class="lb"><span>' + icon + ' ' + label + '</span><b>' + v + '</b></div><div class="bar"><i style="width:' + v + '%;background:' + color + '"></i></div></div>';
  }
  function statsPanel(S) {
    const hap = LG.happiness();
    const bars = D.STAT_KEYS.map(k => statRow(D.STATS[k], STAT_ICON[k], S.st[k], STAT_COLOR[k])).join('') + statRow('壓力', '😰', S.stress, '#c9b8b0');
    let third = '—', thirdK = '成績';
    const subj = LG.inSchool() && S.school.stage !== 'kinder' && LG.subjects ? '<div class="subj-row">' + LG.subjects().map(x => '<span><b>' + x.n + '</b>' + (S.school.stage === 'elem' ? LG.gradeLabel(x.v) : x.v) + '</span>').join('') + '</div>' : '';
    if (LG.inSchool()) third = S.school.stage === 'elem' ? LG.gradeLabel(S.grades) + '等' : Math.round(S.grades) + ' 分';
    else if (S.job && LG.status() === 'work') { thirdK = '工作表現'; third = Math.round(S.job.perf); }
    const adult = S.ageM >= 216;
    return '<section class="stats card ' + (settings.statsOpen ? '' : 'collapsed') + '">' +
      '<div class="stats-head"><span class="hap">' + hapFace(hap) + ' 幸福度 ' + hap + '</span><span class="money' + (S.money < 0 ? ' neg' : '') + '">💰 ' + money(S.money) + '</span>' +
      '<button class="toggle-stats" data-act="toggle-stats">' + (settings.statsOpen ? '收起 ▲' : '能力 ▼') + '</button></div>' +
      '<div class="stats-grid">' + bars + '</div>' +
      '<div class="facts"><div class="fact"><div class="k">' + thirdK + '</div><div class="v">' + third + '</div></div>' +
      '<div class="fact"><div class="k">身高</div><div class="v">' + Math.round(S.hgt) + ' cm</div></div>' +
      '<div class="fact"><div class="k">體重</div><div class="v">' + Math.round(S.wgt) + ' kg</div></div></div>' + subj +
      (adult && S.fin ? '<div class="fin-line">本月收支 <b class="' + (S.fin.net >= 0 ? 'up' : 'dn') + '">' + (S.fin.net >= 0 ? '+' : '') + money(S.fin.net) + '</b>・' + esc(D.HOME_N[S.home] || '') + '</div>' : '') +
      '</section>';
  }

  // 目前顯示的事件
  function curItem(S) { return S.cur.items[Math.min(ui.idx, S.cur.items.length - 1)]; }
  function seenAll(S) { return ui.idx >= S.cur.items.length; }
  function monthDone(S) { return seenAll(S) && S.cur.phase === 'post'; }
  function planning(S) { return seenAll(S) && !S.ended && LG.needSchedule(); }

  function dialogHtml(S) {
    const items = S.cur.items;
    if (S.ended && monthDone(S)) {
      return '<div class="dialog card"><div class="dtab" style="--c:#a48cf7">人生總結</div><p class="dtext">' + (S.dead ? '這段人生走到了終點。' : '你走完了人生的前 ' + END_AGE + ' 年。') + '</p><div class="dfoot"><span></span><button class="btn btn-primary" data-act="end">查看人生總結 →</button></div></div>';
    }
    if (planning(S)) return weekPanel(S);
    if (seenAll(S) && S.cur.phase === 'pre') return '<div class="dialog card"><p class="dtext">……</p></div>';
    if (monthDone(S)) {
      const fin = S.fin && S.ageM >= 216 ? '<div class="fin-sum">本月收入 <b class="up">' + money(S.fin.inc) + '</b>　支出 <b class="dn">' + money(S.fin.exp) + '</b></div>' : '';
      return '<div class="dialog card"><div class="dtab" style="--c:#5aa7f0">' + S.month + ' 月結束</div>' +
        '<p class="dtext">' + rnd(['這個月就這樣過去了。', '日子一天一天地過。', '又是新的一頁要翻開了。']) + '</p>' + fin +
        '<div class="dfoot"><span class="muted small">' + items.length + ' 件事</span><button class="btn btn-primary" data-act="next-month">下個月 ▶</button></div></div>';
    }
    const it = curItem(S);
    const i = ui.idx;
    const k = it.k || 'd';
    const cat = it.kind === 'sys' ? '人生關卡' : it.kind === 'act' ? (it.ico || '') + ' 行程・' + (ACT_K[k] || '') : it.kind === 'week' ? '📅 一週生活' : it.kind === 'walk' ? '🚶 出門走走' : it.kind === 'soc' ? '💬 人際' : it.kind === 'buy' ? '🛍️ 生活' : D.CAT[k];
    let h = '<div class="dialog card' + (it.done ? '' : ' pending') + '"><div class="dtab" style="--c:' + itemColor(it) + '">' + cat + (it.title && it.title !== cat ? '・' + esc(it.title) : '') + '</div>' +
      '<p class="dtext">' + esc(it.text) + '</p>';
    if (it.kind === 'week' && it.days) h += '<div class="wk-strip">' + it.days.map(d => '<span class="' + (d.a ? '' : 'off') + '"><b>' + d.n + '</b>' + (d.ico || '·') + '</span>').join('') + '</div>';
    if (!it.done) {
      h += '<div class="choices">' + it.choices.map((c, j) =>
        '<button class="choice" data-act="choose" data-i="' + i + '" data-j="' + j + '"' + (c.dis ? ' disabled' : '') + '>' +
        '<span class="ct">' + esc(c.t) + (c.d ? '<span class="cd">' + esc(c.d) + '</span>' : '') + (c.dis ? '<span class="cd">🔒 ' + esc(c.dis) + '</span>' : '') + '</span>' +
        (c.pct != null ? '<span class="pct">成功率 ' + c.pct + '%</span>' : '') + '</button>').join('') + '</div>';
    } else {
      if (it.choices && it.picked != null) h += '<div class="picked">→ ' + esc(it.choices[it.picked].t) + (it.ok === true ? '<span class="okng ok">成功</span>' : it.ok === false ? '<span class="okng ng">失敗</span>' : '') + '</div>';
      if (it.res) h += '<p class="res">' + esc(it.res) + '</p>';
      if (it.chips && it.chips.length) h += '<div class="fx">' + it.chips.map(chipHtml).join('') + '</div>';
    }
    const dots = items.map((x, j) => '<i class="' + (j < i ? 'seen' : j === i ? 'now' : '') + (x.done ? '' : ' wait') + '"></i>').join('');
    h += '<div class="dfoot"><span class="dots">' + dots + '</span>' + (it.done ? '<button class="btn btn-next" data-act="next-ev">' + (i >= items.length - 1 ? (S.cur.phase === 'pre' ? '排這週行程 ▶' : S.cur.phase === 'week' ? '回到小鎮 ▶' : '這個月結束 ▶') : '下一則 ▶') + '</button>' : '<span class="muted small">選一個吧</span>') + '</div></div>';
    return h;
  }

  /* ---------------- 每週七日行程 ---------------- */
  function fxText(fx) {
    const out = [];
    for (const k of Object.keys(fx || {})) {
      if (D.STATS[k]) out.push(D.STATS[k] + (fx[k] > 0 ? '↑' : '↓'));
      else if (k === 'st') out.push(fx[k] < 0 ? '壓力↓' : '壓力↑');
      else if (k === 'rel') out.push('感情↑');
      else if (k === 'perf') out.push('工作表現↑');
      else if (k === 'contrib') out.push('善行');
      else if (k === 'gr') out.push('成績↑');
    }
    return out.slice(0, 4).join(' ');
  }
  const SUBJ_N = { chi: '國文', eng: '英文', math: '數學', soc: '社會', sci: '自然' };
  function actCardInner(a, k) {
    const cost = a.cost ? Math.round(a.cost * (k || 1)) : 0;
    return '<span class="aico">' + (a.ico || '•') + '</span><span class="grow"><span class="an">' + esc(a.n) + '</span><span class="ad">' + (a.subj ? SUBJ_N[a.subj] + '成績↑ ' : '') + fxText(a.fx) +
      (a.skill ? '・' + esc(a.skill.n) + ' ' + esc(a.skill.lvN) : '') + '</span></span>' +
      (cost ? '<span class="acost">' + (a.fam ? '家裡出 ' : '−') + money(cost) + '</span>' : a.inc ? '<span class="acost up">+' + money(Math.round(a.inc * (k || 1))) + '</span>' : '');
  }
  function weekInfo() {
    const W = LG.week();
    const key = LG.state().ageM + '-' + W.n;
    if (!ui.plan7 || ui.planKey !== key) { ui.plan7 = W.plan.slice(); ui.planKey = key; }
    return W;
  }
  function weekPanel(S) {
    const W = weekInfo();
    const byId = id => W.list.find(x => x.id === id);
    let h = '<div class="dialog card plan"><div class="dtab" style="--c:#5aa7f0">' + S.month + ' 月第 ' + W.n + ' 週的行程</div>' +
      '<p class="dtext small">每一天想做什麼？點一下可以換。平日是' + (W.days.some(d => d.lock) ? '放學或下班後的時間' : '一整天') + '，週末是一整天。</p><div class="week-grid">';
    W.days.forEach(D => {
      const id = ui.plan7[D.d], a = id && byId(id);
      h += '<div class="day-row"><span class="dname' + (D.d >= 5 ? ' we' : '') + '">' + D.n + '</span>';
      if (D.k === 0) h += '<div class="slot-card locked grow"><span class="aico">🔒</span><span class="grow"><span class="an">' + esc(D.lock.lbl) + '</span><span class="ad">整天固定行程</span></span></div>';
      else h += '<button class="slot-card grow" data-act="pick-day" data-d="' + D.d + '" style="--c:' + (a ? ACT_C[a.k] : '#ccc') + '">' + (D.lock ? '<span class="lockchip">' + esc(D.lock.lbl) + '後</span>' : '') + (a ? actCardInner(a, D.k) : '<span class="grow">（還沒排）</span>') + '</button>';
      h += '</div>';
    });
    h += '</div><div class="dfoot"><span class="muted small">' + (S.money < 0 && S.ageM >= 216 ? '⚠️ 存款是負的' : '排好就出發吧！') + '</span><button class="btn btn-primary" data-act="run-week">開始這週 ▶</button></div></div>';
    return h;
  }
  function openPicker(day) {
    ui.pickDay = day;
    ui.pickScope = 'day';
    const draw = () => {
      const W = LG.week();
      const D = W.days[ui.pickDay];
      const ks = ['all'].concat(Object.keys(ACT_K).filter(k => W.list.some(a => a.k === k)));
      if (!ks.includes(ui.pickK)) ui.pickK = 'all';
      const list = W.list.filter(a => ui.pickK === 'all' || a.k === ui.pickK).sort((a, b) => (!!a.why - !!b.why));
      const scopes = [['day', '只排星期' + D.n], ui.pickDay < 5 ? ['wkd', '平日都排這個'] : ['wke', '週末都排這個'], ['all', '整週都排這個']];
      return '<h2>星期' + D.n + '要做什麼？</h2>' +
        '<div class="seg seg3 scope">' + scopes.map(s => '<button data-act="pick-scope" data-v="' + s[0] + '" class="' + (ui.pickScope === s[0] ? 'on' : '') + '">' + s[1] + '</button>').join('') + '</div>' +
        '<div class="chips pick-tabs">' + ks.map(k => '<button data-act="pick-k" data-v="' + k + '" class="' + (ui.pickK === k ? 'on' : '') + '">' + (k === 'all' ? '全部' : ACT_K[k]) + '</button>').join('') + '</div>' +
        '<div class="act-list">' + list.map(a => '<button class="act-row" data-act="pick-act" data-v="' + a.id + '" style="--c:' + ACT_C[a.k] + '"' + (a.why ? ' disabled' : '') + '>' + actCardInner(a, D.k) + (a.why ? '<span class="why">🔒 ' + esc(a.why) + '</span>' : '') + '</button>').join('') + '</div>' +
        '<div class="sheet-actions"><button class="btn btn-ghost" data-act="close-picker">取消</button></div>';
    };
    openModal(draw(), { type: 'picker', draw, dismiss: true });
  }
  function runWeek() {
    const S = LG.state();
    if (!LG.needSchedule()) return;
    weekInfo();
    const from = S.cur.items.length;
    LG.runWeek(ui.plan7 || []);
    ui.plan7 = null; ui.pos = 'home'; ui.townKey = null;
    autosave();
    ui.idx = from;
    render(); window.scrollTo(0, 0);
    afterRender();
  }
  function endWeek() {
    const S = LG.state();
    const from = S.cur.items.length;
    if (!LG.endWeek()) return;
    autosave();
    ui.idx = from;
    render(); window.scrollTo(0, 0);
    afterRender();
  }

  /* ---------------- 小鎮 ---------------- */
  function inTown(S) { return seenAll(S) && !S.ended && S.cur.phase === 'week'; }
  function townSpots(S) {
    const W = LG.week();
    const cnt = {};
    return W.spots.map(sp => {
      let sc = 'park';
      try { sc = Art.pickScene({ sn: sp.sn, text: sp.txt, title: sp.title, id: sp.id }, S); } catch (e) { /* 用預設 */ }
      const jd = S.job && LG.status() === 'work' ? LG.jobDef(S.job.id) : null;
      let loc = jd && sc === jd.sn ? 'office' : Town.SCENE_LOC[sc] || 'park';
      if (loc === 'office' && LG.status() !== 'work') loc = 'station';
      cnt[loc] = (cnt[loc] || 0) + 1;
      return { i: sp.i, loc, k: sp.k, txt: sp.txt, n: cnt[loc] - 1 };
    });
  }
  const SOC_ROLES = ['mom', 'dad', 'grandma', 'grandpa', 'sib', 'friend', 'crush', 'spouse', 'child', 'grandchild', 'colleague', 'oldfriend'];
  function townNpcs(S) {
    const key = S.ageM + '-' + (S.wk ? S.wk.n : 0);
    if (ui.townKey === key && ui.townNpcs) return ui.townNpcs;
    const pool = S.npcs.filter(n => n.alive && SOC_ROLES.includes(n.role) && LG.npcAge(n) >= 2).sort((a, b) => (b.role === 'crush') - (a.role === 'crush') || b.rel - a.rel).slice(0, 8);
    const locs = ['park', 'cafe', 'shop', 'temple', 'school', 'station', 'hospital'];
    const out = [];
    const pickN = Math.min(3, pool.length);
    const sh = pool.slice().sort(() => Math.random() - 0.5).slice(0, pickN);
    sh.forEach((n, i) => {
      const loc = locs[(i * 3 + S.ageM) % locs.length];
      out.push({ id: n.id, loc, dx: 26 + (i % 2) * 6, dy: -4, name: n.name || LG.npcLabel(n), spec: Art.npcSpec(n, S, 'happy') });
    });
    ui.townKey = key; ui.townNpcs = out;
    return out;
  }
  function meXY(k) { const L = Town.LOCS[k] || Town.LOCS.home; return { x: L.x, y: L.y }; }
  function townView(S) {
    const W = LG.week();
    const spots = townSpots(S);
    const me = meXY(ui.pos || 'home');
    const meSvg = Art.person(Object.assign(Art.playerSpec(S, 'park', null, 'happy'), { pose: 'idle' }));
    const svg = Town.svg(S, { spots, npcs: townNpcs(S), me, meSvg });
    let h = '<div class="town card">' + svg + '</div>';
    h += '<div class="dialog card"><div class="dtab" style="--c:#4fc3a1">' + S.month + ' 月第 ' + W.n + ' 週・自由時間</div>' +
      '<p class="dtext small">' + (W.outMax ? '點地圖上的地點或 ❗ 走過去看看，點朋友可以約他。這週還能外出 <b>' + W.out + '</b> 次，約會 <b>' + (W.socMax - W.soc) + '</b> 次。' : '你還太小，不能自己出門。在家好好長大吧！') + '</p>';
    if (spots.length) h += '<div class="spot-list">' + spots.map(sp => '<button class="spot-row" data-act="town-spot" data-i="' + sp.i + '" data-k="' + sp.loc + '"><span class="sdot" style="background:' + CAT_C[sp.k] + '">!</span><span class="grow">' + esc(Town.LOCS[sp.loc].n) + '：' + esc(sp.txt.length > 24 ? sp.txt.slice(0, 23) + '…' : sp.txt) + '</span></button>').join('') + '</div>';
    h += '<div class="dfoot"><span class="muted small">' + (W.out ? '' : '這週的外出次數用完了') + '</span><button class="btn btn-primary" data-act="end-week">結束這週 ▶</button></div></div>';
    return h;
  }
  function walkTo(k, cb) {
    const el = document.getElementById('town-me');
    const from = meXY(ui.pos || 'home'), to = meXY(k);
    ui.pos = k;
    if (!el || (from.x === to.x && from.y === to.y)) { cb && cb(); return; }
    const road = 145 - 20, tx = k === 'station' ? 200 : to.x;
    const pts = [{ x: from.x, y: from.y }, { x: from.x === 200 ? 200 : from.x, y: road }, { x: tx, y: road }, { x: to.x, y: to.y }];
    if (k === 'station') pts.splice(3, 0, { x: 200, y: road });
    let i = 1;
    const step = () => {
      if (i >= pts.length) { cb && setTimeout(cb, 120); return; }
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const ms = Math.max(60, d * 4.2);
      el.style.transition = 'transform ' + ms + 'ms linear';
      el.style.transform = 'translate(' + b.x + 'px,' + (b.y + 20) + 'px)';
      i++;
      setTimeout(step, ms);
    };
    step();
  }
  function afterVisit(r, from) {
    if (r && r.err) { toast(r.err); return; }
    autosave();
    ui.idx = from;
    render(true);
    afterRender();
  }
  function openLoc(k) {
    const S = LG.state();
    const W = LG.week();
    const L = Town.LOCS[k];
    const sps = townSpots(S).filter(s => s.loc === k);
    const extra = { home: ['go-shop', '🏠 房子與搬家'], shop: ['go-shop', '🛍️ 逛街購物'], cafe: ['soc-pick-meal', '🍽️ 約人來吃飯'], park: ['soc-pick-trip', '🧺 約人一起出遊'] }[k];
    openModal('<h2>' + esc(L.n) + '</h2><p class="muted small">這週還能外出 ' + W.out + ' 次。</p><div class="sheet-actions">' +
      sps.map(s => '<button class="btn btn-soft" data-act="loc-spot" data-i="' + s.i + '" data-k="' + k + '"' + (W.out ? '' : ' disabled') + '>❗ ' + esc(s.txt.length > 22 ? s.txt.slice(0, 21) + '…' : s.txt) + '</button>').join('') +
      (k === 'home' ? '' : '<button class="btn btn-soft" data-act="loc-walk" data-k="' + k + '"' + (W.out ? '' : ' disabled') + '>🚶 在這裡走走看看</button>') +
      (extra ? '<button class="btn btn-soft" data-act="' + extra[0] + '">' + extra[1] + '</button>' : '') +
      (k === 'home' ? '<button class="btn btn-soft" data-act="loc-walk" data-k="home"' + (W.out ? '' : ' disabled') + '>🛋️ 在家休息</button>' : '') +
      '<button class="btn btn-ghost" data-act="close">離開</button></div>', { type: 'loc', dismiss: true });
  }
  function socLabel(n) { return esc(LG.npcLabel(n)) + '<span class="small muted">（' + esc(LG.roleName(n)) + '・好感 ' + Math.round(n.rel) + '）</span>'; }
  function openSoc(id) {
    const S = LG.state();
    const n = LG.npc(id);
    if (!n) return;
    const opts = LG.socialOpts(id);
    openModal('<div class="soc-head">' + Art.headshot(Art.npcSpec(n, S, 'happy'), 64) + '<div><h2>' + esc(LG.npcLabel(n)) + '</h2><div class="small muted">' + esc(LG.roleName(n)) + '・' + Math.floor(LG.npcAge(n)) + ' 歲・' + relWord(n.rel) + '</div></div></div>' +
      '<div class="sheet-actions">' + opts.map(o => '<button class="btn btn-soft" data-act="soc-do" data-id="' + id + '" data-k="' + o.k + '"' + (o.why ? ' disabled' : '') + '>' + o.t + (o.why ? '<span class="cd">' + esc(o.why) + '</span>' : '') + '</button>').join('') +
      '<button class="btn btn-ghost" data-act="close">取消</button></div>', { type: 'soc', dismiss: true });
  }
  function openSocPick(kind) {
    const S = LG.state();
    const ppl = S.npcs.filter(n => n.alive && SOC_ROLES.includes(n.role)).sort((a, b) => b.rel - a.rel);
    const name = { meal: '吃飯', trip: '出遊' }[kind];
    openModal('<h2>要約誰' + name + '？</h2><div class="act-list">' + (ppl.length ? ppl.map(n => { const o = LG.socialOpts(n.id).find(x => x.k === kind); const why = o ? o.why : '不行'; return '<button class="act-row" data-act="soc-do" data-id="' + n.id + '" data-k="' + kind + '"' + (why ? ' disabled' : '') + '><span class="pi">' + Art.headshot(Art.npcSpec(n, S, 'normal'), 38) + '</span><span class="grow"><span class="an">' + socLabel(n) + '</span>' + (why ? '<span class="why">' + esc(why) + '</span>' : '') + '</span></button>'; }).join('') : '<p class="muted small">還沒有認識的人。</p>') + '</div>' +
      '<div class="sheet-actions"><button class="btn btn-ghost" data-act="close">取消</button></div>', { type: 'socpick', dismiss: true });
  }

  /* ---------------- 購物與房子 ---------------- */
  function shopView(S) {
    const H = LG.homeOptions();
    let h = '<section class="sec card"><h3>住的地方</h3><div class="kv"><span>現在住在</span><b>' + esc(H.curN || '') + '</b></div>';
    const hrow = o => '<div class="shop-row' + (o.cur ? ' cur' : '') + '"><span class="aico">' + (o.ico || '🏠') + '</span><div class="grow"><div class="an">' + esc(o.n) + '</div><div class="small muted">' + esc(o.d || '') + '</div>' +
      '<div class="small">' + (o.kind === 'rent' ? '月租 ' + money(o.cost) : o.kind === 'buy' ? '總價 ' + money(o.cost) + '・頭期款 ' + money(o.down) : '') + '</div>' + (o.why && !o.cur ? '<div class="small why">🔒 ' + esc(o.why) + '</div>' : '') + '</div>' +
      (o.cur ? '<span class="tagcur">目前</span>' : '<button class="btn btn-primary btn-sm" data-act="move-home" data-kind="' + o.kind + '" data-lv="' + (o.lv || 0) + '"' + (o.why ? ' disabled' : '') + '>' + (o.kind === 'buy' ? '買下' : '搬過去') + '</button>') + '</div>';
    h += '<h4>租屋</h4>' + H.rent.map(hrow).join('') + '<h4>買房</h4>' + (H.sellV ? '<p class="small muted">買新房子時，舊房子會賣掉，扣掉房貸後拿回約 ' + money(H.sellV) + '。</p>' : '') + H.buy.map(hrow).join('') +
      (S.home !== 'parents' ? '<h4>其他</h4>' + hrow(Object.assign({ ico: '👨‍👩‍👧', d: '省房租，也能多陪家人。' }, H.home)) : '') + '</section>';
    const items = LG.shopList();
    const own = items.filter(x => x.own);
    if (own.length) h += '<section class="sec card"><h3>我的東西</h3>' + own.map(x => '<div class="shop-row"><span class="aico">' + x.ico + '</span><div class="grow"><div class="an">' + esc(x.n) + '</div>' + (x.up ? '<div class="small muted">每月開銷 ' + money(x.up) + '</div>' : '') + '</div><button class="btn btn-ghost btn-sm" data-act="sell" data-v="' + x.id + '">' + (x.sell ? '賣掉 +' + money(x.sell) : '送人') + '</button></div>').join('') + '</section>';
    const cats = [];
    items.forEach(x => { if (!cats.includes(x.cat)) cats.push(x.cat); });
    h += '<section class="sec card"><h3>商店</h3><p class="small muted">存款 ' + money(S.money) + '。買來的東西每個月都會帶來一點好處。</p>' + cats.map(c => '<h4>' + esc(c) + '</h4>' + items.filter(x => x.cat === c && !x.own).map(x => '<div class="shop-row"><span class="aico">' + x.ico + '</span><div class="grow"><div class="an">' + esc(x.n) + ' <span class="price">' + money(x.price) + '</span></div><div class="small muted">' + esc(x.d) + '</div>' + (x.why ? '<div class="small why">🔒 ' + esc(x.why) + '</div>' : '') + '</div><button class="btn btn-primary btn-sm" data-act="buy" data-v="' + x.id + '"' + (x.why ? ' disabled' : '') + '>買</button></div>').join('')).join('') + '</section>';
    return h;
  }

  /* ---------------- 人生抉擇 ---------------- */
  function decideView(S) {
    const busy = S.cur.items.some(i => !i.done) || S.ended;
    const ds = LG.decisions();
    const ok = ds.filter(d => d.ok), no = ds.filter(d => !d.ok);
    const row = d => '<div class="dec card' + (d.ok ? '' : ' off') + '"><span class="aico">' + d.ico + '</span><div class="grow"><div class="an">' + esc(d.n) + '</div><div class="small muted">' + esc(d.d || '') + '</div>' +
      (d.ok ? '' : '<div class="small why">🔒 ' + esc(d.why) + '</div>') + '</div>' + (d.ok ? '<button class="btn btn-primary btn-sm" data-act="decide" data-v="' + d.id + '"' + (busy ? ' disabled' : '') + '>決定</button>' : '') + '</div>';
    return goalPanel(S) + '<section class="sec"><p class="muted small">人生大事由你決定，但要先達到條件。' + (busy ? '（請先處理完目前的事件）' : '') + '</p>' +
      (ok.length ? '<h3>現在可以做的</h3>' + ok.map(row).join('') : '<p class="muted small">目前沒有可以做的決定。</p>') +
      (no.length ? '<h3>還沒達成條件</h3>' + no.map(row).join('') : '') + '</section>';
  }
  function skillsView(S) {
    const sk = LG.skillInfo().filter(x => x.cnt > 0);
    if (!sk.length) return '<section class="sec card"><h3>技能</h3><p class="muted small">還沒有學過任何技能。在行程裡安排才藝或課程，就能慢慢練起來。</p></section>';
    return '<section class="sec card"><h3>技能</h3>' + sk.map(x => '<div class="skill"><div class="kv" style="border:0;padding:0"><span>' + esc(x.n) + '</span><b>' + esc(x.lvN) + '</b></div><div class="bar"><i style="width:' + (x.lv >= 5 ? 100 : Math.min(100, Math.round(x.cnt / x.next * 100))) + '%;background:#a48cf7"></i></div><div class="small muted">練習 ' + x.cnt + ' 次' + (x.lv < 5 ? '・再 ' + (x.next - x.cnt) + ' 次升級' : '・已達最高等級') + '</div></div>').join('') + '</section>';
  }

  function monthList(S) {
    const items = S.cur.items;
    const upto = Math.min(ui.idx, items.length);
    if (!upto) return '';
    let h = '<div class="mlist"><div class="mlist-h">這個月發生的事</div>';
    for (let j = 0; j < upto; j++) {
      const it = items[j];
      if (j === ui.idx) continue;
      h += '<button class="mrow" data-act="view-ev" data-i="' + j + '"><i style="background:' + itemColor(it) + '"></i><span>' + esc(it.text.length > 40 ? it.text.slice(0, 39) + '…' : it.text) + '</span></button>';
    }
    return h + '</div>';
  }

  const ROLE_ICON = { mom: '👩', dad: '👨', grandma: '👵', grandpa: '👴', sib: '🧒', friend: '🙂', crush: '💗', oldfriend: '👋', spouse: '💍', child: '👶', grandchild: '🍼', colleague: '💼' };
  function personRow(n, S) {
    const w = Math.round((n.rel + 100) / 2);
    const age = LG.npcAge ? Math.floor(LG.npcAge(n)) : null;
    const note = (age != null && age >= 0 && n.alive ? age + ' 歲・' : '') + (!n.alive ? '已離世' : n.far ? '沒有住在一起・' + relWord(n.rel) : relWord(n.rel));
    let pic = ROLE_ICON[n.role] || '🙂';
    try { pic = Art.headshot(Art.npcSpec(n, S, 'normal'), 42); } catch (e) { /* 用表情符號 */ }
    return '<div class="person' + (n.alive ? '' : ' gone') + '"><span class="pi">' + pic + '</span>' +
      '<div class="grow"><div class="pn">' + esc(LG.npcLabel(n)) + '</div><div class="pr">' + esc(LG.roleName(n)) + '・' + note + '</div></div>' +
      (n.alive ? '<div class="relbar"><div class="bar"><i style="width:' + w + '%;background:' + (n.rel >= 0 ? '#4fc3a1' : '#ff8a7a') + '"></i></div></div>' : '') +
      (n.alive && SOC_ROLES.includes(n.role) && S.ageM >= 48 ? '<button class="icon-btn sm" data-act="soc-open" data-id="' + n.id + '" aria-label="互動">💬</button>' : '') + '</div>';
  }
  function peopleView(S) {
    const famRoles = ['spouse', 'child', 'grandchild', 'mom', 'dad', 'grandma', 'grandpa', 'sib'];
    const fam = S.npcs.filter(n => famRoles.includes(n.role) && (n.alive || S.ageM - (n.diedAt || 0) < 240)).sort((a, b) => famRoles.indexOf(a.role) - famRoles.indexOf(b.role));
    const fr = S.npcs.filter(n => (n.role === 'friend' || n.role === 'crush') && n.alive).sort((a, b) => (b.role === 'crush') - (a.role === 'crush') || b.rel - a.rel);
    const col = S.npcs.filter(n => n.role === 'colleague' && n.alive);
    const known = S.traits.filter(t => t.known);
    const unknown = S.traits.length - known.length;
    let h = '<section class="sec card"><h3>家人</h3><div class="small muted">家境：' + D.WEALTH[S.fam.wealth].n + '・' + D.STRUCTS[S.fam.struct].n + '・住在' + esc(S.city.n) + '</div>' +
      fam.map(n => personRow(n, S)).join('') +
      (S.pet ? '<div class="person' + (S.pet.alive ? '' : ' gone') + '"><span class="pi"><svg width="40" height="40" viewBox="-22 -32 44 40">' + Art.pet(S.pet.kind, S.pet.kind === '貓' ? '#f2b56b' : '#d9a46a') + '</svg></span><div class="grow"><div class="pn">' + esc(S.pet.name) + '</div><div class="pr">寵物' + S.pet.kind + (S.pet.alive ? '' : '・已離開') + '</div></div></div>' : '') + '</section>';
    h += '<section class="sec card"><h3>朋友與感情（' + fr.length + '）</h3>' + (fr.length ? fr.map(n => personRow(n, S)).join('') : '<p class="muted small">還沒有特別要好的朋友。在行程裡多排一些社交活動吧！</p>') + '</section>';
    if (col.length) h += '<section class="sec card"><h3>同事</h3>' + col.map(n => personRow(n, S)).join('') + '</section>';
    h += skillsView(S);
    h += '<section class="sec card"><h3>個性特質</h3>' + known.map(t => '<div class="trait"><b>' + t.k + '</b>：' + D.TRAITS[t.k].d + '</div>').join('') + (unknown ? '<div class="trait muted">？？？ × ' + unknown + '（還沒被發現）</div>' : '') + '</section>';
    h += '<section class="sec card"><h3>人生標籤</h3>' + (S.tags.length ? '<div class="tags">' + S.tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '<p class="muted small">目前還沒有標籤。</p>') + '</section>';
    h += '<section class="sec card"><h3>成就（' + S.ach.length + '/' + Object.keys(D.ACH).length + '）</h3><div class="ach-list">' +
      Object.keys(D.ACH).map(a => S.ach.includes(a) ? '<div class="ach on"><div class="an">🏆 ' + a + '</div><div class="small muted">' + D.ACH[a] + '</div></div>' : '<div class="ach"><div class="an muted">🔒 ？？？</div><div class="small muted">隱藏成就</div></div>').join('') + '</div></section>';
    return h;
  }
  /* ---------------- 理財：銀行與股市 ---------------- */
  const pct = v => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
  function spark(h, w, hgt) {
    if (!h || h.length < 2) return '';
    const mn = Math.min(...h), mx = Math.max(...h), rg = mx - mn || 1;
    const pts = h.map((v, i) => (i / (h.length - 1) * w).toFixed(1) + ',' + (hgt - 2 - (v - mn) / rg * (hgt - 4)).toFixed(1)).join(' ');
    const up = h[h.length - 1] >= h[0];
    return '<svg class="spark" width="' + w + '" height="' + hgt + '" viewBox="0 0 ' + w + ' ' + hgt + '"><polyline points="' + pts + '" fill="none" stroke="' + (up ? '#e5604f' : '#2fa784') + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  const CAT_N = { service: '服務業', road: '交通物流', factory: '工廠技術', office: '辦公室', tech: '科技', medical: '醫療', teach: '教育', creative: '創意', pro: '專業', public: '公職', army: '軍職' };
  function reqList(reqs) {
    return '<ul class="reqs">' + reqs.map(r => '<li class="' + (r.ok ? 'ok' : 'no') + (r.bonus ? ' bonus' : '') + '">' + (r.ok ? '✅' : r.bonus ? '➕' : '⬜') + ' ' + esc(r.t) + (r.cur != null && !r.ok ? '<span class="cur">（目前 ' + esc(String(r.cur)) + '）</span>' : '') +
      (!r.ok && r.how ? '<div class="how">👉 ' + esc(r.how) + '</div>' : '') + '</li>').join('') + '</ul>';
  }
  function futureHtml(F) {
    return '<div class="future"><h4>💼 職位與薪水（估計）</h4><div class="ladder">' + F.lv.map((l, i) => '<div><span class="lvn">' + (i + 1) + '</span><span class="grow">' + esc(l.t) + '</span><b>' + money(l.pay) + '</b></div>').join('') + '</div>' +
      '<h4>🏠 未來的生活</h4>' +
      '<div class="kv"><span>工作壓力</span><b>' + esc(F.stressN) + '</b></div>' +
      '<div class="kv"><span>剛入行每月大約能存</span><b>' + money(F.saveM) + '</b></div>' +
      '<div class="kv"><span>' + esc(F.houseN) + '頭期款</span><b>' + money(F.down) + '</b></div>' +
      '<div class="kv"><span>存到頭期款大約要</span><b>' + (F.yrs0 ? F.yrs0 + ' 年' : '很難存到') + (F.yrsTop && F.yrsTop !== F.yrs0 ? '<span class="small muted">（升到最高職位約 ' + F.yrsTop + ' 年）</span>' : '') + '</b></div>' +
      '<div class="kv"><span>退休後每月（' + esc(F.pensionN) + '）</span><b>' + money(F.pension) + '</b></div>' +
      '<p class="small">' + esc(F.life) + '</p></div>';
  }
  function openCareerDetail(id) {
    const draw = () => {
      const d = LG.careerDetail(id);
      const pct = Math.round(d.done / Math.max(1, d.total) * 100);
      return '<h2>' + esc(d.n) + '</h2><p class="small muted">' + esc(CAT_N[d.cat] || '') + (d.d ? '・' + esc(d.d) : '') + '</p>' +
        '<h4>🗺️ 生涯路線圖 <span class="small muted">' + d.done + ' / ' + d.total + '</span></h4><div class="bar"><i style="width:' + pct + '%;background:#4fc3a1"></i></div>' + reqList(d.road) +
        futureHtml(d.future) +
        '<div class="sheet-actions">' + (d.goal ? '<button class="btn btn-ghost" data-act="goal" data-v="">取消這個目標</button>' : '<button class="btn btn-primary" data-act="goal" data-v="' + id + '">🧭 設為我的生涯目標</button>') +
        '<button class="btn btn-ghost" data-act="career-back">← 回到職業列表</button></div>';
    };
    openModal(draw(), { type: 'careerD', draw, dismiss: true });
  }
  function openCareer() {
    stopAuto();
    const draw = () => {
      const all = LG.careers();
      const cats = ['all'].concat(Object.keys(CAT_N).filter(c => all.some(j => j.cat === c)));
      const f = ui.careerCat || 'all';
      const list = all.filter(j => f === 'all' || j.cat === f).sort((a, b) => b.goal - a.goal || b.now - a.now || (b.done / b.total) - (a.done / a.total) || b.pay - a.pay);
      return '<h2>🧭 生涯規劃</h2><p class="small muted">每一種職業都可以當目標。點進去看路線圖要怎麼走、以後的生活長什麼樣子。</p>' +
        '<div class="chips pick-tabs">' + cats.map(c => '<button data-act="cat-f" data-v="' + c + '" class="' + (f === c ? 'on' : '') + '">' + (c === 'all' ? '全部' : CAT_N[c]) + '</button>').join('') + '</div>' +
        '<div class="act-list">' + list.map(j => '<button class="career-row' + (j.goal ? ' goal' : '') + '" data-act="career-d" data-v="' + j.id + '"><div class="grow"><div class="an">' + (j.goal ? '🧭 ' : '') + esc(j.n) + (j.now ? ' <span class="sec-tag">目前工作</span>' : '') + (j.ok && !j.now ? ' <span class="okchip">可應徵</span>' : '') + '</div>' +
          '<div class="small muted">起薪約 ' + money(j.pay) + '・最高 ' + esc(j.lv[j.lv.length - 1] || '') + '</div><div class="bar mini"><i style="width:' + Math.round(j.done / Math.max(1, j.total) * 100) + '%;background:#4fc3a1"></i></div></div><span class="prog">' + j.done + '/' + j.total + '</span><span class="chg">▸</span></button>').join('') + '</div>' +
        '<div class="sheet-actions"><button class="btn btn-ghost" data-act="close-fin">關閉</button></div>';
    };
    openModal(draw(), { type: 'career', draw, dismiss: true });
  }
  function goalPanel(S) {
    const C = LG.challenge();
    let h = '';
    if (C) {
      const stars = C.goals.reduce((t, g) => t + (g.done ? g.star : 0), 0), max = C.goals.reduce((t, g) => t + g.star, 0);
      h += '<section class="sec card challenge"><h3>🎯 職業挑戰：' + esc(C.n) + '</h3><p class="small muted">' + (C.end ? '挑戰已結算：' + C.stars + ' / ' + C.max + ' 顆星。之後的人生繼續自由發展。' : '在這個職業已經 ' + C.years + ' 年。65 歲或退休時結算。') + '</p>' +
        '<div class="stars">' + '⭐'.repeat(stars) + '<span class="dim">' + '⭐'.repeat(Math.max(0, max - stars)) + '</span></div>' +
        '<ul class="reqs">' + C.goals.map(g => '<li class="' + (g.done ? 'ok' : '') + '">' + (g.done ? '✅' : '⬜') + ' ' + esc(g.t) + '<span class="cur">（' + '⭐'.repeat(g.star) + '）</span></li>').join('') + '</ul></section>';
    }
    const G = LG.goal();
    if (G) {
      const next = G.road.find(r => !r.ok && !r.bonus);
      h += '<section class="sec card"><h3>🧭 生涯目標：' + esc(G.n) + '</h3><div class="bar"><i style="width:' + Math.round(G.done / Math.max(1, G.total) * 100) + '%;background:#4fc3a1"></i></div>' +
        '<p class="small">' + (G.now ? '🎉 你已經是' + esc(G.n) + '了！' : next ? '下一步：<b>' + esc(next.t) + '</b>' + (next.how ? '<br><span class="muted">👉 ' + esc(next.how) + '</span>' : '') : '條件都達成了，去應徵吧！') + '</p>' +
        '<button class="btn btn-soft btn-block" data-act="career-d" data-v="' + G.id + '">查看完整路線圖與未來生活</button></section>';
    } else if (!C && S.ageM >= 72) {
      h += '<section class="sec card"><h3>🧭 生涯目標</h3><p class="small muted">還沒有目標。想當什麼？醫師、工程師、廚師、老闆……每種職業都可以選。</p><button class="btn btn-primary btn-block" data-act="decide" data-v="career">選一個生涯目標</button></section>';
    }
    return h;
  }

  /* ---------------- 答題 ---------------- */
  function openQuiz() {
    const Z = LG.quiz();
    if (!Z || ui.modal) return;
    stopAuto();
    ui.qz = { i: 0, ans: [], shown: false };
    const draw = () => {
      const st = ui.qz, q = Z.qs[st.i];
      const done = st.shown;
      const right = done && st.res ? st.res[st.i].ok : null;
      let h = '<div class="quiz"><div class="qhead"><b>' + esc(Z.title) + '</b><span class="small muted">第 ' + (st.i + 1) + ' / ' + Z.qs.length + ' 題</span></div>' +
        '<div class="qdots">' + Z.qs.map((_, i) => '<i class="' + (i < st.i ? 'past' : i === st.i ? 'now' : '') + '"></i>').join('') + '</div>' +
        (q.s ? '<span class="qsub">' + esc(q.s) + '</span>' : '') + '<p class="qq">' + esc(q.q) + '</p><div class="qopts">';
      q.opts.forEach((o, j) => {
        let cls = '';
        if (done) { if (j === st.correct) cls = ' right'; else if (j === st.ans[st.i]) cls = ' wrong'; }
        h += '<button class="qopt' + cls + '" data-act="qz-pick" data-v="' + j + '"' + (done ? ' disabled' : '') + '><span class="ql">' + 'ABCD'[j] + '</span>' + esc(o) + '</button>';
      });
      h += '</div>';
      if (done) h += '<div class="qfb ' + (right ? 'ok' : 'no') + '">' + (right ? '⭕ 答對了！' : '❌ 正確答案是 ' + 'ABCD'[st.correct]) + '</div><button class="btn btn-primary btn-block" data-act="qz-next">' + (st.i >= Z.qs.length - 1 ? '看結果' : '下一題 ▶') + '</button>';
      return h + '</div>';
    };
    openModal(draw(), { type: 'quiz', draw, dismiss: false, Z });
  }
  function quizPick(j) {
    const st = ui.qz, Z = ui.modal && ui.modal.Z;
    if (!st || !Z || st.shown) return;
    st.ans[st.i] = j;
    // 先在本機判斷對錯（答案只在作答完後才交給引擎計分）
    const full = LG.state().quiz.qs[st.i];
    st.correct = full.a;
    st.res = st.res || [];
    st.res[st.i] = { ok: j === full.a };
    st.shown = true;
    setModalHtml(ui.modal.draw());
  }
  function quizNext() {
    const st = ui.qz, Z = ui.modal && ui.modal.Z;
    if (!st || !Z) return;
    if (st.i < Z.qs.length - 1) { st.i++; st.shown = false; setModalHtml(ui.modal.draw()); return; }
    const r = LG.quizAnswer(st.ans);
    ui.qz = null;
    closeModal();
    autosave();
    const ok = r ? r.res.filter(x => x.ok).length : 0;
    toast(ok === Z.qs.length ? '🎉 全部答對！' : '答對 ' + ok + ' / ' + Z.qs.length + ' 題');
    render(true);
    afterRender();
  }

  /* ---------------- 職業挑戰模式 ---------------- */
  function showChallengePick() {
    stopAuto(); closeModal();
    const all = LG.challengeJobs();
    const f = ui.chCat || 'all';
    const cats = ['all'].concat(Object.keys(CAT_N).filter(c => all.some(j => j.cat === c)));
    const list = all.filter(j => f === 'all' || j.cat === f).sort((a, b) => a.age - b.age || b.pay - a.pay);
    app.innerHTML = '<div class="page"><button class="btn btn-ghost" data-act="title">← 返回</button>' +
      '<h2>🎯 職業挑戰</h2><p class="muted small">選一種職業，直接從剛入行開始。挑戰升到最高職位、存錢買房、成家，65 歲或退休時結算星星；之後的人生可以繼續玩下去。</p>' +
      '<div class="chips pick-tabs">' + cats.map(c => '<button data-act="ch-cat" data-v="' + c + '" class="' + (f === c ? 'on' : '') + '">' + (c === 'all' ? '全部' : CAT_N[c]) + '</button>').join('') + '</div>' +
      '<div class="act-list nolimit">' + list.map(j => '<button class="career-row" data-act="ch-pick" data-v="' + j.id + '"><div class="grow"><div class="an">' + esc(j.n) + ' <span class="sec-tag">' + esc(CAT_N[j.cat] || '') + '</span></div>' +
        '<div class="small muted">' + j.age + ' 歲開始・起薪約 ' + money(j.pay) + '・壓力' + (j.st >= 75 ? '很高' : j.st >= 60 ? '偏高' : j.st >= 45 ? '普通' : '輕鬆') + '</div><div class="small">' + esc(j.lv.join(' → ')) + '</div></div><span class="chg">▸</span></button>').join('') + '</div></div>';
  }
  function pickChallenge(id) {
    const j = LG.challengeJobs().find(x => x.id === id);
    openModal('<h2>挑戰：' + esc(j.n) + '</h2><p class="small muted">' + esc(j.d) + '</p>' +
      '<div class="kv"><span>開始年齡</span><b>' + j.age + ' 歲（學歷、科系、需要的技能都已具備）</b></div><div class="kv"><span>起薪</span><b>約 ' + money(j.pay) + '</b></div>' +
      '<h4>職位</h4><p class="small">' + esc(j.lv.join(' → ')) + '</p>' +
      '<h4>挑戰目標</h4><ul class="reqs"><li>⬜ 升到最高職位（⭐⭐）</li><li>⬜ 工作表現 85（⭐）</li><li>⬜ 淨資產達到起薪 60 倍（⭐）</li><li>⬜ 買房（⭐）</li><li>⬜ 結婚成家（⭐）</li><li>⬜ 這個職業做滿 20 年（⭐）</li><li>⬜ 大部分時間幸福度在 55 以上（⭐）</li></ul>' +
      '<div class="sheet-actions"><button class="btn btn-primary" data-act="ch-go" data-v="' + id + '">選這個職業，設定角色 →</button><button class="btn btn-ghost" data-act="close">再看看</button></div>', { type: 'chpick', dismiss: true });
  }
  function startChallenge() {
    const f = ui.form, id = ui.challenge;
    if (!f.name.trim()) { toast('請先輸入名字'); ui.step = 1; showCreate(); return; }
    const B = f.birth;
    LG.newChallenge({ name: f.name.trim(), gender: f.gender, height: f.height, weight: f.weight, zodiac: f.zodiac, mode: f.mode, look: { hair: f.hair, hairC: f.hairC, skin: Art.SKINS[f.skin] }, birth: { wealth: B.wealth, city: B.city, struct: B.struct, sibs: B.sibs, st: {} } }, id);
    ui.form = null; ui.step = 1; ui.challenge = null; ui.endSeen = false; ui.tab = 'month'; ui.idx = 0;
    autosave();
    showGame();
  }
  function moneyView(S) {
    const B = LG.bankInfo();
    const M = LG.market();
    const J = S.job;
    let h = '<section class="sec card"><h3>資產總覽</h3>' +
      '<div class="kv"><span>💵 現金（錢包）</span><b class="' + (S.money < 0 ? 'dn' : '') + '">' + money(S.money) + '</b></div>' +
      '<div class="kv"><span>🏦 銀行存款</span><b>' + money(B.bank) + '</b></div>' +
      '<div class="kv"><span>📈 股票市值</span><b>' + money(M.val) + (M.val ? '<span class="small ' + (M.val >= M.cost ? 'up' : 'dn') + '">（' + (M.val >= M.cost ? '賺 ' : '賠 ') + money(Math.abs(M.val - M.cost)) + '）</span>' : '') + '</b></div>' +
      '<div class="kv"><span>📊 定期定額基金</span><b>' + money(S.inv ? S.inv.bal : 0) + (S.inv && S.inv.mon ? '<span class="small muted">（每月 ' + money(S.inv.mon) + '）</span>' : '') + '</b></div>' +
      (S.house ? '<div class="kv"><span>🏠 房子</span><b>' + money(S.house.price) + '</b></div>' : '') +
      (S.loans || []).map(L => '<div class="kv"><span>💳 ' + esc(L.n) + '</span><b class="dn">-' + money(L.bal) + '</b></div>').join('') +
      '<div class="kv total"><span>淨資產</span><b>' + money(LG.netWorth()) + '</b></div>' +
      '<div class="kv"><span>勞退個人帳戶</span><b>' + money(S.pension || 0) + '</b></div></section>';
    // 銀行
    h += '<section class="sec card"><h3>🏦 小鎮銀行</h3>';
    if (!B.open) h += '<p class="muted small">' + esc(B.why) + '。現在的零用錢由家裡保管。</p>';
    else {
      h += '<p class="small muted">存款年利率 ' + (B.rate * 100).toFixed(1) + '%，每月自動算利息。錢包不夠付帳時，會自動從存款扣。</p>' +
        '<div class="bank-box"><div><div class="small muted">錢包</div><b>' + money(B.cash) + '</b></div><div><div class="small muted">存款</div><b>' + money(B.bank) + '</b></div></div>' +
        '<div class="row bank-in"><input id="bank-amt" class="text-input grow" inputmode="numeric" placeholder="輸入金額"><button class="btn btn-soft btn-sm" data-act="bank-max">全部</button></div>' +
        '<div class="row bank-btns"><button class="btn btn-primary grow" data-act="deposit">存入 ⬇</button><button class="btn btn-soft grow" data-act="withdraw">提領 ⬆</button></div>';
      const O = B.loanOffer;
      h += '<h4>貸款</h4>';
      if (B.loans.length) h += B.loans.map(L => '<div class="shop-row"><span class="aico">💳</span><div class="grow"><div class="an">' + esc(L.n) + '</div><div class="small muted">剩 ' + money(L.bal) + (L.pay ? '・每月還 ' + money(L.pay) : '') + (L.rate ? '・年利率 ' + (L.rate * 100).toFixed(1) + '%' : '') + '</div></div><button class="btn btn-ghost btn-sm" data-act="repay" data-i="' + L.i + '"' + (L.can ? '' : ' disabled') + '>還清</button></div>').join('');
      if (O.why) h += '<p class="small why">🔒 ' + esc(O.why) + '</p>';
      else h += '<p class="small muted">信用貸款：最多可借 <b>' + money(O.limit) + '</b>，年利率 <b>' + (O.rate * 100).toFixed(1) + '%</b>（看收入和工作表現）。</p>' +
        '<div class="row bank-in"><input id="loan-amt" class="text-input grow" inputmode="numeric" placeholder="要借多少"><div class="seg seg3 loan-yr">' + O.years.map(y => '<button data-act="loan-yr" data-v="' + y + '" class="' + ((ui.loanYr || 5) === y ? 'on' : '') + '">' + y + ' 年</button>').join('') + '</div></div>' +
        '<div class="small muted" id="loan-est"></div><button class="btn btn-soft btn-block" data-act="borrow">申請貸款</button>';
    }
    h += '</section>';
    // 定期定額
    const F = LG.fundInfo();
    h += '<section class="sec card" id="fund"><h3>📊 定期定額基金</h3>';
    if (F.why) h += '<p class="muted small">🔒 ' + esc(F.why) + '。</p>';
    else {
      h += '<p class="small muted">每月自動從錢包扣款，投入分散的股票基金，長期大約跟著整體市場成長。景氣差時會跌，也可能好幾年才回本。</p>' +
        '<div class="bank-box"><div><div class="small muted">基金市值</div><b>' + money(F.bal) + '</b></div><div><div class="small muted">每月扣款</div><b>' + (F.mon ? money(F.mon) : '未設定') + '</b></div></div>' +
        '<div class="chips amt-chips">' + [1000, 3000, 5000, 10000, 20000].map(v => '<button data-act="fund-pick" data-v="' + v + '">' + v.toLocaleString() + '</button>').join('') +
        (F.pay ? [0.1, 0.2, 0.3].map(r => '<button data-act="fund-pick" data-v="' + Math.round(F.pay * r / 100) * 100 + '">收入 ' + r * 100 + '%</button>').join('') : '') + '</div>' +
        '<div class="row bank-in"><input id="fund-amt" class="text-input grow" inputmode="numeric" placeholder="每月要投入多少" value="' + (F.mon || '') + '"></div>' +
        '<div class="row bank-btns"><button class="btn btn-primary grow" data-act="fund-set">設定每月金額</button>' + (F.mon ? '<button class="btn btn-ghost" data-act="fund-stop">停止扣款</button>' : '') + '</div>' +
        '<h4>單筆投入／贖回</h4><div class="row bank-in"><input id="fund-one" class="text-input grow" inputmode="numeric" placeholder="輸入金額"></div>' +
        '<div class="row bank-btns"><button class="btn btn-soft grow" data-act="fund-add">單筆投入</button><button class="btn btn-soft grow" data-act="fund-sell"' + (F.bal ? '' : ' disabled') + '>贖回</button>' + (F.bal ? '<button class="btn btn-ghost" data-act="fund-sellall">全部贖回</button>' : '') + '</div>';
    }
    h += '</section>';
    // 股市
    h += '<section class="sec card"><h3>📈 小鎮股市</h3>';
    h += '<p class="small muted">' + (M.open ? '股價每週變動，7 月發股利。買賣手續費 0.1425%，賣出再扣證交稅 0.3%。景氣好時大多上漲，景氣差時要小心。' : '🔒 ' + esc(M.why) + '，現在可以先看看行情。') + '<br>（公司都是虛構的）</p>';
    h += M.list.map(x => '<button class="stock-row" data-act="stock" data-v="' + x.id + '"><div class="grow"><div class="an">' + esc(x.n) + ' <span class="sec-tag">' + esc(x.sec) + '</span></div>' +
      '<div class="small muted">' + (x.sh ? '持有 ' + x.sh.toLocaleString() + ' 股・' + (x.val >= x.cost * x.sh ? '<span class="up">賺 ' : '<span class="dn">賠 ') + money(Math.abs(Math.round(x.val - x.cost * x.sh))) + '</span>' : '殖利率約 ' + (x.dy * 100).toFixed(1) + '%') + '</div></div>' +
      spark(x.hist.concat([x.p]), 60, 26) + '<div class="sp-r"><b>' + x.p.toFixed(2) + '</b><span class="' + (x.chg >= 0 ? 'rise' : 'fall') + '">' + pct(x.chg) + '</span></div></button>').join('');
    h += '</section>';
    const PR = LG.promo();
    const G = LG.goal();
    const workExtra = (PR ? (PR.top ? '<p class="small muted">🎖️ 已經是這個職業的最高職位。</p>' : '<h4>升遷到「' + esc(PR.next) + '」的條件</h4>' + reqList(PR.reqs) + '<p class="small muted">' + (PR.ok ? '條件都達成了！可以到「抉擇」申請升遷，或等年底考績。' : '全部達成後，可以到「抉擇」申請升遷，年底考績也有機會直接升。') + '</p>') : '') +
      (G ? '<h4>🧭 職業目標：' + esc(G.n) + '</h4>' + reqList(G.reqs) : '');
    h += '<section class="sec card"><h3>工作</h3>' + workExtra + (J ? '<div class="kv"><span>職稱</span><b>' + esc(J.title) + '</b></div><div class="kv"><span>公司</span><b>' + esc(J.co) + '</b></div><div class="kv"><span>月薪</span><b>' + money(J.pay) + '</b></div><div class="kv"><span>年資</span><b>' + Math.floor((S.ageM - J.since) / 12) + ' 年 ' + ((S.ageM - J.since) % 12) + ' 個月</b></div>' + statRow('工作表現', '📊', J.perf, '#5aa7f0') : '<p class="muted small">' + (S.ageM < 216 ? '還在念書，還沒開始工作。' : esc(LG.schoolText())) + '</p>') +
      '<div class="kv"><span>學歷</span><b>' + esc(S.degree || '—') + '</b></div><div class="kv"><span>景氣</span><b>' + esc(D.ECON_N[S.econ.s]) + '</b></div></section>';
    if (S.fin && S.fin.items.length) h += '<section class="sec card"><h3>上個月收支明細</h3>' + S.fin.items.map(x => '<div class="kv"><span>' + esc(x.n) + '</span><b class="' + (x.note ? 'muted' : x.v >= 0 ? 'up' : 'dn') + '">' + (x.note ? money(x.note) : (x.v >= 0 ? '+' : '') + money(x.v)) + '</b></div>').join('') + '<div class="kv total"><span>錢包合計</span><b class="' + (S.fin.net >= 0 ? 'up' : 'dn') + '">' + (S.fin.net >= 0 ? '+' : '') + money(S.fin.net) + '</b></div></section>';
    return h;
  }
  function openStock(id) {
    ui.stockId = id;
    ui.stockQty = ui.stockQty || 100;
    const draw = () => {
      const M = LG.market();
      const x = M.list.find(s => s.id === ui.stockId);
      const q = ui.stockQty;
      const cost = Math.round(x.p * q * (1 + M.fee));
      const big = x.hist.concat([x.p]);
      return '<h2>' + esc(x.n) + '</h2><p class="small muted">' + esc(x.sec) + '・' + esc(x.d) + '</p>' +
        '<div class="stock-big"><div><div class="price">' + x.p.toFixed(2) + ' <small>元／股</small></div><div class="' + (x.chg >= 0 ? 'rise' : 'fall') + '">本週 ' + pct(x.chg) + (x.y1 != null ? '　一年 ' + pct(x.y1) : '') + '</div></div>' + spark(big, 150, 54) + '</div>' +
        '<div class="kv"><span>持有</span><b>' + (x.sh ? x.sh.toLocaleString() + ' 股（平均成本 ' + x.cost.toFixed(2) + '）' : '還沒有') + '</b></div>' +
        '<div class="kv"><span>錢包現金</span><b>' + money(M.cash) + '</b></div>' +
        '<div class="qty"><span>數量</span><div class="row">' + [1, 10, 100, 1000].map(n => '<button class="btn btn-soft btn-sm" data-act="qty" data-v="' + n + '">' + (n === 1000 ? '1 張' : n + ' 股') + '</button>').join('') + '</div>' +
        '<div class="row"><button class="step" data-act="qty-d" data-v="-1">−</button><input id="stock-q" class="text-input grow center" inputmode="numeric" value="' + q + '"><button class="step" data-act="qty-d" data-v="1">＋</button></div>' +
        '<div class="small muted center">約 ' + money(cost) + '（含手續費）</div></div>' +
        (M.open ? '' : '<p class="small why center">🔒 ' + esc(M.why) + '</p>') +
        '<div class="row bank-btns"><button class="btn btn-primary grow rise-bg" data-act="stock-buy"' + (M.open ? '' : ' disabled') + '>買進</button><button class="btn btn-soft grow" data-act="stock-sell"' + (x.sh ? '' : ' disabled') + '>賣出</button>' + (x.sh ? '<button class="btn btn-ghost" data-act="stock-sellall">全部賣</button>' : '') + '</div>' +
        '<div class="sheet-actions"><button class="btn btn-ghost" data-act="close-fin">關閉</button></div>';
    };
    openModal(draw(), { type: 'stock', draw, dismiss: true });
    const inp = document.getElementById('stock-q');
    if (inp) inp.addEventListener('change', () => { ui.stockQty = Math.max(1, Math.floor(+inp.value) || 1); setModalHtml(draw()); rebindQty(); });
  }
  function rebindQty() {
    const inp = document.getElementById('stock-q');
    if (inp && ui.modal) inp.addEventListener('change', () => { ui.stockQty = Math.max(1, Math.floor(+inp.value) || 1); setModalHtml(ui.modal.draw()); rebindQty(); });
  }
  function finDone(r, okMsg) {
    if (r && r.err) { toast('⚠️ ' + r.err); return false; }
    autosave();
    if (okMsg) toast(okMsg);
    return true;
  }
  function readAmt(id) { const el = document.getElementById(id); const v = el ? Math.round(+String(el.value).replace(/[^\d]/g, '')) : 0; return v; }
  function logView(S) {
    const items = S.log.slice(-250).reverse();
    if (!items.length) return '<p class="muted center">人生才剛開始。</p>';
    let h = '', curY = -1;
    for (const l of items) {
      const y = Math.floor(l.ageM / 12);
      if (y !== curY) { h += '<div class="log-year">' + y + ' 歲・' + l.y + ' 年</div>'; curY = y; }
      h += '<div class="log-item card"><div class="lt">' + l.m + ' 月・' + esc(l.t) + '</div>' + esc(l.x) + '</div>';
    }
    return h;
  }

  function footer(S) {
    let main;
    if (S.ended && monthDone(S)) main = '<button class="btn btn-primary" data-act="end">查看人生總結</button>';
    else if (planning(S)) main = '<button class="btn btn-primary" data-act="run-week">開始這週 ▶</button>';
    else if (inTown(S)) main = '<button class="btn btn-primary" data-act="end-week">結束這週 ▶</button>';
    else if (seenAll(S) && S.cur.phase === 'pre') main = '<button class="btn btn-primary" disabled>…</button>';
    else if (monthDone(S)) main = '<button class="btn btn-primary" data-act="next-month">下個月 ▶</button>';
    else { const it = curItem(S); main = it.done ? '<button class="btn btn-primary" data-act="next-ev">' + (ui.idx >= S.cur.items.length - 1 ? (S.cur.phase === 'pre' ? '排這週行程 ▶' : S.cur.phase === 'week' ? '回到小鎮 ▶' : '這個月結束 ▶') : '下一則 ▶') + '</button>' : '<button class="btn btn-primary" disabled>請先做選擇</button>'; }
    return '<div class="footer"><div class="inner">' + (S.ended ? '' : '<button class="auto-btn' + (ui.auto ? ' on' : '') + '" data-act="auto">' + (ui.auto ? '⏸ 暫停' : '⏩ 自動') + '</button>') + main + '</div></div>';
  }

  function render(keepScroll) {
    const S = LG.state();
    if (!S) return showTitle();
    const y = window.scrollY;
    let main;
    if (ui.tab === 'people') main = peopleView(S);
    else if (ui.tab === 'money') main = moneyView(S);
    else if (ui.tab === 'log') main = logView(S);
    else if (ui.tab === 'decide') main = decideView(S);
    else if (ui.tab === 'shop') main = shopView(S);
    else if (inTown(S)) main = townView(S);
    else {
      const plan = planning(S);
      const it = seenAll(S) ? S.cur.items[S.cur.items.length - 1] : curItem(S);
      const stage = plan ? Art.stage(S, null, { mood: 'think', noCast: true }) : Art.stage(S, it, seenAll(S) ? { mood: 'normal', noCast: false } : {});
      main = '<div class="stage card" data-act="stage-tap"><div class="stage-badge">' + LG.ageText(S.ageM) + '</div>' + stage + '</div>' + dialogHtml(S) + monthList(S);
    }
    app.innerHTML = '<div class="game">' + topbar(S) +
      '<div class="layout"><aside class="side">' + statsPanel(S) + '</aside><main>' +
      '<nav class="tabs">' + [['month', '小鎮'], ['decide', '抉擇' + (LG.decisions().some(d => d.ok && !['invest', 'job'].includes(d.id)) ? '•' : '')], ['people', '人物'], ['shop', '購物'], ['money', '理財'], ['log', '紀錄']].map(t => '<button data-act="tab" data-t="' + t[0] + '" class="' + (ui.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</nav>' +
      main + '</main></div></div>' + footer(S);
    if (keepScroll) window.scrollTo(0, y);
    flushToasts(S);
    if (LG.quiz && LG.quiz() && !ui.modal) setTimeout(openQuiz, 50);
    musicTheme();
    if (ui.tab === 'money') bindFin();
  }

  function showGame() {
    closeModal();
    ui.tab = 'month';
    ui.idx = 0;
    render();
    window.scrollTo(0, 0);
    afterRender();
  }
  function afterRender() {
    handleModals();
    scheduleNext();
  }

  /* ---------------- 播放節奏 ---------------- */
  function stopAuto() { ui.auto = false; clearTimeout(ui.timer); }
  function scheduleNext(extra) {
    clearTimeout(ui.timer);
    const S = LG.state();
    if (!S || ui.modal || ui.tab !== 'month') return;
    if (!document.querySelector('.game')) return;
    if (planning(S)) {
      if (ui.auto) ui.timer = setTimeout(runWeek, Math.max(500, settings.speed * 0.5));
      return;
    }
    if (inTown(S)) {
      if (ui.auto) ui.timer = setTimeout(endWeek, Math.max(500, settings.speed * 0.5));
      return;
    }
    if (!seenAll(S)) {
      const it = curItem(S);
      if (!it.done) return;
      if (settings.evAuto || ui.auto) ui.timer = setTimeout(nextEv, settings.speed * (extra || 1) * (ui.auto ? 0.8 : 1));
      return;
    }
    if (ui.auto && LG.canAdvance()) ui.timer = setTimeout(nextMonth, Math.max(500, settings.speed * 0.6));
  }
  function nextEv() {
    const S = LG.state();
    if (!S || seenAll(S)) return;
    if (!curItem(S).done) return;
    ui.idx++;
    render();
    afterRender();
  }
  function nextMonth() {
    if (!LG.canAdvance()) { handleModals(); return; }
    LG.nextMonth();
    autosave();
    ui.tab = 'month';
    ui.idx = 0;
    render();
    window.scrollTo(0, 0);
    afterRender();
  }

  function handleModals() {
    const S = LG.state();
    const m = LG.pendingModal();
    if (!m || ui.modal) return;
    if (!seenAll(S) && !S.dead) return;
    if (m === 'end' && ui.endSeen) return;
    if (m === 'review' && ui.auto && settings.autoSkipReview) { LG.yearReview(); LG.ackModal('review'); autosave(); return handleModals(); }
    if (m === 'review') openReview();
    else if (m.indexOf('stage:') === 0) openStage(m);
    else if (m === 'end') openEnd();
  }

  function openReview() {
    const r = LG.yearReview();
    const S = LG.state();
    const deltas = D.STAT_KEYS.filter(k => r.d[k]).map(k => '<div class="kv"><span>' + STAT_ICON[k] + ' ' + D.STATS[k] + '</span><span class="delta ' + (r.d[k] > 0 ? 'up' : 'dn') + '">' + (r.d[k] > 0 ? '+' : '') + r.d[k] + '</span></div>').join('');
    const logs = r.logs.length ? r.logs.map(l => '<div class="kv"><span class="small"><b>' + l.m + ' 月</b>・' + esc(l.x.length > 46 ? l.x.slice(0, 45) + '…' : l.x) + '</span></div>').join('') : '<p class="muted small">平平淡淡的一年。</p>';
    const p = Art.playerSpec(S, 'home', null, r.hap >= 60 ? 'happy' : r.hap < 45 ? 'sad' : 'normal');
    openModal('<div class="modal-hero">' + Art.portrait(p, { w: 120, h: 120, scale: 1.25, bg: '#fff4e4' }) + '<div><h2>' + r.age + ' 歲的這一年</h2><p class="muted small">' + r.year + ' 年回顧</p><p><b>' + hapFace(r.hap) + ' 年度幸福度 ' + r.hap + '</b></p></div></div>' +
      '<div class="card sec">' + (deltas || '<p class="muted small">能力沒有明顯變化。</p>') +
      '<div class="kv"><span>💰 存款變化</span><span class="delta ' + (r.money >= 0 ? 'up' : 'dn') + '">' + (r.money >= 0 ? '+' : '') + money(r.money) + '</span></div>' +
      (r.job ? '<div class="kv"><span>💼 工作</span><span>' + esc(r.job) + '</span></div>' : '') +
      '<div class="kv"><span>📏 身高／體重</span><span>' + Math.round(r.hgt) + ' cm／' + Math.round(r.wgt) + ' kg</span></div></div>' +
      '<div class="card sec"><h3>這一年的大事</h3>' + logs + '</div>' +
      '<div class="sheet-actions"><button class="btn btn-primary" data-act="ack" data-m="review">繼續</button>' +
      '<label class="small muted center"><input type="checkbox" data-act="skip-review"' + (settings.autoSkipReview ? ' checked' : '') + '> 自動播放時略過年度回顧</label></div>', { type: 'review' });
  }
  function openStage(m) {
    const ev = LG.stageEval(m.slice(6));
    const S = LG.state();
    const p = Art.playerSpec(S, 'home', null, ev.grade === 'S' || ev.grade === 'A' ? 'happy' : 'normal');
    p.pose = ev.grade === 'S' ? 'cheer' : 'idle';
    openModal('<h2>' + ev.n + '結束了</h2><p class="muted small">這段日子的評價是……</p>' +
      '<div class="grade-row">' + Art.portrait(p, { w: 120, h: 130, scale: 1.3 }) + '<div class="big-grade g-' + ev.grade + '">' + ev.grade + '</div></div><p class="center"><b>' + ev.word + '</b></p>' +
      '<div class="card sec"><div class="kv"><span>平均幸福度</span><b>' + ev.hap + '</b></div><div class="kv"><span>平均健康</span><b>' + ev.hp + '</b></div>' +
      '<div class="kv"><span>' + ev.thirdN + '</span><b>' + ev.third + '</b></div><div class="kv"><span>這個階段解鎖的成就</span><b>' + ev.achN + '</b></div></div>' +
      '<div class="sheet-actions"><button class="btn btn-primary" data-act="ack" data-m="' + m + '">' + (LG.state().ended ? '繼續' : '迎接下一個階段') + '</button></div>', { type: m });
  }
  function openEnd() {
    const S = LG.state();
    const fs = LG.finalSummary();
    const ageY = Math.floor(S.ageM / 12);
    const line = [ageY >= 99 ? '活到了 99 歲' : '享年 ' + ageY + ' 歲', fs.degree ? '學歷：' + fs.degree : '',
      fs.retired ? '已退休' : fs.job ? fs.job.title : '', fs.ms === 'married' ? '和另一半相伴到老' : fs.ms === 'widowed' ? '另一半先走一步' : '',
      fs.kids ? fs.kids + ' 個孩子' : '', fs.gkids ? fs.gkids + ' 個孫子女' : ''].filter(Boolean).join('　');
    const cast = [];
    const sp = LG.state().npcs.find(n => n.role === 'spouse' && n.alive) || LG.state().npcs.find(n => n.role === 'crush' && n.alive && S.tags.includes('交往中'));
    const p = Art.playerSpec(S, 'park', null, 'happy'); p.pose = 'wave';
    const memAge = Math.min(ageY, 70);
    const pm = Object.assign({}, p, { age: memAge, cane: false });
    let art = Art.scene('park', { month: S.month }) + '<g transform="translate(' + (sp ? 165 : 200) + ' 214) scale(1.45)"><g class="bob">' + Art.person(pm) + '</g></g>';
    if (sp) art += '<g transform="translate(238 214) scale(-1.45 1.45)"><g class="bob2">' + Art.person(Art.npcSpec(sp, S, 'happy')) + '</g></g>';
    LG.kids().slice(0, 2).forEach((c, i) => { art += '<g transform="translate(' + (110 - i * 40) + ' 214) scale(1.45)"><g class="bob2">' + Art.person(Art.npcSpec(c, S, 'happy')) + '</g></g>'; });
    void cast;
    openModal('<div class="end-art"><svg viewBox="0 0 400 240">' + art + '</svg></div>' +
      '<h2>' + esc(S.name) + ' 的一生</h2><p class="muted small">' + (S.year - ageY) + '–' + S.year + '</p>' +
      '<div class="card sec center"><div class="small muted">人生稱號</div><div class="title-big">「' + esc(fs.title) + '」</div><div class="small">' + esc(line) + '</div></div>' +
      '<div class="score-big">' + fs.total + '<small> / 1000</small></div>' +
      '<div class="card sec">' + fs.dims.map(d => '<div class="dim"><div class="kv" style="border:0;padding:0"><span>' + d.n + '（' + d.w + '%）</span><b>' + d.v + '</b></div><div class="bar"><i style="width:' + d.v + '%;background:var(--coral)"></i></div></div>').join('') + '</div>' +
      '<div class="card sec"><div class="kv"><span>留下的資產</span><b>' + money(fs.nw) + '</b></div>' + (fs.skills && fs.skills.length ? '<div class="kv"><span>技能</span><b class="small">' + esc(fs.skills.join('、')) + '</b></div>' : '') + '</div>' +
      '<div class="card sec"><h3>各階段評價</h3><div class="tags">' + fs.stages.map(s => '<span>' + s.n + ' <b class="g-' + s.grade + '">' + s.grade + '</b></span>').join('') + '</div></div>' +
      '<div class="card sec"><h3>成就（' + fs.ach.length + '）</h3>' + (fs.ach.length ? '<div class="tags">' + fs.ach.map(a => '<span>🏆 ' + a + '</span>').join('') + '</div>' : '<p class="muted small">這次沒有解鎖成就。</p>') + '</div>' +
      '<div class="sheet-actions"><button class="btn btn-primary" data-act="replay">再活一次</button><button class="btn btn-soft" data-act="end-log">回顧人生紀錄</button><button class="btn btn-ghost" data-act="title">回到標題</button></div>', { type: 'end' });
  }

  function openMenu() {
    stopAuto();
    const sp = [[2400, '慢'], [1500, '中'], [700, '快']];
    openModal('<h2>選單</h2><div class="sheet-actions">' +
      '<button class="btn btn-soft" data-act="save-menu">💾 存檔</button>' +
      '<button class="btn btn-soft" data-act="load">📂 讀檔</button>' +
      '<button class="btn btn-soft" data-act="export">⬇️ 匯出存檔檔案（備份用）</button>' +
      '<div class="card sec"><h3>事件播放速度</h3><div class="seg seg3">' + sp.map(o => '<button data-act="speed" data-v="' + o[0] + '" class="' + (settings.speed === o[0] ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>' +
      '<label class="small row" style="margin-top:10px"><input type="checkbox" data-act="ev-auto"' + (settings.evAuto ? ' checked' : '') + '> 事件自動一則一則播放（關掉就每則自己點）</label></div>' +
      (window.Music && Music.supported() ? '<div class="card sec"><h3>背景音樂</h3><label class="small row"><input type="checkbox" data-act="music-chk"' + (settings.music ? ' checked' : '') + '> 播放背景音樂</label><div class="range-row" style="margin-top:8px"><span class="small">音量</span><input type="range" id="vol" min="0" max="100" value="' + Math.round(settings.vol * 100) + '"></div></div>' : '') +
      '<button class="btn btn-ghost" data-act="title">🏠 回到標題（進度已自動存檔）</button>' +
      '<button class="btn btn-primary" data-act="close">繼續遊戲</button></div>', { type: 'menu', dismiss: true });
    const v = document.getElementById('vol');
    if (v) v.addEventListener('input', () => { settings.vol = +v.value / 100; if (window.Music) Music.setVolume(settings.vol); Save.saveSettings(settings); });
  }
  function bindFin() {
    const la = document.getElementById('loan-amt'), est = document.getElementById('loan-est');
    if (la && est) la.addEventListener('input', () => {
      const B = LG.bankInfo(), O = B.loanOffer, P = readAmt('loan-amt'), n = (ui.loanYr || 5) * 12, r = O.rate / 12;
      est.textContent = P > 0 ? '每月約還 ' + money(Math.ceil(P * r / (1 - Math.pow(1 + r, -n)))) + '，總共還 ' + money(Math.ceil(P * r / (1 - Math.pow(1 + r, -n))) * n) : '';
    });
  }
  function slotLine(d, n) {
    if (!d) return '<span class="grow"><span class="sn">存檔 ' + n + '・空白</span></span>';
    const m = d.meta;
    return '<span class="grow"><span class="sn">' + (n === 'auto' ? '自動存檔・' : '存檔 ' + n + '・') + esc(m.name) + '（' + LG.ageText(m.ageM) + '）</span>' +
      '<span class="sm" style="display:block">遊戲時間 ' + m.year + ' 年 ' + m.month + ' 月・存於 ' + new Date(m.savedAt).toLocaleString('zh-TW') + (m.ended ? '・已完結' : '') + '</span></span>';
  }
  function openSave() {
    openModal('<h2>存檔</h2><p class="muted small">選一個欄位存下目前進度。遊戲每個月也會自動存檔。</p>' +
      Save.list().map(s => '<button class="slot card' + (s.data ? '' : ' empty') + '" data-act="save-slot" data-n="' + s.n + '">' + slotLine(s.data, s.n) + '</button>').join('') +
      '<div class="sheet-actions"><button class="btn btn-ghost" data-act="close">關閉</button></div>', { type: 'save', dismiss: true });
  }
  function openLoad() {
    stopAuto();
    const auto = Save.loadAuto();
    const row = (d, n) => '<div class="row"><button class="slot card grow' + (d ? '' : ' empty') + '" data-act="load-slot" data-n="' + n + '"' + (d ? '' : ' disabled') + '>' + slotLine(d, n) + '</button>' +
      (d && n !== 'auto' ? '<button class="del" data-act="del-slot" data-n="' + n + '">刪除</button>' : '') + '</div>';
    openModal('<h2>讀取存檔</h2>' + (auto ? row(auto, 'auto') : '') + Save.list().map(s => row(s.data, s.n)).join('') +
      '<div class="sheet-actions"><button class="btn btn-ghost" data-act="close">關閉</button></div>', { type: 'load', dismiss: true });
  }
  function loadData(d) {
    try {
      LG.load(d.state); ui.endSeen = false; autosave(); showGame();
      const S = LG.state();
      ui.idx = S.cur.items.findIndex(i => !i.done);
      if (ui.idx < 0) ui.idx = S.cur.items.length;
      ui.sched = null;
      render(); afterRender();
      toast('📂 已讀取：' + d.meta.name);
    } catch (e) { toast('⚠️ 讀取失敗：' + e.message); }
  }
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    Save.importFile(f).then(() => { ui.endSeen = false; autosave(); showGame(); toast('📂 已匯入存檔'); })
      .catch(e => toast('⚠️ 匯入失敗：' + (e.message || '檔案格式不正確')));
    fileInput.value = '';
  });

  /* ---------------- 點擊 ---------------- */
  const ACT = {
    'new': () => { ui.form = null; ui.step = 1; ui.challenge = null; showCreate(); },
    'continue': () => { const a = Save.loadAuto(); if (a) loadData(a); },
    'load': openLoad,
    'import': () => fileInput.click(),
    'title': () => { if (LG.state()) autosave(); showTitle(); },
    'rand-name': () => { const f = ui.form; f.name = rnd(D.SURN) + rnd(f.gender === 'M' ? D.GIV_M : D.GIV_F); document.getElementById('f-name').value = f.name; },
    'f-gender': el => { const f = ui.form; if (f.gender !== el.dataset.v) { f.gender = el.dataset.v; f.hair = f.gender === 'M' ? 'short' : 'bob'; } showCreate(); },
    'wiz-next': () => { const f = ui.form; if (ui.step === 1 && !f.name.trim()) { toast('請先輸入名字'); return; } ui.step = Math.min(3, ui.step + 1); showCreate(); window.scrollTo(0, 0); },
    'wiz-back': () => { ui.step = Math.max(1, ui.step - 1); showCreate(); window.scrollTo(0, 0); },
    'b-wealth': el => { ui.form.birth.wealth = +el.dataset.v; showCreate(); },
    'b-struct': el => { ui.form.birth.struct = el.dataset.v; showCreate(); },
    'b-sibs': el => { ui.form.birth.sibs = +el.dataset.v; showCreate(); },
    't-stat': el => { const B = ui.form.birth, k = el.dataset.k, d = +el.dataset.d; if (d > 0 && (talentLeft(ui.form) < d || B.st[k] + d > TALENT_MAX)) return; if (d < 0 && B.st[k] + d < 10) return; B.st[k] += d; const y = window.scrollY; showCreate(); window.scrollTo(0, y); },
    't-trait': el => { const B = ui.form.birth, t = el.dataset.v; const i = B.traits.indexOf(t); if (i >= 0) B.traits.splice(i, 1); else if (B.traits.length < 2) B.traits.push(t); const y = window.scrollY; showCreate(); window.scrollTo(0, y); },
    't-reset': () => { const B = ui.form.birth; D.STAT_KEYS.forEach(k => { B.st[k] = TALENT_BASE; }); B.traits = []; showCreate(); },
    'pick-day': el => { stopAuto(); openPicker(+el.dataset.d); },
    'pick-k': el => { ui.pickK = el.dataset.v; setModalHtml(ui.modal.draw()); },
    'pick-scope': el => { ui.pickScope = el.dataset.v; setModalHtml(ui.modal.draw()); },
    'pick-act': el => {
      const W = LG.week();
      const sc = ui.pickScope || 'day';
      W.days.forEach(D => {
        if (D.k === 0) return;
        if (sc === 'day' ? D.d === ui.pickDay : sc === 'wkd' ? D.d < 5 : sc === 'wke' ? D.d >= 5 : true) ui.plan7[D.d] = el.dataset.v;
      });
      closeModal(); render(true);
    },
    'run-week': () => { clearTimeout(ui.timer); runWeek(); },
    'end-week': () => { clearTimeout(ui.timer); endWeek(); },
    'town-loc': el => { stopAuto(); const k = el.dataset.k; walkTo(k, () => openLoc(k)); },
    'town-spot': el => {
      stopAuto();
      const k = el.dataset.k, i = +el.dataset.i;
      const S = LG.state();
      if (!LG.week().out) { toast('這週已經沒有空出門了'); return; }
      walkTo(k, () => { const from = S.cur.items.length; afterVisit(LG.visit(k, i), from); });
    },
    'town-npc': el => { stopAuto(); openSoc(+el.dataset.id || el.dataset.id); },
    'loc-spot': el => { const S = LG.state(); const from = S.cur.items.length; closeModal(); afterVisit(LG.visit(el.dataset.k, +el.dataset.i), from); },
    'loc-walk': el => { const S = LG.state(); const from = S.cur.items.length; closeModal(); afterVisit(LG.visit(el.dataset.k), from); },
    'go-shop': () => { closeModal(); ui.tab = 'shop'; render(); window.scrollTo(0, 0); },
    'soc-pick-meal': () => openSocPick('meal'),
    'soc-pick-trip': () => openSocPick('trip'),
    'soc-open': el => { stopAuto(); openSoc(+el.dataset.id || el.dataset.id); },
    'soc-do': el => {
      const S = LG.state();
      const from = S.cur.items.length;
      const r = LG.social(+el.dataset.id || el.dataset.id, el.dataset.k);
      closeModal();
      if (r.err) { toast(r.err); return; }
      ui.tab = 'month';
      afterVisit(r, from);
      window.scrollTo(0, 0);
    },
    'buy': el => { const S = LG.state(); const seen = seenAll(S); const from = S.cur.items.length; const r = LG.buy(el.dataset.v); if (r.err) { toast(r.err); return; } autosave(); if (seen) ui.idx = from; ui.tab = 'month'; render(); window.scrollTo(0, 0); afterRender(); },
    'sell': el => { if (!confirm('確定要處理掉嗎？')) return; const S = LG.state(); const from = S.cur.items.length; const seen = seenAll(S); const r = LG.sell(el.dataset.v); if (r.err) { toast(r.err); return; } autosave(); if (seen) ui.idx = from; ui.tab = 'month'; render(); afterRender(); },
    'move-home': el => { const S = LG.state(); const from = S.cur.items.length; const seen = seenAll(S); const r = LG.moveHome(el.dataset.kind, +el.dataset.lv); if (r.err) { toast(r.err); return; } autosave(); if (seen) ui.idx = from; ui.tab = 'month'; render(); window.scrollTo(0, 0); afterRender(); },
    'close-picker': () => { closeModal(); render(true); },
    'decide': el => {
      const S = LG.state();
      const from = S.cur.items.length;
      if (el.dataset.v === 'career') { openCareer(); return; }
      if (el.dataset.v === 'invest') { ui.tab = 'money'; render(); const f = document.getElementById('fund'); if (f) f.scrollIntoView({ block: 'start' }); return; }
      if (!LG.decide(el.dataset.v)) { toast('現在還不能這麼做'); return; }
      autosave();
      ui.tab = 'month'; ui.idx = Math.min(from, S.cur.items.length - 1);
      render(); window.scrollTo(0, 0); afterRender();
    },
    'f-hair': el => { ui.form.hair = el.dataset.v; showCreate(); },
    'f-hairc': el => { ui.form.hairC = el.dataset.v; showCreate(); },
    'f-skin': el => { ui.form.skin = +el.dataset.v; showCreate(); },
    'f-zodiac': el => { ui.form.zodiac = el.dataset.v; showCreate(); },
    'rand-all': () => { const b = ui.form && ui.form.birth; ui.form = randomForm(); if (b) ui.form.birth = b; showCreate(); },
    'start': startLife,
    'choose': el => {
      const it = LG.choose(+el.dataset.i, +el.dataset.j);
      if (!it) return;
      autosave();
      render(true);
      afterRender();
      clearTimeout(ui.timer);
      if (settings.evAuto || ui.auto) ui.timer = setTimeout(nextEv, settings.speed * 1.6);
    },
    'next-ev': () => { clearTimeout(ui.timer); nextEv(); },
    'next-month': () => { clearTimeout(ui.timer); nextMonth(); },
    'stage-tap': () => { const S = LG.state(); if (!seenAll(S) && curItem(S).done) { clearTimeout(ui.timer); nextEv(); } },
    'view-ev': el => { clearTimeout(ui.timer); ui.idx = +el.dataset.i; render(); },
    'auto': () => { ui.auto = !ui.auto; if (!ui.auto) clearTimeout(ui.timer); render(true); afterRender(); },
    'tab': el => { ui.tab = el.dataset.t; clearTimeout(ui.timer); render(); window.scrollTo(0, 0); if (ui.tab === 'month') afterRender(); },
    'toggle-stats': () => { settings.statsOpen = !settings.statsOpen; Save.saveSettings(settings); render(true); },
    'menu': openMenu,
    'close': () => { closeModal(); render(true); afterRender(); },
    'save-menu': openSave,
    'save-slot': el => {
      const n = +el.dataset.n;
      if (Save.slot(n) && !confirm('要覆蓋存檔 ' + n + ' 嗎？')) return;
      if (Save.saveSlot(n)) { toast('💾 已存到存檔 ' + n); openSave(); } else toast('⚠️ 存檔失敗：瀏覽器空間不足');
    },
    'load-slot': el => { const n = el.dataset.n; const d = n === 'auto' ? Save.loadAuto() : Save.slot(+n); if (d) { closeModal(); loadData(d); } },
    'del-slot': el => { const n = +el.dataset.n; if (confirm('確定刪除存檔 ' + n + '？刪除後無法復原。')) { Save.delSlot(n); openLoad(); } },
    'export': () => { if (LG.state()) { Save.exportFile(); toast('⬇️ 已下載存檔檔案'); } },
    'speed': el => { settings.speed = +el.dataset.v; Save.saveSettings(settings); openMenu(); },
    'ev-auto': el => { settings.evAuto = el.checked; Save.saveSettings(settings); },
    'ack': el => { LG.ackModal(el.dataset.m); autosave(); closeModal(); render(true); afterRender(); },
    'skip-review': el => { settings.autoSkipReview = el.checked; Save.saveSettings(settings); },
    'end': () => { ui.endSeen = false; ui.idx = LG.state().cur.items.length; render(true); handleModals(); if (!ui.modal) openEnd(); },
    'menu-close': () => { closeModal(); },
    'music': () => { settings.music = !settings.music; Save.saveSettings(settings); if (window.Music) { if (settings.music) { Music.setVolume(settings.vol); Music.start(); } else Music.stop(); } document.querySelectorAll('.music-btn').forEach(b => { b.outerHTML = musicBtn(); }); },
    'music-chk': el => { settings.music = el.checked; Save.saveSettings(settings); if (window.Music) { if (settings.music) { Music.setVolume(settings.vol); Music.start(); } else Music.stop(); } },
    'bank-max': () => { const el = document.getElementById('bank-amt'); const B = LG.bankInfo(); if (el) el.value = Math.max(0, Math.max(B.cash, B.bank)); },
    'deposit': () => { const v = readAmt('bank-amt'); if (finDone(LG.deposit(v), '🏦 已存入 ' + money(v))) render(true); },
    'withdraw': () => { const v = readAmt('bank-amt'); if (finDone(LG.withdraw(v), '💵 已提領 ' + money(v))) render(true); },
    'loan-yr': el => { ui.loanYr = +el.dataset.v; render(true); },
    'borrow': () => { const v = readAmt('loan-amt'); const yr = ui.loanYr || 5; if (!v) { toast('請先輸入金額'); return; } if (!confirm('確定向銀行借 ' + money(v) + '，分 ' + yr + ' 年還嗎？')) return; const r = LG.borrow(v, yr); if (finDone(r, '💳 貸款核准！每月還 ' + money(r.pay || 0))) render(true); },
    'repay': el => { if (!confirm('確定要提前還清嗎？')) return; if (finDone(LG.repay(+el.dataset.i), '✅ 已還清')) render(true); },
    'stock': el => { stopAuto(); openStock(el.dataset.v); },
    'goal': el => { LG.setGoal(el.dataset.v || null); autosave(); toast(el.dataset.v ? '🧭 已設為生涯目標' : '已取消目標'); setModalHtml(ui.modal.draw()); },
    'career-d': el => { stopAuto(); openCareerDetail(el.dataset.v); },
    'career-back': () => { openCareer(); },
    'challenge': () => { ui.chCat = 'all'; showChallengePick(); window.scrollTo(0, 0); },
    'ch-cat': el => { ui.chCat = el.dataset.v; showChallengePick(); },
    'ch-pick': el => pickChallenge(el.dataset.v),
    'ch-go': el => { closeModal(); ui.challenge = el.dataset.v; ui.form = null; ui.step = 1; showCreate(); window.scrollTo(0, 0); },
    'start-challenge': () => startChallenge(),
    'qz-pick': el => quizPick(+el.dataset.v),
    'qz-next': () => quizNext(),
    'cat-f': el => { ui.careerCat = el.dataset.v; setModalHtml(ui.modal.draw()); },
    'fund-pick': el => { const i = document.getElementById('fund-amt'); if (i) i.value = el.dataset.v; },
    'fund-set': () => { const v = readAmt('fund-amt'); if (!v) { toast('請輸入金額，或按「停止扣款」'); return; } if (finDone(LG.setInvest(v), '📊 每月定期定額 ' + money(Math.round(v / 100) * 100))) render(true); },
    'fund-stop': () => { if (finDone(LG.setInvest(0), '已停止每月扣款')) render(true); },
    'fund-add': () => { const v = readAmt('fund-one'); if (finDone(LG.fundAdd(v), '📊 已投入 ' + money(v))) render(true); },
    'fund-sell': () => { const v = readAmt('fund-one'); const r = LG.fundSell(v); if (finDone(r, '💵 已贖回 ' + money(r.amt || 0))) render(true); },
    'fund-sellall': () => { if (!confirm('全部贖回？')) return; const r = LG.fundSell('all'); if (finDone(r, '💵 已贖回 ' + money(r.amt || 0))) render(true); },
    'qty': el => { ui.stockQty = +el.dataset.v; setModalHtml(ui.modal.draw()); rebindQty(); },
    'qty-d': el => { const step = ui.stockQty >= 1000 ? 1000 : ui.stockQty >= 100 ? 100 : ui.stockQty >= 10 ? 10 : 1; ui.stockQty = Math.max(1, ui.stockQty + step * +el.dataset.v); setModalHtml(ui.modal.draw()); rebindQty(); },
    'stock-buy': () => { const r = LG.buyStock(ui.stockId, ui.stockQty); if (finDone(r, '📈 買進成功，共 ' + money(r.tot || 0))) { setModalHtml(ui.modal.draw()); rebindQty(); } },
    'stock-sell': () => { const r = LG.sellStock(ui.stockId, ui.stockQty); if (finDone(r, r.gain >= 0 ? '💰 賣出，賺了 ' + money(r.gain || 0) : '📉 賣出，賠了 ' + money(-(r.gain || 0)))) { setModalHtml(ui.modal.draw()); rebindQty(); } },
    'stock-sellall': () => { if (!confirm('全部賣掉？')) return; const r = LG.sellStock(ui.stockId, 'all'); if (finDone(r, r.gain >= 0 ? '💰 全部賣出，賺了 ' + money(r.gain || 0) : '📉 全部賣出，賠了 ' + money(-(r.gain || 0)))) { setModalHtml(ui.modal.draw()); rebindQty(); } },
    'close-fin': () => { closeModal(); render(true); },
    'end-log': () => { ui.endSeen = true; closeModal(); ui.tab = 'log'; render(); window.scrollTo(0, 0); },
    'replay': () => { ui.form = null; ui.step = 1; showCreate(); }
  };

  // 手機瀏覽器只允許在「點擊完成」時開始播放；還沒成功就每次點擊都再試一次
  const armMusic = () => {
    if (!window.Music || !settings.music) return;
    if (Music.isPlaying() && Music.state() === 'running') return;
    Music.setVolume(settings.vol); musicTheme(); Music.start();
  };
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, armMusic, { capture: true, passive: true }));
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (!fn) return;
    if (el.type === 'checkbox') { fn(el); return; }
    e.preventDefault();
    fn(el);
  });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const S = LG.state();
    if (!S || !document.querySelector('.game') || ui.modal) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (planning(S)) runWeek();
      else if (inTown(S)) endWeek();
      else if (monthDone(S)) { if (S.ended) ACT.end(); else nextMonth(); }
      else if (!seenAll(S) && curItem(S).done) nextEv();
      return;
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && !seenAll(S)) {
      const it = curItem(S);
      if (!it.done && it.choices[n - 1] && !it.choices[n - 1].dis) ACT.choose({ dataset: { i: ui.idx, j: n - 1 } });
    }
  });
  window.addEventListener('pagehide', () => { if (LG.state()) Save.auto(); });

  showTitle();
})();
