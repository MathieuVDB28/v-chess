'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
}

export default function AllGamesPage() {
    const { username } = useParams()
    const router = useRouter()
    const [games, setGames] = useState<Game[]>([])
    const [error, setError] = useState<string | null>(null)
    const [playerFlags, setPlayerFlags] = useState<Record<string, string>>({})

    const aMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const date = new Date();
    let currentMonth = aMonth[date.getMonth()];

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

    const labelColor = "#ffffff";
    const theme = createTheme({
        components: {
            MuiIconButton: {
                styleOverrides: {
                    sizeMedium: {
                        color: labelColor
                    }
                }
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        color: labelColor,
                        border: '1px solid #ffffff'
                    }
                }
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        color: labelColor
                    }
                }
            }
        }
    });

    if (error) return <div>Error: {error}</div>
    if (!games.length) return <div>Loading...</div>

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                        {currentMonth} games played :
                    </h1>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <ThemeProvider theme={theme}>
                            <DatePicker className="input_date disabled" label="Filter with a start date" />
                        </ThemeProvider>
                    </LocalizationProvider>
                </div>
                
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
                                        <p className="text-sm flex items-center gap-2 text-foreground">
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
            </div>
        </div>
    )
}