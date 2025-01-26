'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from "@/app/components/Navbar";

export default function Home() {
    const router = useRouter()
    const [username, setUsername] = useState('')

    const handleSubmit = async () => {
        router.push(`/user/${username}`)

    }

    return (
        <div className={`flex flex-col min-h-screen`}>
            <Navbar />
            <main className="flex-grow flex items-center justify-center">
                <div className="flex flex-col items-center gap-8">
                    <div className="flex gap-4 items-center flex-col sm:flex-row">
                        <span className="text-foreground">Entrez votre pseudo chess.com</span>
                        <input
                            type="text"
                            className="border-2 border-input bg-background text-foreground"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <button className="text-primary p-2" onClick={handleSubmit}>OK</button>
                    </div>
                </div>
            </main>

            <footer className="flex gap-6 flex-wrap items-center justify-center p-4">
                <span className="text-foreground">Made by <a href="https://github.com/MathieuVDB28" className="text-primary">MathieuVDB</a></span>
            </footer>
        </div>
    )
}