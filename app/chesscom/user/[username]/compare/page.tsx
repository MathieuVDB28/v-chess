'use client'
import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface GameItem {
    date: string;
    time_class: string;
    playerColor: string;
    result: string;
    url: string;
}

interface Results {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    kd: string;
    gamesList: GameItem[];
}

type TimeClass = 'bullet' | 'blitz' | 'rapid' | 'daily'
type FilterType = 'all' | TimeClass

export default function CompareUser() {
    const params = useParams()
    const username = typeof params?.username === 'string' ? params.username : Array.isArray(params?.username) ? params.username[0] : '';
    const router = useRouter()
    const [opponentUsername, setOpponentUsername] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [results, setResults] = useState<Results | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filter])

    // Compute filtered stats based on selected filter
    const filteredStats = useMemo(() => {
        if (!results) return null

        if (filter === 'all') {
            return results
        }

        const filtered = results.gamesList.filter(game => game.time_class === filter)
        const wins = filtered.filter(g => g.result === 'win').length
        const losses = filtered.filter(g => g.result === 'resigned' || g.result === 'timeout' || g.result === 'checkmated').length
        const draws = filtered.filter(g => g.result !== 'win' && g.result !== 'resigned' && g.result !== 'timeout' && g.result !== 'checkmated').length
        const kd = losses > 0 ? (wins / losses).toFixed(2) : wins > 0 ? "∞" : "0"

        return {
            totalGames: filtered.length,
            wins,
            losses,
            draws,
            kd,
            gamesList: filtered
        }
    }, [results, filter])

    // Calculate win percentage for circular progress
    const winPercentage = filteredStats ?
        (filteredStats.totalGames > 0 ? (filteredStats.wins / filteredStats.totalGames) * 100 : 0) : 0

    // Calculate stats by color
    const colorStats = useMemo(() => {
        if (!filteredStats) return { white: { wins: 0, total: 0 }, black: { wins: 0, total: 0 } }

        const whiteGames = filteredStats.gamesList.filter(g => g.playerColor === 'white')
        const blackGames = filteredStats.gamesList.filter(g => g.playerColor === 'black')

        return {
            white: {
                wins: whiteGames.filter(g => g.result === 'win').length,
                total: whiteGames.length
            },
            black: {
                wins: blackGames.filter(g => g.result === 'win').length,
                total: blackGames.length
            }
        }
    }, [filteredStats])

    // Calculate longest win/loss streaks
    const streaks = useMemo(() => {
        if (!filteredStats) return { longestWinStreak: 0, longestLossStreak: 0 }

        let currentWinStreak = 0
        let currentLossStreak = 0
        let longestWinStreak = 0
        let longestLossStreak = 0

        filteredStats.gamesList.forEach(game => {
            if (game.result === 'win') {
                currentWinStreak++
                currentLossStreak = 0
                longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
            } else if (game.result === 'resigned' || game.result === 'timeout' || game.result === 'checkmated') {
                currentLossStreak++
                currentWinStreak = 0
                longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
            } else {
                currentWinStreak = 0
                currentLossStreak = 0
            }
        })

        return { longestWinStreak, longestLossStreak }
    }, [filteredStats])

    // Pagination
    const paginatedGames = useMemo(() => {
        if (!filteredStats) return []
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredStats.gamesList.slice(startIndex, endIndex)
    }, [filteredStats, currentPage, itemsPerPage])

    const totalPages = filteredStats ? Math.ceil(filteredStats.gamesList.length / itemsPerPage) : 0

    const fetchGames = async () => {
        if (!opponentUsername.trim()) return

        setIsLoading(true)
        setError(null)
        setCurrentPage(1) // Reset pagination

        try {
            const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`)
            const archivesData = await archivesResponse.json()

            if (!archivesData.archives || archivesData.archives.length === 0) {
                throw new Error("No games found for this player")
            }

            let wins = 0
            let losses = 0
            let draws = 0
            let totalGames = 0
            const gamesListArray: GameItem[] = []

            for (let i = archivesData.archives.length - 1; i >= 0; i--) {
                const archiveUrl = archivesData.archives[i]
                const archiveResponse = await fetch(archiveUrl)
                const archiveData = await archiveResponse.json()

                const gamesAgainstOpponent = archiveData.games.filter((game: { white: { username: string; }; black: { username: string; }; }) => {
                    const isWhite = game.white.username.toLowerCase() === username.toLowerCase()
                    const isBlack = game.black.username.toLowerCase() === username.toLowerCase()
                    const opponentIsWhite = game.white.username.toLowerCase() === opponentUsername.toLowerCase()
                    const opponentIsBlack = game.black.username.toLowerCase() === opponentUsername.toLowerCase()

                    return (isWhite && opponentIsBlack) || (isBlack && opponentIsWhite)
                })

                gamesAgainstOpponent.forEach((game: any) => {
                    totalGames++

                    const playerIsWhite = game.white.username.toLowerCase() === username.toLowerCase()
                    const playerResult = playerIsWhite ? game.white.result : game.black.result

                    if (playerResult === 'win') wins++
                    else if (playerResult === 'resigned' || playerResult === 'timeout' || playerResult === 'checkmated') losses++
                    else draws++

                    gamesListArray.push({
                        date: new Date(game.end_time * 1000).toLocaleDateString(),
                        time_class: game.time_class,
                        playerColor: playerIsWhite ? 'white' : 'black',
                        result: playerResult,
                        url: game.url
                    })
                })
            }

            const kd = losses > 0 ? (wins / losses).toFixed(2) : wins > 0 ? "∞" : "0"

            setResults({
                totalGames,
                wins,
                losses,
                draws,
                kd,
                gamesList: gamesListArray
            })
        } catch (err: any) {
            console.error("Erreur lors de la récupération des données:", err)
            setError(err.message || "An error occurred while fetching data")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full w-full">
            {!results ? (
                <div className="flex flex-col justify-center items-center flex-1 w-full pb-12">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            Player Comparison
                        </h1>
                        <p className="text-muted-foreground">
                            Compare <span className="text-primary font-medium">{username}</span> with another player
                        </p>
                    </div>

                    <div className="flex gap-4 items-center justify-center flex-col sm:flex-row w-full max-w-3xl px-4">
                        <input
                            type="text"
                            placeholder="Enter opponent username"
                            className="border-2 border-input bg-background text-foreground p-3 rounded-lg w-full sm:w-80
                                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                                     transition-all duration-200"
                            value={opponentUsername}
                            onChange={(e) => setOpponentUsername(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchGames()}
                            disabled={isLoading}
                        />
                        <button
                            className="
                            bg-primary text-background border-2 border-background px-6 py-3 rounded-lg
                            transition-all duration-200 font-medium
                            hover:bg-background hover:text-primary hover:border-primary
                            disabled:opacity-50 disabled:cursor-not-allowed
                            shadow-lg hover:shadow-primary/20"
                            onClick={fetchGames}
                            disabled={isLoading || !opponentUsername.trim()}
                        >
                            {isLoading ? 'Searching...' : 'Compare'}
                        </button>
                    </div>

                    {error && (
                        <div className="w-full max-w-3xl mt-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg mx-4">
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
                                <p className="text-primary font-medium">Searching games...</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center w-full flex-1 overflow-y-auto px-4 pb-8">
                    {/* Search Bar */}
                    <div className="w-full max-w-6xl pt-6 pb-4 sticky top-0 bg-background z-10">
                        <div className="flex gap-4 justify-center items-center flex-col sm:flex-row">
                            <input
                                type="text"
                                placeholder="Enter opponent username"
                                className="border-2 border-input bg-background text-foreground p-3 rounded-lg w-full sm:w-80
                                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                                         transition-all duration-200"
                                value={opponentUsername}
                                onChange={(e) => setOpponentUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchGames()}
                                disabled={isLoading}
                            />
                            <button
                                className="
                                bg-primary text-background border-2 border-background px-6 py-3 rounded-lg
                                transition-all duration-200 font-medium
                                hover:bg-background hover:text-primary hover:border-primary
                                disabled:opacity-50 disabled:cursor-not-allowed
                                shadow-lg hover:shadow-primary/20"
                                onClick={fetchGames}
                                disabled={isLoading || !opponentUsername.trim()}
                            >
                                {isLoading ? 'Searching...' : 'New Search'}
                            </button>
                        </div>

                        {error && (
                            <div className="w-full mt-4 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="w-full flex items-center justify-center py-12">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
                                <p className="text-primary font-medium">Searching games...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-6xl">
                            {/* VS Header */}
                            <div className="relative flex items-center justify-center gap-2 sm:gap-4 md:gap-8 mb-8 py-8 px-2">
                                {/* Player 1 */}
                                <div className="flex-1 flex flex-col items-end min-w-0">
                                    <div className="text-right w-full">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 truncate">
                                            {username}
                                        </h2>
                                        <p className="text-muted-foreground text-xs sm:text-sm">You</p>
                                    </div>
                                </div>

                                {/* VS Badge */}
                                <div className="relative flex-shrink-0">
                                    <div className="bg-primary/20 border-2 border-primary rounded-full p-3 sm:p-4 md:p-6 backdrop-blur-sm">
                                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-primary">VS</span>
                                    </div>
                                </div>

                                {/* Player 2 */}
                                <div className="flex-1 flex flex-col items-start min-w-0">
                                    <div className="text-left w-full">
                                        <h2
                                            onClick={() => router.push(`/chesscom/user/${opponentUsername}`)}
                                            className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors truncate"
                                        >
                                            {opponentUsername}
                                        </h2>
                                        <p className="text-muted-foreground text-xs sm:text-sm">Opponent</p>
                                    </div>
                                </div>
                            </div>

                            {filteredStats && filteredStats.totalGames > 0 ? (
                                <>
                                    {/* Filter Buttons */}
                                    <div className="flex gap-2 justify-center mb-6 flex-wrap">
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                filter === 'all'
                                                    ? 'bg-primary text-background shadow-lg'
                                                    : 'bg-background border border-input text-foreground hover:border-primary'
                                            }`}
                                        >
                                            All Games
                                        </button>
                                        {['bullet', 'blitz', 'rapid', 'daily'].map((timeClass) => {
                                            const count = results.gamesList.filter(g => g.time_class === timeClass).length
                                            if (count === 0) return null

                                            const emoji = {
                                                bullet: '🔫',
                                                blitz: '⚡',
                                                rapid: '🕛',
                                                daily: '☀️'
                                            }[timeClass]

                                            return (
                                                <button
                                                    key={timeClass}
                                                    onClick={() => setFilter(timeClass as TimeClass)}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                        filter === timeClass
                                                            ? 'bg-primary text-background shadow-lg'
                                                            : 'bg-background border border-input text-foreground hover:border-primary'
                                                    }`}
                                                >
                                                    {emoji} {timeClass.charAt(0).toUpperCase() + timeClass.slice(1)} ({count})
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Main Stats Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                        {/* Win Rate Circle */}
                                        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-foreground text-center">Win Rate</h3>
                                            <div className="flex items-center justify-center py-4">
                                                <div className="relative w-48 h-48">
                                                    <svg viewBox="0 0 192 192" className="w-full h-full transform -rotate-90">
                                                        {/* Background circle */}
                                                        <circle
                                                            cx="96"
                                                            cy="96"
                                                            r="85"
                                                            stroke="hsl(var(--input))"
                                                            strokeWidth="12"
                                                            fill="none"
                                                        />
                                                        {/* Progress circle */}
                                                        <circle
                                                            cx="96"
                                                            cy="96"
                                                            r="85"
                                                            stroke="hsl(var(--primary))"
                                                            strokeWidth="12"
                                                            fill="none"
                                                            strokeDasharray={`${(winPercentage / 100) * 534} 534`}
                                                            strokeLinecap="round"
                                                            className="transition-all duration-1000 ease-out"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-4xl font-bold text-primary">{winPercentage.toFixed(0)}%</span>
                                                        <span className="text-sm text-muted-foreground">Win Rate</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Overview */}
                                        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">Total Games</p>
                                                <p className="text-3xl font-bold text-foreground">{filteredStats.totalGames}</p>
                                            </div>
                                            <div className="bg-card border border-primary/30 rounded-xl p-4 text-center hover:border-primary transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">Wins</p>
                                                <p className="text-3xl font-bold text-primary">{filteredStats.wins}</p>
                                            </div>
                                            <div className="bg-card border border-destructive/30 rounded-xl p-4 text-center hover:border-destructive transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">Losses</p>
                                                <p className="text-3xl font-bold text-destructive">{filteredStats.losses}</p>
                                            </div>
                                            <div className="bg-card border border-chart-3/30 rounded-xl p-4 text-center hover:border-chart-3 transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">Draws</p>
                                                <p className="text-3xl font-bold text-chart-3">{filteredStats.draws}</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-xl p-4 text-center col-span-2 hover:border-primary transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">K/D Ratio</p>
                                                <p className="text-3xl font-bold text-foreground">{filteredStats.kd}</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">Best Streak</p>
                                                <p className="text-3xl font-bold text-primary">{streaks.longestWinStreak}</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-xl p-4 text-center hover:border-destructive transition-colors">
                                                <p className="text-sm text-muted-foreground mb-1">Worst Streak</p>
                                                <p className="text-3xl font-bold text-destructive">{streaks.longestLossStreak}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance by Color */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-card border border-border rounded-xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-white rounded-full border-2 border-border"></div>
                                                <h3 className="text-lg font-semibold text-foreground">White Pieces</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Games played:</span>
                                                    <span className="font-semibold text-foreground">{colorStats.white.total}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Wins:</span>
                                                    <span className="font-semibold text-primary">{colorStats.white.wins}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Win rate:</span>
                                                    <span className="font-semibold text-foreground">
                                                        {colorStats.white.total > 0 ? ((colorStats.white.wins / colorStats.white.total) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-card border border-border rounded-xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-gray-800 rounded-full border-2 border-border"></div>
                                                <h3 className="text-lg font-semibold text-foreground">Black Pieces</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Games played:</span>
                                                    <span className="font-semibold text-foreground">{colorStats.black.total}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Wins:</span>
                                                    <span className="font-semibold text-primary">{colorStats.black.wins}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Win rate:</span>
                                                    <span className="font-semibold text-foreground">
                                                        {colorStats.black.total > 0 ? ((colorStats.black.wins / colorStats.black.total) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Game History */}
                                    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                                        <h3 className="text-xl font-semibold mb-4 text-foreground">Game History</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="p-3 text-left text-muted-foreground font-medium">Date</th>
                                                        <th className="p-3 text-left text-muted-foreground font-medium">Type</th>
                                                        <th className="p-3 text-left text-muted-foreground font-medium">Color</th>
                                                        <th className="p-3 text-left text-muted-foreground font-medium">Result</th>
                                                        <th className="p-3 text-left text-muted-foreground font-medium">Link</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedGames.map((game, index) => (
                                                        <tr
                                                            key={index}
                                                            className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                                                        >
                                                            <td className="p-3 text-foreground">{game.date}</td>
                                                            <td className="p-3">
                                                                <span className="inline-flex items-center gap-1 text-foreground">
                                                                    {game.time_class === 'bullet' && '🔫'}
                                                                    {game.time_class === 'blitz' && '⚡'}
                                                                    {game.time_class === 'rapid' && '🕛'}
                                                                    {game.time_class === 'daily' && '☀️'}
                                                                    <span className="capitalize">{game.time_class}</span>
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-4 h-4 rounded-full border ${
                                                                        game.playerColor === 'white' ? 'bg-white border-border' : 'bg-gray-800 border-border'
                                                                    }`}></div>
                                                                    <span className="text-foreground capitalize">{game.playerColor}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                                    game.result === 'win'
                                                                        ? 'bg-primary/20 text-primary border border-primary/30' :
                                                                    (game.result === 'draw' || game.result === 'stalemate' || game.result === 'repetition' || game.result === 'agreed')
                                                                        ? 'bg-chart-3/20 text-chart-3 border border-chart-3/30' :
                                                                    'bg-destructive/20 text-destructive border border-destructive/30'
                                                                }`}>
                                                                    {game.result === 'win' ? 'Win' :
                                                                        (game.result === 'draw' || game.result === 'stalemate' || game.result === 'repetition' || game.result === 'agreed') ? 'Draw' : 'Loss'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                <a
                                                                    href={game.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                                                                >
                                                                    View
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                                                <div className="text-sm text-muted-foreground text-center sm:text-left">
                                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStats.gamesList.length)} of {filteredStats.gamesList.length} games
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-2 rounded-lg border border-border bg-background text-foreground
                                                                 hover:border-primary hover:text-primary transition-colors
                                                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-foreground"
                                                    >
                                                        Previous
                                                    </button>

                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                                            // Show first page, last page, current page, and pages around current
                                                            if (
                                                                page === 1 ||
                                                                page === totalPages ||
                                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                                            ) {
                                                                return (
                                                                    <button
                                                                        key={page}
                                                                        onClick={() => setCurrentPage(page)}
                                                                        className={`px-3 py-2 rounded-lg border transition-colors ${
                                                                            page === currentPage
                                                                                ? 'bg-primary text-background border-primary'
                                                                                : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'
                                                                        }`}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                )
                                                            } else if (
                                                                page === currentPage - 2 ||
                                                                page === currentPage + 2
                                                            ) {
                                                                return <span key={page} className="text-muted-foreground">...</span>
                                                            }
                                                            return null
                                                        })}
                                                    </div>

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-2 rounded-lg border border-border bg-background text-foreground
                                                                 hover:border-primary hover:text-primary transition-colors
                                                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-foreground"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                                    <p className="text-muted-foreground text-lg">No games found between these two players.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
