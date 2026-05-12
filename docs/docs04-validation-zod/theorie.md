# Validation & Zod — Théorie

## Pourquoi valider les données ?

Quand un client envoie une requête, on ne peut pas lui faire confiance.

```
POST /projects
{ "name": "" }              ← name vide, valide pour TypeScript, invalide pour nous
{ "status": "INVALID" }     ← valeur qui n'existe pas dans l'enum
{}                          ← body vide, name manquant
{ "name": true }            ← mauvais type
```

Sans validation, ces requêtes atteignent Prisma et causent des erreurs imprévues ou corrompent les données.

**La validation doit se faire à la frontière du système** — dès que les données entrent, avant de toucher la BDD.

---

## Qu'est-ce que Zod ?

Zod est une bibliothèque de validation et de parsing TypeScript-first.

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  status: z.enum(['ACTIVE', 'ARCHIVED'])
})

const result = schema.parse(data)
// Si valid  → retourne les données typées
// Si invalid → lance une ZodError avec les détails
```

---

## Définir un schéma

### Types de base

```typescript
z.string()          // string
z.number()          // number
z.boolean()         // boolean
z.date()            // Date
z.enum(['A', 'B'])  // valeur parmi une liste
```

### Modificateurs

```typescript
z.string().min(1)           // au moins 1 caractère
z.string().max(100)         // au plus 100 caractères
z.string().email()          // format email valide
z.string().optional()       // champ optionnel (undefined autorisé)
z.string().nullable()       // null autorisé
z.number().int()            // entier uniquement
z.number().positive()       // positif uniquement
```

### Objets

```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
})
```

### Pour les PATCH — tous les champs optionnels

```typescript
const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
})
```

---

## Parse vs safeParse

### parse — lance une erreur si invalide

```typescript
const data = schema.parse(body)
// Si invalide → ZodError
```

### safeParse — retourne un résultat sans lancer d'erreur

```typescript
const result = schema.safeParse(body)

if (!result.success) {
  return c.json({ error: result.error.flatten() }, 422)
}

const data = result.data // typé et validé
```

`safeParse` est préférable dans les routes HTTP — on contrôle la réponse d'erreur.

---

## Inférer le type TypeScript depuis le schéma

```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

type CreateProjectInput = z.infer<typeof CreateProjectSchema>
// équivalent à :
// { name: string; description?: string }
```

Plus besoin de définir le type manuellement — Zod le génère.

---

## Exemple complet dans une route Hono

```typescript
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
})

projects.post('/', async (c) => {
  const body = await c.req.json()

  const result = CreateProjectSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 422)
  }

  const project = await db.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      ownerId: 'temp-user-id'
    }
  })

  return c.json({ data: project }, 201)
})
```

---

## Organisation des schémas

Dans DevFlow, les schémas Zod sont dans `src/validators/` :

```
src/validators/
├── project.ts   ← CreateProjectSchema, UpdateProjectSchema
└── task.ts      ← CreateTaskSchema, UpdateTaskSchema
```

Séparer les schémas des routes permet de les réutiliser et de les tester indépendamment.

---

## Ce qu'on retient

- Toujours valider les données à l'entrée — ne jamais faire confiance au client
- Zod définit la forme attendue des données et génère les types TypeScript
- `safeParse` est préférable dans les routes HTTP
- Les schémas `Update` ont tous les champs optionnels (PATCH = modification partielle)
- Placer les schémas dans `src/validators/` pour les réutiliser
