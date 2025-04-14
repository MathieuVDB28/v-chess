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
        // Fonction pour détecter si l'écran est de taille mobile
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Vérifier dès le début
        checkIfMobile();

        // Ajouter un écouteur d'événement pour les changements de taille
        window.addEventListener('resize', checkIfMobile);

        // Écouter l'événement de basculement du sidebar
        const handleToggleSidebar = () => {
            setIsSidebarOpen(prevState => !prevState);
        };

        window.addEventListener('toggleSidebar', handleToggleSidebar);

        // Nettoyer les écouteurs d'événements
        return () => {
            window.removeEventListener('resize', checkIfMobile);
            window.removeEventListener('toggleSidebar', handleToggleSidebar);
        };
    }, []);

    const userLink = status === "authenticated" ? '/account' : '/auth/signup';

    // Génère les classes CSS pour la sidebar en fonction de l'état
    const sidebarClasses = `${isMobile ? 'fixed left-0 top-0 h-screen w-60 bg-sidebar text-white p-4 flex flex-col transition-transform duration-300 z-20' : 'fixed left-0 top-0 h-screen w-60 bg-sidebar text-white p-4 flex flex-col'} ${isMobile && !isSidebarOpen ? '-translate-x-full' : ''}`;

    // Ferme le sidebar quand on clique sur un lien (en mode mobile)
    const closeSidebar = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <>
            {/* Overlay quand la sidebar est ouverte sur mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={sidebarClasses}>
                <div className="flex gap-6 items-center mt-4">
                    {/* Bouton pour fermer la sidebar (visible uniquement en mode mobile) */}
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