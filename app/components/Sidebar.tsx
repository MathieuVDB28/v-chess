'use client'

import Link from 'next/link';
import {useParams, usePathname} from 'next/navigation'
import {User, Reports, ArcheryMatch, TriangleFlag, UserCircle, Menu, HelpCircleSolid} from 'iconoir-react'
import {useSession} from "next-auth/react";
import {useState, useEffect} from 'react';

export default function Sidebar() {
    const params = useParams();
    const username = params?.username as string;
    const pathname = usePathname();
    const {data: session, status} = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Détecter la plateforme à partir de l'URL
    const platform = pathname?.includes('/lichess/') ? 'lichess' : 'chesscom';

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkIfMobile();

        window.addEventListener('resize', checkIfMobile);

        const handleToggleSidebar = () => {
            setIsSidebarOpen(prevState => !prevState);
        };

        window.addEventListener('toggleSidebar', handleToggleSidebar);

        return () => {
            window.removeEventListener('resize', checkIfMobile);
            window.removeEventListener('toggleSidebar', handleToggleSidebar);
        };
    }, []);

    const userLink = status === "authenticated" ? '/account' : '/auth/signup';
    const sidebarClasses = `${isMobile ? 'fixed left-0 top-0 h-screen w-60 bg-sidebar text-white p-4 flex flex-col transition-transform duration-300 z-20' : 'fixed left-0 top-0 h-screen w-60 bg-sidebar text-white p-4 flex flex-col'} ${isMobile && !isSidebarOpen ? '-translate-x-full' : ''}`;
    const closeSidebar = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <>
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className={sidebarClasses}>
                <div className="flex sm:block gap-6 text-center items-center mt-4">
                    {isMobile && (
                        <button
                            onClick={closeSidebar}
                            className="p-2 text-white hover:text-primary transition-colors"
                        >
                            <Menu className="w-6 h-6"/>
                        </button>
                    )}
                    <Link href={`/`} onClick={closeSidebar}>
                        <h2 className="text-xl font-bold text-primary">v-chess</h2>
                    </Link>
                </div>

                <nav className="mt-10 space-y-6 flex-grow">
                    <Link href={`/${platform}/user/${username}`}
                          className={`${pathname === `/${platform}/user/${username}` ? 'text-chart4' : ''} flex items-center space-x-3 p-2 hover:text-chart4 rounded`}
                          onClick={closeSidebar}>
                        <User/>
                        <span>User</span>
                    </Link>

                    <Link href={`/${platform}/user/${username}/compare`}
                          className={`${pathname === `/${platform}/user/${username}/compare` ? 'text-red-500' : ''} flex items-center space-x-3 p-2 hover:text-red-500 rounded`}
                          onClick={closeSidebar}>
                        <ArcheryMatch/>
                        <span>Compare</span>
                    </Link>

                    <Link href={`/workinginprogress`}
                          className={`${pathname === `/${platform}/user/${username}/goals` ? 'text-yellow-400' : ''} flex items-center space-x-3 p-2 hover:text-yellow-400 rounded`}
                          onClick={closeSidebar}>
                        <TriangleFlag/>
                        <span>Goals</span>
                    </Link>

                    <Link href={`/${platform}/user/${username}/stats`}
                          className={`${pathname === `/${platform}/user/${username}/stats` ? 'text-orange-500' : ''} flex items-center space-x-3 p-2 hover:text-orange-500 rounded`}
                          onClick={closeSidebar}>
                        <Reports/>
                        <span>Stats</span>
                    </Link>
                </nav>

                <div className="mt-auto pb-4 flex gap-6">
                    <Link href={userLink}
                          className="flex items-center space-x-3 p-2 text-primary rounded hover:text-white"
                          onClick={closeSidebar}>
                        <UserCircle/>
                        <span>My account</span>
                    </Link>
                    <Link href={"/contact"}
                          className="flex items-center space-x-3 p-2 hover:text-primary rounded"
                          onClick={closeSidebar}>
                        <HelpCircleSolid/>
                    </Link>
                </div>
            </div>
        </>
    );
}