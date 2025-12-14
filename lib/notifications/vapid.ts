export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
  console.warn('VAPID keys are not configured. Push notifications will not work.');
}
