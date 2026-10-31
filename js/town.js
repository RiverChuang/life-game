/* ============================================================
 * 小鎮地圖（俯視）：角色在鎮上走動，點地點或驚嘆號觸發事件
 * ============================================================ */
(function (root) {
  'use strict';
  const Town = (root.Town = {});
  const f1 = n => Math.round(n * 10) / 10;
  const R = (x, y, w, h, f, r = 0, ex = '') => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${r}" fill="${f}" ${ex}/>`;
  const C = (x, y, r, f, ex = '') => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${f}" ${ex}/>`;
  const E = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${f}" ${ex}/>`;
  const P = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
  const T = (x, y, s, size, f, ex = '') => `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" fill="${f}" text-anchor="middle" font-family="Huninn, 'Noto Sans TC', sans-serif" font-weight="700" ${ex}>${s}</text>`;
  const OL = 'stroke="#5b4636" stroke-width="1.3" stroke-linejoin="round"';
  Town.W = 400; Town.H = 300;

  // 地點：x, y 是門口（角色走到這裡）
  Town.LOCS = {
    home: { x: 62, y: 112, n: '家' },
    shop: { x: 148, y: 112, n: '商店街' },
    office: { x: 262, y: 112, n: '公司' },
    hospital: { x: 352, y: 112, n: '醫院' },
    school: { x: 62, y: 262, n: '學校' },
    cafe: { x: 150, y: 262, n: '咖啡廳' },
    park: { x: 270, y: 262, n: '公園' },
    temple: { x: 356, y: 262, n: '廟口' },
    station: { x: 200, y: 28, n: '車站' }
  };
  // 場景 → 地點
  Town.SCENE_LOC = { home: 'home', nursery: 'home', studio: 'home', dorm: 'home', shop: 'shop', nightmarket: 'shop', office: 'office', factory: 'office', hospital: 'hospital', classroom: 'school', kinder: 'school', campus: 'school', field: 'school', cafe: 'cafe', park: 'park', beach: 'park', mountain: 'park', pool: 'park', temple: 'temple', street: 'station', army: 'station', wedding: 'cafe' };

  function tree(x, y, s = 1, c = '#7cc08e') { return E(x, y + 2, 9 * s, 3 * s, '#000', 'opacity=".1"') + R(x - 1.6 * s, y - 8 * s, 3.2 * s, 9 * s, '#a07656', 1) + C(x, y - 14 * s, 9 * s, c, OL) + C(x - 3 * s, y - 17 * s, 3 * s, '#a6dcb2', 'opacity=".7"'); }
  function house(x, y, wall, roof, w = 58, h = 34) {
    let s = R(x - w / 2, y - h, w, h, wall, 2, OL);
    s += P(`M ${x - w / 2 - 5} ${y - h + 1} L ${x} ${y - h - 22} L ${x + w / 2 + 5} ${y - h + 1} Z`, roof, OL);
    s += R(x - 6, y - 17, 12, 17, '#a9774f', 1.5, OL) + C(x + 3.5, y - 8, 1, '#f5d06b');
    s += R(x - w / 2 + 6, y - h + 8, 12, 10, '#bfe6f2', 1.5, OL) + R(x + w / 2 - 18, y - h + 8, 12, 10, '#bfe6f2', 1.5, OL);
    return s;
  }
  const BLD = {
    home(S) {
      const L = Town.LOCS.home;
      const lv = S.home === 'own' ? 2 + (S.homeLv || 2) : S.home === 'rent' ? (S.homeLv || 2) : S.fam.wealth;
      if (lv >= 5) return house(L.x, L.y, '#fff3dc', '#d9776a', 70, 40) + R(L.x - 40, L.y - 3, 80, 4, '#e9d2a8') + tree(L.x - 42, L.y, 0.9) + tree(L.x + 42, L.y, 0.9);
      if (lv >= 4) return R(L.x - 26, L.y - 62, 52, 62, '#e8eef6', 2, OL) + [0, 1, 2, 3].map(r => [0, 1, 2].map(c => R(L.x - 20 + c * 15, L.y - 56 + r * 12, 9, 7, '#bfe6f2', 1)).join('')).join('') + R(L.x - 6, L.y - 14, 12, 14, '#a9774f', 1, OL);
      if (lv <= 1) return house(L.x, L.y, '#e8dcc8', '#9a8a7a', 46, 28);
      return house(L.x, L.y, '#ffe9c7', '#e7866f');
    },
    shop() {
      const L = Town.LOCS.shop; let s = '';
      const cols = ['#ff8a7a', '#5aa7f0', '#f5b83d'];
      for (let i = 0; i < 3; i++) {
        const x = L.x - 33 + i * 22;
        s += R(x, L.y - 30, 22, 30, '#fff8ee', 1, OL);
        for (let k = 0; k < 4; k++) s += R(x + k * 5.5, L.y - 30, 5.5, 7, k % 2 ? '#ffffff' : cols[i]);
        s += R(x, L.y - 30, 22, 7, 'none', 0, OL) + R(x + 4, L.y - 19, 14, 12, '#bfe6f2', 1);
      }
      return s;
    },
    office(S) {
      const L = Town.LOCS.office;
      const jd = S.job && LG.jobDef(S.job.id);
      const sn = jd ? jd.sn : 'office';
      if (sn === 'factory') return R(L.x - 32, L.y - 34, 64, 34, '#d7dde4', 2, OL) + P(`M ${L.x - 32} ${L.y - 34} l 16 -10 l 0 10 l 16 -10 l 0 10 l 16 -10 l 0 10 l 16 -10 l 0 10 Z`, '#b9c3cf', OL) + R(L.x + 18, L.y - 62, 8, 22, '#9aa6b4', 1, OL) + R(L.x - 6, L.y - 16, 12, 16, '#7b8794', 1, OL);
      let s = R(L.x - 24, L.y - 70, 48, 70, '#cfe1f2', 2, OL);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) s += R(L.x - 18 + c * 13, L.y - 64 + r * 9, 9, 5.5, '#8fbbe0', 1);
      return s + R(L.x - 7, L.y - 13, 14, 13, '#6f8fae', 1, OL);
    },
    hospital() {
      const L = Town.LOCS.hospital;
      return R(L.x - 30, L.y - 46, 60, 46, '#ffffff', 2, OL) + R(L.x - 6, L.y - 42, 12, 4, '#ff6b6b') + R(L.x - 2, L.y - 46, 4, 12, '#ff6b6b') + [0, 1].map(r => [0, 1, 2, 3].map(c => R(L.x - 24 + c * 13, L.y - 32 + r * 11, 8, 6, '#bfe6f2', 1)).join('')).join('') + R(L.x - 8, L.y - 12, 16, 12, '#9fd3c7', 1, OL);
    },
    school(S) {
      const L = Town.LOCS.school;
      let s = R(L.x - 38, L.y - 38, 76, 38, '#ffe2b8', 2, OL) + R(L.x - 10, L.y - 52, 20, 16, '#ffd08a', 2, OL) + C(L.x, L.y - 44, 5, '#fff', OL) + P(`M ${L.x} ${L.y - 44} l 0 -3 M ${L.x} ${L.y - 44} l 2.5 0`, 'none', 'stroke="#5b4636" stroke-width="1"');
      for (let c = 0; c < 5; c++) if (c !== 2) s += R(L.x - 33 + c * 14, L.y - 30, 9, 8, '#bfe6f2', 1);
      s += R(L.x - 6, L.y - 15, 12, 15, '#a9774f', 1, OL) + R(L.x + 42, L.y - 48, 1.6, 48, '#9aa6b4') + R(L.x + 43.6, L.y - 48, 11, 7, '#ff6b6b');
      return s;
    },
    cafe() {
      const L = Town.LOCS.cafe;
      let s = R(L.x - 24, L.y - 32, 48, 32, '#f6e7d4', 2, OL);
      for (let k = 0; k < 8; k++) s += R(L.x - 26 + k * 6.5, L.y - 34, 6.5, 8, k % 2 ? '#ffffff' : '#7cc08e');
      s += R(L.x - 26, L.y - 34, 52, 8, 'none', 1, OL) + R(L.x - 18, L.y - 21, 14, 12, '#bfe6f2', 1) + R(L.x + 4, L.y - 17, 10, 17, '#a9774f', 1, OL);
      s += C(L.x + 22, L.y - 42, 6, '#fff', OL) + T(L.x + 22, L.y - 39.5, '☕', 7, '#000');
      return s;
    },
    park() {
      const L = Town.LOCS.park;
      let s = E(L.x + 6, L.y - 22, 26, 11, '#7fcbe0', OL) + E(L.x + 2, L.y - 24, 8, 3, '#bfe9f4');
      s += tree(L.x - 38, L.y - 10, 1.1) + tree(L.x - 24, L.y - 36, 0.9, '#8fd09d') + tree(L.x + 40, L.y - 34, 1) + tree(L.x + 44, L.y - 4, 0.8, '#6fb27f');
      s += R(L.x - 16, L.y - 6, 18, 3, '#b98b5e', 1, OL) + R(L.x - 14, L.y - 3, 2, 4, '#8a6a50') + R(L.x - 1, L.y - 3, 2, 4, '#8a6a50');
      for (const [x, y, c] of [[-30, 4, '#ff9aa2'], [24, 6, '#ffd34d'], [-6, -40, '#c9b6f2']]) s += C(L.x + x, L.y + y, 2.2, c);
      return s;
    },
    temple() {
      const L = Town.LOCS.temple;
      return R(L.x - 26, L.y - 28, 52, 28, '#e86a5a', 1, OL) + P(`M ${L.x - 36} ${L.y - 26} Q ${L.x - 30} ${L.y - 32} ${L.x - 24} ${L.y - 36} L ${L.x + 24} ${L.y - 36} Q ${L.x + 30} ${L.y - 32} ${L.x + 36} ${L.y - 26} Z`, '#f5c24b', OL) +
        P(`M ${L.x - 28} ${L.y - 36} Q ${L.x - 22} ${L.y - 42} ${L.x - 16} ${L.y - 46} L ${L.x + 16} ${L.y - 46} Q ${L.x + 22} ${L.y - 42} ${L.x + 28} ${L.y - 36} Z`, '#f5c24b', OL) + R(L.x - 8, L.y - 18, 16, 18, '#a33b2f', 1, OL) + R(L.x - 20, L.y - 22, 6, 9, '#ffd36b', 1) + R(L.x + 14, L.y - 22, 6, 9, '#ffd36b', 1);
    },
    station() {
      const L = Town.LOCS.station;
      return R(L.x - 34, L.y - 22, 68, 22, '#dfe8ef', 2, OL) + R(L.x - 38, L.y - 26, 76, 6, '#5aa7f0', 2, OL) + R(L.x - 26, L.y - 16, 12, 10, '#bfe6f2', 1) + R(L.x + 14, L.y - 16, 12, 10, '#bfe6f2', 1) + R(L.x - 6, L.y - 14, 12, 14, '#7b8794', 1, OL);
    }
  };

  function ground(S) {
    const m = S.month;
    const grass = m >= 6 && m <= 8 ? '#a9d98d' : m >= 9 && m <= 11 ? '#c4d98a' : m === 12 || m <= 2 ? '#b8d6a6' : '#b3e09a';
    let s = R(0, 0, 400, 300, grass);
    for (let i = 0; i < 26; i++) { const x = (i * 97) % 400, y = (i * 61) % 300; s += E(x, y, 14, 6, '#ffffff', 'opacity=".12"'); }
    // 道路
    s += R(0, 132, 400, 26, '#c9c2b8') + R(187, 0, 26, 300, '#c9c2b8');
    for (let x = 6; x < 400; x += 22) if (x < 180 || x > 216) s += R(x, 144, 11, 2, '#fffbe8');
    for (let y = 6; y < 300; y += 22) if (y < 128 || y > 160) s += R(199, y, 2, 11, '#fffbe8');
    for (let i = 0; i < 5; i++) s += R(216 + i * 5, 133, 3, 24, '#f4efe6');
    // 人行道
    s += R(0, 126, 400, 6, '#e9dfcf') + R(0, 158, 400, 6, '#e9dfcf') + R(181, 0, 6, 300, '#e9dfcf') + R(213, 0, 6, 300, '#e9dfcf');
    // 小路
    for (const k of Object.keys(Town.LOCS)) { const L = Town.LOCS[k]; if (k === 'station') continue; s += L.y < 150 ? R(L.x - 5, L.y, 10, 126 - L.y, '#eadfc9') : R(L.x - 5, 164, 10, L.y - 164 + 2, '#eadfc9'); }
    s += tree(20, 40, 0.9) + tree(118, 30, 0.8, '#8fd09d') + tree(240, 22, 0.8) + tree(390, 44, 0.9, '#6fb27f') + tree(108, 196, 0.8) + tree(232, 186, 0.75, '#8fd09d') + tree(392, 200, 0.85) + tree(20, 186, 0.8, '#6fb27f');
    if (m === 12 || m <= 2) for (let i = 0; i < 18; i++) s += C((i * 53) % 400, (i * 37) % 300, 1.4, '#fff', 'opacity=".7"');
    return s;
  }
  function label(k, S) {
    const L = Town.LOCS[k];
    let n = L.n;
    const stt = LG.status();
    if (k === 'school') n = stt === 'uni' ? '大學' : S.school && S.school.stage === 'kinder' ? '幼兒園' : '學校';
    if (k === 'office') { const jd = S.job && LG.jobDef(S.job.id); n = S.job ? (jd && jd.sn === 'factory' ? '工廠' : '公司') : '辦公大樓'; }
    if (k === 'home') n = S.home === 'own' ? '我的家' : S.home === 'rent' ? '租的房子' : S.home === 'dorm' ? '宿舍' : '家';
    const w = n.length * 9 + 10;
    return R(L.x - w / 2, L.y + 3, w, 13, '#ffffff', 6.5, 'opacity=".92" stroke="#e5d6c0" stroke-width="1"') + T(L.x, L.y + 13, n, 9, '#5b4636');
  }
  // spots: [{loc, i, k}]；npcs: [{id, loc, spec}]
  Town.svg = function (S, opt) {
    opt = opt || {};
    let s = ground(S);
    for (const k of Object.keys(BLD)) s += `<g class="bld" data-act="town-loc" data-k="${k}">${BLD[k](S)}${R(Town.LOCS[k].x - 34, Town.LOCS[k].y - 70, 68, 90, '#000', 0, 'opacity="0"')}</g>`;
    for (const k of Object.keys(Town.LOCS)) s += label(k, S);
    for (const n of opt.npcs || []) {
      const L = Town.LOCS[n.loc];
      const x = L.x + n.dx, y = L.y + 22 + n.dy;
      s += `<g class="npc-walk" data-act="town-npc" data-id="${n.id}"><g transform="translate(${f1(x)} ${f1(y)}) scale(0.42)"><g class="bob2">${Art.person(n.spec)}</g></g>${T(x, y + 9, n.name, 7.5, '#5b4636', 'paint-order="stroke" stroke="#fff" stroke-width="2.4"')}${R(x - 12, y - 40, 24, 50, '#000', 0, 'opacity="0"')}</g>`;
    }
    for (const sp of opt.spots || []) {
      const L = Town.LOCS[sp.loc];
      const x = L.x + (sp.n || 0) * 16, y = L.y - (L.y < 150 ? 92 : 72);
      const c = { d: '#4fc3a1', o: '#f5b83d', x: '#ff7a6b', f: '#a48cf7', s: '#5aa7f0' }[sp.k] || '#f5b83d';
      s += `<g class="spot" data-act="town-spot" data-i="${sp.i}" data-k="${sp.loc}"><g class="spot-bob"><path d="M ${x - 11} ${y - 12} h 22 a 4 4 0 0 1 4 4 v 13 a 4 4 0 0 1 -4 4 h -7 l -4 6 l -4 -6 h -7 a 4 4 0 0 1 -4 -4 v -13 a 4 4 0 0 1 4 -4 z" fill="${c}" ${OL}/>${T(x, y + 4.5, '!', 15, '#fff')}</g></g>`;
    }
    const me = opt.me || Town.LOCS.home;
    s += `<g id="town-me" style="transform: translate(${f1(me.x)}px, ${f1(me.y + 20)}px)"><g transform="scale(0.5)"><g class="bob">${opt.meSvg || ''}</g></g></g>`;
    return `<svg viewBox="0 0 400 300" class="town-svg" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
