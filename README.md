# 🎬 Streaming Backend

Backend complet pour une application de **streaming vidéo** développé avec **Node.js**, **Express**, **Prisma** et **PostgreSQL**.  
Il gère l’authentification, la gestion des utilisateurs, le stockage des vidéos sur **AWS S3**, et la sécurisation via **JWT**.

---

## 🚀 Technologies utilisées

- 🟢 **Node.js** – Environnement d’exécution JavaScript
- ⚙️ **Express.js** – Framework serveur rapide et minimaliste
- 🗃️ **Prisma ORM** – Gestion de la base de données PostgreSQL
- 🐘 **PostgreSQL** – Base de données relationnelle robuste
- 🔐 **JWT (JSON Web Token)** – Authentification sécurisée
- ☁️ **AWS S3** – Stockage cloud des médias
- ⚡ **dotenv** – Gestion des variables d’environnement
- 🧪 **Nodemon** – Rechargement automatique en développement

---

## 🧩 Installation

### 1️⃣ Cloner le dépôt

```bash
git clone https://github.com/Yves-Yangasso/streaming-backend.git
cd streaming-backend


Installer les dépendances

npm install


Configurer les variables d’environnement

Crée un fichier .env à la racine du projet et ajoute :

DATABASE_URL="postgresql://postgres:motdepasse@localhost:5432/streaming_db?schema=public"
JWT_SECRET="votre_secret_jwt_super_securise"
PORT=3000

# AWS Configuration
AWS_BUCKET_NAME="votre-bucket-s3"
AWS_ACCESS_KEY_ID="votre-key"
AWS_SECRET_ACCESS_KEY="votre-secret"


Base de données (Prisma + PostgreSQL)
Initialiser Prisma
npx prisma init

Synchroniser la base
npx prisma migrate dev --name init

Générer le client Prisma
npx prisma generate

Ouvrir Prisma Studio
npx prisma studio

▶️ Lancer le serveur

En mode développement :

npm run dev


En mode production :

npm start


Structure du projet
streaming-backend/
│
├── prisma/
│   ├── schema.prisma        # Définition des modèles et relations
│   └── migrations/          # Historique des migrations
│
├── src/
│   ├── index.js             # Point d'entrée du serveur Express
│   ├── routes/              # Routes API
│   ├── controllers/         # Logique métier
│   ├── middlewares/         # Middlewares (auth, validation, etc.)
│   ├── services/            # Services (AWS, JWT, etc.)
│   ├── utils/               # Fonctions utilitaires
│   └── config/              # Configuration Prisma & AWS
│
├── .env                     # Variables d'environnement (non versionné)
├── .gitignore
├── package.json
└── README.md


📡 API Endpoints
🔐 Authentification
Méthode	Endpoint	Description	Auth requise
POST	/api/auth/register	Crée un nouvel utilisateur	❌
POST	/api/auth/login	Connecte un utilisateur et renvoie un token JWT	❌
GET	/api/auth/me	Récupère les infos de l’utilisateur connecté	✅
👤 Utilisateurs
Méthode	Endpoint	Description	Auth requise
GET	/api/users	Liste tous les utilisateurs	✅ (admin)
GET	/api/users/:id	Détails d’un utilisateur	✅
PUT	/api/users/:id	Met à jour un utilisateur	✅
DELETE	/api/users/:id	Supprime un utilisateur	✅ (admin)
🎥 Vidéos
Méthode	Endpoint	Description	Auth requise
GET	/api/videos	Liste toutes les vidéos	❌
GET	/api/videos/:id	Détails d’une vidéo	❌
POST	/api/videos	Upload une nouvelle vidéo (via AWS S3)	✅
PUT	/api/videos/:id	Met à jour les infos d’une vidéo	✅
DELETE	/api/videos/:id	Supprime une vidéo	✅ (admin)
⚙️ Scripts disponibles
Commande	Description
npm run dev	Lance le serveur en développement
npm start	Lance le serveur en production
npx prisma studio	Ouvre Prisma Studio
npx prisma migrate dev	Exécute les migrations
🧪 Exemple de requête API
Inscription (POST /api/auth/register)
{
  "username": "user123",
  "email": "user@example.com",
  "password": "monmotdepasse"
}

Réponse
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}

