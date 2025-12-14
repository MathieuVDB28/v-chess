import prisma from '@/lib/prisma';
import { NotificationType, buildNotification, NotificationContext } from './notificationTypes';
import { sendPushNotification } from './sendPushNotification';

interface ChessComStats {
  chess_daily?: { last?: { rating: number }; best?: { rating: number } };
  chess_rapid?: { last?: { rating: number }; best?: { rating: number } };
  chess_blitz?: { last?: { rating: number }; best?: { rating: number } };
  chess_bullet?: { last?: { rating: number }; best?: { rating: number } };
}

interface ChessComGame {
  end_time: number;
  white: { username: string; rating: number };
  black: { username: string; rating: number };
}

const GAME_MODE_MAP: Record<string, keyof ChessComStats> = {
  daily: 'chess_daily',
  rapid: 'chess_rapid',
  blitz: 'chess_blitz',
  bullet: 'chess_bullet',
};

// Helper to check if notification was already sent recently
async function wasRecentlySent(userId: string, type: NotificationType, relatedId?: string, withinHours = 24): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  const existing = await prisma.notificationLog.findFirst({
    where: {
      userId,
      type,
      relatedId,
      sentAt: { gte: since },
    },
  });
  return !!existing;
}

// ========== GOAL DETECTORS ==========

export async function checkGoalReminders(userId: string, username: string) {
  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: 'active' },
  });

  const now = new Date();

  for (const goal of activeGoals) {
    const daysRemaining = Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Fetch current rating
    const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
    if (!statsResponse.ok) continue;
    const stats: ChessComStats = await statsResponse.json();

    const gameModeKey = GAME_MODE_MAP[goal.gameMode];
    const currentRating = stats[gameModeKey]?.last?.rating || goal.startRating;
    const progressPercent = Math.round(((currentRating - goal.startRating) / (goal.targetRating - goal.startRating)) * 100);

    const context: NotificationContext = {
      userId,
      username,
      gameMode: goal.gameMode,
      rating: currentRating,
      targetRating: goal.targetRating,
      goalId: goal.id,
      daysRemaining,
      progressPercent,
    };

    // 7 days reminder
    if (daysRemaining === 7 && !(await wasRecentlySent(userId, NotificationType.GOAL_REMINDER_7_DAYS, goal.id, 48))) {
      const notification = buildNotification(NotificationType.GOAL_REMINDER_7_DAYS, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_REMINDER_7_DAYS, goal.id, { daysRemaining, progressPercent });
    }

    // 3 days reminder
    if (daysRemaining === 3 && !(await wasRecentlySent(userId, NotificationType.GOAL_REMINDER_3_DAYS, goal.id, 48))) {
      const notification = buildNotification(NotificationType.GOAL_REMINDER_3_DAYS, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_REMINDER_3_DAYS, goal.id, { daysRemaining, progressPercent });
    }

    // Today reminder
    if (daysRemaining === 0 && !(await wasRecentlySent(userId, NotificationType.GOAL_REMINDER_TODAY, goal.id, 12))) {
      const notification = buildNotification(NotificationType.GOAL_REMINDER_TODAY, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_REMINDER_TODAY, goal.id, { progressPercent });
    }
  }
}

