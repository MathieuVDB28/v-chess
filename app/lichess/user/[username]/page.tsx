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
            <div className="flex items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold text-primary">{userData.username}</h1>
                {userData.profile?.country && (
                    <img
                        src={`https://flagsapi.com/${userData.profile.country}/flat/64.png`}
                        alt={`${userData.profile.country} flag`}
                        className="w-8 h-8"
                    />
                )}
            </div>
            {userData.perfs && (
                <div className="text-center text-foreground mt-6">
                    <h2 className="text-xl font-semibold mb-4">Ratings</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(userData.perfs).map(([key, value]) => (
                            <div key={key} className="p-4 border rounded-lg">
                                <p className="font-medium capitalize">{key}</p>
                                <p>Rating: {value.rating}</p>
                                <p>Games: {value.games}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}