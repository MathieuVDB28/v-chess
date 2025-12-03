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
    const [currentPassword, setCurrentPassword] = useState('');
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
        <div className="p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl text-primary text-center font-bold mb-6">My Account</h1>
                <p className="text-white mb-6">Manage your account information and settings.</p>

                <form onSubmit={handleSubmit} className="bg-sidebar shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl text-primary font-semibold mb-2">Profile</h2>
                    <p className="text-white mb-4">Update your profile information.</p>

                    {/* Profile Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-white block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="submit"
                            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {/* Password Section */}
                <div className="bg-sidebar shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl text-primary font-semibold mb-2">Change Password</h2>
                    <p className="text-white mb-4">Update your account password.</p>

                    <div className="mb-6">
                        <label className="block text-sm text-white font-medium mb-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-white font-medium mb-1">New Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2"
                            required
                        />
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-600 font-semibold hover:underline"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}