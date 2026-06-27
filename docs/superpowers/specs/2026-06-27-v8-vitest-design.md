# V8 Vitest — Design Spec

**Date:** 2026-06-27
**Scope:** Tests unitaires et d'intégration avec Vitest — backend (routes `tasks` + `members`, PostgreSQL de test) et frontend (composants `FileUpload`, `FileList`, `TaskFilesSection` + hooks `useFiles`).

---

## 1. Architecture globale

Deux suites Vitest indépendantes :

- **Backend** : `vitest.config.ts` à la racine, tests dans `src/__tests__/`
- **Frontend** : `frontend/vitest.config.ts`, tests dans `frontend/src/__tests__/`

### Dépendances à installer

**Backend (racine) :**
```
vitest @vitest/coverage-v8 dotenv
```

**Frontend (`frontend/`) :**
```
vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

---

## 2. Backend

### 2.1 Configuration

**`vitest.config.ts`** (racine) :
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
  },
})
```

**`.env.test`** (racine) :
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devflow_test
```

Script `package.json` :
```json
"test": "dotenv -e .env.test -- vitest run",
"test:watch": "dotenv -e .env.test -- vitest"
```

**`src/__tests__/setup.ts`** : s'assure que le schéma est appliqué à `devflow_test` via `prisma db push --skip-generate` au démarrage de la suite.

### 2.2 Helpers

**`src/__tests__/helpers/testApp.ts`**

Factory qui wrap un router Hono avec un middleware d'injection d'utilisateur, évitant d'avoir à gérer les sessions Better Auth dans les tests :

```ts
import { Hono } from 'hono'

type TestUser = { id: string; email: string; name?: string | null }

export function createTestApp(router: Hono, user: TestUser, paramId?: string) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })
  // Monte le router sous /projects/:id/... pour que c.req.param('id') fonctionne
  if (paramId) {
    app.route(`/projects/${paramId}`, router)
  } else {
    app.route('/', router)
  }
  return app
}
```

**`src/__tests__/helpers/seed.ts`**

Seed + cleanup sur `devflow_test` :

```ts
import { db } from '../../db/client'

export type TestContext = {
  user: { id: string; email: string; name: string }
  project: { id: string; name: string }
  member: { id: string; role: string }
}

