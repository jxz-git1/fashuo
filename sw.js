/* 法硕备考工作台：静态托管时的离线缓存（相对路径，放到子目录也能用） */
const CACHE = 'fashuo-v2';
const PRECACHE = ['./', './fashuo-workbench.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(PRECACHE).catch(function () {});
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.indexOf('/api/') === 0) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      const cp = r.clone();
      caches.open(CACHE).then(function (c) { c.put('./', cp); });
      return r;
    }).catch(function () {
      return caches.match('./').then(function (m) { return m || caches.match(req); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    const net = fetch(req).then(function (r) {
      if (r && r.status === 200) {
        const cp = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, cp); });
      }
      return r;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
