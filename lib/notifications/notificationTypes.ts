export enum NotificationType {
  // Goals notifications
  GOAL_REMINDER_7_DAYS = 'GOAL_REMINDER_7_DAYS',
  GOAL_REMINDER_3_DAYS = 'GOAL_REMINDER_3_DAYS',
  GOAL_REMINDER_TODAY = 'GOAL_REMINDER_TODAY',
  GOAL_BEHIND_SCHEDULE = 'GOAL_BEHIND_SCHEDULE',
  GOAL_AHEAD_SCHEDULE = 'GOAL_AHEAD_SCHEDULE',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_MISSED = 'GOAL_MISSED',
  WEEKLY_PROGRESS = 'WEEKLY_PROGRESS',

  // Stats notifications
  WIN_STREAK = 'WIN_STREAK',
  LOSE_STREAK = 'LOSE_STREAK',
  BIG_RATING_GAIN = 'BIG_RATING_GAIN',
  BIG_RATING_LOSS = 'BIG_RATING_LOSS',
  NEW_PERSONAL_RECORD = 'NEW_PERSONAL_RECORD',
  RATING_MILESTONE = 'RATING_MILESTONE',
  BACK_TO_TOP = 'BACK_TO_TOP',
  WINRATE_IMPROVEMENT = 'WINRATE_IMPROVEMENT',
  INACTIVITY_REMINDER = 'INACTIVITY_REMINDER',
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
}

export interface NotificationContext {
  userId: string;
  username: string;
  gameMode?: string;
  rating?: number;
  targetRating?: number;
  goalId?: string;
  streakCount?: number;
  ratingChange?: number;
  winrate?: number;
  daysRemaining?: number;
  progressPercent?: number;
}

export function buildNotification(
  type: NotificationType,
  context: NotificationContext
): NotificationData {
  const { username, gameMode, rating, targetRating, streakCount, ratingChange, goalId, daysRemaining, progressPercent, winrate } = context;

  const notificationMap: Record<NotificationType, NotificationData> = {
    // Goals
    [NotificationType.GOAL_REMINDER_7_DAYS]: {
      title: '⏰ Rappel d\'objectif - 7 jours',
      body: `Il reste 7 jours pour atteindre ${targetRating} en ${gameMode}. Vous êtes à ${rating} (${progressPercent}%)`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-reminder-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.GOAL_REMINDER_3_DAYS]: {
      title: '⏰ Rappel d\'objectif - 3 jours',
      body: `Plus que 3 jours pour atteindre ${targetRating} en ${gameMode}. Rating actuel : ${rating}`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-reminder-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.GOAL_REMINDER_TODAY]: {
      title: '⏰ Rappel d\'objectif - Aujourd\'hui !',
      body: `C'est le jour J ! Objectif ${targetRating} en ${gameMode}. Vous êtes à ${rating}`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-reminder-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.GOAL_BEHIND_SCHEDULE]: {
      title: '📉 Retard sur objectif',
      body: `Vous êtes en retard sur votre objectif ${gameMode}. ${progressPercent}% à mi-parcours`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-behind-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.GOAL_AHEAD_SCHEDULE]: {
      title: '🚀 En avance sur objectif !',
      body: `Bravo ! Vous avez déjà atteint ${progressPercent}% de votre objectif ${gameMode} en ${targetRating}`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-ahead-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.GOAL_ACHIEVED]: {
      title: '🎉 Objectif atteint !',
      body: `Félicitations ! Vous avez atteint ${targetRating} en ${gameMode} !`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-achieved-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.GOAL_MISSED]: {
      title: '⏱️ Objectif manqué',
      body: `La date cible pour atteindre ${targetRating} en ${gameMode} est dépassée. Nouveau défi ?`,
      icon: '/icons/icon-192x192.png',
      tag: `goal-missed-${goalId}`,
      data: { url: `/chesscom/user/${username}/goals`, goalId },
    },

    [NotificationType.WEEKLY_PROGRESS]: {
      title: '📊 Progression hebdomadaire',
      body: `Résumé de la semaine en ${gameMode} : ${rating} (+${ratingChange || 0} pts). Continue !`,
      icon: '/icons/icon-192x192.png',
      tag: `weekly-progress-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    // Stats
    [NotificationType.WIN_STREAK]: {
      title: `🔥 Série de ${streakCount} victoires !`,
      body: `Impressionnant ! ${streakCount} victoires d'affilée en ${gameMode}. Continue comme ça !`,
      icon: '/icons/icon-192x192.png',
      tag: `win-streak-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.LOSE_STREAK]: {
      title: `😞 Série de ${streakCount} défaites`,
      body: `${streakCount} défaites d'affilée en ${gameMode}. Prends une pause, tu vas rebondir !`,
      icon: '/icons/icon-192x192.png',
      tag: `lose-streak-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.BIG_RATING_GAIN]: {
      title: '📈 Gros gain d\'ELO !',
      body: `+${ratingChange} points en ${gameMode} ! Tu es maintenant à ${rating}`,
      icon: '/icons/icon-192x192.png',
      tag: `rating-gain-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.BIG_RATING_LOSS]: {
      title: '📉 Grosse perte d\'ELO',
      body: `${ratingChange} points en ${gameMode}. Rating actuel : ${rating}. Ne lâche rien !`,
      icon: '/icons/icon-192x192.png',
      tag: `rating-loss-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.NEW_PERSONAL_RECORD]: {
      title: '🏆 Nouveau record personnel !',
      body: `Bravo ! ${rating} en ${gameMode}, ton meilleur score ever !`,
      icon: '/icons/icon-192x192.png',
      tag: `personal-record-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.RATING_MILESTONE]: {
      title: '🎯 Palier atteint !',
      body: `Tu viens de franchir les ${rating} en ${gameMode} ! Félicitations !`,
      icon: '/icons/icon-192x192.png',
      tag: `milestone-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.BACK_TO_TOP]: {
      title: '↗️ Retour au sommet !',
      body: `Tu as retrouvé ton meilleur rating en ${gameMode} : ${rating} !`,
      icon: '/icons/icon-192x192.png',
      tag: `back-to-top-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.WINRATE_IMPROVEMENT]: {
      title: '📊 Winrate en hausse !',
      body: `+${winrate}% de winrate sur les 20 dernières parties en ${gameMode}`,
      icon: '/icons/icon-192x192.png',
      tag: `winrate-${gameMode}`,
      data: { url: `/chesscom/user/${username}/stats` },
    },

    [NotificationType.INACTIVITY_REMINDER]: {
      title: '♟️ Ça fait longtemps !',
      body: `Pas de parties depuis 7 jours. Une petite partie en ${gameMode} ?`,
      icon: '/icons/icon-192x192.png',
      tag: 'inactivity',
      data: { url: `/chesscom/user/${username}/stats` },
    },
  };

  return notificationMap[type];
}
