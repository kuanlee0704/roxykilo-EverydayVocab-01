// 改了任何檔案就把版本號 +1,舊快取會自動清掉
const VER = 'dw-v23';
const SHELL = ['./', './index.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))
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
