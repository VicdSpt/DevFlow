# V6 Real-time — Design Spec

**Date:** 2026-06-16
**Scope:** Notifications live (SSE) quand une tâche est créée/modifiée/supprimée ou qu'un membre est ajouté/retiré. Toast + invalidation TanStack Query pour tous les membres connectés au projet.

---

## 1. Mécanisme de transport : SSE (Server-Sent Events)

Connexion HTTP persistante unidirectionnelle (serveur → client). Avantages :
- Support natif Hono (`streamSSE`)
- `EventSource` natif navigateur, zéro lib côté client
- Auto-reconnect intégré
- Cookies envoyés automatiquement → auth transparente
- Pas de handshake WS, pas de dépendance supplémentaire backend

---

## 2. Backend

### 2.1 EventBus — `src/lib/eventBus.ts`

Pub/sub en mémoire, pas de Redis (single-server dev).

```ts
type EventPayload = {
  type: 'task.created' | 'task.updated' | 'task.deleted' | 'member.added' | 'member.removed'
  actorName: string
  projectId: string
}

type SendFn = (payload: EventPayload) => void

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
  emit(projectId: string, payload: EventPayload): void {
    subscribers.get(projectId)?.forEach(fn => fn(payload))
  },
}
```

### 2.2 Route SSE — `src/routes/events.ts`

`GET /projects/:id/events`

- Auth : `authMiddleware` (déjà sur `/projects/*`) + `requireProjectRole(c, id, 'VIEWER')`
- Ouvre un stream SSE via `streamSSE` de Hono
- S'abonne au bus pour ce `projectId`
- Heartbeat toutes les 30s (commentaire SSE `: heartbeat`) pour maintenir la connexion
- Unsubscribe automatique à la fermeture du stream

### 2.3 Émission d'événements dans les routes existantes

Après chaque opération d'écriture réussie, appel `eventBus.emit(projectId, event)` :

| Route | Type d'événement |
|---|---|
| POST /projects/:id/tasks | `task.created` |
| PATCH /projects/:id/tasks/:taskId | `task.updated` |
| DELETE /projects/:id/tasks/:taskId | `task.deleted` |
| POST /projects/:id/members | `member.added` |
| DELETE /projects/:id/members/:userId | `member.removed` |

PATCH /projects/:id/members/:userId (changement de rôle) n'émet pas d'événement — le changement de rôle n'est pas pertinent pour un toast.

`actorName` = `user.name ?? user.email` (utilisateur courant, déjà disponible via `c.get('user')`).

### 2.4 Enregistrement de la route

Dans `src/index.ts` :
```ts
import events from './routes/events'
app.route('/projects/:id/events', events)
```

---

## 3. Frontend

### 3.1 Dépendance

```
pnpm add react-hot-toast
```

### 3.2 Hook — `frontend/src/hooks/useProjectEvents.ts`

```ts
useProjectEvents(projectId: string): void
```

- Ouvre `new EventSource('/api/projects/:id/events', { withCredentials: true })`
- Sur `onmessage` :
  - Parse le JSON de l'événement
  - Si `actorName` === nom de l'utilisateur courant → ne pas afficher le toast (propre action)
  - `task.*` → `queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })`
  - `member.*` → `queryClient.invalidateQueries({ queryKey: ['members', projectId] })`
  - Affiche un toast selon le type
- Cleanup : `eventSource.close()` au unmount

### 3.3 Messages toast

| Type | Toast |
|---|---|
| `task.created` | `"{actorName} a créé une tâche"` |
| `task.updated` | `"{actorName} a mis à jour une tâche"` |
| `task.deleted` | `"{actorName} a supprimé une tâche"` |
| `member.added` | `"{actorName} a ajouté un membre"` |
| `member.removed` | `"{actorName} a retiré un membre"` |

### 3.4 Modifications de fichiers existants

- `frontend/src/app/layout.tsx` — ajouter `<Toaster position="bottom-right" />` (import react-hot-toast)
- `frontend/src/app/dashboard/[id]/page.tsx` — appeler `useProjectEvents(id)` dans le composant

---

## 4. Ordre d'implémentation

1. Créer `src/lib/eventBus.ts`
2. Créer `src/routes/events.ts` + enregistrer dans `src/index.ts`
3. Émettre les événements dans `src/routes/tasks.ts` et `src/routes/members.ts`
4. Installer `react-hot-toast` + `<Toaster />` dans `layout.tsx`
5. Créer `frontend/src/hooks/useProjectEvents.ts`
6. Brancher le hook dans `dashboard/[id]/page.tsx`
