# HTTP & REST — Théorie

## Qu'est-ce que HTTP ?

HTTP (HyperText Transfer Protocol) est le protocole de communication entre un client (navigateur, application) et un serveur.

Chaque échange suit le même modèle :
```
Client  →  envoie une REQUEST  →  Serveur
Client  ←  reçoit une RESPONSE ←  Serveur
```

---

## Anatomie d'une requête HTTP

```
POST /projects HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{ "name": "DevFlow", "description": "Mon projet" }
```

Une requête contient :
- **La méthode** — ce qu'on veut faire (POST, GET...)
- **Le chemin** — sur quelle ressource (/projects)
- **Les headers** — métadonnées (type de contenu, auth...)
- **Le body** — les données envoyées (pas toujours présent)

---

## Anatomie d'une réponse HTTP

```
HTTP/1.1 201 Created
Content-Type: application/json

{ "data": { "id": "clh3d2x9f0000", "name": "DevFlow" } }
```

Une réponse contient :
- **Le status code** — résultat de l'opération
- **Les headers** — métadonnées
- **Le body** — les données retournées

---

## Les méthodes HTTP

| Méthode | Usage | Body ? |
|---------|-------|--------|
| GET | Lire une ressource | Non |
| POST | Créer une ressource | Oui |
| PATCH | Modifier partiellement | Oui |
| PUT | Remplacer complètement | Oui |
| DELETE | Supprimer | Non |

### GET — jamais de side effects
```
GET /projects        → liste tous les projets
GET /projects/abc123 → retourne un projet précis
```
Un GET ne doit jamais modifier des données. C'est une règle fondamentale.

### POST — crée une nouvelle ressource
```
POST /projects
Body: { "name": "DevFlow" }
→ crée un projet, retourne 201
```

### PATCH vs PUT
```
PATCH /projects/abc123
Body: { "status": "ARCHIVED" }
→ modifie SEULEMENT le status, le reste est intact

PUT /projects/abc123
Body: { "name": "Nouveau nom" }
→ remplace TOUT le projet, les champs non envoyés passent à null
```
En pratique, on utilise presque toujours **PATCH** pour les mises à jour partielles.

### DELETE
```
DELETE /projects/abc123
→ supprime la ressource, retourne 204 (pas de body)
```

---

## Les status codes

### 2xx — Succès
```
200 OK          → succès (GET, PATCH, PUT)
201 Created     → ressource créée (POST)
204 No Content  → succès sans body (DELETE)
```

### 4xx — Erreur du client
```
400 Bad Request     → données invalides envoyées
401 Unauthorized    → non authentifié (pas de token)
403 Forbidden       → authentifié mais pas autorisé
404 Not Found       → ressource introuvable
409 Conflict        → conflit (ex: email déjà utilisé)
422 Unprocessable   → validation échouée
```

### 5xx — Erreur du serveur
```
500 Internal Server Error → bug côté serveur (inattendu)
```

---

## REST — Representational State Transfer

REST est un style d'architecture pour concevoir des APIs. Ce n'est pas un protocole, c'est un ensemble de conventions.

### Les 3 règles fondamentales de REST

**1. Les URLs représentent des ressources (des noms, pas des verbes)**
```
❌ /getProjects
❌ /createProject
❌ /deleteProject/123

✅ /projects          → la collection
✅ /projects/123      → une ressource précise
```

**2. Les méthodes HTTP expriment l'action**
```
GET    /projects      → lire la liste
POST   /projects      → créer un projet
PATCH  /projects/123  → modifier le projet 123
DELETE /projects/123  → supprimer le projet 123
```

**3. Les ressources peuvent être imbriquées**
```
/projects/123/tasks        → les tâches du projet 123
/projects/123/tasks/456    → la tâche 456 du projet 123
```
L'imbrication reflète la relation parent-enfant dans les données.

---

## Headers importants

```
Content-Type: application/json   → le body est du JSON
Authorization: Bearer <token>    → token d'authentification
Accept: application/json         → le client veut du JSON en retour
```

---

## Exemple complet — cycle d'une requête dans DevFlow

```
1. Le client envoie :
   POST /projects
   Content-Type: application/json
   { "name": "DevFlow", "description": "Mon app" }

2. Le serveur reçoit la requête
3. Valide les données (name est requis ?)
4. Crée le projet en base de données
5. Retourne :
   HTTP 201 Created
   { "data": { "id": "clh3d...", "name": "DevFlow", ... } }
```

---

## Ce qu'on retient

- HTTP = protocole requête / réponse
- La méthode dit QUOI faire, l'URL dit SUR QUOI
- Les status codes communiquent le résultat clairement
- REST = des URLs qui représentent des ressources + méthodes HTTP pour les actions
