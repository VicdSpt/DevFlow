# Dashboard DevFlow V3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire les pages `/dashboard` (liste des projets) et `/dashboard/new` (formulaire de création) en Next.js avec TanStack Query et React Hook Form.

**Architecture:** Client Components pour les deux pages (nécessité de hooks React). Pas de composants partagés pour l'instant — tout dans les pages. Fetching via TanStack Query, mutations via useMutation, formulaire via React Hook Form + Zod.

**Tech Stack:** Next.js 16, Tailwind CSS v4, TanStack Query v5, Axios, React Hook Form, Zod

> **Note pédagogique :** Ce plan est conçu pour que vous codiez vous-même. Chaque tâche contient une explication théorique, un exemple minimal, et la description de ce que vous devez implémenter. Si vous êtes bloqué, relisez la section théorie avant de demander de l'aide.

---

## Structure des fichiers

```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx          ← CRÉER — liste des projets
│       └── new/
│           └── page.tsx      ← CRÉER — formulaire création
├── types/
│   └── project.ts            ← CRÉER — types TypeScript
└── lib/
    └── api.ts                ← EXISTANT — instance Axios
```

---

### Tâche 1 : Installer les dépendances manquantes

**Théorie :** `react-hook-form` gère l'état des formulaires sans re-render inutile. `zod` permet de définir un schéma de validation et d'inférer automatiquement le type TypeScript depuis ce schéma. `@hookform/resolvers` fait le lien entre les deux.

- [ ] **Étape 1 : Installer react-hook-form, zod et le resolver**

```bash
cd frontend
npm install react-hook-form zod @hookform/resolvers
```

- [ ] **Étape 2 : Vérifier que l'installation s'est bien passée**

Vérifiez que les trois packages apparaissent dans `frontend/package.json` sous `dependencies`.

- [ ] **Étape 3 : Committer**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add react-hook-form and zod dependencies"
```

---

### Tâche 2 : Créer les types TypeScript

**Théorie :** En TypeScript, on définit les types dans des fichiers dédiés (`types/`) pour les réutiliser partout sans les dupliquer. Le type `Project` doit correspondre exactement à ce que renvoie votre API backend.

Votre API renvoie pour `GET /projects` :
```json
{
  "data": [
    {
      "id": "clxxx",
      "name": "DevFlow",
      "description": "Mon projet",
      "status": "ACTIVE",
      "ownerId": "clyyy",
      "createdAt": "2026-06-09T...",
      "updatedAt": "2026-06-09T..."
    }
  ]
}
```

- [ ] **Étape 1 : Créer `src/types/project.ts`**

Créez ce fichier et définissez :
- Un type `ProjectStatus` qui accepte seulement `'ACTIVE' | 'ARCHIVED' | 'DELETED'`
- Une interface `Project` avec les champs ci-dessus (`description` est optionnel avec `?`)
- Un type `CreateProjectInput` avec seulement `name` (string) et `description` (string optionnel) — c'est ce qu'on enverra au POST

- [ ] **Étape 2 : Committer**

```bash
git add frontend/src/types/project.ts
git commit -m "feat: add Project types"
```

---

### Tâche 3 : Structure de base de la page dashboard

**Théorie :** En Next.js avec l'App Router, les pages sont des composants dans `app/`. Pour utiliser des hooks React (`useState`, `useQuery`...), le fichier doit commencer par `'use client'`. Sans cette directive, c'est un Server Component (rendu côté serveur, pas de hooks).

**Structure d'une page Client Component :**
```tsx
'use client'

export default function MaPage() {
  return <div>Contenu</div>
}
```

- [ ] **Étape 1 : Créer `src/app/dashboard/page.tsx`**

Créez la page avec :
- La directive `'use client'` en haut
- Une `function DashboardPage()` exportée par défaut
- Un layout avec une `<nav>` en topbar (nom "DevFlow" à gauche, bouton "Nouveau projet" à droite)
- Une `<main>` en dessous pour la grille (pour l'instant, mettez juste `<p>Chargement...</p>`)
- Stylez avec Tailwind : topbar avec fond sombre, padding, flex, justify-between

- [ ] **Étape 2 : Vérifier dans le navigateur**

Lancez le dev server (`npm run dev` dans `frontend/`) et ouvrez `http://localhost:3001/dashboard`. Vous devez voir la topbar et le texte "Chargement...".

