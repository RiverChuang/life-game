/* ============================================================
 * 商店與房屋
 * price 2026 年幣值；up 每月開銷；resale 賣掉能拿回的比例
 * perk：擁有時每月的效果（md 情緒、st 減壓、grow 成長加快）
 * ============================================================ */
LG.SHOP = [
  // 3C
  { id: 'phone', n: '智慧型手機', ico: '📱', cat: '3C', price: 18000, up: 499, resale: 0.25, minA: 10, perk: { md: 0.3, grow: { ch: 0.05 } }, d: '和朋友聯絡更方便。每月電信費 499 元。' },
  { id: 'pc', n: '筆記型電腦', ico: '💻', cat: '3C', price: 32000, resale: 0.3, minA: 8, perk: { grow: { iq: 0.08 } }, d: '查資料、寫報告、學程式都用得到。智力成長加快。' },
  { id: 'tablet', n: '平板電腦', ico: '📲', cat: '3C', price: 15000, resale: 0.3, minA: 6, perk: { md: 0.2, grow: { cr: 0.05 } }, d: '畫畫、看影片都很方便。' },
  { id: 'console', n: '遊戲機', ico: '🎮', cat: '3C', price: 12000, resale: 0.4, minA: 6, perk: { md: 0.6, st: 0.6, grow: { iq: -0.03 } }, d: '超紓壓，但小心玩太久。' },
  { id: 'camera', n: '單眼相機', ico: '📷', cat: '3C', price: 45000, resale: 0.45, minA: 14, perk: { grow: { cr: 0.1 } }, d: '出遊拍照、記錄生活。創造力成長加快。' },
  // 交通
  { id: 'bike', n: '腳踏車', ico: '🚲', cat: '交通', price: 6000, resale: 0.3, minA: 6, perk: { grow: { ft: 0.06 } }, d: '上學、運動都能騎。體能成長加快。' },
  { id: 'scooter', n: '機車', ico: '🛵', cat: '交通', price: 85000, up: 1200, resale: 0.35, minA: 18, need: S => S.tags.includes('機車駕照'), needT: '要先考到機車駕照', fx: { tag: '有機車' }, perk: { md: 0.2 }, d: '台灣人的好夥伴。每月油錢保養約 1,200 元。' },
  { id: 'car', n: '國產小車', ico: '🚗', cat: '交通', price: 680000, up: 7500, resale: 0.45, minA: 18, fx: { tag: '有車' }, perk: { md: 0.6, st: 0.3 }, d: '全家出遊好方便。每月油錢、停車、保險約 7,500 元。' },
  { id: 'luxcar', n: '進口房車', ico: '🏎️', cat: '交通', price: 2600000, up: 16000, resale: 0.4, minA: 18, perk: { md: 1.2, grow: { ch: 0.05 } }, d: '開出去很有面子。每月開銷約 16,000 元。' },
  // 家具家電
  { id: 'desk', n: '書桌與檯燈', ico: '🪑', cat: '家具', price: 5000, resale: 0.2, minA: 6, perk: { grow: { iq: 0.04 } }, d: '有自己的讀書角落。' },
  { id: 'sofa', n: '舒服的沙發', ico: '🛋️', cat: '家具', price: 28000, resale: 0.2, minA: 18, perk: { md: 0.4, st: 0.4 }, d: '下班回家躺著就是幸福。' },
  { id: 'tv', n: '大螢幕電視', ico: '📺', cat: '家具', price: 35000, resale: 0.25, minA: 18, perk: { md: 0.4, st: 0.3 }, d: '全家一起看電影。' },
  { id: 'aircon', n: '變頻冷氣', ico: '❄️', cat: '家具', price: 42000, up: 900, resale: 0.2, minA: 18, perk: { hp: 0, md: 0.4, st: 0.4 }, d: '夏天不再熱到睡不著。' },
  { id: 'massage', n: '按摩椅', ico: '💺', cat: '家具', price: 120000, resale: 0.3, minA: 18, perk: { st: 1.0, md: 0.3 }, d: '每天按一按，壓力全消。' },
  // 興趣
  { id: 'piano', n: '鋼琴', ico: '🎹', cat: '興趣', price: 90000, resale: 0.5, minA: 4, perk: { grow: { cr: 0.12 } }, d: '在家就能練琴。創造力成長加快。' },
  { id: 'guitar', n: '吉他', ico: '🎸', cat: '興趣', price: 8000, resale: 0.4, minA: 10, perk: { md: 0.3, grow: { cr: 0.06 } }, d: '自彈自唱，心情好。' },
  { id: 'books', n: '一整櫃好書', ico: '📚', cat: '興趣', price: 12000, resale: 0.1, minA: 6, perk: { grow: { iq: 0.07, cr: 0.03 } }, d: '每天睡前讀幾頁。' },
  { id: 'gym', n: '健身器材', ico: '🏋️', cat: '興趣', price: 25000, resale: 0.3, minA: 16, perk: { grow: { ft: 0.1 } }, d: '在家就能練身體。' },
  { id: 'plants', n: '陽台小花園', ico: '🪴', cat: '興趣', price: 4000, up: 200, resale: 0, minA: 10, perk: { md: 0.4, st: 0.3 }, d: '種種花草，療癒身心。' },
  // 時尚
  { id: 'clothes', n: '一整套新衣服', ico: '👕', cat: '時尚', price: 8000, resale: 0, minA: 10, perk: { grow: { ch: 0.05 } }, d: '穿得好看，自信也提升。' },
  { id: 'watch', n: '名錶', ico: '⌚', cat: '時尚', price: 180000, resale: 0.6, minA: 18, perk: { md: 0.3, grow: { ch: 0.06 } }, d: '低調又有質感。' },
  { id: 'bag', n: '名牌包', ico: '👜', cat: '時尚', price: 120000, resale: 0.5, minA: 18, perk: { md: 0.4, grow: { ch: 0.05 } }, d: '犒賞自己的禮物。' },
  // 寵物
  { id: 'dog', n: '養一隻狗', ico: '🐕', cat: '寵物', price: 3000, up: 2500, resale: 0, minA: 8, need: S => !(S.pet && S.pet.alive), needT: '家裡已經有寵物了', fx: { pet: '狗' }, perk: { md: 0.6, grow: { ft: 0.03 } }, d: '從收容所領養。每月飼料、看醫生約 2,500 元。' },
  { id: 'cat', n: '養一隻貓', ico: '🐈', cat: '寵物', price: 3000, up: 2000, resale: 0, minA: 8, need: S => !(S.pet && S.pet.alive), needT: '家裡已經有寵物了', fx: { pet: '貓' }, perk: { md: 0.6, st: 0.3 }, d: '從收容所領養。每月約 2,000 元。' }
];

