const CACHE_NAME = "toeic-planner-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./netlify.toml"
];

// 서비스 워커 설치 및 캐싱
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 활성화 및 구버전 캐시 정리
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 요청 인터셉트 및 캐시 우선 서빙
self.addEventListener("fetch", (e) => {
  // Gist API 요청은 캐시하지 않고 항상 네트워크 요청
  if (e.request.url.includes("api.github.com")) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 캐시된 응답이 있으면 반환하되, 백그라운드에서 최신 데이터를 받아와 캐시 갱신
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {/* 오프라인 시 무시 */});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
