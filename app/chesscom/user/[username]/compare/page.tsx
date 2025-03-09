'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'  // Correction de l'import du router

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

export default function CompareUser() {
    const params = useParams()
    const username = typeof params.username === 'string' ? params.username : Array.isArray(params.username) ? params.username[0] : '';
    const router = useRouter()
    const [opponentUsername, setOpponentUsername] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [results, setResults] = useState<Results | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchGames = async () => {
        if (!opponentUsername.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`)
            const archivesData = await archivesResponse.json()

            if (!archivesData.archives || archivesData.archives.length === 0) {
                new Error("No game found this player")
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
            setError(err.message || "Une erreur s'est produite lors de la récupération des données")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full w-full">
            <h1 className="text-2xl font-bold text-foreground text-center py-6">
                Compare {username} with an other player
            </h1>

            {!results ? (
                <div className="flex flex-col justify-center items-center flex-1 w-full pb-12">
                    <div className="flex gap-4 items-center justify-center flex-col sm:flex-row w-full max-w-3xl">
                        <input
                            type="text"
                            placeholder="Enter the opponent username"
                            className="border-2 border-input bg-background text-foreground p-2 rounded-lg w-full sm:w-80"
                            value={opponentUsername}
                            onChange={(e) => setOpponentUsername(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            className="
                            bg-primary text-background border-2 border-background px-4 py-2 rounded-lg transition-colors
                            hover:bg-background hover:text-primary hover:border-2 hover:border-primary
                            disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={fetchGames}
                            disabled={isLoading || !opponentUsername.trim()}
                        >
                            Search
                        </button>
                    </div>

                    {error && (
                        <div className="w-full max-w-3xl mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-70">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
                                <p className="text-primary font-medium">Games search...</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center w-full flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
                        <div className="flex gap-4 justify-center items-center flex-col sm:flex-row w-full">
                            <input
                                type="text"
                                placeholder="Enter the opponent username"
                                className="border-2 border-input bg-background text-foreground p-2 rounded-lg w-full sm:w-80"
                                value={opponentUsername}
                                onChange={(e) => setOpponentUsername(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                className="
                                bg-primary text-background border-2 border-background px-4 py-2 rounded-lg transition-colors
                                hover:bg-background hover:text-primary hover:border-2 hover:border-primary
                                disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={fetchGames}
                                disabled={isLoading || !opponentUsername.trim()}
                            >
                                Search
                            </button>
                        </div>

                        {error && (
                            <div className="w-full p-4 bg-red-100 text-red-800 rounded-lg">
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="w-full flex items-center justify-center py-12">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
                                    <p className="text-primary font-medium">Games search...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full mb-6">
                                <div className="bg-background p-6 rounded-lg shadow-md w-full">
                                    <h2 className="text-xl font-semibold mb-4 text-foreground">
                                        Stats against{' '}
                                        <span
                                            onClick={() => router.push(`/chesscom/user/${opponentUsername}`)}
                                            className="text-primary cursor-pointer hover:underline"
                                        >
                                            {opponentUsername}
                                        </span>
                                    </h2>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-500">Games</p>
                                            <p className="text-2xl font-bold">{results.totalGames}</p>
                                        </div>
                                        <div className="bg-green-100 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-500">Wins</p>
                                            <p className="text-2xl font-bold">{results.wins}</p>
                                        </div>
                                        <div className="bg-red-100 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-500">Losses</p>
                                            <p className="text-2xl font-bold">{results.losses}</p>
                                        </div>
                                        <div className="bg-yellow-100 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-500">Draws</p>
                                            <p className="text-2xl font-bold">{results.draws}</p>
                                        </div>
                                        <div className="bg-blue-100 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-500">Ratio</p>
                                            <p className="text-2xl font-bold">{results.kd}</p>
                                        </div>
                                    </div>

                                    {results.totalGames > 0 && results.gamesList && results.gamesList.length > 0 ? (
                                        <>
                                            <h3 className="text-lg font-medium mb-2 text-foreground">Game history</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="p-2 text-left">Date</th>
                                                        <th className="p-2 text-left">Time class</th>
                                                        <th className="p-2 text-left">Color</th>
                                                        <th className="p-2 text-left">Result</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {results.gamesList.map((game, index) => (
                                                        <tr key={index} className="border-b text-foreground">
                                                            <td className="p-2">{game.date}</td>
                                                            <td className="p-2">
                                                                {game.time_class === 'bullet' && '🔫 Bullet'}
                                                                {game.time_class === 'blitz' && '🚀 Blitz'}
                                                                {game.time_class === 'rapid' && '🕔 Rapid '}
                                                                {game.time_class === 'daily' && '☀️ Daily '}
                                                            </td>
                                                            <td className="p-2">{game.playerColor === 'white' ? 'Whites' : 'Blacks'}</td>
                                                            <td className="p-2">
                                                                <span className={`inline-block px-2 py-1 rounded ${
                                                                    game.result === 'win' ? 'bg-green-100 text-green-800' :
                                                                        (game.result === 'draw' || game.result === 'stalemate' || game.result === 'repetition' || game.result === 'agreed') ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {game.result === 'win' ? 'Win' :
                                                                        (game.result === 'draw' || game.result === 'stalemate' || game.result === 'repetition' || game.result === 'agreed') ? 'Draw' : 'Loss'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-center py-4">No game found between these two players.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}