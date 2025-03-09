'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

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
}

export default function UserPage() {
    const router = useRouter()
    const { username } = useParams()
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

    return (
        <div className="p-8 flex flex-col items-center">
            <div className="text-center text-foreground">
                {userData?.status && (
                    <p>{userData.status.charAt(0).toUpperCase() + userData.status.slice(1)} player</p>
                )}
                {userData?.league && (
                    <p>Player league : {userData.league}</p>
                )}
            </div>
            <div className="w-full max-w-4xl text-foreground">
                <h2 className="text-xl font-bold mb-4">Ranks :</h2>
                <div className='flex flex-col'>
                    <span>⚡️ Blitz : {playerStats?.chess_blitz?.last?.rating || 'N/A'}</span>
                    <span>🕛 Rapid : {playerStats?.chess_rapid?.last?.rating || 'N/A'}</span>
                </div>
                <h2 className="text-xl font-bold mb-4 mt-6">Last games :</h2>
                <div className="grid grid-cols-2 gap-4 mt-8">
                    {games
                        .sort((a, b) => b.end_time - a.end_time)
                        .slice(0, 6)
                        .map((game, index) => (
                            <div key={index} className="p-4 border rounded-lg relative">
                                <div className="absolute top-4 left-4 text-foreground/80">
                                    {game.time_class === 'bullet' && <span className="text-sm">🚀</span>}
                                    {game.time_class === 'blitz' && <span className="text-sm">⚡️</span>}
                                    {game.time_class === 'rapid' && <span className="text-sm">🕛</span>}
                                </div>
                                <p className="font-semibold text-foreground ml-8">{formatDate(game.end_time)}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-sm flex items-center gap-2">
                                            White:
                                            {game.white.username === username ? (
                                                <span className="text-primary">{game.white.username}</span>
                                            ) : (
                                                <span
                                                    className="text-foreground hover:text-chart4 cursor-pointer"
                                                    onClick={() => router.push(`/user/${game.white.username}`)}
                                                >
                                                    {game.white.username}
                                                </span>
                                            )}
                                            {playerFlags[game.white.username] && (
                                                <img
                                                    src={`https://flagsapi.com/${playerFlags[game.white.username]}/flat/24.png`}
                                                    alt={`${game.white.username}'s country flag`}
                                                    className="w-4 h-4"
                                                />
                                            )}
                                            {game.white.rating && (
                                                <span className="text-sm">{game.white.rating}</span>
                                            )}
                                        </p>
                                        <p className="text-sm flex items-center gap-2">
                                            Black:
                                            {game.black.username === username ? (
                                                <span className="text-primary">{game.black.username}</span>
                                            ) : (
                                                <span
                                                    className="text-foreground hover:text-chart4 cursor-pointer"
                                                    onClick={() => router.push(`/user/${game.black.username}`)}
                                                >
                                                    {game.black.username}
                                                </span>
                                            )}
                                            {playerFlags[game.black.username] && (
                                                <img
                                                    src={`https://flagsapi.com/${playerFlags[game.black.username]}/flat/24.png`}
                                                    alt={`${game.black.username}'s country flag`}
                                                    className="w-4 h-4"
                                                />
                                            )}
                                            {game.black.rating && (
                                                <span className="text-sm">{game.black.rating}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-sm flex-1 flex">
                                        <div className="font-medium flex justify-end items-center gap-2 w-full">
                                            {game.white.username === username
                                                ? (
                                                    <>
                                                        <div>
                                                            <span className={`${game.white.result === 'win' ? 'bg-green-500' : 'bg-red-500'} text-background rounded-sm mx-auto flex justify-center items-center w-6`}>
                                                                {game.white.result === 'win' ? '+' : '-'}
                                                            </span>
                                                        </div>
                                                        <span className="text-foreground">({game.white.result === 'win' ? game.black.result : game.white.result})</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <span className={`${game.black.result === 'win' ? 'bg-green-500' : 'bg-red-500'} text-background rounded-sm mx-auto flex justify-center items-center w-6`}>
                                                                {game.black.result === 'win' ? '+' : '-'}
                                                            </span>
                                                        </div>
                                                        <span className="text-foreground">({game.black.result === 'win' ? game.white.result : game.black.result})</span>
                                                    </>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
                {games.length > 5 && (
                    <div className="mt-10 text-center">
                        <button
                            onClick={() => router.push(`/chesscom/user/${username}/games`)}
                            className="px-4 py-2 bg-primary text-background rounded hover:bg-background hover:border-primary hover:text-primary transition-colors"
                        >
                            See all the user games
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}