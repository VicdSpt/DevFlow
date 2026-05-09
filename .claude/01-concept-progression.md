# DevFlow — Concept & Progression

## Qu'est-ce que DevFlow ?

DevFlow est une application de gestion de projets et de tâches, inspirée d'outils comme **Jira** et **Linear**.

L'objectif n'est pas de copier ces outils — c'est de **construire un projet réel, complet, et déployé en production**, qui justifie naturellement chaque technologie apprise.

> Un seul projet fil rouge, construit couche par couche, version par version.

---

## Pourquoi ce projet ?

Ce projet a été choisi parce qu'il couvre **naturellement** toutes les compétences d'un ingénieur full stack :

| Besoin de l'app | Technologie apprise |
|---|---|
| Utilisateurs et connexion | Auth, JWT, bcrypt |
| Projets et tâches | CRUD, REST API, PostgreSQL |
| Qui voit quoi | RBAC, permissions |
| Mises à jour en temps réel | WebSockets |
| Pièces jointes | File uploads, Cloudflare R2 |
| Emails de notification | Resend, Background jobs |
| App rapide et fiable | Redis, indexing, monitoring |
| Déployée en production | Docker, CI/CD, Railway |
| Intelligence artificielle | LLM APIs, RAG, pgvector |

---

## La règle fondamentale

> Chaque version doit être **fonctionnelle et déployée** avant de passer à la suivante.

Pas de "je finirai plus tard". Chaque version est complète, commitée sur GitHub avec de vrais messages, et documentée dans le README.

---

## Progression par versions

---

### VERSION 1 — Le Squelette
**Objectif : avoir une API REST qui tourne et parle à une vraie base de données**

```
Stack utilisée
├── Node.js + TypeScript
├── Hono (framework API)
├── PostgreSQL (base de données)
└── Prisma (ORM)

Ce qu'on construit
├── Endpoints CRUD Projets
├── Endpoints CRUD Tâches
├── Base de données modélisée proprement
└── Structure de projet professionnelle

Ce qu'on apprend
├── HTTP en profondeur (méthodes, status codes, headers)
├── Architecture REST propre
├── SQL et modélisation de données
├── ORM et migrations
└── Gestion d'erreurs centralisée
```

---

### VERSION 2 — Les Utilisateurs
**Objectif : sécuriser l'API avec une authentification complète**

```
Ce qu'on ajoute
├── Better Auth (bibliothèque d'authentification)
├── JWT + refresh tokens
├── Routes protégées (middleware)
└── Register / Login / Logout / Me

Ce qu'on apprend
├── Authentification vs Autorisation
├── Comment fonctionne JWT vraiment
├── Middleware pattern
├── Sécurité des mots de passe (bcrypt)
└── Sessions et tokens
```

---

### VERSION 3 — Le Frontend
**Objectif : connecter un vrai frontend à notre API**

```
Ce qu'on ajoute
├── Next.js + Tailwind
├── TanStack Query (server state)
├── React Hook Form + Zod (formulaires)
└── Pages : Dashboard, Projets, Tâches

Ce qu'on apprend
├── Next.js (SSR, App Router, Server Components)
├── Data fetching moderne
├── Gestion des formulaires sérieuse
└── Communication Frontend ↔ Backend
```

---

### VERSION 4 — Rôles et Permissions
**Objectif : contrôler qui peut faire quoi**

```
Ce qu'on ajoute
├── RBAC (Role-Based Access Control)
├── Rôles : OWNER, MEMBER, VIEWER
└── Permissions granulaires par ressource

Ce qu'on apprend
├── Différence Auth vs Authz
├── RBAC — modélisation et implémentation
└── Sécurité au niveau des données
```

---

### VERSION 5 — Performance
**Objectif : une app rapide même avec beaucoup de données**

```
Ce qu'on ajoute
├── Redis (cache, sessions)
├── Pagination, filtering, sorting
└── Optimisation des requêtes PostgreSQL

Ce qu'on apprend
├── Caching strategies
├── Indexing en base de données
├── Query optimization
└── Pagination cursor-based vs offset
```

---

### VERSION 6 — Real-time
**Objectif : des mises à jour en direct sans rafraîchir la page**

```
Ce qu'on ajoute
├── WebSockets
├── Notifications live
└── Activité en temps réel (qui fait quoi)

Ce qu'on apprend
├── WebSockets vs HTTP
├── Event-driven architecture
└── Gestion de l'état en temps réel côté frontend
```

---

### VERSION 7 — Fichiers et Emails
**Objectif : gérer les pièces jointes et les notifications email**

```
Ce qu'on ajoute
├── Upload fichiers → Cloudflare R2
├── Emails transactionnels → Resend
└── Background jobs → BullMQ

Ce qu'on apprend
├── Object storage (S3-compatible)
├── Queues et jobs asynchrones
└── Emails avec React Email
```

---

### VERSION 8 — Qualité Production
**Objectif : du code testé, monitoré, et observable**

```
Ce qu'on ajoute
├── Tests unitaires et d'intégration (Vitest)
├── Tests E2E (Playwright)
├── Logging structuré (Pino)
└── Error monitoring (Sentry)

Ce qu'on apprend
├── Stratégie de testing
├── Ce qu'il faut tester vs ne pas tester
└── Observabilité en production
```

---

### VERSION 9 — Déploiement
**Objectif : l'app tourne en production, accessible sur internet**

```
Ce qu'on ajoute
├── Docker (containerisation)
├── GitHub Actions (CI/CD)
└── Deploy Vercel (frontend) + Railway (backend)

Ce qu'on apprend
├── Containerisation
├── CI/CD — automatiser les tests et le déploiement
└── Production mindset
```

---

### VERSION 10 — AI Layer
**Objectif : intégrer l'IA de façon pertinente et architecturée**

```
Ce qu'on ajoute
├── Assistant IA intégré (résumé de tâches, suggestions)
├── Recherche sémantique (pgvector)
└── Agent simple (création automatique de tâches)

Ce qu'on apprend
├── LLM APIs (Claude, OpenAI)
├── RAG — Retrieval Augmented Generation
└── AI Engineering basics
```

---

## Stack technique complète

```
Frontend        Next.js + React + TypeScript + Tailwind
State           TanStack Query + Zustand
Forms           React Hook Form + Zod
Animation       Framer Motion

Backend         Hono + TypeScript + Node.js
Auth            Better Auth
Validation      Zod

Database        PostgreSQL + Prisma + Redis
Storage         Cloudflare R2
Email           Resend

Deploy          Vercel (front) + Railway (back)
Containers      Docker
CI/CD           GitHub Actions

Testing         Vitest + React Testing Library + Playwright
```

---

## Ce que DevFlow prouve à un recruteur

À la fin de ce projet, ton portfolio démontre :

- Tu sais **architecturer un système complet** de zéro
- Tu gères l'**authentification et la sécurité** sérieusement
- Tu **déploies en production** — pas juste en localhost
- Tu **testes ton code** avec une vraie stratégie
- Tu intègres l'**IA de façon pertinente**
- Tu as le mindset d'un **product engineer**

> C'est un projet qui se défend en entretien pendant 45 minutes.
