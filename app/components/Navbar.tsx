'use client'

import { useState } from 'react'
import { User, HalfMoon, SunLight } from 'iconoir-react'

export default function Navbar() {
    const [isDarkMode, setIsDarkMode] = useState(false)

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode)
        document.documentElement.classList.toggle('dark')
    }
    return (
        <div>
            <nav className="flex items-center justify-between p-4">
                <div className="w-10"></div>
                <h1 className="text-2xl font-bold text-primary">v-chess</h1>
                <div className="flex items-center space-x-4">
                    <User />
                    <button onClick={toggleDarkMode}>
                        {isDarkMode ? <SunLight className="h-[1.2rem] w-[1.2rem]" /> :
                            <HalfMoon className="h-[1.2rem] w-[1.2rem]" />}
                    </button>
                </div>
            </nav>
        </div>
    );
};