// 房屋：租屋與購屋各四種等級（mul 乘上所在縣市的基本房租或房價）
LG.HOMES = {
  rent: [
    { lv: 1, n: '分租雅房', ico: '🚪', mul: 0.55, md: -0.4, d: '和別人共用衛浴，便宜但擠。' },
    { lv: 2, n: '獨立套房', ico: '🛏️', mul: 1, md: 0, d: '一個人住剛剛好。' },
    { lv: 3, n: '兩房公寓', ico: '🏢', mul: 1.7, md: 0.3, d: '有客廳和兩間房，適合兩人或小家庭。' },
    { lv: 4, n: '三房電梯大樓', ico: '🏙️', mul: 2.6, md: 0.6, d: '寬敞有管理員，全家住得舒服。' }
  ],
  buy: [
    { lv: 1, n: '老公寓', ico: '🏚️', mul: 0.6, md: 0.2, d: '屋齡老、要爬樓梯，但總算是自己的家。' },
    { lv: 2, n: '電梯小宅', ico: '🏠', mul: 1, md: 0.5, d: '兩房一廳，小而溫馨。' },
    { lv: 3, n: '三房電梯大樓', ico: '🏡', mul: 1.5, md: 0.8, d: '有車位和中庭，孩子有自己的房間。' },
    { lv: 4, n: '透天別墅', ico: '🏰', mul: 2.5, md: 1.2, d: '有庭院、有露台，人生勝利組。' }
  ]
};
