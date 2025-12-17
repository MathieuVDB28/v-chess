import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('📬 [Push Subscribe] POST request received');

    const session = await getServerSession(authOptions);
    console.log('📬 [Push Subscribe] Session:', session?.user?.email || 'No session');

    if (!session?.user?.email) {
      console.log('📬 [Push Subscribe] ❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log('📬 [Push Subscribe] User found:', user?.id || 'No user');

    if (!user) {
      console.log('📬 [Push Subscribe] ❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { subscription } = await req.json();
    console.log('📬 [Push Subscribe] Subscription data received:', {
      endpoint: subscription?.endpoint ? 'Present' : 'Missing',
      keys: subscription?.keys ? 'Present' : 'Missing',
    });

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      console.log('📬 [Push Subscribe] ❌ Invalid subscription data');
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Check if subscription already exists
    console.log('📬 [Push Subscribe] Checking for existing subscription...');
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });
    console.log('📬 [Push Subscribe] Existing subscription:', existing ? 'Found' : 'Not found');

    if (existing) {
      // Update existing subscription
      console.log('📬 [Push Subscribe] Updating existing subscription...');
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          keys: subscription.keys,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });

      console.log('📬 [Push Subscribe] ✅ Subscription updated successfully');
      return NextResponse.json({ message: 'Subscription updated', subscriptionId: existing.id });
    }

    // Create new subscription
    console.log('📬 [Push Subscribe] Creating new subscription...');
    const newSubscription = await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    });
    console.log('📬 [Push Subscribe] New subscription created:', newSubscription.id);

    // Create default notification settings if they don't exist
    console.log('📬 [Push Subscribe] Checking notification settings...');
    const settings = await prisma.userNotificationSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      console.log('📬 [Push Subscribe] Creating default notification settings...');
      await prisma.userNotificationSettings.create({
        data: { userId: user.id },
      });
      console.log('📬 [Push Subscribe] Notification settings created');
    } else {
      console.log('📬 [Push Subscribe] Notification settings already exist');
    }

    console.log('📬 [Push Subscribe] ✅ Subscription created successfully');
    return NextResponse.json({ message: 'Subscription created', subscriptionId: newSubscription.id });
  } catch (error) {
    console.error('📬 [Push Subscribe] ❌ Error subscribing to push notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return NextResponse.json({ message: 'Subscription deleted' });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
