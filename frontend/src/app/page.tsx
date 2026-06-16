'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function HomePage() {
  const session = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session.isPending) return
    if (session.data) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [session.isPending, session.data, router])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <span className="animate-pulse text-purple-400 font-bold text-lg">⚡ DevFlow</span>
    </div>
  )
}
