'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserData {
    avatar?: string;
    status?: string;
    league?: string;
    country?: string;
}

export default function Navbar() {
    const params = useParams();
    const username = params?.username as string;

    const [userData, setUserData] = useState<UserData | null>(null)
    const [countryCode, setCountryCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

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

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!userData) {
        return <div>Loading...</div>
    }

    return (
        <div className="pt-8 flex flex-col items-center">
            <div className="flex items-center gap-4">
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
        </div>
    );
};