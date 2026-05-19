# Authentification — Théorie

## Authentification vs Autorisation

Deux concepts souvent confondus :

```
Authentification  →  QUI es-tu ?
                     Vérifier l'identité (login/password)

Autorisation      →  As-tu le DROIT de faire ça ?
                     Vérifier les permissions (rôles, ownership)
```

Dans DevFlow :
- Version 2 = Authentification (qui est connecté ?)
- Version 4 = Autorisation (qui peut faire quoi ?)

---

## Comment fonctionne l'authentification par token

```
1. L'utilisateur envoie email + password
   POST /auth/login
   { "email": "...", "password": "..." }

2. Le serveur vérifie les credentials
   → trouve l'user en BDD
   → compare le password hashé

3. Si valide, le serveur génère un token JWT
   → le retourne au client

4. Le client stocke ce token (localStorage, cookie)
   → l'envoie dans chaque requête suivante
   Authorization: Bearer <token>

5. Le serveur vérifie le token à chaque requête
   → si valide, identifie l'utilisateur
   → si invalide/expiré, retourne 401
```

---

## JWT — JSON Web Token

Un JWT est un token signé qui contient des informations sur l'utilisateur.

### Structure

```
header.payload.signature

eyJhbGciOiJIUzI1NiJ9.eyJpZCI6InVzZXItMSIsImVtYWlsIjoiLi4uIn0.xK8s...
```

### Le payload (décodé)

```json
{
  "id": "user-1",
  "email": "victor@example.com",
  "iat": 1715000000,
  "exp": 1715086400
}
```

- `iat` = issued at (quand le token a été créé)
- `exp` = expiration (quand il expire)

### Propriétés importantes

```
Signé      →  le serveur vérifie que le token n'a pas été modifié
Stateless  →  pas besoin de stocker le token en BDD
              le serveur peut vérifier n'importe quel token avec sa clé secrète
Non chiffré →  le payload est lisible par n'importe qui (base64)
              ne jamais mettre de données sensibles dedans
```

---

## Les mots de passe — bcrypt

On ne stocke jamais un mot de passe en clair en base de données.

```
Password en clair   →  "monmotdepasse"
                        si la BDD est compromise → catastrophe

Password hashé      →  "$2b$10$K8Qw..."
                        irréversible — impossible de retrouver l'original
                        unique — même password → hash différent à chaque fois
```

### Comment ça marche

```
Registration  →  hash(password) → stocker le hash
Login         →  bcrypt.compare(password_entré, hash_stocké) → true/false
```

---

## Better Auth

Better Auth est une bibliothèque d'authentification moderne pour TypeScript.

### Pourquoi Better Auth plutôt que coder soi-même ?

```
Coder l'auth soi-même  →  complexe, risques de failles de sécurité
                           gestion des tokens, refresh, sessions...

Better Auth            →  battle-tested, sécurisé par défaut
                           gère : register, login, logout, sessions, OAuth...
                           intégration native avec Prisma
```

### Ce que Better Auth gère pour nous

```
✅ Hachage des mots de passe (bcrypt)
✅ Génération et vérification des sessions
✅ Routes d'auth (/sign-in, /sign-up, /sign-out)
✅ Middleware de protection des routes
✅ Gestion des cookies sécurisés
```

---

## Sessions vs JWT dans Better Auth

Better Auth utilise par défaut des **sessions en base de données** plutôt que des JWT purs.

```
JWT pur      →  stateless, token contient tout
                impossible de révoquer avant expiration

Sessions BDD →  un token de session référence une entrée en BDD
                révocable à tout moment (logout instantané)
                plus sécurisé pour les apps sensibles
```

Better Auth gère ça automatiquement — il crée les tables `session` et `account` en BDD.

---

## Les routes d'auth dans DevFlow

```
POST  /api/auth/sign-up/email   →  créer un compte
POST  /api/auth/sign-in/email   →  se connecter
POST  /api/auth/sign-out        →  se déconnecter
GET   /api/auth/session         →  voir la session courante
```

Ces routes sont gérées automatiquement par Better Auth — pas besoin de les écrire.

---

## Le middleware d'authentification

Une fois Better Auth configuré, on protège les routes avec un middleware :

```typescript
// Vérifie que l'utilisateur est connecté
app.use('/projects/*', authMiddleware)
app.use('/projects/:id/tasks/*', authMiddleware)

// Si pas de session valide → 401 Unauthorized
// Si session valide → on peut accéder à l'utilisateur connecté
```

---

## Ce qu'on retient

- Auth = vérifier l'identité / Authz = vérifier les droits
- JWT = token signé et stateless, sessions BDD = révocables
- Jamais de password en clair — toujours bcrypt
- Better Auth gère l'auth complète, on se concentre sur le middleware de protection
- Après la Version 2, toutes les routes nécessitent d'être connecté
