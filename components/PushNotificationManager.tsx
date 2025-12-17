'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, BellOff, Settings as SettingsIcon, Xmark } from 'iconoir-react';

export function PushNotificationManager() {
  const session = useSession();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();

      // Debug: Check service worker status
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log('🔧 Service worker registrations:', registrations.length);
          registrations.forEach((reg, i) => {
            console.log(`🔧 SW ${i}:`, reg.active?.scriptURL, 'State:', reg.active?.state);
          });
        });
      }
    }
  }, [session]);

  // Auto-resubscribe if subscription is lost
  useEffect(() => {
    if (!session?.data || permission !== 'granted' || !('serviceWorker' in navigator)) return;

    const checkAndResubscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const wasSubscribed = localStorage.getItem('push_subscription_enabled') === 'true';

        if (!subscription && wasSubscribed) {
          // User was subscribed before but subscription was lost - resubscribe automatically
          console.log('Subscription lost, resubscribing automatically...');

          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          // Send subscription to server
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: {
                endpoint: newSubscription.endpoint,
                keys: {
                  p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')!),
                  auth: arrayBufferToBase64(newSubscription.getKey('auth')!),
                },
              },
            }),
          });

          if (response.ok) {
            setIsSubscribed(true);
            console.log('Auto-resubscribed successfully');
          }
        } else if (subscription) {
          // Sync state with actual subscription
          setIsSubscribed(true);
          if (!wasSubscribed) {
            localStorage.setItem('push_subscription_enabled', 'true');
          }
        } else if (!subscription && !wasSubscribed) {
          // No subscription and user never subscribed - ensure state is correct
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    // Initial check
    checkAndResubscribe();

    // Check on page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndResubscribe();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, permission]);

  async function checkSubscription() {
    if (!session?.data || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      alert('Ce navigateur ne supporte pas les notifications push');
      return;
    }

    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        await subscribe();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Erreur lors de la demande de permission');
    } finally {
      setLoading(false);
    }
  }

  async function subscribe() {
    if (!session?.data || !('serviceWorker' in navigator)) {
      console.error('Cannot subscribe: no session or service worker not supported');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting subscription process...');

      // Check for VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured!');
        alert('Erreur de configuration: VAPID public key manquante. Contactez le support.');
        return;
      }
      console.log('VAPID public key found');

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Service worker timeout')), 10000)
        )
      ]) as ServiceWorkerRegistration;
      console.log('Service worker ready:', registration);

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      console.log('Existing subscription:', subscription);

      if (!subscription) {
        console.log('Creating new push subscription...');
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
        console.log('Push subscription created:', subscription.endpoint);
      }

      // Send subscription to server
      console.log('Sending subscription to server...');
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(subscription.getKey('auth')!),
            },
          },
        }),
      });

      console.log('Server response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Subscription saved:', data);
        setIsSubscribed(true);
        localStorage.setItem('push_subscription_enabled', 'true');
        console.log('✅ Subscribed to push notifications');
      } else {
        const errorData = await response.json();
        console.error('Failed to save subscription:', errorData);
        throw new Error(`Server error: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      if (error instanceof Error) {
        if (error.message === 'Service worker timeout') {
          alert('Le service worker n\'est pas disponible. Veuillez recharger la page et réessayer. Si le problème persiste, vérifiez que votre navigateur supporte les service workers.');
        } else {
          alert(`Erreur lors de l'inscription aux notifications: ${error.message}`);
        }
      } else {
        alert('Erreur lors de l\'inscription aux notifications');
      }
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!('serviceWorker' in navigator)) return;

    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        setIsSubscribed(false);
        localStorage.removeItem('push_subscription_enabled');
        console.log('Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      alert('Erreur lors de la désinscription');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const response = await fetch('/api/push/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async function updateSetting(key: string, value: boolean) {
    try {
      const response = await fetch('/api/push/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
    }
  }

  useEffect(() => {
    if (showSettings && session?.data) {
      loadSettings();
    }
  }, [showSettings, session]);

  if (!session?.data) return null;

  return (
    <>
      {/* Main notification button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {permission === 'default' && (
          <button
            onClick={requestPermission}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-lg shadow-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Activer les notifications</span>
          </button>
        )}

        {permission === 'granted' && (
          <div className="flex gap-2">
            {isSubscribed ? (
              <>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 bg-white border-2 border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition"
                  title="Paramètres des notifications"
                >
                  <SettingsIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={unsubscribe}
                  disabled={loading}
                  className="p-3 bg-white border-2 border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition disabled:opacity-50"
                  title="Désactiver les notifications"
                >
                  <BellOff className="w-5 h-5 text-gray-700" />
                </button>
              </>
            ) : (
              <button
                onClick={subscribe}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-lg shadow-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium">Réactiver les notifications</span>
              </button>
            )}
          </div>
        )}

        {permission === 'denied' && (
          <div className="px-4 py-3 bg-red-100 text-red-800 rounded-lg shadow-lg text-sm max-w-xs">
            <p className="font-medium">Notifications bloquées</p>
            <p className="text-xs mt-1">Autorisez les notifications dans les paramètres de votre navigateur</p>
          </div>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && settings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Préférences de notifications</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Xmark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Goals notifications */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Notifications d'objectifs</h3>
                <div className="space-y-2">
                  <SettingToggle
                    label="Rappels de date cible"
                    description="7 jours, 3 jours et jour J"
                    value={settings.goalReminders}
                    onChange={(v) => updateSetting('goalReminders', v)}
                  />
                  <SettingToggle
                    label="Retard sur objectif"
                    description="Si progression insuffisante à mi-parcours"
                    value={settings.goalBehindSchedule}
                    onChange={(v) => updateSetting('goalBehindSchedule', v)}
                  />
                  <SettingToggle
                    label="Avance sur objectif"
                    description="Si progression excellente"
                    value={settings.goalAheadSchedule}
                    onChange={(v) => updateSetting('goalAheadSchedule', v)}
                  />
                  <SettingToggle
                    label="Objectif atteint"
                    description="Félicitations quand rating cible atteint"
                    value={settings.goalAchieved}
                    onChange={(v) => updateSetting('goalAchieved', v)}
                  />
                  <SettingToggle
                    label="Objectif manqué"
                    description="Date dépassée sans atteindre le rating"
                    value={settings.goalMissed}
                    onChange={(v) => updateSetting('goalMissed', v)}
                  />
                  <SettingToggle
                    label="Progression hebdomadaire"
                    description="Résumé chaque lundi"
                    value={settings.weeklyProgress}
                    onChange={(v) => updateSetting('weeklyProgress', v)}
                  />
                </div>
              </div>

              {/* Stats notifications */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Notifications de statistiques</h3>
                <div className="space-y-2">
                  <SettingToggle
                    label="Série de victoires"
                    description="5 wins d'affilée"
                    value={settings.winStreak}
                    onChange={(v) => updateSetting('winStreak', v)}
                  />
                  <SettingToggle
                    label="Série de défaites"
                    description="5 losses d'affilée"
                    value={settings.loseStreak}
                    onChange={(v) => updateSetting('loseStreak', v)}
                  />
                  <SettingToggle
                    label="Gros gain d'ELO"
                    description="+50 points ou plus"
                    value={settings.bigRatingGain}
                    onChange={(v) => updateSetting('bigRatingGain', v)}
                  />
                  <SettingToggle
                    label="Grosse perte d'ELO"
                    description="-50 points ou plus"
                    value={settings.bigRatingLoss}
                    onChange={(v) => updateSetting('bigRatingLoss', v)}
                  />
                  <SettingToggle
                    label="Nouveau record personnel"
                    description="Meilleur rating ever"
                    value={settings.newPersonalRecord}
                    onChange={(v) => updateSetting('newPersonalRecord', v)}
                  />
                  <SettingToggle
                    label="Palier de rating"
                    description="1500, 1600, 1700..."
                    value={settings.ratingMilestone}
                    onChange={(v) => updateSetting('ratingMilestone', v)}
                  />
                  <SettingToggle
                    label="Retour au sommet"
                    description="Retour au meilleur rating après baisse"
                    value={settings.backToTop}
                    onChange={(v) => updateSetting('backToTop', v)}
                  />
                  <SettingToggle
                    label="Amélioration du winrate"
                    description="+5% sur 20 dernières parties"
                    value={settings.winrateImprovement}
                    onChange={(v) => updateSetting('winrateImprovement', v)}
                  />
                  <SettingToggle
                    label="Rappel d'inactivité"
                    description="Pas de parties depuis 7 jours"
                    value={settings.inactivityReminder}
                    onChange={(v) => updateSetting('inactivityReminder', v)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          value ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