- [ ] **Étape 3 : Committer**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: add dashboard page shell with topbar"
```

---

### Tâche 4 : Fetching des projets avec TanStack Query

**Théorie :** TanStack Query gère le fetching, le cache, les états loading/error/success automatiquement. Le hook principal est `useQuery`.

```tsx
// Exemple minimal
const { data, isLoading, isError } = useQuery({
  queryKey: ['projets'],       // clé unique pour le cache
  queryFn: () => api.get('/projets').then(res => res.data.data),
})
```

- `queryKey` : identifiant unique. Si deux composants utilisent la même key, ils partagent le cache.
- `queryFn` : fonction async qui retourne les données. On extrait `res.data.data` car votre API enveloppe tout dans `{ data: ... }`.
- `isLoading` : `true` pendant le premier fetch
- `isError` : `true` si la requête échoue
- `data` : les données une fois chargées (type `Project[] | undefined`)

- [ ] **Étape 1 : Ajouter useQuery dans `dashboard/page.tsx`**

Importez `useQuery` depuis `@tanstack/react-query`, importez `api` depuis `@/lib/api`, importez le type `Project` depuis `@/types/project`.

Ajoutez le hook dans votre composant avec :
- `queryKey: ['projects']`
- `queryFn` qui appelle `api.get('/projects')` et retourne `res.data.data as Project[]`

- [ ] **Étape 2 : Afficher les données brutes temporairement**

Dans le `<main>`, affichez temporairement `<pre>{JSON.stringify(data, null, 2)}</pre>` pour vérifier que les données arrivent bien depuis l'API.

- [ ] **Étape 3 : Vérifier dans le navigateur**

Assurez-vous que votre backend tourne sur le port 3000, puis ouvrez `/dashboard`. Vous devez voir le JSON de vos projets (ou `undefined` si vous n'en avez pas encore).

- [ ] **Étape 4 : Committer**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: fetch projects with useQuery on dashboard"
```

---

### Tâche 5 : État de chargement (skeleton)

**Théorie :** Un "skeleton" est un placeholder animé qui imite la forme du contenu à venir. C'est une meilleure UX que de simplement afficher "Chargement...". Tailwind fournit `animate-pulse` pour l'animation et vous construisez la forme avec des `div` colorées.

```tsx
// Exemple de skeleton card
<div className="animate-pulse bg-gray-700 rounded-lg p-4 h-32" />
```

- [ ] **Étape 1 : Ajouter le rendu conditionnel pour `isLoading`**

Dans votre `<main>`, avant d'afficher les projets, ajoutez une condition :
```tsx
if (isLoading) {
  return (/* votre skeleton */)
}
```

Créez une grille de 3 skeleton cards avec `animate-pulse`. Chaque card doit avoir une hauteur fixe et un fond grisé pour imiter la forme d'une vraie card.

- [ ] **Étape 2 : Tester visuellement**

Pour voir le skeleton, vous pouvez temporairement ajouter `initialData: undefined` et `staleTime: 0` dans votre query, ou simplement couper votre backend et recharger la page.

- [ ] **Étape 3 : Committer**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: add skeleton loading state on dashboard"
```

---

### Tâche 6 : État d'erreur

**Théorie :** `isError` devient `true` si la `queryFn` lève une exception (erreur réseau, 4xx, 5xx). `refetch` est une fonction retournée par `useQuery` qui permet de relancer manuellement la requête.

```tsx
const { data, isLoading, isError, refetch } = useQuery(...)

