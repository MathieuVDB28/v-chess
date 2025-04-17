'use client'
import Link from 'next/link';
import {useParams} from 'next/navigation'
import {User, Reports, ArcheryMatch, TriangleFlag, UserCircle, Menu, X} from 'iconoir-react'
import {useSession} from "next-auth/react";
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const params = useParams();
    const username = params?.username as string;
    const {data: session, status} = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                    <Link href={`/`} onClick={closeSidebar}>
                        <h2 className="text-xl font-bold text-primary">v-chess</h2>
                    </Link>
                </div>

                <nav className="mt-10 space-y-6 flex-grow">
                    <Link href={`/chesscom/user/${username}`}
                          className="flex items-center space-x-3 p-2 hover:text-chart4 rounded"
                          onClick={closeSidebar}>
                        <User/>
                        <span>User</span>
                    </Link>

                    <Link href={`/chesscom/user/${username}/compare`}
                          className="flex items-center space-x-3 p-2 hover:text-red-500 rounded"
                          onClick={closeSidebar}>
                        <ArcheryMatch/>
                        <span>Compare</span>
                    </Link>

                    <Link href={`/workinginprogress`}
                          className="flex items-center space-x-3 p-2 hover:text-yellow-400 rounded"
                          onClick={closeSidebar}>
                        <TriangleFlag/>
                        <span>Goals</span>
                    </Link>

                    <Link href={`/workinginprogress`}
                          className="flex items-center space-x-3 p-2 hover:text-orange-500 rounded"
                          onClick={closeSidebar}>
                        <Reports/>
                        <span>Stats</span>
                    </Link>
                </nav>

                <div className="mt-auto pb-4">
                    <Link href={userLink}
                          className="flex items-center space-x-3 p-2 hover:text-primary rounded"
                          onClick={closeSidebar}>
                        <UserCircle/>
                        <span>My account</span>
                    </Link>
                </div>
            </div>
        </>
    );
}