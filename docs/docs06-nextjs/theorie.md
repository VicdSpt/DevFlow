# Next.js — Théorie

## Qu'est-ce que Next.js ?

Next.js est un framework React qui ajoute des fonctionnalités essentielles pour la production :

```
React seul     →  rendu côté client uniquement (CSR)
               →  pas de SEO, chargement initial lent

Next.js        →  rendu côté serveur (SSR)
               →  rendu statique (SSG)
               →  App Router, Server Components
               →  optimisation images, fonts, routing...
```

---

## CSR vs SSR vs SSG

```
CSR (Client Side Rendering)
→  Le navigateur télécharge du JavaScript vide
→  React s'exécute et construit la page
→  Lent au premier chargement, mauvais SEO

SSR (Server Side Rendering)
→  Le serveur génère le HTML à chaque requête
→  Le navigateur reçoit une page déjà construite
→  Rapide, bon SEO, mais charge le serveur

SSG (Static Site Generation)
→  Le HTML est généré au moment du build
→  Servi comme fichier statique
→  Ultra-rapide, parfait pour les pages qui ne changent pas
```

Dans DevFlow on utilise principalement du **SSR** avec des **Server Components**.

---

## App Router — la structure des fichiers

Avec Next.js App Router, la structure des fichiers **définit** les routes.

```
frontend/src/app/
├── layout.tsx          → layout racine (html, body)
├── page.tsx            → route /
├── dashboard/
│   └── page.tsx        → route /dashboard
├── projects/
│   ├── page.tsx        → route /projects
│   └── [id]/
│       ├── page.tsx    → route /projects/123
│       └── tasks/
│           └── page.tsx → route /projects/123/tasks
└── auth/
    ├── login/
    │   └── page.tsx    → route /auth/login
    └── register/
        └── page.tsx    → route /auth/register
```

Les dossiers entre `[crochets]` sont des **segments dynamiques** — comme `:id` dans Hono.

---

## Server Components vs Client Components

C'est le concept le plus important de l'App Router.

### Server Components (par défaut)

```tsx
// Pas de 'use client' → Server Component
export default async function ProjectsPage() {
  const projects = await fetch('http://localhost:3000/projects')
  const data = await projects.json()

  return <div>{data.map(p => <p>{p.name}</p>)}</div>
}
```

- S'exécutent **sur le serveur**
- Peuvent faire des appels directs à la BDD ou à l'API
- Pas d'interactivité (pas de useState, onClick...)
- HTML envoyé au client → bon SEO

### Client Components

```tsx
'use client' // ← obligatoire

import { useState } from 'react'

export default function CreateProjectForm() {
  const [name, setName] = useState('')

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  )
}
```

- S'exécutent **dans le navigateur**
- Nécessaires pour : useState, useEffect, onClick, formulaires interactifs
- `'use client'` en haut du fichier

### La règle

```
Pas d'interactivité → Server Component (par défaut)
Interactivité       → Client Component ('use client')
```

---

## TanStack Query

TanStack Query (anciennement React Query) gère le **server state** côté client.

```
useState + fetch  →  tu gères tout manuellement
                     loading, error, refetch, cache...

TanStack Query    →  tout est géré automatiquement
                     cache intelligent, refetch automatique
                     optimistic updates, pagination...
```

### Exemple

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

function ProjectsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json())
  })

  if (isLoading) return <p>Chargement...</p>
  if (error) return <p>Erreur</p>

  return <ul>{data.map(p => <li>{p.name}</li>)}</ul>
}
```

---

## Structure du projet frontend DevFlow

```
frontend/src/
├── app/
│   ├── layout.tsx           → layout racine + providers
│   ├── page.tsx             → page d'accueil / redirect
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── dashboard/
│       ├── page.tsx         → liste des projets
│       └── projects/
│           └── [id]/
│               └── page.tsx → détail projet + tâches
├── components/
│   ├── ui/                  → composants réutilisables
│   └── projects/            → composants spécifiques projets
├── lib/
│   ├── api.ts               → client HTTP (axios/fetch)
│   └── query-client.ts      → config TanStack Query
└── types/
    └── index.ts             → types TypeScript partagés
```

---

## Ce qu'on retient

- Next.js = React + SSR + routing basé sur les fichiers
- App Router : les dossiers = les routes, `[id]` = segment dynamique
- Server Components : s'exécutent sur le serveur, pas d'interactivité
- Client Components : `'use client'`, nécessaires pour l'interactivité
- TanStack Query : gestion du state serveur côté client avec cache