if (isError) {
  return (
    <div>
      <p>Erreur</p>
      <button onClick={() => refetch()}>Réessayer</button>
    </div>
  )
}
```

- [ ] **Étape 1 : Ajouter le rendu conditionnel pour `isError`**

Après le bloc `isLoading`, ajoutez un bloc `isError` qui affiche :
- Un message "Impossible de charger les projets"
- Un bouton "Réessayer" qui appelle `refetch()`
- Stylez avec Tailwind (texte centré, bouton avec couleur d'accent)

- [ ] **Étape 2 : Tester en coupant le backend**

Arrêtez votre backend et rechargez `/dashboard`. Vous devez voir l'état d'erreur avec le bouton "Réessayer".

- [ ] **Étape 3 : Committer**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: add error state with retry on dashboard"
```

---

### Tâche 7 : Affichage des cartes projets

**Théorie :** En React, on affiche une liste avec `.map()`. Chaque élément doit avoir une `key` unique (on utilise l'`id` du projet). Pour naviguer vers `/dashboard/new`, on peut utiliser soit un `<Link>` de Next.js (navigation côté client, plus rapide), soit `useRouter().push()` dans un handler.

```tsx
import Link from 'next/link'

// Navigation déclarative (recommandée pour les liens)
<Link href="/dashboard/new">Nouveau projet</Link>

// Navigation programmatique (dans un onClick)
const router = useRouter()
router.push('/dashboard/new')
```

- [ ] **Étape 1 : Remplacer le `<pre>` par une vraie grille de cartes**

Dans votre `<main>`, affichez :
- Une grille responsive (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
- Pour chaque projet dans `data`, une card avec : nom (titre), description (texte secondaire, si présente), badge de statut coloré (vert pour ACTIVE, gris pour ARCHIVED)
- En dernier dans la grille, une carte "+ Nouveau projet" cliquable (un `<Link href="/dashboard/new">`) avec un style distinctif (bordure pointillée)

- [ ] **Étape 2 : Transformer le bouton "Nouveau projet" dans la topbar en Link**

Remplacez le bouton par `<Link href="/dashboard/new">` stylisé comme un bouton.

- [ ] **Étape 3 : Vérifier dans le navigateur**

Avec des projets en base, vous devez voir la grille. Sans projets, vous verrez juste la card "+ Nouveau projet" (l'empty state viendra à la tâche suivante).

- [ ] **Étape 4 : Committer**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: display project cards grid on dashboard"
```

---

### Tâche 8 : Empty state (onboarding)

**Théorie :** L'empty state se distingue de l'état "0 projets dans la grille" car il remplace complètement la grille par un message d'accueil. On le déclenche quand `data` existe mais est un tableau vide (`data.length === 0`).

- [ ] **Étape 1 : Ajouter le rendu conditionnel pour l'empty state**

Après les blocs `isLoading` et `isError`, ajoutez :
```tsx
if (!data || data.length === 0) {
  return (/* empty state */)
}
```

L'empty state doit contenir :
- Une icône (emoji ou SVG simple, ex: 📁)
- Titre : "Bienvenue sur DevFlow"
- Texte : "Organisez vos projets et suivez vos tâches en un seul endroit."
- Un bouton/lien CTA "Créer mon premier projet" → `/dashboard/new`
- Centrez le tout verticalement et horizontalement

- [ ] **Étape 2 : Tester l'empty state**

Si vous n'avez pas de projets en base, vous devez voir l'empty state directement. Sinon, testez temporairement en remplaçant `data` par `[]` dans le rendu.

- [ ] **Étape 3 : Committer**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: add onboarding empty state on dashboard"
```

---

### Tâche 9 : Page de création `/dashboard/new`

**Théorie :** React Hook Form gère les formulaires avec un système de "register" : chaque input est enregistré et sa valeur est suivie efficacement. Zod définit un schéma de validation, et `zodResolver` le branche sur React Hook Form.

Flux complet :
```
Zod schema → zodResolver → useForm → register(input) → handleSubmit → useMutation → API
```

Exemple minimal :
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
})
type FormData = z.infer<typeof schema>  // TypeScript infère le type depuis le schéma

function MonFormulaire() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    console.log(data) // données validées
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}
      <button type="submit">Envoyer</button>
    </form>
  )
}
```

- [ ] **Étape 1 : Créer `src/app/dashboard/new/page.tsx`**

Créez la page avec :
- `'use client'` en haut
- Un schéma Zod avec `name` (requis, min 1 char) et `description` (optionnel)
- `useForm` avec `zodResolver`
- Un formulaire avec : champ "Nom" (input text), champ "Description" (textarea), affichage des erreurs sous chaque champ
- Deux boutons : "Annuler" (Link vers `/dashboard`) et "Créer" (type submit)
- Pour l'instant, le `onSubmit` peut juste faire un `console.log(data)`

- [ ] **Étape 2 : Vérifier la validation dans le navigateur**

Allez sur `/dashboard/new`, soumettez le formulaire vide. Vous devez voir le message d'erreur sous le champ "Nom".

- [ ] **Étape 3 : Committer**

```bash
git add frontend/src/app/dashboard/new/page.tsx
git commit -m "feat: add new project page with form validation"
```

---

### Tâche 10 : Mutation de création avec useMutation

**Théorie :** `useMutation` est l'équivalent de `useQuery` pour les requêtes qui modifient des données (POST, PATCH, DELETE). Il ne se déclenche pas automatiquement, on l'appelle via `mutate()` ou `mutateAsync()`.

```tsx
const mutation = useMutation({
  mutationFn: (data: CreateProjectInput) =>
    api.post('/projects', data).then(res => res.data.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] }) // invalide le cache
    router.push('/dashboard')
  },
  onError: (error) => {
    console.error(error)
  },
})

