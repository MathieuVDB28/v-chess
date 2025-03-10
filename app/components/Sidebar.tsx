'use client'
import Link from 'next/link';
import { useParams } from 'next/navigation'
import { User, StatsUpSquare, Puzzle, ArrowUnion } from 'iconoir-react'

export default function Sidebar() {
  const { username } = useParams()

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-sidebar text-white p-4">
      <Link href={`/`}>
        <h2 className="text-2xl font-bold text-primary text-center mt-8">v-chess</h2>
      </Link>
      <nav className="mt-10 space-y-6">
        <Link href={`/chesscom/user/${username}`} className="flex items-center space-x-3 p-2 hover:text-chart4 rounded">
          <User />
          <span>User</span>
        </Link>

        <Link href={`/chesscom/user/${username}/compare`} className="flex items-center space-x-3 p-2 hover:text-red-500 rounded">
          <ArrowUnion />
          <span>Compare</span>
        </Link>

        <Link href={`/workinginprogress`} className="flex items-center space-x-3 p-2 hover:text-primary rounded">
          <StatsUpSquare />
          <span>Stats</span>
        </Link>

        <Link href={`/workinginprogress`} className="flex items-center space-x-3 p-2 hover:text-orange-500 rounded">
          <Puzzle />
          <span>Problems</span>
        </Link>
      </nav>
    </div>
  );
}