export async function checkGoalProgress(userId: string, username: string) {
  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: 'active' },
  });

  const now = new Date();

  for (const goal of activeGoals) {
    const totalDuration = new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime();
    const elapsed = now.getTime() - new Date(goal.createdAt).getTime();
    const timeProgress = (elapsed / totalDuration) * 100;

    // Fetch current rating
    const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
    if (!statsResponse.ok) continue;
    const stats: ChessComStats = await statsResponse.json();

    const gameModeKey = GAME_MODE_MAP[goal.gameMode];
    const currentRating = stats[gameModeKey]?.last?.rating || goal.startRating;
    const ratingProgress = ((currentRating - goal.startRating) / (goal.targetRating - goal.startRating)) * 100;

    const context: NotificationContext = {
      userId,
      username,
      gameMode: goal.gameMode,
      rating: currentRating,
      targetRating: goal.targetRating,
      goalId: goal.id,
      progressPercent: Math.round(ratingProgress),
    };

    // Behind schedule (at 50% time, less than 40% progress)
    if (timeProgress >= 50 && timeProgress < 55 && ratingProgress < 40 && !(await wasRecentlySent(userId, NotificationType.GOAL_BEHIND_SCHEDULE, goal.id, 7 * 24))) {
      const notification = buildNotification(NotificationType.GOAL_BEHIND_SCHEDULE, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_BEHIND_SCHEDULE, goal.id, { ratingProgress: Math.round(ratingProgress) });
    }

    // Ahead of schedule (80% progress with 30%+ time remaining)
    if (ratingProgress >= 80 && timeProgress < 70 && !(await wasRecentlySent(userId, NotificationType.GOAL_AHEAD_SCHEDULE, goal.id, 7 * 24))) {
      const notification = buildNotification(NotificationType.GOAL_AHEAD_SCHEDULE, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_AHEAD_SCHEDULE, goal.id, { ratingProgress: Math.round(ratingProgress) });
    }

    // Goal achieved
    if (currentRating >= goal.targetRating && !(await wasRecentlySent(userId, NotificationType.GOAL_ACHIEVED, goal.id))) {
      const notification = buildNotification(NotificationType.GOAL_ACHIEVED, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_ACHIEVED, goal.id, { finalRating: currentRating });
      // Mark goal as completed
      await prisma.goal.update({ where: { id: goal.id }, data: { status: 'completed' } });
    }

    // Goal missed (target date passed, rating not reached)
    const daysOverdue = Math.floor((now.getTime() - new Date(goal.targetDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue === 1 && currentRating < goal.targetRating && !(await wasRecentlySent(userId, NotificationType.GOAL_MISSED, goal.id))) {
      const notification = buildNotification(NotificationType.GOAL_MISSED, context);
      await sendPushNotification(userId, notification, NotificationType.GOAL_MISSED, goal.id, { finalRating: currentRating });
      // Mark goal as abandoned
      await prisma.goal.update({ where: { id: goal.id }, data: { status: 'abandoned' } });
    }
  }
}

export async function checkWeeklyProgress(userId: string, username: string) {
  // Send every Monday at noon (checked by cron)
  const today = new Date();
  if (today.getDay() !== 1) return; // Not Monday

  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: 'active' },
  });

  for (const goal of activeGoals) {
    if (await wasRecentlySent(userId, NotificationType.WEEKLY_PROGRESS, goal.gameMode, 6 * 24)) continue;

    const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
    if (!statsResponse.ok) continue;
    const stats: ChessComStats = await statsResponse.json();

    const gameModeKey = GAME_MODE_MAP[goal.gameMode];
    const currentRating = stats[gameModeKey]?.last?.rating || goal.startRating;

    // Get last week's rating from notification log
    const lastWeekLog = await prisma.notificationLog.findFirst({
      where: {
        userId,
        type: NotificationType.WEEKLY_PROGRESS,
        relatedId: goal.gameMode,
      },
      orderBy: { sentAt: 'desc' },
    });

    const lastWeekRating = (lastWeekLog?.metadata as any)?.rating || goal.startRating;
    const ratingChange = currentRating - lastWeekRating;

    const context: NotificationContext = {
      userId,
      username,
      gameMode: goal.gameMode,
      rating: currentRating,
      ratingChange,
    };

    const notification = buildNotification(NotificationType.WEEKLY_PROGRESS, context);
    await sendPushNotification(userId, notification, NotificationType.WEEKLY_PROGRESS, goal.gameMode, { rating: currentRating, ratingChange });
  }
}

// ========== STATS DETECTORS ==========

