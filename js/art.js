/* ============================================================
 * 人生遊戲 · 2D 美術（全部用 SVG 程式碼繪製，原創溫馨療癒風）
 * - Q 版人物：0–30 歲體型、9 種髮型、表情、職業服裝
 * - 台灣日常場景：家、教室、校園、辦公室、夜市、廟口……
 * 座標：場景 400×240，地面 y=214；人物腳底在 (0,0)，往上是負的。
 * ============================================================ */
(function (root) {
  'use strict';
  const Art = (root.Art = {});
  const OL = '#5b4636';        // 描邊色
  const EYE = '#3a2b28';
  const W = 400, H = 240, GY = 214;
  let uid = 0;

  /* ---------------- 小工具 ---------------- */
  const f1 = n => Math.round(n * 10) / 10;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function hash(str) { let h = 2166136261; const s = String(str); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) | 0; let r = Math.imul(t ^ (t >>> 15), t | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  const pickR = (r, arr) => arr[Math.floor(r() * arr.length)];
  function interp(tab, x) {
    if (x <= tab[0][0]) return tab[0][1];
    for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
    return tab[tab.length - 1][1];
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  }
  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = sh => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  Art.mixHex = mixHex;
  const ol = (w = 1.6) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const R_ = (x, y, w, h, f, r = 0, ex = '') => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${r}" fill="${f}" ${ex}/>`;
  const C_ = (x, y, r, f, ex = '') => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${f}" ${ex}/>`;
  const E_ = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${f}" ${ex}/>`;
  const P_ = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
  const T_ = (x, y, s, size, f, ex = '') => `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" fill="${f}" text-anchor="middle" font-family="Huninn, 'Noto Sans TC', sans-serif" font-weight="700" ${ex}>${s}</text>`;

  /* ---------------- 外觀選項 ---------------- */
  Art.SKINS = ['#ffe4d1', '#f9d3b4', '#e8b38c', '#c48b65'];
  Art.HAIR_COLORS = [
    { k: 'black', n: '黑色', c: '#2f2725' }, { k: 'dark', n: '深棕', c: '#56382b' }, { k: 'brown', n: '栗色', c: '#8b5a3c' },
    { k: 'caramel', n: '焦糖', c: '#c2864f' }, { k: 'ash', n: '霧灰', c: '#7d798b' }, { k: 'rose', n: '玫瑰', c: '#c97a8b' }
  ];
  Art.HAIR_STYLES = [
    { k: 'short', n: '短髮' }, { k: 'side', n: '旁分' }, { k: 'spiky', n: '刺蝟頭' }, { k: 'curly', n: '捲捲頭' }, { k: 'bob', n: '鮑伯頭' },
    { k: 'long', n: '長直髮' }, { k: 'pony', n: '馬尾' }, { k: 'twin', n: '雙馬尾' }, { k: 'bun', n: '丸子頭' }
  ];
  const TOPS = ['#f4a6a6', '#ffd27a', '#a8d8b9', '#9cc5f0', '#c9b6f2', '#f7c59f', '#fbfbf7', '#8fd3c7', '#f2b5d4', '#b8d98c'];
  const BOTTOMS = ['#5b7fb5', '#c9b48a', '#3e3e46', '#7a6a9a', '#6b8f71'];
  const HAIR_C = Object.fromEntries(Art.HAIR_COLORS.map(h => [h.k, h.c]));

  /* ---------------- 體型 ---------------- */
  const T_LEG = [[1.2, 6], [3, 8], [6, 11], [12, 15], [16, 18], [20, 21], [99, 21]];
  const T_TOR = [[1.2, 10], [3, 11], [6, 13], [12, 16], [16, 18], [20, 20], [99, 20]];
  const T_TW = [[1.2, 15], [3, 16], [6, 17], [12, 19], [16, 21], [20, 22], [99, 22]];
  const T_HR = [[1.2, 15], [3, 15.5], [6, 16], [12, 16.5], [17, 17], [99, 17]];
  function geo(age, g, bmi) {
    const wf = clamp(Math.pow((bmi || 20) / 20.5, 0.85), 0.86, 1.42);
    let torW = interp(T_TW, age) * wf;
    if (age >= 13 && g === 'M') torW += 1.6;
    return { legL: interp(T_LEG, age), torL: interp(T_TOR, age), torW, R: interp(T_HR, age), wf };
  }

  /* ---------------- 服裝 ---------------- */
  function outfit(p) {
    const c = p.cols || {}, g = p.g;
    const legsF = c.skirt && g === 'F' ? 'skirt' : 'pants';
    switch (p.wear) {
      case 'onesie': return { top: c.top || '#bfe3f2', bottom: c.top || '#bfe3f2', legs: 'pants', sleeve: 'long', shoe: c.top || '#bfe3f2', ex: ['buttons'] };
      case 'smock': return { top: '#ffd27a', bottom: '#7aa6d8', legs: g === 'F' ? 'skirt' : 'shorts', sleeve: 'short', shoe: '#ffffff', ex: ['nametag', 'collarRound'] };
      case 'elem': return { top: '#ffffff', bottom: '#33508f', legs: g === 'F' ? 'skirt' : 'shorts', sleeve: 'short', shoe: '#ffffff', ex: ['collar', 'badge'] };
      case 'junior': return { top: '#ffffff', bottom: '#2c3e66', legs: g === 'F' ? 'skirt' : 'pants', sleeve: 'short', shoe: '#ffffff', ex: ['collar', 'badge', 'pocketLine'] };
      case 'senior': return { top: '#f6f3e8', bottom: g === 'F' ? '#3f6b5a' : '#8d7d5d', legs: g === 'F' ? 'skirt' : 'pants', sleeve: 'short', shoe: '#4b3a33', ex: ['collar', g === 'F' ? 'bow' : 'tie', 'badge'], tieC: '#c84b4b', plaid: g === 'F' };
      case 'hoodie': return { top: c.top || '#9cc5f0', bottom: '#4f6ea3', legs: 'pants', sleeve: 'long', shoe: '#ffffff', ex: ['hood', 'pocket'] };
      case 'office': return { top: '#eaf2fb', bottom: '#4a4f63', legs: g === 'F' ? 'skirt' : 'pants', sleeve: 'long', shoe: '#4b3a33', ex: ['collar', 'buttonsLine'] };
      case 'suit': return { top: '#33405f', bottom: '#33405f', inner: '#ffffff', legs: g === 'F' ? 'skirt' : 'pants', sleeve: 'long', shoe: '#3a2f2b', ex: ['lapel', g === 'M' ? 'tie' : 'none'], tieC: '#c26a4a' };
      case 'army': return { top: '#6f7d4e', bottom: '#6f7d4e', legs: 'pants', sleeve: 'long', shoe: '#3a332b', ex: ['camo', 'belt'] };
      case 'vest': return { top: '#eef2f6', bottom: '#4a4f63', legs: 'pants', sleeve: 'short', shoe: '#3a332b', ex: ['vest'], vestC: '#3d6fb6' };
      case 'scrubs': return { top: '#6cc4b8', bottom: '#6cc4b8', legs: 'pants', sleeve: 'short', shoe: '#ffffff', ex: ['vneck', 'pocket'] };
      case 'coat': return { top: '#ffffff', inner: '#9fc5e8', bottom: '#4a4f63', legs: 'pants', sleeve: 'long', shoe: '#4b3a33', ex: ['labcoat', 'stetho'] };
      case 'apron': return { top: c.top || '#fbfbf7', bottom: '#4a4f63', legs: 'pants', sleeve: 'short', shoe: '#4b3a33', ex: ['apron'], apronC: c.apron || '#7a9a6b' };
      case 'chef': return { top: '#ffffff', bottom: '#3e3e46', legs: 'pants', sleeve: 'long', shoe: '#3a2f2b', ex: ['chefhat', 'buttons2'] };
      case 'work': return { top: '#4f78a8', bottom: '#4f78a8', legs: 'pants', sleeve: 'long', shoe: '#3a332b', ex: ['pocket', 'workcap', 'belt'] };
      case 'cleanroom': return { top: '#f3f6fb', bottom: '#f3f6fb', legs: 'pants', sleeve: 'long', shoe: '#dfe6ef', ex: ['bunny'] };
      case 'jacket': return { top: '#ffb74a', bottom: '#3e4a63', legs: 'pants', sleeve: 'long', shoe: '#3a332b', ex: ['zip', 'reflect'] };
      case 'teacher': return { top: '#c9a97f', inner: '#ffffff', bottom: '#5a5f72', legs: g === 'F' ? 'skirt' : 'pants', sleeve: 'long', shoe: '#4b3a33', ex: ['cardigan'] };
      case 'wedding': return g === 'M' ? { top: '#2a2a33', inner: '#ffffff', bottom: '#2a2a33', legs: 'pants', sleeve: 'long', shoe: '#1f1b1a', ex: ['lapel', 'bowtie'] } : { top: '#ffffff', bottom: '#ffffff', legs: 'gown', sleeve: 'none', shoe: '#ffffff', ex: ['veil', 'necklace'] };
      case 'elder': return { top: c.top || '#b98b6a', inner: '#f3ece0', bottom: '#6b6a72', legs: 'pants', sleeve: 'long', shoe: '#4b3a33', ex: ['cardigan'] };
      default: return { top: c.top || '#9cc5f0', bottom: c.bottom || '#5b7fb5', legs: legsF, sleeve: 'short', shoe: c.shoe || '#ffffff', ex: c.stripe ? ['stripe'] : [] };
    }
  }

  /* ---------------- 頭髮 ---------------- */
  function hairBack(st, R, cy, rx, hc, torBottom) {
    const o = ol();
    switch (st) {
      case 'long': return P_(`M ${-rx * 1.06} ${cy - R * 0.2} Q ${-rx * 1.25} ${torBottom - 4} ${-rx * 0.7} ${torBottom} L ${rx * 0.7} ${torBottom} Q ${rx * 1.25} ${torBottom - 4} ${rx * 1.06} ${cy - R * 0.2} Z`, hc, o);
      case 'bob': return P_(`M ${-rx * 1.08} ${cy - R * 0.2} Q ${-rx * 1.16} ${cy + R * 0.85} ${-rx * 0.6} ${cy + R * 0.92} L ${rx * 0.6} ${cy + R * 0.92} Q ${rx * 1.16} ${cy + R * 0.85} ${rx * 1.08} ${cy - R * 0.2} Z`, hc, o);
      case 'pony': return P_(`M ${rx * 0.55} ${cy - R * 0.85} Q ${rx * 1.75} ${cy - R * 0.9} ${rx * 1.45} ${cy + R * 0.55} Q ${rx * 1.3} ${cy + R * 1.1} ${rx * 1.0} ${cy + R * 1.25} Q ${rx * 1.18} ${cy + R * 0.4} ${rx * 0.75} ${cy - R * 0.25} Z`, hc, o) + C_(rx * 0.82, cy - R * 0.68, R * 0.13, '#f07a8a', o);
      case 'twin': return [-1, 1].map(s => P_(`M ${s * rx * 0.8} ${cy - R * 0.55} Q ${s * rx * 1.75} ${cy - R * 0.45} ${s * rx * 1.5} ${cy + R * 0.75} Q ${s * rx * 1.38} ${cy + R * 1.05} ${s * rx * 1.2} ${cy + R * 1.0} Q ${s * rx * 1.3} ${cy + R * 0.2} ${s * rx * 0.95} ${cy - R * 0.1} Z`, hc, o) + C_(s * rx * 1.02, cy - R * 0.42, R * 0.12, '#f7c948', o)).join('');
      case 'bun': return C_(0, cy - R * 1.12, R * 0.4, hc, o);
      default: return '';
    }
  }
  function hairFront(st, R, cy, rx, hc) {
    const o = ol();
    const dome = (top = 1.32) => `M ${-rx * 1.04} ${cy + R * 0.12} C ${-rx * 1.14} ${cy - R * top} ${rx * 1.14} ${cy - R * top} ${rx * 1.04} ${cy + R * 0.12}`;
    const hl = P_(`M ${-rx * 0.55} ${cy - R * 0.82} Q ${-rx * 0.2} ${cy - R * 1.02} ${rx * 0.15} ${cy - R * 0.98}`, 'none', `stroke="${shade(hc, 0.35)}" stroke-width="2.2" stroke-linecap="round" opacity=".7"`);
    switch (st) {
      case 'tuft':
        return P_(`M ${-R * 0.1} ${cy - R * 0.95} Q ${-R * 0.25} ${cy - R * 1.35} ${R * 0.12} ${cy - R * 1.3} Q ${R * 0.35} ${cy - R * 1.22} ${R * 0.15} ${cy - R * 1.05}`, 'none', `stroke="${hc}" stroke-width="3" stroke-linecap="round"`) +
          P_(`M ${-rx * 0.7} ${cy - R * 0.62} Q 0 ${cy - R * 1.12} ${rx * 0.7} ${cy - R * 0.62} Q ${rx * 0.3} ${cy - R * 0.78} 0 ${cy - R * 0.72} Q ${-rx * 0.3} ${cy - R * 0.78} ${-rx * 0.7} ${cy - R * 0.62} Z`, hc, 'opacity=".85"');
      case 'buzz':
        return P_(`M ${-rx * 1.01} ${cy - R * 0.05} C ${-rx * 1.06} ${cy - R * 1.2} ${rx * 1.06} ${cy - R * 1.2} ${rx * 1.01} ${cy - R * 0.05} Q ${rx * 0.9} ${cy - R * 0.5} ${rx * 0.5} ${cy - R * 0.55} L ${-rx * 0.5} ${cy - R * 0.55} Q ${-rx * 0.9} ${cy - R * 0.5} ${-rx * 1.01} ${cy - R * 0.05} Z`, hc, o);
      case 'spiky': {
        const top = `M ${-rx * 1.04} ${cy + R * 0.1} Q ${-rx * 1.2} ${cy - R * 0.6} ${-rx * 0.95} ${cy - R * 0.9} L ${-rx * 1.0} ${cy - R * 1.22} L ${-rx * 0.55} ${cy - R * 1.08} L ${-rx * 0.35} ${cy - R * 1.45} L ${-rx * 0.05} ${cy - R * 1.15} L ${rx * 0.3} ${cy - R * 1.48} L ${rx * 0.5} ${cy - R * 1.1} L ${rx * 0.95} ${cy - R * 1.28} L ${rx * 0.92} ${cy - R * 0.88} Q ${rx * 1.2} ${cy - R * 0.6} ${rx * 1.04} ${cy + R * 0.1}`;
        return P_(top + ` L ${rx * 0.88} ${cy + R * 0.1} Q ${rx * 0.85} ${cy - R * 0.35} ${rx * 0.5} ${cy - R * 0.42} L ${rx * 0.32} ${cy - R * 0.22} L ${rx * 0.12} ${cy - R * 0.45} L ${-rx * 0.15} ${cy - R * 0.22} L ${-rx * 0.35} ${cy - R * 0.45} L ${-rx * 0.6} ${cy - R * 0.3} Q ${-rx * 0.86} ${cy - R * 0.32} ${-rx * 0.88} ${cy + R * 0.1} Z`, hc, o) + hl;
      }
      case 'side':
        return P_(dome() + ` L ${rx * 0.9} ${cy + R * 0.05} Q ${rx * 0.88} ${cy - R * 0.42} ${rx * 0.62} ${cy - R * 0.5} Q ${rx * 0.1} ${cy - R * 0.5} ${-rx * 0.35} ${cy - R * 0.12} Q ${-rx * 0.62} ${cy + R * 0.02} ${-rx * 0.84} ${cy - R * 0.08} Q ${-rx * 0.9} ${cy - R * 0.05} ${-rx * 0.9} ${cy + R * 0.1} Z`, hc, o) +
          P_(`M ${rx * 0.4} ${cy - R * 0.55} Q ${-rx * 0.1} ${cy - R * 0.45} ${-rx * 0.4} ${cy - R * 0.2}`, 'none', `stroke="${shade(hc, -0.25)}" stroke-width="1.4" stroke-linecap="round"`) + hl;
      case 'curly': {
        let s = '';
        const n = 9;
        for (let i = 0; i <= n; i++) {
          const a = Math.PI + (Math.PI * i) / n;
          s += C_(Math.cos(a) * rx * 0.98, cy - R * 0.15 + Math.sin(a) * R * 1.0, R * 0.32, hc, o);
        }
        s += P_(dome(1.2) + ` L ${rx * 0.88} ${cy + R * 0.1} Q ${rx * 0.6} ${cy - R * 0.25} ${rx * 0.3} ${cy - R * 0.42} Q 0 ${cy - R * 0.2} ${-rx * 0.3} ${cy - R * 0.42} Q ${-rx * 0.6} ${cy - R * 0.25} ${-rx * 0.88} ${cy + R * 0.1} Z`, hc);
        for (const x of [-0.5, -0.15, 0.2, 0.52]) s += C_(rx * x, cy - R * 0.55, R * 0.2, hc, o);
        return s;
      }
      case 'bob': case 'long': case 'twin': case 'pony': case 'bun': {
        const straight = st === 'bob' || st === 'long' || st === 'bun';
        const sideL = st === 'long' ? R * 0.9 : st === 'bob' ? R * 0.65 : R * 0.12;
        const bang = straight ?
          ` L ${rx * 0.86} ${cy + sideL} L ${rx * 0.86} ${cy - R * 0.28} Q ${rx * 0.5} ${cy - R * 0.2} ${rx * 0.18} ${cy - R * 0.32} Q 0 ${cy - R * 0.22} ${-rx * 0.2} ${cy - R * 0.32} Q ${-rx * 0.5} ${cy - R * 0.2} ${-rx * 0.86} ${cy - R * 0.28} L ${-rx * 0.86} ${cy + sideL}` :
          ` L ${rx * 0.88} ${cy + sideL} Q ${rx * 0.86} ${cy - R * 0.4} ${rx * 0.5} ${cy - R * 0.45} Q ${rx * 0.2} ${cy - R * 0.2} ${-rx * 0.05} ${cy - R * 0.38} Q ${-rx * 0.35} ${cy - R * 0.15} ${-rx * 0.6} ${cy - R * 0.38} Q ${-rx * 0.88} ${cy - R * 0.3} ${-rx * 0.88} ${cy + sideL}`;
        const domeS = `M ${-rx * 1.06} ${cy + sideL} L ${-rx * 1.05} ${cy + R * 0.1} C ${-rx * 1.14} ${cy - R * 1.32} ${rx * 1.14} ${cy - R * 1.32} ${rx * 1.05} ${cy + R * 0.1} L ${rx * 1.06} ${cy + sideL}`;
        return P_(domeS + bang + ' Z', hc, o) + hl;
      }
      default: // short
        return P_(dome() + ` L ${rx * 0.88} ${cy + R * 0.1} Q ${rx * 0.86} ${cy - R * 0.32} ${rx * 0.56} ${cy - R * 0.4} Q ${rx * 0.36} ${cy - R * 0.2} ${rx * 0.16} ${cy - R * 0.42} Q ${-rx * 0.06} ${cy - R * 0.18} ${-rx * 0.3} ${cy - R * 0.4} Q ${-rx * 0.5} ${cy - R * 0.2} ${-rx * 0.66} ${cy - R * 0.38} Q ${-rx * 0.88} ${cy - R * 0.32} ${-rx * 0.88} ${cy + R * 0.1} Z`, hc, o) + hl;
    }
  }

  /* ---------------- 臉 ---------------- */
  function face(mood, R, cy, glasses) {
    const ey = cy + R * 0.2, ex = R * 0.42, my = cy + R * 0.55;
    let s = '';
    const eye = (x, sc = 1) => E_(x, ey, R * 0.115 * sc, R * 0.155 * sc, EYE) + C_(x + R * 0.04, ey - R * 0.055, R * 0.048 * sc, '#fff');
    const arcEye = x => P_(`M ${x - R * 0.13} ${ey + R * 0.04} Q ${x} ${ey - R * 0.17} ${x + R * 0.13} ${ey + R * 0.04}`, 'none', `stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"`);
    const lineEye = x => P_(`M ${x - R * 0.12} ${ey + R * 0.02} Q ${x} ${ey + R * 0.08} ${x + R * 0.12} ${ey + R * 0.02}`, 'none', `stroke="${EYE}" stroke-width="2" stroke-linecap="round"`);
    const brow = (x, tilt) => P_(`M ${x - R * 0.13} ${ey - R * 0.27 - tilt * (x < 0 ? -1 : 1) * R * 0.06} L ${x + R * 0.13} ${ey - R * 0.27 + tilt * (x < 0 ? -1 : 1) * R * 0.06}`, 'none', `stroke="${EYE}" stroke-width="1.6" stroke-linecap="round" opacity=".8"`);
    const blush = (op = 0.5, sc = 1) => E_(-R * 0.66, ey + R * 0.26, R * 0.15 * sc, R * 0.085 * sc, '#ff9aa2', `opacity="${op}"`) + E_(R * 0.66, ey + R * 0.26, R * 0.15 * sc, R * 0.085 * sc, '#ff9aa2', `opacity="${op}"`);
    const smile = (w = 0.15, d = 0.12) => P_(`M ${-R * w} ${my - R * 0.05} Q 0 ${my + R * d} ${R * w} ${my - R * 0.05}`, 'none', `stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"`);
    const open = () => P_(`M ${-R * 0.17} ${my - R * 0.08} Q 0 ${my + R * 0.3} ${R * 0.17} ${my - R * 0.08} Z`, '#c4545a', `stroke="${EYE}" stroke-width="1.4" stroke-linejoin="round"`) + E_(0, my + R * 0.08, R * 0.08, R * 0.045, '#f08a8a');
    const frown = () => P_(`M ${-R * 0.13} ${my + R * 0.06} Q 0 ${my - R * 0.08} ${R * 0.13} ${my + R * 0.06}`, 'none', `stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"`);
    switch (mood) {
      case 'happy': s = arcEye(-ex) + arcEye(ex) + blush(0.6) + open(); break;
      case 'love': s = arcEye(-ex) + arcEye(ex) + blush(0.85, 1.25) + smile(0.14, 0.16); break;
      case 'sad': s = eye(-ex, 0.9) + eye(ex, 0.9) + brow(-ex, 1) + brow(ex, 1) + frown() + P_(`M ${ex + R * 0.1} ${ey + R * 0.15} q ${R * 0.06} ${R * 0.14} 0 ${R * 0.2} q ${-R * 0.06} ${-R * 0.06} 0 ${-R * 0.2} Z`, '#8fd0f5', 'opacity=".9"'); break;
      case 'tired': s = lineEye(-ex) + lineEye(ex) + P_(`M ${-R * 0.1} ${my} L ${R * 0.1} ${my}`, 'none', `stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"`) + blush(0.3); break;
      case 'surprised': s = eye(-ex, 1.15) + eye(ex, 1.15) + brow(-ex, -0.6) + brow(ex, -0.6) + E_(0, my + R * 0.04, R * 0.08, R * 0.1, EYE) + blush(0.4); break;
      case 'angry': s = eye(-ex) + eye(ex) + brow(-ex, -1.4) + brow(ex, -1.4) + frown(); break;
      case 'think': s = eye(-ex) + eye(ex) + brow(-ex, 0.4) + P_(`M ${-R * 0.08} ${my + R * 0.02} L ${R * 0.12} ${my - R * 0.02}`, 'none', `stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"`) + blush(0.35); break;
      default: s = eye(-ex) + eye(ex) + blush(0.5) + smile();
    }
    if (glasses) s += C_(-ex, ey, R * 0.24, '#ffffff', `fill-opacity=".25" stroke="#4a4458" stroke-width="1.5"`) + C_(ex, ey, R * 0.24, '#ffffff', `fill-opacity=".25" stroke="#4a4458" stroke-width="1.5"`) + P_(`M ${-ex + R * 0.24} ${ey} Q 0 ${ey - R * 0.06} ${ex - R * 0.24} ${ey}`, 'none', 'stroke="#4a4458" stroke-width="1.5"');
    return s;
  }

  /* ---------------- 人物 ---------------- */
  Art.person = function (p) {
    if (p.age < 1.3) return baby(p);
    const G = geo(p.age, p.g, p.bmi);
    const { legL, torL, torW, R } = G;
    const O = outfit(p);
    const o = ol();
    const waistY = -legL, shY = -(legL + torL);
    const cy = shY - R * 0.72, rx = R * 1.06;
    const tw = torW / 2, bw = torW * 0.45;
    const lw = torW * 0.27 * Math.min(1.25, G.wf);
    const lx = torW * 0.2;
    const skin = p.skin || Art.SKINS[1];
    const grayT = p.gray === true ? 1 : clamp((p.age - 45) / 22, 0, 1) * (p.grayK == null ? 1 : p.grayK);
    const hc0 = p.hairC || '#3a2b28';
    const hc = grayT > 0 && /^#[0-9a-f]{6}$/i.test(hc0) ? mixHex(hc0, '#dedad5', grayT) : hc0;
    const aw = torW * 0.29;
    const armL = torL * 0.88;
    const pose = p.pose || 'idle';
    let s = '';
    // 影子
    s += E_(0, 1, torW * 0.75, 3.2, '#000', 'opacity=".12"');
    // 後面的頭髮
    let hs = p.hair || (p.g === 'F' ? 'bob' : 'short');
    if (p.age < 2.5) hs = 'tuft';
    else if (p.age < 5 && (hs === 'long' || hs === 'bun')) hs = 'bob';
    if (p.wear === 'army' && p.g === 'M') hs = 'buzz';
    if (p.wear === 'cleanroom') hs = 'none';
    const torBottom = shY + torL * 0.55;
    if (hs !== 'none') s += hairBack(hs, R, cy, rx, hc, torBottom);
    if (O.ex.includes('veil')) s += P_(`M ${-rx * 0.6} ${cy - R * 0.9} Q ${-rx * 1.7} ${cy + R} ${-rx * 1.3} ${-legL * 0.5} L ${rx * 1.3} ${-legL * 0.5} Q ${rx * 1.7} ${cy + R} ${rx * 0.6} ${cy - R * 0.9} Z`, '#ffffff', `opacity=".75" stroke="#e9e2ee" stroke-width="1"`);
    if (O.ex.includes('hood')) s += P_(`M ${-tw * 0.9} ${shY + 2} Q 0 ${shY - 7} ${tw * 0.9} ${shY + 2} Z`, shade(O.top, -0.12), o);
    // 腿
    const shoe = (x) => E_(x, -1.6, lw * 0.72, 2.6, O.shoe, o);
    if (O.legs === 'gown') {
      s += P_(`M ${-bw} ${waistY - 2} Q ${-torW * 0.9} ${-6} ${-torW * 0.95} 0 L ${torW * 0.95} 0 Q ${torW * 0.9} ${-6} ${bw} ${waistY - 2} Z`, O.bottom, o);
    } else {
      for (const sx of [-1, 1]) {
        const x = sx * lx - lw / 2;
        const legColor = O.legs === 'pants' ? O.bottom : skin;
        s += R_(x, waistY - 1, lw, legL - 1, legColor, lw * 0.45, o);
        if (O.legs === 'shorts') s += R_(x - 0.6, waistY - 1, lw + 1.2, legL * 0.42, O.bottom, 2.5, o);
        if (O.legs === 'skirt' || O.legs === 'shorts') s += R_(x + 0.4, -legL * 0.32, lw - 0.8, legL * 0.28, '#ffffff', 1.5);
        s += shoe(sx * lx);
      }
      if (O.legs === 'skirt') {
        const sb = waistY + legL * 0.55;
        s += P_(`M ${-bw} ${waistY - 2} L ${bw} ${waistY - 2} L ${torW * 0.62} ${sb} Q 0 ${sb + 2} ${-torW * 0.62} ${sb} Z`, O.bottom, o);
        if (O.plaid) s += P_(`M ${-torW * 0.3} ${waistY} L ${-torW * 0.36} ${sb} M ${torW * 0.3} ${waistY} L ${torW * 0.36} ${sb} M ${-bw} ${waistY + legL * 0.3} L ${bw * 1.25} ${waistY + legL * 0.3}`, 'none', `stroke="${shade(O.bottom, 0.3)}" stroke-width="1.2"`);
      }
    }
    // 手臂（在身體後面的部分）
    const armAng = { idle: [9, -9], wave: [9, -138], cheer: [138, -138], hips: [30, -30] }[pose] || [9, -9];
    const arm = (side) => {
      const ang = side < 0 ? armAng[0] : armAng[1];
      const x0 = side * (tw - aw * 0.15), y0 = shY + 2.5;
      const sl = O.sleeve === 'long' ? armL : O.sleeve === 'none' ? 0 : armL * 0.42;
      let g = `<g transform="rotate(${ang} ${f1(x0)} ${f1(y0)})">`;
      g += R_(x0 - aw / 2, y0, aw, armL, skin, aw / 2, o);
      if (sl) g += R_(x0 - aw / 2 - 0.4, y0 - 0.5, aw + 0.8, sl + 0.5, O.ex.includes('labcoat') ? '#ffffff' : O.ex.includes('cardigan') ? O.top : O.ex.includes('lapel') ? O.top : O.top, aw / 2, o);
      g += C_(x0, y0 + armL, aw * 0.58, skin, o);
      return g + '</g>';
    };
    const upL = pose === 'cheer', upR = pose === 'wave' || pose === 'cheer';
    const raised = upR;
    if (!upL) s += arm(-1);
    if (!upR) s += arm(1);
    // 身體
    const torso = `M ${-tw} ${shY + 6} Q ${-tw} ${shY} ${-tw + 6} ${shY} L ${tw - 6} ${shY} Q ${tw} ${shY} ${tw} ${shY + 6} L ${bw} ${waistY + 1} L ${-bw} ${waistY + 1} Z`;
    s += P_(torso, O.inner && (O.ex.includes('labcoat') || O.ex.includes('cardigan') || O.ex.includes('lapel')) ? O.inner : O.top, o);
    const ex = O.ex;
    if (ex.includes('labcoat') || ex.includes('cardigan') || ex.includes('lapel')) {
      const cc = O.top;
      s += P_(`M ${-tw} ${shY + 6} Q ${-tw} ${shY} ${-tw + 6} ${shY} L ${-2.5} ${shY} L ${-1} ${waistY + (ex.includes('labcoat') ? 6 : 1)} L ${-bw - (ex.includes('labcoat') ? 1.5 : 0)} ${waistY + (ex.includes('labcoat') ? 6 : 1)} Z`, cc, o);
      s += P_(`M ${tw} ${shY + 6} Q ${tw} ${shY} ${tw - 6} ${shY} L ${2.5} ${shY} L ${1} ${waistY + (ex.includes('labcoat') ? 6 : 1)} L ${bw + (ex.includes('labcoat') ? 1.5 : 0)} ${waistY + (ex.includes('labcoat') ? 6 : 1)} Z`, cc, o);
      if (ex.includes('lapel')) s += P_(`M -2.5 ${shY} L ${-tw * 0.45} ${shY + torL * 0.38} L -1 ${shY + torL * 0.55} M 2.5 ${shY} L ${tw * 0.45} ${shY + torL * 0.38} L 1 ${shY + torL * 0.55}`, 'none', `stroke="${shade(cc, -0.3)}" stroke-width="1.3"`);
    }
    if (ex.includes('collar')) s += P_(`M -5 ${shY} L 0 ${shY + 4.5} L 5 ${shY} L 3 ${shY - 1} L 0 ${shY + 2} L -3 ${shY - 1} Z`, '#ffffff', o);
    if (ex.includes('collarRound')) s += E_(0, shY + 1, 5.5, 2.6, '#ffffff', o);
    if (ex.includes('tie')) s += P_(`M -1.6 ${shY + 3} L 1.6 ${shY + 3} L 2.2 ${shY + torL * 0.62} L 0 ${shY + torL * 0.72} L -2.2 ${shY + torL * 0.62} Z`, O.tieC || '#c84b4b', o);
    if (ex.includes('bow')) s += P_(`M 0 ${shY + 4} L -5 ${shY + 1.5} L -5 ${shY + 6.5} Z M 0 ${shY + 4} L 5 ${shY + 1.5} L 5 ${shY + 6.5} Z`, O.tieC || '#c84b4b', o);
    if (ex.includes('bowtie')) s += P_(`M 0 ${shY + 3} L -4.5 ${shY + 1} L -4.5 ${shY + 5} Z M 0 ${shY + 3} L 4.5 ${shY + 1} L 4.5 ${shY + 5} Z`, '#1f1b1a', o);
    if (ex.includes('badge')) s += R_(-tw + 4, shY + torL * 0.3, 4.5, 3, '#e8655a', 1);
    if (ex.includes('nametag')) s += R_(-tw + 3.5, shY + torL * 0.32, 6, 4, '#ffffff', 1.2, `stroke="${OL}" stroke-width=".8"`) + R_(-tw + 4.5, shY + torL * 0.32 + 1.3, 4, 1.2, '#f07a8a', .5);
    if (ex.includes('buttons') || ex.includes('buttonsLine')) for (let i = 0; i < 3; i++) s += C_(0, shY + 5 + i * (torL - 8) / 2.5, 0.9, shade(O.top, -0.35));
    if (ex.includes('buttons2')) for (let i = 0; i < 3; i++) { s += C_(-2.5, shY + 5 + i * 4.5, 0.9, '#9a9aa5'); s += C_(2.5, shY + 5 + i * 4.5, 0.9, '#9a9aa5'); }
    if (ex.includes('pocket')) s += R_(-torW * 0.22, shY + torL * 0.55, torW * 0.44, torL * 0.25, shade(O.top, -0.08), 2, `stroke="${shade(O.top, -0.3)}" stroke-width="1"`);
    if (ex.includes('pocketLine')) s += R_(tw - 7, shY + 5, 4.5, 3.5, 'none', .5, `stroke="#c9c9d6" stroke-width="1"`);
    if (ex.includes('stripe')) s += R_(-bw - 0.3, shY + torL * 0.45, bw * 2 + 0.6, 3, shade(O.top, -0.2), 0);
    if (ex.includes('camo')) for (const [x, y, r] of [[-6, 6, 2.6], [5, 9, 2.2], [-2, 13, 2], [7, 15, 1.8], [-8, 16, 1.6]]) s += E_(x * torW / 21, shY + y * torL / 18, r * 1.3, r, '#4e5a36', 'opacity=".75"');
    if (ex.includes('belt')) s += R_(-bw - 0.5, waistY - 2, bw * 2 + 1, 2.6, '#3c3a2e', 0.8) + R_(-1.6, waistY - 2.2, 3.2, 3, '#d9c27a', 0.6);
    if (ex.includes('vest')) s += P_(`M ${-tw + 1} ${shY + 3} L -3 ${shY + 3} L -2 ${waistY + 1} L ${-bw} ${waistY + 1} Z M ${tw - 1} ${shY + 3} L 3 ${shY + 3} L 2 ${waistY + 1} L ${bw} ${waistY + 1} Z`, O.vestC, o) + R_(-tw + 3, shY + torL * 0.45, tw - 5, 1.6, '#f7e36a', 0.5) + R_(3, shY + torL * 0.45, tw - 5, 1.6, '#f7e36a', 0.5);
    if (ex.includes('vneck')) s += P_(`M -4 ${shY} L 0 ${shY + 5} L 4 ${shY}`, 'none', `stroke="${shade(O.top, -0.35)}" stroke-width="1.3"`);
    if (ex.includes('stetho')) s += P_(`M -4 ${shY + 1} Q -5 ${shY + torL * 0.5} 0 ${shY + torL * 0.55} Q 5 ${shY + torL * 0.5} 4 ${shY + 1}`, 'none', 'stroke="#4a5568" stroke-width="1.3"') + C_(0, shY + torL * 0.6, 1.8, '#9aa6b8', 'stroke="#4a5568" stroke-width="1"');
    if (ex.includes('apron')) s += P_(`M ${-bw * 0.9} ${shY + torL * 0.25} L ${bw * 0.9} ${shY + torL * 0.25} L ${bw * 1.05} ${waistY + legL * 0.45} Q 0 ${waistY + legL * 0.5} ${-bw * 1.05} ${waistY + legL * 0.45} Z`, O.apronC, o) + P_(`M ${-bw * 0.9} ${shY + torL * 0.25} L ${-tw * 0.5} ${shY} M ${bw * 0.9} ${shY + torL * 0.25} L ${tw * 0.5} ${shY}`, 'none', `stroke="${O.apronC}" stroke-width="1.6"`);
    if (ex.includes('zip')) s += P_(`M 0 ${shY + 1} L 0 ${waistY}`, 'none', `stroke="${shade(O.top, -0.35)}" stroke-width="1.2"`);
    if (ex.includes('reflect')) s += R_(-bw - 0.5, shY + torL * 0.6, bw * 2 + 1, 2.2, '#e8eef2', 0.5);
    if (ex.includes('bunny')) s += R_(-tw + 2, shY + 2, torW - 4, 1.5, '#cfd8e6', 0.5);
    if (ex.includes('necklace')) s += P_(`M -5 ${shY + 1} Q 0 ${shY + 6} 5 ${shY + 1}`, 'none', 'stroke="#f5d06b" stroke-width="1.2"') + C_(0, shY + 4.6, 1.2, '#f5d06b');
    if (O.legs === 'gown') s += P_(`M ${-tw} ${shY + 6} Q 0 ${shY + 10} ${tw} ${shY + 6}`, 'none', 'stroke="#f0e6f2" stroke-width="1.2"');
    // 耳朵、頭
    s += C_(-rx * 0.98, cy + R * 0.15, R * 0.2, skin, o) + C_(rx * 0.98, cy + R * 0.15, R * 0.2, skin, o);
    if (O.ex.includes('bunny')) {
      s += E_(0, cy, rx * 1.18, R * 1.12, '#f3f6fb', o);
      s += E_(0, cy + R * 0.18, rx * 0.86, R * 0.62, skin, o);
      s += R_(-rx * 0.62, cy + R * 0.42, rx * 1.24, R * 0.42, '#dfe8f3', R * 0.2, o);
      s += face('happy' === p.mood ? 'happy' : 'normal', R, cy, false).replace(/<path[^>]*c4545a[^>]*\/>/, '');
    } else {
      s += E_(0, cy, rx, R * 0.98, skin, o);
      s += face(p.mood || 'normal', R, cy, p.glasses);
      if (p.age >= 58) {
        const wo = clamp((p.age - 55) / 30, 0.25, 0.75), ey = cy + R * 0.2, ex = R * 0.42, my = cy + R * 0.55;
        const ws = `stroke="${shade(skin, -0.32)}" stroke-width="1" stroke-linecap="round" fill="none" opacity="${f1(wo)}"`;
        s += P_(`M ${f1(-ex - R * 0.26)} ${f1(ey - R * 0.05)} l ${f1(-R * 0.1)} ${f1(-R * 0.05)} M ${f1(-ex - R * 0.26)} ${f1(ey + R * 0.04)} l ${f1(-R * 0.1)} ${f1(R * 0.04)}`, 'none', ws);
        s += P_(`M ${f1(ex + R * 0.26)} ${f1(ey - R * 0.05)} l ${f1(R * 0.1)} ${f1(-R * 0.05)} M ${f1(ex + R * 0.26)} ${f1(ey + R * 0.04)} l ${f1(R * 0.1)} ${f1(R * 0.04)}`, 'none', ws);
        if (p.age >= 68) s += P_(`M ${f1(-R * 0.3)} ${f1(my - R * 0.22)} q ${f1(-R * 0.06)} ${f1(R * 0.14)} ${f1(R * 0.02)} ${f1(R * 0.24)} M ${f1(R * 0.3)} ${f1(my - R * 0.22)} q ${f1(R * 0.06)} ${f1(R * 0.14)} ${f1(-R * 0.02)} ${f1(R * 0.24)}`, 'none', ws);
      }
      if (hs !== 'none') s += hairFront(hs, R, cy, rx, hc);
    }
    // 帽子
    if (ex.includes('chefhat')) s += P_(`M ${-rx * 0.62} ${cy - R * 0.7} Q ${-rx * 1.05} ${cy - R * 1.65} ${-rx * 0.3} ${cy - R * 1.55} Q 0 ${cy - R * 2.05} ${rx * 0.3} ${cy - R * 1.55} Q ${rx * 1.05} ${cy - R * 1.65} ${rx * 0.62} ${cy - R * 0.7} Z`, '#ffffff', o);
    if (ex.includes('workcap')) s += P_(`M ${-rx * 0.98} ${cy - R * 0.35} C ${-rx * 1.0} ${cy - R * 1.3} ${rx * 1.0} ${cy - R * 1.3} ${rx * 0.98} ${cy - R * 0.35} Z`, O.top, o) + P_(`M ${rx * 0.5} ${cy - R * 0.4} Q ${rx * 1.25} ${cy - R * 0.45} ${rx * 1.45} ${cy - R * 0.28} L ${rx * 0.6} ${cy - R * 0.32} Z`, shade(O.top, -0.2), o);
    if (p.hat === 'kinder') s += P_(`M ${-rx * 1.0} ${cy - R * 0.4} C ${-rx * 1.0} ${cy - R * 1.35} ${rx * 1.0} ${cy - R * 1.35} ${rx * 1.0} ${cy - R * 0.4} Z`, '#ffd34d', o) + E_(0, cy - R * 0.38, rx * 1.25, R * 0.16, '#ffd34d', o);
    if (p.hat === 'army') s += P_(`M ${-rx * 0.95} ${cy - R * 0.45} C ${-rx * 0.98} ${cy - R * 1.28} ${rx * 0.98} ${cy - R * 1.28} ${rx * 0.95} ${cy - R * 0.45} Z`, '#5f6c40', o) + P_(`M ${-rx * 1.05} ${cy - R * 0.45} L ${rx * 1.05} ${cy - R * 0.45} L ${rx * 0.9} ${cy - R * 0.32} L ${-rx * 0.9} ${cy - R * 0.32} Z`, '#4e5a36', o);
    if (p.hat === 'grad') s += P_(`M ${-rx * 1.2} ${cy - R * 1.0} L 0 ${cy - R * 1.35} L ${rx * 1.2} ${cy - R * 1.0} L 0 ${cy - R * 0.68} Z`, '#2b2b36', o) + P_(`M ${rx * 0.9} ${cy - R * 1.05} L ${rx * 1.0} ${cy - R * 0.45}`, 'none', 'stroke="#f5c24b" stroke-width="1.6"');
    if (upL) s += arm(-1);
    if (upR) s += arm(1);
    if (p.cane && !upR) {
      const hx = tw - aw * 0.15 + armL * 0.156, hy = shY + 2.5 + armL * 0.988;
      s += P_(`M ${f1(hx + 1.5)} ${f1(hy - 1)} L ${f1(hx + 4)} 0`, 'none', 'stroke="#8a5a3c" stroke-width="2.2" stroke-linecap="round"') + P_(`M ${f1(hx + 1.5)} ${f1(hy - 1)} q -1 -4 -5 -2.5`, 'none', 'stroke="#8a5a3c" stroke-width="2.2" stroke-linecap="round"') + C_(hx, hy, aw * 0.58, skin, o);
    }
    if (p.bag && !raised) s += P_(`M ${-tw + 2} ${shY + 1} L ${-tw * 0.3} ${waistY}`, 'none', `stroke="${p.bag}" stroke-width="2.4" stroke-linecap="round"`);
    return `<g>${s}</g>`;
  };
  Art.headTop = function (p) {
    if (p.age < 1.3) return -48;
    const G = geo(p.age, p.g, p.bmi);
    return -(G.legL + G.torL + G.R * 0.72 + G.R * 1.25);
  };

  function baby(p) {
    const R = 15, o = ol();
    const skin = p.skin || Art.SKINS[1];
    const c = (p.cols && p.cols.top) || '#bfe3f2';
    const cy = -34;
    let s = E_(0, 1, 16, 3, '#000', 'opacity=".12"');
    s += E_(-8, -4, 6.5, 4.8, c, o) + E_(8, -4, 6.5, 4.8, c, o);
    s += E_(-12, -3.5, 3.4, 3.4, skin, o) + E_(12, -3.5, 3.4, 3.4, skin, o);
    s += E_(0, -12, 13, 11, c, o);
    s += C_(0, -12, 1, shade(c, -0.35)) + C_(0, -8, 1, shade(c, -0.35));
    s += E_(-12, -14, 4, 6, c, o) + E_(12, -14, 4, 6, c, o);
    s += C_(-13, -9, 3.2, skin, o) + C_(13, -9, 3.2, skin, o);
    s += C_(-R * 1.0, cy + 2, 3, skin, o) + C_(R * 1.0, cy + 2, 3, skin, o);
    s += E_(0, cy, R * 1.05, R * 0.98, skin, o);
    s += face(p.mood || 'normal', R, cy, false);
    s += hairFront('tuft', R, cy, R * 1.05, p.hairC || '#3a2b28');
    return `<g>${s}</g>`;
  }

  /* ---------------- 寵物 ---------------- */
  Art.pet = function (kind, col, mood) {
    const o = ol();
    const c = col || '#d9a46a', d = shade(c, -0.25);
    let s = E_(0, 1, 14, 2.6, '#000', 'opacity=".12"');
    if (kind === '貓') {
      s += P_(`M 10 -8 Q 22 -14 18 -26`, 'none', `stroke="${OL}" stroke-width="5" stroke-linecap="round"`) + P_(`M 10 -8 Q 22 -14 18 -26`, 'none', `stroke="${c}" stroke-width="3" stroke-linecap="round"`);
      s += E_(2, -8, 12, 7.5, c, o);
      for (const x of [-6, -1, 6, 10]) s += R_(x - 1.8, -5, 3.6, 5, c, 1.5, o);
      s += P_(`M -15 -18 L -14 -28 L -8 -21 Z M -3 -21 L 2 -28 L 3 -18 Z`, c, o);
      s += C_(-6, -16, 9, c, o);
      s += E_(-9.5, -16, 1.2, 1.7, EYE) + E_(-3, -16, 1.2, 1.7, EYE) + P_(`M -7.6 -12.8 l 1.3 1 l 1.3 -1`, 'none', `stroke="${EYE}" stroke-width="1.1"`);
      s += P_(`M -15 -13 l -5 -1 M -15 -12 l -5 1 M 3 -13 l 5 -1 M 3 -12 l 5 1`, 'none', 'stroke="#8a7a70" stroke-width=".7"');
    } else {
      s += P_(`M 11 -11 Q 18 -16 16 -22`, 'none', `stroke="${OL}" stroke-width="4.6" stroke-linecap="round"`) + P_(`M 11 -11 Q 18 -16 16 -22`, 'none', `stroke="${c}" stroke-width="2.8" stroke-linecap="round"`);
      s += E_(2, -9, 13, 8, c, o);
      for (const x of [-7, -2, 6, 11]) s += R_(x - 2, -5, 4, 5.5, c, 1.8, o);
      s += C_(-8, -17, 9, c, o);
      s += E_(-15.5, -16, 3.2, 6, d, o) + E_(-0.5, -16, 3.2, 6, d, o);
      s += E_(-9, -13, 4.5, 3.4, shade(c, 0.45), o) + E_(-9, -14.3, 1.6, 1.1, EYE);
      s += C_(-12, -19, 1.3, EYE) + C_(-5, -19, 1.3, EYE);
      if (mood === 'happy') s += P_(`M -10.5 -11.2 Q -9 -8.5 -7.5 -11.2 Z`, '#f08a8a', 'stroke="#5b4636" stroke-width=".8"');
    }
    return `<g>${s}</g>`;
  };

  /* ---------------- 表情泡泡 ---------------- */
  Art.emote = function (kind) {
    const icon = {
      heart: P_('M 0 5 C -9 -1 -6 -9 0 -4 C 6 -9 9 -1 0 5 Z', '#ff6b8b'),
      note: T_(0, 5, '♪', 15, '#7a5cff'),
      sparkle: P_('M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z', '#ffc23d'),
      drop: P_('M 0 -7 Q 6 1 0 6 Q -6 1 0 -7 Z', '#7cc6f2'),
      sweat: P_('M 2 -7 Q 8 1 2 6 Q -4 1 2 -7 Z', '#9fd6f5') + P_('M -6 -2 Q -3 3 -6 5 Q -9 3 -6 -2 Z', '#9fd6f5'),
      bang: T_(0, 6, '!', 17, '#ff6b5a'),
      ask: T_(0, 6, '?', 17, '#5a8bff'),
      zzz: T_(0, 5, 'z<tspan font-size="10">z</tspan>', 14, '#7a6fa8'),
      anger: P_('M -6 -6 L -2 -2 M 6 -6 L 2 -2 M -6 6 L -2 2 M 6 6 L 2 2', 'none', 'stroke="#ff5a5a" stroke-width="2.6" stroke-linecap="round"')
    }[kind];
    if (!icon) return '';
    return `<g class="emote">${E_(0, 0, 13, 12, '#ffffff', 'stroke="#e7dccf" stroke-width="1.5"')}${P_('M -4 10 L -7 17 L 2 11 Z', '#ffffff', 'stroke="#e7dccf" stroke-width="1.2"')}${E_(0, 0, 12, 11, '#ffffff')}${icon}</g>`;
  };

  /* ================================================================
   * 場景
   * ================================================================ */
  function skyCol(m, night) {
    if (night) return ['#28305a', '#3d4778'];
    if (m === 12 || m <= 2) return ['#cfe3f0', '#eef5f8'];
    if (m <= 5) return ['#a9dcf2', '#e2f4fb'];
    if (m <= 8) return ['#8fd2f4', '#d8f1fc'];
    return ['#b8dbec', '#f3efe3'];
  }
  function skyRect(ctx, h = 214) {
    const [a, b] = skyCol(ctx.month, ctx.night);
    const id = 'sky' + (++uid);
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` + R_(0, 0, W, h, `url(#${id})`);
  }
  const cloud = (x, y, s = 1, op = 0.95) => `<g opacity="${op}">${E_(x, y, 18 * s, 8 * s, '#fff')}${E_(x - 12 * s, y + 2 * s, 11 * s, 6 * s, '#fff')}${E_(x + 13 * s, y + 2 * s, 12 * s, 6.5 * s, '#fff')}${E_(x + 2 * s, y - 5 * s, 10 * s, 7 * s, '#fff')}</g>`;
  const sun = (x, y) => C_(x, y, 16, '#ffe07a', 'opacity=".55"') + C_(x, y, 11, '#ffd34d');
  const tree = (x, y, s = 1, c = '#8cc9a0') => R_(x - 3 * s, y - 22 * s, 6 * s, 22 * s, '#a07656', 2 * s) + C_(x, y - 34 * s, 18 * s, c) + C_(x - 13 * s, y - 25 * s, 12 * s, shade(c, -0.06)) + C_(x + 13 * s, y - 26 * s, 13 * s, shade(c, 0.06)) + C_(x - 5 * s, y - 40 * s, 6 * s, shade(c, 0.25), 'opacity=".6"');
  const pine = (x, y, s = 1, c = '#5f9e7a') => R_(x - 2 * s, y - 8 * s, 4 * s, 8 * s, '#8a6a50') + P_(`M ${x} ${y - 46 * s} L ${x + 14 * s} ${y - 8 * s} L ${x - 14 * s} ${y - 8 * s} Z`, c) + P_(`M ${x} ${y - 46 * s} L ${x + 9 * s} ${y - 24 * s} L ${x - 9 * s} ${y - 24 * s} Z`, shade(c, 0.15));
  const palm = (x, y, s = 1) => P_(`M ${x} ${y} Q ${x + 4 * s} ${y - 35 * s} ${x - 2 * s} ${y - 70 * s}`, 'none', `stroke="#a98463" stroke-width="${5 * s}" stroke-linecap="round"`) + [[-1, -0.3], [1, -0.2], [-0.8, 0.3], [0.9, 0.35], [0, -0.6]].map(([dx, dy]) => P_(`M ${x - 2 * s} ${y - 70 * s} Q ${x + dx * 22 * s} ${y - (78 + dy * 20) * s} ${x + dx * 34 * s} ${y - (64 + dy * 22) * s}`, 'none', `stroke="#6fb07e" stroke-width="${5 * s}" stroke-linecap="round"`)).join('');
  const plant = (x, y, s = 1) => R_(x - 8 * s, y - 14 * s, 16 * s, 14 * s, '#d98c64', 3 * s) + E_(x, y - 22 * s, 6 * s, 12 * s, '#7cbf8e') + E_(x - 8 * s, y - 20 * s, 5 * s, 9 * s, '#6aae7f', `transform="rotate(-30 ${x - 8 * s} ${y - 20 * s})"`) + E_(x + 8 * s, y - 20 * s, 5 * s, 9 * s, '#8fd0a0', `transform="rotate(30 ${x + 8 * s} ${y - 20 * s})"`);
  function windowBox(x, y, w, h, ctx, curtain) {
    let s = R_(x - 4, y - 4, w + 8, h + 8, '#ffffff', 6);
    const [a, b] = skyCol(ctx.month, ctx.night);
    s += R_(x, y, w, h, a, 3) + R_(x, y + h * 0.55, w, h * 0.45, b, 0);
    if (!ctx.night) s += cloud(x + w * 0.35, y + h * 0.35, w / 110);
    else s += C_(x + w * 0.7, y + h * 0.3, 6, '#fff6c9');
    s += C_(x + w * 0.2, y + h * 0.95, h * 0.3, '#9fd3a9', 'opacity=".9"') + C_(x + w * 0.85, y + h, h * 0.35, '#8cc9a0', 'opacity=".9"');
    s += R_(x + w / 2 - 1.5, y, 3, h, '#ffffff') + R_(x, y + h / 2 - 1.5, w, 3, '#ffffff');
    if (curtain) s += P_(`M ${x - 8} ${y - 6} L ${x + w * 0.22} ${y - 6} Q ${x + w * 0.12} ${y + h * 0.6} ${x - 2} ${y + h + 6} L ${x - 8} ${y + h + 6} Z`, curtain) + P_(`M ${x + w + 8} ${y - 6} L ${x + w * 0.78} ${y - 6} Q ${x + w * 0.88} ${y + h * 0.6} ${x + w + 2} ${y + h + 6} L ${x + w + 8} ${y + h + 6} Z`, curtain) + R_(x - 12, y - 10, w + 24, 4, shade(curtain, -0.2), 2);
    return s;
  }
  function room(wall, floor, ctx, opt = {}) {
    let s = R_(0, 0, W, 172, wall);
    if (opt.dots) for (let y = 14; y < 165; y += 22) for (let x = (y / 22) % 2 ? 8 : 20; x < W; x += 24) s += C_(x, y, 1.6, shade(wall, -0.06));
    if (opt.stripes) for (let x = 0; x < W; x += 26) s += R_(x, 0, 13, 172, shade(wall, -0.03));
    s += R_(0, 150, W, 22, opt.wain || shade(wall, -0.07)) + R_(0, 150, W, 2.5, shade(wall, -0.16));
    s += R_(0, 172, W, 68, floor);
    for (let y = 182; y < 240; y += 14) s += R_(0, y, W, 1.4, shade(floor, -0.1));
    for (let i = 0; i < 9; i++) s += R_((i * 53 + (i % 2) * 20) % W, 172 + (i % 4) * 14, 1.4, 14, shade(floor, -0.1));
    s += R_(0, 172, W, 3, shade(floor, -0.15));
    return s;
  }
  const frame = (x, y, w, h, inner) => R_(x, y, w, h, '#c99a6b', 3) + R_(x + 3, y + 3, w - 6, h - 6, inner || '#fff3dc', 2);
  const springCouplet = (x, y) => `<g transform="rotate(45 ${x} ${y})">${R_(x - 11, y - 11, 22, 22, '#d9443f', 1)}</g>` + T_(x, y + 5, '春', 13, '#f7d36b');
  function sofa(x, y, w, c) {
    return R_(x, y - 34, w, 24, shade(c, -0.08), 10) + R_(x - 6, y - 22, 16, 22, c, 7) + R_(x + w - 10, y - 22, 16, 22, c, 7) + R_(x + 6, y - 18, w - 12, 14, shade(c, 0.12), 6) + R_(x + 4, y - 4, 5, 6, '#8a6a50') + R_(x + w - 9, y - 4, 5, 6, '#8a6a50');
  }
  function tv(x, y, big) {
    const w = big ? 64 : 48, h = big ? 38 : 30;
    return R_(x - 4, y, w + 8, 26, '#c99a6b', 4) + R_(x + 6, y + 8, 14, 10, shade('#c99a6b', -0.12), 2) + R_(x, y - h - 6, w, h, '#3b3b4a', 4) + R_(x + 3, y - h - 3, w - 6, h - 6, '#5d7fa3', 2) + P_(`M ${x + 6} ${y - 12} L ${x + w * 0.45} ${y - h * 0.7} L ${x + w - 8} ${y - 14}`, 'none', 'stroke="#9fc3e6" stroke-width="3" opacity=".6"');
  }

  const SCENES = {
    home(ctx) {
      const w = ctx.wealth || 3;
      let s;
      if (ctx.hm === 'rent' || ctx.hm === 'dorm') return SCENES.studio(ctx);
      if (w <= 1) {
        s = room('#f3e4c8', '#d4ac80', ctx, { wain: '#e3cfa8' });
        s += windowBox(272, 34, 70, 56, ctx) + frame(60, 40, 40, 32, '#e9f0d8');
        s += R_(130, 56, 30, 38, '#ffffff', 2, 'stroke="#d4c3a3"') + R_(130, 56, 30, 8, '#e8655a', 2) + T_(145, 86, '15', 14, '#5b4636');
        s += R_(36, 148, 78, 8, '#b98b5e', 3) + R_(42, 156, 6, 18, '#9a7048') + R_(102, 156, 6, 18, '#9a7048');
        s += C_(332, 140, 14, '#e9eef0', 'stroke="#a9b4ba" stroke-width="2"') + R_(330, 154, 4, 18, '#a9b4ba') + E_(332, 174, 10, 3, '#a9b4ba');
        s += tv(196, 150, false);
      } else if (w <= 3) {
        s = room('#fde6d2', '#d9b28a', ctx, { dots: true });
        s += windowBox(280, 30, 82, 64, ctx, '#f6b7a3') + frame(40, 36, 46, 36, '#dfeefa') + frame(96, 46, 30, 26, '#fbe3ef');
        s += plant(370, 172, 1.1);
        s += sofa(42, 176, 110, '#8fb8d8');
        s += tv(196, 150, true);
      } else {
        s = room('#eef3e8', '#e2c49b', ctx, { stripes: true, wain: '#dfe8d6' });
        s += windowBox(222, 22, 150, 96, ctx, '#cfe1c7');
        s += P_('M 120 0 L 120 18', 'none', 'stroke="#c9a96e" stroke-width="2"') + E_(120, 26, 16, 9, '#f6e7b8') + C_(120, 34, 3, '#ffe9a8');
        s += E_(130, 204, 92, 14, '#f3d9c6', 'opacity=".9"');
        s += sofa(40, 178, 150, '#e9d3b6') + plant(30, 172, 1.4) + plant(382, 172, 1.2);
        s += frame(64, 54, 50, 38, '#fbe9dd');
      }
      if (ctx.month === 2) s += springCouplet(178, 46);
      return s;
    },
    studio(ctx) {
      let s = room('#e6edf5', '#cfae8b', ctx, { wain: '#d8e2ee' });
      s += windowBox(160, 36, 70, 56, ctx, '#a9c7e8');
      if (ctx.hm === 'dorm') {
        s += R_(28, 40, 110, 8, '#8a9bb3', 3) + R_(28, 100, 110, 8, '#8a9bb3', 3) + R_(28, 40, 6, 132, '#7a8aa3') + R_(132, 40, 6, 132, '#7a8aa3');
        s += R_(34, 30, 98, 12, '#f2b5d4', 4) + R_(34, 90, 98, 12, '#a8d8b9', 4) + E_(46, 86, 10, 5, '#ffffff');
        s += R_(26, 108, 116, 64, '#dfe6ef', 2) + R_(36, 118, 40, 30, '#c9b48a', 2);
      } else {
        s += R_(24, 132, 120, 40, '#f4f1ea', 6, 'stroke="#c9c2b6"') + R_(24, 122, 30, 30, '#ffffff', 8, 'stroke="#c9c2b6"') + R_(56, 126, 88, 30, '#a8c8e8', 8);
        s += R_(250, 128, 100, 6, '#b48b62', 2) + R_(254, 134, 5, 38, '#9a7048') + R_(342, 134, 5, 38, '#9a7048');
        s += R_(272, 104, 40, 26, '#3b3b4a', 3) + R_(275, 107, 34, 20, '#bcd8f2', 2) + R_(266, 128, 52, 3, '#8a8a98', 1);
        s += P_('M 330 128 L 336 98 L 344 92', 'none', 'stroke="#6d6d78" stroke-width="2.4"') + P_('M 336 88 L 352 94 L 346 102 Z', '#ffd27a');
        s += plant(372, 172, 0.9);
      }
      return s;
    },
    nursery(ctx) {
      let s = room('#fdeef3', '#e6c8a8', ctx, { dots: true, wain: '#f9dde6' });
      s += windowBox(276, 34, 70, 56, ctx, '#bfe3f2');
      s += P_('M 90 0 L 90 24', 'none', 'stroke="#c9a96e" stroke-width="1.5"') + [['#ffd27a', -18], ['#9cc5f0', 0], ['#f4a6a6', 18]].map(([c, dx]) => P_(`M ${90 + dx} 24 L ${90 + dx} 36`, 'none', 'stroke="#c9a96e" stroke-width="1"') + P_(`M ${90 + dx} 36 l 4 8 l -8 0 Z`, c)).join('') + R_(68, 22, 44, 3, '#c9a96e', 1);
      s += R_(40, 110, 110, 60, 'none', 4, 'stroke="#d9a77a" stroke-width="3"');
      for (let x = 50; x < 150; x += 12) s += R_(x, 110, 3, 60, '#e6b88c');
      s += R_(36, 104, 118, 8, '#d9a77a', 4) + R_(44, 152, 102, 14, '#ffffff', 3);
      s += E_(220, 204, 70, 12, '#d9eef7') + C_(200, 196, 1.6, '#ffffff') + C_(240, 200, 1.6, '#ffffff');
      s += R_(330, 182, 14, 14, '#f4a6a6', 2) + R_(346, 186, 12, 12, '#9cc5f0', 2) + R_(336, 170, 12, 12, '#ffd27a', 2);
      return s;
    },
    kinder(ctx) {
      let s = room('#fff3d6', '#e7c79f', ctx, { wain: '#fde3b2' });
      const arc = (r, c) => P_(`M ${200 - r} 74 A ${r} ${r} 0 0 1 ${200 + r} 74`, 'none', `stroke="${c}" stroke-width="7"`);
      s += arc(44, '#f4a6a6') + arc(37, '#ffd27a') + arc(30, '#a8d8b9') + arc(23, '#9cc5f0') + cloud(160, 76, 0.6) + cloud(240, 76, 0.6);
      ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ'].forEach((t, i) => { s += R_(24 + i * 26, 22, 22, 22, ['#f4a6a6', '#9cc5f0', '#a8d8b9', '#c9b6f2'][i], 4) + T_(35 + i * 26, 39, t, 14, '#5b4636'); });
      s += windowBox(300, 36, 70, 52, ctx);
      for (let i = 0; i < 4; i++) s += R_(24 + i * 30, 112, 26, 26, '#ffffff', 3, 'stroke="#e1c39b"') + C_(37 + i * 30, 126, 6, ['#f4a6a6', '#ffd27a', '#9cc5f0', '#a8d8b9'][i]);
      s += R_(20, 106, 126, 66, 'none', 3, 'stroke="#d9a77a" stroke-width="3"');
      s += R_(300, 176, 70, 8, '#f6c37a', 4) + R_(304, 184, 5, 14, '#d9a066') + R_(360, 184, 5, 14, '#d9a066');
      return s;
    },
    classroom(ctx) {
      let s = room('#f4eedf', '#d8b68e', ctx, { wain: '#e7dcc4' });
      s += R_(52, 30, 190, 104, '#b48b62', 5) + R_(58, 36, 178, 92, '#3f6b55', 3);
      const cd = ctx.countdown;
      if (cd) s += T_(147, 76, cd, 15, '#f4f1e6') + T_(147, 104, '加油！', 14, '#ffe08a');
      else s += T_(147, 70, (ctx.month || 9) + ' 月 ' + (ctx.day || 15) + ' 日', 13, '#f4f1e6') + T_(147, 96, '值日生：' + (ctx.duty || '1 號'), 12, '#f4f1e6') + P_('M 80 116 q 30 -6 60 0', 'none', 'stroke="#f4f1e6" stroke-width="1.5" opacity=".6"');
      s += R_(58, 128, 178, 5, '#c9a679');
      s += C_(282, 44, 14, '#ffffff', 'stroke="#b48b62" stroke-width="2.5"') + P_('M 282 44 L 282 36 M 282 44 L 288 46', 'none', 'stroke="#5b4636" stroke-width="1.6" stroke-linecap="round"');
      s += windowBox(306, 32, 72, 92, ctx);
      s += R_(10, 46, 30, 40, '#ffffff', 2, 'stroke="#e1d3b6"') + R_(14, 52, 22, 3, '#c9b48a') + R_(14, 58, 18, 3, '#c9b48a') + R_(14, 64, 20, 3, '#c9b48a');
      const desk = (x, y, sc) => R_(x, y - 30 * sc, 70 * sc, 9 * sc, '#c9a679', 3) + R_(x + 6 * sc, y - 21 * sc, 5 * sc, 21 * sc, '#8a8a98') + R_(x + 59 * sc, y - 21 * sc, 5 * sc, 21 * sc, '#8a8a98') + R_(x + 2 * sc, y - 27 * sc, 66 * sc, 3, shade('#c9a679', 0.2), 1);
      s += desk(16, 196, 0.9) + desk(326, 196, 0.9);
      return s;
    },
    campus(ctx) {
      let s = skyRect(ctx);
      s += cloud(70, 40, 1) + cloud(320, 30, 0.8) + (ctx.month >= 5 && ctx.month <= 8 ? sun(360, 40) : '');
      s += R_(110, 70, 180, 110, '#c9775c', 4) + R_(110, 70, 180, 10, '#a85e47', 2) + R_(186, 36, 28, 40, '#c9775c', 2) + P_('M 182 38 L 200 18 L 218 38 Z', '#7a5a8a') + C_(200, 54, 8, '#fff7e6', 'stroke="#a85e47" stroke-width="2"');
      for (let i = 0; i < 5; i++) s += P_(`M ${122 + i * 34} 174 L ${122 + i * 34} 118 Q ${136 + i * 34} 100 ${150 + i * 34} 118 L ${150 + i * 34} 174 Z`, '#f2e4cf', 'opacity=".95"');
      for (let i = 0; i < 6; i++) s += R_(120 + i * 29, 86, 14, 16, '#bfe0f0', 2);
      s += R_(0, 172, W, 68, '#9fd39a') + P_('M 150 240 L 175 172 L 225 172 L 250 240 Z', '#e9dcc0');
      s += palm(70, 200, 1.05) + palm(330, 200, 1.05) + palm(30, 190, 0.8) + palm(370, 192, 0.85);
      s += [[110, 196], [290, 198]].map(([x, y]) => C_(x - 8, y, 6, 'none', 'stroke="#5b6b7b" stroke-width="2"') + C_(x + 8, y, 6, 'none', 'stroke="#5b6b7b" stroke-width="2"') + P_(`M ${x - 8} ${y} L ${x} ${y - 8} L ${x + 8} ${y} M ${x} ${y - 8} L ${x + 2} ${y - 12}`, 'none', 'stroke="#e8655a" stroke-width="2"')).join('');
      return s;
    },
    office(ctx) {
      let s = room('#eef1f4', '#b9c2cc', ctx, { wain: '#e1e6ec' });
      s += R_(150, 24, 220, 108, '#ffffff', 4);
      const [a] = skyCol(ctx.month, ctx.night);
      s += R_(156, 30, 208, 96, a, 2);
      [[160, 70, 26], [190, 50, 30], [224, 64, 22], [250, 40, 34], [288, 58, 26], [318, 46, 22], [342, 66, 20]].forEach(([x, y, w]) => { s += R_(x, y, w, 126 - y, '#b7c7d9'); for (let yy = y + 6; yy < 120; yy += 10) for (let xx = x + 4; xx < x + w - 4; xx += 8) s += R_(xx, yy, 4, 5, '#e3edf7'); });
      s += R_(255, 30, 4, 96, '#ffffff');
      s += R_(26, 40, 96, 64, '#ffffff', 3, 'stroke="#c6ced8" stroke-width="2"') + [['#ffd27a', 36, 50], ['#f4a6a6', 60, 54], ['#a8d8b9', 86, 48], ['#9cc5f0', 44, 76], ['#c9b6f2', 74, 78]].map(([c, x, y]) => R_(x, y, 18, 16, c, 1)).join('');
      const desk = (x) => R_(x, 150, 88, 7, '#e3d2bb', 2) + R_(x + 4, 157, 5, 17, '#8a8a98') + R_(x + 79, 157, 5, 17, '#8a8a98') + R_(x + 22, 120, 42, 28, '#3b3b4a', 3) + R_(x + 25, 123, 36, 22, '#bcd8f2', 2) + R_(x + 40, 148, 6, 4, '#6d6d78') + C_(x + 76, 144, 5, '#ffffff', 'stroke="#c9b48a" stroke-width="1.5"');
      s += desk(10) + desk(302) + plant(282, 172, 1);
      for (const x of [80, 200, 320]) s += R_(x - 30, 0, 60, 5, '#ffffff') + R_(x - 26, 5, 52, 2, '#fff7d6');
      return s;
    },
    factory(ctx) {
      let s = room('#dfe5ea', '#b4bcc4', ctx, { wain: '#cfd6dd' });
      s += R_(0, 20, W, 8, '#a8b3bd') + R_(30, 0, 8, 20, '#a8b3bd') + R_(300, 0, 8, 20, '#a8b3bd') + R_(0, 34, W, 5, '#c0c9d1');
      const mach = (x, w, h, c) => R_(x, 172 - h, w, h, c, 5, 'stroke="#7e8a96" stroke-width="2"') + R_(x + 8, 172 - h + 10, w - 16, h * 0.32, '#2f3a46', 3) + R_(x + 12, 172 - h + 14, (w - 24) * 0.6, 4, '#7fe0b0') + C_(x + w - 16, 172 - h * 0.38, 4, '#ff6b5a') + C_(x + w - 28, 172 - h * 0.38, 4, '#ffd34d') + C_(x + w - 40, 172 - h * 0.38, 4, '#7fe0b0');
      s += mach(20, 96, 110, '#c9d3dc') + mach(286, 96, 96, '#d4dce4');
      s += R_(120, 140, 160, 10, '#6d7884', 4) + [140, 180, 220, 252].map(x => R_(x, 124, 20, 16, '#d9b48a', 2, 'stroke="#a8875f" stroke-width="1.5"')).join('');
      for (let x = 0; x < W; x += 20) s += P_(`M ${x} 172 l 10 0 l -6 6 l -10 0 Z`, '#f2c94c');
      s += R_(170, 52, 60, 34, '#2f7a54', 3) + T_(200, 74, '安全第一', 12, '#ffffff');
      return s;
    },
    hospital(ctx) {
      let s = room('#e4f3ef', '#cfd9d6', ctx, { wain: '#d3ebe4' });
      s += windowBox(40, 36, 76, 60, ctx, '#bfe3dc');
      s += R_(150, 26, 236, 4, '#a9b8b5') + P_('M 158 30 Q 168 90 156 150 L 176 150 Q 186 90 176 30 Z', '#9fd6c8', 'opacity=".9"');
      s += R_(290, 140, 92, 18, '#ffffff', 6, 'stroke="#b8c7c4" stroke-width="2"') + R_(290, 128, 22, 16, '#ffffff', 6, 'stroke="#b8c7c4" stroke-width="2"') + R_(310, 132, 72, 14, '#bfe3f2', 5) + R_(294, 158, 5, 16, '#a9b8b5') + R_(374, 158, 5, 16, '#a9b8b5');
      s += R_(250, 60, 3, 112, '#a9b8b5') + R_(240, 60, 22, 3, '#a9b8b5') + R_(244, 64, 12, 18, '#e6f4fb', 4, 'stroke="#a9b8b5"');
      s += R_(196, 40, 30, 30, '#ffffff', 4) + R_(207, 44, 8, 22, '#4fbf8f') + R_(200, 51, 22, 8, '#4fbf8f');
      return s;
    },
    shop(ctx) {
      let s = room('#f7f4ee', '#d9d4ca', ctx, { wain: '#ece6da' });
      s += R_(0, 0, W, 22, '#62b58f') + T_(200, 16, '小日子', 13, '#ffffff');
      const shelf = (x) => { let t = R_(x, 40, 110, 132, '#e7e1d5', 3, 'stroke="#c9c1b2" stroke-width="2"'); for (let r = 0; r < 4; r++) { t += R_(x + 4, 70 + r * 30, 102, 4, '#c9c1b2'); for (let i = 0; i < 6; i++) t += R_(x + 8 + i * 16, 50 + r * 30, 12, 18, ['#f4a6a6', '#ffd27a', '#9cc5f0', '#a8d8b9', '#c9b6f2', '#f7c59f'][(i + r) % 6], 2); } return t; };
      s += shelf(20) + shelf(140);
      s += R_(272, 40, 108, 132, '#dfeaf2', 4, 'stroke="#9fb3c4" stroke-width="2"');
      for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) s += R_(280 + i * 16, 52 + r * 38, 10, 28, ['#ff8a7a', '#7fc6f0', '#ffd34d', '#a8d8b9', '#f2b5d4', '#ffffff'][(i + r * 2) % 6], 3);
      s += R_(326, 40, 2, 132, '#9fb3c4');
      return s;
    },
    cafe(ctx) {
      let s = room('#efe1cd', '#b98d63', ctx, { wain: '#e1cdb2' });
      s += R_(30, 30, 110, 76, '#3d4a3f', 4, 'stroke="#a07a55" stroke-width="4"') + T_(85, 54, '今日咖啡', 13, '#f4f1e6') + T_(85, 74, '拿鐵 ・ 美式', 11, '#ffe08a') + T_(85, 92, '手工甜點', 11, '#f4b6c2');
      for (const x of [190, 250, 310]) s += P_(`M ${x} 0 L ${x} 30`, 'none', 'stroke="#6d5a4a" stroke-width="1.5"') + P_(`M ${x - 12} 42 Q ${x} 24 ${x + 12} 42 Z`, '#2f6b5a') + C_(x, 44, 4, '#fff1b8');
      s += R_(170, 70, 200, 6, '#a07a55') + [180, 200, 220, 240, 260, 290, 310, 330, 350].map((x, i) => R_(x, 58, 12, 12, ['#ffffff', '#f4a6a6', '#9cc5f0', '#ffd27a'][i % 4], 3, 'stroke="#c9b6a0"')).join('');
      s += R_(150, 128, 240, 44, '#a07a55', 4) + R_(150, 124, 240, 8, '#c49a6c', 3);
      s += R_(300, 96, 46, 30, '#9aa3ad', 6, 'stroke="#6d7680" stroke-width="2"') + R_(310, 112, 8, 10, '#3b3b4a') + C_(334, 108, 5, '#d9dee3');
      s += plant(30, 172, 1.1);
      return s;
    },
    street(ctx) {
      let s = skyRect(ctx);
      s += cloud(200, 30, 0.9);
      const bld = (x, w, h, c, sign, signC) => {
        let t = R_(x, 214 - h, w, h, c) + R_(x, 214 - h, w, 6, shade(c, -0.12));
        for (let y = 214 - h + 14; y < 214 - 60; y += 26) for (let i = 0; i < Math.floor(w / 26); i++) t += R_(x + 8 + i * 26, y, 16, 14, '#d9eef7', 2) + R_(x + 6 + i * 26, y + 14, 20, 3, shade(c, -0.2));
        t += R_(x, 214 - 58, w, 4, shade(c, -0.2)) + R_(x + 4, 214 - 54, w - 8, 54, shade(c, -0.28)) + R_(x + 10, 214 - 48, w - 20, 48, '#fff4dc', 2);
        if (sign) t += R_(x + w - 18, 214 - h + 20, 16, 54, signC, 3) + sign.split('').map((ch, k) => T_(x + w - 10, 214 - h + 36 + k * 15, ch, 12, '#ffffff')).join('');
        return t;
      };
      s += bld(0, 90, 150, '#f2d6c2', '早餐', '#e8655a') + bld(92, 84, 170, '#d9e3ee', '書店', '#4f78a8') + bld(178, 96, 140, '#f6e7c1', '麵店', '#6aae7f') + bld(276, 76, 160, '#e8d9f0', '冰品', '#7a5cff') + bld(354, 60, 130, '#f2d6c2');
      s += R_(0, 210, W, 30, '#7d8590') + R_(0, 208, W, 5, '#c9ced4');
      for (let x = 20; x < W; x += 50) s += R_(x, 226, 26, 3, '#ffffff', 1);
      const scooter = (x) => C_(x, 206, 5, '#3b3b4a') + C_(x + 22, 206, 5, '#3b3b4a') + P_(`M ${x - 2} 200 L ${x + 6} 190 L ${x + 18} 190 L ${x + 26} 200 Z`, '#9cc5f0') + R_(x + 18, 180, 3, 12, '#6d6d78');
      s += scooter(112) + scooter(150) + scooter(300);
      s += R_(380, 150, 4, 60, '#6d6d78') + R_(372, 140, 20, 34, '#3b3b4a', 4) + C_(382, 150, 4, '#ff6b5a') + C_(382, 164, 4, '#7fe0b0', 'opacity=".35"');
      return s;
    },
    park(ctx) {
      let s = skyRect(ctx);
      s += cloud(90, 36, 1) + cloud(280, 26, 0.7) + (ctx.month >= 5 && ctx.month <= 8 ? sun(350, 42) : '');
      s += P_('M 0 160 Q 100 120 200 150 Q 300 175 400 135 L 400 214 L 0 214 Z', '#b5dfb0') + P_('M 0 180 Q 120 160 230 176 Q 320 188 400 170 L 400 240 L 0 240 Z', '#9fd39a');
      s += R_(0, 196, W, 44, '#a7d89d') + P_('M 120 240 Q 180 200 260 196 L 300 196 Q 240 205 210 240 Z', '#efe0bf');
      s += tree(40, 196, 1.2) + tree(360, 192, 1.1, '#9fd3a9') + tree(300, 180, 0.7, '#7fbf93');
      s += R_(255, 176, 54, 6, '#c99a6b', 2) + R_(255, 166, 54, 6, '#c99a6b', 2) + R_(260, 182, 4, 12, '#8a6a50') + R_(300, 182, 4, 12, '#8a6a50');
      s += P_('M 330 196 L 330 150 L 344 150 L 380 196', 'none', 'stroke="#ff9f6b" stroke-width="5" stroke-linejoin="round"') + R_(326, 146, 22, 6, '#ffd27a', 2);
      for (const [x, c] of [[90, '#ffb3c1'], [104, '#ffd27a'], [180, '#c9b6f2'], [380, '#ffb3c1']]) s += C_(x, 210, 3.4, c) + C_(x, 210, 1.2, '#fff');
      return s;
    },
    nightmarket(ctx) {
      let s = skyRect(Object.assign({}, ctx, { night: true }));
      for (let i = 0; i < 18; i++) s += C_((i * 73) % 390 + 6, (i * 37) % 70 + 8, 1.1, '#fff6c9', 'opacity=".8"');
      s += C_(340, 34, 12, '#fff3c2') + C_(345, 30, 10, '#3d4778');
      const stall = (x, w, sign, c) => {
        let t = R_(x + 4, 92, 4, 120, '#6d5a4a') + R_(x + w - 8, 92, 4, 120, '#6d5a4a');
        for (let i = 0; i < w; i += 16) t += P_(`M ${x + i} 90 L ${x + i + 16} 90 L ${x + i + 16} 106 Q ${x + i + 8} 114 ${x + i} 106 Z`, (i / 16) % 2 ? '#ffffff' : c);
        t += R_(x, 80, w, 12, shade(c, -0.15), 2) + R_(x + 10, 52, w - 20, 26, '#fff4c9', 4, `stroke="${c}" stroke-width="2"`) + T_(x + w / 2, 71, sign, 14, shade(c, -0.25));
        t += R_(x + 2, 168, w - 4, 44, '#c9a679', 3) + R_(x + 2, 164, w - 4, 6, '#e3c799', 2);
        return t;
      };
      s += stall(6, 120, '雞排', '#e8655a') + stall(140, 120, '珍珠奶茶', '#6aae7f') + stall(274, 120, '烤玉米', '#e8a33a');
      s += P_('M 0 40 Q 100 58 200 40 Q 300 58 400 40', 'none', 'stroke="#3b3b4a" stroke-width="1"') + [20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map((x, i) => C_(x, 44 + Math.sin(i) * 4 + (i % 2) * 4, 4, ['#ffd34d', '#ff8a7a', '#9fe0c0', '#fff1b8'][i % 4])).join('');
      s += [60, 200, 336].map(x => P_(`M ${x} 160 q -6 -10 0 -18 q 6 -8 0 -16`, 'none', 'stroke="#ffffff" stroke-width="2" opacity=".5" stroke-linecap="round"')).join('');
      s += R_(0, 212, W, 28, '#5a5468');
      return s;
    },
    temple(ctx) {
      let s = skyRect(ctx);
      s += cloud(60, 32, 0.8);
      s += R_(60, 96, 280, 118, '#f3e3c6') + R_(60, 96, 280, 10, '#d9c2a0');
      s += P_('M 40 102 Q 200 80 360 102 L 344 74 Q 200 52 56 74 Z', '#e07a3c', 'stroke="#a8502a" stroke-width="2"') + P_('M 56 74 Q 40 66 34 52 M 344 74 Q 360 66 366 52', 'none', 'stroke="#a8502a" stroke-width="4" stroke-linecap="round"');
      s += P_('M 110 60 Q 200 40 290 60 L 280 42 Q 200 26 120 42 Z', '#e8913f', 'stroke="#a8502a" stroke-width="2"') + P_('M 120 42 Q 108 34 104 22 M 280 42 Q 292 34 296 22', 'none', 'stroke="#a8502a" stroke-width="3.5" stroke-linecap="round"');
      s += C_(200, 30, 6, '#f5c24b') + P_('M 170 36 Q 185 28 194 32 M 230 36 Q 215 28 206 32', 'none', 'stroke="#4fae8f" stroke-width="3" stroke-linecap="round"');
      for (const x of [86, 150, 238, 302]) s += R_(x, 106, 14, 108, '#c9393a') + R_(x - 3, 106, 20, 6, '#a82e2e') + R_(x - 3, 206, 20, 8, '#8a7a6a');
      s += R_(166, 118, 68, 96, '#8a3a2a', 4) + R_(172, 124, 26, 90, '#b04a36', 2) + R_(202, 124, 26, 90, '#b04a36', 2) + C_(196, 170, 2, '#f5c24b') + C_(204, 170, 2, '#f5c24b');
      for (const x of [118, 270]) s += P_(`M ${x} 106 L ${x} 116`, 'none', 'stroke="#6d5a4a" stroke-width="1.2"') + E_(x, 128, 10, 13, '#e8463f') + R_(x - 6, 114, 12, 3, '#f5c24b') + R_(x - 6, 140, 12, 3, '#f5c24b') + T_(x, 133, '福', 10, '#f5d06b');
      s += R_(0, 212, W, 28, '#cfc4b4');
      s += R_(30, 180, 28, 32, '#5a4a3a', 4) + E_(44, 180, 18, 5, '#6d5a4a') + P_('M 40 172 q -6 -12 2 -22 q 6 -8 0 -18 M 48 172 q 6 -10 0 -18', 'none', 'stroke="#ffffff" stroke-width="2" opacity=".55" stroke-linecap="round"');
      return s;
    },
    beach(ctx) {
      let s = skyRect(ctx, 150);
      s += sun(320, 40) + cloud(90, 40, 0.9);
      s += R_(0, 120, W, 70, '#5cc0e0') + R_(0, 120, W, 10, '#8ad4ea');
      for (let i = 0; i < 6; i++) s += P_(`M ${i * 70} 150 q 18 -8 36 0`, 'none', 'stroke="#ffffff" stroke-width="2.2" opacity=".8" stroke-linecap="round"');
      s += P_('M 0 176 Q 100 166 200 174 Q 300 182 400 170 L 400 240 L 0 240 Z', '#f6e2b3') + P_('M 0 176 Q 100 166 200 174 Q 300 182 400 170', 'none', 'stroke="#ffffff" stroke-width="4" opacity=".8"');
      s += R_(340, 120, 3, 92, '#8a6a50') + P_('M 300 124 Q 341 92 384 124 Z', '#ff8a7a') + P_('M 320 124 Q 341 96 362 124 Z', '#ffffff', 'opacity=".9"');
      s += C_(70, 206, 6, '#f2b5d4') + P_('M 104 210 l 6 -4 l 6 4 l -6 4 Z', '#ffd27a');
      s += P_('M 150 70 q 6 -5 12 0 q 6 -5 12 0', 'none', 'stroke="#5b6b7b" stroke-width="1.6" stroke-linecap="round"');
      return s;
    },
    pool(ctx) {
      let s = R_(0, 0, W, H, '#dff1f6');
      for (let i = 0; i < 5; i++) s += R_(20 + i * 78, 22, 56, 46, '#ffffff', 4, 'opacity=".8"') + R_(24 + i * 78, 26, 48, 38, '#bfe6f2', 3);
      s += R_(0, 96, W, 6, '#9fd3e3');
      s += R_(0, 102, W, 84, '#5fc2df') + R_(0, 102, W, 8, '#86d3e8');
      for (let i = 0; i < 4; i++) s += P_(`M 0 ${122 + i * 18} L ${W} ${122 + i * 18}`, 'none', `stroke="${i % 2 ? '#ff8a7a' : '#ffffff'}" stroke-width="2" stroke-dasharray="8 6" opacity=".85"`);
      for (let i = 0; i < 7; i++) s += P_(`M ${20 + i * 58} ${140 + (i % 3) * 12} q 10 -5 20 0`, 'none', 'stroke="#ffffff" stroke-width="1.8" opacity=".7" stroke-linecap="round"');
      s += R_(0, 186, W, 54, '#eef3f0') + R_(0, 186, W, 4, '#d6e3df');
      for (let i = 0; i < 10; i++) s += R_(i * 40, 190, 40, 50, i % 2 ? '#e4ece8' : '#eef3f0');
      s += R_(350, 150, 4, 44, '#c5ced6', 2) + R_(366, 150, 4, 44, '#c5ced6', 2) + R_(350, 160, 20, 3, '#c5ced6') + R_(350, 172, 20, 3, '#c5ced6');
      s += C_(60, 150, 9, '#ffd34d', 'stroke="#ff8a7a" stroke-width="4"');
      return s;
    },
    mountain(ctx) {
      let s = skyRect(ctx);
      s += cloud(300, 36, 1) + sun(80, 44);
      s += P_('M -10 170 L 80 70 L 140 130 L 210 50 L 300 140 L 360 90 L 420 160 L 420 214 L -10 214 Z', '#9cbfd6') + P_('M 210 50 L 228 70 L 214 66 L 204 74 L 196 64 Z', '#ffffff') + P_('M 80 70 L 94 86 L 80 82 L 70 88 Z', '#ffffff');
      s += P_('M -10 190 L 60 140 L 130 176 L 200 130 L 280 180 L 350 146 L 420 186 L 420 214 L -10 214 Z', '#7fae97');
      s += cloud(120, 160, 1.4, 0.85) + cloud(290, 166, 1.2, 0.85);
      s += R_(0, 196, W, 44, '#8fc79a');
      s += pine(30, 210, 1.1) + pine(60, 214, 0.8) + pine(370, 210, 1.2) + pine(344, 214, 0.8, '#6aae8a');
      s += P_('M 250 212 L 280 176 L 310 212 Z', '#ffb74a', 'stroke="#c9843a" stroke-width="2"') + P_('M 280 176 L 280 212', 'none', 'stroke="#c9843a" stroke-width="2"');
      return s;
    },
    army(ctx) {
      let s = skyRect(ctx);
      s += cloud(300, 34, 0.9);
      s += R_(20, 100, 180, 100, '#d6d0b6') + R_(14, 92, 192, 12, '#7d8a5a', 2);
      for (let i = 0; i < 5; i++) s += R_(32 + i * 34, 120, 20, 22, '#bfd9e6', 2, 'stroke="#9aa486" stroke-width="2"');
      s += R_(90, 156, 36, 44, '#8a7a5a', 2);
      s += R_(250, 30, 4, 172, '#b9bec4') + C_(252, 30, 4, '#e3c46a');
      s += R_(300, 140, 48, 62, '#ffffff', 3, 'stroke="#9aa486" stroke-width="2"') + P_('M 296 140 L 324 122 L 352 140 Z', '#7d8a5a') + R_(308, 152, 32, 20, '#bfd9e6', 2);
      s += R_(0, 200, W, 40, '#c2b48a') + R_(0, 196, W, 6, '#9fae78');
      for (let i = 0; i < 5; i++) s += E_(220 + i * 15, 208, 9, 6, '#b8a87a', 'stroke="#8a7a5a" stroke-width="1.5"');
      s += tree(380, 200, 0.8, '#7fae86');
      return s;
    },
    wedding(ctx) {
      let s = skyRect(Object.assign({}, ctx, { month: 4 }));
      s += cloud(70, 34, 0.9) + cloud(330, 30, 0.8);
      s += R_(0, 170, W, 70, '#bfe3b5');
      s += P_('M 120 214 L 120 90 Q 200 20 280 90 L 280 214', 'none', 'stroke="#ffffff" stroke-width="9"') + P_('M 120 214 L 120 90 Q 200 20 280 90 L 280 214', 'none', 'stroke="#f0e6dc" stroke-width="3"');
      for (let i = 0; i < 14; i++) { const t = i / 13, a = Math.PI * (1 - t); const x = 200 + Math.cos(a) * 82, y = 92 - Math.sin(a) * 60; s += C_(x, y, 9, ['#ffc2cf', '#ffffff', '#ffd9a8'][i % 3]) + C_(x + 3, y - 3, 4, '#a8d8b9'); }
      for (const x of [120, 280]) for (const y of [120, 150, 180]) s += C_(x, y, 7, ['#ffc2cf', '#ffffff', '#ffd9a8'][(y / 30) % 3 | 0]) + C_(x - 4, y + 4, 4, '#a8d8b9');
      s += P_('M 0 20 Q 50 40 100 20 Q 150 40 200 20 Q 250 40 300 20 Q 350 40 400 20', 'none', 'stroke="#c9b6a0" stroke-width="1"') + [25, 75, 125, 175, 225, 275, 325, 375].map((x, i) => P_(`M ${x - 7} ${27 + (i % 2) * 2} l 14 0 l -7 12 Z`, ['#ffc2cf', '#9cc5f0', '#ffd27a', '#a8d8b9'][i % 4])).join('');
      for (const x of [30, 60, 340, 370]) s += R_(x - 8, 186, 16, 4, '#ffffff', 2, 'stroke="#d9cfc4"') + R_(x - 8, 170, 16, 16, '#ffffff', 3, 'stroke="#d9cfc4"') + R_(x - 7, 190, 2, 20, '#d9cfc4') + R_(x + 5, 190, 2, 20, '#d9cfc4');
      for (let i = 0; i < 10; i++) s += E_((i * 47) % 400, 200 + (i * 13) % 34, 2.4, 1.5, '#ffb3c1', `transform="rotate(${i * 30} ${(i * 47) % 400} ${200 + (i * 13) % 34})"`);
      return s;
    },
    field(ctx) {
      let s = skyRect(ctx);
      s += cloud(100, 36, 0.9) + (ctx.month >= 5 && ctx.month <= 8 ? sun(340, 40) : '');
      s += R_(20, 90, 360, 70, '#ece3d2') + R_(20, 90, 360, 8, '#d9c9ad');
      for (let i = 0; i < 9; i++) s += R_(34 + i * 39, 106, 18, 20, '#bfe0f0', 2);
      s += R_(0, 150, W, 22, '#9fd39a');
      s += P_('M -10 240 Q 200 150 410 240 Z', '#d9775a') + P_('M 40 240 Q 200 172 360 240', 'none', 'stroke="#ffffff" stroke-width="1.6"') + P_('M 90 240 Q 200 194 310 240', 'none', 'stroke="#ffffff" stroke-width="1.6"');
      s += P_('M 0 172 L 400 172 L 400 182 Q 200 162 0 182 Z', '#9fd39a');
      s += tree(30, 172, 0.8) + tree(376, 172, 0.8);
      return s;
    }
  };
  Art.SCENE_KEYS = Object.keys(SCENES);
  Art.scene = function (key, ctx) {
    const fn = SCENES[key] || SCENES.home;
    let s = fn(ctx || {});
    if (ctx && ctx.rain) {
      s += R_(0, 0, W, H, '#5a6b80', 0, 'opacity=".22"');
      for (let i = 0; i < 46; i++) { const x = (i * 53) % 410, y = (i * 29) % 230; s += P_(`M ${x} ${y} l -5 12`, 'none', 'stroke="#ffffff" stroke-width="1.3" opacity=".55" stroke-linecap="round"'); }
    }
    return s;
  };

  /* ================================================================
   * 從遊戲狀態決定：場景、人物外觀、表情
   * ================================================================ */
  const KW = [
    ['wedding', /婚禮|喜帖|伴郎|伴娘|婚宴/],
    ['hospital', /醫院|住院|急診|看醫生|看診|產檢|開刀|手術|門診|醫務室|病房|預防針|疫苗|打針|牙醫|出生了|寶寶出生|健康檢查|發燒|流感|腸病毒|骨折|健檢|醫師國考|護理站|病人/],
    ['nightmarket', /夜市/],
    ['temple', /廟|拜拜|媽祖|遶境|平安符|光明燈|文昌|八家將|掃墓|告別式/],
    ['beach', /海邊|沙灘|海生館|淨灘|浪花|墾丁/],
    ['mountain', /爬山|山頂|露營|百岳|玉山|雲海|登山|合歡山|看日出|野外求生|環島/],
    ['field', /運動會|大隊接力|操場|田徑|跑步|體適能|躲避球|系隊|籃球|啦啦隊|跳繩|體育課/],
    ['army', /營區|新訓|站哨|部隊|入伍|班長|連長|行軍|打靶|演習|同梯|退伍|伙房|懇親會|替代役訓練|徵集令/],
    ['park', /公園|河堤|河濱|溜滑梯|盪鞦韆|風箏|野餐|散步|求婚/],
    ['cafe', /咖啡|餐廳|飲料店|早餐店|拉麵|火鍋|燒肉|吃到飽|便當店|牛肉麵|請你吃|吃飯|聚餐|尾牙|春酒/],
    ['shop', /便利商店|超商|超市|髮廊|收銀|商店|玩具店|大賣場|書店/],
    ['factory', /工廠|產線|機台|作業員|晶圓|技術士|證照加給/],
    ['street', /街|路口|騎車|機車|捷運|公車|通勤|外送|火車|車站|塞車|紅燈|搭車|西門町|老街|逛街|迷路/],
    ['office', /公司|辦公室|會議|簡報|主管|同事|客戶|加班|上班|專案|考績|年終|職缺|面試|獵頭|人資/],
    ['campus', /大學|校園|宿舍|社團|系上|教授|研究所|實驗室|學餐|選課|期中考|期末考|畢業典禮|交換學生|迎新/],
    ['classroom', /學校|教室|上課|老師|考試|段考|作業|班上|下課|聯絡簿|學測|會考|模擬考|開學|升旗|午休|營養午餐|考卷|成績單|值日生|小考|國小|國中|高中|補習/]
  ];
  function baseScene(S) {
    const a = S.ageM / 12;
    const stt = LG.status();
    if (a < 1.5) return 'nursery';
    if (stt === 'army') return 'army';
    if (stt === 'work' && S.job) { const jd = LG.jobDef(S.job.id); return (jd && jd.sn) || 'office'; }
    if (stt === 'uni') return 'campus';
    return 'home';
  }
  Art.pickScene = function (item, S) {
    if (!item) return baseScene(S);
    if (item.sn) return item.sn === 'job' ? baseScene(S) : item.sn;
    const txt = (item.title || '') + (item.text || '');
    const stage = S.school.stage;
    for (const [k, re] of KW) {
      if (!re.test(txt)) continue;
      if (k === 'classroom') {
        if (stage === 'kinder') return 'kinder';
        if (stage === 'uni' || stage === 'grad' || LG.status() === 'uni') return 'campus';
        if (LG.status() === 'work' && S.job && (S.job.cat === 'teach')) return 'classroom';
        if (['elem', 'junior', 'senior', 'voc', 'jc'].includes(stage)) return 'classroom';
        continue;
      }
      if (k === 'office' && S.job) { const jd = LG.jobDef(S.job.id); return (jd && jd.sn) || 'office'; }
      if (k === 'campus' && !['uni', 'grad', 'jc'].includes(stage) && LG.status() !== 'uni') continue;
      return k;
    }
    if (item.id && /^(w|ws|wr|wf|wo|wt|wm|we|wc|wp|wa|wl|wd)_/.test(item.id)) return baseScene(S);
    if (item.id && /^(t_|t2_)/.test(item.id) && stage === 'kinder' && /幼兒園|老師|同學|小朋友/.test(txt)) return 'kinder';
    if (item.id && /^(u_|ud_)/.test(item.id)) return 'campus';
    if (item.id && /^(m_|a_|ad_army)/.test(item.id)) return 'army';
    const a = S.ageM / 12;
    if (a < 1.5) return 'nursery';
    return 'home';
  };
  Art.sceneCtx = function (S, key, item) {
    const txt = item ? (item.title || '') + (item.text || '') : '';
    const ctx = { month: S.month, wealth: S.fam.wealth, hm: S.home, rain: /下雨|雨天|颱風|梅雨|豪雨|淹水|大雨/.test(txt), night: /半夜|凌晨|晚上|夜/.test(txt) && key !== 'nightmarket' && false, day: 1 + (S.ageM * 7) % 28 };
    const sc = S.school;
    if (sc.stage === 'junior' && sc.grade === 9 && S.month <= 5) ctx.countdown = '會考倒數 ' + Math.max(1, (5 - S.month) * 30 + 15) + ' 天';
    if (sc.stage === 'senior' && sc.grade === 12 && (S.month >= 9 || S.month === 1)) ctx.countdown = '學測倒數 ' + Math.max(1, ((13 - S.month) % 12) * 30 + 10) + ' 天';
    ctx.duty = (S.ageM % 30 + 1) + ' 號';
    return ctx;
  };

  // 玩家的外觀
  function lookOf(S) {
    if (S.look && S.look.hair) return S.look;
    const r = rng(hash(S.seed));
    return { skin: pickR(r, Art.SKINS), hair: S.gender === 'F' ? pickR(r, ['bob', 'long', 'pony', 'twin', 'bun']) : pickR(r, ['short', 'side', 'spiky', 'curly']), hairC: pickR(r, ['black', 'black', 'dark', 'brown']) };
  }
  Art.lookOf = lookOf;
  function casualCols(seed, g, age) {
    const r = rng(hash(seed + ':' + Math.floor(age / 3)));
    return { top: pickR(r, TOPS), bottom: pickR(r, BOTTOMS), skirt: g === 'F' && r() < 0.35, stripe: r() < 0.3 };
  }
  function wearFor(S, scene, item) {
    const a = S.ageM / 12, stt = LG.status(), st = S.school.stage;
    const id = (item && item.id) || '';
    if (a < 1.3) return 'onesie';
    if (scene === 'wedding' && /^l_wedding/.test(id)) return 'wedding';
    if (stt === 'army') return (scene === 'army' || scene === 'office') ? (S.mil.kind === '替代役' ? 'vest' : 'army') : 'casual';
    if (stt === 'work' && S.job) {
      const jd = LG.jobDef(S.job.id) || {};
      if (scene === jd.sn || /^w/.test(id) || (item && item.kind === 'sys' && /考績|年終|裁員|離開公司/.test(item.title || ''))) return jd.wear || 'office';
      return 'casual';
    }
    if (stt === 'uni') return 'hoodie';
    if (a >= 60) return scene === 'wedding' ? 'casual' : 'elder';
    if (scene === 'kinder' || (st === 'kinder' && scene === 'classroom')) return 'smock';
    if (scene === 'classroom' || scene === 'field') return st === 'elem' ? 'elem' : st === 'junior' ? 'junior' : ['senior', 'voc', 'jc'].includes(st) ? 'senior' : 'casual';
    return 'casual';
  }
  Art.playerSpec = function (S, scene, item, mood) {
    const L = lookOf(S);
    const a = S.ageM / 12;
    const bmi = S.wgt / Math.pow(Math.max(0.5, S.hgt / 100), 2);
    const wear = wearFor(S, scene, item);
    const id = (item && item.id) || '';
    const hr = rng(hash(S.seed + ':age'));
    const p = { age: a, g: S.gender, skin: L.skin, hair: L.hair, hairC: HAIR_C[L.hairC] || L.hairC, wear, cols: casualCols(S.seed, S.gender, a), mood, glasses: S.tags.includes('戴眼鏡') || (a >= 52 && hr() < 0.6), bmi: a < 6 ? 16 : bmi, grayK: 0.75 + hr() * 0.45 };
    if (a >= 76 && (S.st.hp < 60 || a >= 85)) p.cane = true;
    if (item && item.pose) p.pose = item.pose;
    if (item && item.wear) p.wear = item.wear;
    if (wear === 'smock' && scene === 'kinder') p.hat = 'kinder';
    if (/畢業典禮|研究所畢業/.test((item && item.title) || '') && a >= 21) p.hat = 'grad';
    if (wear === 'elem' || wear === 'junior') p.bag = '#e8655a';
    if (item && item.pose) { /* 行程指定的動作 */ }
    else if (mood === 'happy' && (item && (item.k === 'o' || item.ok))) p.pose = 'cheer';
    else if (mood === 'happy' && /^(t_|c_|n_|p2_|t2_)/.test(id)) p.pose = 'wave';
    return p;
  };
  // 配角外觀
  Art.npcSpec = function (n, S, mood) {
    const r = rng(hash(S.seed + ':' + (n.id || n.name)));
    const pa = S.ageM / 12;
    let age = pa;
    const role = n.role;
    if (LG.npcAge && (n.bornAt != null || n.born != null) && n.id) age = LG.npcAge(n);
    else if (role === 'mom' || role === 'dad') age = pa + 26 + r() * 6;
    else if (role === 'grandma' || role === 'grandpa') age = pa + 55 + r() * 8;
    else if (role === 'sib') age = Math.max(0.5, pa + (n.ageOff || (n.older ? 3 : -3)));
    else if (role === 'child') age = Math.max(0.3, (S.ageM - (n.born || S.ageM)) / 12);
    else if (role === 'colleague' || role === 'excolleague') age = pa + 2 + r() * 8;
    else age = pa + (r() - 0.5) * 2;
    age = Math.max(0.3, age);
    const g = n.g || (role === 'mom' || role === 'grandma' ? 'F' : 'M');
    const skin = pickR(r, Art.SKINS);
    const hairs = g === 'F' ? ['bob', 'long', 'pony', 'bun', 'twin'] : ['short', 'side', 'spiky', 'curly'];
    let hair = pickR(r, hairs);
    if (age > 40 && hair === 'twin') hair = 'bun';
    const old = age >= 64 || ((role === 'grandma' || role === 'grandpa') && age >= 50);
    const p = { age, g, skin, hair: old ? (g === 'F' ? 'bun' : 'short') : hair, hairC: pickR(r, ['#2f2725', '#56382b', '#8b5a3c', '#3a2b28', '#6b4a3a']), glasses: old ? r() < 0.7 : r() < 0.15, mood, bmi: 19 + r() * 6, grayK: 0.7 + r() * 0.5, cane: age >= 80 && r() < 0.6 };
    p.cols = { top: pickR(r, TOPS), bottom: pickR(r, BOTTOMS), skirt: g === 'F' && r() < 0.4 };
    if (old) p.wear = 'elder';
    if (role === 'colleague' && S.job && LG.status() === 'work') { const jd = LG.jobDef(S.job.id) || {}; p.wear = jd.wear || 'office'; }
    return p;
  };
  // 表情
  Art.moodOf = function (item) {
    if (!item) return 'normal';
    if (!item.done) return 'think';
    const chips = item.chips || [];
    let md = 0, st = 0, hp = 0, rel = 0, money = 0, special = '';
    for (const c of chips) {
      if (c.k === 'md') md += c.v; if (c.k === 'st') st += c.v; if (c.k === 'hp') hp += c.v; if (c.k === 'rel') rel += c.v; if (c.k === '$') money += c.v;
      if (c.k === 'ach' || c.k === 'pet' || c.k === 'npc') special = 'happy';
      if (c.k === 'loss') special = 'sad';
    }
    if (special) return special;
    if (item.ok === false) return 'sad';
    if (item.ok === true) return 'happy';
    const txt = item.text || '';
    if (/喜歡|告白|交往|約會|婚|求婚|在一起/.test(txt) && md >= 0) return 'love';
    if (item.k === 'f' && md < 0) return 'surprised';
    if (md <= -2 || hp <= -3) return 'sad';
    if (st >= 3) return 'tired';
    if (/生氣|吵架|抱怨|大吼|嘲笑|欺負/.test(txt)) return 'angry';
    if (md >= 2 || money > 0 || rel >= 3) return 'happy';
    if (item.k === 'f') return 'surprised';
    return 'normal';
  };
  const EMOTE = { happy: 'note', love: 'heart', sad: 'drop', tired: 'sweat', surprised: 'bang', think: 'ask', angry: 'anger' };
  Art.emoteFor = mood => EMOTE[mood] || '';

  // 這個事件裡出現的人物
  Art.castOf = function (item, S) {
    const out = [];
    if (!item) return out;
    const b = item.b || {};
    const add = id => { const n = LG.npc(id); if (n && n.alive !== false && !out.includes(n) && out.length < 2) out.push(n); };
    const order = ['crush', 'spouse', 'partner', 'child', 'bff', 'friend', 'colleague', 'parent', 'mom', 'dad', 'grand', 'grandma', 'grandpa', 'sib'];
    if (b._nc) add(b._nc);
    if (b._nf) add(b._nf);
    for (const k of order) if (b[k] && typeof b[k] === 'string') add(b[k]);
    const txt = (item.text || '') + (item.title || '');
    if (out.length < 2 && /爸媽|阿公阿嬤|家人|全家|parents/.test(txt)) for (const n of LG.caregivers()) add(n.id);
    if (!out.length && /出生|寶寶出生了/.test(item.title || '') && S.ageM < 2) for (const n of LG.caregivers()) add(n.id);
    if (out.length < 2 && b.newfriend && !b._nf) out.push({ id: 'tmp' + b.newfriend.name, name: b.newfriend.name, g: b.newfriend.g, role: 'friend' });
    if (out.length < 2 && b.newcrush && !b._nc) out.push({ id: 'tmp' + b.newcrush.name, name: b.newcrush.name, g: b.newcrush.g, role: 'crush' });
    return out;
  };

  // 組成整個舞台
  Art.stage = function (S, item, opt) {
    opt = opt || {};
    const key = opt.scene || Art.pickScene(item, S);
    const ctx = Art.sceneCtx(S, key, item);
    const mood = opt.mood || Art.moodOf(item);
    let s = Art.scene(key, ctx);
    const cast = opt.noCast ? [] : Art.castOf(item, S);
    const pet = S.pet && S.pet.alive && item && (item.text || '').includes(S.pet.name);
    const players = [];
    const P = Art.playerSpec(S, key, item, mood);
    const scaleFor = p => 1.6 * (p.age < 1.3 ? 1 : clamp((p.h || 1), 0.92, 1.1));
    const n = cast.length;
    const px = n === 0 ? 200 : n === 1 ? 160 : 140;
    players.push({ p: P, x: px, me: true });
    cast.forEach((c, i) => players.push({ p: Art.npcSpec(c, S, mood === 'sad' || mood === 'angry' ? 'normal' : mood === 'think' ? 'normal' : mood === 'tired' ? 'normal' : mood), x: n === 1 ? 250 : 222 + i * 66, flip: true }));
    let chars = '';
    if (pet) chars += `<g transform="translate(${n ? 92 : 128} ${GY}) scale(1.25)">${Art.pet(S.pet.kind, S.pet.color || (S.pet.kind === '貓' ? '#f2b56b' : '#d9a46a'), mood)}</g>`;
    for (const q of players) {
      const sc = scaleFor(q.p);
      chars += `<g transform="translate(${q.x} ${GY}) scale(${q.flip ? -sc : sc} ${sc})"><g class="${q.me ? 'me bob' : 'npc bob2'}">${Art.person(q.p)}</g></g>`;
    }
    const emo = Art.emoteFor(mood);
    if (emo) {
      const top = Art.headTop(P) * scaleFor(P);
      chars += `<g transform="translate(${px + 26} ${f1(GY + top - 4)})"><g class="emote-pop">${Art.emote(emo)}</g></g>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="stage-svg" role="img" aria-label="${key}">${s}${chars}</svg>`;
  };

  // 單人預覽（建立角色、總結頁）
  Art.portrait = function (p, opt) {
    opt = opt || {};
    const w = opt.w || 120, h = opt.h || 140;
    const sc = opt.scale || 1.5;
    const bg = opt.bg ? R_(0, 0, w, h, opt.bg, 16) + E_(w / 2, h - 14, w * 0.36, 6, '#000', 'opacity=".06"') : '';
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${bg}<g transform="translate(${w / 2} ${h - 12}) scale(${sc})"><g class="bob">${Art.person(p)}</g></g></svg>`;
  };
  // 大頭照（頂部列、人物清單）
  Art.headshot = function (p, size) {
    let cy, R;
    if (p.age < 1.3) { cy = -34; R = 15; }
    else { const G = geo(p.age, p.g, p.bmi); R = G.R; cy = -(G.legL + G.torL + R * 0.72); }
    const v = R * 3.1;
    return `<svg width="${size}" height="${size}" viewBox="${f1(-v / 2)} ${f1(cy - v * 0.52)} ${f1(v)} ${f1(v)}" xmlns="http://www.w3.org/2000/svg">${Art.person(p)}</svg>`;
  };

  /* ================================================================
   * v0.4 原創「積木玩具風」人偶：方頭、方身、積木腿、方塊小手
   * ================================================================ */
  // [年齡, 腿長, 身長, 身寬, 頭寬, 頭高]
  const B_TAB = [[1.3, 8, 12, 17, 23, 21], [3, 10, 14, 18, 24, 22], [6, 13, 16, 20, 25, 23], [10, 16, 18, 22, 25, 23], [13, 19, 20, 24, 26, 24], [16, 21, 22, 26, 26, 24], [20, 22, 23, 27, 26, 24], [99, 22, 23, 27, 26, 24]];
  function bgeo(age, g, bmi) {
    const col = i => interp(B_TAB.map(r => [r[0], r[i]]), age);
    const wf = clamp(Math.pow((bmi || 20) / 20.5, 0.8), 0.88, 1.38);
    let torW = col(3) * wf;
    if (age >= 13 && g === 'M') torW += 1.5;
    const legL = col(1), torL = col(2), hw = col(4), hh = col(5);
    const hipY = -legL, shY = -(legL + 3 + torL);
    const cy = shY - 1.5 - hh / 2;
    return { legL, torL, torW, hw, hh, hipY, shY, cy, wf };
  }
  function bHairBack(st, G, hc, o) {
    const { hw, hh, cy, shY, torL } = G;
    const top = cy - hh / 2 - 2.5;
    switch (st) {
      case 'long': return R_(-hw / 2 - 2.5, top, hw + 5, (shY + torL * 0.62) - top, hc, 5, o);
      case 'bob': return R_(-hw / 2 - 2.5, top, hw + 5, hh * 0.92, hc, 5, o);
      case 'twin': return [-1, 1].map(s => R_(s > 0 ? hw / 2 - 1 : -hw / 2 - 7, cy - hh * 0.25, 8, hh * 0.95, hc, 3.5, o) + R_(s > 0 ? hw / 2 : -hw / 2 - 5, cy - hh * 0.28, 5, 3, '#f7c948', 1, o)).join('');
      case 'pony': return R_(hw / 2 - 2, cy - hh * 0.35, 8, hh * 1.05, hc, 3.5, o) + R_(hw / 2 - 1, cy - hh * 0.4, 6, 3.2, '#f07a8a', 1, o);
      case 'bun': return R_(-5.5, top - 8, 11, 10, hc, 3.5, o);
      default: return '';
    }
  }
  function bHairFront(st, G, hc, o) {
    const { hw, hh, cy } = G;
    const top = cy - hh / 2 - 2.5, x0 = -hw / 2 - 2, w = hw + 4;
    const hl = R_(x0 + 4, top + 1.6, w * 0.32, 1.8, shade(hc, 0.35), 1, 'opacity=".7"');
    const cap = (bot) => R_(x0, top, w, bot - top, hc, 6, o);
    switch (st) {
      case 'none': return '';
      case 'tuft': return R_(-2.5, top - 3, 5, 6, hc, 2, o);
      case 'buzz': return R_(x0 + 0.5, top + 1, w - 1, hh * 0.28, shade(hc, 0.12), 6, o);
      case 'spiky': {
        let d = `M ${f1(x0)} ${f1(cy - hh * 0.12)} L ${f1(x0)} ${f1(top + 4)}`;
        const n = 5;
        for (let i = 0; i < n; i++) { const xa = x0 + (w * i) / n, xb = x0 + (w * (i + 0.5)) / n, xc = x0 + (w * (i + 1)) / n; d += ` L ${f1(xa)} ${f1(top + 3)} L ${f1(xb)} ${f1(top - 5 - (i % 2) * 2)} L ${f1(xc)} ${f1(top + 3)}`; }
        d += ` L ${f1(x0 + w)} ${f1(cy - hh * 0.12)} L ${f1(hw / 2 - 1)} ${f1(cy - hh * 0.18)} L ${f1(-hw / 2 + 1)} ${f1(cy - hh * 0.18)} Z`;
        return P_(d, hc, o) + hl;
      }
      case 'curly': {
        let s = cap(cy - hh * 0.16);
        for (let i = 0; i < 6; i++) s += R_(x0 - 1 + i * (w / 5.6), top - 3.5, w / 5, 6, hc, 3, o);
        return s;
      }
      case 'side':
        return P_(`M ${f1(x0)} ${f1(cy)} L ${f1(x0)} ${f1(top + 5)} Q ${f1(x0)} ${f1(top)} ${f1(x0 + 5)} ${f1(top)} L ${f1(x0 + w - 5)} ${f1(top)} Q ${f1(x0 + w)} ${f1(top)} ${f1(x0 + w)} ${f1(top + 5)} L ${f1(x0 + w)} ${f1(cy - hh * 0.05)} L ${f1(hw * 0.28)} ${f1(cy - hh * 0.22)} L ${f1(-hw * 0.38)} ${f1(cy - hh * 0.02)} L ${f1(-hw / 2 + 1)} ${f1(cy - hh * 0.1)} L ${f1(-hw / 2 + 1)} ${f1(cy)} Z`, hc, o) + hl;
      case 'bob': case 'long': case 'twin': case 'pony': case 'bun': {
        const sideB = st === 'bob' || st === 'long' ? cy + hh * 0.3 : cy - hh * 0.05;
        let s = R_(x0, top, 4.5, sideB - top, hc, 2, o) + R_(x0 + w - 4.5, top, 4.5, sideB - top, hc, 2, o);
        s += cap(cy - hh * 0.2);
        s += R_(x0 + 2, cy - hh * 0.24, w - 4, 3, hc);
        return s + hl;
      }
      default: { // short
        let s = cap(cy - hh * 0.2);
        for (let i = 0; i < 4; i++) s += R_(x0 + 3 + i * ((w - 6) / 4), cy - hh * 0.24, (w - 6) / 4 - 0.8, 3.2 + (i % 2) * 1.2, hc, 1);
        return s + hl;
      }
    }
  }
  function bBaby(p) {
    const o = ol(1.4), skin = p.skin || Art.SKINS[1];
    const c = (p.cols && p.cols.top) || '#bfe3f2';
    const hc = p.hairC || '#3a2b28';
    let s = E_(0, 1, 15, 3, '#000', 'opacity=".12"');
    s += R_(-12, -7, 9, 7, c, 2.5, o) + R_(3, -7, 9, 7, c, 2.5, o);
    s += R_(-13.5, -4.5, 4, 4, skin, 1.5, o) + R_(9.5, -4.5, 4, 4, skin, 1.5, o);
    s += R_(-9, -20, 18, 14, c, 4, o);
    s += R_(-13, -18, 5, 8, c, 2.5, o) + R_(8, -18, 5, 8, c, 2.5, o);
    s += R_(-13, -12, 5, 4.5, skin, 2, o) + R_(8, -12, 5, 4.5, skin, 2, o);
    const cy = -32;
    s += R_(-12, cy - 11, 24, 22, skin, 7, o);
    s += face(p.mood || 'normal', 10.5, cy, false);
    s += R_(-2.5, cy - 15, 5, 5, hc, 2, o);
    return `<g>${s}</g>`;
  }
  Art.blockPerson = function (p) {
    if (p.age < 1.3) return bBaby(p);
    const G = bgeo(p.age, p.g, p.bmi);
    const { legL, torL, torW, hw, hh, hipY, shY, cy } = G;
    const O = outfit(p), ex = O.ex, o = ol(1.4);
    const skin = p.skin || Art.SKINS[1];
    const grayT = p.gray === true ? 1 : clamp((p.age - 45) / 22, 0, 1) * (p.grayK == null ? 1 : p.grayK);
    const hc0 = p.hairC || '#3a2b28';
    const hc = grayT > 0 && /^#[0-9a-f]{6}$/i.test(hc0) ? mixHex(hc0, '#dedad5', grayT) : hc0;
    let hs = p.hair || (p.g === 'F' ? 'bob' : 'short');
    if (p.age < 2.5) hs = 'tuft';
    else if (p.age < 5 && (hs === 'long' || hs === 'bun')) hs = 'bob';
    if (p.wear === 'army' && p.g === 'M') hs = 'buzz';
    if (ex.includes('bunny')) hs = 'none';
    const tw = torW / 2, lw = (torW - 2) / 2;
    const aw = Math.max(5, torW * 0.24), armL = torL * 0.92;
    const pose = p.pose || 'idle';
    let s = E_(0, 1, torW * 0.72, 3, '#000', 'opacity=".12"');
    if (hs !== 'none') s += bHairBack(hs, G, hc, o);
    if (ex.includes('veil')) s += R_(-hw / 2 - 5, cy - hh / 2 - 3, hw + 10, (-legL * 0.4) - (cy - hh / 2 - 3), '#ffffff', 6, 'opacity=".75" stroke="#e9e2ee" stroke-width="1"');
    // 腿
    if (O.legs === 'gown') {
      s += P_(`M ${f1(-tw + 1)} ${f1(hipY - 3)} L ${f1(tw - 1)} ${f1(hipY - 3)} L ${f1(tw + 5)} 0 L ${f1(-tw - 5)} 0 Z`, O.bottom, o);
    } else {
      for (const sx of [-1, 1]) {
        const x = sx < 0 ? -tw + 0.5 : 1;
        const legC = O.legs === 'pants' ? O.bottom : skin;
        s += R_(x, hipY, lw - 0.5, legL - 0.5, legC, 2, o);
        if (O.legs === 'shorts' || O.legs === 'skirt') s += R_(x, hipY, lw - 0.5, legL * (O.legs === 'shorts' ? 0.42 : 0.2), O.bottom, 2, o);
        if (O.legs === 'skirt' || O.legs === 'shorts') s += R_(x + 0.6, -legL * 0.36, lw - 1.7, legL * 0.24, '#ffffff', 1);
        s += R_(x - 0.5, -3.6, lw + 0.5, 3.8, O.shoe, 1.5, o);
      }
      if (O.legs === 'skirt') s += P_(`M ${f1(-tw)} ${f1(hipY - 3)} L ${f1(tw)} ${f1(hipY - 3)} L ${f1(tw + 2.5)} ${f1(hipY + legL * 0.5)} L ${f1(-tw - 2.5)} ${f1(hipY + legL * 0.5)} Z`, O.bottom, o) +
        (O.plaid ? P_(`M ${f1(-tw * 0.4)} ${f1(hipY - 2)} L ${f1(-tw * 0.45)} ${f1(hipY + legL * 0.5)} M ${f1(tw * 0.4)} ${f1(hipY - 2)} L ${f1(tw * 0.45)} ${f1(hipY + legL * 0.5)}`, 'none', `stroke="${shade(O.bottom, 0.3)}" stroke-width="1.2"`) : '');
    }
    // 臀部方塊
    if (O.legs !== 'gown') s += R_(-tw, hipY - 3.2, torW, 4, O.legs === 'pants' || O.legs === 'shorts' || O.legs === 'skirt' ? O.bottom : O.bottom, 1.5, o);
    // 手臂
    const angs = { idle: [6, -6], wave: [6, -150], cheer: [150, -150], hips: [28, -28] }[pose] || [6, -6];
    const sleeveC = ex.includes('labcoat') ? '#ffffff' : O.top;
    const arm = side => {
      const ang = side < 0 ? angs[0] : angs[1];
      const x0 = side * (tw + aw / 2 - 1.2), y0 = shY + 1.5;
      const sl = O.sleeve === 'long' ? armL : O.sleeve === 'none' ? 0 : armL * 0.45;
      let g = `<g transform="rotate(${ang} ${f1(x0)} ${f1(y0)})">`;
      g += R_(x0 - aw / 2, y0, aw, armL, skin, 2.5, o);
      if (sl) g += R_(x0 - aw / 2, y0, aw, sl, sleeveC, 2.5, o);
      g += R_(x0 - aw / 2 - 0.3, y0 + armL - 1, aw + 0.6, aw * 0.9, skin, 2, o);
      return g + '</g>';
    };
    const upL = pose === 'cheer', upR = pose === 'wave' || pose === 'cheer';
    if (!upL) s += arm(-1);
    if (!upR) s += arm(1);
    // 身體
    const open = ex.includes('labcoat') || ex.includes('cardigan') || ex.includes('lapel');
    s += R_(-tw, shY, torW, torL + 0.5, open && O.inner ? O.inner : O.top, 3, o);
    if (open) {
      const cc = O.top, w2 = tw - 2.6;
      s += R_(-tw, shY, w2, torL + 0.5, cc, 3, o) + R_(tw - w2, shY, w2, torL + 0.5, cc, 3, o);
      if (ex.includes('lapel')) s += P_(`M -2.6 ${f1(shY)} L ${f1(-tw * 0.5)} ${f1(shY + torL * 0.35)} M 2.6 ${f1(shY)} L ${f1(tw * 0.5)} ${f1(shY + torL * 0.35)}`, 'none', `stroke="${shade(cc, -0.3)}" stroke-width="1.2"`);
    }
    if (ex.includes('collar')) s += P_(`M -5 ${f1(shY)} L 0 ${f1(shY + 4)} L 5 ${f1(shY)} L 3 ${f1(shY - 0.6)} L 0 ${f1(shY + 1.8)} L -3 ${f1(shY - 0.6)} Z`, '#ffffff', o);
    if (ex.includes('collarRound')) s += R_(-5, shY - 0.5, 10, 3, '#ffffff', 1.5, o);
    if (ex.includes('tie')) s += R_(-1.5, shY + 2.5, 3, torL * 0.6, O.tieC || '#c84b4b', 1, o);
    if (ex.includes('bow')) s += R_(-4.5, shY + 1.5, 9, 3.5, O.tieC || '#c84b4b', 1.2, o);
    if (ex.includes('bowtie')) s += R_(-4, shY + 1, 8, 3, '#1f1b1a', 1);
    if (ex.includes('badge')) s += R_(-tw + 3, shY + torL * 0.3, 4.5, 3, '#e8655a', 1);
    if (ex.includes('nametag')) s += R_(-tw + 3, shY + torL * 0.3, 6, 4, '#ffffff', 1, `stroke="${OL}" stroke-width=".8"`);
    if (ex.includes('buttons') || ex.includes('buttonsLine') || ex.includes('buttons2')) for (let i = 0; i < 3; i++) s += R_(-0.9, shY + 4 + i * (torL - 7) / 2.5, 1.8, 1.8, shade(O.top, -0.35), 0.4);
    if (ex.includes('pocket')) s += R_(-torW * 0.22, shY + torL * 0.55, torW * 0.44, torL * 0.25, shade(O.top, -0.08), 1.5, `stroke="${shade(O.top, -0.3)}" stroke-width="1"`);
    if (ex.includes('stripe')) s += R_(-tw + 0.7, shY + torL * 0.45, torW - 1.4, 3.2, shade(O.top, -0.2), 0);
    if (ex.includes('camo')) for (const [x, y, w] of [[-7, 4, 5], [3, 8, 6], [-4, 13, 4], [5, 15, 4]]) s += R_(x * torW / 26, shY + y * torL / 22, w, 3, '#4e5a36', 1, 'opacity=".75"');
    if (ex.includes('belt')) s += R_(-tw + 0.5, hipY - 3.5, torW - 1, 2.6, '#3c3a2e', 0.8) + R_(-1.6, hipY - 3.7, 3.2, 3, '#d9c27a', 0.6);
    if (ex.includes('vest')) s += R_(-tw + 0.7, shY + 0.7, tw - 3, torL - 0.5, O.vestC, 2) + R_(3, shY + 0.7, tw - 3.7, torL - 0.5, O.vestC, 2) + R_(-tw + 1, shY + torL * 0.45, torW - 2, 1.6, '#f7e36a', 0.5);
    if (ex.includes('vneck')) s += P_(`M -4 ${f1(shY)} L 0 ${f1(shY + 5)} L 4 ${f1(shY)}`, 'none', `stroke="${shade(O.top, -0.35)}" stroke-width="1.3"`);
    if (ex.includes('stetho')) s += P_(`M -4 ${f1(shY + 1)} L -4 ${f1(shY + torL * 0.5)} L 4 ${f1(shY + torL * 0.5)} L 4 ${f1(shY + 1)}`, 'none', 'stroke="#4a5568" stroke-width="1.2"') + R_(-1.8, shY + torL * 0.5, 3.6, 3.6, '#9aa6b8', 1, 'stroke="#4a5568" stroke-width="1"');
    if (ex.includes('apron')) s += R_(-tw * 0.75, shY + torL * 0.22, tw * 1.5, torL * 0.78 + legL * 0.4, O.apronC, 2, o);
    if (ex.includes('zip')) s += R_(-0.5, shY + 1, 1, torL - 1, shade(O.top, -0.35));
    if (ex.includes('reflect')) s += R_(-tw + 0.7, shY + torL * 0.62, torW - 1.4, 2.2, '#e8eef2', 0.5);
    if (ex.includes('hood')) s += R_(-tw * 0.8, shY - 2.5, tw * 1.6, 4, shade(O.top, -0.12), 2, o);
    if (ex.includes('necklace')) s += P_(`M -5 ${f1(shY + 1)} L 0 ${f1(shY + 5)} L 5 ${f1(shY + 1)}`, 'none', 'stroke="#f5d06b" stroke-width="1.2"');
    // 脖子與頭
    s += R_(-3.5, shY - 2.5, 7, 3.5, skin, 1);
    if (ex.includes('bunny')) {
      s += R_(-hw / 2 - 2.5, cy - hh / 2 - 2.5, hw + 5, hh + 5, '#f3f6fb', 7, o);
      s += R_(-hw / 2 + 2, cy - hh * 0.22, hw - 4, hh * 0.55, skin, 4, o);
      s += face(p.mood === 'happy' ? 'happy' : 'normal', hh * 0.5, cy, false);
    } else {
      s += R_(-hw / 2, cy - hh / 2, hw, hh, skin, 6.5, o);
      s += face(p.mood || 'normal', hh * 0.5, cy, p.glasses);
      if (p.age >= 58) {
        const R = hh * 0.5, wo = clamp((p.age - 55) / 30, 0.25, 0.75), ey = cy + R * 0.2, exx = R * 0.42, my = cy + R * 0.55;
        const ws = `stroke="${shade(skin, -0.32)}" stroke-width="1" stroke-linecap="round" fill="none" opacity="${f1(wo)}"`;
        s += P_(`M ${f1(-exx - R * 0.28)} ${f1(ey - R * 0.05)} l ${f1(-R * 0.1)} ${f1(-R * 0.05)} M ${f1(-exx - R * 0.28)} ${f1(ey + R * 0.05)} l ${f1(-R * 0.1)} ${f1(R * 0.04)} M ${f1(exx + R * 0.28)} ${f1(ey - R * 0.05)} l ${f1(R * 0.1)} ${f1(-R * 0.05)} M ${f1(exx + R * 0.28)} ${f1(ey + R * 0.05)} l ${f1(R * 0.1)} ${f1(R * 0.04)}`, 'none', ws);
        if (p.age >= 68) s += P_(`M ${f1(-R * 0.32)} ${f1(my - R * 0.2)} l ${f1(-R * 0.04)} ${f1(R * 0.22)} M ${f1(R * 0.32)} ${f1(my - R * 0.2)} l ${f1(R * 0.04)} ${f1(R * 0.22)}`, 'none', ws);
      }
      if (hs !== 'none') s += bHairFront(hs, G, hc, o);
    }
    // 帽子
    const htop = cy - hh / 2;
    if (ex.includes('chefhat')) s += R_(-hw / 2 + 1, htop - 12, hw - 2, 14, '#ffffff', 5, o);
    if (ex.includes('workcap')) s += R_(-hw / 2 - 1, htop - 3, hw + 2, 8, O.top, 3, o) + R_(hw / 2 - 4, htop + 3, 11, 3, shade(O.top, -0.2), 1.5, o);
    if (p.hat === 'kinder') s += R_(-hw / 2 - 1, htop - 4, hw + 2, 9, '#ffd34d', 4, o) + R_(-hw / 2 - 4, htop + 3.5, hw + 8, 3, '#ffd34d', 1.5, o);
    if (p.hat === 'army') s += R_(-hw / 2 - 1, htop - 3, hw + 2, 8, '#5f6c40', 3, o) + R_(-hw / 2 - 2, htop + 4, hw + 4, 2.5, '#4e5a36', 1, o);
    if (p.hat === 'grad') s += P_(`M ${f1(-hw * 0.7)} ${f1(htop - 2)} L 0 ${f1(htop - 7)} L ${f1(hw * 0.7)} ${f1(htop - 2)} L 0 ${f1(htop + 3)} Z`, '#2b2b36', o) + P_(`M ${f1(hw * 0.55)} ${f1(htop - 2)} L ${f1(hw * 0.6)} ${f1(htop + 8)}`, 'none', 'stroke="#f5c24b" stroke-width="1.6"');
    if (upL) s += arm(-1);
    if (upR) s += arm(1);
    if (p.cane && !upR) {
      const hx = tw + aw / 2 - 1.2 + armL * 0.1, hy = shY + 1.5 + armL;
      s += R_(hx + 1.5, hy - 2, 2.2, -hy + 2, '#8a5a3c', 1) + R_(hx - 2, hy - 3, 5.5, 2.2, '#8a5a3c', 1);
    }
    if (p.bag && !upR) s += P_(`M ${f1(-tw + 2)} ${f1(shY + 1)} L ${f1(tw - 3)} ${f1(hipY - 2)}`, 'none', `stroke="${p.bag}" stroke-width="2.4" stroke-linecap="round"`);
    return `<g>${s}</g>`;
  };
  Art.chibi = Art.person;
  Art.person = Art.blockPerson;
  Art.headTop = function (p) {
    if (p.age < 1.3) return -46;
    const G = bgeo(p.age, p.g, p.bmi);
    return G.cy - G.hh / 2 - 6;
  };
  Art.headshot = function (p, size) {
    let cy, v;
    if (p.age < 1.3) { cy = -32; v = 34; }
    else { const G = bgeo(p.age, p.g, p.bmi); cy = G.cy; v = G.hh * 1.9; }
    return `<svg width="${size}" height="${size}" viewBox="${f1(-v / 2)} ${f1(cy - v * 0.5)} ${f1(v)} ${f1(v)}" xmlns="http://www.w3.org/2000/svg">${Art.person(p)}</svg>`;
  };
  Art.HAIR_C = HAIR_C;
})(typeof window !== 'undefined' ? window : globalThis);
