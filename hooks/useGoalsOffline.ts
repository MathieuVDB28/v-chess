'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAllGoals, saveGoal, deleteGoalFromCache } from '@/lib/db/indexedDB';
import { offlineQueueManager } from '@/lib/sync/offlineQueueManager';

export interface Goal {
  id: string;
  userId: string;
  gameMode: string;
  startRating: number;
  targetRating: number;
  targetDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  localOnly?: boolean;
}

export function useGoalsOffline() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load goals from IndexedDB first, then sync with server
  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    async function loadGoals() {
      const userEmail = session?.user?.email;
      if (!userEmail) return;

      try {
        // Load from IndexedDB immediately
        const cachedGoals = await getAllGoals(userEmail);
        setGoals(cachedGoals);
        setLoading(false);

        // Then fetch from server for updates
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          try {
            const response = await fetch('/api/goals');
            if (response.ok) {
              const serverGoals = await response.json();

              // Merge server goals with local goals
              const mergedGoals = mergeGoals(cachedGoals, serverGoals);
              setGoals(mergedGoals);

              // Update cache
              for (const goal of serverGoals) {
                await saveGoal({ ...goal, syncStatus: 'synced' });
              }

              // Trigger sync of offline queue
              offlineQueueManager.syncQueue();
            }
          } catch (networkError) {
            // Network failed, but we have cached data, so it's okay
            console.warn('Failed to fetch goals from server:', networkError);
          }
        }
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    loadGoals();
  }, [session]);

  const createGoal = async (
    goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const newGoal: Goal = {
      id: tempId,
      userId: session?.user?.email || '',
      ...goalData,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      localOnly: true,
    };

    // Optimistic update
    setGoals((prev) => [newGoal, ...prev]);

    // Save to IndexedDB
    await saveGoal(newGoal);

    // Queue for sync
    await offlineQueueManager.queueOperation('CREATE_GOAL', {
      ...goalData,
      localId: tempId,
    });

    return newGoal;
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              ...updates,
              syncStatus: 'pending' as const,
              updatedAt: new Date().toISOString(),
            }
          : g
      )
    );

    const updatedGoal = goals.find((g) => g.id === goalId);
    if (updatedGoal) {
      await saveGoal({ ...updatedGoal, ...updates, syncStatus: 'pending' });
    }

    // Queue for sync
    await offlineQueueManager.queueOperation('UPDATE_GOAL', updates, goalId);
  };

  const deleteGoal = async (goalId: string) => {
    // Optimistic update
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    // Queue for sync
    await offlineQueueManager.queueOperation('DELETE_GOAL', {}, goalId);

    // Remove from cache after queuing
    await deleteGoalFromCache(goalId);
  };

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}

function mergeGoals(cachedGoals: Goal[], serverGoals: Goal[]): Goal[] {
  const merged = new Map<string, Goal>();

  // Add all server goals (they're the source of truth for synced data)
  serverGoals.forEach((goal) => {
    merged.set(goal.id, { ...goal, syncStatus: 'synced' });
  });

  // Add local-only goals and pending updates
  cachedGoals.forEach((goal) => {
    if (goal.localOnly || goal.syncStatus === 'pending') {
      merged.set(goal.id, goal);
    }
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
