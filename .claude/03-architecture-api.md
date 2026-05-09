# DevFlow — Architecture API REST

## Principes REST

Avant les endpoints, les règles qui guident chaque décision.

### Les méthodes HTTP

```
GET     →  Lire une ressource (jamais de side effects)
POST    →  Créer une ressource
PUT     →  Remplacer complètement une ressource
PATCH   →  Modifier partiellement une ressource
DELETE  →  Supprimer une ressource
```

### PUT vs PATCH — La différence concrète

```
PUT /projects/abc123
Body: { "name": "Nouveau nom" }
→ Remplace TOUT le projet
→ Les champs non envoyés sont réinitialisés à null
→ Utiliser quand on modifie toute la ressource

PATCH /projects/abc123
Body: { "status": "ARCHIVED" }
→ Modifie SEULEMENT les champs envoyés
→ Les autres champs restent intacts
→ Utiliser pour des mises à jour partielles (ex: changer le status)
```

### Les status codes HTTP

```
200 OK              →  Succès (GET, PUT, PATCH)
201 Created         →  Ressource créée avec succès (POST)
204 No Content      →  Succès sans body (DELETE)
400 Bad Request     →  Données invalides envoyées par le client
401 Unauthorized    →  Non authentifié (pas de token)
403 Forbidden       →  Authentifié mais pas autorisé
404 Not Found       →  Ressource introuvable
409 Conflict        →  Conflit (ex: email déjà utilisé)
422 Unprocessable   →  Validation échouée
500 Internal Error  →  Erreur serveur inattendue
```

### Pourquoi les tâches sont sous /projects/:id/tasks

```
/tasks/:id          →  ambiguë, pas de contexte
/projects/:id/tasks →  hiérarchique, explicite

Avantages
├── Reflète la structure des données (une tâche appartient à un projet)
├── Filtrage automatique (pas besoin de passer project_id en body)
└── Sécurité : on vérifie l'accès au projet avant d'accéder aux tâches
```

---

## Endpoints — Version 1

> Version 1 : pas d'authentification encore.
> L'auth sera ajoutée en Version 2.

---

### AUTH

```
POST   /auth/register     Créer un compte
POST   /auth/login        Se connecter → retourne un token
POST   /auth/logout       Se déconnecter
GET    /auth/me           Voir son propre profil
PUT    /auth/me           Modifier son propre profil
DELETE /auth/me           Supprimer son compte (soft delete)
```

**Pourquoi /auth/me et pas /users/:id ?**
```
/users/:id  →  expose que l'ID existe (énumération possible)
            →  qui a le droit de voir le profil de qui ?

/auth/me    →  utilise le token JWT pour identifier l'utilisateur
            →  plus sécurisé, plus simple
            →  un user ne modifie que lui-même
```

---

### PROJECTS

```
GET    /projects              Lister tous les projets
POST   /projects              Créer un projet
GET    /projects/:id          Voir un projet spécifique
PATCH  /projects/:id          Modifier partiellement un projet
DELETE /projects/:id          Supprimer un projet (soft delete)
```

**Détail des requêtes et réponses**

```
GET /projects
Response 200
{
  "data": [
    {
      "id": "clh3d2x9f0000",
      "name": "DevFlow",
      "description": "...",
      "status": "ACTIVE",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "ownerId": "clh3d2x9f0001"
    }
  ]
}

POST /projects
Body: { "name": "Nouveau projet", "description": "..." }
Response 201
{ "data": { ...projet créé... } }

PATCH /projects/:id
Body: { "status": "ARCHIVED" }
Response 200
{ "data": { ...projet modifié... } }

DELETE /projects/:id
Response 204 (pas de body)
```

---

### TASKS

```
GET    /projects/:id/tasks              Lister les tâches d'un projet
POST   /projects/:id/tasks              Créer une tâche dans un projet
GET    /projects/:id/tasks/:taskId      Voir une tâche spécifique
PATCH  /projects/:id/tasks/:taskId      Modifier partiellement une tâche
DELETE /projects/:id/tasks/:taskId      Supprimer une tâche
```

**Détail des requêtes et réponses**

```
GET /projects/:id/tasks
Response 200
{
  "data": [
    {
      "id": "clh3d2x9f0002",
      "title": "Créer l'API",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2026-02-01T00:00:00Z",
      "projectId": "clh3d2x9f0000",
      "assigneeId": "clh3d2x9f0001"
    }
  ]
}

POST /projects/:id/tasks
Body: {
  "title": "Nouvelle tâche",
  "priority": "HIGH",
  "dueDate": "2026-02-01"
}
Response 201
{ "data": { ...tâche créée... } }

PATCH /projects/:id/tasks/:taskId
Body: { "status": "DONE" }
Response 200
{ "data": { ...tâche modifiée... } }

DELETE /projects/:id/tasks/:taskId
Response 204 (pas de body)
```

---

## Format de réponse standard

Toutes les réponses suivent le même format.

**Succès**
```json
{
  "data": { ... }
}
```

**Erreur**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found"
  }
}
```

**Pourquoi envelopper dans `data` ?**
```
Sans enveloppe  →  { "id": "...", "name": "..." }
Avec enveloppe  →  { "data": { "id": "...", "name": "..." } }

L'enveloppe permet d'ajouter des métadonnées plus tard
sans casser les clients existants

{ 
  "data": [...],
  "pagination": { "total": 100, "page": 1, "limit": 20 }
}
```

---

## Structure des dossiers

```
src/
├── index.ts                  Point d'entrée — démarre le serveur
├── db/
│   └── client.ts             Instance Prisma partagée
├── routes/
│   ├── index.ts              Enregistre toutes les routes
│   ├── auth.ts               Routes /auth/*
│   ├── projects.ts           Routes /projects/*
│   └── tasks.ts              Routes /projects/:id/tasks/*
├── middleware/
│   ├── errorHandler.ts       Gestion d'erreurs centralisée
│   └── auth.ts               Middleware d'authentification (version 2)
├── validators/
│   ├── project.ts            Schémas Zod pour les projets
│   └── task.ts               Schémas Zod pour les tâches
└── types/
    └── index.ts              Types TypeScript partagés
```

---

## Évolutions par version

```
Version 1 (actuelle)
└── CRUD basique sans authentification

Version 2 — Auth
├── POST /auth/register
├── POST /auth/login
├── POST /auth/logout
└── GET  /auth/me
    Tous les autres endpoints nécessitent un token JWT

Version 4 — RBAC
└── Vérification des rôles sur chaque endpoint
    OWNER   → lecture + écriture + suppression
    MEMBER  → lecture + écriture
    VIEWER  → lecture uniquement

Version 5 — Pagination et filtering
└── GET /projects?status=ACTIVE&page=1&limit=20
    GET /projects/:id/tasks?status=TODO&priority=HIGH
    GET /projects/:id/tasks?sort=dueDate&order=asc

Version 6 — Real-time
└── WS /ws → connexion WebSocket
    Events : task.updated, task.created, project.updated

Version 7 — Fichiers
└── POST /tasks/:id/attachments  → upload fichier
    GET  /tasks/:id/attachments  → lister les fichiers
    DELETE /tasks/:id/attachments/:fileId
```
