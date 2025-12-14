import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  updateQueueItemRetryCount,
  saveGoal,
  deleteGoalFromCache,
} from '@/lib/db/indexedDB';

const MAX_RETRY_ATTEMPTS = 3;

export class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private syncing = false;

  private constructor() {}

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  async queueOperation(
    operation: 'CREATE_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL',
    data: any,
    goalId?: string
  ) {
    await addToOfflineQueue(operation, data, goalId);

    // Try to sync immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncQueue();
    }
  }

  async syncQueue() {
    if (this.syncing) return;

    this.syncing = true;

    try {
      const queue = await getOfflineQueue();

      for (const item of queue) {
        if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Mark as failed, don't retry
          await updateQueueItemRetryCount(
            item.id!,
            item.retryCount,
            'Max retry attempts reached'
          );
          continue;
        }

        try {
          await this.processQueueItem(item);
          // Success - remove from queue
          await removeFromOfflineQueue(item.id!);
        } catch (error) {
          // Failed - update retry count
          await updateQueueItemRetryCount(
            item.id!,
            item.retryCount + 1,
            (error as Error).message
          );
        }
      }
    } finally {
      this.syncing = false;
    }
  }

  private async processQueueItem(item: any) {
    switch (item.operation) {
      case 'CREATE_GOAL':
        return this.syncCreateGoal(item);
      case 'UPDATE_GOAL':
        return this.syncUpdateGoal(item);
      case 'DELETE_GOAL':
        return this.syncDeleteGoal(item);
    }
  }

  private async syncCreateGoal(item: any) {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync goal: ${response.statusText}`);
    }

    const serverGoal = await response.json();

    // Update local cache with server-generated ID and data
    await saveGoal({
      ...serverGoal,
      syncStatus: 'synced',
    });

    // If we had a temporary local ID, we should clean it up
    if (item.data.localId) {
      await deleteGoalFromCache(item.data.localId);
    }

    return serverGoal;
  }

  private async syncUpdateGoal(item: any) {
    const response = await fetch(`/api/goals/${item.goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync goal update: ${response.statusText}`);
    }

    const serverGoal = await response.json();

    await saveGoal({
      ...serverGoal,
      syncStatus: 'synced',
    });

    return serverGoal;
  }

  private async syncDeleteGoal(item: any) {
    const response = await fetch(`/api/goals/${item.goalId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to sync goal deletion: ${response.statusText}`);
    }

    await deleteGoalFromCache(item.goalId!);
  }

  // Register Background Sync (if supported)
  async registerBackgroundSync() {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'sync' in (self as any).registration
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-goals');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
}

export const offlineQueueManager = OfflineQueueManager.getInstance();
