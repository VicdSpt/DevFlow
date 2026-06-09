'use client'

import { useQuery } from "@tanstack/react-query"
import {api} from "@/lib/api"

export default function DashboardPage() {

  const {data, isLoading, isError} = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get("/projects").then(res => res.data.data)
  })
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
        <span className="text-purple-400 font-bold text-lg">⚡ DevFlow</span>
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
          Nouveau projet
        </button>
      </nav>
      <main className="p-6">
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <p>Chargement...</p>
      </main>
    </div>
  )
}
