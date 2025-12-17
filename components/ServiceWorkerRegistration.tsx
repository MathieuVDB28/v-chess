'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      // A common UX pattern for progressive web apps is to show a banner when a service worker has updated and waiting to install.
      wb.addEventListener('waiting', (event) => {
        console.log('Service worker is waiting, skipping waiting...');
        // Assuming the user accepted the update, set up a listener
        // that will reload the page as soon as the previously waiting
        // service worker has taken control.
        wb.addEventListener('controlling', () => {
          window.location.reload();
        });

        // Send a message to the waiting service worker,
        // instructing it to activate.
        wb.messageSkipWaiting();
      });

      wb.register();
    } else {
      // Manual registration as fallback
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      }
    }
  }, []);

  return null;
}
