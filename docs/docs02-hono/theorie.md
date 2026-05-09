# Hono — Théorie

## Qu'est-ce que Hono ?

Hono est un framework web minimaliste pour TypeScript/JavaScript, conçu pour être ultra-rapide et léger.

```
Express  →  le standard historique, lourd, pas typé nativement
Fastify  →  plus rapide qu'Express, bonne typage
Hono     →  le plus rapide, TypeScript natif, multi-runtime
```

**Multi-runtime** signifie que le même code Hono tourne sur :
- Node.js
- Bun
- Deno
- Cloudflare Workers
- ...

Dans DevFlow on utilise Node.js via `@hono/node-server`.

---

## Pourquoi Hono et pas Express ?

| | Express | Hono |
|---|---|---|
| TypeScript | Ajout manuel | Natif |
| Performance | Correct | Excellent |
| Taille | ~200kb | ~14kb |
| Validation types | Non | Oui |
| Moderne | Non | Oui |

---

## Concepts fondamentaux

### L'instance app

```typescript
import { Hono } from 'hono'

const app = new Hono()
```

`app` est le cœur de l'application. Tout passe par lui :
- Les routes
- Les middlewares
- La configuration

---

### Les routes

Une route = une méthode HTTP + un chemin + un handler.

```typescript
app.get('/projects', (c) => {
  return c.json({ data: [] })
})

app.post('/projects', (c) => {
  return c.json({ data: {} }, 201)
})

app.patch('/projects/:id', (c) => {
  return c.json({ data: {} })
})

app.delete('/projects/:id', (c) => {
  return c.body(null, 204)
})
```

---

### Le contexte `c`

`c` (contexte) est l'objet central dans chaque handler. Il donne accès à tout.

**Lire la requête :**
```typescript
// Paramètres d'URL (/projects/:id)
const id = c.req.param('id')

// Query string (/projects?status=ACTIVE)
const status = c.req.query('status')

// Body JSON
const body = await c.req.json()

// Headers
const auth = c.req.header('Authorization')
```

**Envoyer une réponse :**
```typescript
// JSON (le plus courant)
return c.json({ data: project })

// JSON avec status code
return c.json({ data: project }, 201)

// Pas de body (DELETE)
return c.body(null, 204)

// Texte brut
return c.text('Hello')
```

---

### Les paramètres d'URL

```typescript
app.get('/projects/:id', (c) => {
  const id = c.req.param('id')
  // id contient la valeur de l'URL
  // GET /projects/abc123 → id = "abc123"
  return c.json({ id })
})
```

Les `:id` dans le chemin sont des **paramètres dynamiques**.

---

### Le routing imbriqué

Pour organiser les routes par ressource, Hono propose `app.route()` :

```typescript
// routes/projects.ts
import { Hono } from 'hono'

const projects = new Hono()

projects.get('/', (c) => c.json({ data: [] }))
projects.post('/', (c) => c.json({ data: {} }, 201))

export default projects

// routes/index.ts
import { Hono } from 'hono'
import projects from './projects'

const router = new Hono()
router.route('/projects', projects)

export default router
```

Ainsi chaque fichier de routes ne connaît que ses propres chemins.

---

### Les middlewares

Un middleware est une fonction qui s'exécute **avant** le handler de la route.

```typescript
// Middleware global (s'applique à toutes les routes)
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`)
  await next() // passe au handler suivant
})

// Middleware sur une route précise
app.use('/projects/*', authMiddleware)
```

Cas d'usage : logging, authentification, CORS, validation...

---

### Gestion d'erreurs

Hono fournit un handler d'erreurs global :

```typescript
app.onError((err, c) => {
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  }, 500)
})
```

---

## Structure typique d'un projet Hono

```
src/
├── index.ts          ← démarre le serveur (serve + app)
├── routes/
│   ├── index.ts      ← enregistre toutes les routes
│   ├── projects.ts   ← routes /projects
│   └── tasks.ts      ← routes /projects/:id/tasks
├── middleware/
│   └── errorHandler.ts
├── db/
│   └── client.ts     ← instance Prisma
└── validators/
    └── project.ts    ← schémas Zod
```

---

## Ce qu'on retient

- Hono = framework minimaliste, TypeScript natif, ultra-rapide
- `app` = l'instance centrale
- `c` = le contexte (requête + réponse)
- Les routes suivent le pattern : méthode + chemin + handler
- `app.route()` permet d'organiser les routes par fichier
