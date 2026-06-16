# V4 RBAC — Design Spec

**Date:** 2026-06-16
**Scope:** Ajouter des rôles OWNER/MEMBER/VIEWER sur les projets, permettre à un OWNER d'inviter des membres par email, et restreindre les actions selon le rôle.

---

## 1. Schéma de base de données

### Nouveaux modèles Prisma

```prisma
enum Role {
  OWNER
  MEMBER
  VIEWER
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
}
```

### Modifications sur `Project`

Ajouter la relation :
```prisma
members ProjectMember[]
```

Le champ `ownerId` reste (référence rapide sans JOIN), mais la source de vérité pour les permissions est `ProjectMember`.

### Migration des données existantes

- À la création d'un projet : insérer automatiquement un `ProjectMember` avec `role: OWNER` pour le créateur.
- Pour les projets déjà en base : migration Prisma qui insert un enregistrement OWNER pour chaque projet existant (`INSERT INTO ProjectMember SELECT cuid(), id, ownerId, 'OWNER', NOW() FROM Project`).

---

## 2. Backend

### Permissions par rôle

| Action | OWNER | MEMBER | VIEWER |
|---|:---:|:---:|:---:|
| Voir le projet | ✅ | ✅ | ✅ |
| Voir les tâches | ✅ | ✅ | ✅ |
| Créer une tâche | ✅ | ✅ | ❌ |
| Modifier une tâche | ✅ | ✅ | ❌ |
| Supprimer une tâche | ✅ | ✅ | ❌ |
| Supprimer le projet | ✅ | ❌ | ❌ |
| Gérer les membres | ✅ | ❌ | ❌ |

### Helper d'autorisation

```ts
const ROLE_RANK = { VIEWER: 0, MEMBER: 1, OWNER: 2 }

async function requireProjectRole(c: Context, projectId: string, minRole: Role) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } }
  })
  if (!member || ROLE_RANK[member.role] < ROLE_RANK[minRole]) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  return member
}
```

### Routes existantes modifiées

| Route | Rôle minimum |
|---|---|
| GET /projects | — (filtrées par membership) |
| GET /projects/:id | VIEWER |
| GET /projects/:id/tasks | VIEWER |
| POST /projects/:id/tasks | MEMBER |
| PATCH /projects/:id/tasks/:taskId | MEMBER |
| DELETE /projects/:id | OWNER |

`GET /projects` : retourne uniquement les projets où l'utilisateur est `ProjectMember` (remplace le filtre `ownerId = userId`). Inclut le rôle de l'utilisateur dans chaque projet retourné.

### Nouvelles routes membres

```
GET    /projects/:id/members          → liste les membres avec email + rôle (VIEWER+)
POST   /projects/:id/members          → ajoute un membre par email avec un rôle (OWNER)
PATCH  /projects/:id/members/:userId  → change le rôle d'un membre (OWNER)
DELETE /projects/:id/members/:userId  → retire un membre (OWNER, ne peut pas se retirer soi-même)
```

`POST /projects/:id/members` : recherche l'utilisateur par email dans la table `User`. Si non trouvé : 404. Si déjà membre : 409.

---

## 3. Frontend

### Page détail projet (`/dashboard/[id]`)

Ajout de deux onglets : **Tâches** (existant) et **Membres** (nouveau).

### Onglet Membres

**Vue VIEWER (lecture seule) :**
- Liste des membres : email + badge de rôle coloré (OWNER / MEMBER / VIEWER)

**Vue OWNER (actions supplémentaires) :**
- Champ email + bouton "Ajouter" + dropdown de rôle → `POST /projects/:id/members`
- Dropdown pour changer le rôle de chaque membre → `PATCH /projects/:id/members/:userId`
- Bouton "Retirer" → `DELETE /projects/:id/members/:userId`
- L'OWNER ne peut pas se retirer lui-même (bouton désactivé)

### Hook `useProjectRole`

```ts
function useProjectRole(projectId: string): Role | null
```

Utilisé dans la page détail pour conditionner l'affichage des boutons (créer tâche, supprimer projet, onglet membres complet).

### Dashboard

La query `GET /projects` retourne le rôle de l'utilisateur dans chaque projet. Badge de rôle affiché sur les cartes (OWNER / MEMBER / VIEWER).

### Types à ajouter (`frontend/src/types/project.ts`)

```ts
export type Role = 'OWNER' | 'MEMBER' | 'VIEWER'

export interface ProjectMember {
  id: string
  userId: string
  role: Role
  createdAt: string
  user: { id: string; name: string; email: string }
}
```

---

## 4. Ordre d'implémentation

1. Migration Prisma (schéma + données existantes)
2. Backend : modifier `POST /projects` (créer ProjectMember OWNER)
3. Backend : modifier `GET /projects` (filtre par membership + rôle retourné)
4. Backend : modifier routes projet/tâches (appels à `requireProjectRole`)
5. Backend : nouvelles routes `/projects/:id/members`
6. Frontend : types + hook `useProjectRole`
7. Frontend : mise à jour dashboard (rôle dans les cartes)
8. Frontend : onglet Membres dans page détail
