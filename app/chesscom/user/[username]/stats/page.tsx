'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceDot,
} from 'recharts';
import {
  GraphUp,
  GraphDown,
  Star,
  Calendar,
  Download,
  NavArrowLeft,
  StatsReport,
  Trophy,
  Clock,
  Home,
  Percentage,
  StarSolid,
  HalfMoon,
  SunLight,
} from 'iconoir-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Set French locale for dayjs
dayjs.locale('fr');

// Types
interface Game {
  end_time: number;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
  time_class: string;
  url: string;
  rules: string;
  pgn?: string;
  eco?: string;
}

interface OpeningStats {
  name: string;
  count: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

interface RatingPoint {
  date: number;
  rating: number;
  timeClass: string;
  result: string;
  isWhite: boolean;
}

interface Stats {
  currentRating: number;
  bestRating: number;
  progression: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  longestWinStreak: number;
  longestLossStreak: number;
  bestDay: { date: string; change: number };
  worstDay: { date: string; change: number };
  whiteWinRate: number;
  blackWinRate: number;
  whiteGames: number;
  blackGames: number;
}

interface Milestone {
  rating: number;
  date: number;
  label: string;
}

type TimeFilter = '7d' | '1m' | '3m' | '6m' | '1y' | 'all';
type GameMode = 'bullet' | 'blitz' | 'rapid' | 'daily';

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '1m', label: '1 mois' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

const GAME_MODES: { value: GameMode; label: string; color: string }[] = [
  { value: 'bullet', label: 'Bullet', color: '#ef4444' },
  { value: 'blitz', label: 'Blitz', color: '#f59e0b' },
  { value: 'rapid', label: 'Rapid', color: '#3b82f6' },
  { value: 'daily', label: 'Daily', color: '#8b5cf6' },
];

const CHART_COLORS = {
  win: '#47C47E',
  loss: '#ef4444',
  draw: '#f59e0b',
  white: '#e5e7eb',
  black: '#374151',
};

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const { data: session } = useSession();