// Dans le onSubmit :
const onSubmit = (data: FormData) => {
  mutation.mutate(data)
}
```

`invalidateQueries` force TanStack Query à re-fetcher les projets au prochain affichage du dashboard — ainsi votre nouveau projet apparaît immédiatement.

- [ ] **Étape 1 : Ajouter useMutation dans la page `/dashboard/new`**

Importez `useMutation`, `useQueryClient` depuis `@tanstack/react-query`, `useRouter` depuis `next/navigation`, et `CreateProjectInput` depuis `@/types/project`.

Ajoutez la mutation avec :
- `mutationFn` qui fait `api.post('/projects', data)`
- `onSuccess` qui invalide `['projects']` et redirige vers `/dashboard`
- `onError` qui stocke l'erreur dans un state local (`useState<string | null>`)

- [ ] **Étape 2 : Brancher sur le formulaire**

Remplacez le `console.log` dans `onSubmit` par `mutation.mutate(data)`.

Ajoutez sur le bouton "Créer" :
- `disabled={mutation.isPending}` pour le désactiver pendant la requête
- Un texte conditionnel : "Création..." si `isPending`, "Créer" sinon

Affichez l'erreur API (le state local) sous le formulaire si elle existe.

- [ ] **Étape 3 : Tester le flux complet**

1. Allez sur `/dashboard/new`
2. Remplissez le nom, soumettez
3. Vous devez être redirigé vers `/dashboard` avec le nouveau projet affiché
4. Testez aussi avec un nom vide → message d'erreur Zod

- [ ] **Étape 4 : Committer**

```bash
git add frontend/src/app/dashboard/new/page.tsx
git commit -m "feat: create project with useMutation and redirect"
```

---

## Récapitulatif des commits attendus

1. `feat: add react-hook-form and zod dependencies`
2. `feat: add Project types`
3. `feat: add dashboard page shell with topbar`
4. `feat: fetch projects with useQuery on dashboard`
5. `feat: add skeleton loading state on dashboard`
6. `feat: add error state with retry on dashboard`
7. `feat: display project cards grid on dashboard`
8. `feat: add onboarding empty state on dashboard`
9. `feat: add new project page with form validation`
10. `feat: create project with useMutation and redirect`
