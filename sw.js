var CACHE_NAME = "opentab-app-v3";
var APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./favicon.svg",
  "./site.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE_NAME;
      }).map(function (key) {
        return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, copy);
      });
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) return cached;
        return caches.match("./index.html");
      });
    })
  );
});
