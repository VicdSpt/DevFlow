# Prisma & PostgreSQL — Théorie

## Qu'est-ce qu'un ORM ?

ORM = Object-Relational Mapper. C'est une couche d'abstraction entre ton code et la base de données.

```
Sans ORM  →  tu écris du SQL brut
            SELECT * FROM projects WHERE id = 'abc';

Avec ORM  →  tu écris du TypeScript
            db.project.findUnique({ where: { id: 'abc' } })
```

L'ORM traduit tes appels TypeScript en SQL et retourne des objets typés.

---

## Pourquoi Prisma ?

| | SQL brut | TypeORM | Prisma |
|---|---|---|---|
| Typage | Non | Partiel | Complet |
| Migrations | Manuel | Auto | Auto + fichiers SQL |
| Lisibilité | Moyenne | Moyenne | Excellente |
| Erreurs à la compilation | Non | Partiel | Oui |

Prisma génère un client TypeScript à partir de ton schéma — chaque requête est typée, les erreurs sont détectées avant l'exécution.

---

## Le schéma Prisma

Le schéma (`prisma/schema.prisma`) est la source de vérité de ta base de données.

```prisma
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
```

### Les décorateurs importants

```prisma
@id              →  clé primaire
@default(cuid()) →  valeur par défaut : CUID2 généré automatiquement
@default(now())  →  date de création automatique
@updatedAt       →  mis à jour automatiquement à chaque modification
@unique          →  valeur unique dans la table
?                →  champ optionnel (nullable)
```

---

## Les relations

### One-to-Many (1 → N)

```prisma
model User {
  projects Project[]  // un user a plusieurs projets
}

model Project {
  ownerId String
  owner   User   @relation(fields: [ownerId], references: [id])
}
```

`ownerId` est la clé étrangère dans la table `Project`.
`owner` est la relation TypeScript (pas une colonne en BDD).

### Relation optionnelle

```prisma
model Task {
  assigneeId String?       // nullable
  assignee   User?  @relation(...)
}
```

---

## Les migrations

Une migration = un fichier SQL qui décrit un changement de schéma.

```
pnpm db:migrate   →  crée et applique une nouvelle migration
pnpm db:generate  →  régénère le client TypeScript sans migration
pnpm db:studio    →  interface graphique pour explorer la BDD
```

### Pourquoi les migrations ?

```
Sans migrations  →  tu modifies la BDD à la main sur chaque environnement
                    (dev, staging, prod) → erreurs, incohérences

Avec migrations  →  chaque changement de schéma est versionné
                    et reproductible sur tous les environnements
```

Prisma génère des fichiers SQL dans `prisma/migrations/` — commit-les toujours.

---

## Les opérations CRUD

### Lire

```typescript
// Tous les enregistrements
const projects = await db.project.findMany()

// Avec filtre
const activeProjects = await db.project.findMany({
  where: { status: 'ACTIVE' }
})

// Un seul (retourne null si introuvable)
const project = await db.project.findUnique({
  where: { id: 'abc123' }
})

// Avec relations incluses
const project = await db.project.findUnique({
  where: { id: 'abc123' },
  include: { tasks: true, owner: true }
})
```

### Créer

```typescript
const project = await db.project.create({
  data: {
    name: 'DevFlow',
    ownerId: 'user-1'
  }
})
```

### Modifier

```typescript
const project = await db.project.update({
  where: { id: 'abc123' },
  data: { name: 'Nouveau nom' }
})
```

### Supprimer (soft delete dans DevFlow)

```typescript
// Soft delete — on change le status
const project = await db.project.update({
  where: { id: 'abc123' },
  data: { status: 'DELETED' }
})

// Hard delete (à éviter en production)
await db.project.delete({ where: { id: 'abc123' } })
```

---

## Les erreurs Prisma courantes

```
P2002  →  violation de contrainte unique (ex: email déjà utilisé)
P2003  →  violation de clé étrangère (ex: ownerId inexistant)
P2025  →  enregistrement introuvable pour update/delete
```

Ces codes permettent de retourner des erreurs HTTP précises au client.

---

## PostgreSQL — ce qu'il faut savoir

PostgreSQL est la base de données relationnelle la plus robuste en open source.

```
Relationnelle  →  données organisées en tables avec des relations entre elles
ACID           →  Atomicité, Cohérence, Isolation, Durabilité
                  garantit l'intégrité des données même en cas de crash
Typage fort    →  chaque colonne a un type strict (String, Int, DateTime...)
```

### Pourquoi pas MySQL ou SQLite ?

```
SQLite   →  fichier local, pas adapté à la production multi-utilisateurs
MySQL    →  correct, mais moins de fonctionnalités avancées
PostgreSQL →  le standard pour les apps sérieuses en 2026
              supporte JSON, vectors (pgvector), full-text search...
```

---

## Ce qu'on retient

- Prisma = ORM TypeScript qui génère un client typé depuis le schéma
- Le schéma est la source de vérité — toujours modifier le schéma, jamais la BDD directement
- Les migrations versionnent les changements de schéma
- `findUnique` retourne `null` si introuvable — toujours vérifier
- Les codes d'erreur Prisma permettent de gérer les cas d'erreur précisément
