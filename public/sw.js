// The old single-page app registered a caching service worker. The rebuilt site does not use
// one, so this version clears the old caches and unregisters itself for returning visitors.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
    })()
  );
});
