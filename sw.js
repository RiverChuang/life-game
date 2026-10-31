/* 離線快取：第一次打開後，沒有網路也能玩。改版時把 VERSION 改掉，手機會自動更新。 */
const VERSION = 'lifegame-v0.4.1';
const FILES = [
    './',
    './css/style.css',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './index.html',
    './js/activities.js',
    './js/art.js',
    './js/engine.js',
    './js/events/e0_infant.js',
    './js/events/e10_life.js',
    './js/events/e11_adult_daily.js',
    './js/events/e12_mid.js',
    './js/events/e13_late.js',
    './js/events/e1_toddler.js',
    './js/events/e2_child.js',
    './js/events/e3_teen.js',
    './js/events/e4_family.js',
    './js/events/e5_daily.js',
    './js/events/e6_upper_elem.js',
    './js/events/e7_uni.js',
    './js/events/e8_army.js',
    './js/events/e9_work.js',
    './js/jobs.js',
    './js/save.js',
    './js/shop.js',
    './js/town.js',
    './js/ui.js',
    './manifest.webmanifest',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // 字型：有網路就用，沒網路就略過（會改用手機內建字型）
    e.respondWith(caches.open(VERSION + '-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  // 自己的檔案：先拿網路上的新版，沒網路才用快取
  e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./'))));
});
