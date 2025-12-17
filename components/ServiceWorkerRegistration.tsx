'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    console.log('🔧 ServiceWorkerRegistration: Starting...');
    console.log('🔧 window.workbox exists:', typeof window !== 'undefined' && window.workbox !== undefined);
    console.log('🔧 serviceWorker in navigator:', 'serviceWorker' in navigator);

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    console.log('🔧 Device:', { isIOS, isStandalone, userAgent: navigator.userAgent });

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
        const registerSW = async () => {
          try {
            console.log('🔧 Starting SW registration...');
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none' // Important for iOS
            });
            console.log('✅ Service Worker registered successfully');
            console.log('✅ SW scope:', registration.scope);
            console.log('✅ SW installing:', registration.installing);
            console.log('✅ SW waiting:', registration.waiting);
            console.log('✅ SW active:', registration.active);

            // Wait for SW to be ready
            if (registration.installing) {
              console.log('🔧 Service Worker installing...');
              registration.installing.addEventListener('statechange', (e: Event) => {
                const sw = e.target as ServiceWorker;
                console.log('🔧 SW state changed to:', sw.state);
              });
            }

            // Force update check on iOS
            if (isIOS) {
              console.log('🔧 Checking for SW updates (iOS)...');
              await registration.update();
            }
          } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            if (error instanceof Error) {
              console.error('❌ Error name:', error.name);
              console.error('❌ Error message:', error.message);
              console.error('❌ Error stack:', error.stack);
            }
          }
        };

        // Register immediately, don't wait for load on iOS
        if (isIOS) {
          console.log('🔧 iOS detected, registering SW immediately');
          registerSW();
        } else {
          window.addEventListener('load', registerSW);
        }
      } else {
        console.error('❌ Service workers are not supported in this browser');
      }
    }
  }, []);

  return null;
}
