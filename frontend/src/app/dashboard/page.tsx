'use client'

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Project } from "@/types/project"

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  MEMBER: 'Membre',
  VIEWER: 'Lecteur',
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-500/20 text-purple-400',
  MEMBER: 'bg-blue-500/20 text-blue-400',
  VIEWER: 'bg-gray-500/20 text-gray-400',
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get("/projects").then(res => res.data.data),
  })

  if (isLoading) {
    return (
      <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 rounded-xl h-32" />
        ))}
      </main>
    )
  }

  if (isError) {
    return (
      <main className="p-6 flex flex-col items-center justify-center gap-4 mt-20">
        <p className="text-gray-400">Impossible de charger les projets</p>
        <button
          onClick={() => refetch()}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
        >
          Réessayer
        </button>
      </main>
    )
  }

  if (!data || data.length === 0) {
    return (
      <main className="p-6 flex flex-col items-center justify-center gap-4 mt-20">
        <span className="text-5xl">📁</span>
        <h1 className="text-2xl font-bold">Bienvenue sur DevFlow</h1>
        <p className="text-gray-400">Organisez vos projets et suivez vos tâches en un seul endroit</p>
        <Link
          href="/dashboard/new"
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Créer mon premier projet
        </Link>
      </main>
    )
  }

  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((project) => (
        <Link
          key={project.id}
          href={`/dashboard/${project.id}`}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 block"
        >
          <div className="flex justify-between items-start mb-2">
            <h2 className="font-bold text-white">{project.name}</h2>
            <div className="flex items-center gap-2">
              {project.userRole && (
                <span className={`text-xs px-2 py-1 rounded ${ROLE_COLORS[project.userRole]}`}>
                  {ROLE_LABELS[project.userRole]}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded ${
                project.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
          {project.description && (
            <p className="text-sm text-gray-400">{project.description}</p>
          )}
        </Link>
      ))}
      <Link
        href="/dashboard/new"
        className="border-2 border-dashed border-gray-700 hover:border-purple-500 hover:text-purple-400 rounded-xl p-5 flex items-center justify-center text-gray-500 min-h-28"
      >
        + Nouveau projet
      </Link>
    </main>
  )
}
