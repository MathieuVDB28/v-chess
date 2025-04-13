'use client'
import Link from 'next/link';
import {useParams} from 'next/navigation'
import {User, Reports, ArcheryMatch, TriangleFlag, UserCircle} from 'iconoir-react'
import {useSession} from "next-auth/react";

export default function Sidebar() {
    const params = useParams();
    const username = params?.username as string;
    const {data: session, status} = useSession();

    const userLink = status === "authenticated" ? '/account' : '/auth/signup';

    return (
        <div className="fixed left-0 top-0 h-screen w-60 bg-sidebar text-white p-4 flex flex-col">
            <Link href={`/`}>
                <h2 className="text-2xl font-bold text-primary text-center mt-8">v-chess</h2>
            </Link>
            <nav className="mt-10 space-y-6 flex-grow">
                <Link href={`/chesscom/user/${username}`}
                      className="flex items-center space-x-3 p-2 hover:text-chart4 rounded">
                    <User/>
                    <span>User</span>
                </Link>

                <Link href={`/chesscom/user/${username}/compare`}
                      className="flex items-center space-x-3 p-2 hover:text-red-500 rounded">
                    <ArcheryMatch/>
                    <span>Compare</span>
                </Link>

                <Link href={`/workinginprogress`}
                      className="flex items-center space-x-3 p-2 hover:text-yellow-400 rounded">
                    <TriangleFlag/>
                    <span>Goals</span>
                </Link>

                <Link href={`/workinginprogress`}
                      className="flex items-center space-x-3 p-2 hover:text-orange-500 rounded">
                    <Reports/>
                    <span>Stats</span>
                </Link>
            </nav>

            <div className="mt-auto pb-4">
                <Link href={userLink} className="flex items-center space-x-3 p-2 hover:text-primary rounded">
                    <UserCircle/>
                    <span>My account</span>
                </Link>
            </div>
        </div>
    );
}