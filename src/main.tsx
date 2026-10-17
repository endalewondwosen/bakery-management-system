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
          // Keep user auth credentials/token, theme, language, and role
          if (k.includes('token') || k.includes('user') || k.includes('auth') || k.includes('theme') || k.includes('language') || k.includes('role')) {
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

// Unregister any active service worker to prevent stale bundle caching
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister();
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
