# V5 Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des index BDD, un cache Redis avec invalidation explicite, et la pagination offset sur les tâches.

**Architecture:** Un module `src/lib/cache.ts` encapsule ioredis avec fallback silencieux. Les routes `GET /projects/:id` et `GET /projects/:id/tasks` lisent depuis le cache avant d'aller en DB. Les routes d'écriture (POST/PATCH/DELETE) invalident les clés concernées. La pagination est ajoutée à `GET /projects/:id/tasks` ; le frontend passe `?limit=100` pour tout récupérer en une page.

**Tech Stack:** Hono + Prisma + PostgreSQL + ioredis (backend), Next.js + TanStack Query (frontend). Package manager: **pnpm** (jamais npm).

---

## Files

**Backend — modifiés :**
- `prisma/schema.prisma` — ajouter `@@index` sur `Task` et `ProjectMember`
- `.env` — ajouter `REDIS_URL`
- `.env.example` — ajouter `REDIS_URL`
- `src/routes/projects.ts` — cache `GET /:id`, invalidation sur `PATCH /:id` et `DELETE /:id`
- `src/routes/tasks.ts` — pagination + cache + invalidation sur toutes les mutations

**Backend — créés :**
- `src/lib/cache.ts` — wrapper ioredis : `get`, `set`, `del`, `delPattern`

**Frontend — modifié :**
- `frontend/src/app/dashboard/[id]/page.tsx` — ajouter `?limit=100` à la query des tâches

---

## Task 1: Ajouter les index Prisma

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Ajouter les @@index sur Task et ProjectMember**

Dans `prisma/schema.prisma`, mettre à jour les deux modèles :

```prisma
model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    Priority     @default(MEDIUM)
  dueDate     DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  projectId   String
  project     Project      @relation(fields: [projectId], references: [id])
  assigneeId  String?
  assignee    User?        @relation(fields: [assigneeId], references: [id])

  @@index([projectId])
  @@index([projectId, status])
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}
```

- [ ] **Step 2: Appliquer les index en base**

```bash
pnpm prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "perf: add DB indexes on Task.projectId and ProjectMember.userId"
```

---

## Task 2: Installer ioredis et créer le module cache

**Files:**
- Create: `src/lib/cache.ts`
- Modify: `.env`, `.env.example`

- [ ] **Step 1: Installer ioredis**

```bash
pnpm add ioredis
```

Expected output: `dependencies: + ioredis x.x.x`

- [ ] **Step 2: Ajouter REDIS_URL dans .env**

Ajouter à la fin de `.env` :

```
REDIS_URL=redis://localhost:6379
```

- [ ] **Step 3: Ajouter REDIS_URL dans .env.example**

Ajouter à la fin de `.env.example` :

```
REDIS_URL=redis://localhost:6379
```

- [ ] **Step 4: Créer `src/lib/cache.ts`**

```ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('error', (err) => {
  console.warn('[cache] Redis error:', err.message)
})

export const cache = {
  async get(key: string): Promise<unknown | null> {
    try {
      const val = await redis.get(key)
      return val ? JSON.parse(val) : null
    } catch {
      return null
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch {
      // fallback silencieux si Redis indisponible
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch {
      // fallback silencieux
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(keys)
    } catch {
      // fallback silencieux
    }
  },
}
```

- [ ] **Step 5: Vérifier que Redis tourne en local**

```bash
redis-cli ping
```

Expected output: `PONG`

