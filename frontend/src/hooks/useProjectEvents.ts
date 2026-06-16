'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

type EventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'member.added'
  | 'member.removed'

type ProjectEvent = {
  type: EventType
  actorName: string
  projectId: string
}

const MESSAGES: Record<EventType, (name: string) => string> = {
  'task.created': (n) => `${n} a créé une tâche`,
  'task.updated': (n) => `${n} a mis à jour une tâche`,
  'task.deleted': (n) => `${n} a supprimé une tâche`,
  'member.added': (n) => `${n} a ajouté un membre`,
  'member.removed': (n) => `${n} a retiré un membre`,
}

export function useProjectEvents(projectId: string, currentUserName?: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const es = new EventSource(
      `http://localhost:3000/projects/${projectId}/events`,
      { withCredentials: true }
    )

    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as ProjectEvent
      if (event.actorName === currentUserName) return

      if (event.type.startsWith('task.')) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      }

      const msg = MESSAGES[event.type]?.(event.actorName)
      if (msg) toast(msg)
    }

    return () => es.close()
  }, [projectId, currentUserName, queryClient])
}
