'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export default function RegisterPage() {
  const session = authClient.useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session.isPending && session.data) {
      router.replace('/dashboard')
    }
  }, [session.isPending, session.data, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const result = await authClient.signUp.email({ name, email, password })
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error.message ?? "Erreur lors de l'inscription")
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-white text-xl font-bold mb-6 text-center">⚡ DevFlow</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom"
            type="text"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg py-2 font-medium cursor-pointer"
          >
            {isSubmitting ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-4">
          {"Déjà un compte ? "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
