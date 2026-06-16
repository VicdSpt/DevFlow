'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session.isPending && !session.data) {
      router.push('/login')
    }
  }, [session.isPending, session.data, router])

  if (session.isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="animate-pulse text-purple-400 font-bold text-lg">⚡ DevFlow</span>
      </div>
    )
  }

  if (!session.data) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
        <Link href="/dashboard" className="text-purple-400 font-bold text-lg">
          ⚡ DevFlow
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{session.data.user.email}</span>
          <Link
            href="/dashboard/new"
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Nouveau projet
          </Link>
          <button
            onClick={() => authClient.signOut().then(() => router.push('/login'))}
            className="text-gray-400 hover:text-white text-sm cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      {children}
    </div>
  )
}
