# V5 Performance — Design Spec

**Date:** 2026-06-16
**Scope:** Ajouter des index BDD, une couche cache Redis (ioredis), et la pagination offset sur les tâches.

---

## 1. Index base de données

Ajout d'index Prisma sur les colonnes fréquemment filtrées :

```prisma
model Task {
  @@index([projectId])
  @@index([projectId, status])
}

model ProjectMember {
  @@index([userId])
}
```

- `Task.projectId` : utilisé dans chaque `GET /projects/:id/tasks`
- `Task.[projectId, status]` : préparation pour les filtres par statut futurs
- `ProjectMember.userId` : utilisé dans `GET /projects` (filtre par membership)

Après modification : `pnpm prisma db push` applique les index en base.

---

## 2. Couche cache Redis

### Client

Librairie : `ioredis`. Connexion via variable d'environnement `REDIS_URL` (défaut : `redis://localhost:6379`).

Module `src/lib/cache.ts` exposant trois fonctions :

```ts
get(key: string): Promise<unknown | null>
set(key: string, value: unknown, ttlSeconds: number): Promise<void>
del(key: string): Promise<void>
```

Les valeurs sont sérialisées en JSON. TTL de sécurité : **300 secondes** (5 minutes).

### Clés de cache

| Clé | Route | Invalidé par |
|---|---|---|
| `project:{projectId}` | GET /projects/:id | PATCH /projects/:id, DELETE /projects/:id |
| `tasks:{projectId}:page:{page}:limit:{limit}` | GET /projects/:id/tasks | POST/PATCH/DELETE /projects/:id/tasks/:taskId (invalide toutes les clés `tasks:{projectId}:*`) |

`GET /projects` (liste) n'est pas mis en cache — données par utilisateur + mises à jour fréquentes avec le RBAC.

### Pattern dans les routes

```ts
// Lecture avec cache
const cached = await cache.get(`tasks:${id}`)
if (cached) return c.json({ data: cached })
const tasks = await db.task.findMany(...)
await cache.set(`tasks:${id}`, tasks, 300)
return c.json({ data: tasks })

// Invalidation sur écriture
await cache.del(`tasks:${id}`)
```

### Dépendance optionnelle

Si Redis est indisponible au démarrage, le backend doit continuer à fonctionner (fallback silencieux vers la DB). Le module `cache.ts` wrappera les appels dans un try/catch.

---

## 3. Pagination des tâches

### API

`GET /projects/:id/tasks?page=1&limit=20`

- `page` : entier ≥ 1, défaut `1`
- `limit` : entier entre 1 et 100, défaut `20`

### Format de réponse

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

### Implémentation Prisma

```ts
const skip = (page - 1) * limit
const [tasks, total] = await Promise.all([
  db.task.findMany({ where: { projectId: id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
  db.task.count({ where: { projectId: id } }),
])
```

### Frontend

Le frontend appelle `GET /projects/:id/tasks?limit=100` (toutes les tâches en une page). Pas de UI de pagination pour l'instant — l'API est prête si besoin. La clé de cache inclut les params : `tasks:{projectId}:page:{page}:limit:{limit}`.

---

## 4. Variables d'environnement

Ajouter dans `.env` :

```
REDIS_URL=redis://localhost:6379
```

---

## 5. Ordre d'implémentation

1. Ajouter les index Prisma + `pnpm prisma db push`
2. Installer `ioredis` + créer `src/lib/cache.ts`
3. Ajouter `REDIS_URL` dans `.env`
4. Mettre en cache `GET /projects/:id` + invalidation sur PATCH/DELETE
5. Ajouter pagination à `GET /projects/:id/tasks` + mise en cache paginée + invalidation
6. Mettre à jour le frontend pour passer `?limit=100`
