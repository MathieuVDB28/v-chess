'use client';

import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { PushNotificationManager } from './PushNotificationManager';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

export function ClientComponents() {
  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <PushNotificationManager />
    </>
  );
}
