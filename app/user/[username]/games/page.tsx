'use client'
import { useParams } from 'next/navigation'
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

export default function AllGamesPage() {
    const { username } = useParams()
    const [games, setGames] = useState<Game[]>([])
    const [error, setError] = useState<string | null>(null)
    const [playerFlags, setPlayerFlags] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const currentDate = new Date()
                const year = currentDate.getFullYear()
                const month = String(currentDate.getMonth() + 1).padStart(2, '0')
                const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch games')
                }
                const data = await response.json()
                setGames(data.games)
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError('An unknown error occurred')
                }
            }
        }

        if (username) {
            fetchGames()
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

    if (error) return <div>Error: {error}</div>
    if (!games.length) return <div>Loading...</div>

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-center text-foreground">All games for <span className='text-primary'>{username}</span></h1>
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    {games
                        .sort((a, b) => b.end_time - a.end_time)
                        .map((game, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <p className="font-semibold text-foreground">{formatDate(game.end_time)}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-sm flex items-center gap-2 text-foreground">
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
                                        <p className="text-sm flex items-center gap-2 text-foreground">
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
            </div>
        </div>
    )
}