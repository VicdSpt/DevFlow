type EventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'member.added'
  | 'member.removed'

export type ProjectEvent = {
  type: EventType
  actorName: string
  projectId: string
}

type SendFn = (payload: ProjectEvent) => void

const subscribers = new Map<string, Set<SendFn>>()

export const eventBus = {
  subscribe(projectId: string, fn: SendFn): () => void {
    if (!subscribers.has(projectId)) subscribers.set(projectId, new Set())
    subscribers.get(projectId)!.add(fn)
    return () => {
      subscribers.get(projectId)?.delete(fn)
      if (subscribers.get(projectId)?.size === 0) subscribers.delete(projectId)
    }
  },

  emit(projectId: string, payload: ProjectEvent): void {
    subscribers.get(projectId)?.forEach(fn => fn(payload))
  },
}
