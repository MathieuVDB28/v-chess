'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Player {
    username: string;
    result: string;
    country?: string;
}

interface Game {
    end_time: number;
    white: Player;
    black: Player;
}

interface UserData {
    avatar?: string;
    status?: string;
    league?: string;
    country?: string;
}

export default function UserPage() {
    const router = useRouter()
    const { username } = useParams()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [countryCode, setCountryCode] = useState(null)
    const [games, setGames] = useState<Game[]>([])
    const [error, setError] = useState<string | null>(null)
    const [playerFlags, setPlayerFlags] = useState<Record<string, string>>({})

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

                const currentDate = new Date()
                const year = currentDate.getFullYear()
                const month = String(currentDate.getMonth() + 1).padStart(2, '0')
                const gamesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
                if (!gamesResponse.ok) {
                    throw new Error('Failed to fetch games data')
                }
                const gamesData = await gamesResponse.json()
                setGames(gamesData.games)

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

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!userData) {
        return <div>Loading...</div>
    }

    return (
        <div className="p-8 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
            {userData?.avatar && (
                    <img
                        src={userData.avatar}
                        alt={`${username}'s avatar`}
                        className="rounded-full"
                        width={100}
                        height={100}
                    />
                )}
                <h1 className="text-2xl font-bold text-primary">{username}</h1>
                {countryCode && (
                    <img
                        src={`https://flagsapi.com/${countryCode}/flat/64.png`}
                        alt={`${countryCode} flag`}
                        className="w-8 h-8"
                    />
                )}
            </div>
            <div className="text-center text-foreground mt-6">
            {userData?.status && (
                    <p>{userData.status.charAt(0).toUpperCase() + userData.status.slice(1)} player</p>
                )}
                {userData?.league && (
                    <p>Player league : {userData.league}</p>
                )}
            </div>
            <div className="mt-5 w-full max-w-4xl text-foreground">
                <h2 className="text-xl font-bold mb-4">Last games:</h2>
                <div className="grid grid-cols-2 gap-4 mt-8">
                    {games
                        .sort((a, b) => b.end_time - a.end_time)
                        .slice(0, 6)
                        .map((game, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <p className="font-semibold">{formatDate(game.end_time)}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-sm flex items-center gap-2">
                                            White: 
                                            <span className={game.white.username === username ? 'text-primary' : 'text-foreground'}>
                                                {game.white.username}
                                            </span>
                                            {playerFlags[game.white.username] && (
                                                <img
                                                    src={`https://flagsapi.com/${playerFlags[game.white.username]}/flat/24.png`}
                                                    alt={`${game.white.username}'s country flag`}
                                                    className="w-4 h-4"
                                                />
                                            )}
                                        </p>
                                        <p className="text-sm flex items-center gap-2">
                                            Black: 
                                            <span className={game.black.username === username ? 'text-primary' : 'text-foreground'}>
                                                {game.black.username}
                                            </span>
                                            {playerFlags[game.black.username] && (
                                                <img
                                                    src={`https://flagsapi.com/${playerFlags[game.black.username]}/flat/24.png`}
                                                    alt={`${game.black.username}'s country flag`}
                                                    className="w-4 h-4"
                                                />
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-sm flex-1 flex">
                                        <div className="font-medium flex items-center gap-2 w-full">
                                            {game.white.username === username
                                                ? (
                                                    <>
                                                        <span className={`${game.white.result === 'win' ? 'bg-green-500' : 'bg-red-500'} text-background rounded-sm mx-auto flex justify-center items-center w-6`}>
                                                            {game.white.result === 'win' ? '+' : '-'}
                                                        </span>
                                                        <span className="text-foreground ml-auto">({game.white.result === 'win' ? game.black.result : game.white.result})</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`${game.black.result === 'win' ? 'bg-green-500' : 'bg-red-500'} text-background rounded-sm mx-auto flex justify-center items-center w-6`}>
                                                            {game.black.result === 'win' ? '+' : '-'}
                                                        </span>
                                                        <span className="text-foreground ml-auto">({game.black.result === 'win' ? game.white.result : game.black.result})</span>
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
                            onClick={() => router.push(`/user/${username}/games`)}
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