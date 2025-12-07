'use client'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import dayjs from 'dayjs'
import { Rocket, Flash, Clock, Trophy, GraphUp, Calendar, Star, ArrowRight } from 'iconoir-react'
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

interface UserData {
    avatar?: string;
    status?: string;
    league?: string;
    country?: string;
}

interface PlayerStats {
    chess_rapid: {
        last: {
            rating: number;
            date: number;
        };
        best: {
            rating: number;
            date: number;
        };
        record: {
            win: number;
            loss: number;
            draw: number;
        };
    };
    chess_blitz: {
        last: {
            rating: number;
            date: number;
        };
        best: {
            rating: number;
            date: number;
        };
        record: {
            win: number;
            loss: number;
            draw: number;
        };
    };
    chess_bullet: {
        last: {
            rating: number;
            date: number;
        };
        best: {
            rating: number;
            date: number;
        };
        record: {
            win: number;
            loss: number;
            draw: number;
        };
    };
}

export default function UserPage() {
    const router = useRouter()
    const params = useParams();
    const username = params?.username as string;
    const [userData, setUserData] = useState<UserData | null>(null)
    const [countryCode, setCountryCode] = useState(null)
    const [games, setGames] = useState<Game[]>([])
    const [error, setError] = useState<string | null>(null)
    const [playerFlags, setPlayerFlags] = useState<Record<string, string>>({})
    const [selectedDate] = useState<dayjs.Dayjs | null>(null)
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await fetch(`https://api.chess.com/pub/player/${username}`)
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user data')
                }
                const userData = await userResponse.json()
                setUserData(userData)

                if (userData.country) {
                    const countryResponse = await fetch(userData.country)
                    if (!countryResponse.ok) {
                        throw new Error('Failed to fetch country data')
                    }
                    const countryData = await countryResponse.json()
                    setCountryCode(countryData.code)
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError('An unknown error occurred')
                }
            }
        }

        if (username) {
            fetchData()
        }
    }, [username])

    useEffect(() => {
        const fetchPlayerElo = async () => {
            try {
                const playerStatsResponse = await fetch(` https://api.chess.com/pub/player/${username}/stats`)
                if (!playerStatsResponse.ok) {
                    throw new Error('Failed to fetch user stats')
                }
                const playerStats = await playerStatsResponse.json()
                setPlayerStats(playerStats)
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError('An unknown error occurred')
                }
            }
        }
        if (username) {
            fetchPlayerElo()
        }
    }, [username])

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

    const fetchGames = async (year: string, month: string) => {
        try {
            const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
            if (!response.ok) {
                throw new Error('Failed to fetch games')
            }
            const data = await response.json()
            return data.games
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
            return []
        }
    }

    useEffect(() => {
        const loadGames = async () => {
            if (!username) return

            let currentDate = selectedDate ? dayjs(selectedDate) : dayjs()
            let gamesFound = false
            let attempts = 0
            const maxAttempts = 3

            while (!gamesFound && attempts < maxAttempts) {
                const year = currentDate.format('YYYY')
                const month = currentDate.format('MM')
                const gamesForMonth = await fetchGames(year, month)

                if (gamesForMonth && gamesForMonth.length > 0) {
                    setGames(gamesForMonth)
                    gamesFound = true
                } else {
                    currentDate = currentDate.subtract(1, 'month')
                    attempts++
                }
            }

            if (!gamesFound) {
                setError('No games found in the last 3 months')
                setGames([])
            }
        }

        loadGames()
    }, [username, selectedDate])

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!userData) {
        return <div>Loading...</div>
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 2000) return 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
        if (rating >= 1600) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
        if (rating >= 1200) return 'from-green-500/20 to-green-600/20 border-green-500/30'
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    }

    const calculateWinRate = (wins: number, losses: number, draws: number) => {
        const total = wins + losses + draws
        if (total === 0) return 0
        return Math.round((wins / total) * 100)
    }

    const timeClasses = [
        {
            key: 'chess_bullet',
            name: 'Bullet',
            icon: <Rocket className="w-6 h-6" />,
            gradient: 'from-red-500/10 to-orange-500/10',
            borderColor: 'border-red-500/30',
            textColor: 'text-red-400'
        },
        {
            key: 'chess_blitz',
            name: 'Blitz',
            icon: <Flash className="w-6 h-6" />,
            gradient: 'from-yellow-500/10 to-amber-500/10',
            borderColor: 'border-yellow-500/30',
            textColor: 'text-yellow-400'
        },
        {
            key: 'chess_rapid',
            name: 'Rapid',
            icon: <Clock className="w-6 h-6" />,
            gradient: 'from-blue-500/10 to-cyan-500/10',
            borderColor: 'border-blue-500/30',
            textColor: 'text-blue-400'
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="pt-8 lg:px-8 pb-12 max-w-7xl mx-auto">

                {/* Stats Overview Cards */}
                <div className="mb-12 px-4">
                    <div className="flex items-center gap-3 mb-6">
                        <Trophy className="w-8 h-8 text-primary" />
                        <h2 className="text-3xl font-bold text-foreground">Rankings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {timeClasses.map((timeClass) => {
                            const stats = playerStats?.[timeClass.key as keyof PlayerStats]
                            const rating = stats?.last?.rating
                            const bestRating = stats?.best?.rating
                            const record = stats?.record
                            const winRate = record ? calculateWinRate(record.win, record.loss, record.draw) : 0

                            return (
                                <div key={timeClass.key}
                                    className={`group relative overflow-hidden bg-card/50 backdrop-blur-sm
                                              border ${timeClass.borderColor} rounded-2xl p-6
                                              hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10
                                              transition-all duration-300 hover:scale-[1.02]`}>

                                    {/* Background gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${timeClass.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                    <div className="relative">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${timeClass.gradient} ${timeClass.textColor}`}>
                                                    {timeClass.icon}
                                                </div>
                                                <h3 className="text-xl font-semibold text-foreground">{timeClass.name}</h3>
                                            </div>
                                            {bestRating && (
                                                <div className="flex items-center gap-1 text-xs text-foreground/60">
                                                    <Star className="w-3 h-3" />
                                                    <span>{bestRating}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Rating Display */}
                                        <div className="mb-4">
                                            {rating ? (
                                                <>
                                                    <div className="text-4xl font-bold text-primary mb-2">
                                                        {rating}
                                                    </div>
                                                    {bestRating && bestRating > rating && (
                                                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                                                            <GraphUp className="w-4 h-4" />
                                                            <span>{bestRating - rating} from best</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-2xl font-semibold text-foreground/40">N/A</div>
                                            )}
                                        </div>

                                        {/* Win Rate & Record */}
                                        {record && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-foreground/60">Win Rate</span>
                                                    <span className="font-semibold text-primary">{winRate}%</span>
                                                </div>

                                                {/* Win Rate Bar */}
                                                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                                                        style={{ width: `${winRate}%` }}
                                                    />
                                                </div>

                                                {/* W/L/D */}
                                                <div className="flex items-center justify-between text-xs text-foreground/70 pt-2 border-t border-foreground/10">
                                                    <span className="text-green-400">W: {record.win}</span>
                                                    <span className="text-red-400">L: {record.loss}</span>
                                                    <span className="text-yellow-400">D: {record.draw}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Games Section */}
                <div className="px-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-primary" />
                            <h2 className="text-3xl font-bold text-foreground">Recent Games</h2>
                        </div>
                        <Link
                            href={`/chesscom/user/${username}/games`}
                            className="group flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                        >
                            <span className="font-medium">View all</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {games
                            .sort((a, b) => b.end_time - a.end_time)
                            .slice(0, 6)
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
                                            <div className={`px-2 py-1 rounded-lg text-xs font-medium
                                                          ${game.time_class === 'bullet' ? 'bg-red-500/20 text-red-400' : ''}
                                                          ${game.time_class === 'blitz' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                                          ${game.time_class === 'rapid' ? 'bg-blue-500/20 text-blue-400' : ''}`}>
                                                {game.time_class === 'bullet' && <Rocket className="w-3 h-3 inline mr-1" />}
                                                {game.time_class === 'blitz' && <Flash className="w-3 h-3 inline mr-1" />}
                                                {game.time_class === 'rapid' && <Clock className="w-3 h-3 inline mr-1" />}
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
                                                            className="font-medium truncate text-foreground hover:text-chart4 transition-colors cursor-pointer"
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
                                                            className="font-medium truncate text-foreground hover:text-chart4 transition-colors cursor-pointer"
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

                    {/* View All Button */}
                    <div className="mt-8 text-center">
                        <Link
                            href={`/chesscom/user/${username}/games`}
                            className="inline-flex items-center gap-2 bg-primary text-background font-semibold
                                     px-8 py-4 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30
                                     transition-all duration-300 transform hover:scale-105"
                        >
                            <Calendar className="w-5 h-5" />
                            View all games
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}