Si Redis n'est pas installé :
- Windows : télécharger [Redis for Windows](https://github.com/microsoftarchive/redis/releases) ou utiliser `winget install Redis.Redis`
- Puis démarrer : `redis-server`

- [ ] **Step 6: Commit**

```bash
git add src/lib/cache.ts .env.example package.json pnpm-lock.yaml
git commit -m "feat: add ioredis cache module with silent fallback"
```

---

## Task 3: Cacher GET /projects/:id et invalider sur PATCH/DELETE

**Files:**
- Modify: `src/routes/projects.ts`

Clé de cache : `project:${projectId}` — stocke uniquement les données du projet (sans `userRole` qui est user-specific). On ajoute `userRole` depuis `auth.member.role` au moment de la réponse.

- [ ] **Step 1: Ajouter l'import de cache**

En haut de `src/routes/projects.ts`, ajouter après les imports existants :

```ts
import { cache } from '../lib/cache'
```

- [ ] **Step 2: Mettre à jour GET /:id avec le cache**

Remplacer `projects.get("/:id", ...)` par :

```ts
projects.get("/:id", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const cacheKey = `project:${id}`
  const cached = await cache.get(cacheKey)
  if (cached) return c.json({ data: { ...(cached as object), userRole: auth.member.role } })

  const project = await db.project.findUnique({ where: { id } })
  if (!project)
    return c.json({ error: { code: "NOT_FOUND", message: "Project not found" } }, 404)

  await cache.set(cacheKey, project, 300)
  return c.json({ data: { ...project, userRole: auth.member.role } })
})
```

- [ ] **Step 3: Invalider le cache sur PATCH /:id**

Remplacer `projects.patch("/:id", ...)` par :

```ts
projects.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  const body = await c.req.json()
  const result = UpdateProjectSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 422)
  }
  const project = await db.project.update({ where: { id }, data: result.data })
  await cache.del(`project:${id}`)
  return c.json({ data: project })
})
```

- [ ] **Step 4: Invalider le cache sur DELETE /:id**

Remplacer `projects.delete("/:id", ...)` par :

```ts
projects.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  await db.project.update({ where: { id }, data: { status: 'DELETED' } })
  await cache.del(`project:${id}`)
  return c.body(null, 204)
})
```

- [ ] **Step 5: Commit**

```bash
git add src/routes/projects.ts
git commit -m "perf: cache GET /projects/:id with Redis, invalidate on write"
```

---

## Task 4: Pagination + cache sur GET /projects/:id/tasks

**Files:**
- Modify: `src/routes/tasks.ts`

Clés de cache : `tasks:${projectId}:${page}:${limit}`. Sur toute écriture (POST/PATCH/DELETE), on invalide toutes les clés `tasks:${projectId}:*` via `delPattern`.

- [ ] **Step 1: Ajouter l'import de cache**

En haut de `src/routes/tasks.ts`, ajouter après les imports existants :

```ts
import { cache } from '../lib/cache'
```

- [ ] **Step 2: Réécrire GET / avec pagination et cache**

Remplacer `tasks.get("/", ...)` par :

```ts
tasks.get("/", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)))

  const cacheKey = `tasks:${id}:${page}:${limit}`
  const cached = await cache.get(cacheKey)
  if (cached) return c.json(cached)

  const skip = (page - 1) * limit
  const [taskList, total] = await Promise.all([
    db.task.findMany({
      where: { projectId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.task.count({ where: { projectId: id } }),
  ])

  const response = {
    data: taskList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }

  await cache.set(cacheKey, response, 300)
  return c.json(response)
})
```

- [ ] **Step 3: Invalider le cache dans POST /**

Remplacer `tasks.post("/", ...)` par :

```ts
tasks.post("/", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const body = await c.req.json()
  const result = CreateTaskSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 422)
  const task = await db.task.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      priority: result.data.priority,
      dueDate: result.data.dueDate,
      projectId: id,
    },
  })
  await cache.delPattern(`tasks:${id}:*`)
  return c.json({ data: task }, 201)
})
```

- [ ] **Step 4: Invalider le cache dans PATCH /:taskId**

Remplacer `tasks.patch("/:taskId", ...)` par :

```ts
tasks.patch("/:taskId", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const taskId = c.req.param("taskId")
  const body = await c.req.json()
  const result = UpdateTaskSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 422)
  const task = await db.task.update({ where: { id: taskId }, data: result.data })
  await cache.delPattern(`tasks:${id}:*`)
  return c.json({ data: task })
})
```

- [ ] **Step 5: Invalider le cache dans DELETE /:taskId**

Remplacer `tasks.delete("/:taskId", ...)` par :

```ts
tasks.delete("/:taskId", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const taskId = c.req.param("taskId")
  await db.task.update({ where: { id: taskId }, data: { status: "ARCHIVED" } })
  await cache.delPattern(`tasks:${id}:*`)
  return c.body(null, 204)
})
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/tasks.ts
git commit -m "perf: add pagination and Redis cache to GET /projects/:id/tasks"
```

---

## Task 5: Mettre à jour le frontend

**Files:**
- Modify: `frontend/src/app/dashboard/[id]/page.tsx`

Le format de réponse de `GET /projects/:id/tasks` change : `{ data: [...], pagination: {...} }`. `res.data.data` retourne toujours le tableau de tâches — aucun changement de typage nécessaire. Il faut juste ajouter `?limit=100` pour récupérer toutes les tâches en une seule page.

- [ ] **Step 1: Ajouter ?limit=100 à la query des tâches**

Dans `frontend/src/app/dashboard/[id]/page.tsx`, remplacer :

```ts
queryFn: () => api.get(`/projects/${id}/tasks`).then(res => res.data.data),
```

par :

```ts
queryFn: () => api.get(`/projects/${id}/tasks?limit=100`).then(res => res.data.data),
```

- [ ] **Step 2: Vérifier en navigateur**

Avec backend + frontend démarrés :
1. Ouvrir un projet — les tâches doivent s'afficher normalement
2. Créer une tâche — doit apparaître immédiatement (invalidation cache)
3. Changer le statut d'une tâche — doit se mettre à jour (invalidation cache)
4. Recharger la page — les tâches reviennent (cache Redis servi, voir logs backend)

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/dashboard/[id]/page.tsx"
git commit -m "feat: pass ?limit=100 to tasks query for paginated API"
```

---

## Self-review

**Spec coverage :**
- Index BDD sur Task et ProjectMember (Task 1) ✅
- Module cache ioredis avec fallback silencieux (Task 2) ✅
- REDIS_URL dans .env (Task 2) ✅
- Cache GET /projects/:id avec clé user-agnostique (Task 3) ✅
- Invalidation projet sur PATCH/DELETE (Task 3) ✅
- Pagination offset + cache sur GET /projects/:id/tasks (Task 4) ✅
- Invalidation tâches sur POST/PATCH/DELETE (Task 4) ✅
- Frontend mis à jour avec ?limit=100 (Task 5) ✅

**Placeholder scan :** Aucun TBD, toutes les étapes ont du code exact. ✅

**Type consistency :**
- `cache.get` retourne `unknown | null`, casté en `object` dans GET /projects/:id (Task 3) ✅
- `cache.delPattern('tasks:${id}:*')` utilisé de façon identique dans POST/PATCH/DELETE tasks (Tasks 4) ✅
- Clé `project:${id}` utilisée de façon cohérente dans GET, PATCH, DELETE projects (Task 3) ✅
- `cacheKey = tasks:${id}:${page}:${limit}` correspond au pattern `tasks:${id}:*` utilisé dans delPattern (Task 4) ✅
