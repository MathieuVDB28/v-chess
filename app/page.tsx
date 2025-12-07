'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Reports, TriangleFlag, Trophy, GraphUp, TriangleFlagCircle, User, ArrowRight, CheckCircle, StarSolid } from 'iconoir-react'

type Platform = 'chesscom' | 'lichess'

export default function Home() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [platform, setPlatform] = useState<Platform>('chesscom')

    // Redirect authenticated users to their Chess.com profile
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.chesscom_username) {
            router.push(`/chesscom/user/${session.user.chesscom_username}`)
        }
    }, [status, session, router])

    const handleSubmit = async () => {
        try {
            let isValidUser = false

            if (platform === 'chesscom') {
                const response = await fetch(`https://api.chess.com/pub/player/${username}`)
                isValidUser = response.ok
            } else {
                const response = await fetch(`https://lichess.org/api/user/${username}`)
                isValidUser = response.ok
            }

            if (isValidUser) {
                router.push(`${platform}/user/${username}`)
            } else {
                alert('User not found')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error checking username')
        }
    }

    const features = [
        {
            icon: <Reports className="w-8 h-8" />,
            title: "Suivi de Joueurs",
            description: "Analysez vos performances et celles de vos adversaires avec des statistiques détaillées et graphiques en temps réel."
        },
        {
            icon: <TriangleFlag className="w-8 h-8" />,
            title: "Comparaison",
            description: "Comparez vos stats avec d'autres joueurs pour identifier vos forces et axes d'amélioration."
        },
        {
            icon: <TriangleFlagCircle className="w-8 h-8" />,
            title: "Goals Personnalisés",
            description: "Créez et suivez vos objectifs d'échecs pour progresser de manière structurée et mesurable."
        }
    ]

    const benefits = [
        "Statistiques détaillées de vos parties",
        "Graphiques d'évolution de votre ELO",
        "Comparaison avec d'autres joueurs",
        "Suivi de vos objectifs de progression",
        "Compatible Chess.com et Lichess",
        "Interface moderne et intuitive"
    ]

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden mt-12">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 sm:pt-14 sm:pb-24">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom duration-700">
                            Améliorez Votre Jeu d'Échecs
                            <span className="block text-primary mt-2">Avec V-Chess</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                            Suivez vos performances, comparez-vous aux meilleurs joueurs et atteignez vos objectifs grâce à des analyses détaillées.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                            <Link
                                href="/auth/signup"
                                className="group bg-primary text-background font-semibold px-8 py-4 rounded-lg
                                         hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30
                                         transition-all duration-300 transform hover:scale-105
                                         flex items-center gap-2"
                            >
                                Commencer Gratuitement
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#search"
                                className="border-2 border-primary text-primary font-semibold px-8 py-4 rounded-lg
                                         hover:bg-primary/10 transition-all duration-300"
                            >
                                Rechercher un Joueur
                            </Link>
                        </div>

                        {/* Stats Section */}
                        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur-sm border border-primary/10">
                                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                                    <GraphUp className="w-10 h-10 mx-auto mb-2" />
                                    100%
                                </div>
                                <div className="text-foreground/60">Gratuit</div>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur-sm border border-primary/10">
                                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                                    <User className="w-10 h-10 mx-auto mb-2" />
                                    2+
                                </div>
                                <div className="text-foreground/60">Plateformes</div>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur-sm border border-primary/10">
                                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                                    <StarSolid className="w-10 h-10 mx-auto mb-2" />
                                    ∞
                                </div>
                                <div className="text-foreground/60">Analyses</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-card/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Des Outils Puissants pour Progresser
                        </h2>
                        <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
                            V-Chess vous offre tous les outils nécessaires pour analyser et améliorer votre jeu
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/10
                                         hover:border-primary/30 transition-all duration-300 hover:scale-105
                                         hover:shadow-xl hover:shadow-primary/10"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6
                                              group-hover:bg-primary/20 transition-colors duration-300 text-primary">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-semibold text-foreground mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-foreground/60 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search Section */}
            <section id="search" className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Recherchez un Joueur
                            </h2>
                            <p className="text-xl text-foreground/60">
                                Explorez les statistiques de n'importe quel joueur Chess.com ou Lichess
                            </p>
                        </div>

                        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setPlatform('chesscom')}
                                        className={`p-4 rounded-xl transition-all ${
                                            platform === 'chesscom'
                                                ? 'bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                                : 'bg-card hover:bg-foreground/5'
                                        }`}
                                    >
                                        <Image
                                            src="/img/chesscom_logo.png"
                                            alt="Chess.com"
                                            width={48}
                                            height={48}
                                            className="w-12 h-12"
                                        />
                                    </button>
                                    <button
                                        className={`opacity-50 cursor-not-allowed p-4 rounded-xl transition-all ${
                                            platform === 'lichess'
                                                ? 'bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20'
                                                : 'bg-card'
                                        }`}
                                        title="Bientôt disponible"
                                    >
                                        <Image
                                            src="/img/lichess_logo.png"
                                            alt="Lichess"
                                            width={48}
                                            height={48}
                                            className="w-12 h-12"
                                        />
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="text"
                                        placeholder={`Entrez un pseudo ${platform === 'chesscom' ? 'Chess.com' : 'Lichess'}`}
                                        className="flex-1 border-2 border-input bg-background text-foreground px-4 py-4 rounded-xl
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                    <button
                                        className="bg-primary text-background font-semibold px-8 py-4 rounded-xl
                                                 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30
                                                 transition-all duration-300 transform hover:scale-105
                                                 flex items-center justify-center gap-2"
                                        onClick={handleSubmit}
                                    >
                                        <Reports className="w-5 h-5" />
                                        Analyser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why V-Chess Section */}
            <section className="py-20 bg-card/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                                Pourquoi Choisir V-Chess ?
                            </h2>
                            <p className="text-xl text-foreground/60 mb-8">
                                V-Chess est la plateforme complète pour les joueurs d'échecs qui souhaitent progresser de manière structurée et mesurable.
                            </p>
                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                        <span className="text-foreground/80 text-lg">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" />
                            <div className="relative bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                                        <Trophy className="w-12 h-12 text-primary" />
                                        <div>
                                            <div className="font-semibold text-foreground text-lg">Suivez vos victoires</div>
                                            <div className="text-foreground/60">Analysez vos meilleures parties</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                                        <GraphUp className="w-12 h-12 text-primary" />
                                        <div>
                                            <div className="font-semibold text-foreground text-lg">Progressez rapidement</div>
                                            <div className="text-foreground/60">Graphiques d'évolution détaillés</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                                        <TriangleFlagCircle className="w-12 h-12 text-primary" />
                                        <div>
                                            <div className="font-semibold text-foreground text-lg">Atteignez vos objectifs</div>
                                            <div className="text-foreground/60">Définissez et suivez vos goals</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-12 border border-primary/20">
                        <div className="relative text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Prêt à Améliorer Votre Jeu ?
                            </h2>
                            <p className="text-xl text-foreground/70 mb-8">
                                Rejoignez V-Chess dès aujourd'hui et commencez à progresser
                            </p>
                            <Link
                                href="/auth/signup"
                                className="inline-flex items-center gap-2 bg-primary text-background font-semibold px-8 py-4 rounded-xl
                                         hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30
                                         transition-all duration-300 transform hover:scale-105"
                            >
                                Créer un Compte Gratuit
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <p className="mt-4 text-sm text-foreground/50">
                                Aucune carte bancaire requise • Accès instantané
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-input py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-foreground/60">
                            Made by{' '}
                            <a
                                href="https://github.com/MathieuVDB28"
                                className="text-primary hover:underline transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                MathieuVDB
                            </a>
                        </span>
                        <div className="flex gap-6">
                            <Link href="/contact" className="text-foreground/60 hover:text-primary transition-colors">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
