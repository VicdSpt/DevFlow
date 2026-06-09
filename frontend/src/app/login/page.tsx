'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'


export default function LoginPage() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const result = await authClient.signIn.email({ email, password })

        if (result.error) {
            setError(result.error.message ?? 'Erreur de connexion')
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                        value={password}
                        type='password'
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg py-2 font-medium cursor-pointer">
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
    )
}
