// Service Worker for Task Tracker

const CACHE_NAME = "task-tracker-cache-v1"
const OFFLINE_URL = "/offline.html"

// Install event - cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/offline.html", "/favicon.ico"])
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return the offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }
          return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          })
        })
    }),
  )
})

// Listen for messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TIMER_NOTIFICATION") {
    const { title, options } = event.data
    self.registration.showNotification(title, options)
  }
})

// Handle timer events in the background
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "timer-sync") {
    event.waitUntil(syncTimers())
  }
})

// Sync timers function (placeholder)
async function syncTimers() {
  // This would be implemented to sync timer data
  console.log("Syncing timers in the background")
}