export async function checkStreaks(userId: string, username: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // Get recent games from Chess.com
  const currentMonth = new Date();
  const archiveUrl = `https://api.chess.com/pub/player/${username}/games/${currentMonth.getFullYear()}/${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const archiveResponse = await fetch(archiveUrl);
  if (!archiveResponse.ok) return;

  const archiveData = await archiveResponse.json();
  const games: ChessComGame[] = archiveData.games || [];

  // Sort by end_time descending (most recent first)
  const sortedGames = games.sort((a, b) => b.end_time - a.end_time);

  // Analyze by game mode
  const gameModes = ['chess_rapid', 'chess_blitz', 'chess_bullet'];

  for (const mode of gameModes) {
    const modeGames = sortedGames.filter((g: any) => g.time_class === mode.replace('chess_', ''));
    if (modeGames.length === 0) continue;

    let currentStreak = 0;
    let isWinStreak = true;
    let isLoseStreak = true;

    for (const game of modeGames) {
      const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
      const result = isWhite ? (game as any).white.result : (game as any).black.result;

      const won = result === 'win';
      const lost = result !== 'win' && result !== 'agreed' && result !== 'repetition' && result !== 'stalemate' && result !== 'insufficient';

      if (currentStreak === 0) {
        currentStreak = 1;
        isWinStreak = won;
        isLoseStreak = lost;
      } else if ((isWinStreak && won) || (isLoseStreak && lost)) {
        currentStreak++;
      } else {
        break;
      }
    }

    const gameMode = mode.replace('chess_', '');

    // Win streak of 5+
    if (isWinStreak && currentStreak >= 5 && !(await wasRecentlySent(userId, NotificationType.WIN_STREAK, gameMode, 24))) {
      const context: NotificationContext = { userId, username, gameMode, streakCount: currentStreak };
      const notification = buildNotification(NotificationType.WIN_STREAK, context);
      await sendPushNotification(userId, notification, NotificationType.WIN_STREAK, gameMode, { streakCount: currentStreak });
    }

    // Lose streak of 5+
    if (isLoseStreak && currentStreak >= 5 && !(await wasRecentlySent(userId, NotificationType.LOSE_STREAK, gameMode, 24))) {
      const context: NotificationContext = { userId, username, gameMode, streakCount: currentStreak };
      const notification = buildNotification(NotificationType.LOSE_STREAK, context);
      await sendPushNotification(userId, notification, NotificationType.LOSE_STREAK, gameMode, { streakCount: currentStreak });
    }
  }
}

export async function checkRatingChanges(userId: string, username: string) {
  const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
  if (!statsResponse.ok) return;
  const stats: ChessComStats = await statsResponse.json();

  const gameModes: Array<{ mode: string; key: keyof ChessComStats }> = [
    { mode: 'daily', key: 'chess_daily' },
    { mode: 'rapid', key: 'chess_rapid' },
    { mode: 'blitz', key: 'chess_blitz' },
    { mode: 'bullet', key: 'chess_bullet' },
  ];

  for (const { mode, key } of gameModes) {
    const modeStats = stats[key];
    if (!modeStats?.last?.rating || !modeStats?.best?.rating) continue;

    const currentRating = modeStats.last.rating;
    const bestRating = modeStats.best.rating;

    // Get last known rating from notification logs
    const lastLog = await prisma.notificationLog.findFirst({
      where: {
        userId,
        relatedId: mode,
        type: { in: [NotificationType.BIG_RATING_GAIN, NotificationType.BIG_RATING_LOSS, NotificationType.NEW_PERSONAL_RECORD] },
      },
      orderBy: { sentAt: 'desc' },
    });

    const lastKnownRating = (lastLog?.metadata as any)?.rating || currentRating;
    const ratingChange = currentRating - lastKnownRating;

    const context: NotificationContext = {
      userId,
      username,
      gameMode: mode,
      rating: currentRating,
      ratingChange: Math.abs(ratingChange),
    };

    // Big rating gain (+50)
    if (ratingChange >= 50 && !(await wasRecentlySent(userId, NotificationType.BIG_RATING_GAIN, mode, 12))) {
      const notification = buildNotification(NotificationType.BIG_RATING_GAIN, context);
      await sendPushNotification(userId, notification, NotificationType.BIG_RATING_GAIN, mode, { rating: currentRating, ratingChange });
    }

    // Big rating loss (-50)
    if (ratingChange <= -50 && !(await wasRecentlySent(userId, NotificationType.BIG_RATING_LOSS, mode, 12))) {
      const notification = buildNotification(NotificationType.BIG_RATING_LOSS, context);
      await sendPushNotification(userId, notification, NotificationType.BIG_RATING_LOSS, mode, { rating: currentRating, ratingChange });
    }

    // New personal record
    if (currentRating > bestRating && !(await wasRecentlySent(userId, NotificationType.NEW_PERSONAL_RECORD, mode, 24))) {
      const notification = buildNotification(NotificationType.NEW_PERSONAL_RECORD, context);
      await sendPushNotification(userId, notification, NotificationType.NEW_PERSONAL_RECORD, mode, { rating: currentRating });
    }

    // Rating milestone (every 100 points)
    const lastMilestone = Math.floor(lastKnownRating / 100) * 100;
    const currentMilestone = Math.floor(currentRating / 100) * 100;
    if (currentMilestone > lastMilestone && currentMilestone >= 1500 && !(await wasRecentlySent(userId, NotificationType.RATING_MILESTONE, `${mode}-${currentMilestone}`, 7 * 24))) {
      context.rating = currentMilestone;
      const notification = buildNotification(NotificationType.RATING_MILESTONE, context);
      await sendPushNotification(userId, notification, NotificationType.RATING_MILESTONE, `${mode}-${currentMilestone}`, { milestone: currentMilestone });
    }

    // Back to top (returned to best rating after drop)
    const wasBelowBest = lastKnownRating < bestRating - 50;
    const nowAtBest = Math.abs(currentRating - bestRating) <= 10;
    if (wasBelowBest && nowAtBest && !(await wasRecentlySent(userId, NotificationType.BACK_TO_TOP, mode, 7 * 24))) {
      const notification = buildNotification(NotificationType.BACK_TO_TOP, context);
      await sendPushNotification(userId, notification, NotificationType.BACK_TO_TOP, mode, { rating: currentRating });
    }
  }
}

export async function checkWinrateImprovement(userId: string, username: string) {
  // This requires analyzing last 20 games vs previous 20 games
  // For simplicity, we'll implement a basic version
  // TODO: Implement full winrate tracking
}

export async function checkInactivity(userId: string, username: string) {
  const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
  if (!statsResponse.ok) return;

  // Get last game timestamp from current month's games
  const currentMonth = new Date();
  const archiveUrl = `https://api.chess.com/pub/player/${username}/games/${currentMonth.getFullYear()}/${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const archiveResponse = await fetch(archiveUrl);
  if (!archiveResponse.ok) return;

  const archiveData = await archiveResponse.json();
  const games: ChessComGame[] = archiveData.games || [];

  if (games.length === 0) return;

  const lastGame = games.sort((a, b) => b.end_time - a.end_time)[0];
  const daysSinceLastGame = Math.floor((Date.now() - lastGame.end_time * 1000) / (1000 * 60 * 60 * 24));

  if (daysSinceLastGame >= 7 && !(await wasRecentlySent(userId, NotificationType.INACTIVITY_REMINDER, undefined, 7 * 24))) {
    // Get user's favorite game mode (most active goal or highest rating)
    const activeGoal = await prisma.goal.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    const gameMode = activeGoal?.gameMode || 'rapid';

    const context: NotificationContext = {
      userId,
      username,
      gameMode,
    };

    const notification = buildNotification(NotificationType.INACTIVITY_REMINDER, context);
    await sendPushNotification(userId, notification, NotificationType.INACTIVITY_REMINDER, undefined, { daysSinceLastGame });
  }
}

// Main function to run all checks
export async function runAllNotificationChecks(userId: string, username: string) {
  console.log(`Running notification checks for user ${username} (${userId})`);

  try {
    await Promise.all([
      checkGoalReminders(userId, username),
      checkGoalProgress(userId, username),
      checkWeeklyProgress(userId, username),
      checkStreaks(userId, username),
      checkRatingChanges(userId, username),
      checkInactivity(userId, username),
    ]);

    console.log(`Completed notification checks for user ${username}`);
  } catch (error) {
    console.error(`Error running notification checks for user ${username}:`, error);
  }
}
