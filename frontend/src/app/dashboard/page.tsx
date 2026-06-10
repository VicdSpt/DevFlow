'use client'

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export default function DashboardPage() {

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get("/projects").then(res => res.data.data)
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
          <span className="text-purple-400 font-bold text-lg">⚡ DevFlow</span>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
            Nouveau projet
          </button>
        </nav>
        <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-xl h-32" />
          ))}
        </main>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
          <span className="text-purple-400 font-bold text-lg">⚡ DevFlow</span>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
            Nouveau projet
          </button>
        </nav>
        <main className="p-6 flex flex-col items-center justify-center gap-4 mt-20">
          <p className="text-gray-400">Impossible de charger les projets</p>
          <button
            onClick={() => refetch()}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
          >
            Réessayer
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
        <span className="text-purple-400 font-bold text-lg">⚡ DevFlow</span>
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
          Nouveau projet
        </button>
      </nav>
    </div>
  )
}
