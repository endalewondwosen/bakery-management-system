/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Yibeltal Bakery Management System - Service Worker (v2)
 * Enables offline loading & instant app shell caching for mobile and desktop PWA.
 * 
 * IMPORTANT: API requests (/api/*) are strictly BYPASSED from SW caching to guarantee
 * instant cross-device synchronization between mobile phones, tablets, and laptops.
 */

const CACHE_NAME = 'yibeltal-bakery-cache-v3';

// Core shell assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
];

// 1. Install: Precache core assets & activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache notice (non-blocking):', err);
      });
    })
  );
});

// 2. Activate: Clean up all legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting legacy cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(async () => {
      // Purge any cached /api/ entries that might have been stored in v1
      try {
        const currentCache = await caches.open(CACHE_NAME);
        const keys = await currentCache.keys();
        await Promise.all(
          keys.map((request) => {
            const u = new URL(request.url);
            if (u.pathname.startsWith('/api') || u.pathname.includes('/api/')) {
              console.log(`[SW] Purging cached API call: ${u.pathname}`);
              return currentCache.delete(request);
            }
          })
        );
      } catch (e) {
        // Non-blocking
      }
    }).then(() => self.clients.claim())
  );
});

// 3. Message listener to support immediate skipWaiting on update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch: Offline-first for UI shell, strict bypass for API sync
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never intercept non-GET requests (POST, PUT, DELETE, PATCH handle their own queue)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore non-http requests (e.g. chrome-extension://, blob:)
  if (!url.protocol.startsWith('http')) return;

  // CRITICAL: NEVER cache or intercept /api/ requests in the Service Worker.
  // Real-time synchronization requires direct network roundtrips to the server,
  // while offline data is handled deterministically via IndexedDB/offlineQueue.
  if (url.pathname.startsWith('/api') || url.pathname.includes('/api/')) {
    return;
  }

  // A. Navigation requests (Opening the app, bookmark, refresh, cold start)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = await cache.match('/index.html') || await cache.match('/');
          if (cachedIndex) return cachedIndex;
          return caches.match(request);
        })
    );
    return;
  }

  // B. Static UI Assets (JS, CSS, SVGs, Fonts, Images)
  // Stale-While-Revalidate: serve cached version quickly, revalidate in background
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
