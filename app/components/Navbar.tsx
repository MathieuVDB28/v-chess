'use client'

import { useState } from 'react'
import Link from 'next/link';
import { User, HalfMoon, SunLight } from 'iconoir-react'
import {useSession} from "next-auth/react";

export default function Navbar() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const {data: session, status} = useSession();

    const userLink = status === "authenticated" ? '/account' : '/auth/signup';

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode)
        document.documentElement.classList.toggle('dark')
    }
    return (
        <nav className="flex items-center justify-between w-full p-4">
            <div className="w-10"></div>
            <Link href="/">
                <h1 className="text-2xl font-bold text-primary">v-chess</h1>
            </Link>
            <div className="flex items-center space-x-4">
                {/*<button onClick={toggleDarkMode}>*/}
                {/*    {isDarkMode ? <SunLight className="h-[1.2rem] w-[1.2rem]" /> :*/}
                {/*        <HalfMoon className="h-[1.2rem] w-[1.2rem]" />}*/}
                {/*</button>*/}
            </div>
        </nav>
    );
};