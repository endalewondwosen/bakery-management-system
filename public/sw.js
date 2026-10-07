/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Yibeltal Bakery Management System - Service Worker
 * Enables offline loading & instant caching for all devices (Android, iOS, PC, Mac).
 */

const CACHE_NAME = 'yibeltal-bakery-cache-v1';

// Core shell assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
];

// 1. Install: Precache core assets & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache warning (some assets may cache on first fetch):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate: Clean up old versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Offline-first with Stale-While-Revalidate & SPA fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore non-http requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // A. Navigation requests (Opening the app from bookmark, browser reload, cold start)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone and update cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // If offline / network failure, return cached index.html
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = await cache.match('/index.html') || await cache.match('/');
          if (cachedIndex) return cachedIndex;

          // Fallback to whatever matched in cache
          return caches.match(request);
        })
    );
    return;
  }

  // B. Asset requests (JS, CSS, Images, Fonts, Icons)
  // Stale-While-Revalidate strategy: serve from cache if available, update in background
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
        .catch(() => {
          // Network failed, if we have cachedResponse it is already returned below
          return null;
        });

      // Return cached immediately if found, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
