import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let settings = await prisma.userNotificationSettings.findUnique({
      where: { userId: user.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userNotificationSettings.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates = await req.json();

    // Validate that only valid fields are being updated
    const validFields = [
      'goalReminders',
      'goalBehindSchedule',
      'goalAheadSchedule',
      'goalAchieved',
      'goalMissed',
      'weeklyProgress',
      'winStreak',
      'loseStreak',
      'bigRatingGain',
      'bigRatingLoss',
      'newPersonalRecord',
      'ratingMilestone',
      'backToTop',
      'winrateImprovement',
      'inactivityReminder',
    ];

    const filteredUpdates: any = {};
    for (const field of validFields) {
      if (field in updates && typeof updates[field] === 'boolean') {
        filteredUpdates[field] = updates[field];
      }
    }

    const settings = await prisma.userNotificationSettings.upsert({
      where: { userId: user.id },
      update: filteredUpdates,
      create: {
        userId: user.id,
        ...filteredUpdates,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
