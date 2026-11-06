/* ============================================================
 * 人生遊戲 · 遊戲引擎
 * 版本 0.1.0（里程碑 1：0–18 歲純文字原型）
 * 這個檔案只處理規則與狀態，不碰畫面；畫面在 ui.js。
 * ============================================================ */
(function (root) {
  'use strict';

  const LG = (root.LG = root.LG || {});
  LG.version = '0.8.0';
  LG.SAVE_VERSION = 5;
  LG.events = LG.events || [];
  LG.addEvents = function (arr) { for (const e of arr) LG.events.push(e); };

  let S = null;           // 目前這一局的完整狀態（可直接存檔）
  let EV_INDEX = null;    // id → 事件

  /* ---------------- 亂數（可存檔、可重現） ---------------- */
  function rand() {
    S.rng = (S.rng + 0x6D2B79F5) | 0;
    let t = S.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const rf = (a, b) => a + rand() * (b - a);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const chance = p => rand() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const avg = arr => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  function gauss() {
    let u = 0, v = 0;
    while (!u) u = rand();
    while (!v) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function wpick(items, wf) {
    let tot = 0;
    const ws = items.map(x => { const w = Math.max(0, wf(x)); tot += w; return w; });
    if (tot <= 0) return null;
    let r = rand() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r < 0) return items[i]; }
    return items[items.length - 1];
  }

  /* ---------------- 基本資料 ---------------- */
  const STATS = { hp: '健康', iq: '智力', ch: '魅力', md: '情緒', ft: '體能', cr: '創造力' };
  const STAT_KEYS = Object.keys(STATS);
  const CAT = { d: '日常', o: '機會', x: '挑戰', f: '命運', s: '人生關卡' };

  const ZODIAC = {
    '牡羊座': [3, 4], '金牛座': [4, 5], '雙子座': [5, 6], '巨蟹座': [6, 7],
    '獅子座': [7, 8], '處女座': [8, 9], '天秤座': [9, 10], '天蠍座': [10, 11],
    '射手座': [11, 12], '摩羯座': [12, 1], '水瓶座': [1, 2], '雙魚座': [2, 3]
  };

  const WEALTH = [null,
    { n: '貧困', w: 12, allow: 0.3, red: 0.4 },
    { n: '小康', w: 30, allow: 0.7, red: 0.7 },
    { n: '中產', w: 35, allow: 1, red: 1 },
    { n: '富裕', w: 18, allow: 1.8, red: 1.6 },
    { n: '豪門', w: 5, allow: 3, red: 3 }
  ];

  // [名稱, 類型, 抽中權重]
  const CITIES = [
    ['台北市', 'city', 11], ['新北市', 'city', 17], ['桃園市', 'city', 10], ['台中市', 'city', 12],
    ['台南市', 'city', 8], ['高雄市', 'city', 12], ['新竹市', 'city', 2], ['基隆市', 'town', 2],
    ['新竹縣', 'town', 2.5], ['苗栗縣', 'town', 2.5], ['彰化縣', 'town', 5], ['南投縣', 'rural', 2],
    ['雲林縣', 'rural', 3], ['嘉義市', 'town', 1.2], ['嘉義縣', 'rural', 2], ['屏東縣', 'rural', 3.5],
    ['宜蘭縣', 'town', 2], ['花蓮縣', 'rural', 1.4], ['台東縣', 'rural', 1], ['澎湖縣', 'rural', 0.5],
    ['金門縣', 'rural', 0.6], ['連江縣', 'rural', 0.1]
  ];
  const TIER_N = { city: '都市', town: '鄉鎮', rural: '偏鄉' };

  const STRUCTS = {
    both: { n: '雙親家庭', w: 80 },
    mom: { n: '單親（和媽媽住）', w: 8 },
    dad: { n: '單親（和爸爸住）', w: 4 },
    grand: { n: '隔代教養（阿公阿嬤帶大）', w: 8 }
  };

  const SURN = '陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周徐蘇葉莊呂江何蕭羅高'.split('');
  const GIV_M = ['宇翔', '冠宇', '承恩', '柏翰', '品睿', '宥廷', '家豪', '俊傑', '彥廷', '子睿', '宸睿', '承翰',
    '冠廷', '睿恩', '宇恩', '柏宇', '哲瑋', '建宏', '昱辰', '晨皓', '允浩', '奕安', '翊瑋', '聖傑'];
  const GIV_F = ['怡君', '雅婷', '詩涵', '品妍', '子晴', '宜蓁', '語彤', '芯妤', '心妍', '宥蓁', '佳穎', '欣妤',
    '思妤', '若曦', '予安', '采潔', '詠晴', '佩珊', '雅雯', '以樂', '書妍', '沛恩', '可馨', '筱涵'];
  const PET_NAMES = ['小黑', '小白', '豆豆', '球球', '布丁', '麻糬', '旺財', '咪咪', '黑糖', '奶茶', '可樂', '饅頭'];

  // 隱藏特質：開局隨機 2–3 個，玩的過程中慢慢被「發現」
  const TRAITS = {
    '樂觀': { d: '壞事對情緒的打擊比較小。', mdNeg: 0.7, mdDrift: 0.3 },
    '焦慮體質': { d: '比較容易累積壓力。', stPos: 1.3, mdDrift: -0.2 },
    '天生運動神經': { d: '體能成長特別快。', grow: { ft: 1.5 } },
    '過敏體質': { d: '比較容易生病。', sick: 1.8, hpNeg: 1.2 },
    '語言天賦': { d: '學語言特別快，智力成長也快一些。', grow: { iq: 1.2 } },
    '冒險性格': { d: '機會常找上門，冒險的選擇成功率較高。', opp: 1.3, chk: 6 },
    '念舊': { d: '朋友間的感情不容易變淡。', decay: 0.4 },
    '早熟': { d: '比同齡人懂事，叛逆期比較短。', rebel: 0.5, grow: { iq: 1.05 } },
    '數學腦': { d: '理科特別好，成績加分。', grade: 4 },
    '藝術天分': { d: '創造力成長特別快。', grow: { cr: 1.5 } },
    '社交達人': { d: '魅力成長加快，容易交到朋友。', grow: { ch: 1.4 }, friend: 1.5 },
    '內向': { d: '魅力成長較慢，但想像力更豐富。', grow: { ch: 0.8, cr: 1.2 } },
    '完美主義': { d: '成績較好，但壓力也比較大。', grade: 2, stPos: 1.15 },
    '心軟': { d: '樂於助人，人際好感上升更多。', relPos: 1.2 },
    '好奇心旺盛': { d: '智力與創造力都成長得快一些。', grow: { iq: 1.1, cr: 1.1 } },
    '夜貓子': { d: '晚上精神特別好，但健康稍受影響。', hpDrift: -0.03, grow: { cr: 1.1 } }
  };
  const TRAIT_CONFLICT = [['樂觀', '焦慮體質'], ['內向', '社交達人']];

  const ACH = {
    '天才寶寶': '5 歲前智力就很突出',
    '小小藝術家': '12 歲前創造力達到 75',
    '全勤獎': '一整個學年沒有請過病假',
    '書卷獎': '學期成績達到 92 分以上',
    '運動健將': '體能達到 80',
    '校園風雲人物': '青少年期魅力達到 80',
    '熱心助人': '做了很多幫助別人的事',
    '人緣王': '同時有 5 位以上的好朋友',
    '會考五A++': '國中會考拿到 5A++',
    '金榜題名': '考上頂尖國立大學',
    '逆轉人生': '出身貧困，卻考上國立大學以上',
    '小富翁': '18 歲時存款超過 10 萬元',
    '社會新鮮人': '找到第一份正職工作',
    '光榮退伍': '服完兵役',
    '大學畢業': '拿到學士學位',
    '碩士學位': '拿到碩士學位',
    '鐵飯碗': '考上公務員',
    '升官發財': '在工作上獲得升職',
    '孝順的孩子': '每月給家人 6,000 元以上孝親費',
    '第一桶金': '存款達到 100 萬元',
    '投資有成': '投資帳戶超過 300 萬元',
    '有情人終成眷屬': '和心愛的人結婚',
    '新手爸媽': '迎接第一個孩子',
    '買房成家': '買下自己的房子',
    '才藝大師': '把一項技能練到專業級',
    '退休樂活': '順利退休',
    '含飴弄孫': '當上阿公或阿嬤',
    '長命百歲': '活到 80 歲',
    '人生回憶錄': '把自己的人生故事寫成一本書',
    '股市新手': '第一次買進股票',
    '夢想成真': '實現自己設定的生涯目標',
    '職業達人': '職業挑戰拿到幾乎滿分',
    '股市贏家': '在股市累計賺到 100 萬元',
    '金婚': '結婚滿 50 年',
    '千萬富翁': '淨資產超過 1,000 萬元',
    '圓滿人生': '活到 99 歲'
  };

  const STAGES = [
    { k: 'infant', n: '嬰兒期', a0: 0, a1: 3 },
    { k: 'toddler', n: '幼兒期', a0: 3, a1: 6 },
    { k: 'child', n: '童年期', a0: 6, a1: 12 },
    { k: 'teen', n: '青少年期', a0: 12, a1: 18 },
    { k: 'young', n: '青年期', a0: 18, a1: 30 },
    { k: 'mid', n: '成家立業期', a0: 30, a1: 45 },
    { k: 'middle', n: '中年期', a0: 45, a1: 60 },
    { k: 'early', n: '初老期', a0: 60, a1: 75 },
    { k: 'late', n: '晚年期', a0: 75, a1: 100 }
  ];

  const SCHOOL_N = { none: '尚未就學', kinder: '幼兒園', elem: '國小', junior: '國中', senior: '高中', voc: '高職', jc: '五專', uni: '大學', grad: '研究所', done: '畢業' };
  const FAMILY_ROLES = ['mom', 'dad', 'grandma', 'grandpa', 'sib', 'spouse', 'child', 'grandchild'];
  const ALLOC_KEYS = { study: '讀書', sport: '運動', social: '交友', leisure: '休閒', art: '才藝興趣' };
  const PREFS = { active: '活潑好動', quiet: '安靜專注', social: '愛交朋友' };

  /* ---------------- 小工具 ---------------- */
  const ageY = () => S.ageM / 12;
  function money(base) { return Math.round((base * S.cpi) / 10) * 10; }
  function fmtMoney(n) { return (n < 0 ? '-' : '') + Math.abs(Math.round(n)).toLocaleString('en-US') + ' 元'; }
  function ageText(m) { const y = Math.floor(m / 12), mm = m % 12; return y + ' 歲' + (mm ? ' ' + mm + ' 個月' : ''); }
  function stageOf(m) { const a = m / 12; return STAGES.find(s => a >= s.a0 && a < s.a1) || STAGES[STAGES.length - 1]; }
  function inSchool() { return ['elem', 'junior', 'senior', 'voc', 'jc', 'uni', 'grad'].includes(S.school.stage); }
  function hasTrait(t) { return S.traits.some(x => x.k === t); }
  function tMul(p) { let v = 1; for (const x of S.traits) { const T = TRAITS[x.k]; if (T && typeof T[p] === 'number') v *= T[p]; } return v; }
  function tAdd(p) { let v = 0; for (const x of S.traits) { const T = TRAITS[x.k]; if (T && typeof T[p] === 'number') v += T[p]; } return v; }
  function tGrow(k) { let v = 1; for (const x of S.traits) { const T = TRAITS[x.k]; if (T && T.grow && T.grow[k]) v *= T.grow[k]; } return v; }

  /* ---------------- 人物（NPC） ---------------- */
  function npc(id) { return S.npcs.find(n => n.id === id); }
  function npcsBy(role) { return S.npcs.filter(n => n.role === role && n.alive); }
  function addNpc(o) {
    o.id = 'n' + S.nid++;
    o.alive = true;
    o.since = S.ageM;
    S.npcs.push(o);
    const fr = npcsBy('friend');
    if (o.role === 'friend' && fr.length > 6) {
      const low = fr.filter(n => n !== o).sort((a, b) => a.rel - b.rel)[0];
      if (low) low.role = 'oldfriend';
    }
    return o;
  }
  function npcLabel(n) {
    if (!n) return '';
    switch (n.role) {
      case 'mom': return '媽媽';
      case 'dad': return '爸爸';
      case 'grandma': return '阿嬤';
      case 'grandpa': return '阿公';
      case 'sib': return (n.older ? (n.g === 'M' ? '哥哥' : '姊姊') : (n.g === 'M' ? '弟弟' : '妹妹')) + n.name;
      default: return n.name;
    }
  }
  function roleName(n) {
    const map = { mom: '媽媽', dad: '爸爸', grandma: '阿嬤', grandpa: '阿公', friend: '朋友', crush: S.tags.includes('交往中') ? '男女朋友' : '喜歡的人', oldfriend: '老朋友', sib: '手足', spouse: '另一半', child: '孩子', grandchild: '孫子女', colleague: '同事', ex: '前任' };
    return map[n.role] || '';
  }
  function caregivers() {
    const st = S.fam.struct;
    const roles = st === 'both' ? ['mom', 'dad'] : st === 'mom' ? ['mom'] : st === 'dad' ? ['dad'] : ['grandma', 'grandpa'];
    let list = S.npcs.filter(n => n.alive && roles.includes(n.role));
    if (!list.length) list = S.npcs.filter(n => n.alive && ['mom', 'dad'].includes(n.role));
    return list;
  }
  function parentsWord() {
    const st = S.fam.struct;
    if (st === 'both') return '爸媽';
    if (st === 'mom') return '媽媽';
    if (st === 'dad') return '爸爸';
    const g = caregivers().map(npcLabel);
    return g.length === 2 ? '阿公阿嬤' : g[0] || '家人';
  }
  function famRelAvg() {
    const c = caregivers();
    return c.length ? avg(c.map(n => n.rel)) : 30;
  }
  function closeRelAvg() {
    const list = S.npcs.filter(n => n.alive && (FAMILY_ROLES.includes(n.role) || n.role === 'friend' || n.role === 'crush') && !n.far);
    return list.length ? avg(list.map(n => n.rel)) : 0;
  }
  function genName(g) {
    const used = new Set(S.npcs.map(n => n.name).concat([S.nick]));
    const pool = (g === 'M' ? GIV_M : GIV_F).filter(x => !used.has(x));
    return pick(pool.length ? pool : (g === 'M' ? GIV_M : GIV_F));
  }

  /* ---------------- 佔位字（事件文字中的 {xxx}） ---------------- */
  const TOKEN_RE = /\{(\w+)\}/g;
  const KNOWN_TOKENS = ['name', 'fullname', 'city', 'school', 'zodiac', 'parents', 'amt', 'wage', 'teacher', 'pet',
    'mom', 'dad', 'grandma', 'grandpa', 'grand', 'parent', 'sib', 'friend', 'bff', 'newfriend', 'crush', 'newcrush', 'year',
    'spouse', 'child', 'partner', 'colleague', 'job', 'company', 'salary', 'major', 'uni', 'boss', 'house', 'down', 'gkid'];

  function collectTokens(e) {
    const strs = [];
    const add = v => { if (!v) return; if (Array.isArray(v)) v.forEach(add); else if (typeof v === 'string') strs.push(v); };
    add(e.t); add(e.r); add(e.title);
    (e.ch || []).forEach(c => { add(c.t); add(c.r); if (c.ok) add(c.ok.r); if (c.no) add(c.no.r); });
    const set = new Set();
    for (const s of strs) { let m; TOKEN_RE.lastIndex = 0; while ((m = TOKEN_RE.exec(s))) set.add(m[1]); }
    // 效果裡用到的人物也要能綁定
    const relKeys = [];
    const addRel = fx => { if (fx && fx.rel) relKeys.push(...Object.keys(fx.rel)); if (fx && fx.kill && typeof fx.kill === 'string') relKeys.push(fx.kill); };
    addRel(e.fx);
    (e.ch || []).forEach(c => { addRel(c.fx); if (c.ok) addRel(c.ok.fx); if (c.no) addRel(c.no.fx); });
    for (const k of relKeys) if (['mom', 'dad', 'grandma', 'grandpa', 'grand', 'sib', 'friend', 'bff', 'crush', 'spouse', 'child', 'partner', 'colleague', 'gkid', 'newfriend', 'newcrush'].includes(k)) set.add(k);
    return set;
  }

  function bindToken(k, b) {
    if (k in b) return true;
    switch (k) {
      case 'mom': case 'dad': case 'grandma': case 'grandpa': {
        const n = npcsBy(k)[0];
        if (!n) return false;
        b[k] = n.id; return true;
      }
      case 'grand': {
        const g = S.npcs.filter(n => n.alive && (n.role === 'grandma' || n.role === 'grandpa'));
        if (!g.length) return false;
        b.grand = pick(g).id; return true;
      }
      case 'parent': { const c = caregivers(); if (!c.length) return false; b.parent = pick(c).id; return true; }
      case 'sib': { const s = npcsBy('sib'); if (!s.length) return false; b.sib = pick(s).id; return true; }
      case 'friend': { const f = npcsBy('friend').filter(n => n.rel > -30); if (!f.length) return false; b.friend = pick(f).id; return true; }
      case 'bff': {
        const f = npcsBy('friend').filter(n => n.rel >= 55).sort((x, y) => y.rel - x.rel);
        if (!f.length) return false;
        b.bff = f[0].id; return true;
      }
      case 'crush': { const c = npcsBy('crush'); if (!c.length) return false; b.crush = c[0].id; return true; }
      case 'newfriend': { const g = chance(0.5) ? 'M' : 'F'; b.newfriend = { name: genName(g), g }; return true; }
      case 'newcrush': {
        const g = S.gender === 'M' ? (chance(0.9) ? 'F' : 'M') : (chance(0.9) ? 'M' : 'F');
        b.newcrush = { name: genName(g), g }; return true;
      }
      case 'pet': return !!(S.pet && S.pet.alive);
      case 'spouse': { const n = npcsBy('spouse')[0]; if (!n) return false; b.spouse = n.id; return true; }
      case 'child': { const c = kids(); if (!c.length) return false; b.child = pick(c).id; return true; }
      case 'gkid': { const c = npcsBy('grandchild'); if (!c.length) return false; b.gkid = pick(c).id; return true; }
      case 'partner': { const n = npcsBy('spouse')[0] || (S.tags.includes('交往中') && npcsBy('crush')[0]); if (!n) return false; b.partner = n.id; return true; }
      case 'colleague': {
        const c = npcsBy('colleague').filter(n => n.rel > -30);
        if (c.length && (c.length >= 5 || chance(0.75))) { b.colleague = pick(c).id; return true; }
        const g = chance(0.5) ? 'M' : 'F';
        b.colleague = addNpc({ role: 'colleague', name: genName(g), g, rel: 10 }).id;
        return true;
      }
      case 'job': case 'company': case 'salary': return !!S.job;
      default: return true;
    }
  }

  function bindEvent(e) {
    const b = {};
    const tok = e._tok || (e._tok = collectTokens(e));
    for (const k of tok) if (!bindToken(k, b)) return null;
    return b;
  }

  function render(s, b, e) {
    if (s == null) return '';
    if (Array.isArray(s)) s = s[0];
    return String(s).replace(TOKEN_RE, (m, k) => {
      switch (k) {
        case 'name': return S.nick;
        case 'fullname': return S.name;
        case 'city': return S.city.n;
        case 'school': return S.school.name || '學校';
        case 'zodiac': return S.zodiac;
        case 'parents': return parentsWord();
        case 'amt': return fmtMoney(money((e && e.amt) || 0));
        case 'wage': return S.wageH + ' 元';
        case 'teacher': return '老師';
        case 'year': return String(S.year);
        case 'pet': return S.pet ? S.pet.name : '';
        case 'newfriend': case 'newcrush': return b && b[k] ? b[k].name : '';
        case 'job': return S.job ? S.job.n : '工作';
        case 'company': return S.job ? S.job.co : '公司';
        case 'salary': return S.job ? fmtMoney(S.job.pay) : '';
        case 'major': return (S.path && S.path.major) || S.school.dept || '科系';
        case 'uni': return S.school.uniName || S.school.name || '學校';
        case 'boss': return '主管';
        case 'house': return fmtMoney(housePrice());
        case 'down': return fmtMoney(downPay());
        default: return b && b[k] ? npcLabel(npc(b[k])) : m;
      }
    });
  }

  /* ---------------- 效果 ---------------- */
  function relTargets(rk, b) {
    switch (rk) {
      case 'parents': return caregivers();
      case 'family': return S.npcs.filter(n => n.alive && FAMILY_ROLES.includes(n.role));
      case 'friends': return npcsBy('friend');
      case 'kids': return kids();
      case 'colleagues': return npcsBy('colleague');
      case 'newfriend': {
        if (!b.newfriend) return [];
        if (!b._nf) b._nf = addNpc({ role: 'friend', name: b.newfriend.name, g: b.newfriend.g, rel: 15 }).id;
        return [npc(b._nf)];
      }
      case 'newcrush': {
        if (!b.newcrush) return [];
        if (!b._nc) {
          for (const old of npcsBy('crush')) old.role = 'friend';
          b._nc = addNpc({ role: 'crush', name: b.newcrush.name, g: b.newcrush.g, rel: 15 }).id;
        }
        return [npc(b._nc)];
      }
      default: {
        if (!b[rk] && !bindToken(rk, b)) return [];
        const n = npc(b[rk]);
        return n && n.alive ? [n] : [];
      }
    }
  }

  function applyRel(rk, d, b, out) {
    for (const n of relTargets(rk, b)) {
      let dd = d > 0 ? d * tMul('relPos') * 0.75 * Math.max(0.15, 1 - Math.max(0, n.rel) / 110) : d;
      const bf = n.rel;
      n.rel = clamp(n.rel + dd, -100, 100);
      const raw = n.rel - bf;
      if (Math.abs(raw) >= 0.05) out.push({ k: 'rel', n: npcLabel(n), v: Math.round(raw) || (raw > 0 ? 0.1 : -0.1) });
    }
  }

  // 一個月有 5 則事件，效果需要縮放，並且越接近滿分越難再往上
  const FX_SCALE = { hp: 0.45, iq: 0.17, ch: 0.17, ft: 0.17, cr: 0.17, md: 0.2 };
  function setStat(k, d, out) {
    const bf = S.st[k];
    let dd = d * (FX_SCALE[k] || 1);
    if (k === 'md' && dd < 0) dd *= 1.9; // 壞消息的打擊比好消息深
    if (dd > 0 && k !== 'md') dd *= Math.max(0.08, 1 - bf / 105);
    S.st[k] = clamp(S.st[k] + dd, 0, 100);
    pushChip(out, k, S.st[k] - bf);
  }
  function pushChip(out, k, raw) {
    if (Math.abs(raw) < 0.05) return;
    out.push({ k, v: Math.round(raw) || (raw > 0 ? 0.1 : -0.1) });
  }

  function applyFx(fx, b, out) {
    out = out || [];
    if (!fx) return out;
    b = b || {};
    for (const key of Object.keys(fx)) {
      const v = fx[key];
      if (STATS[key]) {
        let d = v;
        if (key === 'md' && d < 0) d *= tMul('mdNeg');
        if (key === 'hp' && d < 0) d *= tMul('hpNeg');
        setStat(key, d, out);
      } else if (key === 'st') {
        const d = (v > 0 ? v * tMul('stPos') : v) * 0.7;
        const bf = S.stress;
        S.stress = clamp(S.stress + d, 0, 100);
        pushChip(out, 'st', S.stress - bf);
      } else if (key === '$') {
        let amt = money(v);
        if (amt < 0 && S.money + amt < 0) amt = Math.min(0, -S.money);
        if (amt) { S.money += amt; out.push({ k: '$', v: amt }); }
      } else if (key === 'gr') {
        if (inSchool()) {
          const bf = S.grades;
          if (S.subj) for (const sk of Object.keys(S.subj)) S.subj[sk] = clamp(S.subj[sk] + v * 0.6, 0, 100);
          S.grades = clamp(S.grades + v * 0.6, 0, 100);
          pushChip(out, 'gr', S.grades - bf);
        }
      } else if (key === 'wt') {
        S.wOff = clamp(S.wOff + v, -8, 12);
      } else if (key === 'rel') {
        for (const rk of Object.keys(v)) applyRel(rk, v[rk], b, out);
      } else if (key === 'tag') {
        [].concat(v).forEach(t => { if (!S.tags.includes(t)) { S.tags.push(t); out.push({ k: 'tag', v: t }); } });
      } else if (key === 'untag') {
        [].concat(v).forEach(t => { S.tags = S.tags.filter(x => x !== t); });
      } else if (key === 'flag') {
        Object.assign(S.flags, v);
      } else if (key === 'cnt') {
        for (const ck of Object.keys(v)) S.flags[ck] = (S.flags[ck] || 0) + v[ck];
      } else if (key === 'contrib') {
        S.flags.contrib = (S.flags.contrib || 0) + v;
        out.push({ k: 'contrib', v });
      } else if (key === 'ach') {
        giveAch(v, out);
      } else if (key === 'reveal') {
        revealTrait(v, out);
      } else if (key === 'wealth') {
        const w = clamp(S.fam.wealth + v, 1, 5);
        if (w !== S.fam.wealth) { S.fam.wealth = w; out.push({ k: 'wealth', v: WEALTH[w].n }); }
      } else if (key === 'addSib') {
        addYoungerSib(v, out);
      } else if (key === 'kill') {
        killNpc(v, b, out);
      } else if (key === 'struct') {
        setStruct(v, out);
      } else if (key === 'move') {
        moveCity(out);
      } else if (key === 'pet') {
        S.pet = { name: pick(PET_NAMES), kind: v === true ? '狗' : v, alive: true, since: S.ageM };
        out.push({ k: 'pet', v: S.pet.kind + '「' + S.pet.name + '」' });
      } else if (key === 'petdie') {
        if (S.pet && S.pet.alive) { S.pet.alive = false; out.push({ k: 'loss', v: S.pet.name }); }
      } else if (key === 'sick') {
        S.flags.sickYear = (S.flags.sickYear || 0) + 1;
      } else if (key === '$n') {
        S.money += v; out.push({ k: '$', v });
      } else if (key === 'marry') {
        marry(b, out);
      } else if (key === 'breakup') {
        breakup(out);
      } else if (key === 'divorce') {
        divorce(out);
      } else if (key === 'baby') {
        if (!S.flags.babyDue) { S.flags.babyDue = S.ageM + 10; out.push({ k: 'tag', v: '準備迎接新生命' }); }
      } else if (key === 'home') {
        setHome(v, out);
      } else if (key === 'house') {
        buyHouse(out);
      } else if (key === 'invest') {
        S.inv.mon = money(v); out.push({ k: 'inv', v: S.inv.mon });
      } else if (key === 'cashout') {
        const amt = Math.round(S.inv.bal * v); S.inv.bal -= amt; S.money += amt; if (v >= 1) S.inv.mon = 0; out.push({ k: '$', v: amt });
      } else if (key === 'perf') {
        if (S.job) { S.job.perf = clamp(S.job.perf + v, 0, 100); out.push({ k: 'perf', v }); }
      } else if (key === 'raise') {
        if (S.job) { const old = S.job.pay; S.job.pay = Math.round(S.job.pay * (1 + v / 100) / 100) * 100; out.push({ k: 'pay', v: S.job.pay - old }); }
      } else if (key === 'quit') {
        if (S.job) { leaveJob('quit'); out.push({ k: 'tag', v: '離職' }); }
      } else if (key === 'hunt') {
        S.flags.hunt = true;
      } else if (key === 'loan') {
        addLoan(v.n, money(v.amt), money(v.pay)); S.money += money(v.amt); out.push({ k: '$', v: money(v.amt) });
      } else if (key === 'pt') {
        if (v && !S.tags.includes('打工族')) { S.tags.push('打工族'); out.push({ k: 'tag', v: '打工族' }); }
        if (!v) S.tags = S.tags.filter(t => t !== '打工族');
      }
    }
    if (S.st.hp <= 0) healthCrisis(out);
    return out;
  }

  function giveAch(name, out) {
    if (!ACH[name] || S.ach.includes(name)) return;
    S.ach.push(name);
    S.achAt[name] = S.ageM;
    if (out) out.push({ k: 'ach', v: name });
    S.toasts.push({ t: 'ach', v: name });
    addLog('成就', '解鎖成就「' + name + '」：' + ACH[name], 'ach');
  }

  function revealTrait(name, out) {
    const t = S.traits.find(x => x.k === name);
    if (!t || t.known) return;
    t.known = true;
    if (out) out.push({ k: 'trait', v: name });
    S.toasts.push({ t: 'trait', v: name });
    addLog('發現特質', '你發現自己有「' + name + '」的特質：' + TRAITS[name].d, 'trait');
  }

  function addYoungerSib(g, out) {
    if (S.fam.struct !== 'both' || ageY() > 12) return;
    const gg = g === 'M' || g === 'F' ? g : (chance(0.5) ? 'M' : 'F');
    const n = addNpc({ role: 'sib', name: genName(gg), g: gg, older: false, rel: 40, ageOff: -Math.round(ageY()) });
    out.push({ k: 'npc', v: npcLabel(n) });
    addLog('家人', npcLabel(n) + '出生了，你多了一個' + (gg === 'M' ? '弟弟' : '妹妹') + '。', 'family');
  }

  function killNpc(v, b, out) {
    let n = null;
    if (b && b[v]) n = npc(b[v]);
    if (!n) n = S.npcs.find(x => x.alive && x.role === v);
    if (!n || !n.alive) return;
    n.alive = false;
    n.diedAt = S.ageM;
    out.push({ k: 'loss', v: npcLabel(n) });
    addLog('離別', npcLabel(n) + '離開了這個世界。', 'loss');
    if (S.fam.struct === 'grand' && !S.npcs.some(x => x.alive && (x.role === 'grandma' || x.role === 'grandpa'))) {
      S.fam.struct = 'both';
      S.npcs.forEach(x => { if (x.role === 'mom' || x.role === 'dad') x.far = false; });
      addLog('家人', '爸媽回到家裡，開始自己照顧你。', 'family');
    }
  }

  function setStruct(v, out) {
    if (S.fam.struct !== 'both' || (v !== 'mom' && v !== 'dad')) return;
    S.fam.struct = v;
    const other = v === 'mom' ? 'dad' : 'mom';
    S.npcs.forEach(n => { if (n.role === other) { n.far = true; n.rel = clamp(n.rel - 10, -100, 100); } });
    if (!S.tags.includes('父母離異')) { S.tags.push('父母離異'); out.push({ k: 'tag', v: '父母離異' }); }
    addLog('家庭', '爸媽離婚了，你之後和' + (v === 'mom' ? '媽媽' : '爸爸') + '一起住。', 'family');
  }

  function moveCity(out) {
    const opts = CITIES.filter(c => c[0] !== S.city.n);
    const c = wpick(opts, x => x[2]);
    S.city = { n: c[0], tier: c[1] };
    out.push({ k: 'move', v: c[0] });
    if ((inSchool() || S.school.stage === 'kinder') && !['uni', 'grad'].includes(S.school.stage)) {
      S.school.name = makeSchoolName(S.school.stage, S.school.tier);
      npcsBy('friend').forEach(n => { n.rel = clamp(n.rel - 20, -100, 100); });
      if (!S.tags.includes('轉學生')) { S.tags.push('轉學生'); out.push({ k: 'tag', v: '轉學生' }); }
    }
    addLog('搬家', '全家搬到了' + c[0] + '。', 'move');
  }

  function healthCrisis(out) {
    // 健康歸零：先送醫急救。兒童有健保與家人照顧，大多能救回來。
    const surv = clamp(0.93 + S.fam.wealth * 0.01, 0, 0.98);
    if (chance(surv)) {
      S.st.hp = 18;
      if (!S.tags.includes('大病初癒')) S.tags.push('大病初癒');
      out && out.push({ k: 'tag', v: '大病初癒' });
      addLog('住院', '你的身體撐到了極限，緊急送醫後，終於脫離險境。', 'sick');
      S.flags.sickYear = (S.flags.sickYear || 0) + 1;
    } else {
      S.st.hp = 0;
      S.dead = true;
      S.ended = true;
      addLog('離世', '你在 ' + ageText(S.ageM) + ' 時離開了人世。', 'death');
    }
  }

  function addLog(title, text, kind) {
    S.log.push({ ageM: S.ageM, y: S.year, m: S.month, t: title, x: text, k: kind || 'ev' });
    if (S.log.length > 600) S.log.splice(0, S.log.length - 600);
  }

  /* ---------------- 事件抽選 ---------------- */
  const API = {
    age: () => ageY(), has: t => hasTrait(t), tag: t => S.tags.includes(t), inSchool: () => inSchool(),
    friends: () => npcsBy('friend').length, alive: r => S.npcs.some(n => n.alive && n.role === r),
    status: () => status(), ms: () => marital(), money: () => S.money, job: () => S.job, kids: () => kids().length,
    nw: () => netWorth(), canHouse: () => S.money >= downPay(), m: v => money(v), deg: () => degRank(), econ: () => S.econ.s
  };
  LG.H = API;

  function eligible(e, noChoice) {
    const a = ageY();
    if (e.a && (a < e.a[0] || a >= e.a[1])) return false;
    if (e.ch && noChoice) return false;
    if (S.done[e.id]) return false;
    const last = S.cd[e.id];
    if (last !== undefined && S.ageM - last < (e.cd != null ? e.cd : 24)) return false;
    if (e.g && e.g !== S.gender) return false;
    if (e.sc && !e.sc.includes(S.school.stage)) return false;
    if (e.tr && !hasTrait(e.tr)) return false;
    if (e.ntr && hasTrait(e.ntr)) return false;
    if (e.tag && !S.tags.includes(e.tag)) return false;
    if (e.ntag && S.tags.includes(e.ntag)) return false;
    if (e.wl && (S.fam.wealth < e.wl[0] || S.fam.wealth > e.wl[1])) return false;
    if (e.fs && !e.fs.includes(S.fam.struct)) return false;
    if (e.ct && !e.ct.includes(S.city.tier)) return false;
    if (e.mo && !e.mo.includes(S.month)) return false;
    if (e.stt && !e.stt.includes(status())) return false;
    if (e.jc && !(S.job && !S.job.paused && e.jc.includes(S.job.cat))) return false;
    if (e.ms && !e.ms.includes(marital())) return false;
    if (e.kid != null && (kids().length > 0) !== !!e.kid) return false;
    if (e.hm && !e.hm.includes(S.home)) return false;
    if (e.gkid && !npcsBy('grandchild').length) return false;
    if (e.c) { try { if (!e.c(S, API)) return false; } catch (err) { return false; } }
    return true;
  }

  function weightOf(e) {
    let w = typeof e.w === 'function' ? e.w(S, API) : (e.w != null ? e.w : 1);
    if (e.k === 'o') w *= tMul('opp');
    if (e.sick) w *= tMul('sick');
    if (e.tr) w *= 1.5;
    if (e.ch && ageY() >= 6) w *= 1.9;
    return w;
  }

  function successPct(chk) {
    const [stat, dc] = chk;
    let v;
    if (stat === 'luck') v = 50;
    else if (stat === 'st') v = 100 - S.stress;
    else if (stat === 'gr') v = S.grades;
    else v = S.st[stat];
    const p = clamp(0.5 + (v - dc) / 60 + tAdd('chk') / 100, 0.05, 0.95);
    return Math.round(p * 100);
  }

  function choiceDisabled(c) {
    const cost = c.fx && c.fx.$ < 0 ? -money(c.fx.$) : 0;
    if (cost && S.money < cost) return '存款不足（需要 ' + fmtMoney(cost) + '）';
    if (c.need && !c.need(S, API)) return c.needT || '條件不符';
    return null;
  }

  function evById(id) {
    if (!EV_INDEX || EV_INDEX.size !== LG.events.length) {
      EV_INDEX = new Map();
      for (const e of LG.events) EV_INDEX.set(e.id, e);
    }
    return EV_INDEX.get(id);
  }

  function makeEvItem(e, b) {
    const vi = Array.isArray(e.t) ? Math.floor(rand() * e.t.length) : 0;
    const text = render(Array.isArray(e.t) ? e.t[vi] : e.t, b, e);
    const item = { kind: 'ev', id: e.id, k: e.k || 'd', title: render(e.title, b, e) || CAT[e.k || 'd'], text, b, done: !e.ch, chips: [], res: '', sn: e.sn || null };
    S.cd[e.id] = S.ageM;
    if (e.once) S.done[e.id] = 1;
    if (e.ch) {
      item.choices = e.ch.map(c => ({ t: render(c.t, b, e), pct: c.chk ? successPct(c.chk) : null, dis: choiceDisabled(c) }));
      if (item.choices.every(c => c.dis)) item.choices.forEach(c => { c.dis = null; });
    } else {
      item.chips = applyFx(e.fx, b, []);
      if (e.sick) S.flags.sickYear = (S.flags.sickYear || 0) + 1;
      if (e.reveal || e.tr) revealTrait(e.reveal || e.tr, item.chips);
      const rv = Array.isArray(e.r) ? e.r[Math.floor(rand() * e.r.length)] : e.r;
      item.res = render(rv, b, e);
      if (e.imp || e.k === 'f') addLog(item.title, text + (item.res ? ' ' + item.res : ''), e.k === 'f' ? 'fate' : 'ev');
    }
    return item;
  }

  function drawMonth() {
    // 養成模式：每個月 1 則事件（優先有選項的），另有小機率的命運卡（意外）
    const pickOne = (list, wf) => {
      let cat = list.slice();
      let tries = 0;
      while (tries++ < 20 && cat.length) {
        const e = wpick(cat, wf);
        if (!e) break;
        const b = bindEvent(e);
        if (b) { S.cur.items.push(makeEvItem(e, b)); return true; }
        cat = cat.filter(x => x !== e);
      }
      return false;
    };
    const a = ageY();
    pickOne(LG.events.filter(e => (e.k || 'd') !== 'f' && eligible(e, a < 2)), e => weightOf(e) * (e.ch ? 3 : 1));
    if (a >= 1 && chance(0.014)) pickOne(LG.events.filter(e => e.k === 'f' && eligible(e, false)), weightOf);
  }

  /* ---------------- 人生關卡（系統卡） ---------------- */
  function sysCard(title, text, fx, extra) {
    const item = Object.assign({ kind: 'sys', k: 's', title, text, chips: [], done: true, res: '' }, extra || {});
    if (item.opts) {
      item.done = false;
      item.choices = item.opts.map(o => ({ t: o.t, d: o.d || '', dis: o.dis || null, pct: o.pct != null ? o.pct : null }));
      if (item.choices.every(c => c.dis)) item.choices.forEach(c => { c.dis = null; });
    } else if (fx) {
      item.chips = applyFx(fx, {}, []);
    }
    S.cur.items.push(item);
    if (!item.opts && !(extra && extra.log === false)) addLog(title, text, 'sys');
    return item;
  }

  function makeSchoolName(stage, tier) {
    const core = S.city.n.replace(/[市縣]$/, '');
    switch (stage) {
      case 'kinder': return pick(['小太陽', '彩虹', '向日葵', '小天使', '快樂']) + '幼兒園';
      case 'elem': return core + pick(['光明', '中正', '仁愛', '忠孝', '民生', '和平', '大同', '文化', '信義', '復興']) + '國小';
      case 'junior': return core + pick(['中山', '明德', '建國', '民族', '光復', '自強', '新興', '福德']) + '國中';
      case 'senior':
        if (tier === 3) return core + '第一高中';
        if (tier === 1) return '私立' + pick(['育英', '光華', '崇德', '文德', '聖心', '明道']) + '高中';
        return core + pick(['明倫', '中興', '復旦', '成功', '仁德', '大華']) + '高中';
      case 'voc': return core + pick(['高工', '高商', '高職', '家商']);
      case 'jc': return core + '科技專科學校';
      default: return '';
    }
  }

  function gradeLabel(g) {
    if (g >= 90) return '優';
    if (g >= 80) return '甲';
    if (g >= 70) return '乙';
    if (g >= 60) return '丙';
    return '丁';
  }

  function examPressure() {
    const sc = S.school;
    if (sc.stage === 'junior' && sc.grade === 9 && S.month >= 1 && S.month <= 5) return 2.2;
    if (sc.stage === 'senior' && sc.grade === 12 && (S.month >= 9 || S.month === 1)) return 2.2;
    if (sc.stage === 'voc' && sc.grade === 12 && S.month <= 5) return 1.8;
    return 0;
  }

  const CAP_LV = [[94, '5A++'], [86, '5A'], [76, '4A1B'], [64, '2A3B'], [50, '5B'], [38, '3B2C'], [25, '1B4C'], [0, '5C']];
  function capLabel(p) { for (const [t, l] of CAP_LV) if (p >= t) return l; return '5C'; }

  function systemEvents() {
    const a = ageY();
    const sc = S.school;
    const m = S.month;

    // 生日
    if (m === S.birthMonth && S.ageM > 0 && S.ageM % 12 === 0) {
      const yrs = S.ageM / 12;
      if (yrs === 1) {
        const opts = [['書本', { iq: 3 }, '大家說你以後會很會讀書'], ['畫筆', { cr: 3 }, '大家說你以後是藝術家'],
          ['麥克風', { ch: 3 }, '大家說你以後很會說話'], ['小皮球', { ft: 3 }, '大家說你以後是運動健將'],
          ['算盤', { iq: 2, md: 1 }, '大家說你以後很會理財'], ['聽診器', { hp: 2, iq: 1 }, '大家說你以後會當醫生']];
        const o = pick(opts);
        sysCard('一歲生日・抓周', '滿週歲了！家人在你面前擺了一圈東西，你搖搖晃晃爬過去，一把抓起了「' + o[0] + '」。' + o[2] + '。', Object.assign({ tag: '抓周：' + o[0] }, o[1]));
      } else if (yrs === 18) {
        const fx = { md: 5, tag: '成年' };
        let text = '18 歲生日到了，你正式成年！從今天起可以自己簽約、開戶、租房子。';
        sysCard('成年禮', text, fx);
        if (S.gender === 'M') militaryCheck();
      } else if (yrs === 30) {
        sysCard('三十而立', '30 歲生日到了。你看著蛋糕上的蠟燭，回想這一路走來的點點滴滴。', { md: 4 });
      } else if (yrs === 20 || yrs === 25) {
        sysCard(yrs + ' 歲生日', pick(['朋友們幫你辦了一個小小的慶生會。', '你一個人去吃了一頓好吃的，慶祝自己又長大了一歲。', parentsWord() + '傳訊息祝你生日快樂。']), { md: 3 }, { log: false });
      } else if (yrs === 6 || yrs === 12) {
        sysCard(yrs + ' 歲生日', parentsWord() + '幫你買了一個小蛋糕，你吹熄了 ' + yrs + ' 根蠟燭。', { md: 3, rel: { parents: 2 } }, { log: false });
      } else {
        sysCard(yrs + ' 歲生日', pick(['又長大一歲了！', '今天是你的生日，家裡唱了生日快樂歌。', '生日這天，你許了一個小小的願望。']), { md: 2 }, { log: false });
      }
    }

    // 過年紅包（以 2 月代表農曆新年）
    if (m === 2 && S.ageM >= 1 && S.ageM < 264) {
      const base = (a < 6 ? 600 : a < 12 ? 1500 : 2400) * WEALTH[S.fam.wealth].red;
      const amt = Math.round(base * rf(0.8, 1.25));
      const fx = { $: amt, md: 2 };
      if (S.npcs.some(n => n.alive && (n.role === 'grandma' || n.role === 'grandpa'))) fx.rel = { grand: 2 };
      sysCard('過年', a < 3 ? '第一次（或第二次）過年，長輩們搶著抱你，還塞了紅包給爸媽幫你存起來。' :
        pick(['過年回老家圍爐，拿到了好幾包紅包！', '除夕夜吃完年夜飯，長輩們發紅包，你開心地數著。', '大年初一跟著家人拜年，口袋裡的紅包越來越厚。']), fx, { log: false });
    }

    // 學制：9 月開學
    if (m === 9 && S.flags.justMoved) {
      S.flags.justMoved = false;
    } else if (m === 9 && S.flags.gradNext) {
      const abroad = S.flags.gradNext === 'abroad';
      S.flags.gradNext = null;
      if (S.job) leaveJob('quit');
      S.flags.prep = null;
      sc.stage = 'grad'; sc.year = 1; sc.years = 2; sc.abroad = abroad;
      sc.name = abroad ? '海外大學研究所' : (sc.uniName || '大學') + '研究所';
      if (abroad) { S.home = 'dorm'; if (!S.tags.includes('留學')) S.tags.push('留學'); }
      sysCard(abroad ? '出國留學' : '研究所開學', abroad ? '你拖著兩大箱行李搭上飛機，到國外開始研究所生活。一切都很新鮮，也有點寂寞。' : '研究所開學了，你開始跟著指導教授做研究。', { md: 4, st: 3, iq: 1 }, { sn: 'campus' });
      payTuition();
    } else if (m === 9) {
      S.flags.sickYear = 0;
      if (sc.stage === 'none' && S.ageM >= 36 && S.ageM < 72 && !S.flags.noKinder) {
        S.cur.items.push(Object.assign(kindCardItem('上幼兒園', parentsWord() + '在討論要讓你上哪一間幼兒園。', ['kpub', 'kbi', 'kforest'], 'kKind'), {}));
        last().opts.push({ t: '先不上幼兒園', d: '在家多陪家人，6 歲直接上小學。', v: 'none' }); last().choices.push({ t: '先不上幼兒園', d: '在家多陪家人，6 歲直接上小學。', dis: null });
      } else if ((sc.stage === 'kinder' || sc.stage === 'none') && S.ageM >= 72) {
        sc.stage = 'elem'; sc.grade = 1; sc.kind = 'epub'; sc.name = makeSchoolName('elem'); S.grades = clamp(45 + S.st.iq * 0.4 + gauss() * 5, 40, 95); S.subj = null; ensureWeek();
        kindCard('國小入學', '要念哪一間國小呢？', ['epub', 'epri', 'eexp'], 'eKind');
      } else if (sc.stage === 'elem') {
        if (sc.grade >= 6) {
          sc.stage = 'junior'; sc.grade = 7; sc.kind = 'jpub'; sc.name = makeSchoolName('junior');
          npcsBy('friend').forEach(n => { n.rel = clamp(n.rel - 8, -100, 100); });
          kindCard('升上國中', '國小畢業了！要念哪裡呢？功課會變多，班上也會是一群新面孔。', ['jpub', 'jpri', 'jmusic', 'jsport', 'jsci'], 'jKind');
        } else {
          sc.grade++;
          sysCard('開學', '新學期開始，你升上國小' + sc.grade + '年級。', null, { log: false });
        }
      } else if (sc.stage === 'junior') {
        if (sc.grade < 9) { sc.grade++; sysCard('開學', '你升上國中' + (sc.grade - 6) + '年級（' + sc.grade + '年級）。', null, { log: false }); }
      } else if (sc.stage === 'jc' && sc.grade >= 12) {
        sc.grade++;
        sysCard('開學', '新學年開始，你升上五專' + (sc.grade - 9) + '年級，課程越來越專業。', null, { log: false, sn: 'campus' });
        payTuition();
      } else if (['senior', 'voc', 'jc'].includes(sc.stage)) {
        if (sc.grade >= 12) { startAdultPath(); return; }
        sc.grade++;
        sysCard('開學', '新學年開始，你升上' + SCHOOL_N[sc.stage] + (sc.grade - 9) + '年級。', null, { log: false });
      } else if (sc.stage === 'uni' || sc.stage === 'grad') {
        if (sc.year < sc.years) {
          sc.year++;
          sysCard('開學', '新學年開始，你升上' + (sc.stage === 'grad' ? '研究所' : '大學') + sc.year + '年級。', null, { log: false, sn: 'campus' });
          payTuition();
        }
      }
    }

    // 學期成績：1 月、6 月
    if (m === 2 && (sc.stage === 'uni' || sc.stage === 'grad' || (sc.stage === 'jc' && sc.grade > 12))) payTuition();
    if ((m === 1 || m === 6) && inSchool()) {
      const g = S.grades;
      let text, fx = {};
      if (sc.stage === 'elem') {
        text = '學期成績單發下來了：等第「' + gradeLabel(g) + '」。';
      } else if (sc.stage === 'uni' || sc.stage === 'grad' || (sc.stage === 'jc' && sc.grade > 12)) {
        text = '期末考結束，學期平均 ' + Math.round(g) + ' 分。' + (g >= 85 ? '你拿到了系上的書卷獎！' : g < 60 ? '有一科被當掉了，下學期要重修。' : '');
      } else {
        const rank = clamp(Math.round((100 - g) / 100 * 30 + gauss() * 2.5), 1, 30);
        text = '段考成績出爐，學期平均 ' + Math.round(g) + ' 分，全班第 ' + rank + ' 名（共 30 人）。';
      }
      if (g >= 85) { fx = { md: 3, rel: { parents: 3 } }; text += pick([' ' + parentsWord() + '很開心。', ' 你被老師點名表揚。']); }
      else if (g < 60) { fx = { md: -3, st: 4, rel: { parents: -3 } }; text += ' ' + parentsWord() + '看到成績單，皺起了眉頭。'; }
      sysCard(m === 1 ? '上學期成績' : '下學期成績', text, fx, { log: false });
      if (g >= 92) giveAch('書卷獎');
      if (m === 6 && !S.flags.sickYear) giveAch('全勤獎');
    }

    // 畢業典禮
    if (m === 6 && sc.stage === 'elem' && sc.grade === 6) sysCard('國小畢業典禮', '你在畢業典禮上唱著驪歌，和同學在校門口拍照留念。', { md: 3 });
    if (m === 6 && sc.stage === 'junior' && sc.grade === 9) { S.degree = '國中'; sysCard('國中畢業典禮', '三年國中生活結束了，大家在紀念冊上寫下彼此的祝福。', { md: 3 }); }
    if (m === 6 && (sc.stage === 'uni' || sc.stage === 'grad') && sc.year >= sc.years) { graduate(sc.stage === 'grad' ? 'grad' : 'uni'); return; }
    if (m === 6 && sc.stage === 'jc' && sc.grade >= 14) { graduate('jc'); return; }

    // 國中會考（9 年級 5 月）＋ 6 月填志願
    if (m === 5 && sc.stage === 'junior' && sc.grade === 9) {
      const p = clamp(0.62 * S.grades + 0.38 * S.st.iq + gauss() * 7 + tAdd('grade') - Math.max(0, S.stress - 75) * 0.3, 0, 100);
      S.exams.cap = { p: Math.round(p), label: capLabel(p) };
      sysCard('國中教育會考', '兩天的會考結束了。成績公布：你拿到「' + S.exams.cap.label + '」。', p >= 76 ? { md: 6 } : p < 38 ? { md: -4 } : { md: 1 });
      if (S.exams.cap.label === '5A++') giveAch('會考五A++');
    }
    if (m === 6 && sc.stage === 'junior' && sc.grade === 9) {
      const p = S.exams.cap ? S.exams.cap.p : 50;
      const opts = [
        { t: '明星高中', d: '升學名校，競爭激烈、壓力大，但學測有優勢。', v: 'senior3', dis: p >= 86 ? null : '會考成績需要 5A 以上' },
        { t: '公立高中', d: '一般高中，準備學測上大學。', v: 'senior2', dis: p >= 50 ? null : '會考成績需要 5B 以上' },
        { t: '私立高中', d: '一定有學校念，校風各有特色。', v: 'senior1' },
        { t: '高職', d: '學一技之長（電機、資訊、餐飲、商業、設計），之後考統測升科大或就業。', v: 'voc' },
        { t: '五專', d: '五年一貫的專科學校，畢業就有專業能力。', v: 'jc', dis: p >= 38 ? null : '會考成績需要 3B2C 以上' }
      ];
      sysCard('升學選擇', '會考成績「' + (S.exams.cap ? S.exams.cap.label : '-') + '」。接下來要念哪一種學校？', null, { opts, h: 'upper' });
    }

    // 高中：學測（12 年級 1 月）→ 3 月選大學
    if (sc.stage === 'senior' && sc.grade === 12) {
      if (m === 1) {
        const bonus = sc.tier === 3 ? 6 : sc.tier === 1 ? -1 : 0;
        const raw = clamp(0.58 * S.grades + 0.42 * S.st.iq + bonus + gauss() * 6 + tAdd('grade') - Math.max(0, S.stress - 75) * 0.3, 0, 100);
        S.exams.gsat = clamp(Math.round((raw - 12) * 0.78), 0, 60);
        sysCard('大學學測', '學測成績公布：總級分 ' + S.exams.gsat + ' 級分（滿分 60）。', S.exams.gsat >= 46 ? { md: 6 } : S.exams.gsat < 28 ? { md: -4 } : { md: 1 });
      }
      if (m === 3 && !S.path) uniChoice(S.exams.gsat, true);
      if (m === 7 && S.flags.retake && !S.path) {
        const raw = clamp(S.exams.gsat / 0.78 + 12 + gauss() * 7 + (S.alloc.study - 3) * 1.5, 0, 100);
        S.exams.ast = clamp(Math.round((raw - 12) * 0.78), 0, 60);
        sysCard('分科測驗', '分科測驗成績出爐，換算後約 ' + S.exams.ast + ' 級分' + (S.exams.ast > S.exams.gsat ? '，比學測進步了！' : '，可惜沒有比學測好。'), S.exams.ast > S.exams.gsat ? { md: 5 } : { md: -3 });
        uniChoice(Math.max(S.exams.ast, S.exams.gsat), false);
      }
      if (m === 6) sysCard('高中畢業典禮', '高中三年畫下句點。你和同學在校園裡拍了一整個下午的照片。', { md: 4 });
    }
    // 高職：統測（12 年級 5 月）→ 6 月選擇
    if (sc.stage === 'voc' && sc.grade === 12) {
      if (m === 5) {
        const raw = clamp(0.6 * S.grades + 0.4 * S.st.iq + (S.tags.includes('取得證照') ? 5 : 0) + gauss() * 7, 0, 100);
        S.exams.tve = Math.round(raw);
        sysCard('四技二專統測', '統測成績公布：PR 值約 ' + S.exams.tve + '。', S.exams.tve >= 70 ? { md: 5 } : { md: 0 });
      }
      if (m === 6 && !S.path) {
        const p = S.exams.tve || 50;
        const opts = [
          { t: '國立科技大學', d: '技職體系的頂尖學校。', v: 'tech3', dis: p >= 72 ? null : '統測需要 PR 72 以上' },
          { t: '私立科技大學', d: '繼續把專業學得更深。', v: 'tech2', dis: p >= 25 ? null : '統測需要 PR 25 以上' },
          { t: '直接就業', d: '帶著一技之長進入職場。', v: 'work' }
        ];
        if (S.gender === 'M') opts.push({ t: '先去當兵', d: '服 1 年義務役，退伍後再決定。', v: 'army' });
        sysCard('畢業後的出路', '高職三年要結束了。下一步呢？', null, { opts, h: 'after' });
      }
      if (m === 6) sysCard('高職畢業典禮', '畢業了！三年實習課練出來的手藝，是你最大的本錢。', { md: 4 });
    }
    // 五專：第三年 6 月
    if (sc.stage === 'jc' && sc.grade === 12 && m === 6 && !S.path) {
      S.path = { kind: 'jc', name: sc.name, tier: 2, major: sc.dept || '專業科' };
      sysCard('五專前三年結束', '五專前三年結束了，接下來兩年你要繼續在「' + sc.name + '」完成專業課程與實習。', { md: 2, iq: 2 });
    }
  }

  function militaryCheck() {
    const bmi = S.wgt / ((S.hgt / 100) ** 2);
    let r;
    if (S.st.hp < 30 || bmi < 16.5 || bmi > 34) r = chance(0.5) ? '免役體位' : '替代役體位';
    else if (S.st.hp < 45 || bmi < 17.5 || bmi > 31.5) r = chance(0.6) ? '替代役體位' : '常備役體位';
    else r = chance(0.05) ? '替代役體位' : '常備役體位';
    S.flags.military = r;
    S.mil = { st: r === '免役體位' ? 'exempt' : 'pending', kind: r === '替代役體位' ? '替代役' : '常備役', callAt: null };
    sysCard('兵役體檢', '你收到兵役體檢通知，檢查結果判定為「' + r + '」。' + (r === '常備役體位' ? '之後要服 1 年義務役（可以先念完書再去）。' : r === '替代役體位' ? '之後會服替代役。' : '你不用服兵役。'), { tag: r });
  }

  function uniChoice(score, allowRetake) {
    const opts = [
      { t: '頂尖國立大學', d: '全國最競爭的學府。', v: 'uni4', dis: score >= 55 ? null : '需要 55 級分以上' },
      { t: '國立大學', d: '公立大學，學費較低。', v: 'uni3', dis: score >= 46 ? null : '需要 46 級分以上' },
      { t: '私立大學', d: '選擇多，學費較高。', v: 'uni2', dis: score >= 34 ? null : '需要 34 級分以上' },
      { t: '科技大學', d: '偏重實作的技職大學。', v: 'uni1' }
    ];
    if (allowRetake) opts.push({ t: '再拚一次：7 月分科測驗', d: '放棄這次申請，繼續苦讀，成績可能更好也可能更差。', v: 'retake' });
    opts.push({ t: '不升學，直接就業', d: '提早進入社會賺錢。', v: 'work' });
    if (S.gender === 'M' && S.flags.military === '常備役體位') opts.push({ t: '先去當兵', d: '服 1 年義務役，退伍後再決定。', v: 'army' });
    sysCard('選擇大學', '你的成績是 ' + score + ' 級分。要怎麼走下一步？', null, { opts, h: 'after' });
  }

  const MAJORS = [
    { t: '醫學系', d: '最難考的科系之一，路很長。', need: () => S.flags.uniTier === 4 && Math.max(S.exams.gsat || 0, S.exams.ast || 0) >= 58, needT: '需要頂尖國立大學且 58 級分以上' },
    { t: '理工資訊', d: '工程、資訊、科學。' },
    { t: '醫藥衛生', d: '護理、藥學、醫技。' },
    { t: '商業管理', d: '企管、財金、會計。' },
    { t: '人文法政', d: '法律、外語、社會科學。' },
    { t: '藝術設計', d: '設計、音樂、表演藝術。' },
    { t: '教育', d: '未來當老師的搖籃。' }
  ];

  const SYS_H = {
    upper(j, item) {
      const v = item.opts[j].v;
      const sc = S.school;
      sc.grade = 9; // 9 月才會升 10 年級
      if (v.startsWith('senior')) { sc.next = 'senior'; sc.tier = +v.slice(6); }
      else { sc.next = v; sc.tier = 2; }
      sc.dept = null; sc.nextKind = null;
      S.flags.upperPending = true;
      item.res = '你決定念' + item.opts[j].t + '。';
      if (v === 'voc' || v === 'jc') deptCard(v);
      else kindCard('選擇班別', '高中有不同的班別，要念哪一班？', ['spub', 'ssci', 'slang', 'sart', 'ssport'], 'sKind');
      addLog('升學', item.res, 'school');
      return [];
    },
    after(j, item) {
      const v = item.opts[j].v;
      const out = [];
      if (v === 'retake') {
        S.flags.retake = true;
        item.res = '你決定放棄申請，拚 7 月的分科測驗。';
        applyFx({ st: 10 }, {}, out);
      } else if (v.startsWith('uni') || v.startsWith('tech')) {
        const tier = +v.replace(/\D/g, '');
        const isTech = v.startsWith('tech') || v === 'uni1';
        const name = item.opts[j].t;
        S.flags.uniTier = isTech && v === 'uni1' ? 1 : tier;
        const priv = name.startsWith('私立') || v === 'uni1' || v === 'tech2';
        S.path = { kind: isTech ? 'tech' : 'uni', tier: S.flags.uniTier, name, private: priv };
        if (priv && S.fam.wealth <= 2) { applyFx({ tag: '就學貸款' }, {}, out); S.path.loan = true; }
        item.res = '你選擇了' + name + '。';
        applyFx({ md: 6 }, {}, out);
        if (tier === 4 && !isTech) giveAch('金榜題名', out);
        if (S.birth.wealth === 1 && tier >= 3) giveAch('逆轉人生', out);
        // 選科系
        const opts = MAJORS.map(mj => ({ t: mj.t, d: mj.d, dis: mj.need && !mj.need() ? mj.needT : null }));
        S.cur.items.push({ kind: 'sys', k: 's', title: '選擇科系', text: '要念什麼科系呢？', chips: [], done: false, res: '', opts, h: 'major', choices: opts.map(o => ({ t: o.t, d: o.d, dis: o.dis })) });
      } else if (v === 'work') {
        S.path = { kind: 'work', tier: 0, name: '就業' };
        item.res = '你決定不升學，先進入職場。';
        applyFx({ md: 1, tag: '提早就業' }, {}, out);
      } else if (v === 'army') {
        S.path = { kind: 'army', tier: 0, name: '入伍服役' };
        item.res = '你決定先去當兵，服 1 年義務役。';
        applyFx({ tag: '先當兵' }, {}, out);
      }
      if (item.res) addLog('人生選擇', item.res, 'school');
      if (S.path && S.school.stage === 'senior' && S.month >= 6) S.school.stage = S.school.stage; // 等 9 月結算
      return out;
    },
    major(j, item) {
      S.path.major = item.opts[j].t;
      item.res = '你決定念' + item.opts[j].t + '。';
      addLog('人生選擇', item.res, 'school');
      return [];
    },
    stress(j, item) {
      const out = [];
      if (j === 0) { applyFx({ st: -25, md: 6, rel: { parents: 5 } }, {}, out); item.res = '說出來之後，心裡輕鬆了很多。'; }
      else if (j === 1) { applyFx({ st: -20, gr: -3, md: 3 }, {}, out); item.res = '好好睡了幾天，整個人恢復了一些。'; }
      else {
        if (chance(0.5)) { applyFx({ st: -5, hp: -8, sick: 1 }, {}, out); item.res = '撐著撐著，你還是病倒了。'; }
        else { applyFx({ st: -8, hp: -3 }, {}, out); item.res = '你咬牙撐了過去，但身體有點吃不消。'; }
      }
      return out;
    }
  };

  function finish30() {
    if (S.ended) return;
    S.ended = true;
    S.cur.post.push('stage:young');
    S.cur.post.push('end');
    addLog('三十而立', '你走完了人生的前 30 年。', 'sys');
  }
  /* ================================================================
   * 成年人生（18–30 歲）：大學、兵役、工作、財務、居住、婚姻與孩子
   * ================================================================ */
  const DEG_RANK = { '': 0, '國中': 1, '高中': 2, '高職': 2, '專科': 3, '學士': 4, '碩士': 5 };
  const UNI_NAMES = ['星原', '曉峰', '翠谷', '雲海', '晴川', '明湖', '松嶺', '海灣', '青禾', '遠山', '藍田', '月橋'];
  const CO_NAMES = ['青松', '光遠', '藍海', '晨星', '恆通', '佳美', '百川', '正豐', '綠洲', '曙光', '長青', '和風', '向陽', '日昇'];
  const LIVING = { city: 17000, town: 15000, rural: 13000 };
  const RENT = { city: 12000, town: 8000, rural: 6000 };
  const HOUSE = { city: 15000000, town: 8000000, rural: 5000000 };
  const ALLOWANCE = [0, 1500, 4500, 8000, 12000, 20000];
  const ECON_N = { boom: '景氣繁榮', normal: '景氣平穩', recession: '景氣衰退' };
  const HOME_N = { parents: '和家人同住', dorm: '學校宿舍', rent: '在外租屋', own: '自己的房子', barracks: '營區' };

  function jobs() { return LG.JOBS || []; }
  function jobDef(id) { return jobs().find(j => j.id === id); }
  function degRank() { return DEG_RANK[S.degree || ''] || 0; }
  function kids() { return npcsBy('child'); }
  function status() {
    if (S.mil && S.mil.st === 'serving') return 'army';
    const sc = S.school.stage;
    if (sc === 'uni' || sc === 'grad') return 'uni';
    if (sc === 'jc' && S.school.grade > 12) return 'uni';
    if (sc !== 'done') return 'school';
    if (S.retired) return 'retired';
    if (S.flags.prep && !S.flags.prep.part) return 'prep';
    if (S.job && !S.job.paused) return 'work';
    return 'seek';
  }
  function marital() {
    if (npcsBy('spouse').length) return 'married';
    if (S.tags.includes('交往中') && npcsBy('crush').length) return 'dating';
    return 'single';
  }
  function netWorth() {
    let v = S.money + (S.bank || 0) + stockValue() + (S.inv ? S.inv.bal : 0);
    if (S.house) v += S.house.price;
    for (const L of S.loans || []) v -= L.bal;
    return Math.round(v);
  }

  /* ---- 工作 ---- */
  function majorMatch(j) {
    const okM = j.maj && S.path && S.path.major && j.maj.includes(S.path.major);
    const okD = j.dept && S.school.dept && j.dept.includes(S.school.dept);
    const okP = j.pref && S.path && S.path.major && j.pref.includes(S.path.major);
    return !!(okM || okD || okP);
  }
  function reqMatch(j) {
    const okM = j.maj && S.path && S.path.major && j.maj.includes(S.path.major);
    const okD = j.dept && S.school.dept && j.dept.includes(S.school.dept);
    return !!(okM || okD);
  }
  function jobOk(j) {
    if (j.special) return false;
    if (degRank() < (j.deg || 0)) return false;
    if ((j.maj || j.dept) && !reqMatch(j)) return false;
    if (j.tag && !S.tags.includes(j.tag)) return false;
    if (j.g && j.g !== S.gender) return false;
    if (j.need) { try { if (!j.need(S, API)) return false; } catch (e) { return false; } }
    return true;
  }
  function hirePct(j) {
    const v = j.stat ? S.st[j.stat] : 50;
    const gap = v - (j.dc || 45);
    let p = (gap >= 0 ? 0.72 + gap / 120 : 0.55 + gap / 45) + (degRank() - (j.deg || 0)) * 0.03 + (S.flags.jobprepAt != null && S.ageM - S.flags.jobprepAt <= 2 ? 0.1 : 0) + (S.tags.includes('實習經驗') ? 0.05 : 0);
    if (S.econ.s === 'boom') p += 0.1; else if (S.econ.s === 'recession') p -= 0.15;
    if (S.tags.includes('取得證照') && (j.cat === 'factory' || j.cat === 'service')) p += 0.06;
    if (S.mil.st === 'pending') p -= 0.15;
    if (majorMatch(j)) p += 0.08;
    if (S.flags.goalJob === j.id) p += 0.08;
    p += tAdd('chk') / 100;
    return Math.round(clamp(p, 0.06, 0.93) * 100);
  }
  function startPay(j) {
    let p = j.pay * S.wageMul * (1 + Math.max(0, degRank() - (j.deg || 0)) * 0.04);
    if (S.degree === '碩士' && ['tech', 'office', 'pro'].includes(j.cat)) p *= 1.1;
    return Math.round(p * rf(0.95, 1.08) / 100) * 100;
  }
  function companyName(j) {
    if (j.co) return pick(j.co);
    return pick(CO_NAMES) + pick(j.suf || ['公司']);
  }
  function startJob(j, pay, out) {
    const first = !S.jobHist.length;
    S.job = { id: j.id, n: j.n, cat: j.cat, lvl: 0, title: j.lv[0], pay, perf: 50, since: S.ageM, lvlSince: S.ageM, warn: 0, co: companyName(j) };
    S.jobHist.push({ id: j.id, n: j.n, at: S.ageM });
    S.flags.hunt = false;
    S.flags.seekM = 0;
    addLog('工作', '你開始在「' + S.job.co + '」擔任' + S.job.title + '，月薪 ' + fmtMoney(pay) + '。', 'work');
    if (first) { giveAch('社會新鮮人', out); S.flags.firstJobCards = true; }
  }
  function leaveJob(reason) {
    const J = S.job;
    if (!J) return 0;
    let sev = 0;
    if (reason === 'layoff') {
      sev = Math.round(J.pay * Math.min(6, Math.max(0.5, (S.ageM - J.since) / 24)));
      S.money += sev;
    }
    S.flags.lastPay = J.pay;
    addLog('離職', '你離開了「' + J.co + '」的' + J.title + '工作。', 'work');
    S.job = null;
    S.flags.seekM = 0;
    S.flags.hunt = false;
    return sev;
  }
  function jobWhy(j) {
    if (j.special) return '要通過國家考試';
    if (degRank() < (j.deg || 0)) return '學歷需要' + ['', '國中', '高中職', '專科', '大學', '碩士'][j.deg] + '以上';
    if ((j.maj || j.dept) && !reqMatch(j)) return '需要相關科系：' + (j.maj || []).concat(j.dept || []).join('、');
    if (j.tag && !S.tags.includes(j.tag)) return '需要「' + j.tag + '」';
    if (j.g && j.g !== S.gender) return '條件不符';
    if (j.need) { try { if (!j.need(S, API)) return j.needT || '條件不符'; } catch (e) { return '條件不符'; } }
    return '';
  }
  function jobHuntCard() {
    const cand = jobs().filter(jobOk).filter(j => !(S.job && S.job.id === j.id) && j.id !== 'owner');
    if (!cand.length) return;
    const offers = cand.map(j => ({ id: j.id, pay: startPay(j), pct: hirePct(j) })).sort((x, y) => (y.id === S.flags.goalJob) - (x.id === S.flags.goalJob) || y.pay - x.pay).slice(0, 8);
    const employed = !!S.job;
    const opts = offers.map(o => { const j = jobDef(o.id); return { t: (o.id === S.flags.goalJob ? '⭐ ' : '') + '應徵' + j.n + '（月薪約 ' + fmtMoney(o.pay) + '）', d: j.d || '', pct: o.pct, v: o }; });
    const goals = jobs().filter(j => !jobOk(j) && !j.special && j.id !== 'owner').sort((x, y) => y.pay - x.pay).slice(0, 3);
    for (const j of goals) opts.push({ t: j.n + '（月薪約 ' + fmtMoney(startPay(j)) + '）', dis: jobWhy(j), v: null });
    opts.push({ t: employed ? '還是留在現在的公司' : '這個月先不找，休息一下', v: null });
    const sm = S.flags.seekM || 0;
    const text = employed ? '你一邊上班，一邊在人力銀行看職缺。這個月有幾個機會：' :
      sm >= 4 ? '已經找工作 ' + sm + ' 個月了。你深吸一口氣，打開人力銀行，繼續投履歷。' :
        pick(['你打開人力銀行網站，開始找工作。', '你整理好履歷，看看這個月有哪些職缺。', '朋友傳來幾個職缺，你一個一個點開來看。']);
    sysCard(employed ? '看看新機會' : '找工作', text, null, { opts, h: 'jobhunt', sn: 'home' });
  }
  function annualReview(J, jd) {
    const p = J.perf;
    let text, fx;
    const grade = p >= 75 ? '優等' : p >= 55 ? '甲等' : p >= 38 ? '乙等' : '丙等';
    let raise = p >= 75 ? rf(3, 6) : p >= 55 ? rf(1.5, 3.5) : p >= 38 ? rf(0, 1.5) : 0;
    if (S.econ.s === 'recession') raise *= 0.4;
    { const ref = (jd.pay || J.pay) * S.wageMul * (1 + 0.3 * J.lvl); raise *= clamp(1.2 - J.pay / ref, 0, 1); }
    const lvls = jd.lv || [J.title];
    const PR = promoReqs();
    if (PR && !PR.top && PR.ok && chance(0.75)) {
      doPromote(J, jd);
      text = '年度考績「' + grade + '」，升遷條件全部達成，你升上了' + J.title + '！月薪調整為 ' + fmtMoney(J.pay) + '。';
      fx = { md: 8 };
    } else {
      J.pay = Math.round(J.pay * (1 + raise / 100) / 100) * 100;
      text = '年度考績「' + grade + '」。' + (raise >= 0.5 ? '調薪 ' + raise.toFixed(1) + '%，月薪變成 ' + fmtMoney(J.pay) + '。' : '今年沒有調薪。');
      fx = p >= 55 ? { md: 3 } : { md: -3, st: 3 };
    }
    if (p < 38) { J.warn++; if (J.warn < 2) text += ' 主管找你談話，希望你明年表現好一點。'; } else J.warn = 0;
    sysCard('年度考績', text, fx, { sn: 'office' });
    if (J.warn >= 2) { sysCard('離開公司', '連續兩年考績不佳，公司請你另謀高就。', { md: -10, st: 8 }, { sn: 'office' }); leaveJob('fired'); }
  }
  function yearBonus(J, jd) {
    let mo = jd.cat === 'public' ? 1.5 : jd.cat === 'service' ? 0.5 : J.perf >= 70 ? 2 : J.perf >= 50 ? 1.2 : 0.5;
    mo *= (jd.bonus || 1) * (jd.cat === 'public' ? 1 : S.econ.s === 'boom' ? 1.35 : S.econ.s === 'recession' ? 0.5 : 1);
    mo = Math.round(mo * 10) / 10;
    if (mo < 0.1) return;
    const amt = Math.round(J.pay * mo);
    S.money += amt;
    sysCard('年終獎金', '過年前公司發了 ' + mo + ' 個月的年終獎金，一共 ' + fmtMoney(amt) + '！', { md: mo >= 2 ? 6 : 3 }, { log: false, sn: 'office' });
    S.cur.items[S.cur.items.length - 1].chips.unshift({ k: '$', v: amt });
  }
  function preWork() {
    const stt = status();
    if (stt === 'seek' && !S.flags.gradNext && ageY() >= 15) {
      S.flags.seekM = (S.flags.seekM || 0) + 1;
      jobHuntCard();
    } else if (stt === 'work' && S.flags.hunt) jobHuntCard();
  }
  function postWork() {
    const stt = status();
    if (stt !== 'work') return;
    const J = S.job;
    const jd = jobDef(J.id) || {};
    const v = jd.stat ? S.st[jd.stat] : 50;
    const tgt = clamp(30 + (v - 50) * 0.5 + S.alloc.study * 6.5 - Math.max(0, S.stress - 70) * 0.6 + (S.st.md - 50) * 0.1 + tAdd('grade') - Math.max(0, ageY() - 58) * 0.8, 0, 100);
    J.perf = clamp(J.perf + (tgt - J.perf) * 0.12 + gauss() * 2, 0, 100);
    if (S.month === 1 && S.ageM - J.since >= 6) annualReview(J, jd);
    if (!S.job) return;
    if (S.month === 2 && S.ageM - J.since >= 6 && J.id !== 'owner') yearBonus(J, jd);
    const lp = (S.econ.s === 'recession' ? 0.01 : S.econ.s === 'boom' ? 0.001 : 0.0025) * (J.perf < 40 ? 2.5 : 1) * (jd.cat === 'public' || J.id === 'owner' ? 0 : 1) * (ageY() > 50 ? 1.5 : 1);
    if (S.ageM - J.since > 6 && chance(lp)) {
      const co = J.co;
      const sev = leaveJob('layoff');
      sysCard('被裁員了', '「' + co + '」' + (S.econ.s === 'recession' ? '受到景氣衰退影響，' : '') + '宣布組織調整，你也在裁員名單裡。你領到資遣費 ' + fmtMoney(sev) + '。', { md: -10, st: 10 }, { sn: 'office' });
    }
  }

  /* ---- 兵役 ---- */
  function monthlyMilitary() {
    const M = S.mil;
    if (M.st === 'pending' && ageY() >= 18 && !S.flags.gradNext && ['seek', 'work', 'prep'].includes(status())) {
      if (M.callAt == null) {
        M.callAt = S.ageM + ri(1, 3);
        sysCard('徵集令', '你收到兵役徵集令，' + (M.callAt - S.ageM) + ' 個月後要去' + (M.kind === '替代役' ? '服替代役' : '當兵') + '。', { st: 3 }, { sn: 'home' });
      } else if (S.ageM >= M.callAt) {
        M.st = 'serving'; M.start = S.ageM;
        if (S.job) S.job.paused = true;
        if (S.flags.prep) S.flags.prep = null;
        sysCard('入伍', M.kind === '替代役' ? '你到替代役訓練班報到，結訓後被分發到公家單位服勤。接下來一年，要好好服務大家。' : '你理了平頭、背著行李走進新訓中心，開始一年的義務役生活。', { md: -3, st: 5, ft: 2 }, { sn: M.kind === '替代役' ? 'office' : 'army' });
      }
    } else if (M.st === 'serving' && S.ageM - M.start >= 12) {
      M.st = 'done';
      let text = '一年的' + M.kind + '結束了！你拿到退伍令，' + (M.kind === '替代役' ? '和同梯一起吃了頓飯慶祝。' : '和同梯在營區門口合照。');
      if (S.job) { S.job.paused = false; text += '你回到原本的公司上班。'; }
      sysCard('退伍', text, { md: 8, st: -6, tag: '退伍' }, { sn: M.kind === '替代役' ? 'office' : 'army' });
      giveAch('光榮退伍');
    }
  }

  /* ---- 大學、研究所 ---- */
  function payTuition() {
    const sc = S.school;
    let fee;
    if (sc.stage === 'grad' && sc.abroad) fee = 350000;
    else if (sc.stage === 'jc') fee = 26000;
    else fee = (sc.priv ? 52000 : 29000) * (sc.stage === 'grad' ? 1.15 : 1) * (S.path && S.path.major === '醫學系' ? 1.4 : 1);
    fee = money(fee);
    const w = S.fam.wealth;
    const famShare = sc.abroad ? (w >= 4 ? 1 : 0) : w >= 4 ? 1 : w === 3 ? 0.9 : w === 2 ? 0.5 : 0;
    const fam = Math.round(fee * famShare / 10) * 10, self = fee - fam;
    let text = '新學期要繳學費 ' + fmtMoney(fee) + '。';
    if (self <= 0) text += parentsWord() + '幫你繳了。';
    else {
      if (fam > 0) text += parentsWord() + '幫你出了 ' + fmtMoney(fam) + '，';
      if (S.money >= self + money(8000)) { S.money -= self; text += '剩下的 ' + fmtMoney(self) + ' 用你自己的存款支付。'; }
      else { addLoan('就學貸款', self, 0); if (!S.tags.includes('就學貸款')) S.tags.push('就學貸款'); text += '你申請了就學貸款 ' + fmtMoney(self) + '，畢業後再分期還。'; }
    }
    sysCard('繳學費', text, null, { log: false, sn: 'campus' });
  }
  function addLoan(n, amt, pay) {
    let L = S.loans.find(x => x.n === n);
    if (!L) { L = { n, bal: 0, pay: 0, start: null }; S.loans.push(L); }
    L.bal += amt;
    if (pay) L.pay = pay;
  }
  function startStudentLoanRepay() {
    const L = S.loans.find(x => x.n === '就學貸款');
    if (L && L.start == null) { L.start = S.ageM + 12; L.pay = Math.ceil(L.bal / 96 / 10) * 10; }
  }
  function uniName(p) {
    return (p.private ? '私立' : '國立') + pick(UNI_NAMES) + (p.kind === 'tech' ? '科技大學' : '大學');
  }
  function startAdultPath() {
    const p = S.path || (S.path = { kind: 'work', tier: 0, name: '就業' });
    const sc = S.school;
    if (!S.degree || DEG_RANK[S.degree] < 2) S.degree = sc.stage === 'voc' ? '高職' : '高中';
    if (p.kind === 'uni' || p.kind === 'tech') {
      sc.stage = 'uni'; sc.year = 1; sc.years = p.major === '醫學系' ? 6 : 4;
      sc.priv = !!p.private; sc.tier = p.tier;
      sc.uniName = uniName(p); sc.name = sc.uniName; p.uniName = sc.uniName;
      sysCard('大學新鮮人', '九月，你成為「' + sc.name + '」' + (p.major || '') + '的新生。新生訓練、迎新宿營、選課系統……人生的下一章開始了！', { md: 5, st: 2 }, { sn: 'campus' });
      const far = S.city.tier === 'rural' || chance(0.45);
      const opts = [
        { t: '住學校宿舍', d: '四人一間，費用便宜，室友就是第一批大學朋友。', v: 'dorm' },
        { t: '在外面租房子', d: '每月房租約 ' + fmtMoney(money(RENT[S.city.tier === 'rural' ? 'town' : S.city.tier])) + '，自由但花費高。', v: 'rent' },
        { t: '住家裡，每天通勤', d: '省錢，但每天要花很多時間在路上。', v: 'parents', dis: far ? '學校離家太遠了' : null }
      ];
      sysCard('大學要住哪裡？', '開學前，你要決定接下來住在哪裡。', null, { opts, h: 'uniHome', sn: 'campus' });
      payTuition();
    } else if (p.kind === 'army') {
      sc.stage = 'done';
      sysCard('畢業之後', '九月，同學們都去上學了，你準備先去服兵役。', { md: 1 }, { sn: 'home' });
      if (S.mil.st === 'pending') S.mil.callAt = S.ageM;
    } else {
      sc.stage = 'done';
      sysCard('踏入社會', '九月，同學們都去上學了，你則開始找第一份全職工作。', { md: 1 }, { sn: 'home' });
    }
  }
  function gradPct() {
    const tierB = (S.school.tier || 2) * 3;
    return Math.round(clamp(0.2 + (S.grades - 70) / 45 + (S.st.iq - 55) / 90 + tierB / 100, 0.08, 0.92) * 100);
  }
  function graduate(kind) {
    const sc = S.school;
    if (kind === 'jc') { S.degree = '專科'; sysCard('五專畢業典禮', '五年的專科生活結束了！你拿到專科畢業證書，也練就了一身專業本領。', { md: 6 }, { sn: 'campus' }); }
    else if (kind === 'grad') { S.degree = '碩士'; giveAch('碩士學位'); sysCard('研究所畢業', '口試通過，論文送印！你戴上碩士帽，拿到了碩士學位。', { md: 8, iq: 2 }, { sn: 'campus' }); }
    else { S.degree = '學士'; giveAch('大學畢業'); sysCard('大學畢業典禮', '你穿上學士服，和同學把學士帽拋向天空。' + (S.path && S.path.major === '醫學系' ? '六年的醫學院生活終於結束了。' : '四年的大學生活畫下了句點。'), { md: 8 }, { sn: 'campus' }); }
    sc.stage = 'done';
    sc.abroad = false;
    if (S.home === 'dorm') S.home = 'parents';
    if (S.tags.includes('打工族')) S.tags = S.tags.filter(t => t !== '打工族');
    startStudentLoanRepay();
    if (S.path && S.path.major === '醫學系' && kind === 'uni') {
      const ok = chance(clamp(0.7 + (S.st.iq - 55) / 80, 0.5, 0.97));
      if (ok) { sysCard('醫師國考', '你通過了醫師國家考試，正式成為醫師！接下來要在醫院接受兩年的畢業後一般醫學訓練。', { md: 10 }, { sn: 'hospital' }); startJob(jobDef('doctor'), startPay(jobDef('doctor')), []); return; }
      sysCard('醫師國考', '醫師國考差了幾分沒通過。你決定明年再考一次，先去醫院當助理。', { md: -8, st: 6 }, { sn: 'hospital' });
      S.flags.prep = { due: S.ageM + 6, kind: 'doctor', tries: 1 };
      return;
    }
    afterGradCard(kind);
  }
  function afterGradCard(kind) {
    const opts = [{ t: '開始找工作', d: '帶著' + S.degree + '學歷進入職場。', v: 'job' }];
    if (kind === 'uni') {
      opts.push({ t: '考研究所', d: '再念兩年，拿碩士學位。', v: 'grad', pct: gradPct(), dis: S.grades >= 60 ? null : '學業平均需要 60 分以上' });
      opts.push({ t: '出國留學', d: '到國外念碩士，兩年大約要花 ' + fmtMoney(money(800000)) + '。', v: 'abroad', dis: S.fam.wealth >= 4 || S.money >= money(800000) ? null : '家境富裕或存款 80 萬以上才負擔得起' });
    }
    opts.push({ t: '準備公職考試', d: '在家苦讀一年，考上就是鐵飯碗。', v: 'prep' });
    if (S.mil.st === 'pending') opts.push({ t: '先去當兵', d: '服完兵役再找工作，比較好找。', v: 'army' });
    sysCard('畢業後的下一步', '拿到畢業證書了，接下來要做什麼？', null, { opts, h: 'aftergrad', sn: 'campus' });
  }
  function monthlyPrep() {
    const P = S.flags.prep;
    if (!P || S.ageM < P.due) return;
    if (P.kind === 'doctor') {
      S.flags.prep = null;
      sysCard('醫師國考', '第二次挑戰，你終於通過了醫師國考！', { md: 10 }, { sn: 'hospital' });
      startJob(jobDef('doctor'), startPay(jobDef('doctor')), []);
      return;
    }
    const p = clamp((0.12 + (S.st.iq - 50) / 110 + (S.alloc.study - 3) * 0.05 + (P.tries || 0) * 0.06 + tAdd('grade') / 100 + (S.flags.studyprepN || 0) * 0.004) * (P.part ? 0.6 : 1), 0.05, 0.75);
    S.flags.studyprepN = 0;
    if (chance(p)) {
      S.flags.prep = null;
      if (S.job) leaveJob('switch');
      const j = jobDef(degRank() >= 4 ? 'civil' : 'civil2');
      sysCard('放榜', '公職考試放榜，你在榜單上看到自己的名字！' + parentsWord() + '高興得打電話告訴所有親戚。', { md: 12, st: -10, rel: { parents: 6 } }, { sn: 'home' });
      startJob(j, startPay(j), []);
      giveAch('鐵飯碗');
    } else {
      P.tries = (P.tries || 0) + 1;
      sysCard('放榜', '公職考試放榜了……這次差了幾分。要再拚一年嗎？', null, { opts: [{ t: '再考一年', d: '已經考過 ' + P.tries + ' 次，越來越有經驗。', v: 'again' }, { t: '先去找工作', d: '一邊工作一邊想下一步。', v: 'stop' }], h: 'prepFail', sn: 'home' });
    }
  }

  /* ---- 家庭：結婚、孩子、居住 ---- */
  function marry(b, out) {
    let n = b && b.crush ? npc(b.crush) : npcsBy('crush')[0];
    if (!n) return;
    n.role = 'spouse';
    n.inc = Math.round(rf(32000, 60000) * S.wageMul / 100) * 100;
    S.tags = S.tags.filter(t => t !== '交往中');
    if (!S.tags.includes('已婚')) S.tags.push('已婚');
    S.flags.marriedAt = S.ageM;
    const cost = money(200000);
    S.money = Math.max(0, S.money - cost);
    out.push({ k: '$', v: -cost });
    out.push({ k: 'tag', v: '已婚' });
    if (S.home === 'parents' || S.home === 'dorm') { S.home = 'rent'; out.push({ k: 'home', v: HOME_N.rent }); }
    giveAch('有情人終成眷屬', out);
    addLog('結婚', '你和' + n.name + '結婚了！', 'family');
  }
  function breakup(out) {
    for (const n of npcsBy('crush')) { n.role = 'oldfriend'; n.rel = clamp(n.rel - 30, -100, 100); }
    S.tags = S.tags.filter(t => t !== '交往中');
    if (!S.tags.includes('失戀過')) S.tags.push('失戀過');
    out.push({ k: 'tag', v: '分手' });
  }
  function divorce(out) {
    for (const n of npcsBy('spouse')) { n.role = 'ex'; n.rel = clamp(n.rel - 30, -100, 100); }
    S.tags = S.tags.filter(t => t !== '已婚');
    if (!S.tags.includes('離婚')) S.tags.push('離婚');
    out.push({ k: 'tag', v: '離婚' });
    addLog('離婚', '你結束了這段婚姻。', 'family');
  }
  function setHome(v, out) {
    if (!HOME_N[v] || S.home === v) return;
    S.home = v;
    out.push({ k: 'home', v: HOME_N[v] });
  }
  function housePrice() { return money(HOUSE[S.city.tier]); }
  function downPay() { return Math.round(housePrice() * 0.23); }
  function buyHouse(out) {
    const price = housePrice(), down = downPay();
    if (S.money < down) return;
    S.money -= down;
    const loan = price * 0.8;
    const r = 0.022 / 12, n = 360;
    const pay = Math.round(loan * r / (1 - Math.pow(1 + r, -n)));
    S.loans.push({ n: '房貸', bal: loan, pay, start: S.ageM });
    S.house = { price, at: S.ageM };
    S.home = 'own';
    out.push({ k: '$', v: -down });
    out.push({ k: 'home', v: HOME_N.own });
    giveAch('買房成家', out);
    addLog('買房', '你在' + S.city.n + '買下了自己的房子！房價 ' + fmtMoney(price) + '，每月房貸 ' + fmtMoney(pay) + '。', 'family');
  }
  function monthlyFamily() {
    if (S.flags.babyDue && S.ageM >= S.flags.babyDue) {
      S.flags.babyDue = null;
      const g = chance(0.5) ? 'M' : 'F';
      const c = addNpc({ role: 'child', name: genName(g), g, rel: 75, born: S.ageM });
      const grant = money(100000);
      S.money += grant;
      sysCard('寶寶出生了', '在家人的期待中，' + (g === 'M' ? '兒子' : '女兒') + c.name + '出生了！小小的手緊緊握住你的手指，你的眼眶一下就紅了。', { md: 15, st: 6, rel: { family: 4 } }, { sn: 'hospital' });
      S.cur.items[S.cur.items.length - 1].chips.push({ k: '$', v: grant }, { k: 'npc', v: c.name });
      giveAch('新手爸媽');
    }
    if (S.flags.firstJobCards && status() === 'work') {
      S.flags.firstJobCards = false;
      if (S.home === 'parents') {
        sysCard('要搬出去住嗎？', '有了正職工作，你開始考慮要不要搬出去自己住。', null, {
          opts: [{ t: '繼續住家裡', d: '省下房租，也能多陪陪家人。', v: 'parents' }, { t: '搬出去租房子', d: '每月房租約 ' + fmtMoney(money(RENT[S.city.tier])) + '，換來自由。', v: 'rent' }], h: 'workHome', sn: 'home'
        });
      }
      const p = S.job ? S.job.pay : 30000;
      sysCard('孝親費', '領到第一份薪水，你想每個月給' + parentsWord() + '多少孝親費？', null, {
        opts: [{ t: '暫時不給', d: '先把錢存下來。', v: 0 }, { t: '每月 3,000 元', v: 3000 }, { t: '每月 6,000 元', v: 6000, dis: p < 33000 ? '薪水不夠多' : null }, { t: '每月 10,000 元', v: 10000, dis: p < 45000 ? '薪水不夠多' : null }], h: 'give', sn: 'home'
      });
    }
  }

  /* ---- 景氣 ---- */
  function econTick() {
    const E = S.econ;
    if (S.ageM < E.until) return;
    let next;
    if (E.s === 'normal') next = chance(0.45) ? 'boom' : chance(0.75) ? 'recession' : 'normal';
    else next = 'normal';
    E.s = next;
    E.until = S.ageM + (next === 'boom' ? ri(24, 48) : next === 'recession' ? ri(12, 30) : ri(48, 96));
    if (ageY() >= 15) {
      const t = next === 'boom' ? '新聞說台灣經濟成長亮眼，股市創新高，很多公司都在擴大徵才。' :
        next === 'recession' ? '全球景氣急轉直下，新聞每天都在報導企業裁員、無薪假。' : '景氣慢慢恢復平穩。';
      sysCard(ECON_N[next], t, next === 'recession' ? { st: 3 } : null, { sn: 'street' });
    }
  }

  /* ---- 每月收支 ---- */
  function monthlyFinance() {
    const a = ageY();
    const stt = status();
    const items = [];
    const add = (n, v) => { v = Math.round(v); if (v) items.push({ n, v }); };
    if (stt === 'school') {
      const base = a < 6 ? 0 : a < 12 ? 300 : a < 15 ? 800 : 1500;
      if (base) add('存下的零用錢', money(base * WEALTH[S.fam.wealth].allow * 0.25));
    } else {
      const tier = S.city.tier;
      if (stt === 'work') {
        const J = S.job, jd = jobDef(J.id) || {};
        let pay = J.pay;
        if (jd.var) pay = Math.round(pay * clamp(1 + gauss() * jd.var, 0.25, 2.5));
        add(jd.var ? '本月收入' : '薪水', pay);
        add('勞健保自付', -pay * 0.04);
        add('休閒娛樂與購物', -pay * (0.08 + 0.015 * (S.alloc.leisure || 0) + 0.01 * (S.alloc.social || 0)) * rf(0.7, 1.3));
        { const base = money(32000); if (pay > base) add('所得稅與生活升級', -(pay - base) * 0.22); }
        S.pension += pay * 0.06;
        S.insM = (S.insM || 0) + 1;
      }
      if (stt === 'army') add(S.mil.kind === '替代役' ? '替代役薪餉' : '服役薪餉', 20320);
      if (stt === 'retired' && S.retire) {
        if (S.retire.civilPen) add('公職月退俸', S.retire.civilPen);
        else if (a >= 65 && S.retire.labor) add('勞保老年年金', S.retire.labor);
        else if (a >= 65) add('國民年金', money(4000));
        if (a >= 60 && S.pension > 0) { const p = Math.min(S.pension, Math.max(S.retire.pensionM || 0, money(3000))); S.pension -= p; add('勞退月領', p); }
      }
      if (a >= 50) add('醫療保健', -money(400 + (a - 50) * 110 + illLevel() * 600));
      for (const n of S.npcs) if (n.alive && n.careMode === 'helper') add(npcLabel(n) + '的看護費', -money(25000));
      for (const n of S.npcs) if (n.alive && n.careMode === 'home') add(npcLabel(n) + '的安養中心', -money(35000));
      for (const n of S.npcs) if (n.alive && n.careMode === 'share') add(npcLabel(n) + '的照顧分攤', -money(9000));
      if (S.selfCare === 'helper') add('自己的看護費', -money(25000));
      if (S.selfCare === 'home') add('安養中心', -money(35000));
      if (a >= 55) for (const c of kids()) if (c.adult && c.rel >= 45) add(c.name + '給的孝親費', money(5000));
      if (stt === 'uni') {
        add('家裡給的生活費', money(ALLOWANCE[S.fam.wealth]) * (S.school.abroad ? 2 : 1));
        if (S.tags.includes('打工族')) add('打工收入', S.wageH * 60);
      }
      if (stt === 'army') add('伙食與零用', -money(2500));
      else if (S.home === 'dorm') add('生活費＋宿舍', -money(S.school.abroad ? 22000 : 8000));
      else if (S.home === 'parents') add('生活費（住家裡）', -money(stt === 'uni' ? 3500 : 12000));
      else {
        const live = money(stt === 'uni' ? 7000 : LIVING[tier]);
        const rent = S.home === 'rent' ? rentOf(S.homeLv || 2) : 0;
        add('生活費', -live);
        if (rent) add('房租', -rent);
        if (marital() === 'married') add('伴侶分擔家用', (live + rent) * 0.45);
      }
      for (const c of kids()) {
        if (c.adult) continue;
        const ca = (S.ageM - c.born) / 12;
        add(c.name + (ca >= 18 ? '的學費與生活費' : '的養育費'), -money(ca < 6 ? 14000 : ca < 18 ? 12000 : 16000) * (marital() === 'married' ? 0.6 : 1));
        if (ca < 6) add('育兒津貼', money(5000));
      }
      if (S.give && stt === 'work') add('孝親費', -S.give);
      for (const id of Object.keys(S.own || {})) { const it = shopDef(id); if (it && it.up) add(it.n + '的開銷', -money(it.up)); }
      for (const L of S.loans) {
        if (L.rate && L.bal > 0 && (L.start == null || S.ageM >= L.start)) L.bal += L.bal * L.rate / 12;
        if (L.pay && (L.start == null || S.ageM >= L.start) && L.bal > 0) {
          const p = Math.min(L.pay, L.bal);
          L.bal -= p;
          add(L.n === '房貸' ? '房貸' : L.n + '還款', -p);
        }
      }
      S.loans = S.loans.filter(L => L.bal > 0.5);
      if (S.inv.mon) {
        if (S.money + (S.bank || 0) > S.inv.mon * 2) { S.inv.bal += S.inv.mon; add('定期定額投資', -S.inv.mon); }
      }
    }
    if (S.inv.bal > 0) {
      const mu = S.econ.s === 'boom' ? 0.009 : S.econ.s === 'recession' ? -0.01 : 0.0042;
      S.inv.bal = Math.max(0, S.inv.bal * (1 + mu + gauss() * 0.035));
    }
    let net = 0;
    for (const it of items) net += it.v;
    S.money += net;
    S.fin = { items, net, inc: items.filter(i => i.v > 0).reduce((s, i) => s + i.v, 0), exp: -items.filter(i => i.v < 0).reduce((s, i) => s + i.v, 0) };
    if (S.money < 0 && a >= 18) {
      S.flags.broke = (S.flags.broke || 0) + 1;
      S.stress = clamp(S.stress + 2, 0, 100);
      if (S.flags.broke % 3 === 1) {
        sysCard('手頭很緊', '這個月的帳戶變成負的了，信用卡帳單也快到期……得想想辦法。', null, {
          opts: [{ t: '向' + parentsWord() + '借錢', d: '家人會幫忙，但有點不好意思。', v: 'family', dis: S.fam.wealth <= 1 && famRelAvg() < 30 ? '家裡也很困難' : null },
            { t: '申請小額信用貸款', d: '借 ' + fmtMoney(money(60000)) + '，分 36 期還。', v: 'loan' },
            { t: '下班後多兼一份差', d: '辛苦一點，但能多賺一些。', v: 'extra' }], h: 'broke', sn: 'home'
        });
      }
    } else S.flags.broke = 0;
  }

  /* ---- 成年人的系統選擇 ---- */
  const ADULT_H = {
    jobhunt(j, item) {
      const o = item.opts[j].v;
      const out = [];
      if (!o) {
        if (S.job) { S.flags.hunt = false; item.res = '你決定在現在的公司再好好努力。'; }
        else { applyFx({ st: -4, md: 1 }, {}, out); item.res = '你給自己放了一個月的假。'; }
        return out;
      }
      const jd = jobDef(o.id);
      const ok = rand() * 100 < o.pct;
      item.ok = ok;
      if (ok) {
        const switching = !!S.job;
        if (switching) leaveJob('switch');
        startJob(jd, o.pay, out);
        item.res = (switching ? '你遞出辭呈，' : '') + '錄取了！從這個月開始，你在「' + S.job.co + '」擔任' + S.job.title + '。';
        applyFx({ md: 8, st: -6 }, {}, out);
      } else {
        item.res = pick(['面試完等了兩週，收到一封婉拒信。', '對方說會再通知你，之後就沒有消息了。', '你在最後一關被刷掉了。', '面試官說你很優秀，但他們找到更適合的人了。']);
        applyFx({ md: -3, st: 3 }, {}, out);
      }
      return out;
    },
    uniHome(j, item) {
      const v = item.opts[j].v;
      const out = [];
      S.home = v;
      out.push({ k: 'home', v: HOME_N[v] });
      if (v === 'rent') applyFx({ md: 3 }, {}, out);
      if (v === 'parents') applyFx({ rel: { parents: 3 } }, {}, out);
      item.res = v === 'dorm' ? '你搬進宿舍，認識了三位個性完全不同的室友。' : v === 'rent' ? '你在學校附近租了一間小套房，第一次有了自己的空間。' : '你每天搭車通勤上學，在車上背單字。';
      return out;
    },
    workHome(j, item) {
      const v = item.opts[j].v;
      const out = [];
      setHome(v, out);
      if (v === 'rent') { applyFx({ md: 4, rel: { parents: -2 } }, {}, out); item.res = '你搬進一間小小的出租套房，第一次自己繳水電費。'; }
      else { applyFx({ rel: { parents: 3 } }, {}, out); item.res = parentsWord() + '很開心你留在家裡，每天幫你留晚餐。'; }
      return out;
    },
    give(j, item) {
      const v = item.opts[j].v;
      const out = [];
      S.give = money(v);
      if (v) { applyFx({ rel: { parents: 4 + v / 1500 }, md: 2 }, {}, out); item.res = parentsWord() + '嘴上說不用，還是收下了，偷偷幫你存起來。'; if (v >= 6000) giveAch('孝順的孩子', out); }
      else item.res = '你決定先存錢，等之後收入穩定再說。';
      return out;
    },
    aftergrad(j, item) {
      const o = item.opts[j];
      const out = [];
      if (o.v === 'job') item.res = '你開始投履歷，正式踏入求職市場。';
      else if (o.v === 'grad') {
        const ok = rand() * 100 < o.pct;
        item.ok = ok;
        if (ok) { S.flags.gradNext = 'local'; item.res = '你考上了研究所！九月開學。'; applyFx({ md: 8 }, {}, out); }
        else { item.res = '研究所沒有考上，你決定先去找工作。'; applyFx({ md: -5 }, {}, out); }
      } else if (o.v === 'abroad') { S.flags.gradNext = 'abroad'; item.res = '你申請到國外的研究所，九月出發！'; applyFx({ md: 8 }, {}, out); }
      else if (o.v === 'prep') { S.flags.prep = { due: S.ageM + 10, kind: 'civil', tries: 0 }; item.res = '你報名了公職補習班，開始每天念書十小時的生活。'; applyFx({ st: 5 }, {}, out); }
      else if (o.v === 'army') { S.mil.callAt = S.ageM + 1; item.res = '你決定先去當兵，下個月入伍。'; }
      addLog('人生選擇', item.res, 'school');
      return out;
    },
    prepFail(j, item) {
      const out = [];
      if (item.opts[j].v === 'again') { S.flags.prep.due = S.ageM + 12; item.res = '你重新整理筆記，再拚一年。'; applyFx({ st: 4 }, {}, out); }
      else { S.flags.prep = null; item.res = '你決定先去找工作。'; }
      return out;
    },
    broke(j, item) {
      const v = item.opts[j].v;
      const out = [];
      if (v === 'family') { applyFx({ $: 40000, rel: { parents: -3 }, md: -2 }, {}, out); item.res = parentsWord() + '二話不說轉了錢給你，只叮嚀你要好好理財。'; }
      else if (v === 'loan') { addLoan('信用貸款', money(60000), money(1900)); S.money += money(60000); out.push({ k: '$', v: money(60000) }); item.res = '你申請了信用貸款，暫時度過難關。'; }
      else { S.money += money(12000); out.push({ k: '$', v: money(12000) }); applyFx({ st: 8, hp: -3 }, {}, out); item.res = '你下班後去兼差，累得回家倒頭就睡。'; }
      return out;
    }
  };

  /* ================================================================
   * 養成模式：每月行程、技能、人生抉擇
   * ================================================================ */
  const SKILLS = { piano: '鋼琴', art: '繪畫', dance: '舞蹈', swim: '游泳', ball: '球類運動', code: '程式設計', english: '英文', cook: '料理', write: '寫作', invest: '理財', garden: '園藝', calli: '書法', fit: '健身' };
  const SKILL_LV = [0, 1, 25, 50, 75, 100];
  const SKILL_LV_N = ['未學', '入門', '初級', '中級', '高級', '專業級'];
  const SKILL_TAG = { code: [1, '會寫程式'], english: [2, '英檢中高級'], swim: [1, '會游泳'], piano: [2, '鋼琴檢定'], cook: [2, '廚藝'], art: [2, '繪畫專長'], fit: [3, '健身達人'], invest: [2, '理財高手'] };
  const last = () => S.cur.items[S.cur.items.length - 1];
  function skillLv(k) { const n = (S.skills && S.skills[k]) || 0; let lv = 0; for (let i = 1; i < SKILL_LV.length; i++) if (n >= SKILL_LV[i]) lv = i; return lv; }
  function skillUp(k, out, amt) {
    S.skills = S.skills || {};
    const before = skillLv(k);
    S.skills[k] = (S.skills[k] || 0) + (amt || 1);
    const after = skillLv(k);
    if (after > before) {
      out.push({ k: 'skill', v: SKILLS[k] + '・' + SKILL_LV_N[after] });
      const t = SKILL_TAG[k];
      if (t && after >= t[0] && !S.tags.includes(t[1])) { S.tags.push(t[1]); out.push({ k: 'tag', v: t[1] }); }
      addLog('技能', SKILLS[k] + '升到「' + SKILL_LV_N[after] + '」了！', 'skill');
      if (after >= 5) giveAch('才藝大師', out);
    }
  }
  function acts() { return LG.ACTS || []; }
  function actDef(id) { return acts().find(a => a.id === id); }
  function lockedSlots() {
    const stt = status();
    if (stt === 'school') return S.school.stage === 'none' ? [] : [S.school.stage === 'kinder' ? 'kinder' : 'school'];
    if (stt === 'uni') return ['class'];
    if (stt === 'army') return ['service', 'service'];
    if (stt === 'work') return [S.job && S.job.id === 'owner' ? 'shop' : 'job'];
    return [];
  }
  function actWhy(A) {
    const a = ageY(), stt = status();
    if (A.a && (a < A.a[0] || a >= A.a[1])) return '年齡不符';
    if (A.stt && !A.stt.includes(stt)) return '現在的身分不能做';
    if (A.ms && !A.ms.includes(marital())) return A.ms.includes('dating') ? '要先有交往的對象' : '感情狀態不符';
    if (A.kid && !kids().some(c => !c.adult)) return '要有需要照顧的孩子';
    if (A.gkid && !npcsBy('grandchild').length) return '還沒有孫子';
    if (A.need) { try { if (!A.need(S, API)) return A.needT || '條件不符'; } catch (e) { return A.needT || '條件不符'; } }
    const cost = actCost(A);
    if (cost && famPays() && A.cost > 700 * S.fam.wealth) return '家裡負擔不起';
    if (cost && !famPays() && S.money < cost) return '錢不夠（需要 ' + fmtMoney(cost) + '）';
    return '';
  }
  function famPays() { return ageY() < 18 || (status() === 'school'); }
  function actCost(A) { return A.cost ? money(A.cost) : 0; }
  function actInc(A) { if (!A.inc) return 0; return typeof A.inc === 'function' ? Math.round(A.inc(S, API)) : money(A.inc); }
  function actVisible(A) {
    if (A.locked) return false;
    const a = ageY();
    if (A.a && (a < A.a[0] || a >= A.a[1])) return false;
    if (A.stt && !A.stt.includes(status())) return false;
    return true;
  }
  LG.schedule = function () {
    if (!S) return null;
    const locked = lockedSlots();
    const free = 4 - locked.length;
    const list = acts().filter(actVisible).map(A => ({ id: A.id, n: A.n, ico: A.ico, k: A.k, d: A.d || '', cost: actCost(A), fam: famPays(), inc: actInc(A), fx: A.fx || {}, skill: A.skill ? { k: A.skill, n: SKILLS[A.skill], lv: skillLv(A.skill), lvN: SKILL_LV_N[skillLv(A.skill)] } : null, why: actWhy(A) }));
    const okIds = new Set(list.filter(x => !x.why).map(x => x.id));
    let last = (S.sched || []).filter(id => okIds.has(id)).slice(0, free);
    const fill = list.filter(x => !x.why);
    let i = 0;
    while (last.length < free && fill.length) { last.push(fill[i % fill.length].id); i++; }
    return { locked: locked.map(id => { const A = actDef(id); return { id, n: A.n, ico: A.ico, k: A.k }; }), free, list, last };
  };
  LG.needSchedule = function () { return !!S && !S.ended && S.cur.phase === 'pre' && S.cur.items.every(i => i.done) && !S.cur.pre.length; };
  LG.runSchedule = function (ids) {
    if (!LG.needSchedule()) return false;
    const info = LG.schedule();
    const chosen = [];
    for (const id of (ids || []).slice(0, info.free)) { const A = actDef(id); if (A && actVisible(A) && !actWhy(A)) chosen.push(A); }
    for (const id of info.last) { if (chosen.length >= info.free) break; chosen.push(actDef(id)); }
    S.sched = chosen.map(A => A.id);
    const all = info.locked.map(x => actDef(x.id)).concat(chosen);
    const cnt = { study: 0, sport: 0, social: 0, leisure: 0, art: 0 };
    for (const A of all) cnt[A.k] = (cnt[A.k] || 0) + 1;
    S.alloc = {};
    for (const k of Object.keys(cnt)) S.alloc[k] = cnt[k] * 2.5;
    if (ageY() < 6) S.pref = cnt.sport >= Math.max(cnt.study, cnt.social) ? 'active' : cnt.social > cnt.study ? 'social' : 'quiet';
    S.flags.actM = {};
    const extra = [];
    for (const A of all) {
      const out = [];
      const cost = actCost(A);
      if (cost && !famPays()) { S.money -= cost; out.push({ k: '$', v: -cost }); }
      const inc = actInc(A);
      if (inc) { S.money += inc; out.push({ k: '$', v: inc }); }
      const b = bindEvent(A) || {};
      applyFx(A.fx, b, out);
      if (A.skill) skillUp(A.skill, out);
      if (A.mark) { S.flags[A.mark + 'At'] = S.ageM; S.flags[A.mark + 'N'] = (S.flags[A.mark + 'N'] || 0) + 1; }
      S.flags.actM[A.id] = (S.flags.actM[A.id] || 0) + 1;
      let text = A.n;
      if (A.t) { const tt = Array.isArray(A.t) ? A.t : [A.t]; const ok = tt.filter(x => !/\{(\w+)\}/.test(x) || bindEvent({ t: x })); text = render(pick(ok.length ? ok : [A.n]), b, A); }
      S.cur.items.push({ kind: 'act', id: A.id, k: A.k, title: A.n, ico: A.ico, text, chips: out, done: true, res: '', sn: A.sn || null, pose: A.pose || null, wear: A.wear || null, b, act: true });
      if (A.ev && !extra.includes(A.ev)) {
        const p = typeof A.evP === 'function' ? A.evP(S, API) : (A.evP || 0);
        if (chance(p)) extra.push(A.ev);
      }
    }
    postWork();
    natural();
    monthlyFinance();
    bankMonthly();
    marketMonthly();
    if (S.st.hp <= 0) healthCrisis([]);
    if (S.ended) { S.cur.phase = 'post'; S.cur.post.push('end'); return true; }
    if (S.stress >= 80 && ageY() >= 6 && !(S.cd.__stress !== undefined && S.ageM - S.cd.__stress < 6)) {
      S.cd.__stress = S.ageM;
      sysCard('壓力爆表', '最近壓力大到睡不好，胃也常常不舒服。你覺得自己快撐不下去了。', null, {
        opts: [{ t: '跟' + (ageY() < 25 ? parentsWord() : '信任的人') + '說出心裡的壓力' }, { t: '請假，好好休息幾天' }, { t: '咬牙硬撐過去' }], h: 'stress', log: false
      });
    }
    for (const id of extra) { const e = evById(id); if (e) { const b = bindEvent(e); if (b) S.cur.items.push(makeEvItem(e, b)); } }
    if (!extra.length) drawMonth();
    S.cur.phase = 'post';
    checkAch();
    return true;
  };


  /* ================================================================
   * v0.4：每週七日行程、國英數社自、社交、購物、房屋、小鎮走動
   * ================================================================ */
  const DAYS = ['一', '二', '三', '四', '五', '六', '日'];
  const SUBJ = { chi: '國文', eng: '英文', math: '數學', soc: '社會', sci: '自然' };
  const SUBJ_KEYS = Object.keys(SUBJ);
  const GEN_STUDY = { s_study: 1, s_cram: 1.4, s_library: 0.8, s_exam: 1.2, u_study: 0, k_book: 0 };
  function newAcc() { return { cnt: { study: 0, sport: 0, social: 0, leisure: 0, art: 0 }, subj: { chi: 0, eng: 0, math: 0, soc: 0, sci: 0 } }; }
  function ensureWeek() {
    ensureMoney();
    if (!S.wk) S.wk = { n: 1, acc: newAcc(), soc: 0, out: 3, spots: [], visited: [] };
    if (!S.wk.acc) S.wk.acc = newAcc();
    if (!S.wk.visited) S.wk.visited = [];
    if (!S.subj) { const g = S.grades || 60; S.subj = {}; for (const k of SUBJ_KEYS) S.subj[k] = clamp(g + gauss() * 6, 0, 100); }
    if (!S.own) S.own = {};
    if (S.homeLv == null) S.homeLv = 2;
    if (!S.plan7) S.plan7 = [];
  }
  function maxOut() { const a = ageY(); return a < 3 ? 0 : a < 6 ? 1 : a >= 85 ? 2 : 3; }
  function dayLock(d) {
    const stt = status(), a = ageY();
    if (stt === 'army') return d < 5 ? { lbl: '服役', full: true, k: 'sport' } : null;
    if (d >= 5) return null;
    if (stt === 'school') { if (a < 2 || S.school.stage === 'none') return null; const st = S.school.stage; return { lbl: st === 'kinder' || a < 6 ? '上幼兒園' : '上學', k: 'study' }; }
    if (stt === 'uni') return { lbl: '上課', k: 'study' };
    if (stt === 'work' && S.job) return { lbl: S.job.id === 'owner' ? '顧店' : '上班', k: 'study' };
    return null;
  }
  function dayK(d) {
    const L = dayLock(d);
    if (L && L.full) return 0;
    let any = false;
    for (let i = 0; i < 7; i++) if (dayLock(i)) { any = true; break; }
    if (L) return 0.08;
    return any ? 0.19 : 0.143;
  }
  function weekDays() { return DAYS.map((n, d) => ({ d, n, lock: dayLock(d), k: dayK(d) })); }
  function pickDefault(list, d) {
    const ok = list.filter(x => !x.why);
    if (!ok.length) return null;
    const pref = d >= 5 ? ['leisure', 'social', 'sport', 'art', 'study'] : ['study', 'art', 'sport', 'leisure', 'social'];
    for (const k of pref) { const c = ok.filter(x => x.k === k); if (c.length) return c[(d * 7 + S.ageM) % c.length].id; }
    return ok[0].id;
  }
  LG.week = function () {
    if (!S) return null;
    ensureWeek();
    const info = LG.schedule();
    const days = weekDays();
    const okIds = new Set(info.list.filter(x => !x.why).map(x => x.id));
    const plan = days.map(D => {
      if (D.k === 0) return null;
      const prev = S.plan7[D.d];
      if (prev && okIds.has(prev)) return prev;
      return pickDefault(info.list, D.d);
    });
    return { n: S.wk.n, month: S.month, days, list: info.list, plan, out: S.wk.out, outMax: maxOut(), soc: S.wk.soc, socMax: 2, spots: S.wk.spots.map((s, i) => ({ i, id: s.id, txt: s.txt, sn: s.sn, k: s.k, title: s.title })), phase: S.cur.phase };
  };
  function scaleFx(fx, k) {
    const o = {};
    for (const key of Object.keys(fx || {})) {
      const v = fx[key];
      if (typeof v === 'number') o[key] = v * k;
      else if (key === 'rel' && v && typeof v === 'object') { o.rel = {}; for (const r of Object.keys(v)) o.rel[r] = v[r] * k * 2; }
      else if (chance(k)) o[key] = v;
    }
    return o;
  }
  function skillAdd(key, amt, out) { skillUp(key, out, amt); }
  function wkSnap() {
    const rel = {};
    for (const n of S.npcs) if (n.alive) rel[n.id] = n.rel;
    return { st: Object.assign({}, S.st), stress: S.stress, money: S.money, rel, subj: Object.assign({}, S.subj) };
  }
  function diffChips(a, out) {
    const chips = [];
    for (const k of STAT_KEYS) { const d = S.st[k] - a.st[k]; if (Math.abs(d) >= 0.05) chips.push({ k, v: Math.abs(d) >= 1 ? Math.round(d) : (d > 0 ? 0.1 : -0.1) }); }
    const ds = S.stress - a.stress; if (Math.abs(ds) >= 0.3) chips.push({ k: 'st', v: Math.abs(ds) >= 1 ? Math.round(ds) : (ds > 0 ? 0.1 : -0.1) });
    const dm = S.money - a.money; if (dm) chips.push({ k: '$', v: dm });
    const rels = S.npcs.filter(n => n.alive && a.rel[n.id] != null && Math.abs(n.rel - a.rel[n.id]) >= 0.5).sort((x, y) => Math.abs(y.rel - a.rel[y.id]) - Math.abs(x.rel - a.rel[x.id])).slice(0, 3);
    for (const n of rels) chips.push({ k: 'rel', n: npcLabel(n), v: Math.round(n.rel - a.rel[n.id]) || (n.rel > a.rel[n.id] ? 0.1 : -0.1) });
    for (const c of out) if (['skill', 'tag', 'ach', 'inv', 'npc', 'trait'].includes(c.k)) chips.push(c);
    return chips;
  }
  LG.needWeek = () => LG.needSchedule();
  LG.runWeek = function (ids) {
    if (!LG.needSchedule()) return false;
    ensureWeek();
    const W = LG.week();
    const list = W.list;
    const plan = W.days.map((D, i) => {
      if (D.k === 0) return null;
      const id = ids && ids[i];
      const x = id && list.find(a => a.id === id && !a.why);
      return x ? x.id : W.plan[i];
    });
    S.plan7 = plan.slice();
    const before = wkSnap();
    const out = [];
    const extra = [];
    const texts = [];
    const acc = S.wk.acc;
    for (const D of W.days) {
      const id = plan[D.d];
      if (D.lock) acc.cnt[D.lock.k] += D.lock.full ? 0.1 : 0.05;
      if (!id) continue;
      const A = actDef(id);
      if (!A || actWhy(A)) continue;
      const k = D.k;
      const cost = Math.round(actCost(A) * k);
      if (cost && !famPays()) S.money -= cost;
      const inc = Math.round(actInc(A) * k);
      if (inc) S.money += inc;
      const b = bindEvent(A) || {};
      applyFx(scaleFx(A.fx, k), b, out);
      if (A.skill) skillUp(A.skill, out, 1);
      if (A.mark) { S.flags[A.mark + 'At'] = S.ageM; S.flags[A.mark + 'N'] = (S.flags[A.mark + 'N'] || 0) + k; }
      S.flags.actM = S.flags.actM || {};
      S.flags.actM[A.id] = (S.flags.actM[A.id] || 0) + 1;
      acc.cnt[A.k] = (acc.cnt[A.k] || 0) + k;
      if (A.subj) acc.subj[A.subj] += k;
      if (GEN_STUDY[A.id]) for (const s of SUBJ_KEYS) acc.subj[s] += k * GEN_STUDY[A.id] * 0.22;
      if (A.t) { const tt = Array.isArray(A.t) ? A.t : [A.t]; const okT = tt.filter(x => !/\{(\w+)\}/.test(x) || bindEvent({ t: x })); if (okT.length) texts.push({ d: D.d, t: render(pick(okT), b, A) }); }
      if (A.ev && !extra.includes(A.ev)) {
        const p = typeof A.evP === 'function' ? A.evP(S, API) : (A.evP || 0);
        if (chance(Math.min(0.9, p * k * 1.6))) extra.push(A.ev);
      }
    }
    const chips = diffChips(before, out);
    const hi = texts.length ? pick(texts) : null;
    S.cur.items.push({ kind: 'week', k: 's', title: S.month + ' 月第 ' + S.wk.n + ' 週', text: hi ? '星期' + DAYS[hi.d] + '，' + hi.t : '平平靜靜的一週。', chips, done: true, res: '',
      days: W.days.map(D => { const A = plan[D.d] && actDef(plan[D.d]); return { n: D.n, lock: D.lock ? D.lock.lbl : '', ico: A ? A.ico : (D.lock ? '🔒' : ''), a: A ? A.n : '' }; }), sn: null });
    for (const id of extra) { const e = evById(id); if (e) { const b = bindEvent(e); if (b) S.cur.items.push(makeEvItem(e, b)); } }
    // 本週小鎮上的事件
    S.wk.spots = [];
    S.wk.visited = [];
    S.wk.out = maxOut();
    S.wk.soc = 0;
    const a = ageY();
    if (a >= 1.5) {
      const nSpots = a < 6 ? 1 : 2 + (chance(0.35) ? 1 : 0);
      const pool = LG.events.filter(e => (e.k || 'd') !== 'f' && e.w !== 0 && eligible(e, false));
      let tries = 0;
      while (S.wk.spots.length < nSpots && tries++ < 30 && pool.length) {
        const e = wpick(pool, x => weightOf(x) * (x.ch ? 3 : 1));
        if (!e) break;
        pool.splice(pool.indexOf(e), 1);
        const b = bindEvent(e);
        if (!b) continue;
        const t0 = Array.isArray(e.t) ? e.t[0] : e.t;
        S.wk.spots.push({ id: e.id, b, txt: render(t0, b, e), sn: e.sn || null, k: e.k || 'd', title: render(e.title, b, e) || '' });
      }
    } else {
      // 嬰兒：每週有機會直接發生一件事
      if (chance(0.35)) {
        const pool = LG.events.filter(e => (e.k || 'd') !== 'f' && e.w !== 0 && eligible(e, true));
        const e = wpick(pool, weightOf); if (e) { const b = bindEvent(e); if (b) S.cur.items.push(makeEvItem(e, b)); }
      }
    }
    if (a >= 1 && chance(0.0035)) {
      const pool = LG.events.filter(e => e.k === 'f' && eligible(e, false));
      const e = wpick(pool, weightOf); if (e) { const b = bindEvent(e); if (b) S.cur.items.push(makeEvItem(e, b)); }
    }
    S.cur.phase = 'week';
    checkAch();
    return true;
  };
  // 小鎮上走動
  const LOC_FX = {
    park: { n: '公園', t: ['你在公園散步，吹著微風。', '你坐在長椅上看人放風箏。', '你在公園看到一群人在跳舞。'], fx: { md: 0.5, st: -0.6 } },
    cafe: { n: '咖啡廳', t: ['你點了一杯拿鐵，看著窗外發呆。', '你在咖啡廳看了一下午的書。'], fx: { md: 0.5, st: -0.5, $: -150 }, minA: 12 },
    shop: { n: '商店街', t: ['你在商店街逛了一圈。', '你在書店翻了好幾本書。'], fx: { md: 0.4, cr: 0.3 } },
    temple: { n: '廟口', t: ['你到廟裡拜拜，心情平靜了不少。', '廟口的阿伯請你喝了一杯茶。'], fx: { md: 0.4, st: -0.6 } },
    school: { n: '學校', t: ['放學後你在操場跑了幾圈。', '你在圖書館多待了一會兒。'], fx: { ft: 0.3, iq: 0.3 } },
    office: { n: '公司', t: ['你回公司把沒做完的工作收尾。', '你在公司多留了一個小時。'], fx: { perf: 1, st: 1 } },
    hospital: { n: '醫院', t: ['你去醫院量了血壓，一切正常。', '你陪鄰居去醫院拿藥。'], fx: { hp: 1 } },
    station: { n: '車站', t: ['你搭車到隔壁鎮逛逛。', '你在車站看著來來往往的人。'], fx: { md: 0.5, $: -100 }, minA: 8 },
    home: { n: '家', t: ['你在家整理房間。', '你在家睡了個午覺。'], fx: { st: -0.6, hp: 0.3 } }
  };
  LG.LOCS = Object.keys(LOC_FX).map(k => ({ k, n: LOC_FX[k].n }));
  LG.visit = function (loc, spotIdx) {
    if (!S || S.ended || S.cur.phase !== 'week') return { err: '現在不能出門' };
    if (S.cur.items.some(i => !i.done)) return { err: '先處理完眼前的事' };
    if (S.wk.out <= 0) return { err: '這週已經沒有空出門了' };
    const L = LOC_FX[loc];
    if (!L) return { err: '找不到這個地方' };
    if (L.minA && ageY() < L.minA) return { err: '年紀還太小，不能自己去' };
    S.wk.out--;
    if (spotIdx != null && S.wk.spots[spotIdx]) {
      const sp = S.wk.spots.splice(spotIdx, 1)[0];
      const e = evById(sp.id);
      if (e && eligible(e, false)) { S.cur.items.push(makeEvItem(e, sp.b)); return { ok: true, ev: true }; }
    }
    // 偶遇：在社交場所有機會認識新朋友或心動的人
    const a = ageY();
    if (['park', 'cafe', 'shop', 'station', 'temple', 'school'].includes(loc) && a >= 6 && chance(0.22)) {
      const id = a >= 16 && chance(0.45) && !['married', 'dating'].includes(marital()) ? 'a_meet' : 'a_newfriend';
      const e = evById(id);
      if (e) { const b = bindEvent(e); if (b) { S.cur.items.push(makeEvItem(e, b)); return { ok: true, ev: true }; } }
    }
    const fx = Object.assign({}, L.fx);
    if (fx.$) fx.$ = fx.$;
    const item = { kind: 'walk', k: 'd', title: '去' + L.n, text: pick(L.t), chips: [], done: true, res: '', sn: loc === 'station' ? 'street' : loc === 'school' ? (status() === 'uni' ? 'campus' : 'classroom') : loc === 'office' ? 'job' : loc };
    if (loc === 'office' && status() !== 'work') { delete fx.perf; delete fx.st; }
    item.chips = applyFx(fx, {}, []);
    S.cur.items.push(item);
    return { ok: true };
  };
  LG.endWeek = function () {
    if (!S || S.cur.phase !== 'week' || S.cur.items.some(i => !i.done)) return false;
    S.wk.spots = [];
    marketTick();
    if (S.wk.n < 4) {
      S.wk.n++;
      S.cur.phase = 'pre';
      return true;
    }
    monthEnd();
    return true;
  };
  function monthEnd() {
    const acc = S.wk.acc;
    S.alloc = {};
    for (const k of Object.keys(acc.cnt)) S.alloc[k] = acc.cnt[k] * 2.5;
    S.flags.subjM = acc.subj;
    if (ageY() < 6) { const c = acc.cnt; S.pref = c.sport >= Math.max(c.study, c.social) ? 'active' : c.social > c.study ? 'social' : 'quiet'; }
    const out = [];
    for (const id of lockedSlots()) { const A = actDef(id); if (A && A.fx) applyFx(A.fx, {}, out); }
    kindMonthly(out);
    S.wk.acc = newAcc();
    S.wk.n = 1;
    postWork();
    natural();
    monthlyFinance();
    bankMonthly();
    marketMonthly();
    if (S.st.hp <= 0) healthCrisis([]);
    if (S.ended) { S.cur.phase = 'post'; if (!S.cur.post.includes('end')) S.cur.post.push('end'); return; }
    if (S.stress >= 80 && ageY() >= 6 && !(S.cd.__stress !== undefined && S.ageM - S.cd.__stress < 6)) {
      S.cd.__stress = S.ageM;
      sysCard('壓力爆表', '最近壓力大到睡不好，胃也常常不舒服。你覺得自己快撐不下去了。', null, {
        opts: [{ t: '跟' + (ageY() < 25 ? parentsWord() : '信任的人') + '說出心裡的壓力' }, { t: '請假，好好休息幾天' }, { t: '咬牙硬撐過去' }], h: 'stress', log: false
      });
    }
    goalCheck([]);
    challengeTick();
    S.cur.phase = 'post';
    checkAch();
  }
  // 科目成績（每月）
  function subjMonthly(A) {
    if (!inSchool()) return;
    const summer = S.month === 7 || S.month === 8;
    if (summer) return;
    const m = S.flags.subjM || {};
    const tierPen = S.school.stage === 'senior' && S.school.tier === 3 ? 6 : 0;
    const base = 18 + 0.42 * S.st.iq + 4.2 * (A.study || 0) * 0.7 - Math.max(0, S.stress - 60) * 0.25 + (S.st.md - 50) * 0.08 + tAdd('grade') - tierPen;
    const bonus = { chi: kindSubBonus('chi') + (hasTrait('語言天賦') ? 5 : 0), eng: kindSubBonus('eng') + (hasTrait('語言天賦') ? 6 : 0) + skillLv('english') * 2, math: kindSubBonus('math') + (hasTrait('數學腦') ? 6 : 0), soc: kindSubBonus('soc'), sci: kindSubBonus('sci') + (hasTrait('數學腦') ? 3 : 0) };
    for (const s of SUBJ_KEYS) {
      const target = clamp(base + 45 * (m[s] || 0) + bonus[s], 0, 100);
      S.subj[s] = clamp(S.subj[s] + (target - S.subj[s]) * 0.15 + gauss() * 1.4, 0, 100);
    }
    S.grades = SUBJ_KEYS.reduce((t, s) => t + S.subj[s], 0) / SUBJ_KEYS.length;
  }
  LG.subjects = () => { ensureWeek(); return SUBJ_KEYS.map(k => ({ k, n: SUBJ[k], v: Math.round(S.subj[k]) })); };

  // 社交：和誰吃飯、出遊、告白
  const SOC_ROLES = ['mom', 'dad', 'grandma', 'grandpa', 'sib', 'friend', 'crush', 'spouse', 'child', 'grandchild', 'colleague', 'oldfriend', 'ex'];
  function socWhy(n, kind) {
    const a = ageY();
    if (!n || !n.alive) return '找不到這個人';
    if (!SOC_ROLES.includes(n.role)) return '';
    if (S.ended) return '人生已經結束';
    if (a < 4) return '年紀還太小';
    if (S.cur.items.some(i => !i.done)) return '先處理完眼前的事';
    if (!['pre', 'week'].includes(S.cur.phase)) return '等下個月再約吧';
    if (kind === 'chat') return S.wk.chat >= 3 ? '這週已經聊很多了' : '';
    if (S.wk.soc >= 2) return '這週的約會已經排滿了（每週 2 次）';
    const na = npcAge(n);
    if ((n.role === 'child' || n.role === 'grandchild') && na < 3) return '孩子還太小';
    if (kind === 'meal') { const c = money(a < 18 ? 150 : 600); return S.money < c && a >= 18 ? '錢不夠' : ''; }
    if (kind === 'trip') { if (a < 10) return '要 10 歲以上'; const c = money(a < 18 ? 600 : 4000); return S.money < c ? '錢不夠（約 ' + fmtMoney(c) + '）' : ''; }
    if (kind === 'date') return n.role === 'crush' && S.tags.includes('交往中') ? '' : '只能和交往對象約會';
    if (kind === 'confess') {
      if (a < 14) return '要 14 歲以上';
      if (['dating', 'married'].includes(marital())) return '你已經有對象了';
      if (!['friend', 'colleague', 'oldfriend', 'crush', 'ex'].includes(n.role)) return '只能對朋友或同事告白';
      if (Math.abs(na - a) > 15) return '年紀差太多了';
      if (n.rel < 40) return '還不夠熟（好感 ' + Math.round(n.rel) + '／需要 40）';
      return '';
    }
    if (kind === 'breakup') return n.role === 'crush' && S.tags.includes('交往中') ? '' : '你們沒有在交往';
    return '';
  }
  LG.socialOpts = function (id) {
    const n = npc(id);
    if (!n) return [];
    const a = ageY();
    const dating = n.role === 'crush' && S.tags.includes('交往中');
    const ks = [['chat', a < 12 ? '一起玩' : '聊聊天'], ['meal', '一起吃飯'], ['trip', '一起出遊']];
    if (dating) ks.push(['date', '浪漫約會']);
    if (!dating && ['friend', 'colleague', 'oldfriend', 'ex', 'crush'].includes(n.role) && a >= 14 && n.role !== 'spouse') ks.push(['confess', '告白']);
    if (dating) ks.push(['breakup', '提分手']);
    return ks.map(([k, t]) => ({ k, t, why: socWhy(n, k) }));
  };
  LG.social = function (id, kind) {
    const n = npc(id);
    const why = socWhy(n, kind);
    if (why) return { err: why };
    const a = ageY();
    const nm = npcLabel(n);
    const b = { _who: n.id };
    let text = '', fx = {}, res = '', ok = null, sn = 'cafe';
    const relK = n.role === 'crush' || n.role === 'spouse' ? 1.2 : 1;
    if (kind === 'chat') {
      S.wk.chat = (S.wk.chat || 0) + 1;
      text = a < 12 ? pick(['你和' + nm + '玩了一下午。', '你拉著' + nm + '一起玩遊戲。']) : pick(['你和' + nm + '聊了好久。', '你打電話給' + nm + '，聊聊最近的生活。', '你傳訊息給' + nm + '，兩人聊到半夜。']);
      fx = { md: 0.5 }; n.rel = clamp(n.rel + 2.5 * relK, -100, 100); sn = 'home';
    } else if (kind === 'meal' || kind === 'date' || kind === 'trip') {
      S.wk.soc++;
      const trip = kind === 'trip';
      const cost = money(trip ? (a < 18 ? 600 : 4000) : kind === 'date' ? (a < 18 ? 300 : 1500) : (a < 18 ? 150 : 600));
      if (!(a < 18 && trip && S.money < cost)) fx.$ = -cost / S.cpi;
      const place = trip ? pick(['海邊', '山上', '老街', '遊樂園', '溫泉']) : kind === 'date' ? pick(['夜景餐廳', '電影院', '河濱', '夜市']) : pick(['巷口的小吃店', '火鍋店', '拉麵店', '早午餐店', '夜市']);
      text = (trip ? '你和' + nm + '一起去' + place + '玩。' : kind === 'date' ? '你和' + nm + '去' + place + '約會。' : '你約' + nm + '去' + place + '吃飯。') + pick(['聊得很開心。', '時間過得好快。', '你們拍了好多照片。', '你們聊起了以前的事。']);
      const g = (trip ? 11 : kind === 'date' ? 9 : 6) * relK * (hasTrait('心軟') ? 1.15 : 1);
      n.rel = clamp(n.rel + g, -100, 100);
      fx.md = trip ? 2 : 1; fx.st = trip ? -2 : -1;
      sn = trip ? (place === '海邊' ? 'beach' : place === '山上' ? 'mountain' : 'street') : place === '夜市' ? 'nightmarket' : place === '河濱' ? 'park' : 'cafe';
      if (n.role === 'crush') n.since = n.since || S.ageM;
    } else if (kind === 'confess') {
      S.wk.soc++;
      const p = clamp(0.15 + (S.st.ch - 50) / 120 + (n.rel - 40) / 80 + (n.role === 'crush' ? 0.15 : 0), 0.08, 0.92);
      ok = chance(p);
      text = '你鼓起勇氣，對' + nm + '說出了心裡的話。';
      sn = 'park';
      if (ok) {
        if (n.role !== 'crush') { for (const c of npcsBy('crush')) c.role = 'friend'; n.role = 'crush'; }
        n.since = S.ageM;
        n.rel = clamp(n.rel + 15, -100, 100);
        fx = { md: 10, tag: '交往中' };
        res = n.name + '紅著臉點了點頭。你們開始交往了！';
        addLog('交往', '你和' + n.name + '開始交往。', 'family');
      } else {
        n.rel = clamp(n.rel - 8, -100, 100);
        fx = { md: -6 };
        res = n.name + '說：「謝謝你，可是我們還是當朋友比較好。」';
      }
    } else if (kind === 'breakup') {
      text = '你和' + nm + '談了很久，決定分開。';
      fx = { breakup: true, md: -6 }; sn = 'park';
    }
    const item = { kind: 'soc', k: kind === 'confess' ? 'o' : 'd', title: { chat: '聊天', meal: '吃飯', trip: '出遊', date: '約會', confess: '告白', breakup: '分手' }[kind], text, chips: [], done: true, res, ok, sn, b: { friend: n.id } };
    const before = n.rel;
    item.chips = applyFx(fx, b, []);
    if (kind !== 'breakup') item.chips.push({ k: 'rel', n: npcLabel(n), v: Math.round(n.rel - before) || 0 });
    S.cur.items.push(item);
    checkAch();
    return { ok: true };
  };

  // 購物與房屋
  function shopDef(id) { return (LG.SHOP || []).find(x => x.id === id); }
  LG.shopList = function () {
    ensureWeek();
    const a = ageY();
    return (LG.SHOP || []).map(it => {
      const price = money(it.price);
      let why = '';
      if (S.own[it.id]) why = '已經擁有';
      else if (it.minA && a < it.minA) why = it.minA + ' 歲以上才能買';
      else if (it.need && !it.need(S)) why = it.needT || '條件不符';
      else if (S.money < price) why = '錢不夠（還差 ' + fmtMoney(price - S.money) + '）';
      return { id: it.id, n: it.n, ico: it.ico, cat: it.cat, d: it.d, price, up: it.up ? money(it.up) : 0, own: !!S.own[it.id], why, sell: S.own[it.id] ? Math.round(price * (it.resale || 0.4)) : 0 };
    });
  };
  LG.buy = function (id) {
    const it = shopDef(id);
    const row = LG.shopList().find(x => x.id === id);
    if (!it || !row || row.why) return { err: row ? row.why : '沒有這個商品' };
    S.money -= row.price;
    S.own[id] = { at: S.ageM };
    const out = [{ k: '$', v: -row.price }];
    applyFx(it.fx || {}, {}, out);
    S.cur.items.push({ kind: 'buy', k: 'o', title: '購物', text: it.buyT || ('你買了' + it.n + '！'), chips: out, done: true, res: '', sn: 'shop' });
    addLog('購物', '你買了' + it.n + '（' + fmtMoney(row.price) + '）。', 'money');
    return { ok: true };
  };
  LG.sell = function (id) {
    const it = shopDef(id);
    if (!it || !S.own[id]) return { err: '你沒有這個東西' };
    const v = Math.round(money(it.price) * (it.resale || 0.4));
    delete S.own[id];
    S.money += v;
    S.cur.items.push({ kind: 'buy', k: 'd', title: '賣掉', text: '你把' + it.n + '賣掉了。', chips: [{ k: '$', v }], done: true, res: '', sn: 'shop' });
    return { ok: true };
  };
  function ownPerks() {
    const p = { md: 0, st: 0, grow: {} };
    for (const id of Object.keys(S.own || {})) {
      const it = shopDef(id); if (!it || !it.perk) continue;
      p.md += it.perk.md || 0; p.st += it.perk.st || 0;
      for (const k of Object.keys(it.perk.grow || {})) p.grow[k] = (p.grow[k] || 0) + it.perk.grow[k];
    }
    const H = homeDef();
    if (H) p.md += H.md || 0;
    return p;
  }
  function homeDef() {
    if (!LG.HOMES) return null;
    if (S.home === 'rent') return LG.HOMES.rent.find(h => h.lv === S.homeLv);
    if (S.home === 'own') return LG.HOMES.buy.find(h => h.lv === S.homeLv);
    return null;
  }
  function rentOf(lv) { const h = LG.HOMES ? LG.HOMES.rent.find(x => x.lv === lv) : null; return money(RENT[S.city.tier] * (h ? h.mul : 1)); }
  function priceOf(lv) { const h = LG.HOMES ? LG.HOMES.buy.find(x => x.lv === lv) : null; return money(HOUSE[S.city.tier] * (h ? h.mul : 1)); }
  LG.homeOptions = function () {
    ensureWeek();
    const a = ageY(), stt = status();
    const base = a < 18 ? '要 18 歲以上' : ['school', 'army'].includes(stt) ? '現在不方便搬家' : '';
    const sellV = S.house ? Math.max(0, S.house.price - S.loans.filter(l => l.n === '房貸').reduce((t, l) => t + l.bal, 0)) : 0;
    const rent = LG.HOMES.rent.map(h => ({ kind: 'rent', lv: h.lv, n: h.n, d: h.d, ico: h.ico, cost: rentOf(h.lv), cur: S.home === 'rent' && S.homeLv === h.lv, why: base || (S.home === 'rent' && S.homeLv === h.lv ? '目前住在這裡' : '') }));
    const buy = LG.HOMES.buy.map(h => {
      const price = priceOf(h.lv), down = Math.round(price * 0.23);
      const cur = S.home === 'own' && S.homeLv === h.lv;
      return { kind: 'buy', lv: h.lv, n: h.n, d: h.d, ico: h.ico, cost: price, down, cur, why: base || (cur ? '目前住在這裡' : a < 20 ? '要 20 歲以上' : S.money + sellV < down ? '頭期款還差 ' + fmtMoney(down - S.money - sellV) : '') };
    });
    const home = { kind: 'parents', n: '搬回家和家人住', why: S.home === 'parents' ? '目前和家人同住' : marital() === 'married' ? '已經成家了' : !S.npcs.some(n => (n.role === 'mom' || n.role === 'dad') && n.alive) ? '家人都不在了' : base };
    return { rent, buy, home, cur: S.home, lv: S.homeLv, curN: homeDef() ? homeDef().n : HOME_N[S.home], sellV };
  };
  LG.moveHome = function (kind, lv) {
    const o = LG.homeOptions();
    const opt = kind === 'parents' ? o.home : (kind === 'rent' ? o.rent : o.buy).find(x => x.lv === lv);
    if (!opt || opt.why) return { err: opt ? opt.why : '沒有這個選項' };
    const out = [];
    if (S.home === 'own' && S.house) {
      const v = o.sellV;
      S.loans = S.loans.filter(l => l.n !== '房貸');
      S.money += v; S.house = null;
      out.push({ k: '$', v });
    }
    let text;
    if (kind === 'parents') { setHome('parents', out); text = parentsWord() + '很開心你搬回來。'; }
    else if (kind === 'rent') { S.homeLv = lv; S.home = null; setHome('rent', out); text = '你搬進了新租的' + opt.n + '，每月房租 ' + fmtMoney(opt.cost) + '。'; }
    else {
      S.homeLv = lv;
      const price = opt.cost, down = opt.down;
      S.money -= down;
      const loan = price - down;
      const r = 0.022 / 12, n = 360;
      const pay = Math.round(loan * r / (1 - Math.pow(1 + r, -n)));
      S.loans.push({ n: '房貸', bal: loan, pay, start: S.ageM });
      S.house = { price, at: S.ageM, lv };
      S.home = 'own';
      out.push({ k: '$', v: -down }, { k: 'home', v: opt.n });
      giveAch('買房成家', out);
      text = '你買下了' + opt.n + '！總價 ' + fmtMoney(price) + '，每月房貸 ' + fmtMoney(pay) + '。';
    }
    S.cur.items.push({ kind: 'buy', k: 'o', title: '搬家', text, chips: out, done: true, res: '', sn: 'home' });
    addLog('搬家', text, 'family');
    return { ok: true };
  };
  LG.ownList = () => Object.keys(S.own || {}).map(id => shopDef(id)).filter(Boolean).map(it => ({ id: it.id, n: it.n, ico: it.ico }));


  /* ================================================================
   * v0.5：銀行（存款、提款、貸款）、股票市場、父母婚姻
   * ================================================================ */
  // ---- 銀行 ----
  const BANK_RATE = 0.016; // 活儲年利率
  function ensureMoney() {
    if (S.bank == null) S.bank = 0;
    if (!S.mkt) initMarket();
    if (!S.hold) S.hold = {};
    if (S.fam && S.fam.pm == null) S.fam.pm = clamp(ri(45, 85) + (S.fam.wealth - 3) * 3, 20, 95);
  }
  function bankAge() { return ageY() >= 12; }
  LG.bankInfo = function () {
    ensureMoney();
    const a = ageY();
    const loans = (S.loans || []).map((L, i) => ({ i, n: L.n, bal: Math.round(L.bal), pay: L.pay || 0, rate: L.rate || 0, payoff: Math.round(L.bal), can: !!L.bank && S.money + S.bank >= L.bal }));
    return { cash: Math.round(S.money), bank: Math.round(S.bank), rate: BANK_RATE, open: bankAge(), why: bankAge() ? '' : '12 歲以上才能自己開戶', loanOffer: loanOffer(), loans, age: a };
  };
  LG.deposit = function (amt) {
    ensureMoney();
    if (!bankAge()) return { err: '12 歲以上才能自己開戶' };
    amt = Math.round(amt === 'all' ? S.money : +amt);
    if (!(amt > 0)) return { err: '金額不對' };
    if (amt > S.money) return { err: '身上沒有這麼多現金' };
    S.money -= amt; S.bank += amt;
    addLog('銀行', '存入 ' + fmtMoney(amt) + '。', 'money');
    return { ok: true };
  };
  LG.withdraw = function (amt) {
    ensureMoney();
    amt = Math.round(amt === 'all' ? S.bank : +amt);
    if (!(amt > 0)) return { err: '金額不對' };
    if (amt > S.bank) return { err: '存款不夠' };
    S.bank -= amt; S.money += amt;
    addLog('銀行', '提領 ' + fmtMoney(amt) + '。', 'money');
    return { ok: true };
  };
  function monthlyPay() {
    if (status() === 'work' && S.job) return S.job.pay;
    if (S.retired && S.retire) return (S.retire.civilPen || S.retire.labor || 0) + (S.retire.pensionM || 0);
    return 0;
  }
  function loanOffer() {
    const a = ageY();
    const pay = monthlyPay();
    const has = (S.loans || []).filter(L => L.bank).reduce((t, L) => t + L.bal, 0);
    let why = '';
    if (a < 20) why = '要 20 歲以上才能申請貸款';
    else if (!pay) why = '要有穩定收入（工作或退休金）才能貸款';
    else if (a >= 75) why = '年紀太大，銀行不核貸';
    const limit = Math.max(0, Math.round(Math.min(pay * 22, money(3000000)) - has));
    if (!why && limit < money(30000)) why = '已經接近貸款上限了';
    const score = clamp((S.job ? S.job.perf : 50) / 100 * 0.4 + clamp(pay / money(80000), 0, 1) * 0.4 + ((S.flags.broke || 0) ? 0 : 0.2), 0, 1);
    const rate = Math.round((0.085 - score * 0.06) * 1000) / 1000;
    return { why, limit, rate, years: [3, 5, 7] };
  }
  function annuity(P, rate, n) { const r = rate / 12; return Math.ceil(P * r / (1 - Math.pow(1 + r, -n))); }
  LG.borrow = function (amt, years) {
    ensureMoney();
    const o = loanOffer();
    if (o.why) return { err: o.why };
    amt = Math.round(+amt);
    years = [3, 5, 7].includes(+years) ? +years : 5;
    if (!(amt >= money(10000))) return { err: '最少要借 ' + fmtMoney(money(10000)) };
    if (amt > o.limit) return { err: '超過可借額度 ' + fmtMoney(o.limit) };
    const pay = annuity(amt, o.rate, years * 12);
    S.loans.push({ n: '信用貸款', bal: amt, pay, start: S.ageM + 1, rate: o.rate, bank: true, prin: amt, at: S.ageM });
    S.money += amt;
    addLog('貸款', '向銀行借了 ' + fmtMoney(amt) + '，年利率 ' + (o.rate * 100).toFixed(1) + '%，每月還 ' + fmtMoney(pay) + '，共 ' + years + ' 年。', 'money');
    return { ok: true, pay };
  };
  LG.repay = function (i) {
    ensureMoney();
    const L = S.loans[i];
    if (!L) return { err: '沒有這筆貸款' };
    const due = Math.round(L.bal);
    if (S.money + S.bank < due) return { err: '現金加存款不夠還清' };
    let left = due;
    const c = Math.min(Math.max(0, S.money), left); S.money -= c; left -= c;
    S.bank -= left;
    S.loans.splice(i, 1);
    addLog('貸款', '提前還清' + L.n + ' ' + fmtMoney(due) + '。', 'money');
    return { ok: true };
  };
  // 月底：利息、存款自動扣繳
  function bankMonthly() {
    ensureMoney();
    if (S.bank > 0) {
      const it = Math.round(S.bank * BANK_RATE / 12);
      S.bank += it;
      if (S.fin && it) S.fin.items.push({ n: '銀行利息（存進存款）', v: 0, note: it });
    }
    if (S.money < 0 && S.bank > 0) {
      const t = Math.min(S.bank, -S.money);
      S.bank -= t; S.money += t;
      if (S.fin) S.fin.items.push({ n: '從存款自動扣繳', v: 0, note: t });
      if (S.money >= 0) S.flags.broke = 0;
    }
  }

  // ---- 定期定額基金：金額自己決定 ----
  function fundWhy() { return ageY() < 18 ? '18 歲以上才能開戶投資' : ''; }
  LG.fundInfo = function () {
    ensureMoney();
    const pay = monthlyPay();
    return { bal: Math.round(S.inv.bal), mon: S.inv.mon || 0, why: fundWhy(), pay, cash: Math.round(S.money), bank: Math.round(S.bank), max: money(300000) };
  };
  LG.setInvest = function (amt) {
    const why = fundWhy(); if (why) return { err: why };
    amt = Math.round(+amt);
    if (!(amt >= 0)) return { err: '金額不對' };
    if (amt && amt < 1000) return { err: '每月最少 1,000 元' };
    if (amt > money(300000)) return { err: '每月最多 ' + fmtMoney(money(300000)) };
    S.inv.mon = Math.round(amt / 100) * 100;
    addLog('投資', S.inv.mon ? '定期定額改為每月 ' + fmtMoney(S.inv.mon) + '。' : '停止每月定期定額。', 'money');
    return { ok: true, mon: S.inv.mon };
  };
  LG.fundAdd = function (amt) {
    const why = fundWhy(); if (why) return { err: why };
    amt = Math.round(+amt);
    if (!(amt >= 1000)) return { err: '最少投入 1,000 元' };
    if (amt > S.money) return { err: '錢包現金不夠（可以先從銀行提款）' };
    S.money -= amt; S.inv.bal += amt;
    addLog('投資', '單筆投入基金 ' + fmtMoney(amt) + '。', 'money');
    return { ok: true };
  };
  LG.fundSell = function (amt) {
    amt = amt === 'all' ? Math.round(S.inv.bal) : Math.round(+amt);
    if (!(amt > 0)) return { err: '金額不對' };
    if (amt > S.inv.bal + 1) return { err: '基金裡沒有這麼多' };
    amt = Math.min(amt, Math.round(S.inv.bal));
    S.inv.bal -= amt; S.money += amt;
    if (S.inv.bal < 1) S.inv.bal = 0;
    addLog('投資', '贖回基金 ' + fmtMoney(amt) + '。', 'money');
    return { ok: true, amt };
  };

  // ---- 股票市場（公司全是虛構的） ----
  const STOCKS = [
    { id: 'idx', n: '小鎮50 指數基金', sec: '指數', p0: 150, beta: 1, vol: 0.012, mu: 0.0002, dy: 0.03, d: '一次買進市場前 50 大公司，波動最小。' },
    { id: 'chip', n: '晴光晶片', sec: '半導體', p0: 880, beta: 1.4, vol: 0.03, mu: 0.0004, dy: 0.018, d: '幫手機和電腦做晶片的大廠，成長快、波動大。' },
    { id: 'pc', n: '方塊電腦', sec: '電子', p0: 120, beta: 1.2, vol: 0.026, mu: 0.0001, dy: 0.035, d: '筆電與伺服器組裝。' },
    { id: 'bank', n: '大樹金控', sec: '金融', p0: 32, beta: 0.7, vol: 0.013, mu: 0.0001, dy: 0.05, d: '銀行和保險，配息穩定。' },
    { id: 'tel', n: '雲朵電信', sec: '電信', p0: 115, beta: 0.4, vol: 0.009, mu: 0.0004, dy: 0.045, d: '手機門號與網路，景氣不好時也很抗跌。' },
    { id: 'ship', n: '海鷗航運', sec: '航運', p0: 60, beta: 1.6, vol: 0.045, mu: 0, dy: 0.06, d: '貨櫃船公司，暴漲暴跌。' },
    { id: 'food', n: '暖暖食品', sec: '食品', p0: 70, beta: 0.5, vol: 0.011, mu: 0.0003, dy: 0.04, d: '泡麵、飲料、便利商店。' },
    { id: 'bio', n: '新芽生技', sec: '生技', p0: 45, beta: 1.1, vol: 0.05, mu: 0.0002, dy: 0, d: '研發新藥中，可能大成功，也可能一蹶不振。' },
    { id: 'game', n: '星星遊戲', sec: '娛樂', p0: 210, beta: 1.3, vol: 0.035, mu: 0.0002, dy: 0.02, d: '手機遊戲公司，靠新作品決定股價。' }
  ];
  const FEE = 0.001425, TAX = 0.003;
  function initMarket() {
    S.mkt = { p: {}, hist: {}, last: {}, wk: 0 };
    for (const k of STOCKS) {
      const p = Math.round(k.p0 * S.cpi * rf(0.85, 1.15) * 100) / 100;
      S.mkt.p[k.id] = p; S.mkt.hist[k.id] = [p]; S.mkt.last[k.id] = p;
    }
  }
  function stockDef(id) { return STOCKS.find(s => s.id === id); }
  function marketTick() {
    ensureMoney();
    const e = S.econ.s;
    const mret = (e === 'boom' ? 0.0022 : e === 'recession' ? -0.003 : 0.0008) + gauss() * 0.016;
    for (const k of STOCKS) {
      let r = k.mu + k.beta * mret + gauss() * k.vol;
      if (chance(0.004)) r += (chance(0.5) ? 1 : -1) * rf(0.08, 0.25) * (k.vol / 0.03);
      S.mkt.last[k.id] = S.mkt.p[k.id];
      S.mkt.p[k.id] = Math.max(1, Math.round(S.mkt.p[k.id] * Math.exp(r) * 100) / 100);
    }
    S.mkt.wk++;
  }
  function marketMonthly() {
    ensureMoney();
    for (const k of STOCKS) { const h = S.mkt.hist[k.id]; h.push(S.mkt.p[k.id]); if (h.length > 36) h.shift(); }
    // 7 月配息
    if (S.month === 7) {
      let tot = 0;
      for (const id of Object.keys(S.hold)) { const k = stockDef(id); if (!k || !k.dy) continue; tot += S.hold[id].sh * S.mkt.p[id] * k.dy * rf(0.7, 1.2); }
      tot = Math.round(tot);
      if (tot > 0) { S.money += tot; if (S.fin) S.fin.items.push({ n: '股票股利', v: tot }); addLog('股利', '收到股票股利 ' + fmtMoney(tot) + '。', 'money'); }
    }
  }
  function stockAge() { return ageY() >= 18; }
  LG.market = function () {
    ensureMoney();
    const list = STOCKS.map(k => {
      const p = S.mkt.p[k.id], h = S.mkt.hist[k.id], last = S.mkt.last[k.id];
      const hold = S.hold[k.id];
      return { id: k.id, n: k.n, sec: k.sec, d: k.d, p, chg: last ? (p - last) / last : 0, y1: h.length > 12 ? (p - h[h.length - 13]) / h[h.length - 13] : null, dy: k.dy, hist: h.slice(), sh: hold ? hold.sh : 0, cost: hold ? hold.cost : 0, val: hold ? Math.round(hold.sh * p) : 0 };
    });
    const val = list.reduce((t, x) => t + x.val, 0), cost = list.reduce((t, x) => t + (x.sh ? x.cost * x.sh : 0), 0);
    return { list, val, cost: Math.round(cost), open: stockAge(), why: stockAge() ? '' : '18 歲以上才能開證券戶', cash: Math.round(S.money), fee: FEE, tax: TAX };
  };
  LG.buyStock = function (id, sh) {
    ensureMoney();
    if (!stockAge()) return { err: '18 歲以上才能開證券戶' };
    if (S.ended) return { err: '人生已經結束' };
    const k = stockDef(id); sh = Math.floor(+sh);
    if (!k || !(sh > 0)) return { err: '數量不對' };
    const p = S.mkt.p[id], amt = p * sh, fee = Math.max(20, Math.round(amt * FEE)), tot = Math.round(amt + fee);
    if (tot > S.money) return { err: '現金不夠（需要 ' + fmtMoney(tot) + '，可以先從銀行提款）' };
    S.money -= tot;
    const h = S.hold[id] || { sh: 0, cost: 0 };
    h.cost = (h.cost * h.sh + tot) / (h.sh + sh); h.sh += sh;
    S.hold[id] = h;
    addLog('股票', '買進' + k.n + ' ' + sh + ' 股，每股 ' + p.toFixed(2) + ' 元，共 ' + fmtMoney(tot) + '。', 'money');
    giveAch('股市新手');
    return { ok: true, tot };
  };
  LG.sellStock = function (id, sh) {
    ensureMoney();
    const k = stockDef(id), h = S.hold[id];
    if (!k || !h) return { err: '沒有持股' };
    sh = sh === 'all' ? h.sh : Math.min(h.sh, Math.floor(+sh));
    if (!(sh > 0)) return { err: '數量不對' };
    const p = S.mkt.p[id], amt = p * sh;
    const net = Math.round(amt - Math.max(20, amt * FEE) - amt * TAX);
    const gain = Math.round(net - h.cost * sh);
    S.money += net;
    h.sh -= sh;
    if (h.sh <= 0) delete S.hold[id];
    S.flags.stockGain = (S.flags.stockGain || 0) + gain;
    addLog('股票', '賣出' + k.n + ' ' + sh + ' 股，拿回 ' + fmtMoney(net) + '（' + (gain >= 0 ? '賺' : '賠') + ' ' + fmtMoney(Math.abs(gain)) + '）。', 'money');
    if (S.flags.stockGain >= money(1000000)) giveAch('股市贏家');
    return { ok: true, net, gain };
  };
  function stockValue() { if (!S.hold || !S.mkt) return 0; let v = 0; for (const id of Object.keys(S.hold)) v += S.hold[id].sh * S.mkt.p[id]; return Math.round(v); }

  // ---- 父母的婚姻（隨機） ----
  function parentsMonthly() {
    ensureMoney();
    const a = ageY();
    if (S.fam.struct !== 'both' || a >= 25) return;
    const mom = npcsBy('mom')[0], dad = npcsBy('dad')[0];
    if (!mom || !dad) return;
    S.fam.pm = clamp(S.fam.pm + gauss() * 2.2 + (S.fam.pm < 50 ? -0.15 : 0.12) - (S.econ.s === 'recession' ? 0.2 : 0) - (S.fam.wealth <= 1 ? 0.1 : 0), 0, 100);
    if (a < 3) return;
    // 吵架的預兆
    if (S.fam.pm < 42 && chance(0.05) && !(S.cd.__pfight != null && S.ageM - S.cd.__pfight < 8)) {
      S.cd.__pfight = S.ageM;
      sysCard('爸媽吵架了', pick(['半夜你被吵醒，聽到爸媽在客廳大聲爭吵。', '吃晚飯的時候，爸媽一句話也不說，氣氛好冷。', '爸爸摔門出去，媽媽在房間裡哭。']), null, {
        opts: a < 7 ? [{ t: '抱著娃娃躲進被窩', v: 'hide' }, { t: '跑去抱住媽媽', v: 'hug' }] : [{ t: '鼓起勇氣勸他們別吵了', v: 'talk' }, { t: '躲回房間戴上耳機', v: 'hide' }, { t: '找爺爺奶奶或親戚幫忙', v: 'help' }], h: 'pfight', sn: 'home'
      });
      return;
    }
    // 離婚
    const p = S.fam.pm < 22 ? 0.022 : S.fam.pm < 32 ? 0.004 : 0;
    if (p && chance(p)) {
      S.flags.pDivorce = S.ageM;
      if (a < 7) {
        const v = chance(0.7) ? 'mom' : 'dad';
        const out = [];
        setStruct(v, out);
        sysCard('爸媽離婚了', '你還小，不太懂發生了什麼事。只知道從那天起，' + (v === 'mom' ? '爸爸' : '媽媽') + '不再住在家裡，你和' + (v === 'mom' ? '媽媽' : '爸爸') + '一起生活。', { md: -10, st: 6 }, { sn: 'home' });
        last().chips.push(...out);
      } else {
        sysCard('爸媽要離婚了', '爸媽把你叫到客廳，說他們努力過了，但決定分開。「不管怎樣，我們都一樣愛你。」他們問你想跟誰住。', null, {
          opts: [{ t: '跟媽媽住', v: 'mom' }, { t: '跟爸爸住', v: 'dad' }], h: 'pdivorce', sn: 'home'
        });
      }
    }
  }
  const MONEY_H = {
    pfight(j, item) {
      const v = item.opts[j].v;
      const out = [];
      if (v === 'talk') { const ok = chance(0.35 + S.st.ch / 250); if (ok) { S.fam.pm = clamp(S.fam.pm + 12, 0, 100); item.res = '爸媽愣了一下，抱著你說對不起。那天之後他們吵得少了。'; applyFx({ st: 2, rel: { parents: 4 } }, {}, out); } else { item.res = '爸媽叫你回房間，說大人的事小孩別管。'; applyFx({ md: -4, st: 4 }, {}, out); } item.ok = ok; }
      else if (v === 'help') { S.fam.pm = clamp(S.fam.pm + 7, 0, 100); item.res = '親戚來家裡幫忙調解，氣氛緩和了一些。'; applyFx({ st: 2 }, {}, out); }
      else if (v === 'hug') { S.fam.pm = clamp(S.fam.pm + 5, 0, 100); item.res = '媽媽抱著你，慢慢不哭了。'; applyFx({ md: -2 }, {}, out); const m = npcsBy('mom')[0]; if (m) m.rel = clamp(m.rel + 4, -100, 100); }
      else { item.res = '你把音樂開得很大聲，假裝什麼都沒聽到。'; applyFx({ md: -5, st: 5 }, {}, out); }
      return out;
    },
    pdivorce(j, item) {
      const v = item.opts[j].v;
      const out = [];
      setStruct(v, out);
      applyFx({ md: -10, st: 8 }, {}, out);
      const pn = npcsBy(v)[0]; if (pn) pn.rel = clamp(pn.rel + 6, -100, 100);
      item.res = v === 'mom' ? '你收拾好行李，跟媽媽搬到新家。爸爸說週末會來看你。' : '你留在原本的家，跟爸爸一起生活。媽媽說隨時可以打給她。';
      return out;
    }
  };
  Object.assign(SYS_H, MONEY_H);


  /* ================================================================
   * v0.6：選學校（幼兒園、國小、國中、高中班別、高職五專科別）
   *       職業目標與錄取條件、升遷條件
   * ================================================================ */
  const KIND = {
    pub: { n: '一般班' },
    kpub: { n: '公立幼兒園', d: '離家近、費用低，跟社區的小朋友一起長大。' },
    kbi: { n: '私立雙語幼兒園', d: '每天都有外籍老師，英文起步早。', fx: { ch: 0.3 }, skill: ['english', 2], w: 3 },
    kforest: { n: '森林幼兒園', d: '大部分時間在戶外玩，身體和創意都很好。', fx: { ft: 0.6, cr: 0.5, hp: 0.3 }, w: 3 },
    epub: { n: '學區公立國小', d: '和鄰居小孩當同學，生活單純。' },
    epri: { n: '私立小學', d: '課業要求高、才藝課多，學費也高。', fx: { iq: 0.5, st: 0.5 }, sub: 3, w: 4 },
    eexp: { n: '實驗小學', d: '沒有段考，用專題和戶外課學習。', fx: { cr: 0.8, ch: 0.3 }, sub: -2, w: 2 },
    jpub: { n: '學區國中', d: '一般國中，課業和社團都兼顧。' },
    jpri: { n: '私立國中', d: '升學取向，考試多、壓力大。', fx: { iq: 0.5, st: 1 }, sub: 4, w: 3, alt: () => S.grades >= 85, altT: '家境小康以上，或成績 85 分以上' },
    jmusic: { n: '音樂班', d: '每天練琴、參加樂團。', fx: { cr: 0.7 }, skill: ['piano', 3], need: () => skillLv('piano') >= 2 || S.st.cr >= 60, needT: '鋼琴「初級」以上或創造力 60 以上' },
    jsport: { n: '體育班', d: '每天訓練，代表學校比賽。', fx: { ft: 0.9, hp: 0.3 }, skill: ['ball', 3], sub: -2, need: () => S.st.ft >= 60, needT: '體能 60 以上' },
    jsci: { n: '數理資優班', d: '進度快、題目難，數學和自然突飛猛進。', fx: { iq: 0.6, st: 0.8 }, subK: { math: 6, sci: 6 }, need: () => S.subj && S.subj.math >= 85 && S.subj.sci >= 80, needT: '數學 85、自然 80 以上' },
    spub: { n: '普通班', d: '一般課程，準備學測。' },
    ssci: { n: '數理資優班', d: '數學與自然加深加廣。', fx: { iq: 0.6, st: 0.8 }, subK: { math: 6, sci: 6 }, need: () => S.subj && S.subj.math >= 85 && S.subj.sci >= 85, needT: '數學、自然都 85 以上' },
    slang: { n: '語文資優班', d: '大量閱讀、寫作與英文。', fx: { cr: 0.4 }, subK: { chi: 6, eng: 6 }, skill: ['english', 2], need: () => S.subj && S.subj.chi >= 85 && S.subj.eng >= 85, needT: '國文、英文都 85 以上' },
    sart: { n: '美術班', d: '素描、設計、創作，畢業前辦畢業展。', fx: { cr: 0.9 }, skill: ['art', 3], sub: -2, need: () => S.st.cr >= 60, needT: '創造力 60 以上' },
    ssport: { n: '體育班', d: '專項訓練，目標全國賽。', fx: { ft: 0.9 }, skill: ['ball', 3], sub: -3, need: () => S.st.ft >= 65, needT: '體能 65 以上' }
  };
  function kindWhy(k) {
    const K = KIND[k];
    if (K.w && S.fam.wealth < K.w && !(K.alt && K.alt())) return K.altT || ('家境需要「' + WEALTH[K.w].n + '」以上');
    if (K.need && !K.need()) return K.needT;
    return '';
  }
  function kindCard(title, text, ks, h) {
    const opts = ks.map(k => ({ t: KIND[k].n, d: KIND[k].d, v: k, dis: kindWhy(k) || null }));
    sysCard(title, text, null, { opts, h, sn: h === 'kKind' ? 'kinder' : 'classroom' });
  }
  function kindCardItem(title, text, ks, h) {
    kindCard(title, text, ks, h);
    return S.cur.items.pop();
  }
  function kindMonthly(out) {
    const k = S.school && S.school.kind;
    if (!k || !KIND[k] || !inSchool() && S.school.stage !== 'kinder') return;
    const K = KIND[k];
    if (K.fx) applyFx(K.fx, {}, out);
    if (K.skill) skillUp(K.skill[0], out, K.skill[1]);
  }
  function kindSubBonus(s) {
    const k = S.school && S.school.kind, K = k && KIND[k];
    if (!K) return 0;
    return (K.sub || 0) + ((K.subK && K.subK[s]) || 0);
  }
  const VOC_DEPT = { '電機科': '電機、配線、機電整合', '資訊科': '程式設計、網路', '餐飲科': '中西餐、烘焙', '商業經營科': '行銷、會計、門市管理', '廣告設計科': '平面設計、廣告', '汽車科': '汽車修護' };
  const JC_DEPT = { '護理科': '畢業可考護理師', '電機科': '電機與自動化', '資訊管理科': '資訊系統與程式', '應用外語科': '英文、日文、翻譯', '企業管理科': '經營與行銷' };
  function deptCard(kind) {
    const D = kind === 'voc' ? VOC_DEPT : JC_DEPT;
    const opts = Object.keys(D).map(k => ({ t: k, d: D[k], v: k }));
    sysCard('選擇科別', '要念' + (kind === 'voc' ? '高職' : '五專') + '的哪一科？科別會影響之後能做的工作。', null, { opts, h: 'dept', sn: 'classroom' });
  }
  const SCHOOL_H = {
    kKind(j, item) {
      const v = item.opts[j].v, sc = S.school;
      if (v === 'none') { S.flags.noKinder = true; item.res = '你繼續待在家裡，由家人照顧。'; return []; }
      sc.stage = 'kinder'; sc.kind = v;
      sc.name = v === 'kbi' ? pick(['小橡樹', '晨光', '藍天']) + '雙語幼兒園' : v === 'kforest' ? pick(['山丘', '小松果', '綠葉']) + '森林幼兒園' : makeSchoolName('kinder');
      item.res = '你開始上「' + sc.name + '」了。第一天抓著' + parentsWord() + '的衣角不放，老師笑著把你牽進教室。';
      return applyFx({ md: -2, ch: 2 }, {}, []);
    },
    eKind(j, item) {
      const v = item.opts[j].v, sc = S.school;
      sc.kind = v;
      const core = S.city.n.replace(/[市縣]$/, '');
      if (v === 'epri') sc.name = '私立' + pick(['薇閣', '再興', '育英', '光華']) + '小學';
      else if (v === 'eexp') sc.name = core + pick(['森林', '山海', '種籽']) + '實驗小學';
      item.res = '你背著新書包走進「' + sc.name + '」，成為一年級新生。';
      return applyFx({ md: 3, iq: 1 }, {}, []);
    },
    jKind(j, item) {
      const v = item.opts[j].v, sc = S.school;
      sc.kind = v;
      if (v === 'jpri') sc.name = '私立' + pick(['延平', '明道', '衛道', '復興']) + '中學（國中部）';
      item.res = '你升上「' + sc.name + '」' + (v !== 'jpub' && v !== 'jpri' ? KIND[v].n : '') + '七年級，換上了新制服。';
      return applyFx({ st: 4, md: 1 }, {}, []);
    },
    sKind(j, item) {
      const v = item.opts[j].v;
      S.school.nextKind = v;
      item.res = '你選了' + KIND[v].n + '。';
      return [];
    },
    dept(j, item) {
      S.school.dept = item.opts[j].v;
      item.res = '你決定念' + S.school.dept + '。';
      addLog('升學', '選了' + S.school.dept + '。', 'school');
      return [];
    },
    promote(j, item) { return []; }
  };
  Object.assign(SYS_H, SCHOOL_H);

  // ---- 職業條件 ----
  const CAT_SKILL = { tech: ['code', '程式設計'], office: ['english', '英文'], creative: ['art', '繪畫'], teach: ['write', '寫作'] };
  const JOB_SKILL = { chef: ['cook', '料理'], barista: ['cook', '料理'], swe: ['code', '程式設計'] };
  const DEG_N = ['不限', '國中', '高中職', '專科', '大學', '碩士'];
  function jobReqs(j) {
    const R = [];
    if (j.deg) R.push({ t: '學歷：' + DEG_N[j.deg] + '以上', ok: degRank() >= j.deg, cur: S.degree || '無' });
    if (j.maj || j.dept) R.push({ t: '科系：' + (j.maj || []).concat(j.dept || []).join('、'), ok: reqMatch(j), cur: (S.path && S.path.major) || S.school.dept || '—' });
    if (j.tag) R.push({ t: '需要「' + j.tag + '」', ok: S.tags.includes(j.tag) });
    if (j.stat) R.push({ t: STATS[j.stat] + ' ' + j.dc + ' 以上（錄取率才高）', ok: S.st[j.stat] >= j.dc, cur: Math.round(S.st[j.stat]) });
    const sk = JOB_SKILL[j.id];
    if (sk) R.push({ t: sk[1] + '「初級」以上', ok: skillLv(sk[0]) >= 2, cur: SKILL_LV_N[skillLv(sk[0])] });
    if (j.special) R.push({ t: j.id === 'doctor' ? '醫學系畢業並通過醫師國考' : '通過公務人員考試（在「抉擇」準備公職考試）', ok: false });
    if (j.needT && j.need) { let ok = false; try { ok = !!j.need(S, API); } catch (e) { ok = false; } R.push({ t: j.needT, ok }); }
    return R;
  }
  LG.careers = function () {
    return jobs().filter(j => j.id !== 'owner').map(j => ({ id: j.id, n: j.n, cat: j.cat, pay: startPay(j), d: j.d || '', lv: j.lv || [], reqs: jobReqs(j), ok: jobOk(j) && !j.special, goal: S.flags.goalJob === j.id, now: !!(S.job && S.job.id === j.id) }));
  };
  LG.setGoal = function (id) { S.flags.goalJob = id || null; if (id) addLog('職涯', '把「' + jobDef(id).n + '」設為職業目標。', 'work'); return { ok: true }; };
  LG.goal = function () { const id = S.flags.goalJob; if (!id) return null; const j = jobDef(id); return j ? { id, n: j.n, reqs: jobReqs(j), ok: jobOk(j) && !j.special } : null; };

  // ---- 升遷條件 ----
  function promoReqs() {
    const J = S.job; if (!J) return null;
    const jd = jobDef(J.id) || {};
    const lvls = jd.lv || [J.title];
    if (J.lvl >= lvls.length - 1) return { top: true, title: J.title, reqs: [] };
    const L = J.lvl, next = lvls[L + 1], top = L + 1 === lvls.length - 1;
    const months = 18 + 12 * L, perf = 62 + 6 * L, stat = jd.stat || 'iq', sv = Math.min(75, (jd.dc || 40) + 5 + 5 * L);
    const yrs = S.ageM - J.lvlSince;
    const R = [
      { t: '目前職位年資 ' + (months / 12).toFixed(1).replace('.0', '') + ' 年', ok: yrs >= months, cur: Math.floor(yrs / 12) + ' 年 ' + (yrs % 12) + ' 個月' },
      { t: '工作表現 ' + perf + ' 以上', ok: J.perf >= perf, cur: Math.round(J.perf) },
      { t: STATS[stat] + ' ' + sv + ' 以上', ok: S.st[stat] >= sv, cur: Math.round(S.st[stat]) }
    ];
    if (top) {
      R.push({ t: '魅力 50 以上（要帶領團隊）', ok: S.st.ch >= 50, cur: Math.round(S.st.ch) });
      const sk = JOB_SKILL[J.id] || CAT_SKILL[J.cat];
      if (sk) R.push({ t: sk[1] + '「中級」以上', ok: skillLv(sk[0]) >= 3, cur: SKILL_LV_N[skillLv(sk[0])] });
    }
    return { top: false, title: J.title, next, reqs: R, ok: R.every(r => r.ok) };
  }
  LG.promo = () => promoReqs();
  function doPromote(J, jd) {
    const lvls = jd.lv || [J.title];
    J.lvl++; J.title = lvls[J.lvl]; J.lvlSince = S.ageM;
    S.flags.bestLvl = Math.max(S.flags.bestLvl || 0, J.lvl);
    J.pay = Math.round(J.pay * rf(1.15, 1.28) / 100) * 100;
    S.flags.promos = (S.flags.promos || 0) + 1;
    giveAch('升官發財');
  }


  /* ================================================================
   * v0.8：生涯規劃路線圖、未來生活預覽、職業挑戰模式
   * ================================================================ */
  const STAT_HINT = { iq: '行程排「讀書」「補習」「圖書館」', ch: '多排社交、社團、和朋友出去', ft: '多排運動：游泳、球類、跑步', cr: '多排才藝：畫畫、音樂、寫作', hp: '多運動、早點休息', md: '多休息、做喜歡的事' };
  const SKILL_HINT = { code: '排「學程式」', english: '排「讀英文」「英文補習班」', art: '排「畫畫」「美術課」', cook: '排「學做菜」', write: '排「作文班」「寫作」', piano: '排「鋼琴課」', ball: '排「球類運動」' };
  const DEG_HOW = { 1: '念完國中', 2: '念完高中或高職', 3: '念五專，或念完大學', 4: '考上大學並畢業', 5: '大學畢業後在「抉擇」報考研究所' };
  function careerDef(id) { return jobDef(id); }
  function roadmap(j) {
    const R = [];
    if (j.id === 'owner') {
      R.push({ t: '存到創業資金 ' + fmtMoney(money(500000)), ok: S.money + (S.bank || 0) >= money(500000), how: '工作存錢，或到「理財」規劃' });
      R.push({ t: '魅力 50 以上（顧客喜歡你）', ok: S.st.ch >= 50, how: STAT_HINT.ch });
      R.push({ t: '創造力 45 以上（有自己的特色）', ok: S.st.cr >= 45, how: STAT_HINT.cr });
      R.push({ t: '22 歲以上', ok: ageY() >= 22, how: '長大一點再說' });
      R.push({ t: '在「抉擇」選「創業開店」', ok: !!(S.job && S.job.id === 'owner'), how: '條件都達成後就能開店' });
      return R;
    }
    if (j.deg) R.push({ t: '學歷：' + DEG_N[j.deg] + '以上', ok: degRank() >= j.deg, how: DEG_HOW[j.deg] || '' });
    if (j.id === 'doctor') {
      R.push({ t: '學測考高分，大學選「醫學系」', ok: !!(S.path && S.path.major === '醫學系'), how: '高中三年把國英數社自都顧好，學測後選頂尖大學的醫學系' });
      R.push({ t: '醫學系畢業後通過醫師國考', ok: !!(S.job && S.job.id === 'doctor'), how: '畢業時會自動參加國考，智力越高越容易過' });
    } else if (j.maj || j.dept) {
      R.push({ t: '科系：' + (j.maj || []).concat(j.dept || []).join('、'), ok: reqMatch(j), how: (j.maj ? '大學選' + j.maj.join('或') : '') + (j.maj && j.dept ? '；或' : '') + (j.dept ? '念高職／五專選' + j.dept.join('或') : '') });
    }
    if (j.stat) R.push({ t: STATS[j.stat] + ' ' + j.dc + ' 以上', ok: S.st[j.stat] >= j.dc, cur: Math.round(S.st[j.stat]), how: STAT_HINT[j.stat] });
    const sk = JOB_SKILL[j.id];
    if (sk) R.push({ t: sk[1] + '「初級」以上', ok: skillLv(sk[0]) >= 2, cur: SKILL_LV_N[skillLv(sk[0])], how: SKILL_HINT[sk[0]] || '' });
    if (j.tag) R.push({ t: '取得「' + j.tag + '」', ok: S.tags.includes(j.tag), how: j.tag.includes('駕照') ? '18 歲後排「考駕照」' : '依職業需求準備' });
    if (j.needT && j.need) { let ok = false; try { ok = !!j.need(S, API); } catch (e) { ok = false; } R.push({ t: j.needT, ok, how: '' }); }
    if (j.cat === 'public') R.push({ t: '通過公務人員' + (j.id === 'civil' ? '高考' : '普考'), ok: !!(S.job && S.job.id === j.id), how: '畢業後在「抉擇」選「準備公職考試」' });
    else if (j.id !== 'doctor' && (j.deg || 0) >= 3) R.push({ t: '加分：有「實習經驗」', ok: S.tags.includes('實習經驗'), how: '大三以後排「實習」', bonus: true });
    R.push({ t: j.cat === 'public' || j.id === 'doctor' ? '正式上任' : '應徵並錄取', ok: !!(S.job && S.job.id === j.id), how: j.cat === 'public' || j.id === 'doctor' ? '' : '條件達成後在「抉擇」→「找工作」應徵（目標會優先出現）' });
    return R;
  }
  function lvlPays(j) {
    const p0 = startPay(j), n = (j.lv || [1]).length;
    return (j.lv || [j.n]).map((t, i) => ({ t, pay: Math.round(p0 * Math.pow(1.21, i) / 100) * 100 }));
  }
  function futureLife(j) {
    const P = lvlPays(j);
    const p0 = P[0].pay, pTop = P[P.length - 1].pay;
    const live = money(LIVING[S.city.tier] || 15000);
    const save = p => Math.max(0, p * 0.88 - live - p * 0.12);
    const H = LG.HOMES ? LG.HOMES.buy.find(h => h.lv === 2) : null;
    const price = money(HOUSE[S.city.tier] * (H ? H.mul : 1));
    const down = price * 0.23;
    const yrs = p => { const s = save(p) * 12; return s > 0 ? Math.ceil(down / s) : null; };
    const st = j.st || 50;
    const pen = j.cat === 'public' ? Math.round(pTop * 0.6) : Math.round(Math.min(pTop, money(45800)) * 35 * 0.0155);
    const life = pTop >= money(120000) ? '收入很高，可以住大房子、出國旅行，但通常也很忙。' : pTop >= money(70000) ? '收入不錯，努力存錢可以買房、養家。' : pTop >= money(45000) ? '收入普通，要精打細算，租屋或和家人同住比較輕鬆。' : '收入偏低，可能需要兼差或靠家人幫忙，生活比較辛苦。';
    return {
      lv: P, stress: st, stressN: st >= 75 ? '很高' : st >= 60 ? '偏高' : st >= 45 ? '普通' : '輕鬆',
      saveM: Math.round(save(p0)), houseN: (H ? H.n : '電梯小宅') + '（' + S.city.n + '）', price: Math.round(price), down: Math.round(down), yrs0: yrs(p0), yrsTop: yrs(pTop),
      pension: pen, pensionN: j.cat === 'public' ? '公職月退俸' : '勞保年金（估）', life
    };
  }
  LG.careerDetail = function (id) {
    const j = careerDef(id); if (!j) return null;
    const R = roadmap(j);
    const need = R.filter(r => !r.bonus);
    return { id, n: j.n, cat: j.cat, d: j.d || '', road: R, done: need.filter(r => r.ok).length, total: need.length, future: futureLife(j), goal: S.flags.goalJob === id, now: !!(S.job && S.job.id === id) };
  };
  LG.careers = function () {
    return jobs().map(j => { const R = roadmap(j).filter(r => !r.bonus); return { id: j.id, n: j.n, cat: j.cat, pay: startPay(j), d: j.d || '', lv: j.lv || [], done: R.filter(r => r.ok).length, total: R.length, ok: (jobOk(j) && !j.special) || (j.id === 'owner' && R.slice(0, 4).every(r => r.ok)), goal: S.flags.goalJob === j.id, now: !!(S.job && S.job.id === j.id) }; });
  };
  LG.goal = function () {
    const id = S.flags.goalJob; if (!id) return null;
    const d = LG.careerDetail(id); if (!d) return null;
    return Object.assign(d, { reqs: d.road });
  };
  function goalCheck(out) {
    const id = S.flags.goalJob; if (!id) return;
    if (S.job && S.job.id === id && !S.flags['goalDone_' + id]) {
      S.flags['goalDone_' + id] = S.ageM;
      giveAch('夢想成真', out);
      sysCard('夢想成真', '你實現了自己的生涯目標，成為' + jobDef(id).n + '！一路走來的努力都值得了。', { md: 12 }, { sn: 'job' });
    }
  }

  // ---- 職業挑戰模式：選一種職業，從剛入行開始 ----
  function startAgeFor(j) { return j.id === 'doctor' ? 25 : j.id === 'owner' ? 22 : (j.deg || 0) >= 5 ? 24 : (j.deg || 0) >= 4 ? 22 : (j.deg || 0) >= 3 ? 20 : 18; }
  const DEG_STR = { 0: '高中', 1: '國中', 2: '高中', 3: '專科', 4: '學士', 5: '碩士' };
  LG.challengeJobs = () => jobs().map(j => ({ id: j.id, n: j.n, cat: j.cat, age: startAgeFor(j), pay: Math.round(j.pay / 100) * 100, lv: j.lv || [], d: j.d || '', st: j.st || 50 }));
  function challengeGoals(j) {
    const top = (j.lv || [1]).length - 1;
    const p0 = j.pay;
    return [
      { k: 'top', t: '升到最高職位「' + (j.lv || [j.n])[top] + '」', star: 2 },
      { k: 'perf', t: '工作表現達到 85', star: 1 },
      { k: 'nw', t: '淨資產達到 ' + fmtMoney(money(p0 * 60)), v: p0 * 60, star: 1 },
      { k: 'house', t: '買下自己的房子', star: 1 },
      { k: 'family', t: '結婚成家', star: 1 },
      { k: 'stay', t: '在這個職業做滿 20 年', star: 1 },
      { k: 'hap', t: '大部分時間幸福度在 55 以上', star: 1 }
    ];
  }
  function challengeTick() {
    const C = S.challenge; if (!C || C.end) return;
    const J = S.job, inJob = J && J.id === C.job;
    if (inJob) C.months = (C.months || 0) + 1;
    const set = k => { if (!C.done[k]) { C.done[k] = S.ageM; const g = C.goals.find(x => x.k === k); if (g) toastQ('🎯 挑戰達成：' + g.t); } };
    if (inJob && J.lvl >= ((jobDef(C.job).lv || [1]).length - 1)) set('top');
    if (inJob && J.perf >= 85) set('perf');
    const g = C.goals.find(x => x.k === 'nw'); if (g && netWorth() >= money(g.v)) set('nw');
    if (S.home === 'own' || S.house) set('house');
    if (marital() === 'married') set('family');
    if ((C.months || 0) >= 240) set('stay');
    if (S.month === 12) { C.hapN = (C.hapN || 0) + 1; if (happiness() >= 55) C.hapOk = (C.hapOk || 0) + 1; }
    if (S.retired || ageY() >= 65 || S.ended) {
      if (C.hapN && C.hapOk / C.hapN >= 0.7) set('hap');
      C.end = S.ageM;
      const stars = C.goals.reduce((t, x) => t + (C.done[x.k] ? x.star : 0), 0), max = C.goals.reduce((t, x) => t + x.star, 0);
      C.stars = stars; C.max = max;
      sysCard('職業挑戰結算', '你的' + jobDef(C.job).n + '人生挑戰告一段落。完成 ' + Object.keys(C.done).length + ' / ' + C.goals.length + ' 項目標，獲得 ' + stars + ' / ' + max + ' 顆星！' + (stars >= max - 1 ? '真是精彩的職涯！' : stars >= max / 2 ? '很不錯的一段人生。' : '雖然不完美，也是珍貴的經歷。') + '接下來的人生，繼續由你決定。', { md: 5 }, { sn: 'park' });
      addLog('挑戰', '職業挑戰結算：' + stars + ' / ' + max + ' 顆星。', 'life');
      if (stars >= max - 1) giveAch('職業達人');
    }
  }
  function toastQ(t) { S.toasts = S.toasts || []; S.toasts.push({ t: 'goal', v: t }); }
  LG.challenge = function () {
    const C = S && S.challenge; if (!C) return null;
    return { job: C.job, n: jobDef(C.job).n, goals: C.goals.map(g => ({ t: g.t, star: g.star, done: !!C.done[g.k] })), end: !!C.end, stars: C.stars, max: C.max, years: Math.floor((C.months || 0) / 12) };
  };
  LG.newChallenge = function (o, jobId) {
    const j = jobDef(jobId);
    if (!j) return null;
    LG.newGame(o);
    const age = startAgeFor(j);
    const yrs = age - 3;
    S.ageM = age * 12; S.flags.startM = S.ageM;
    S.year += yrs;
    // 長大：能力自然成長，並達到職業門檻
    const grow = { hp: 10, iq: 18, ch: 15, md: 0, ft: 15, cr: 12 };
    for (const k of STAT_KEYS) S.st[k] = clamp(S.st[k] + (grow[k] || 0) + gauss() * 3, 15, 92);
    if (j.stat) S.st[j.stat] = Math.max(S.st[j.stat], j.dc + ri(3, 10));
    if (jobId === 'owner') { S.st.ch = Math.max(S.st.ch, 52); S.st.cr = Math.max(S.st.cr, 47); }
    // 學歷與科系
    S.school = { stage: 'done', name: j.deg >= 4 ? makeSchoolName('uni', 2) : makeSchoolName('senior', 2), grade: 0 };
    S.degree = DEG_STR[j.deg || 0];
    if (jobId === 'doctor') S.path = { kind: 'uni', tier: 1, name: S.school.name, major: '醫學系' };
    else if (j.maj) S.path = { kind: 'uni', tier: 2, name: S.school.name, major: j.maj[0] };
    else if (j.dept) { S.school.dept = j.dept[0]; S.path = { kind: 'work', tier: 0, name: '就業', major: j.dept[0] }; }
    else S.path = { kind: j.deg >= 4 ? 'uni' : 'work', tier: 2, name: S.school.name, major: j.deg >= 4 ? '企業管理學系' : null };
    S.grades = 70;
    const sk = JOB_SKILL[jobId] || CAT_SKILL[j.cat];
    if (sk) { S.skills = S.skills || {}; S.skills[sk[0]] = Math.max(S.skills[sk[0]] || 0, 30); }
    if (j.tag && !S.tags.includes(j.tag)) S.tags.push(j.tag);
    if ((j.deg || 0) >= 3 && !S.tags.includes('實習經驗')) S.tags.push('實習經驗');
    if (S.gender === 'M') S.mil = { st: 'done', kind: '常備役' };
    S.flags.noKinder = true;
    // 朋友
    for (let i = 0; i < 2; i++) { const g = chance(0.5) ? 'M' : 'F'; addNpc({ role: 'friend', name: genName(g), g, rel: ri(35, 60), ageOff: 0, bornAt: ri(-6, 6) }); }
    S.money = money(20000 + S.fam.wealth * 30000);
    updateBody();
    // 開始工作
    S.cur = { y: S.year, m: S.month, ageM: S.ageM, items: [], pre: [], post: [], phase: 'pre' };
    S.yearStart = snapshot();
    S.challenge = { job: jobId, startM: S.ageM, goals: challengeGoals(j), done: {}, months: 0 };
    S.flags.goalJob = jobId;
    const out = [];
    if (jobId === 'owner') { S.money += money(500000); startup(); }
    else startJob(j, startPay(j), out);
    S.cur.items = [];
    const J = S.job;
    sysCard('職業挑戰開始', S.year + ' 年 ' + S.month + ' 月，' + age + ' 歲的你' + (J ? '正式成為「' + J.co + '」的' + J.title + '，月薪 ' + fmtMoney(J.pay) + '。' : '開了自己的小店。') + '在「抉擇」可以看挑戰目標。你的職涯與未來的生活，現在開始！', { md: 3 }, { sn: 'job' });
    EV_INDEX = null;
    return S;
  };

  /* ---- 人生抉擇 ---- */
  function crushNpc() { return npcsBy('crush')[0]; }
  function startup() {
    S.money -= money(500000);
    const p = clamp(0.2 + (S.st.cr - 50) / 80 + (S.st.ch - 50) / 110 + (skillLv('cook') >= 2 ? 0.1 : 0) + (S.econ.s === 'boom' ? 0.1 : S.econ.s === 'recession' ? -0.12 : 0), 0.08, 0.85);
    const ok = chance(p);
    if (S.job) leaveJob('quit');
    const jd = jobDef('owner');
    startJob(jd, Math.round(money(ok ? 65000 : 22000) / 100) * 100, []);
    S.job.co = pick(['巷口', '轉角', '小森', '日日', '暖暖', '好味']) + pick(['早午餐', '咖啡館', '小吃店', '甜點屋', '花店', '書店']);
    S.job.title = '老闆';
    S.flags.shop = { ok, at: S.ageM, end: ok ? null : S.ageM + ri(6, 14) };
    sysCard('創業', '你拿出積蓄，開了一家「' + S.job.co + '」！開幕那天，親朋好友都來捧場。成功機率大約 ' + Math.round(p * 100) + '%，接下來就看經營了。', { md: 10, st: 8, tag: '創業家' }, { sn: 'cafe' });
  }
  function retire(auto) {
    const J = S.job;
    const pay = J ? J.pay : (S.flags.lastPay || S.wageM);
    const civil = !!(J && J.cat === 'public');
    S.retired = true;
    S.retire = { at: S.ageM, pay, insY: (S.insM || 0) / 12, civil };
    if (J) leaveJob('retire');
    S.retire.labor = Math.round(Math.min(pay, money(45800)) * Math.min(S.retire.insY, 45) * 0.0155);
    S.retire.civilPen = civil ? Math.round(pay * 0.6) : 0;
    S.retire.pensionM = Math.round((S.pension || 0) / 240);
    const t = (auto ? '時間到了，' : '') + '你正式退休了！同事們幫你辦了一場溫馨的歡送會。' +
      (civil ? '每月可以領公職月退俸約 ' + fmtMoney(S.retire.civilPen) + '。' : S.retire.labor ? '65 歲起每月可領勞保老年年金約 ' + fmtMoney(S.retire.labor) + '，勞退帳戶也可以每月領出。' : '');
    sysCard('退休', t, { md: 8, st: -15 }, { sn: 'park' });
    giveAch('退休樂活');
  }
  function careTarget() { return S.npcs.find(n => n.alive && ['mom', 'dad', 'grandma', 'grandpa', 'spouse'].includes(n.role) && n.frail && !n.careMode); }
  function careCard(n) {
    n = n || careTarget();
    if (!n) return;
    const sibs = npcsBy('sib').length;
    sysCard('照顧' + npcLabel(n), npcLabel(n) + '的身體越來越差，生活起居需要有人照顧。要怎麼安排呢？', null, {
      opts: [
        { t: '自己照顧', d: '感情會更深，但很辛苦、壓力大。', v: 'self' },
        { t: '請外籍看護', d: '每月約 ' + fmtMoney(money(25000)) + '。', v: 'helper' },
        { t: '住進安養中心', d: '每月約 ' + fmtMoney(money(35000)) + '，有專業人員照顧。', v: 'home' },
        { t: '和兄弟姊妹輪流照顧', d: '分擔辛苦，也分擔費用。', v: 'share', dis: sibs ? null : '你沒有兄弟姊妹' }
      ], h: 'care', sn: 'home', who: n.id
    });
  }
  const DEC = [
    { id: 'job', n: '找工作／換工作', ico: '💼', d: '看看現在能應徵哪些工作。',
      ok: () => ageY() < 16 ? '要 16 歲以上' : !['work', 'seek'].includes(status()) ? '現在在念書、服役或已退休' : '',
      run: () => jobHuntCard(true) },
    { id: 'career', n: '職業規劃', ico: '🧭', d: () => { const g = LG.goal(); return g ? '目標：' + g.n + (g.ok ? '（已符合條件，可以去應徵）' : '（還差 ' + g.reqs.filter(r => !r.ok).length + ' 項）') : '看看每種職業需要什麼條件，設定你的目標。'; },
      ok: () => ageY() < 6 ? '6 歲以上才能開始規劃' : '',
      run: () => true },
    { id: 'promote', n: '申請升遷', ico: '🎖️', d: () => { const P = promoReqs(); return !P ? '' : P.top ? '已經是最高職位「' + P.title + '」' : '下一個職位：' + P.next + '（條件達成就能申請）'; },
      ok: () => { if (status() !== 'work' || !S.job) return '目前沒有在工作'; if (S.job.id === 'owner') return '自己當老闆，沒有升遷'; const P = promoReqs(); if (P.top) return '已經是最高職位了'; const bad = P.reqs.filter(r => !r.ok); if (bad.length) return '還差：' + bad.map(r => r.t).join('、'); if (S.flags.promoTry && S.ageM - S.flags.promoTry < 6) return '剛申請過，半年後再試'; return ''; },
      run: () => {
        S.flags.promoTry = S.ageM;
        const J = S.job, jd = jobDef(J.id) || {};
        const ok = chance(clamp(0.7 + (J.perf - 70) / 100 + (S.econ.s === 'recession' ? -0.2 : 0), 0.4, 0.95));
        if (ok) { const old = J.title; doPromote(J, jd); sysCard('升遷', '你向主管提出升遷申請，經過面談後順利通過！你從' + old + '升為' + J.title + '，月薪調整為 ' + fmtMoney(J.pay) + '。', { md: 10, st: 3 }, { sn: 'job' }); }
        else sysCard('升遷', '主管說你的表現很好，但這次名額有限，請你再等等。半年後可以再申請。', { md: -3 }, { sn: 'job' });
        last().ok = ok;
      } },
    { id: 'propose', n: '求婚', ico: '💍', d: '和交往的對象共度一生。',
      ok: () => { if (marital() !== 'dating') return '要先有穩定交往的對象'; const c = crushNpc(); if (ageY() < 20) return '要 20 歲以上'; if (S.flags.weddingAt) return '婚禮已經在籌備了'; if (c.rel < 60) return '感情還不夠穩定（好感 ' + Math.round(c.rel) + '／需要 60）'; if (S.ageM - c.since < 12) return '交往滿 1 年才能求婚'; return ''; },
      run: () => sysCard('求婚', '你準備好戒指，想給' + crushNpc().name + '一個驚喜。要在哪裡求婚呢？', null, { opts: [{ t: '在常去散步的河堤邊', v: 'park' }, { t: '在浪漫的餐廳', d: '花費約 ' + fmtMoney(money(8000)), v: 'cafe' }, { t: '再等等', v: null }], h: 'propose', sn: 'park' }) },
    { id: 'baby', n: '準備生小孩', ico: '👶', d: '迎接新的家庭成員。',
      ok: () => marital() !== 'married' ? '要先結婚' : ageY() >= 46 ? '年紀已經不適合了' : S.flags.babyDue ? '寶寶已經在路上了' : kids().length >= 4 ? '已經有 4 個孩子了' : '',
      run: () => { sysCard('準備迎接新生命', '你和' + npcsBy('spouse')[0].name + '決定生小孩。幾週後，驗孕棒上出現了兩條線！', { baby: true, md: 6 }, { sn: 'home' }); } },
    { id: 'house', n: '買房子', ico: '🏠', d: () => S.city.n + '的房子約 ' + fmtMoney(housePrice()) + '，頭期款與稅費約 ' + fmtMoney(downPay()) + '。',
      ok: () => S.home === 'own' ? '已經有自己的房子' : ageY() < 20 ? '要 20 歲以上' : S.money < downPay() ? '存款還差 ' + fmtMoney(downPay() - S.money) : '',
      run: () => { const out = []; buyHouse(out); sysCard('買房', '你簽下買賣合約，拿到了新家的鑰匙！', { md: 10, st: 5 }, { sn: 'home' }); last().chips.unshift(...out); } },
    { id: 'moveout', n: '搬出去自己住', ico: '🧳', d: () => '每月房租約 ' + fmtMoney(money(RENT[S.city.tier])) + '。',
      ok: () => S.home !== 'parents' ? '目前沒有和家人同住' : ageY() < 18 ? '要 18 歲以上' : ['school', 'army'].includes(status()) ? '現在不方便搬家' : '',
      run: () => { const out = []; setHome('rent', out); sysCard('搬家', '你在附近租了一間小套房，開始一個人生活。', { md: 4, rel: { parents: -2 } }, { sn: 'home' }); last().chips.unshift(...out); } },
    { id: 'movehome', n: '搬回家住', ico: '🏡', d: '省房租，也能多陪家人。',
      ok: () => S.home !== 'rent' ? '目前不是租屋' : !S.npcs.some(n => (n.role === 'mom' || n.role === 'dad') && n.alive) ? '家人都不在了' : marital() === 'married' ? '已經成家了' : '',
      run: () => { const out = []; setHome('parents', out); sysCard('搬回家', parentsWord() + '很開心你搬回來，房間一直幫你留著。', { rel: { parents: 4 } }, { sn: 'home' }); last().chips.unshift(...out); } },
    { id: 'invest', n: '定期定額投資', ico: '📈', d: () => (S.inv.mon ? '目前每月投入 ' + fmtMoney(S.inv.mon) : '金額自己決定') + '，基金市值 ' + fmtMoney(S.inv.bal) + '。到「理財」設定。',
      ok: () => ageY() < 18 ? '要 18 歲以上' : '',
      run: () => sysCard('投資計畫', '你打開證券 APP，想要每月定期定額投資多少？', null, { opts: [0, 3000, 10000, 30000].map(v => ({ t: v ? '每月 ' + fmtMoney(money(v)) : '停止每月扣款', v })).concat(S.inv.bal > 0 ? [{ t: '把投資全部賣掉', v: -1 }] : []), h: 'invest', sn: 'home' }) },
    { id: 'grad', n: '報考研究所', ico: '🎓', d: '再念兩年拿碩士，畢業後起薪較高。',
      ok: () => S.degree !== '學士' ? '要先有大學學歷' : ageY() >= 45 ? '年紀已經超過 45 歲' : !['work', 'seek'].includes(status()) ? '現在不適合' : S.flags.gradNext ? '已經考上了' : S.money < money(80000) ? '存款需要 8 萬元以上' : '',
      run: () => { const p = gradPct(); const ok = chance(p / 100); sysCard('研究所考試', ok ? '你考上了研究所！九月開學' + (S.job ? '，你向公司提出了離職。' : '。') : '這次沒有考上，明年可以再試試看。', ok ? { md: 8 } : { md: -4 }, { sn: 'campus' }); last().ok = ok; if (ok) { S.flags.gradNext = 'local'; S.flags.gradQuit = true; } } },
    { id: 'civil', n: '準備公職考試', ico: '📚', d: '專心苦讀，考上就是鐵飯碗。',
      ok: () => degRank() < 2 ? '至少要高中職畢業' : ageY() >= 55 ? '年紀超過 55 歲' : S.flags.prep ? '已經在準備了' : !['work', 'seek'].includes(status()) ? '現在不適合' : S.job && S.job.cat === 'public' ? '你已經是公務員了' : '',
      run: () => sysCard('準備公職考試', '要怎麼準備呢？', null, { opts: [{ t: '辭職全心準備', d: '考上機會比較高，但這段時間沒有收入。', v: 'full' }, { t: '一邊工作一邊準備', d: '收入穩定，但比較難考上。', v: 'part', dis: S.job ? null : '你目前沒有工作' }, { t: '再想想', v: null }], h: 'civilPrep', sn: 'home' }) },
    { id: 'startup', n: '創業開店', ico: '🏪', d: () => '需要約 ' + fmtMoney(money(500000)) + ' 的資金。成功與否看創造力與魅力。',
      ok: () => ageY() < 22 ? '要 22 歲以上' : ageY() >= 70 ? '年紀太大了' : S.job && S.job.id === 'owner' ? '已經在經營自己的店' : ['school', 'uni', 'army'].includes(status()) ? '現在不適合' : S.money < money(500000) ? '資金還差 ' + fmtMoney(money(500000) - S.money) : '',
      run: () => startup() },
    { id: 'retire', n: '退休', ico: '🌅', d: '離開職場，開始退休生活。',
      ok: () => status() !== 'work' ? '目前沒有在工作' : ageY() < 55 ? '要 55 歲以上' : ageY() < 60 && (S.insM || 0) < 300 ? '60 歲前退休需要 25 年年資' : '',
      run: () => retire(false) },
    { id: 'care', n: '安排家人的照顧', ico: '🧓', d: '年邁的家人需要人照顧。',
      ok: () => careTarget() ? '' : '目前家人不需要特別照顧',
      run: () => careCard() }
  ];
  LG.decisions = function () {
    if (!S) return [];
    return DEC.filter(x => !['house', 'moveout', 'movehome'].includes(x.id)).map(x => { const why = x.ok(); return { id: x.id, n: x.n, ico: x.ico, d: typeof x.d === 'function' ? x.d() : x.d, ok: !why, why }; });
  };
  LG.decide = function (id) {
    const x = DEC.find(d => d.id === id);
    if (!x || S.ended || x.ok()) return false;
    x.run();
    return true;
  };

  /* ================================================================
   * 30–99 歲：老化、疾病、生死、孩子長大、照顧家人、退休
   * ================================================================ */
  const ILLS = ['高血壓', '糖尿病', '關節退化', '心臟病', '白內障', '骨質疏鬆', '高血脂'];
  function annualQ(a) { return 0.00025 * Math.exp(0.088 * (a - 20)); }
  function npcAge(n) {
    if (n.bornAt != null) return (S.ageM - n.bornAt) / 12;
    if (n.role === 'child' || n.role === 'grandchild') return (S.ageM - (n.born || S.ageM)) / 12;
    return ageY();
  }
  function ensureAges() {
    for (const n of S.npcs) {
      if (n.bornAt != null) continue;
      const pa = ageY() * 12;
      let off;
      if (n.role === 'mom') off = 27; else if (n.role === 'dad') off = 29;
      else if (n.role === 'grandma') off = 55; else if (n.role === 'grandpa') off = 58;
      else if (n.role === 'sib') off = n.ageOff || (n.older ? 3 : -3);
      else if (n.role === 'child' || n.role === 'grandchild') { n.bornAt = n.born || S.ageM; continue; }
      else if (n.role === 'colleague' || n.role === 'excolleague') off = 4;
      else off = 0;
      n.bornAt = Math.round(S.ageM - pa - off * 12);
    }
  }
  function illLevel() { return (S.ills || []).length; }
  function managed() { return S.flags.checkupAt != null && S.ageM - S.flags.checkupAt <= 6; }
  function npcDies(n, text) {
    n.alive = false;
    n.diedAt = S.ageM;
    const fam = ['mom', 'dad', 'grandma', 'grandpa', 'sib', 'spouse', 'child'].includes(n.role);
    if (n.role === 'spouse') { S.tags = S.tags.filter(t => t !== '已婚'); if (!S.tags.includes('喪偶')) S.tags.push('喪偶'); }
    if (fam || n.rel >= 50) {
      sysCard('離別', text || (npcLabel(n) + '在 ' + Math.floor(npcAge(n)) + ' 歲時，安詳地離開了這個世界。告別式上，你想起了好多一起走過的日子。'), { md: n.role === 'spouse' ? -20 : fam ? -12 : -5, st: 6 }, { sn: 'temple' });
      last().chips.push({ k: 'loss', v: npcLabel(n) });
    }
    addLog('離別', npcLabel(n) + '離開了這個世界。', 'loss');
  }
  function monthlyLife() {
    ensureAges();
    const a = ageY();
    // 家人與朋友的生老病死
    for (const n of S.npcs.slice()) {
      if (!n.alive || !['mom', 'dad', 'grandma', 'grandpa', 'spouse', 'sib', 'friend', 'oldfriend', 'child'].includes(n.role)) continue;
      const na = npcAge(n);
      if (na < 50) continue;
      if (chance(annualQ(na) / 12 * (n.frail ? 2.2 : 1))) { npcDies(n); continue; }
      if (!n.frail && na >= 75 && ['mom', 'dad', 'grandma', 'grandpa', 'spouse'].includes(n.role) && chance(0.005 + (na - 75) * 0.0008)) {
        n.frail = true;
        careCard(n);
      }
    }
    // 孩子長大
    for (const c of kids()) {
      const m = S.ageM - c.born;
      if (m === 72) sysCard(c.name + '上小學了', c.name + '背著新書包，回頭跟你揮揮手，走進了校門。', { md: 4, rel: { child: 2 } }, { sn: 'classroom', npc: c.id });
      if (m === 156) sysCard(c.name + '上國中了', c.name + '開始有自己的想法，也有點叛逆了。', { md: 1 }, { sn: 'classroom', npc: c.id });
      if (m === 216) {
        const q = clamp(0.25 + (S.flags.kidcareN || 0) / (kids().length * 150) + (c.rel - 50) / 150 + (S.fam.wealth - 3) * 0.04, 0.05, 0.95);
        c.uni = q > 0.62 ? '國立大學' : q > 0.35 ? '私立大學' : '職場';
        sysCard(c.name + '成年了', c.name + '滿 18 歲了！' + (c.uni === '職場' ? c.name + '決定先去工作，學一技之長。' : c.name + '考上了' + c.uni + '，你在家族群組炫耀了好幾天。'), { md: 6 }, { sn: 'home', npc: c.id });
      }
      if (m === 264) {
        c.adult = true;
        c.jobN = pick(['工程師', '老師', '護理師', '設計師', '上班族', '業務', '廚師', '公務員', '店長']);
        sysCard(c.name + '開始工作了', c.name + '找到了第一份工作，當上了' + c.jobN + '，從此不用你再付學費和生活費了。', { md: 5 }, { sn: 'home', npc: c.id });
      }
      const ca = m / 12;
      if (c.adult && !c.married && ca >= 25 && ca < 40 && chance(0.012)) {
        c.married = true;
        sysCard(c.name + '結婚了', c.name + '帶著另一半來見你，不久後辦了一場溫馨的婚禮。你坐在主桌，眼眶紅了。', { md: 10, $: -60000, rel: { child: 4 } }, { sn: 'wedding', npc: c.id });
      }
      if (c.married && ca >= 26 && (c.gk || 0) < 2 && chance(0.01)) {
        c.gk = (c.gk || 0) + 1;
        const g = chance(0.5) ? 'M' : 'F';
        const gk = addNpc({ role: 'grandchild', name: genName(g), g, rel: 70, born: S.ageM, bornAt: S.ageM, parent: c.id });
        sysCard('當' + (S.gender === 'M' ? '阿公' : '阿嬤') + '了', c.name + '的孩子' + gk.name + '出生了！你抱著小小的孫子，覺得人生真是奇妙。', { md: 14 }, { sn: 'hospital', npc: gk.id });
        giveAch('含飴弄孫');
      }
    }
    // 婚禮
    if (S.flags.weddingAt && S.ageM >= S.flags.weddingAt && marital() === 'dating') {
      S.flags.weddingAt = null;
      const c = crushNpc();
      sysCard('婚禮', '婚禮的日子到了！你和' + c.name + '要怎麼辦婚禮呢？', null, { opts: [{ t: '辦一場溫馨的婚宴', d: '花費約 ' + fmtMoney(money(300000)) + '，收到的禮金可以抵掉一部分。', v: 'big' }, { t: '只去戶政事務所登記', d: '把錢省下來，拍一組可愛的婚紗照就好。', v: 'small' }], h: 'wedding', sn: 'wedding' });
    }
    // 自己的老化與疾病
    if (a >= 38) {
      const bmi = S.wgt / Math.pow(S.hgt / 100, 2);
      const p = 0.0011 * (a - 36) / 10 * (bmi > 27 ? 1.6 : 1) * (S.alloc.sport < 2.5 ? 1.35 : 0.8) * (managed() ? 0.6 : 1);
      if (chance(p)) {
        const left = ILLS.filter(x => !(S.ills || []).includes(x));
        if (left.length) {
          const ill = pick(left);
          S.ills = (S.ills || []).concat(ill);
          sysCard('健康警訊', '身體檢查發現你有' + ill + '。醫生叮嚀你要定期回診、規律運動、注意飲食。', null, {
            opts: [{ t: '乖乖回診，調整生活習慣', d: '安排「看醫生／健康檢查」行程可以控制病情。', v: 'care' }, { t: '應該沒那麼嚴重吧', v: 'ignore' }], h: 'ill', sn: 'hospital'
          });
        }
      }
    }
    if (a >= 25) {
      const hpF = clamp(1 + (55 - S.st.hp) / 18, 0.45, 4) * Math.pow(1.12, illLevel()) * (managed() ? 0.85 : 1);
      if (chance(annualQ(a) / 12 * hpF)) { playerDies(); return; }
    }
    if (a >= 80 && S.st.hp < 35 && !S.selfCare) {
      S.selfCare = 'pending';
      sysCard('需要人照顧', '你的體力大不如前，走路需要拐杖，日常生活也需要有人幫忙了。', null, {
        opts: [{ t: '讓家人照顧', d: '和家人更親近，但家人比較辛苦。', v: 'family', dis: kids().length || marital() === 'married' ? null : '沒有可以依靠的家人' }, { t: '請外籍看護', d: '每月約 ' + fmtMoney(money(25000)) + '。', v: 'helper' }, { t: '住進安養中心', d: '每月約 ' + fmtMoney(money(35000)) + '。', v: 'home' }], h: 'selfCare', sn: 'home'
      });
    }
    // 自動退休
    if (!S.retired && a >= 65 && status() === 'seek') retire(true);
    if (!S.retired && status() === 'work' && (a >= 70 || (a >= 65 && S.job.cat === 'public'))) retire(true);
    // 創業的店
    const shop = S.flags.shop;
    if (shop && S.job && S.job.id === 'owner' && !shop.ok && shop.end && S.ageM >= shop.end) {
      const co = S.job.co;
      S.flags.shop = null;
      leaveJob('close');
      sysCard('結束營業', '「' + co + '」撐了一段時間，生意還是不如預期。你含著淚拉下鐵門，但這段經歷讓你成長了很多。', { md: -10, st: 6, tag: '創業失敗過' }, { sn: 'street' });
    }
  }
  function playerDies() {
    S.dead = true;
    S.ended = true;
    S.st.hp = 0;
    const a = Math.floor(ageY());
    sysCard('人生的終點', a >= 75 ? '在一個安靜的午後，你在家人的陪伴下，安詳地閉上了眼睛。享壽 ' + a + ' 歲。' : '一場突如其來的病，讓你在 ' + a + ' 歲時離開了人世。家人朋友都很捨不得你。', null, { sn: 'home' });
    addLog('離世', '你在 ' + ageText(S.ageM) + ' 時離開了人世。', 'death');
    S.cur.post.push('end');
  }
  function finishLife() {
    if (S.ended) return;
    S.ended = true;
    sysCard('百歲人瑞', '99 歲生日到了！子孫們幫你辦了一場盛大的壽宴。你看著滿桌的笑臉，覺得這一生，真的很值得。', { md: 15 }, { sn: 'home' });
    giveAch('圓滿人生');
    S.cur.post.push('stage:' + stageOf(S.ageM - 1).k);
    S.cur.post.push('end');
    addLog('圓滿人生', '你活到了 99 歲。', 'sys');
  }

  const RAISE_H = {
    propose(j, item) {
      const v = item.opts[j].v;
      const out = [];
      if (!v) { item.res = '你把戒指收好，決定再等一個更好的時機。'; return out; }
      const c = crushNpc();
      if (v === 'cafe') applyFx({ $: -8000 }, {}, out);
      const p = clamp(0.55 + (c.rel - 60) / 40, 0.4, 0.97);
      const ok = chance(p);
      item.ok = ok;
      if (ok) { S.flags.weddingAt = S.ageM + ri(3, 6); if (!S.tags.includes('訂婚')) S.tags.push('訂婚'); applyFx({ md: 12, rel: { crush: 8 } }, { crush: c.id }, out); item.res = c.name + '哭著說：「我願意！」你們開始籌備婚禮。'; }
      else { applyFx({ md: -6, rel: { crush: -6 } }, { crush: c.id }, out); item.res = c.name + '說：「我很愛你，但我還沒準備好。」'; }
      return out;
    },
    wedding(j, item) {
      const out = [];
      const b = {};
      marry(b, out);
      S.tags = S.tags.filter(t => t !== '訂婚');
      if (item.opts[j].v === 'big') { applyFx({ $: -100000, md: 10, rel: { parents: 5 } }, {}, out); item.res = '親友們舉杯祝福，' + parentsWord() + '笑得合不攏嘴。'; }
      else { applyFx({ $: 150000, md: 6 }, {}, out); item.res = '你們在戶政事務所門口拍了一張合照，簡單又幸福。'; }
      return out;
    },
    invest(j, item) {
      const v = item.opts[j].v;
      const out = [];
      if (v === -1) { applyFx({ cashout: 1 }, {}, out); item.res = '你把投資全部賣掉，換成現金。'; }
      else { applyFx({ invest: v }, {}, out); item.res = v ? '你設定好每月自動扣款，告訴自己不要每天看盤。' : '你停止了每月扣款。'; }
      return out;
    },
    civilPrep(j, item) {
      const v = item.opts[j].v;
      const out = [];
      if (!v) { item.res = '你決定再想想。'; return out; }
      if (v === 'full' && S.job) leaveJob('quit');
      S.flags.prep = { due: S.ageM + 10, kind: 'civil', tries: 0, part: v === 'part' };
      item.res = v === 'full' ? '你辭掉工作，報名了公職補習班，每天念書十小時。' : '你下班後到補習班上課，週末泡在圖書館。';
      applyFx({ st: 5 }, {}, out);
      return out;
    },
    care(j, item) {
      const v = item.opts[j].v;
      const n = npc(item.who);
      const out = [];
      if (!n) return out;
      n.careMode = v;
      if (v === 'self') { applyFx({ st: 8, rel: { parents: 6 } }, {}, out); item.res = '你決定親自照顧，每天幫忙餵飯、陪著復健。'; }
      else if (v === 'helper') item.res = '你請了一位外籍看護，她很細心，' + npcLabel(n) + '很喜歡她。';
      else if (v === 'home') item.res = npcLabel(n) + '住進了安養中心，你每週去探望。';
      else { applyFx({ st: 3 }, {}, out); item.res = '你和兄弟姊妹排好班表，大家輪流照顧。'; }
      return out;
    },
    selfCare(j, item) {
      const v = item.opts[j].v;
      S.selfCare = v;
      item.res = v === 'family' ? '家人輪流陪著你，你覺得很溫暖，也有點捨不得他們辛苦。' : v === 'helper' ? '看護每天陪你散步、聊天。' : '你住進安養中心，在那裡認識了新朋友。';
      return [];
    },
    ill(j, item) {
      const out = [];
      if (item.opts[j].v === 'care') { S.flags.checkupAt = S.ageM; applyFx({ hp: 2, md: -2 }, {}, out); item.res = '你開始每天量血壓、少吃油炸食物，也記得按時回診。'; }
      else { applyFx({ hp: -4 }, {}, out); item.res = '你沒有放在心上……'; }
      return out;
    }
  };

  Object.assign(SYS_H, ADULT_H, RAISE_H);


  /* ---------------- 每月自然變化 ---------------- */
  const H_TAB = [[0, 0.29], [0.5, 0.39], [1, 0.44], [2, 0.51], [3, 0.56], [4, 0.6], [5, 0.64], [6, 0.68], [7, 0.72], [8, 0.75], [9, 0.78], [10, 0.81], [11, 0.84], [12, 0.86], [13, 0.89], [14, 0.93], [15, 0.96], [16, 0.98], [17, 0.995], [18, 1]];
  const H_TAB_F = [[0, 0.3], [0.5, 0.4], [1, 0.46], [2, 0.53], [3, 0.58], [4, 0.62], [5, 0.66], [6, 0.7], [7, 0.74], [8, 0.78], [9, 0.82], [10, 0.86], [11, 0.9], [12, 0.94], [13, 0.97], [14, 0.99], [15, 1], [18, 1]];
  const W_TAB = [[0, 0.055], [0.5, 0.13], [1, 0.16], [2, 0.2], [3, 0.23], [4, 0.26], [5, 0.29], [6, 0.33], [7, 0.37], [8, 0.41], [9, 0.46], [10, 0.51], [11, 0.57], [12, 0.63], [13, 0.7], [14, 0.77], [15, 0.84], [16, 0.9], [17, 0.95], [18, 1]];
  function interp(tab, x) {
    if (x <= tab[0][0]) return tab[0][1];
    for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) {
      const [x0, y0] = tab[i - 1], [x1, y1] = tab[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
    return tab[tab.length - 1][1];
  }
  function updateBody() {
    const a = ageY();
    S.hgt = Math.round(S.adultH * interp(S.gender === 'F' ? H_TAB_F : H_TAB, a) * 10) / 10;
    const wf = interp(W_TAB, a);
    S.wgt = Math.round((S.adultW + S.wOff) * wf * 10) / 10;
  }

  function natural() {
    const a = ageY();
    const PK = ownPerks();
    const g = (k, base) => {
      if (base <= 0) return;
      const cur = S.st[k];
      S.st[k] = clamp(cur + base * tGrow(k) * (1 + (PK.grow[k] || 0)) * (1 - cur / 115), 0, 100);
    };
    if (PK.md) S.st.md = clamp(S.st.md + PK.md, 0, 100);
    if (PK.st) S.stress = clamp(S.stress - PK.st, 0, 100);
    const A = S.alloc;
    if (a < 3) { g('iq', 0.2); g('ft', 0.22); g('ch', 0.1); g('cr', 0.12); }
    else if (a < 6) {
      const p = S.pref;
      g('iq', 0.1 + (p === 'quiet' ? 0.1 : 0)); g('ft', 0.1 + (p === 'active' ? 0.12 : 0));
      g('ch', 0.06 + (p === 'social' ? 0.12 : 0)); g('cr', 0.08 + (p === 'quiet' ? 0.06 : 0));
    } else {
      const summer = S.month === 7 || S.month === 8;
      const learning = ['school', 'uni', 'prep'].includes(status());
      g('iq', learning ? 0.01 + 0.04 * A.study * (summer ? 0.6 : 1) : 0.004 + 0.012 * A.study);
      g('ft', 0.005 + 0.05 * A.sport);
      g('ch', 0.005 + 0.04 * A.social);
      g('cr', 0.005 + 0.055 * A.art);
      // 用進廢退：沒有持續練習的能力會慢慢回落
      const dk = a < 18 ? 0.008 : 0.012;
      for (const k of ['iq', 'ch', 'ft', 'cr']) if (S.st[k] > 30) S.st[k] -= (S.st[k] - 30) * dk;
      if (A.sport >= 3) S.wOff = clamp(S.wOff - 0.04 * (A.sport - 2), -8, 12);
      if (A.sport <= 1) S.wOff = clamp(S.wOff + 0.03, -8, 12);
    }

    // 成績：往目標慢慢靠近
    if (inSchool()) { ensureWeek(); subjMonthly(A); }

    // 壓力
    if (a >= 6) {
      const stt = status();
      const summer = S.month === 7 || S.month === 8;
      let load;
      if (stt === 'school') load = summer ? 0.35 * A.study : 1.15 * A.study + 1;
      else if (stt === 'uni') load = summer ? 0.3 * A.study : 0.85 * A.study + 0.6;
      else if (stt === 'prep') load = 1.2 * A.study + 1.4;
      else if (stt === 'army') load = 2.4;
      else if (stt === 'work') { const jd = jobDef(S.job.id) || {}; load = (jd.st || 50) / 100 * (1.6 + 0.7 * A.study) + 0.8; }
      else if (stt === 'retired') load = 0.2 * A.study + 0.3;
      else load = 0.35 * A.study + Math.min(3, (S.flags.seekM || 0) * 0.35);
      if (S.flags.prep && S.flags.prep.part) load += 1.2;
      for (const n of S.npcs) if (n.alive && n.careMode === 'self') load += 1.5;
      const adultRelief = ['work', 'seek', 'prep', 'army'].includes(stt);
      let d = load - (adultRelief ? 0.7 * A.leisure + 0.35 * A.sport + 0.25 * A.social : 1.0 * A.leisure + 0.5 * A.sport + 0.35 * A.social) + examPressure() + kids().length * 0.7;
      d = d * 0.9 + gauss() * 1.2;
      if (d > 0) d *= tMul('stPos');
      S.stress = clamp(S.stress + d - (S.stress - 30) * 0.08, 0, 100);
    } else {
      S.stress = clamp(S.stress + (12 - S.stress) * 0.2 + gauss(), 0, 100);
    }

    // 情緒
    let md = S.st.md;
    md += (50 - md) * 0.08 - (S.stress - 45) * 0.05 + (famRelAvg() - 40) * 0.012 + tAdd('mdDrift') + gauss() * 0.8;
    if (a >= 6) md += (A.leisure - 2) * 0.25 + (A.social - 2) * 0.12;
    S.st.md = clamp(md, 0, 100);

    // 健康
    updateBody();
    let pen = 0;
    if (a >= 15) { const bmi = S.wgt / ((S.hgt / 100) ** 2); if (bmi < 17 || bmi > 28) pen = 6; }
    const aging = Math.max(0, a - 25) * 0.25 + Math.max(0, a - 50) * 0.35 + Math.max(0, a - 70) * 0.5;
    const target = 58 + S.st.ft * 0.32 - Math.max(0, S.stress - 65) * 0.5 - pen - aging - illLevel() * (managed() ? 2 : 4.5);
    if (a > 35) S.st.ft = clamp(S.st.ft - (0.02 + Math.max(0, a - 55) * 0.004) * (S.alloc.sport >= 2.5 ? 0.5 : 1), 0, 100);
    if (a > 70) S.st.iq = clamp(S.st.iq - 0.02 * (S.alloc.study >= 2.5 ? 0.4 : 1), 0, 100);
    S.st.hp = clamp(S.st.hp + (target - S.st.hp) * 0.06 + tAdd('hpDrift') * (a >= 12 ? 1 : 0), 1, 100);

    // 人際
    const rebel = a >= 13 && a < 17 ? 18 * tMul('rebel') : 0;
    for (const n of S.npcs) {
      if (!n.alive) continue;
      if (n.role === 'friend' && n.rel < 10 && S.ageM - n.since > 18) {
        n.role = 'oldfriend';
        continue;
      }
      if (n.role === 'crush' && S.tags.includes('交往中')) {
        n.rel += (44 + A.social * 5 - Math.max(0, S.stress - 60) * 0.3 - n.rel) * 0.03;
      } else if (n.role === 'friend' || n.role === 'crush') {
        const tgt = a >= 6 ? 4 + A.social * 9 : 25;
        const rate = 0.03 * tMul('decay');
        if (n.rel > tgt) n.rel += (tgt - n.rel) * rate;
        else n.rel += (tgt - n.rel) * 0.015;
      } else if (n.role === 'mom' || n.role === 'dad' || n.role === 'grandma' || n.role === 'grandpa') {
        const tgt = n.far ? 30 : 58 - rebel;
        n.rel += (tgt - n.rel) * 0.02;
      } else if (n.role === 'sib') {
        n.rel += (45 - n.rel) * 0.01;
      } else if (n.role === 'spouse') {
        n.rel += (48 + A.social * 4 - Math.max(0, S.stress - 55) * 0.4 - n.rel) * 0.03;
      } else if (n.role === 'child') {
        n.rel += (68 - n.rel) * 0.02;
      } else if (n.role === 'colleague') {
        if (n.rel < 0 && S.ageM - n.since > 24) { n.role = 'excolleague'; continue; }
        if (!S.job) n.rel += (-5 - n.rel) * 0.03; else n.rel += (8 + A.social * 4 - n.rel) * 0.02;
      }
    }
  }

  function newYearEconomy() {
    S.cpi = S.cpi * (1 + rf(0.012, 0.024));
    S.wageMul = S.wageMul * (1 + rf(0.015, 0.03));
    S.wageH = Math.round(196 * S.wageMul);
    S.wageM = Math.round(29500 * S.wageMul / 10) * 10;
  }

  function happiness() {
    const rel = clamp(closeRelAvg() + 10, 0, 100);
    let h = 0.38 * S.st.md + 0.18 * S.st.hp + 0.2 * (100 - S.stress) + 0.24 * rel;
    if (ageY() >= 18) {
      if (S.money < 0) h -= 6;
      if (status() === 'seek' && (S.flags.seekM || 0) > 3) h -= 4;
      if (marital() !== 'single') h += 3;
    }
    return clamp(h, 0, 100);
  }

  function snapshot() {
    return { ageM: S.ageM, st: Object.assign({}, S.st), stress: S.stress, money: S.money, grades: S.grades, hgt: S.hgt, wgt: S.wgt, logLen: S.log.length };
  }

  /* ---------------- 評價 ---------------- */
  function stageEval(stage) {
    const lo = stage.a0 * 12, hi = stage.a1 * 12;
    const rows = S.hap.filter(x => x.ageM >= lo && x.ageM < hi);
    const hap = avg(rows.map(x => x.v));
    const hp = avg(rows.map(x => x.hp));
    const gr = rows.filter(x => x.gr != null);
    const third = gr.length ? avg(gr.map(x => x.gr)) : avg(rows.map(x => x.iq));
    const achN = S.ach.filter(n => S.achAt[n] >= lo && S.achAt[n] < hi).length;
    const score = 0.5 * hap + 0.2 * hp + 0.3 * third + Math.min(15, achN * 5);
    const grade = score >= 80 ? 'S' : score >= 68 ? 'A' : score >= 56 ? 'B' : 'C';
    const words = { S: '閃閃發光的一段日子', A: '過得很充實', B: '平穩地長大', C: '有些辛苦，但你撐過來了' };
    return { k: stage.k, n: stage.n, grade, score: Math.round(score), hap: Math.round(hap), hp: Math.round(hp), third: Math.round(third), thirdN: gr.length ? '平均成績' : '平均智力', achN, word: words[grade] };
  }

  function checkAch() {
    const a = ageY();
    if (a < 5.05 && a >= 4.9 && S.st.iq >= 62) giveAch('天才寶寶');
    if (a < 12 && S.st.cr >= 75) giveAch('小小藝術家');
    if (S.st.ft >= 80) giveAch('運動健將');
    if (a >= 12 && S.st.ch >= 80) giveAch('校園風雲人物');
    if ((S.flags.contrib || 0) >= (ageY() < 18 ? 58 : 260)) giveAch('熱心助人');
    if (npcsBy('friend').filter(n => n.rel >= 50).length >= 5) giveAch('人緣王');
    if (S.money >= money(1000000)) giveAch('第一桶金');
    if (a >= 80) giveAch('長命百歲');
    if (S.flags.marriedAt != null && marital() === 'married' && S.ageM - S.flags.marriedAt >= 600) giveAch('金婚');
    if (a >= 18 && netWorth() >= money(10000000)) giveAch('千萬富翁');
    if (S.inv && S.inv.bal >= money(3000000)) giveAch('投資有成');
  }

  function finalSummary() {
    const hap = avg(S.hap.map(x => x.v));
    const rel = clamp(closeRelAvg() + 10, 0, 100);
    const hp = 0.5 * avg(S.hap.map(x => x.hp)) + 0.5 * clamp(ageY() / 85 * 100, 0, 100);
    const tier = S.path ? S.path.tier || 0 : 0;
    const best = Math.max(S.job ? S.job.lvl + 1 : 0, S.flags.bestLvl || 0);
    const skillPts = Object.keys(S.skills || {}).reduce((s, k) => s + skillLv(k), 0);
    const achS = clamp(degRank() * 7 + best * 9 + S.ach.length * 2.5 + skillPts * 2 + 4, 0, 100);
    const nw = netWorth();
    const expect = money(500000) * (0.6 + 0.2 * S.birth.wealth) * clamp(ageY() / 30, 0.5, 4);
    const wealthS = clamp(50 + (nw - expect) / expect * 25, 0, 100);
    const contribS = clamp((S.flags.contrib || 0) * 0.7, 0, 100);
    const dims = [
      { n: '幸福', w: 25, v: Math.round(hap) }, { n: '關係', w: 20, v: Math.round(rel) },
      { n: '健康', w: 15, v: Math.round(hp) }, { n: '成就', w: 15, v: Math.round(achS) },
      { n: '財富', w: 15, v: Math.round(wealthS) }, { n: '貢獻', w: 10, v: Math.round(contribS) }
    ];
    const total = Math.round(dims.reduce((s, d) => s + d.v * d.w, 0) / 100 * 10);
    let title = '平凡而踏實的一生';
    const jid = S.job ? S.job.id : (S.jobHist.length ? S.jobHist[S.jobHist.length - 1].id : '');
    const age = ageY();
    if (S.dead && age < 40) title = '短暫卻被深深愛過的一生';
    else if (age >= 98.9) title = '百歲人瑞';
    else if (npcsBy('grandchild').length >= 2) title = '兒孫滿堂';
    else if (S.ach.includes('金婚')) title = '白頭偕老';
    else if (nw >= money(10000000)) title = '富足人生';
    else if (marital() === 'married' && kids().length) title = '幸福的一家人';
    else if (jid === 'doctor') title = '白袍醫師';
    else if (S.birth.wealth <= 2 && nw >= money(1500000)) title = '白手起家';
    else if (jid === 'civil' || jid === 'civil2') title = '穩穩的鐵飯碗';
    else if (S.job && S.job.lvl >= 2) title = '職場新星';
    else if (S.degree === '碩士') title = '學霸之路';
    else if (contribS >= 80) title = '溫暖的小太陽';
    else if (rel >= 70) title = '人見人愛';
    else if (hap >= 68) title = '知足常樂';
    else if (!S.job) title = '還在尋找方向';
    const stages = STAGES.filter(st => st.a1 * 12 <= S.ageM + 12 && st.a0 * 12 < S.ageM && st.a1 * 12 > (S.flags.startM || 0)).map(stageEval);
    return { total, dims, title, stages, path: S.path, ach: S.ach.slice(), dead: S.dead, ageM: S.ageM, degree: S.degree, job: S.job, nw, ms: marital(), kids: kids().length, gkids: npcsBy('grandchild').length, retired: !!S.retired, skills: Object.keys(S.skills || {}).filter(k => skillLv(k)).map(k => SKILLS[k] + '・' + SKILL_LV_N[skillLv(k)]) };
  }

  function yearReview() {
    const s0 = S.yearStart || snapshot();
    const rows = S.hap.filter(x => x.ageM > s0.ageM && x.ageM <= S.ageM);
    const hap = Math.round(avg(rows.map(x => x.v)) || happiness());
    const d = {};
    for (const k of STAT_KEYS) d[k] = Math.round(S.st[k]) - Math.round(s0.st[k]);
    const logs = S.log.slice(s0.logLen || 0).filter(l => l.k !== 'sys' || l.t.indexOf('生日') < 0).slice(-8);
    return { year: S.year, age: Math.floor(S.ageM / 12), hap, d, money: S.money - s0.money, logs, hgt: S.hgt, wgt: S.wgt, job: S.job ? S.job.title : '', nw: netWorth() };
  }

  /* ---------------- 對外 API ---------------- */
  LG.newGame = function (o) {
    const seed = o.seed != null ? o.seed : ((Date.now() ^ Math.floor(Math.random() * 1e9)) | 0);
    S = {
      v: LG.SAVE_VERSION, ver: LG.version, rng: seed, seed,
      name: (o.name || '').trim() || '小明', gender: o.gender === 'F' ? 'F' : 'M',
      zodiac: ZODIAC[o.zodiac] ? o.zodiac : '牡羊座',
      adultH: clamp(+o.height || 170, 140, 200), adultW: clamp(+o.weight || 60, 35, 120),
      mode: o.mode === 'legacy' ? 'legacy' : 'single',
      year: 2026, month: 1, ageM: 0, cpi: 1, wageMul: 1, wageH: 196, wageM: 29500,
      st: {}, stress: 10, money: 0, grades: 0, wOff: 0, hgt: 0, wgt: 0,
      fam: {}, city: {}, npcs: [], nid: 1, pet: null,
      school: { stage: 'none', grade: 0, name: '', tier: 2 },
      exams: {}, path: null, traits: [], tags: [], flags: {}, ach: [], achAt: {},
      alloc: { study: 3, sport: 2, social: 2, leisure: 2, art: 1 }, pref: 'active',
      cd: {}, done: {}, log: [], hap: [], yearHap: [], toasts: [],
      cur: null, yearStart: null, dead: false, ended: false, birth: {},
      degree: '', job: null, jobHist: [], mil: { st: 'none' }, home: 'parents', loans: [], inv: { bal: 0, mon: 0 },
      pension: 0, insM: 0, give: 0, house: null, fin: null, econ: { s: 'normal', until: 0 }, look: o.look || null
    };
    const n = S.name;
    S.nick = n.length >= 3 ? n.slice(-2) : n;
    const zm = ZODIAC[S.zodiac];
    S.birthMonth = chance(0.35) ? zm[0] : zm[1];
    S.month = S.birthMonth;

    // 出生：玩家自選，沒選的部分才隨機
    const B = o.birth || {};
    const wl = B.wealth >= 1 && B.wealth <= 5 ? B.wealth : wpick([1, 2, 3, 4, 5], w => WEALTH[w].w);
    const c = CITIES.find(x => x[0] === B.city) || wpick(CITIES, x => x[2]);
    const struct = STRUCTS[B.struct] ? B.struct : wpick(Object.keys(STRUCTS), k => STRUCTS[k].w);
    S.fam = { wealth: wl, struct };
    S.city = { n: c[0], tier: c[1] };
    for (const k of STAT_KEYS) S.st[k] = B.st && B.st[k] != null ? clamp(+B.st[k], 10, 80) : ri(20, 60);
    if (B.st && B.st.hp != null) S.st.hp = clamp(+B.st.hp, 10, 95); else S.st.hp = clamp(S.st.hp + 22, 40, 95);
    S.st.md = B.st && B.st.md != null ? clamp(+B.st.md, 10, 95) : ri(50, 70);
    S.skills = {};
    S.sched = [];
    S.wk = null; S.subj = null; S.own = {}; S.homeLv = 2; S.plan7 = [];
    S.bank = 0; S.hold = {}; S.mkt = null;
    // 家人
    const surname = SURN.includes(n[0]) ? n[0] : pick(SURN);
    S.surname = surname;
    addNpc({ role: 'mom', name: '', g: 'F', rel: struct === 'grand' ? 40 : 62, far: struct === 'dad' || struct === 'grand', bornAt: -ri(24, 35) * 12 });
    addNpc({ role: 'dad', name: '', g: 'M', rel: struct === 'grand' ? 38 : 58, far: struct === 'mom' || struct === 'grand', bornAt: -ri(26, 38) * 12 });
    addNpc({ role: 'grandma', name: '', g: 'F', rel: struct === 'grand' ? 66 : 50, bornAt: -ri(50, 62) * 12 });
    addNpc({ role: 'grandpa', name: '', g: 'M', rel: struct === 'grand' ? 62 : 46, bornAt: -ri(53, 66) * 12 });
    if (struct === 'mom') { S.npcs.find(x => x.role === 'dad').rel = 20; }
    if (struct === 'dad') { S.npcs.find(x => x.role === 'mom').rel = 20; }
    const nSib = B.sibs >= 0 && B.sibs <= 4 ? +B.sibs : wpick([0, 1, 2, 3, 4], k => [32, 42, 18, 6, 2][k]);
    let off = 0;
    for (let i = 0; i < nSib; i++) {
      off += ri(1, 4);
      const gg = chance(0.5) ? 'M' : 'F';
      addNpc({ role: 'sib', name: genName(gg), g: gg, older: true, ageOff: off, rel: 40, bornAt: -off * 12 });
    }
    // 特質
    const pool = Object.keys(TRAITS);
    const pickedT = (B.traits || []).filter(t => TRAITS[t]).slice(0, 2);
    for (const t of pickedT) if (!S.traits.some(x => x.k === t)) S.traits.push({ k: t, known: true });
    const nT = B.traits ? pickedT.length : (chance(0.5) ? 2 : 3);
    while (S.traits.length < nT) {
      const t = pick(pool);
      if (S.traits.some(x => x.k === t)) continue;
      if (TRAIT_CONFLICT.some(([x, y]) => (t === x && hasTrait(y)) || (t === y && hasTrait(x)))) continue;
      S.traits.push({ k: t, known: false });
    }
    S.pref = pick(Object.keys(PREFS));
    S.econ.until = ri(60, 140);
    // v0.7：人生從 3 歲開始，能力就是玩家分配的 3 歲能力
    S.ageM = 36; S.flags.startM = 36;
    S.year -= 0; S.bornYear = S.year - 3;
    updateBody();
    S.birth = {
      wealth: wl, wealthN: WEALTH[wl].n, city: c[0], tier: TIER_N[c[1]], struct: STRUCTS[struct].n,
      sibs: S.npcs.filter(x => x.role === 'sib').map(npcLabel), st: Object.assign({}, S.st), nTraits: nT, month: S.birthMonth
    };
    S.cur = { y: S.year, m: S.month, ageM: S.ageM, items: [], pre: [], post: [], phase: 'pre' };
    S.yearStart = snapshot();
    const sibTxt = nSib ? '，上面還有' + S.birth.sibs.join('、') : '，是家裡第一個孩子';
    sysCard('3 歲生日', S.year + ' 年 ' + S.month + ' 月，你 3 歲了！你住在' + S.city.n + '，家境' + WEALTH[wl].n + '，' + STRUCTS[struct].n + sibTxt + '。從今天起，你的人生由你來安排。', { md: 0 }, { sn: 'home' });
    ensureWeek();
    kindCard('上幼兒園', parentsWord() + '在討論要讓你上哪一間幼兒園。', ['kpub', 'kbi', 'kforest'], 'kKind');
    last().opts.push({ t: '先不上幼兒園', d: '在家多陪家人，6 歲直接上小學。', v: 'none' }); last().choices.push({ t: '先不上幼兒園', d: '在家多陪家人，6 歲直接上小學。', dis: null });
    EV_INDEX = null;
    return S;
  };

  LG.canAdvance = function () {
    if (!S || S.ended) return false;
    if (S.cur.phase !== 'post') return false;
    return S.cur.items.every(i => i.done) && !S.cur.pre.length && !S.cur.post.length;
  };

  LG.pendingModal = function () {
    if (!S) return null;
    if (S.dead && S.cur.post.includes('end')) return 'end';
    if (S.cur.pre.length) return S.cur.pre[0];
    if (S.cur.items.every(i => i.done) && S.cur.post.length && S.cur.phase === 'post') return S.cur.post[0];
    return null;
  };

  LG.ackModal = function (type) {
    const arr = S.cur.pre[0] === type ? S.cur.pre : S.cur.post;
    const i = arr.indexOf(type);
    if (i >= 0) arr.splice(i, 1);
  };

  LG.nextMonth = function () {
    if (!LG.canAdvance()) return false;
    // 記錄上個月的幸福度
    S.hap.push({ ageM: S.ageM, v: Math.round(happiness()), hp: Math.round(S.st.hp), iq: Math.round(S.st.iq), gr: inSchool() ? Math.round(S.grades) : null });
    if (S.hap.length > 300) {
      // 舊資料壓縮：保留每 3 個月 1 筆
      const keep = S.hap.slice(-240);
      const old = S.hap.slice(0, -240).filter((x, i) => i % 3 === 0);
      S.hap = old.concat(keep);
    }
    const prevStage = stageOf(S.ageM);
    S.ageM++;
    S.month++;
    if (S.month > 12) { S.month = 1; S.year++; }
    S.cur = { y: S.year, m: S.month, ageM: S.ageM, items: [], pre: [], post: [], phase: 'pre' };
    S.toasts = [];
    if (S.month === 1) { newYearEconomy(); S.yearStart = snapshot(); }

    // 9 月：上個月決定的升學去向生效
    if (S.month === 9 && S.flags.upperPending) {
      const sc = S.school;
      sc.stage = sc.next; sc.grade = 10; sc.name = makeSchoolName(sc.stage, sc.tier);
      sc.kind = sc.stage === 'senior' ? (sc.nextKind || 'spub') : null;
      if (sc.stage !== 'senior' && !sc.dept) sc.dept = pick(sc.stage === 'voc' ? Object.keys(VOC_DEPT) : Object.keys(JC_DEPT));
      S.flags.upperPending = false;
      npcsBy('friend').forEach(n => { n.rel = clamp(n.rel - 10, -100, 100); });
      sysCard('新學校', '你走進「' + sc.name + '」' + (sc.dept ? sc.dept : sc.kind && sc.kind !== 'spub' ? KIND[sc.kind].n : '') + '，成為新生。', { md: 2, st: 3 });
      S.flags.sickYear = 0;
      S.flags.justMoved = true;
    }
    if (S.ageM >= 1188) { finishLife(); return true; }
    systemEvents();
    if (S.ended) { return true; }
    econTick();
    monthlyMilitary();
    monthlyPrep();
    monthlyFamily();
    parentsMonthly();
    monthlyLife();
    if (S.ended) { S.cur.phase = 'post'; return true; }
    preWork();

    // 特質被慢慢發現：每個階段結束有機會揭曉一個
    const newStage = stageOf(S.ageM);
    if (newStage.k !== prevStage.k) {
      S.cur.post.push('stage:' + prevStage.k);
      const hidden = S.traits.filter(t => !t.known);
      if (hidden.length && chance(0.6)) revealTrait(pick(hidden).k, null);
    }
    checkAch();
    if (S.month === 12) S.cur.post.push('review');
    return true;
  };

  LG.choose = function (i, j) {
    const item = S.cur.items[i];
    if (!item || item.done || !item.choices || !item.choices[j]) return null;
    if (item.choices[j].dis) return null;
    let out = [];
    if (item.kind === 'sys') {
      out = SYS_H[item.h](j, item) || [];
      item.chips = out;
      item.done = true;
      item.picked = j;
      checkAch();
      return item;
    }
    const e = evById(item.id);
    if (!e) { item.done = true; item.res = '（這則事件已更新，略過）'; return item; }
    const c = e.ch[j];
    const b = item.b || {};
    applyFx(c.fx, b, out);
    let rtext = c.r ? render(c.r, b, e) : '';
    if (c.chk) {
      const ok = rand() * 100 < item.choices[j].pct;
      const branch = ok ? c.ok : c.no;
      item.ok = ok;
      if (branch) {
        applyFx(branch.fx, b, out);
        if (branch.r) rtext = (rtext ? rtext + ' ' : '') + render(branch.r, b, e);
      }
    }
    if (e.reveal || e.tr) revealTrait(e.reveal || e.tr, out);
    if (e.sick) S.flags.sickYear = (S.flags.sickYear || 0) + 1;
    item.chips = out;
    item.res = rtext;
    item.done = true;
    item.picked = j;
    if (e.imp || c.imp || e.k === 'f') addLog(item.title, item.text + ' → ' + item.choices[j].t + (rtext ? '。' + rtext : ''), e.k === 'f' ? 'fate' : 'choice');
    if (S.ended) S.cur.post.push('end');
    checkAch();
    return item;
  };

  LG.setPlan = function (p) {
    if (p.pref && PREFS[p.pref]) S.pref = p.pref;
    if (p.alloc) {
      const A = {};
      let sum = 0;
      for (const k of Object.keys(ALLOC_KEYS)) { A[k] = clamp(Math.round(p.alloc[k] || 0), 0, 6); sum += A[k]; }
      if (sum === 10) S.alloc = A;
    }
    LG.ackModal('plan');
  };

  LG.serialize = function () { return JSON.stringify(S); };
  LG.load = function (obj) {
    const o = typeof obj === 'string' ? JSON.parse(obj) : obj;
    if (!o || !o.cur || ![1, 2, 3, 4, 5].includes(o.v)) throw new Error('存檔格式不符');
    S = o;
    if (o.v === 1) migrateV1();
    if (S.v === 2) {
      S.v = 3;
      S.skills = S.skills || {};
      S.sched = S.sched || [];
      if (!S.cur.phase) S.cur.phase = 'post';
      S.cur.pre = (S.cur.pre || []).filter(x => x !== 'plan');
      if (S.ended && !S.dead && S.ageM < 1188) { S.ended = false; S.cur.post = S.cur.post.filter(x => x !== 'end' && x !== 'stage:young'); }
      ensureAges();
    }
    if (S.v === 3) S.v = 4;
    if (S.v === 4) S.v = 5;
    ensureWeek();
    ensureMoney();
    EV_INDEX = null;
    return S;
  };
  LG.state = () => S;

  // 0.1 版存檔（只到 18 歲）升級：補上成年系統，並讓人生繼續下去
  function migrateV1() {
    Object.assign(S, { v: 2, degree: S.degree || '', job: null, jobHist: [], home: 'parents', loans: [], inv: { bal: 0, mon: 0 },
      pension: 0, insM: 0, give: 0, house: null, fin: null, econ: { s: 'normal', until: S.ageM + 60 }, look: S.look || null });
    const fm = S.flags.military;
    S.mil = S.gender !== 'M' || !fm ? { st: 'none' } : { st: fm === '免役體位' ? 'exempt' : 'pending', kind: fm === '替代役體位' ? '替代役' : '常備役', callAt: null };
    if (S.ended && !S.dead) {
      S.ended = false;
      S.cur.post = S.cur.post.filter(x => x !== 'end');
      if (S.school.stage === 'done' && S.path) {
        S.school.stage = S.path.kind === 'jc' ? 'jc' : 'senior';
        if (S.path.kind === 'jc') { S.school.grade = 13; } else { S.school.grade = 12; startAdultPath(); }
      }
    }
  }

  LG.yearReview = function () {
    if (!S.cur.review) {
      S.cur.review = yearReview();
      S.yearHap.push({ year: S.cur.review.year, age: S.cur.review.age, v: S.cur.review.hap });
    }
    return S.cur.review;
  };
  LG.stageEval = k => stageEval(STAGES.find(s => s.k === k));
  LG.finalSummary = finalSummary;
  LG.happiness = () => (S ? Math.round(happiness()) : 0);
  LG.npcLabel = npcLabel;
  LG.roleName = roleName;
  LG.caregivers = caregivers;
  LG.fmtMoney = fmtMoney;
  LG.ageText = ageText;
  LG.stageOf = stageOf;
  LG.gradeLabel = gradeLabel;
  LG.inSchool = () => inSchool();
  LG.schoolText = function () {
    const sc = S.school;
    const stt = status();
    if (stt === 'army') return (S.mil.kind === '替代役' ? '服替代役' : '服義務役') + '・第 ' + (S.ageM - S.mil.start + 1) + ' 個月';
    if (stt === 'work') return S.job.title + '・' + S.job.co;
    if (stt === 'retired') return '退休生活・第 ' + (Math.floor((S.ageM - S.retire.at) / 12) + 1) + ' 年';
    if (stt === 'prep') return '準備公職考試中';
    if (stt === 'seek') return S.flags.gradNext ? '等待研究所開學' : '待業中';
    if (sc.stage === 'uni') return sc.name + ' ' + ((S.path && S.path.major) || '') + ' ' + sc.year + ' 年級';
    if (sc.stage === 'grad') return sc.name + ' ' + sc.year + ' 年級';
    if (sc.stage === 'jc' && sc.grade > 12) return sc.name + (sc.dept ? ' ' + sc.dept : '') + ' ' + (sc.grade - 9) + ' 年級';
    if (sc.stage === 'elem') return sc.name + ' ' + sc.grade + ' 年級';
    if (sc.stage === 'junior') return sc.name + ' ' + (sc.grade - 6) + ' 年級';
    if (['senior', 'voc', 'jc'].includes(sc.stage)) return sc.name + (sc.dept ? ' ' + sc.dept : '') + ' ' + (sc.grade - 9) + ' 年級';
    if (sc.stage === 'kinder') return sc.name;
    if (sc.stage === 'done') return S.path ? S.path.name : '畢業';
    return SCHOOL_N[sc.stage];
  };
  LG.data = { STATS, STAT_KEYS, CAT, ZODIAC, WEALTH, TRAITS, TRAIT_CONFLICT, ACH, STAGES, ALLOC_KEYS, PREFS, SCHOOL_N, STRUCTS, GIV_M, GIV_F, SURN, HOME_N, ECON_N, CITIES, TIER_N };
  LG.status = () => status();
  LG.marital = () => marital();
  LG.jobDef = jobDef;
  LG.netWorth = () => netWorth();
  LG.kids = () => kids();
  LG.npc = id => npc(id);
  LG.npcAge = n => npcAge(n);
  LG.skillInfo = () => Object.keys(SKILLS).map(k => ({ k, n: SKILLS[k], lv: skillLv(k), lvN: SKILL_LV_N[skillLv(k)], cnt: (S.skills || {})[k] || 0, next: SKILL_LV[Math.min(5, skillLv(k) + 1)] }));
  LG.ills = () => (S.ills || []).slice();

  /* ---------------- 事件資料檢查（測試用） ---------------- */
  const FX_KEYS = ['hp', 'iq', 'ch', 'md', 'ft', 'cr', 'st', '$', 'gr', 'wt', 'rel', 'tag', 'untag', 'flag', 'cnt', 'contrib', 'ach', 'reveal', 'wealth', 'addSib', 'kill', 'struct', 'move', 'pet', 'petdie', 'sick',
    '$n', 'marry', 'breakup', 'divorce', 'baby', 'home', 'house', 'invest', 'cashout', 'perf', 'raise', 'quit', 'hunt', 'loan', 'pt'];
  const EV_KEYS = ['id', 'a', 'k', 'w', 'once', 'cd', 'g', 'sc', 'tr', 'ntr', 'tag', 'ntag', 'wl', 'fs', 'ct', 'mo', 'c', 'imp', 'sick', 'title', 't', 'r', 'fx', 'ch', 'amt', 'reveal', '_tok',
    'stt', 'jc', 'ms', 'kid', 'hm', 'sn', 'gkid'];
  const REL_KEYS = ['mom', 'dad', 'grandma', 'grandpa', 'grand', 'parent', 'parents', 'family', 'sib', 'friend', 'friends', 'bff', 'newfriend', 'crush', 'newcrush',
    'spouse', 'child', 'kids', 'partner', 'colleague', 'colleagues', 'gkid'];
  const BANNED = ['性行為', '做愛', '上床', '抽菸', '香菸', '吸菸', '喝酒', '酒精', '啤酒', '毒品', '吸毒', '賭', '偷竊', '偷東西', '搶劫', '自殺', '輕生', '自殘', '犯罪', '警察局', '坐牢', '霸凌別人'];
  LG.validateEvents = function () {
    const errs = [];
    const ids = new Set();
    const chkFx = (fx, where) => {
      if (!fx) return;
      for (const k of Object.keys(fx)) {
        if (!FX_KEYS.includes(k)) errs.push(where + ' 未知效果 ' + k);
        if (k === 'rel') for (const rk of Object.keys(fx.rel)) if (!REL_KEYS.includes(rk)) errs.push(where + ' 未知人物 ' + rk);
        if (k === 'ach' && !ACH[fx.ach]) errs.push(where + ' 未知成就 ' + fx.ach);
        if (k === 'reveal' && !TRAITS[fx.reveal]) errs.push(where + ' 未知特質 ' + fx.reveal);
      }
    };
    const strs = e => {
      const out = [];
      const add = v => { if (!v) return; if (Array.isArray(v)) v.forEach(add); else if (typeof v === 'string') out.push(v); };
      add(e.t); add(e.r); add(e.title);
      (e.ch || []).forEach(c => { add(c.t); add(c.r); if (c.ok) add(c.ok.r); if (c.no) add(c.no.r); });
      return out;
    };
    for (const e of LG.events) {
      const w = '[' + e.id + ']';
      if (!e.id) errs.push('缺少 id：' + JSON.stringify(e.t));
      if (ids.has(e.id)) errs.push(w + ' id 重複');
      ids.add(e.id);
      for (const k of Object.keys(e)) if (!EV_KEYS.includes(k)) errs.push(w + ' 未知欄位 ' + k);
      if (!e.a || e.a.length !== 2 || e.a[0] >= e.a[1]) errs.push(w + ' 年齡範圍錯誤');
      if (e.k && !CAT[e.k]) errs.push(w + ' 類別錯誤 ' + e.k);
      if (!e.t) errs.push(w + ' 缺少文字');
      if (e.tr && !TRAITS[e.tr]) errs.push(w + ' 未知特質 ' + e.tr);
      chkFx(e.fx, w);
      if (e.ch) {
        if (e.fx) errs.push(w + ' 抉擇事件的效果要寫在選項裡');
        e.ch.forEach((c, i) => {
          if (!c.t) errs.push(w + ' 選項' + i + ' 缺文字');
          for (const k of Object.keys(c)) if (!['t', 'fx', 'r', 'chk', 'ok', 'no', 'need', 'needT', 'imp'].includes(k)) errs.push(w + ' 選項未知欄位 ' + k);
          chkFx(c.fx, w + '選項' + i); if (c.ok) chkFx(c.ok.fx, w + '成功'); if (c.no) chkFx(c.no.fx, w + '失敗');
          if (c.chk && !(STATS[c.chk[0]] || ['luck', 'st', 'gr'].includes(c.chk[0]))) errs.push(w + ' 判定屬性錯誤');
          if (c.chk && (!c.ok || !c.no)) errs.push(w + ' 判定需要 ok 與 no');
        });
      }
      for (const s of strs(e)) {
        let m; TOKEN_RE.lastIndex = 0;
        while ((m = TOKEN_RE.exec(s))) if (!KNOWN_TOKENS.includes(m[1])) errs.push(w + ' 未知佔位字 {' + m[1] + '}');
        for (const bw of BANNED) if (s.includes(bw)) errs.push(w + ' 含排除主題字詞「' + bw + '」');
      }
    }
    return errs;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LG;
})(typeof window !== 'undefined' ? window : globalThis);
