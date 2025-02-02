'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Rocket, Thunderstorm, Clock } from 'iconoir-react'

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
    const { username } = useParams()
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

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                        {currentMonth} {selectedYear} games played:
                    </h1>
                    <div className="flex gap-4">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-background text-foreground border border-input rounded-lg p-2"
                        >
                            {months.map((month) => (
                                <option key={month.value} value={month.value}>
                                    {month.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-background text-foreground border border-input rounded-lg p-2"
                        >
                            {years.map((year) => (
                                <option key={year.value} value={year.value}>
                                    {year.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error ? (
                    <div className="text-center py-8 text-foreground">
                        <span className="text-foreground">No games found for this period. Try to change the month for view games.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {games
                            .sort((a, b) => b.end_time - a.end_time)
                            .map((game, index) => (
                                <div key={index} className="p-4 border rounded-lg relative">
                                    <div className="absolute top-4 left-4 text-foreground/80">
                                        {game.time_class === 'bullet' && <Rocket className="w-5 h-5" />}
                                        {game.time_class === 'blitz' && <Thunderstorm className="w-5 h-5" />}
                                        {game.time_class === 'rapid' && <Clock className="w-5 h-5" />}
                                    </div>
                                    <p className="font-semibold text-foreground ml-8">{formatDate(game.end_time)}</p>
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
                )}
            </div>
        </div>
    )
}