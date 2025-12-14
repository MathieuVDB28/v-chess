'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TriangleFlag,
  Calendar,
  Trophy,
  Plus,
  Trash,
  GraphUp,
  Clock,
  CheckCircle,
  WarningCircle,
} from 'iconoir-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

dayjs.locale('fr');

interface Goal {
  id: string;
  gameMode: string;
  startRating: number;
  targetRating: number;
  targetDate: string;
  status: string;
  createdAt: string;
}

interface PlayerStats {
  chess_bullet?: { last?: { rating: number } };
  chess_blitz?: { last?: { rating: number } };
  chess_rapid?: { last?: { rating: number } };
  chess_daily?: { last?: { rating: number } };
}

type GameMode = 'bullet' | 'blitz' | 'rapid' | 'daily';

const GAME_MODES: { value: GameMode; label: string; color: string }[] = [
  { value: 'bullet', label: 'Bullet', color: '#ef4444' },
  { value: 'blitz', label: 'Blitz', color: '#f59e0b' },
  { value: 'rapid', label: 'Rapid', color: '#3b82f6' },
  { value: 'daily', label: 'Daily', color: '#8b5cf6' },
];

export default function GoalsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('blitz');
  const [startRating, setStartRating] = useState<number>(0);
  const [targetRating, setTargetRating] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<dayjs.Dayjs | null>(dayjs().add(3, 'month'));
  const [creating, setCreating] = useState(false);

  // Check if viewing own goals
  const isOwnGoals =
    session?.user?.chesscom_username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch player stats to get current ratings
        const statsResponse = await fetch(
          `https://api.chess.com/pub/player/${username}/stats`
        );
        if (!statsResponse.ok) throw new Error('Failed to fetch stats');
        const stats = await statsResponse.json();
        setPlayerStats(stats);

        // Set default start rating based on blitz rating
        const blitzRating = stats.chess_blitz?.last?.rating || 1000;
        setStartRating(blitzRating);
        setTargetRating(blitzRating + 100);

        // Fetch user goals if authenticated
        if (isOwnGoals) {
          const goalsResponse = await fetch('/api/goals');
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json();
            setGoals(goalsData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username, isOwnGoals]);

  // Update start rating when game mode changes
  useEffect(() => {
    if (playerStats) {
      const modeKey = `chess_${selectedGameMode}` as keyof PlayerStats;
      const currentRating = playerStats[modeKey]?.last?.rating || 1000;
      setStartRating(currentRating);
      setTargetRating(currentRating + 100);
    }
  }, [selectedGameMode, playerStats]);

  const handleCreateGoal = async () => {
    if (!targetDate) {
      alert('Veuillez sélectionner une date cible');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameMode: selectedGameMode,
          startRating,
          targetRating,
          targetDate: targetDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const newGoal = await response.json();
      setGoals([newGoal, ...goals]);
      setShowCreateModal(false);

      // Reset form
      const modeKey = `chess_${selectedGameMode}` as keyof PlayerStats;
      const currentRating = playerStats?.[modeKey]?.last?.rating || 1000;
      setStartRating(currentRating);
      setTargetRating(currentRating + 100);
      setTargetDate(dayjs().add(3, 'month'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création du goal');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      alert('Erreur lors de la suppression du goal');
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      setGoals(goals.map((g) => (g.id === goalId ? updatedGoal : g)));
    } catch (err) {
      alert('Erreur lors de la mise à jour du goal');
    }
  };

  // Calculate projection data for a goal
  const calculateProjection = (goal: Goal) => {
    const currentDate = new Date();
    const targetDateObj = new Date(goal.targetDate);
    const daysTotal = Math.ceil(
      (targetDateObj.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.ceil(
      (currentDate.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(
      0,
      Math.ceil((targetDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get current rating for this game mode
    const modeKey = `chess_${goal.gameMode}` as keyof PlayerStats;
    const currentRating = playerStats?.[modeKey]?.last?.rating || goal.startRating;

    const ratingDiff = goal.targetRating - goal.startRating;
    const ratingProgress = currentRating - goal.startRating;
    const progressPercentage = (ratingProgress / ratingDiff) * 100;

    // Generate projection data
    const data = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const dayProgress = (i / steps) * daysTotal;
      const projectedRating = goal.startRating + (ratingDiff * i) / steps;
      const date = dayjs(goal.createdAt).add(dayProgress, 'day');

      data.push({
        date: date.format('DD/MM'),
        timestamp: date.valueOf(),
        projected: Math.round(projectedRating),
        actual: i / steps <= daysElapsed / daysTotal ? currentRating : null,
      });
    }

    return {
      data,
      currentRating,
      daysRemaining,
      daysTotal,
      daysElapsed,
      progressPercentage,
      ratingProgress,
      ratingDiff,
      isOnTrack: currentRating >= goal.startRating + (ratingDiff * daysElapsed) / daysTotal,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Chargement des objectifs...</p>
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

  if (!isOwnGoals) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <WarningCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-foreground text-lg mb-4">
            Vous ne pouvez voir que vos propres objectifs
          </p>
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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-primary/10">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <TriangleFlag className="w-8 h-8 text-primary" />
                  <h1 className="text-4xl font-bold text-foreground">Mes Objectifs</h1>
                </div>
                <p className="text-foreground/60">
                  Définissez et suivez vos objectifs de progression
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                <span>Nouvel Objectif</span>
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {goals.length === 0 ? (
            <div className="text-center py-16">
              <TriangleFlag className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60 text-lg mb-6">
                Aucun objectif défini pour le moment
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-background px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Créer mon premier objectif
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {goals.map((goal) => {
                const projection = calculateProjection(goal);
                const gameMode = GAME_MODES.find((m) => m.value === goal.gameMode);

                return (
                  <div
                    key={goal.id}
                    className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 transition-all"
                  >
                    {/* Goal Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: gameMode?.color }}
                        />
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">
                            {gameMode?.label} - {goal.targetRating} ELO
                          </h3>
                          <p className="text-foreground/60 text-sm mt-1">
                            De {goal.startRating} à {goal.targetRating} ELO (+
                            {projection.ratingDiff})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {goal.status === 'active' && (
                          <button
                            onClick={() => handleUpdateGoalStatus(goal.id, 'completed')}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Marquer comme complété"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-background/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-foreground/60 text-sm">Rating Actuel</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {projection.currentRating}
                        </div>
                      </div>

                      <div className="bg-background/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <GraphUp className="w-4 h-4 text-green-500" />
                          <span className="text-foreground/60 text-sm">Progression</span>
                        </div>
                        <div className="text-2xl font-bold text-green-500">
                          +{projection.ratingProgress}
                        </div>
                        <div className="text-xs text-foreground/40 mt-1">
                          {projection.progressPercentage.toFixed(1)}%
                        </div>
                      </div>

                      <div className="bg-background/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-foreground/60 text-sm">Jours Restants</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {projection.daysRemaining}
                        </div>
                        <div className="text-xs text-foreground/40 mt-1">
                          sur {projection.daysTotal}
                        </div>
                      </div>

                      <div className="bg-background/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-foreground/60 text-sm">Date Cible</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {dayjs(goal.targetDate).format('DD/MM/YYYY')}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground/60">Progression</span>
                        <span
                          className={`text-sm font-medium ${
                            projection.isOnTrack ? 'text-green-500' : 'text-orange-500'
                          }`}
                        >
                          {projection.isOnTrack ? 'Sur la bonne voie' : 'En retard'}
                        </span>
                      </div>
                      <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            projection.isOnTrack
                              ? 'bg-gradient-to-r from-green-500 to-primary'
                              : 'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          style={{ width: `${Math.min(100, projection.progressPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="w-full h-[400px] md:h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projection.data} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis
                            dataKey="date"
                            stroke="#ffffff60"
                            tick={{ fill: '#ffffff60', fontSize: 12 }}
                            tickLine={{ stroke: '#ffffff20' }}
                          />
                          <YAxis
                            stroke="#ffffff60"
                            tick={{ fill: '#ffffff60', fontSize: 12 }}
                            tickLine={{ stroke: '#ffffff20' }}
                            domain={[goal.startRating - 50, goal.targetRating + 50]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #47C47E30',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#ffffff' }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                            iconType="line"
                          />
                          <ReferenceLine
                            y={goal.targetRating}
                            stroke="#fbbf24"
                            strokeDasharray="3 3"
                            label={{ value: 'Objectif', fill: '#fbbf24', fontSize: 12 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="projected"
                            stroke={gameMode?.color}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Progression projetée"
                          />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#47C47E"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            name="Progression réelle"
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="bg-card border border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-primary/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">Nouvel Objectif</h3>
              </div>

              <div className="space-y-6">
                {/* Game Mode */}
                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">Mode de jeu</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GAME_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setSelectedGameMode(mode.value)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          selectedGameMode === mode.value
                            ? 'bg-primary text-background'
                            : 'bg-background/50 text-foreground/60 hover:bg-background hover:text-foreground'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Rating */}
                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">
                    Rating de départ
                  </label>
                  <input
                    type="number"
                    value={startRating}
                    onChange={(e) => setStartRating(parseInt(e.target.value) || 0)}
                    className="w-full bg-background/50 border border-primary/20 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary/50"
                    placeholder="1200"
                  />
                </div>

                {/* Target Rating */}
                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">
                    Rating à atteindre
                  </label>
                  <input
                    type="number"
                    value={targetRating}
                    onChange={(e) => setTargetRating(parseInt(e.target.value) || 0)}
                    className="w-full bg-background/50 border border-primary/20 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary/50"
                    placeholder="1400"
                  />
                  <p className="text-xs text-foreground/40 mt-1">
                    Progression: +{targetRating - startRating} ELO
                  </p>
                </div>

                {/* Target Date */}
                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">Date cible</label>
                  <DatePicker
                    value={targetDate}
                    onChange={(newValue) => setTargetDate(newValue)}
                    minDate={dayjs().add(1, 'day')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '0.5rem',
                            '& fieldset': {
                              borderColor: 'rgba(71, 196, 126, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(71, 196, 126, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'rgba(71, 196, 126, 0.5)',
                            },
                          },
                          '& .MuiSvgIcon-root': {
                            color: '#47C47E',
                          },
                        },
                      },
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-background/50 text-foreground px-6 py-3 rounded-lg hover:bg-background transition-colors"
                    disabled={creating}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={creating}
                    className="flex-1 bg-primary text-background px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {creating ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}
