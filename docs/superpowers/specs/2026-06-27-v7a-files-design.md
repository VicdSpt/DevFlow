# V7a Fichiers — Design Spec

**Date:** 2026-06-27
**Scope:** Upload et téléchargement de fichiers attachés aux projets et aux tâches. Stockage local sur disque (`uploads/`). RBAC : VIEWER télécharge, MEMBER+ uploade, OWNER supprime.

---

## 1. Modèle de données

Nouveau modèle Prisma `Attachment` :

```prisma
model Attachment {
  id           String   @id @default(cuid())
  filename     String   // nom sur disque (ex: "cm1abc123.pdf")
  originalName String   // nom original uploadé par l'utilisateur
  mimeType     String
  size         Int      // taille en octets
  createdAt    DateTime @default(now())

  projectId    String?
  project      Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)

  taskId       String?
  task         Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)

  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
}
```

Back-relations à ajouter :
- `Project` : `attachments Attachment[]`
- `Task` : `attachments Attachment[]`
- `User` : `attachments Attachment[]`

Contrainte applicative : exactement l'un des deux (`projectId` ou `taskId`) est non-null. Enforced dans les route handlers — pas de contrainte BDD complexe.

Suppression : hard delete (fichier disque + ligne BDD). `onDelete: Cascade` sur les relations project/task supprime automatiquement les attachments si le projet ou la tâche est supprimé.

Limite : 10 Mo par fichier (enforced backend + frontend).

---

## 2. Stockage local

Module `src/lib/storage.ts` :

```
saveFile(buffer: Buffer, originalName: string) → filename: string
deleteFile(filename: string) → void
getFilePath(filename: string) → string (chemin absolu)
```

- Répertoire `uploads/` à la racine du projet, créé au démarrage si absent
- Nom sur disque : `${cuid()}.${extension}` pour éviter les collisions
- Extension extraite de `originalName` (`.pdf`, `.png`, etc.)
- `uploads/` ajouté au `.gitignore`

---

## 3. Backend — Routes

Deux nouveaux fichiers de routes enregistrés dans `src/index.ts` :

### 3.1 `src/routes/files.ts` — fichiers d'un projet

Monté sur `/projects/:id/files`.

| Méthode | Route | Rôle min | Description |
|---|---|---|---|
| GET | `/` | VIEWER | Liste les fichiers du projet |
| POST | `/` | MEMBER | Upload un fichier vers le projet |
| GET | `/:fileId` | VIEWER | Télécharge / sert le fichier |
| DELETE | `/:fileId` | OWNER | Supprime le fichier (disque + BDD) |

### 3.2 `src/routes/taskFiles.ts` — fichiers d'une tâche

Monté sur `/projects/:id/tasks/:taskId/files`.

| Méthode | Route | Rôle min | Description |
|---|---|---|---|
| GET | `/` | VIEWER | Liste les fichiers de la tâche |
| POST | `/` | MEMBER | Upload un fichier vers la tâche |
| GET | `/:fileId` | VIEWER | Télécharge / sert le fichier |
| DELETE | `/:fileId` | OWNER | Supprime le fichier (disque + BDD) |

### 3.3 Détails techniques

**Upload (`POST /`) :**
- `c.req.parseBody()` — multipart natif Hono, pas de lib externe
- Vérification taille ≤ 10 Mo → 413 si dépassé
- Vérification que le fichier est présent dans le body → 422 si absent
- `storage.saveFile(buffer, originalName)` → filename
- Création de l'entrée `Attachment` en BDD
- Réponse : `{ data: attachment }` (201)

**Serve (`GET /:fileId`) :**
- Fetch `Attachment` en BDD → 404 si absent
- `fs.readFileSync(storage.getFilePath(filename))`
- Headers : `Content-Type: attachment.mimeType`, `Content-Disposition: attachment; filename="originalName"`
- Réponse : `c.body(buffer, 200, headers)`

**Delete (`DELETE /:fileId`) :**
- Fetch `Attachment` en BDD → 404 si absent
- `storage.deleteFile(filename)` (silencieux si fichier manquant sur disque)
- `db.attachment.delete()`
- Réponse : 204

**Enregistrement dans `src/index.ts` :**
```ts
app.route('/projects/:id/files', files)
app.route('/projects/:id/tasks/:taskId/files', taskFiles)
```
À ajouter avant `app.route('/projects', projects)`.

---

## 4. Frontend

### 4.1 Hooks TanStack Query — `frontend/src/hooks/useFiles.ts`

```ts
// Projet
useProjectFiles(projectId)       → liste des fichiers
useUploadProjectFile(projectId)  → mutation upload
useDeleteProjectFile(projectId)  → mutation delete

// Tâche
useTaskFiles(projectId, taskId)      → liste
useUploadTaskFile(projectId, taskId) → mutation upload
useDeleteTaskFile(projectId, taskId) → mutation delete
```

Upload via `FormData` avec Axios (`api.post(..., formData, { headers: { 'Content-Type': 'multipart/form-data' } })`).

### 4.2 Composant `frontend/src/components/FileList.tsx`

Props : `files: Attachment[]`, `onDelete?: (fileId: string) => void`, `canDelete: boolean`, `canUpload: boolean`, `onUpload?: (file: File) => void`, `isUploading?: boolean`.

Affiche pour chaque fichier :
- Nom original, taille formatée (ex: "2.3 Mo"), date
- Bouton télécharger (lien `href` vers l'API)
- Bouton supprimer (visible si `canDelete`)

Zone d'upload en bas si `canUpload` : `<input type="file">` + bouton "Joindre". Validation taille côté client (≤ 10 Mo) avec message d'erreur inline.

### 4.3 Composant `frontend/src/components/FileUpload.tsx`

Composant autonome pour la zone d'upload uniquement :
- Input file + bouton
- Validation taille ≤ 10 Mo avant envoi
- Affiche erreur si fichier trop lourd
- Appelle `onUpload(file)` si valide

### 4.4 Modifications de `frontend/src/app/dashboard/[id]/page.tsx`

**Nouvel onglet "Fichiers"** (3e onglet, après Tâches et Membres) :
- Section "Fichiers du projet" : `FileList` avec les fichiers du projet
- Section "Fichiers par tâche" : liste des tâches avec pour chacune un compteur d'attachements (📎 N) cliquable — expand/collapse une mini `FileList` sous la carte

**Onglet Tâches** : inchangé. Les fichiers par tâche sont accessibles uniquement depuis l'onglet Fichiers.

### 4.5 Types — `frontend/src/types/project.ts`

Ajouter :
```ts
export interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string
  projectId: string | null
  taskId: string | null
  uploadedById: string
}
```

---

## 5. Variables d'environnement

Aucune nouvelle variable requise pour le stockage local. Le répertoire `uploads/` est créé automatiquement au démarrage du backend.

---

## 6. Ordre d'implémentation

1. Schéma Prisma + migration (`prisma db push`)
2. `src/lib/storage.ts` + création de `uploads/` + `.gitignore`
3. `src/routes/files.ts` (fichiers projet) + enregistrement dans `src/index.ts`
4. `src/routes/taskFiles.ts` (fichiers tâche) + enregistrement
5. Types frontend + hook `useFiles.ts`
6. Composants `FileUpload.tsx` + `FileList.tsx`
7. Intégration dans `dashboard/[id]/page.tsx` (onglet Fichiers)
