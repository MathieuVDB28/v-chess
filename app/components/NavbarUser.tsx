'use client'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu } from 'iconoir-react'
import Image from 'next/image'

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
    const pathname = usePathname();
    const username = params?.username as string;

    const [userData, setUserData] = useState<UserData | null>(null)
    const [countryCode, setCountryCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    // Détecter la plateforme à partir de l'URL
    const platform = pathname?.includes('/lichess/') ? 'lichess' : 'chesscom'
    const platformConfig = {
        chesscom: {
            name: 'Chess.com',
            logo: '/img/chesscom_logo.png',
            color: 'from-green-500/20 to-green-600/20 border-green-500/30'
        },
        lichess: {
            name: 'Lichess',
            logo: '/img/lichess_logo.png',
            color: 'from-slate-500/20 to-slate-600/20 border-slate-500/30'
        }
    }

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
                if (platform === 'chesscom') {
                    // Fetch Chess.com data
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
                } else {
                    // Fetch Lichess data
                    const userResponse = await fetch(`https://lichess.org/api/user/${username}`)
                    if (!userResponse.ok) {
                        throw new Error('Failed to fetch user data')
                    }
                    const userData = await userResponse.json()

                    // Adapter les données Lichess au format attendu
                    setUserData({
                        avatar: userData.profile?.avatar,
                        status: userData.profile?.bio,
                        league: userData.perfs?.blitz?.rating?.toString(),
                        country: userData.profile?.country
                    })

                    if (userData.profile?.country) {
                        setCountryCode(userData.profile.country)
                    }
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
    }, [username, platform])

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
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-primary">{username}</h1>
                        {countryCode && (
                            <img
                                src={`https://flagsapi.com/${countryCode}/flat/64.png`}
                                alt={`${countryCode} flag`}
                                className="w-8 h-8"
                            />
                        )}
                    </div>
                    {/* Badge de plateforme */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border bg-gradient-to-r ${platformConfig[platform].color} transition-all duration-300`}>
                        <Image
                            src={platformConfig[platform].logo}
                            alt={platformConfig[platform].name}
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                        <span className="text-xs font-medium text-foreground/90">
                            {platformConfig[platform].name}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};