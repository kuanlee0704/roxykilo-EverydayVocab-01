// 改了任何檔案就把 VER +1,舊快取會自動清掉
const VER = 'dw-v76';
// 字庫(words.js)很大、幾乎不變 → 放在自己的快取、快取優先;只有字庫內容真的改了才把 WORDS_VER +1
const WORDS_VER = 'dw-words-1';
const SHELL = ['./', './index.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(VER).then(c => c.addAll(SHELL)),
    caches.open(WORDS_VER).then(c => c.match('./words.js').then(hit => hit || c.add('./words.js')))
  ]));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k !== WORDS_VER && k !== 'dw-tts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google Apps Script API 一律走網路(App 自己已用 localStorage 做離線快取)
  if (url.origin !== location.origin) return;
  // manifest 永遠走網路,避免安裝時讀到舊的顏色/圖示
  if (url.pathname.endsWith('.webmanifest')) return;
  // 字庫:快取優先,日常開啟不再下載
  if (url.pathname.endsWith('/words.js')) {
    e.respondWith(caches.open(WORDS_VER).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) c.put(req, r.clone());
      return r;
    }))));
    return;
  }
  // 頁面:網路優先(有網路就拿最新版),失敗才用快取 → 離線也能開
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { caches.open(VER).then(c => c.put('./index.html', r.clone())); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // 其他靜態檔:快取優先
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    const copy = r.clone(); caches.open(VER).then(c => c.put(req, copy)); return r;
  })));
});
