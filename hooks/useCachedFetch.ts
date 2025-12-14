'use client';

import { useState, useEffect } from 'react';
import { getCachedPlayerStats, cachePlayerStats } from '@/lib/db/indexedDB';

interface UseCachedFetchOptions {
  cacheMaxAge?: number; // milliseconds
  platform?: 'chesscom' | 'lichess';
}

export function useCachedFetch<T>(
  url: string | null,
  username?: string,
  options: UseCachedFetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const { cacheMaxAge = 1000 * 60 * 60 * 24, platform = 'chesscom' } = options;

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Try cache first
        if (username) {
          const cached = await getCachedPlayerStats(username, platform);
          if (cached && Date.now() - cached.lastUpdated < cacheMaxAge) {
            if (!isCancelled) {
              setData(cached.data as T);
              setFromCache(true);
              setLoading(false);
            }
            // Still fetch in background for freshness
            fetchFresh();
            return;
          }
        }

        // Fetch fresh data
        await fetchFresh();
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    async function fetchFresh() {
      if (!url) return;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const freshData = await response.json();

        if (!isCancelled) {
          setData(freshData);
          setFromCache(false);
          setLoading(false);

          // Cache the fresh data
          if (username) {
            await cachePlayerStats(username, platform, freshData);
          }
        }
      } catch (err) {
        // If network fails and we have no cached data, show error
        if (!isCancelled && !data) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [url, username, platform, cacheMaxAge]);

  return { data, loading, error, fromCache };
}
