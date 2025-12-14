import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { runAllNotificationChecks } from '@/lib/notifications/eventDetectors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting notification checks cron job...');

    // Get all users with active goals or push subscriptions
    const usersWithGoals = await prisma.user.findMany({
      where: {
        OR: [
          { goals: { some: { status: 'active' } } },
          { pushSubscriptions: { some: {} } },
        ],
      },
      select: {
        id: true,
        chesscom_username: true,
        notificationSettings: true,
      },
    });

    console.log(`Found ${usersWithGoals.length} users to check`);

    let totalChecked = 0;
    let totalErrors = 0;

    // Run checks for each user
    for (const user of usersWithGoals) {
      try {
        // Skip if user has no notification settings (means they haven't enabled notifications)
        if (!user.notificationSettings) {
          console.log(`Skipping user ${user.chesscom_username} - no notification settings`);
          continue;
        }

        await runAllNotificationChecks(user.id, user.chesscom_username);
        totalChecked++;
      } catch (error) {
        console.error(`Error checking notifications for user ${user.chesscom_username}:`, error);
        totalErrors++;
      }
    }

    console.log(`Notification checks completed: ${totalChecked} checked, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      usersChecked: totalChecked,
      errors: totalErrors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in notification cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Alternative POST endpoint for manual testing
export async function POST(req: NextRequest) {
  return GET(req);
}