export async function seed(): Promise<TestContext> {
  const user = await db.user.create({
    data: { email: 'test@devflow.test', name: 'Test User', emailVerified: false },
  })
  const project = await db.project.create({
    data: {
      name: 'Test Project',
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  })
  const member = await db.projectMember.findUniqueOrThrow({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  })
  return { user, project, member }
}

export async function cleanup(): Promise<void> {
  await db.attachment.deleteMany()
  await db.task.deleteMany()
  await db.projectMember.deleteMany()
  await db.project.deleteMany()
  await db.account.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()
}
```

### 2.3 `src/__tests__/routes/tasks.test.ts`

Cas couverts :

| Test | Attendu |
|---|---|
| `GET /` — VIEWER peut lister | 200 `{ data: [] }` |
| `POST /` — MEMBER crée une tâche | 201 avec `title` |
| `POST /` — VIEWER refusé | 403 |
| `POST /` — body vide | 422 |
| `GET /` — paginer avec `?limit=2` | 200 avec ≤ 2 résultats |
| `PATCH /:taskId` — MEMBER change le statut | 200 avec nouveau statut |
| `PATCH /:taskId` — VIEWER refusé | 403 |
| `PATCH /:taskId` — tâche inexistante | 404 |
| `DELETE /:taskId` — OWNER supprime | 204 |
| `DELETE /:taskId` — MEMBER refusé | 403 |

Pattern de test :
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import tasks from '../../../routes/tasks'
import { seed, cleanup, TestContext } from '../helpers/seed'
import { createTestApp } from '../helpers/testApp'

describe('tasks routes', () => {
  let ctx: TestContext

  beforeEach(async () => {
    await cleanup()
    ctx = await seed()
  })

  it('GET / — liste vide pour VIEWER', async () => {
    // Créer un user VIEWER
    const viewer = await db.user.create({ data: { email: 'viewer@test.com', emailVerified: false } })
    await db.projectMember.create({ data: { projectId: ctx.project.id, userId: viewer.id, role: 'VIEWER' } })
    const app = createTestApp(tasks, viewer, ctx.project.id)
    const res = await app.request(`/projects/${ctx.project.id}/tasks`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('POST / — OWNER crée une tâche', async () => {
    const app = createTestApp(tasks, ctx.user, ctx.project.id)
    const res = await app.request(`/projects/${ctx.project.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Ma tâche' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.title).toBe('Ma tâche')
  })

  // ... autres cas
})
```

### 2.4 `src/__tests__/routes/members.test.ts`

Cas couverts :

| Test | Attendu |
|---|---|
| `GET /` — VIEWER liste les membres | 200 avec OWNER dans la liste |
| `POST /` — OWNER ajoute un membre (MEMBER) | 201 |
| `POST /` — VIEWER refusé | 403 |
| `POST /` — email inconnu | 404 |
| `POST /` — doublon | 409 |
| `PATCH /:userId` — OWNER change le rôle | 200 |
| `PATCH /:userId` — MEMBER refusé | 403 |
| `DELETE /:userId` — OWNER retire un membre | 204 |
| `DELETE /:userId` — MEMBER refusé | 403 |

---

## 3. Frontend

### 3.1 Configuration

**`frontend/vitest.config.ts`** :
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**`frontend/src/__tests__/setup.ts`** :
```ts
import '@testing-library/jest-dom'
```

Script dans `frontend/package.json` :
```json
"test": "vitest run",
"test:watch": "vitest"
```

### 3.2 Tests composants

**`frontend/src/__tests__/components/FileUpload.test.tsx`**

Cas couverts :
- Affiche le bouton "📎 Joindre un fichier"
- Sélectionner un fichier valide (< 10 Mo) → appelle `onUpload` avec le fichier
- Sélectionner un fichier > 10 Mo → affiche "Fichier trop lourd (max 10 Mo)", n'appelle pas `onUpload`
- `isUploading: true` → bouton affiche "Envoi..." et est disabled

**`frontend/src/__tests__/components/FileList.test.tsx`**

Cas couverts :
- `files: []` → affiche "Aucun fichier joint"
- `files: [mockFile]` → affiche `originalName`, taille formatée, date
- `canDelete: true` → bouton Supprimer visible, click → appelle `onDelete(file.id)`
- `canDelete: false` → bouton Supprimer absent
- `canUpload: true` → zone FileUpload visible
- `canUpload: false` → zone FileUpload absente

**`frontend/src/__tests__/components/TaskFilesSection.test.tsx`**

Cas couverts :
- Collapsed par défaut → liste non visible
- Clic sur le titre → expand → `useTaskFiles` appelé avec `enabled: true`
- Re-clic → collapse

Pattern composant (hooks mockés) :
```tsx
vi.mock('@/hooks/useFiles', () => ({
  useTaskFiles: vi.fn(() => ({ data: [] })),
  useUploadTaskFile: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteTaskFile: vi.fn(() => ({ mutate: vi.fn() })),
}))
```

### 3.3 Tests hooks

**`frontend/src/__tests__/hooks/useFiles.test.ts`**

`api` mocké via `vi.mock('@/lib/api')`. Tests avec `renderHook` + `QueryClientProvider` wrapper.

Cas couverts :
- `useProjectFiles` : envoie `GET /projects/:id/files`, retourne `data.data`
- `useUploadProjectFile` : envoie `POST /projects/:id/files` avec `FormData`, invalide la query `['files', 'project', id]` après succès
- `useDeleteProjectFile` : envoie `DELETE /projects/:id/files/:fileId`, invalide la query
- `useTaskFiles` : respecte l'option `enabled: false` (ne fait pas de requête)

---

## 4. Ordre d'implémentation

1. Config backend (vitest.config.ts, .env.test, scripts package.json)
2. Helpers backend (setup.ts, testApp.ts, seed.ts)
3. `tasks.test.ts`
4. `members.test.ts`
5. Config frontend (vitest.config.ts, setup.ts, scripts)
6. `FileUpload.test.tsx` + `FileList.test.tsx`
7. `TaskFilesSection.test.tsx` + `useFiles.test.ts`
