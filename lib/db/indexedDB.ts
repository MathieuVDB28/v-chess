import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VChessDB extends DBSchema {
  playerStats: {
    key: string;
    value: {
      username: string;
      platform: 'chesscom' | 'lichess';
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-platform': string;
      'by-lastUpdated': number;
    };
  };
  gameArchives: {
    key: string;
    value: {
      username: string;
      platform: 'chesscom' | 'lichess';
      archiveUrl: string;
      yearMonth: string;
      games: any[];
      lastUpdated: number;
    };
    indexes: {
      'by-username': string;
      'by-yearMonth': string;
    };
  };
  goals: {
    key: string;
    value: {
      id: string;
      userId: string;
      gameMode: string;
      startRating: number;
      targetRating: number;
      targetDate: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'failed';
      localOnly?: boolean;
    };
    indexes: {
      'by-userId': string;
      'by-status': string;
      'by-syncStatus': string;
    };
  };
  offlineQueue: {
    key: number;
    value: {
      id?: number;
      operation: 'CREATE_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL';
      goalId?: string;
      data: any;
      timestamp: number;
      retryCount: number;
      lastAttempt?: number;
      error?: string;
    };
    indexes: {
      'by-operation': string;
      'by-timestamp': number;
    };
  };
  cacheMetadata: {
    key: string;
    value: {
      cacheKey: string;
      timestamp: number;
      expiresAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<VChessDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<VChessDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<VChessDB>('v-chess-db', 1, {
    upgrade(db) {
      // Player Stats
      if (!db.objectStoreNames.contains('playerStats')) {
        const statsStore = db.createObjectStore('playerStats', {
          keyPath: 'username',
        });
        statsStore.createIndex('by-platform', 'platform');
        statsStore.createIndex('by-lastUpdated', 'lastUpdated');
      }

      // Game Archives
      if (!db.objectStoreNames.contains('gameArchives')) {
        const archiveStore = db.createObjectStore('gameArchives', {
          keyPath: 'archiveUrl',
        });
        archiveStore.createIndex('by-username', 'username');
        archiveStore.createIndex('by-yearMonth', 'yearMonth');
      }

      // Goals
      if (!db.objectStoreNames.contains('goals')) {
        const goalsStore = db.createObjectStore('goals', {
          keyPath: 'id',
        });
        goalsStore.createIndex('by-userId', 'userId');
        goalsStore.createIndex('by-status', 'status');
        goalsStore.createIndex('by-syncStatus', 'syncStatus');
      }

      // Offline Queue
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('by-operation', 'operation');
        queueStore.createIndex('by-timestamp', 'timestamp');
      }

      // Cache Metadata
      if (!db.objectStoreNames.contains('cacheMetadata')) {
        db.createObjectStore('cacheMetadata', { keyPath: 'cacheKey' });
      }
    },
  });

  return dbInstance;
}

// Helper functions for common operations

export async function cachePlayerStats(
  username: string,
  platform: 'chesscom' | 'lichess',
  data: any
) {
  const db = await getDB();
  await db.put('playerStats', {
    username: `${username}-${platform}`,
    platform,
    data,
    lastUpdated: Date.now(),
  });
}

export async function getCachedPlayerStats(
  username: string,
  platform: 'chesscom' | 'lichess'
) {
  const db = await getDB();
  return db.get('playerStats', `${username}-${platform}`);
}

export async function cacheGameArchive(
  username: string,
  archiveUrl: string,
  games: any[],
  yearMonth: string
) {
  const db = await getDB();
  await db.put('gameArchives', {
    username,
    platform: 'chesscom',
    archiveUrl,
    yearMonth,
    games,
    lastUpdated: Date.now(),
  });
}

export async function getCachedGameArchives(username: string) {
  const db = await getDB();
  const tx = db.transaction('gameArchives', 'readonly');
  const index = tx.store.index('by-username');
  return index.getAll(username);
}

export async function getAllGoals(userId: string) {
  const db = await getDB();
  const tx = db.transaction('goals', 'readonly');
  const index = tx.store.index('by-userId');
  return index.getAll(userId);
}

export async function saveGoal(goal: any) {
  const db = await getDB();
  await db.put('goals', {
    ...goal,
    syncStatus: goal.syncStatus || 'synced',
  });
}

export async function deleteGoalFromCache(goalId: string) {
  const db = await getDB();
  await db.delete('goals', goalId);
}

export async function addToOfflineQueue(
  operation: 'CREATE_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL',
  data: any,
  goalId?: string
) {
  const db = await getDB();
  await db.add('offlineQueue', {
    operation,
    goalId,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

export async function getOfflineQueue() {
  const db = await getDB();
  return db.getAll('offlineQueue');
}

export async function removeFromOfflineQueue(id: number) {
  const db = await getDB();
  await db.delete('offlineQueue', id);
}

export async function updateQueueItemRetryCount(
  id: number,
  retryCount: number,
  error?: string
) {
  const db = await getDB();
  const item = await db.get('offlineQueue', id);
  if (item) {
    await db.put('offlineQueue', {
      ...item,
      id,
      retryCount,
      lastAttempt: Date.now(),
      error,
    });
  }
}
