'use client';

import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { PushNotificationManager } from './PushNotificationManager';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { DebugConsole } from './DebugConsole';

export function ClientComponents() {
  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <PushNotificationManager />
      <DebugConsole />
    </>
  );
}
