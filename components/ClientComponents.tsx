'use client';

import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { PushNotificationManager } from './PushNotificationManager';

export function ClientComponents() {
  return (
    <>
      <OfflineIndicator />
      <PWAInstallPrompt />
      <PushNotificationManager />
    </>
  );
}
