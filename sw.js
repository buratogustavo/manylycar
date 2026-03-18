// ManyCars — Service Worker
// Arquivo: sw.js (colocar na RAIZ do repositório GitHub)

var CACHE_NAME = 'manycars-v2';
var OFFLINE_URL = '/index.html';

// Instala e faz cache dos arquivos principais
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Responde com cache quando offline
self.addEventListener('fetch', function(event) {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────
// Recebe notificações do OneSignal automaticamente
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data.json(); } catch(e) {}

  var title   = data.title   || 'ManyCars';
  var body    = data.body    || 'Você tem um novo alerta de manutenção.';
  var icon    = data.icon    || '/icon-192.png';
  var badge   = data.badge   || '/icon-72.png';
  var url     = data.url     || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body:    body,
      icon:    icon,
      badge:   badge,
      tag:     'manycars-alert',
      data:    { url: url },
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open',    title: 'Ver detalhes' },
        { action: 'dismiss', title: 'Dispensar'   }
      ]
    })
  );
});

// Clique na notificação — abre o app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes(self.location.origin)) {
          return list[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
