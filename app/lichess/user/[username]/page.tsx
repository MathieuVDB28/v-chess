'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserData {
    id: string;
    username: string;
    title?: string;
    profile?: {
        country?: string;
        location?: string;
        bio?: string;
        firstName?: string;
        lastName?: string;
    };
    perfs?: {
        [key: string]: {
            games: number;
            rating: number;
            rd: number;
            prog: number;
        };
    };
}

export default function UserPage() {
    const params = useParams();
    const username = params?.username as string;
    const [userData, setUserData] = useState<UserData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`https://lichess.org/api/user/${username}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch user data')
                }
                const data = await response.json()
                setUserData(data)
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError('An unknown error occurred')
                }
            }
        }

        if (username) {
            fetchUserData()
        }
    }, [username])

    if (error) return <div className="p-8 text-center text-foreground">Error: {error}</div>
    if (!userData) return <div className="p-8 text-center text-foreground">Loading...</div>

    return (
        <div className="p-8 flex flex-col items-center">
            {userData.perfs && (
                <div className="text-center text-foreground mt-6 max-w-4xl w-full">
                    <h2 className="text-xl font-semibold mb-6 text-primary">Classements</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(userData.perfs).map(([key, value]) => (
                            <div key={key} className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/20 transition-all duration-300">
                                <p className="font-semibold capitalize text-foreground mb-3 text-lg">{key}</p>
                                <div className="space-y-2 text-foreground/70">
                                    <p><span className="text-primary font-medium">{value.rating}</span> ELO</p>
                                    <p className="text-sm">{value.games} parties</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}