# Dashboard — Design Spec
Date: 2026-06-09

## Contexte

Page principale de DevFlow (V3 Frontend). L'utilisateur arrive sur `/dashboard` après connexion et peut voir ses projets, en créer un nouveau, et naviguer vers les tâches d'un projet.

Stack : Next.js + Tailwind CSS v4 + TanStack Query v5 + React Hook Form + Axios.

## Pages

### `/dashboard` — Liste des projets

**Layout :** Topbar fixe en haut + grille de cartes en dessous.

**Topbar :**
- Nom de l'app à gauche ("DevFlow")
- Bouton "Nouveau projet" à droite → navigue vers `/dashboard/new`

**Grille de projets :**
- Fetching via `useQuery` → `GET /projects` (réponse : `{ data: Project[] }`)
- Grille responsive (1 col mobile, 2 col tablette, 3 col desktop)
- Chaque carte affiche : nom, description (si présente), badge statut (ACTIVE/ARCHIVED), nombre de tâches (non disponible en V3 — affiché quand l'API l'exposera)

**États de l'interface :**
- **Loading** : 3 skeleton cards (`animate-pulse` Tailwind)
- **Erreur** : message "Impossible de charger les projets" + bouton "Réessayer"
- **Empty state (0 projets)** : icône + titre "Bienvenue sur DevFlow" + phrase d'explication + bouton CTA "Créer mon premier projet" → `/dashboard/new`
- **Nominal** : grille de cartes + carte spéciale "+ Nouveau projet" en dernier

### `/dashboard/new` — Création d'un projet

**Layout :** Page simple centrée, pas de sidebar.

**Formulaire :**
- Champ "Nom" (requis, min 1 char) — validé par Zod
- Champ "Description" (optionnel, textarea)
- Bouton "Créer" → `POST /projects` avec `{ name, description }`
- Bouton "Annuler" → retour `/dashboard`

**États :**
- Bouton "Créer" disabled + spinner pendant la mutation
- Erreurs de validation Zod affichées sous chaque champ
- Erreur API affichée sous le formulaire
- Succès → `router.push('/dashboard')`

## Types

```ts
// src/types/project.ts
type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED'

interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  ownerId: string
  createdAt: string
  updatedAt: string
}
```

## Structure des fichiers

```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx          ← liste des projets (Client Component)
│       └── new/
│           └── page.tsx      ← formulaire création (Client Component)
├── types/
│   └── project.ts            ← type Project
└── lib/
    └── api.ts                ← déjà existant (axios instance)
```

Pas de composants partagés en V3 — tout reste dans les pages. On extraira `ProjectCard` et `EmptyState` si une autre page en a besoin.

## Décisions prises

- **Pas de barre de progression** en V3 : l'API `GET /projects` ne renvoie pas les tâches. On affiche statut + nom sans compteur de tâches pour l'instant.
- **Client Components** pour les deux pages : elles ont besoin de `useQuery`/`useMutation`, incompatibles avec les Server Components Next.js sans configuration supplémentaire.
- **Pas de layout partagé** pour `/dashboard` et `/dashboard/new` : trop tôt, pas de navigation commune à ce stade.
