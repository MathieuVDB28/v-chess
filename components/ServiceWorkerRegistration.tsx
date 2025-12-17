'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    console.log('🔧 ServiceWorkerRegistration: Starting...');
    console.log('🔧 window.workbox exists:', typeof window !== 'undefined' && window.workbox !== undefined);
    console.log('🔧 serviceWorker in navigator:', 'serviceWorker' in navigator);

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      console.log('🔧 Using workbox registration');
      const wb = window.workbox;

      // A common UX pattern for progressive web apps is to show a banner when a service worker has updated and waiting to install.
      wb.addEventListener('waiting', () => {
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
      console.log('🔧 Using manual registration (fallback)');
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
              console.log('✅ Service Worker registered successfully:', registration);
              console.log('✅ SW scope:', registration.scope);
              console.log('✅ SW active:', registration.active);
            })
            .catch((error) => {
              console.error('❌ Service Worker registration failed:', error);
              console.error('❌ Error name:', error.name);
              console.error('❌ Error message:', error.message);
            });
        });
      } else {
        console.error('❌ Service workers are not supported in this browser');
      }
    }
  }, []);

  return null;
}
