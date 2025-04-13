'use client'

import Navbar from "@/app/components/Navbar"
import {useSession, signOut} from 'next-auth/react';
import {Button} from "@mui/material";
import {useState} from "react";

export default function Account() {
    const {data: session, status} = useSession();
    const [userData, setUserData] = useState({
        email: session?.user.email,
        chesscom_username: session?.user.chesscom_username,
        lichess_username: session?.user.lichess_username,
    })
    console.log(session);

    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
    }

    const handleSignOut = async () => {
        await signOut({
            redirect: true,
            callbackUrl: "/"
        });
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar/>
            <div className="container max-w-2xl py-10">
                <div>
                    <div>
                        <div>My account</div>
                        <div>Manage your personal information and account settings.</div>
                    </div>
                    <div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={userData.email}
                                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <label htmlFor="nom">Chesscom username</label>
                                    <input
                                        id="nom"
                                        type="text"
                                        value={userData.chesscom_username}
                                        onChange={(e) => setUserData({...userData, chesscom_username: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <label htmlFor="nom">Lichess username</label>
                                    <input
                                        id="nom"
                                        type="text"
                                        value={userData.lichess_username}
                                        onChange={(e) => setUserData({...userData, lichess_username: e.target.value})}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
                                </Button>
                            </div>
                        </form>
                    </div>
                    <hr/>
                    <div className="flex flex-col items-start gap-4 pt-6">
                        <Button className="text-destructive" onClick={handleSignOut}>
                            Sign out
                        </Button>
                    </div>
                </div>
            </div>

            <footer className="flex gap-6 flex-wrap items-center justify-center p-4">
                <span className="text-foreground">
                    Made by <a href="https://github.com/MathieuVDB28" className="text-primary">MathieuVDB</a>
                </span>
            </footer>
        </div>
    )
}