'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Rocket, Flash, Clock, Calendar, Trophy, GraphUp, CheckCircle, XmarkCircle } from 'iconoir-react'
import Link from 'next/link'

interface Player {
    username: string;
    result: string;
    country?: string;
    rating?: number;
}

interface Game {
    end_time: number;
    white: Player;
    black: Player;
    time_class: string;
    url: string;
}

interface SelectOption {
    value: string;
    label: string;
}

const months: SelectOption[] = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
]

export default function AllGamesPage() {
    const params = useParams();
    const username = params?.username as string;
    const router = useRouter()
    const [games, setGames] = useState<Game[]>([])
    const [error, setError] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + '')
    const [playerFlags, setPlayerFlags] = useState<Record<string, string>>({})

    const currentYear = new Date().getFullYear()
    const years: SelectOption[] = Array.from({ length: currentYear - 2007 + 1 }, (_, index) => ({
        value: (currentYear - index).toString(),
        label: (currentYear - index).toString()
    }))

    useEffect(() => {
        const loadGames = async () => {
            if (!username) return

            try {
                const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${selectedYear}/${selectedMonth}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch games')
                }
                const data = await response.json()
                
                if (data.games && data.games.length > 0) {
                    setGames(data.games)
                    setError(null)
                } else {
                    setGames([])
                    setError('No games found for this period')
                }
            } catch (err) {
                setGames([])
                setError('Failed to fetch games')
            }
        }

        loadGames()
    }, [username, selectedMonth, selectedYear])

    useEffect(() => {
        const fetchPlayerData = async (playerUsername: string) => {
            try {
                const response = await fetch(`https://api.chess.com/pub/player/${playerUsername}`);
                if (!response.ok) return null;
                const data = await response.json();
                if (data.country) {
                    const countryResponse = await fetch(data.country);
                    if (!countryResponse.ok) return null;
                    const countryData = await countryResponse.json();
                    setPlayerFlags(prev => ({
                        ...prev,
                        [playerUsername]: countryData.code
                    }));
                }
            } catch (error) {
                console.error(`Error fetching data for ${playerUsername}:`, error);
            }
        };

        if (games.length > 0) {
            const uniquePlayers = new Set(
                games.flatMap(game => [game.white.username, game.black.username])
            );
            uniquePlayers.forEach(playerUsername => {
                if (!playerFlags[playerUsername]) {
                    fetchPlayerData(playerUsername);
                }
            });
        }
    }, [games]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString()
    }

    const currentMonth = months.find(m => m.value === selectedMonth)?.label ||
                        months[new Date().getMonth()].label

    // Calculate stats for the month
    const monthStats = {
        total: games.length,
        wins: games.filter(g => {
            const isWhite = g.white.username === username
            return isWhite ? g.white.result === 'win' : g.black.result === 'win'
        }).length,
        losses: games.filter(g => {
            const isWhite = g.white.username === username
            return isWhite ? g.white.result !== 'win' && g.white.result !== 'agreed' : g.black.result !== 'win' && g.black.result !== 'agreed'
        }).length,
        draws: games.filter(g => {
            return g.white.result === 'agreed' || g.black.result === 'agreed'
        }).length,
    }

    const winRate = monthStats.total > 0 ? Math.round((monthStats.wins / monthStats.total) * 100) : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="pt-8 lg:px-8 pb-12 max-w-7xl mx-auto">

                {/* Header with Date Selectors */}
                <div className="mb-8 px-4">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 justify-between items-start lg:items-center">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-primary" />
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Games History
                                </h1>
                                <p className="text-foreground/60 mt-1">
                                    {currentMonth} {selectedYear}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="appearance-none bg-card/50 backdrop-blur-sm text-foreground border-2 border-primary/20
                                             rounded-xl px-4 py-3 pr-10 font-medium hover:border-primary/40
                                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                             transition-all duration-300 cursor-pointer"
                                >
                                    {months.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                                <Calendar className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="appearance-none bg-card/50 backdrop-blur-sm text-foreground border-2 border-primary/20
                                             rounded-xl px-4 py-3 pr-10 font-medium hover:border-primary/40
                                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                             transition-all duration-300 cursor-pointer"
                                >
                                    {years.map((year) => (
                                        <option key={year.value} value={year.value}>
                                            {year.label}
                                        </option>
                                    ))}
                                </select>
                                <Calendar className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Monthly Stats */}
                    {!error && games.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-4 hover:border-primary/30 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="w-5 h-5 text-primary" />
                                    <span className="text-sm text-foreground/60">Total</span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{monthStats.total}</div>
                            </div>

                            <div className="bg-card/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 hover:border-green-500/40 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-sm text-foreground/60">Wins</span>
                                </div>
                                <div className="text-2xl font-bold text-green-400">{monthStats.wins}</div>
                            </div>

                            <div className="bg-card/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <XmarkCircle className="w-5 h-5 text-red-400" />
                                    <span className="text-sm text-foreground/60">Losses</span>
                                </div>
                                <div className="text-2xl font-bold text-red-400">{monthStats.losses}</div>
                            </div>

                            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-4 hover:border-primary/30 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <GraphUp className="w-5 h-5 text-primary" />
                                    <span className="text-sm text-foreground/60">Win Rate</span>
                                </div>
                                <div className="text-2xl font-bold text-primary">{winRate}%</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Games Grid */}
                <div className="px-4">
                    {error ? (
                        <div className="text-center py-16">
                            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-8 max-w-md mx-auto">
                                <Calendar className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">No games found</h3>
                                <p className="text-foreground/60">
                                    Try changing the month to view games.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {games
                                .sort((a, b) => b.end_time - a.end_time)
                                .map((game, index) => {
                                    const isWhite = game.white.username === username
                                    const playerResult = isWhite ? game.white.result : game.black.result
                                    const isWin = playerResult === 'win'

                                    // Get end reason (how the game ended)
                                    const getEndReason = () => {
                                        if (playerResult === 'win') return isWhite ? game.black.result : game.white.result
                                        if (playerResult === 'checkmated') return 'checkmated'
                                        if (playerResult === 'timeout') return 'timeout'
                                        if (playerResult === 'resigned') return 'resigned'
                                        if (playerResult === 'agreed') return 'draw'
                                        if (playerResult === 'repetition') return 'repetition'
                                        if (playerResult === 'stalemate') return 'stalemate'
                                        if (playerResult === 'insufficient') return 'insufficient'
                                        if (playerResult === 'abandoned') return 'abandoned'
                                        return playerResult
                                    }

                                    return (
                                        <div key={index}
                                            className="group relative bg-card/50 backdrop-blur-sm border border-primary/10
                                                     rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
                                                     transition-all duration-300">

                                            {/* Time Class Badge */}
                                            <div className="absolute top-3 left-3">
                                                <div className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1
                                                              ${game.time_class === 'bullet' ? 'bg-red-500/20 text-red-400' : ''}
                                                              ${game.time_class === 'blitz' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                                              ${game.time_class === 'rapid' ? 'bg-blue-500/20 text-blue-400' : ''}`}>
                                                    {game.time_class === 'bullet' && <Rocket className="w-3 h-3" />}
                                                    {game.time_class === 'blitz' && <Flash className="w-3 h-3" />}
                                                    {game.time_class === 'rapid' && <Clock className="w-3 h-3" />}
                                                    {game.time_class}
                                                </div>
                                            </div>

                                            {/* View Link */}
                                            <a
                                                href={game.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-primary/10
                                                         text-primary hover:bg-primary/20 text-xs font-medium
                                                         transition-all duration-200 hover:scale-105"
                                            >
                                                View
                                            </a>

                                            {/* Game Header */}
                                            <div className="flex items-center justify-between mt-8 mb-4">
                                                <span className="text-sm text-foreground/60 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(game.end_time)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold
                                                                  ${isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {isWin ? 'Win' : 'Loss'}
                                                    </span>
                                                    <span className="text-xs text-foreground/50">
                                                        ({getEndReason()})
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Players */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                                                    <span className="text-xs text-foreground/60 w-16">White</span>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {game.white.username === username ? (
                                                            <span className="font-medium truncate text-primary">
                                                                {game.white.username}
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href={`/chesscom/user/${game.white.username}`}
                                                                className="font-medium truncate text-foreground hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {game.white.username}
                                                            </Link>
                                                        )}
                                                        {playerFlags[game.white.username] && (
                                                            <img
                                                                src={`https://flagsapi.com/${playerFlags[game.white.username]}/flat/24.png`}
                                                                alt="flag"
                                                                className="w-4 h-4"
                                                            />
                                                        )}
                                                    </div>
                                                    {game.white.rating && (
                                                        <span className="text-sm font-semibold text-foreground/80">
                                                            {game.white.rating}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                                                    <span className="text-xs text-foreground/60 w-16">Black</span>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {game.black.username === username ? (
                                                            <span className="font-medium truncate text-primary">
                                                                {game.black.username}
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href={`/chesscom/user/${game.black.username}`}
                                                                className="font-medium truncate text-foreground hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {game.black.username}
                                                            </Link>
                                                        )}
                                                        {playerFlags[game.black.username] && (
                                                            <img
                                                                src={`https://flagsapi.com/${playerFlags[game.black.username]}/flat/24.png`}
                                                                alt="flag"
                                                                className="w-4 h-4"
                                                            />
                                                        )}
                                                    </div>
                                                    {game.black.rating && (
                                                        <span className="text-sm font-semibold text-foreground/80">
                                                            {game.black.rating}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}