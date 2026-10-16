import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge any stale legacy caches directly from window context to ensure no stale API responses
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== 'yibeltal-bakery-cache-v3') {
        caches.delete(key).catch(() => {});
      }
    });
  }).catch(() => {});
}

// Complete clean slate migration: purge all old demo/mock data from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const CLEAN_FLAG = 'yibeltal_clean_slate_v3_applied';
  if (!localStorage.getItem(CLEAN_FLAG)) {
    try {
      const keysToClear: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('bakery_') || k.startsWith('offline_'))) {
          // Keep user auth credentials/token, theme and language
          if (k.includes('token') || k.includes('user') || k.includes('auth') || k.includes('theme') || k.includes('language')) {
            continue;
          }
          keysToClear.push(k);
        }
      }
      keysToClear.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(CLEAN_FLAG, 'true');
    } catch {
      // Ignore
    }
  }
}

// Register and auto-update Service Worker for offline operation & seamless sync
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Force check for newest service worker file immediately
        registration.update().catch(() => {});

        // If there is an installed worker waiting, activate it immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Listen for new worker installation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('ServiceWorker registration error:', err);
      });
  });

  // When user returns to the app (foregrounded on phone/laptop), check for updates
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      }).catch(() => {});
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