  // Use cached fetch for player stats
  const {
    data: playerStats,
    loading: statsLoading,
    error: statsError,
    fromCache
  } = useCachedFetch<any>(
    username ? `https://api.chess.com/pub/player/${username}/stats` : null,
    username,
    { platform: 'chesscom', cacheMaxAge: 1000 * 60 * 60 * 24 } // 24 hours
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingPoint[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('3m');
  const [gameModeFilter, setGameModeFilter] = useState<GameMode>('blitz');
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  // Check if viewing own stats
  const isOwnStats =
    session?.user?.chesscom_username?.toLowerCase() === username?.toLowerCase();
  const progressionMessage = isOwnStats
    ? 'Analyse complète de ta progression'
    : `Analyse complète de la progression de ${username}`;

  // Set default game mode when stats load
  useEffect(() => {
    if (playerStats) {
      const modes = [
        { mode: 'bullet' as GameMode, rating: playerStats.chess_bullet?.last?.rating || 0 },
        { mode: 'blitz' as GameMode, rating: playerStats.chess_blitz?.last?.rating || 0 },
        { mode: 'rapid' as GameMode, rating: playerStats.chess_rapid?.last?.rating || 0 },
        { mode: 'daily' as GameMode, rating: playerStats.chess_daily?.last?.rating || 0 },
      ];
      const bestMode = modes.reduce((best, current) =>
        current.rating > best.rating ? current : best
      );
      setGameModeFilter(bestMode.mode);
    }
  }, [playerStats]);

  // Fetch rating history from game archives
  useEffect(() => {
    const fetchRatingHistory = async () => {
      if (!username || !playerStats) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch game archives
        const archivesResponse = await fetch(
          `https://api.chess.com/pub/player/${username}/games/archives`
        );
        if (!archivesResponse.ok) throw new Error('Failed to fetch archives');
        const archivesData = await archivesResponse.json();

        const allRatingPoints: RatingPoint[] = [];
        const allGamesData: Game[] = [];

        // Fetch ALL games archives for complete history
        const allArchives = archivesData.archives;

        for (const archiveUrl of allArchives) {
          const gamesResponse = await fetch(archiveUrl);
          if (!gamesResponse.ok) continue;
          const gamesData = await gamesResponse.json();

          gamesData.games.forEach((game: Game) => {
            const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
            const player = isWhite ? game.white : game.black;
            const result = player.result;

            allRatingPoints.push({
              date: game.end_time * 1000,
              rating: player.rating,
              timeClass: game.time_class,
              result,
              isWhite,
            });

            // Store complete game data
            allGamesData.push(game);
          });
        }

        // Sort by date
        allRatingPoints.sort((a, b) => a.date - b.date);
        setRatingHistory(allRatingPoints);
        setAllGames(allGamesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRatingHistory();
  }, [username, playerStats]);

  // Filter data based on time and game mode
  const filteredData = useMemo(() => {
    let filtered = ratingHistory.filter((point) => point.timeClass === gameModeFilter);

    // Filter by time
    if (timeFilter !== 'all') {
      const now = Date.now();
      const filterMap: Record<TimeFilter, number> = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '1m': 30 * 24 * 60 * 60 * 1000,
        '3m': 90 * 24 * 60 * 60 * 1000,
        '6m': 180 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
        'all': Infinity,
      };
      const cutoff = now - filterMap[timeFilter];
      filtered = filtered.filter((point) => point.date >= cutoff);
    }

    return filtered;
  }, [ratingHistory, timeFilter, gameModeFilter]);

  // Calculate statistics
  const stats: Stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        currentRating: 0,
        bestRating: 0,
        progression: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        bestDay: { date: '', change: 0 },
        worstDay: { date: '', change: 0 },
        whiteWinRate: 0,
        blackWinRate: 0,
        whiteGames: 0,
        blackGames: 0,
      };
    }

    const currentRating = filteredData[filteredData.length - 1].rating;
    const bestRating = Math.max(...filteredData.map((p) => p.rating));
    const startRating = filteredData[0].rating;
    const progression = currentRating - startRating;

    const wins = filteredData.filter((p) => p.result === 'win').length;
    const losses = filteredData.filter(
      (p) => p.result === 'checkmated' || p.result === 'timeout' || p.result === 'resigned'
    ).length;
    const draws = filteredData.filter(
      (p) =>
        p.result === 'agreed' ||
        p.result === 'stalemate' ||
        p.result === 'repetition' ||
        p.result === 'insufficient'
    ).length;
    const totalGames = filteredData.length;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    // White vs Black stats
    const whiteGames = filteredData.filter((p) => p.isWhite);
    const blackGames = filteredData.filter((p) => !p.isWhite);
    const whiteWins = whiteGames.filter((p) => p.result === 'win').length;
    const blackWins = blackGames.filter((p) => p.result === 'win').length;
    const whiteWinRate = whiteGames.length > 0 ? (whiteWins / whiteGames.length) * 100 : 0;
    const blackWinRate = blackGames.length > 0 ? (blackWins / blackGames.length) * 100 : 0;

    // Calculate streaks
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    let currentLossStreak = 0;
    let longestLossStreak = 0;

    filteredData.forEach((point) => {
      if (point.result === 'win') {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else if (
        point.result === 'checkmated' ||
        point.result === 'timeout' ||
        point.result === 'resigned'
      ) {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });

    // Calculate best and worst days
    const dailyChanges: { [key: string]: number } = {};
    filteredData.forEach((point, index) => {
      if (index === 0) return;
      const date = dayjs(point.date).format('YYYY-MM-DD');
      const change = point.rating - filteredData[index - 1].rating;
      dailyChanges[date] = (dailyChanges[date] || 0) + change;
    });

    const days = Object.entries(dailyChanges);
    const bestDay = days.reduce(
      (best, [date, change]) => (change > best.change ? { date, change } : best),
      { date: '', change: -Infinity }
    );
    const worstDay = days.reduce(
      (worst, [date, change]) => (change < worst.change ? { date, change } : worst),
      { date: '', change: Infinity }
    );

    return {
      currentRating,
      bestRating,
      progression,
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      longestWinStreak,
      longestLossStreak,
      bestDay: bestDay.change === -Infinity ? { date: '', change: 0 } : bestDay,
      worstDay: worstDay.change === Infinity ? { date: '', change: 0 } : worstDay,
      whiteWinRate,
      blackWinRate,
      whiteGames: whiteGames.length,
      blackGames: blackGames.length,
    };
  }, [filteredData]);

  // Calculate milestones - Based on ALL data for the current game mode, not filtered by time
  const milestones: Milestone[] = useMemo(() => {
    const milestoneRatings = [500, 800, 1000, 1200, 1400, 1500, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
    const found: Milestone[] = [];
    const seenRatings = new Set<number>();

    // Filter by game mode only, not by time period
    const gameModeData = ratingHistory.filter((point) => point.timeClass === gameModeFilter);

    gameModeData.forEach((point) => {
      milestoneRatings.forEach((milestone) => {
        if (point.rating >= milestone && !seenRatings.has(milestone)) {
          seenRatings.add(milestone);
          found.push({
            rating: milestone,
            date: point.date,
            label: `${milestone}`,
          });
        }
      });
    });

    return found;
  }, [ratingHistory, gameModeFilter]);

  // Prepare chart data with prediction
  const lineChartData = useMemo(() => {
    const data = filteredData.map((point) => ({
      date: dayjs(point.date).format('DD/MM/YY'),
      timestamp: point.date,
      rating: point.rating,
      fullDate: dayjs(point.date).format('DD MMM YYYY HH:mm'),
    }));

    // Calculate linear regression for prediction
    if (data.length >= 30) {
      const last30Days = data.slice(-30);
      const n = last30Days.length;
      const sumX = last30Days.reduce((sum, _, i) => sum + i, 0);
      const sumY = last30Days.reduce((sum, d) => sum + d.rating, 0);
      const sumXY = last30Days.reduce((sum, d, i) => sum + i * d.rating, 0);
      const sumXX = last30Days.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Add 7 days of prediction
      const lastTimestamp = data[data.length - 1].timestamp;
      const dayMs = 24 * 60 * 60 * 1000;

      for (let i = 1; i <= 7; i++) {
        const futureTimestamp = lastTimestamp + i * dayMs;
        const predictedRating = Math.round(intercept + slope * (n + i - 1));
        data.push({
          date: dayjs(futureTimestamp).format('DD/MM/YY'),
          timestamp: futureTimestamp,
          rating: NaN, // Don't show actual line
          prediction: predictedRating,
          fullDate: dayjs(futureTimestamp).format('DD MMM YYYY'),
        } as any);
      }
    }

    return data;
  }, [filteredData]);

  const pieChartData = [
    { name: 'Victoires', value: stats.wins, color: CHART_COLORS.win },
    { name: 'Défaites', value: stats.losses, color: CHART_COLORS.loss },
    { name: 'Nulles', value: stats.draws, color: CHART_COLORS.draw },
  ];

  // Performance by week
  const performanceByWeek = useMemo(() => {
    const weeks: { [key: string]: { wins: number; losses: number; draws: number } } = {};

    filteredData.forEach((point) => {
      const week = dayjs(point.date).startOf('week').format('DD/MM');
      if (!weeks[week]) {
        weeks[week] = { wins: 0, losses: 0, draws: 0 };
      }

      if (point.result === 'win') weeks[week].wins++;
      else if (
        point.result === 'checkmated' ||
        point.result === 'timeout' ||
        point.result === 'resigned'
      )
        weeks[week].losses++;
      else weeks[week].draws++;
    });

    return Object.entries(weeks).map(([week, data]) => ({
      week,
      ...data,
      winRate: ((data.wins / (data.wins + data.losses + data.draws)) * 100).toFixed(1),
    }));
  }, [filteredData]);

  // Radar chart for game modes
  const radarData = useMemo(() => {
    if (!playerStats) return [];

    const modes = [
      { name: 'Bullet', rating: playerStats.chess_bullet?.last?.rating || 0 },
      { name: 'Blitz', rating: playerStats.chess_blitz?.last?.rating || 0 },
      { name: 'Rapid', rating: playerStats.chess_rapid?.last?.rating || 0 },
      { name: 'Daily', rating: playerStats.chess_daily?.last?.rating || 0 },
    ];

    return modes.filter((mode) => mode.rating > 0);
  }, [playerStats]);

  // Win rate by game mode
  const winRateByMode = useMemo(() => {
    const modeData: { [key: string]: { wins: number; total: number } } = {};

    ratingHistory.forEach((point) => {
      if (!modeData[point.timeClass]) {
        modeData[point.timeClass] = { wins: 0, total: 0 };
      }
      modeData[point.timeClass].total++;
      if (point.result === 'win') {
        modeData[point.timeClass].wins++;
      }
    });

    return Object.entries(modeData).map(([mode, data]) => ({
      mode: mode.charAt(0).toUpperCase() + mode.slice(1),
      winRate: ((data.wins / data.total) * 100).toFixed(1),
      total: data.total,
    }));
  }, [ratingHistory]);

  // Preferred playing hours
  const hourlyStats = useMemo(() => {
    const hours: { [key: number]: number } = {};

    filteredData.forEach((point) => {
      const hour = dayjs(point.date).hour();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      games: hours[i] || 0,
    }));
  }, [filteredData]);

  // Extract opening name from PGN
  const extractOpeningFromPGN = (pgn: string): string => {
    if (!pgn) return 'Inconnu';

    // Try to extract ECOUrl which contains the opening name
    const ecoUrlMatch = pgn.match(/\[ECOUrl\s+"https:\/\/www\.chess\.com\/openings\/([^"]+)"\]/);
    if (ecoUrlMatch && ecoUrlMatch[1]) {
      // Convert URL format to readable name: "Italian-Game-Two-Knights-Defense" -> "Italian Game: Two Knights Defense"
      return ecoUrlMatch[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/(\w+\s\w+)\s(\w+.*)/g, '$1: $2')
        .slice(0, 50); // Limit length
    }

    // Fallback: try to extract ECO code
    const ecoMatch = pgn.match(/\[ECO\s+"([^"]+)"\]/);
    if (ecoMatch && ecoMatch[1]) {
      return ecoMatch[1];
    }

    return 'Autre';
  };

  // Calculate opening statistics
  const openingStats: OpeningStats[] = useMemo(() => {
    const openingsMap: { [key: string]: OpeningStats } = {};

    // Filter games by current game mode and time period
    const relevantGames = allGames.filter((game) => {
      const gameDate = game.end_time * 1000;
      const isRightMode = game.time_class === gameModeFilter;

      if (!isRightMode) return false;

      // Apply time filter
      if (timeFilter !== 'all') {
        const now = Date.now();
        const filterMap: Record<TimeFilter, number> = {
          '7d': 7 * 24 * 60 * 60 * 1000,
          '1m': 30 * 24 * 60 * 60 * 1000,
          '3m': 90 * 24 * 60 * 60 * 1000,
          '6m': 180 * 24 * 60 * 60 * 1000,
          '1y': 365 * 24 * 60 * 60 * 1000,
          'all': Infinity,
        };
        const cutoff = now - filterMap[timeFilter];
        if (gameDate < cutoff) return false;
      }

      return true;
    });

    relevantGames.forEach((game) => {
      const openingName = extractOpeningFromPGN(game.pgn || '');
      const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
      const player = isWhite ? game.white : game.black;
      const result = player.result;

      if (!openingsMap[openingName]) {
        openingsMap[openingName] = {
          name: openingName,
          count: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
        };
      }

      openingsMap[openingName].count++;

      if (result === 'win') {
        openingsMap[openingName].wins++;
      } else if (
        result === 'checkmated' ||
        result === 'timeout' ||
        result === 'resigned'
      ) {
        openingsMap[openingName].losses++;
      } else {
        openingsMap[openingName].draws++;
      }
    });

    // Calculate win rates and sort by count
    const openingsArray = Object.values(openingsMap).map((opening) => ({
      ...opening,
      winRate: opening.count > 0 ? (opening.wins / opening.count) * 100 : 0,
    }));

    return openingsArray.sort((a, b) => b.count - a.count).slice(0, 10); // Top 10
  }, [allGames, gameModeFilter, timeFilter, username]);

  // Export data function
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Rating', 'Mode', 'Result', 'Couleur'],
      ...filteredData.map((point) => [
        dayjs(point.date).format('YYYY-MM-DD HH:mm:ss'),
        point.rating,
        point.timeClass,
        point.result,
        point.isWhite ? 'Blanc' : 'Noir',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}_stats_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erreur: {error}</p>
          <button
            onClick={() => router.push(`/chesscom/user/${username}`)}
            className="bg-primary text-background px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-primary/10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <StatsReport className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Statistiques détaillées</h1>
          </div>
          <p className="text-foreground/60">{progressionMessage}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Current Rating */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm">Rating Actuel</span>
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.currentRating}</span>
              <div
                className={`flex items-center gap-1 text-sm mb-1 ${
                  stats.progression >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {stats.progression >= 0 ? (
                  <GraphUp className="w-4 h-4" />
                ) : (
                  <GraphDown className="w-4 h-4" />
                )}
                <span>
                  {stats.progression > 0 ? '+' : ''}
                  {stats.progression}
                </span>
              </div>
            </div>
          </div>

          {/* Best Rating */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm">Meilleur Rating</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.bestRating}</span>
              <StarSolid className="w-6 h-6 text-yellow-500 mb-1" />
            </div>
          </div>

          {/* Total Games */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm">Parties Jouées</span>
              <StatsReport className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">{stats.totalGames}</div>
            <div className="text-sm text-foreground/60 mt-1">
              {stats.wins}V - {stats.losses}D - {stats.draws}N
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm">Taux de Victoire</span>
              <Percentage className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</div>
            <div className="mt-2 h-2 bg-background/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Filter */}
            <div>
              <label className="text-sm text-foreground/60 mb-2 block">Période</label>
              <div className="flex flex-wrap gap-2">
                {TIME_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeFilter === filter.value
                        ? 'bg-primary text-background'
                        : 'bg-background/50 text-foreground/60 hover:bg-background hover:text-foreground'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Mode Filter */}
            <div>
              <label className="text-sm text-foreground/60 mb-2 block">Mode de jeu</label>
              <div className="flex flex-wrap gap-2">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setGameModeFilter(mode.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      gameModeFilter === mode.value
                        ? 'bg-primary text-background'
                        : 'bg-background/50 text-foreground/60 hover:bg-background hover:text-foreground'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Exporter les données</span>
            </button>
          </div>
        </div>

        {/* Main Chart - Rating Evolution with Prediction */}
        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Évolution du Rating</h2>
            {milestones.length > 0 && (
              <button
                onClick={() => setShowMilestonesModal(true)}
                className="flex items-center gap-2 text-sm text-foreground/60 hover:text-primary transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg cursor-pointer"
              >
                <StarSolid className="w-4 h-4 text-yellow-500" />
                <span>{milestones.length} jalons atteints</span>
              </button>
            )}
          </div>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData}>
                <defs>
                  <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#47C47E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#47C47E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff60' }}
                  tickLine={{ stroke: '#ffffff20' }}
                />
                <YAxis
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff60' }}
                  tickLine={{ stroke: '#ffffff20' }}
                  domain={['dataMin - 50', 'dataMax + 50']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #47C47E30',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#47C47E' }}
                />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke="#47C47E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRating)"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="prediction"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                {milestones.map((milestone) => {
                  const dataPoint = lineChartData.find(
                    (d) => d.timestamp && Math.abs(d.timestamp - milestone.date) < 86400000
                  );
                  if (dataPoint) {
                    return (
                      <ReferenceDot
                        key={milestone.rating}
                        x={dataPoint.date}
                        y={milestone.rating}
                        r={6}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Distribution Chart */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Distribution des Résultats
            </h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #47C47E30',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance by Week */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Performance Hebdomadaire</h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="week"
                    stroke="#ffffff60"
                    tick={{ fill: '#ffffff60' }}
                    tickLine={{ stroke: '#ffffff20' }}
                  />
                  <YAxis
                    stroke="#ffffff60"
                    tick={{ fill: '#ffffff60' }}
                    tickLine={{ stroke: '#ffffff20' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #47C47E30',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="wins" fill={CHART_COLORS.win} name="Victoires" />
                  <Bar dataKey="losses" fill={CHART_COLORS.loss} name="Défaites" />
                  <Bar dataKey="draws" fill={CHART_COLORS.draw} name="Nulles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance by Color */}
        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Performance par Couleur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* White */}
            <div className="bg-background/30 rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <SunLight className="w-8 h-8 text-gray-200" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Blancs</h3>
                  <p className="text-sm text-foreground/60">{stats.whiteGames} parties</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">
                {stats.whiteWinRate.toFixed(1)}%
              </div>
              <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-300 to-gray-100 transition-all duration-1000"
                  style={{ width: `${stats.whiteWinRate}%` }}
                />
              </div>
            </div>

            {/* Black */}
            <div className="bg-background/30 rounded-lg p-6 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-4">
                <HalfMoon className="w-8 h-8 text-gray-400" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Noirs</h3>
                  <p className="text-sm text-foreground/60">{stats.blackGames} parties</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">
                {stats.blackWinRate.toFixed(1)}%
              </div>
              <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-600 to-gray-800 transition-all duration-1000"
                  style={{ width: `${stats.blackWinRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart and Win Rate by Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart - Game Modes Comparison */}
          {radarData.length > 0 && (
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Comparaison des Modes de Jeu
              </h2>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis
                      dataKey="name"
                      stroke="#ffffff60"
                      tick={{ fill: '#ffffff60' }}
                    />
                    <PolarRadiusAxis stroke="#ffffff60" tick={{ fill: '#ffffff60' }} />
                    <Radar
                      name="Rating"
                      dataKey="rating"
                      stroke="#47C47E"
                      fill="#47C47E"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #47C47E30',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Win Rate by Mode */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Taux de Victoire par Mode
            </h2>
            <div className="space-y-4">
              {winRateByMode.map((mode) => (
                <div key={mode.mode}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium">{mode.mode}</span>
                    <span className="text-primary font-bold">{mode.winRate}%</span>
                  </div>
                  <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000"
                      style={{ width: `${mode.winRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-foreground/40 mt-1">{mode.total} parties</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preferred Playing Hours */}
        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Heures de Jeu Préférées</h2>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="hour"
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff60' }}
                  tickLine={{ stroke: '#ffffff20' }}
                />
                <YAxis
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff60' }}
                  tickLine={{ stroke: '#ffffff20' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #47C47E30',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="games" fill="#47C47E" name="Parties jouées" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Played Openings */}
        {openingStats.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Ouvertures les Plus Jouées
            </h2>
            <div className="space-y-4">
              {openingStats.map((opening, index) => (
                <div key={opening.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-foreground font-medium">{opening.name}</div>
                        <div className="text-xs text-foreground/60">
                          {opening.count} partie{opening.count > 1 ? 's' : ''} •{' '}
                          {opening.wins}V - {opening.losses}D - {opening.draws}N
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {opening.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-foreground/40">victoires</div>
                    </div>
                  </div>
                  <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000"
                      style={{ width: `${opening.winRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Longest Win Streak */}
          <div className="bg-card/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <GraphUp className="w-5 h-5 text-green-500" />
              <span className="text-foreground/60 text-sm">Plus longue série de victoires</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{stats.longestWinStreak}</div>
          </div>

          {/* Longest Loss Streak */}
          <div className="bg-card/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 hover:border-red-500/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <GraphDown className="w-5 h-5 text-red-500" />
              <span className="text-foreground/60 text-sm">Plus longue série de défaites</span>
            </div>
            <div className="text-3xl font-bold text-red-500">{stats.longestLossStreak}</div>
          </div>

          {/* Best Day */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-foreground/60 text-sm">Meilleure journée</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {stats.bestDay.change > 0 ? '+' : ''}
              {stats.bestDay.change}
            </div>
            <div className="text-xs text-foreground/40 mt-1">
              {stats.bestDay.date && dayjs(stats.bestDay.date).format('DD/MM/YYYY')}
            </div>
          </div>

          {/* Worst Day */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-foreground/60 text-sm">Pire journée</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {stats.worstDay.change > 0 ? '+' : ''}
              {stats.worstDay.change}
            </div>
            <div className="text-xs text-foreground/40 mt-1">
              {stats.worstDay.date && dayjs(stats.worstDay.date).format('DD/MM/YYYY')}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Modal */}
      {showMilestonesModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMilestonesModal(false)}
        >
          <div
            className="bg-card border border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <StarSolid className="w-6 h-6 text-yellow-500" />
                <h3 className="text-2xl font-bold text-foreground">Jalons Atteints</h3>
              </div>
              <button
                onClick={() => setShowMilestonesModal(false)}
                className="text-foreground/60 hover:text-foreground transition-colors p-2 hover:bg-background/50 rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {milestones
                .sort((a, b) => b.rating - a.rating)
                .map((milestone, index) => (
                  <div
                    key={milestone.rating}
                    className="bg-background/50 border border-primary/10 rounded-lg p-4 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">
                            {milestone.rating} ELO
                          </div>
                          <div className="text-sm text-foreground/60">
                            {dayjs(milestone.date).format('DD MMMM YYYY')}
                          </div>
                        </div>
                      </div>
                      <div className="bg-primary/10 px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-primary">#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-primary/10">
              <p className="text-sm text-foreground/60 text-center">
                Vous avez franchi <span className="text-primary font-bold">{milestones.length}</span>{' '}
                jalon{milestones.length > 1 ? 's' : ''} de progression !
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
