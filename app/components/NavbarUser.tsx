'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu } from 'iconoir-react'

interface UserData {
    avatar?: string;
    status?: string;
    league?: string;
    country?: string;
}

// Création d'un contexte pour partager l'état du sidebar entre les composants
export const toggleSidebar = () => {
    const event = new CustomEvent('toggleSidebar');
    window.dispatchEvent(event);
};

export default function Navbar() {
    const params = useParams();
    const username = params?.username as string;

    const [userData, setUserData] = useState<UserData | null>(null)
    const [countryCode, setCountryCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Fonction pour détecter si l'écran est de taille mobile
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Vérifier dès le début
        checkIfMobile();

        // Ajouter un écouteur d'événement pour les changements de taille
        window.addEventListener('resize', checkIfMobile);

        // Nettoyer l'écouteur d'événement
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

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
        <div className="pt-8 flex flex-col items-center relative">

            <div className="flex items-center justify-center gap-4">
                {/* Bouton menu burger pour mobile, affiché uniquement en mode mobile */}
                <div>
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-md text-white hover:bg-primary transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <div className="w-[50px] h-[50px] md:w-[100px] md:h-[100px]">
                    {userData?.avatar && (
                        <img
                            src={userData.avatar}
                            alt={`${username}'s avatar`}
                            className="rounded-full w-full h-full object-cover"
                        />
                    )}
                </div>
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