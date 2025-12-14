import webpush from 'web-push';
import prisma from '@/lib/prisma';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from './vapid';
import { NotificationData, NotificationType } from './notificationTypes';

// Lazy initialization to avoid build-time errors
let vapidConfigured = false;

function ensureVapidConfigured() {
  if (!vapidConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }
}

export async function sendPushNotification(
  userId: string,
  notificationData: NotificationData,
  notificationType: NotificationType,
  relatedId?: string,
  metadata?: Record<string, any>
): Promise<{ success: number; failed: number }> {
  try {
    // Ensure VAPID is configured
    ensureVapidConfigured();

    // Get all push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { success: 0, failed: 0 };
    }

    const payload = JSON.stringify(notificationData);
    let successCount = 0;
    let failedCount = 0;

    // Send notification to all user's devices
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys as { p256dh: string; auth: string },
          },
          payload
        );
        successCount++;
      } catch (error: any) {
        console.error(`Failed to send notification to ${subscription.endpoint}:`, error);
        failedCount++;

        // If subscription is no longer valid (410 Gone), delete it
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          });
          console.log(`Deleted invalid subscription ${subscription.id}`);
        }
      }
    }

    // Log the notification
    await prisma.notificationLog.create({
      data: {
        userId,
        type: notificationType,
        relatedId,
        metadata: metadata || {},
      },
    });

    console.log(`Sent notification to user ${userId}: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: 0, failed: 0 };
  }
}

export async function sendPushNotificationToMultipleUsers(
  userNotifications: Array<{
    userId: string;
    notificationData: NotificationData;
    notificationType: NotificationType;
    relatedId?: string;
    metadata?: Record<string, any>;
  }>
): Promise<{ totalSuccess: number; totalFailed: number }> {
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const { userId, notificationData, notificationType, relatedId, metadata } of userNotifications) {
    const result = await sendPushNotification(userId, notificationData, notificationType, relatedId, metadata);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { totalSuccess, totalFailed };
}
