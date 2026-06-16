'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Project, Task, TaskStatus } from '@/types/project'

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminé',
  BLOCKED: 'Bloqué',
  ARCHIVED: 'Archivé',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-gray-500/20 text-gray-400',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  DONE: 'bg-green-500/20 text-green-400',
  BLOCKED: 'bg-red-500/20 text-red-400',
  ARCHIVED: 'bg-gray-500/20 text-gray-500',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTask, setShowNewTask] = useState(false)

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(res => res.data.data),
  })

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/projects/${id}/tasks`).then(res => res.data.data),
  })

  const createTask = useMutation({
    mutationFn: (title: string) =>
      api.post(`/projects/${id}/tasks`, { title }).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      setNewTaskTitle('')
      setShowNewTask(false)
    },
  })

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api.patch(`/projects/${id}/tasks/${taskId}`, { status }).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
    },
  })

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push('/dashboard')
    },
  })

  if (projectLoading || tasksLoading) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-800 rounded w-72 mb-8" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-800 rounded-xl mb-3" />
          ))}
        </div>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="p-6 flex flex-col items-center justify-center gap-4 mt-20">
        <p className="text-gray-400">Projet introuvable</p>
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 text-sm">
          ← Retour au dashboard
        </Link>
      </main>
    )
  }

  const activeTasks = tasks.filter(t => t.status !== 'ARCHIVED')

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* En-tête projet */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-400 text-sm mb-2 block">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded ${
            project.status === 'ACTIVE'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {project.status}
          </span>
          <button
            onClick={() => {
              if (confirm('Supprimer ce projet ?')) deleteProject.mutate()
            }}
            className="text-red-400 hover:text-red-300 text-sm cursor-pointer"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* En-tête tâches */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Tâches <span className="text-gray-500 font-normal text-sm">({activeTasks.length})</span>
        </h2>
        <button
          onClick={() => setShowNewTask(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire nouvelle tâche */}
      {showNewTask && (
        <div className="bg-gray-900 border border-purple-500/50 rounded-xl p-4 mb-3 flex gap-3">
          <input
            autoFocus
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTaskTitle.trim()) createTask.mutate(newTaskTitle.trim())
              if (e.key === 'Escape') { setShowNewTask(false); setNewTaskTitle('') }
            }}
            placeholder="Titre de la tâche..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
          />
          <button
            onClick={() => { if (newTaskTitle.trim()) createTask.mutate(newTaskTitle.trim()) }}
            disabled={!newTaskTitle.trim() || createTask.isPending}
            className="text-purple-400 hover:text-purple-300 text-sm disabled:opacity-50 cursor-pointer"
          >
            {createTask.isPending ? '...' : 'Ajouter'}
          </button>
          <button
            onClick={() => { setShowNewTask(false); setNewTaskTitle('') }}
            className="text-gray-500 hover:text-gray-400 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Liste des tâches */}
      {activeTasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>Aucune tâche pour l'instant</p>
          <button
            onClick={() => setShowNewTask(true)}
            className="text-purple-400 hover:text-purple-300 text-sm mt-2 cursor-pointer"
          >
            Créer la première tâche →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeTasks.map(task => (
            <div
              key={task.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-700"
            >
              <span className={`text-white ${task.status === 'DONE' ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </span>
              <select
                value={task.status}
                onChange={e => updateTaskStatus.mutate({ taskId: task.id, status: e.target.value as TaskStatus })}
                className={`text-xs px-2 py-1 rounded border-0 cursor-pointer outline-none ${STATUS_COLORS[task.status]} bg-transparent`}
              >
                {(Object.keys(STATUS_LABELS) as TaskStatus[])
                  .filter(s => s !== 'ARCHIVED')
                  .map(s => (
                    <option key={s} value={s} className="bg-gray-900 text-white">
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
