# DevFlow — Schéma de Base de Données

## Principes de modélisation

Avant de regarder le schéma, voici les règles qui ont guidé chaque décision.

### Règle 1 — Les IDs

On utilise **CUID2** et non des integers auto-increment.

```
Integer auto-increment  → 1, 2, 3...
                          Prévisible — un attaquant peut deviner
                          /projects/1, /projects/2, /projects/3

CUID2                   → clh3d2x9f0000...
                          Non-prévisible
                          Ordonnable chronologiquement
                          URL-safe
                          Standard recommandé avec Prisma en 2026
```

### Règle 2 — Timestamps sur toutes les tables

```
created_at  → quand la ressource a été créée
updated_at  → quand elle a été modifiée pour la dernière fois

Pourquoi updated_at est indispensable
├── Synchronisation côté client
├── Débogage en production ("pourquoi ça a changé ?")
└── Prisma le gère automatiquement avec @updatedAt
```

### Règle 3 — Soft Delete

```
On ne supprime jamais vraiment en production.

status: DELETED  →  la ressource est "supprimée" pour l'utilisateur
                     mais existe encore en base de données

Pourquoi
├── Récupération en cas d'erreur
├── Audit trail (historique complet)
└── Obligations légales (certaines données doivent être conservées)
```

### Règle 4 — Nommage explicite des clés étrangères

```
user_id     →  trop ambigu
owner_id    →  clair : c'est le propriétaire du projet
assignee_id →  clair : c'est qui fait la tâche
```

---

## Les entités

---

### USER

```
Champ       Type          Contrainte        Description
─────────────────────────────────────────────────────────────
id          String        PK, CUID2         Identifiant unique
email       String        UNIQUE            Adresse email
password    String        —                 Mot de passe hashé (bcrypt)
name        String?       optionnel         Nom d'affichage
createdAt   DateTime      default: now()    Date de création
updatedAt   DateTime      @updatedAt        Dernière modification
```

**Relations**
```
User → Project[]   Un utilisateur peut posséder plusieurs projets
User → Task[]      Un utilisateur peut être assigné à plusieurs tâches
```

---

### PROJECT

```
Champ       Type            Contrainte        Description
───────────────────────────────────────────────────────────────
id          String          PK, CUID2         Identifiant unique
name        String          —                 Nom du projet
description String?         optionnel         Description
status      ProjectStatus   default: ACTIVE   État du projet
createdAt   DateTime        default: now()    Date de création
updatedAt   DateTime        @updatedAt        Dernière modification
ownerId     String          FK → User.id      Propriétaire du projet
```

**Relations**
```
Project → User     Un projet appartient à un seul utilisateur (owner)
Project → Task[]   Un projet contient plusieurs tâches
```

**Enum ProjectStatus**
```
ACTIVE    →  projet en cours, modifiable
ARCHIVED  →  projet terminé, lecture seule
DELETED   →  soft delete, invisible pour l'utilisateur
```

---

### TASK

```
Champ       Type        Contrainte        Description
──────────────────────────────────────────────────────────────
id          String      PK, CUID2         Identifiant unique
title       String      —                 Titre de la tâche
description String?     optionnel         Description détaillée
status      TaskStatus  default: TODO     État de la tâche
priority    Priority    default: MEDIUM   Niveau de priorité
dueDate     DateTime?   optionnel         Date limite
createdAt   DateTime    default: now()    Date de création
updatedAt   DateTime    @updatedAt        Dernière modification
projectId   String      FK → Project.id   Projet parent
assigneeId  String?     FK → User.id      Utilisateur assigné (optionnel)
```

**Relations**
```
Task → Project   Une tâche appartient à un seul projet
Task → User?     Une tâche peut être assignée à un utilisateur
```

**Enum TaskStatus**
```
TODO        →  à faire
IN_PROGRESS →  en cours
DONE        →  terminée
BLOCKED     →  bloquée (dépendance externe)
ARCHIVED    →  archivée
```

**Enum Priority**
```
LOW       →  peut attendre
MEDIUM    →  priorité normale
HIGH      →  urgent
CRITICAL  →  bloquant, à traiter immédiatement
```

---

## Relations entre les entités

```
USER
 │
 ├──────────────────────┐
 │                      │
 │ owns (1..*)          │ assigned to (0..*)
 ▼                      ▼
PROJECT ──(1..*)──► TASK
```

### Détail des relations

```
USER → PROJECT
Type          : One-to-Many
Description   : Un utilisateur peut avoir plusieurs projets
                Un projet appartient à un seul utilisateur
Clé étrangère : ownerId dans PROJECT → id dans USER

PROJECT → TASK
Type          : One-to-Many
Description   : Un projet peut avoir plusieurs tâches
                Une tâche appartient à un seul projet
Clé étrangère : projectId dans TASK → id dans PROJECT

USER → TASK
Type          : One-to-Many (optionnel)
Description   : Un utilisateur peut être assigné à plusieurs tâches
                Une tâche peut ne pas avoir d'assigné
Clé étrangère : assigneeId (nullable) dans TASK → id dans USER
```

---

## Règles de cascade

```
Que se passe-t-il si on supprime un USER ?
→ Soft delete uniquement
→ Ses projets et tâches sont conservés en base
→ On n'efface jamais un utilisateur définitivement

Que se passe-t-il si on supprime un PROJECT ?
→ Soft delete : status passe à DELETED
→ Ses tâches sont archivées automatiquement
→ Pas de suppression en cascade

Que se passe-t-il si on désassigne un USER d'une TASK ?
→ assigneeId passe à null (SET NULL)
→ La tâche existe toujours, juste non assignée
```

---

## Schéma Prisma complet

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects  Project[]
  tasks     Task[]
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id])
  tasks       Task[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  projectId   String
  project     Project    @relation(fields: [projectId], references: [id])
  assigneeId  String?
  assignee    User?      @relation(fields: [assigneeId], references: [id])
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  BLOCKED
  ARCHIVED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## Évolutions prévues (versions futures)

```
Version 4 — RBAC
└── Ajout d'une table ProjectMember
    ├── userId
    ├── projectId
    └── role : OWNER | MEMBER | VIEWER

Version 5 — Performance
└── Ajout d'index sur
    ├── Task.projectId  (requête fréquente)
    ├── Task.assigneeId (requête fréquente)
    └── Task.status     (filtering fréquent)

Version 10 — AI Layer
└── Ajout de Task.embedding (vector)
    pour la recherche sémantique avec pgvector
```
