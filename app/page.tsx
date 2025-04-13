'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from "@/app/components/Navbar"
import Image from 'next/image'
import { useSession } from 'next-auth/react';

type Platform = 'chesscom' | 'lichess'

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [platform, setPlatform] = useState<Platform>('chesscom')

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

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex items-center justify-center">
                <div className="flex flex-col items-center gap-8">
                    <div className="flex gap-4 items-center flex-col sm:flex-row">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setPlatform('chesscom')}
                                className={`p-2 rounded-lg transition-all ${
                                    platform === 'chesscom' 
                                        ? 'bg-primary/10 ring-2 ring-primary' 
                                        : 'hover:bg-foreground/5'
                                }`}
                            >
                                <Image
                                    src="/img/chesscom_logo.png"
                                    alt="Chess.com"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8"
                                />
                            </button>
                            <button
                                onClick={() => setPlatform('lichess')}
                                className={`p-2 rounded-lg transition-all ${
                                    platform === 'lichess' 
                                        ? 'bg-primary/10 ring-2 ring-primary' 
                                        : 'hover:bg-foreground/5'
                                }`}
                            >
                                <Image
                                    src="/img/lichess_logo.png"
                                    alt="Lichess"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8"
                                />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder={`Enter your ${platform === 'chesscom' ? 'Chess.com' : 'Lichess'} username`}
                            className="border-2 border-input bg-background text-foreground p-2 rounded-lg w-64 sm:w-80"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <button 
                            className="
                            bg-primary text-background border-2 border-background px-4 py-2 rounded-lg transition-colors
                            hover:bg-background hover:text-primary hover:border-2 hover:border-primary"
                            onClick={handleSubmit}
                        >
                            Search
                        </button>
                    </div>
                </div>
            </main>

            <footer className="flex gap-6 flex-wrap items-center justify-center p-4">
                <span className="text-foreground">Made by <a href="https://github.com/MathieuVDB28" className="text-primary">MathieuVDB</a></span>
            </footer>
        </div>
    )
}