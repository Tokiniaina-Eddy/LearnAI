# 🚀 LearnAI — Plateforme d'Apprentissage Personnalisée par IA

> **LearnAI** transforme l'apprentissage en une expérience vivante, sur mesure et progressive. Propulsée par des modèles d'intelligence artificielle avancés, la plateforme s'adapte en temps réel au niveau, aux objectifs, aux forces et aux lacunes de chaque apprenant.

---

## 📖 À propos de LearnAI

Contrairement aux plateformes d'apprentissage traditionnelles basées sur des catalogues statiques de vidéos préenregistrées et des parcours rigides, **LearnAI** adopte une approche pédagogique dynamique et personnalisée :

* **Un parcours généré sur mesure** : L'IA conçoit un cursus structuré en modules, leçons et ateliers pratiques en fonction de votre niveau (débutant, intermédiaire, avancé) et de votre disponibilité quotidienne.
* **Une pédagogie active & conditionnelle** : Pour garantir une réelle assimilation, l'accès aux modules suivants est conditionné par la validation des leçons et la réussite d'un quiz de validation (score minimum requis : 50%).
* **Un tuteur IA bienveillant et socratique** : Disponible 24/7 dans chaque cours, le tuteur vous guide avec des explications claires, des analogies et des indices ciblés sans jamais vous donner la solution toute faite.
* **Une vision claire de vos acquis (Skill Map)** : Visualisez vos compétences acquises et repérez immédiatement les concepts à renforcer pour orienter vos révisions.

---

## ✨ Fonctionnalités Principales

| Fonctionnalité | Description |
|---|---|
| 🎯 **Onboarding & Évaluation Initiale** | Diagnostic interactif pour évaluer vos connaissances de départ et calibrer la difficulté du parcours. |
| 🗺️ **Génération de Parcours IA** | Création automatique de modules séquentiels avec objectifs pédagogiques clairs et durées estimées. |
| 📖 **Leçons Interactives & Riches** | Contenus structurés, synthèses de cours, blocs de code syntaxés et conseils pratiques. |
| ❓ **Quiz Adaptatifs de Module** | Questions générées selon le contenu exact de la leçon, correction immédiate avec explications détaillées et seuil de passage de 50%. |
| 💡 **Mini-Projets Pratiques** | Défis concrets à réaliser en fin de module pour appliquer les notions (bonus pratique non pénalisant). |
| 🧠 **Tuteur IA Contextuel** | Assistant conversationnel intégrant le contexte de la leçon en cours pour répondre à vos questions et débloquer vos doutes. |
| 📊 **Carte de Compétences (Skill Map)** | Visualisation détaillée du niveau de maîtrise par compétence, avec alertes ciblées sur les notions à réviser. |
| 📈 **Tableau de Bord & Métriques** | Suivi du score moyen, du temps total investi, des modules complétés et de la régularité d'apprentissage. |
| 🔐 **Authentification Robuste** | Inscription/connexion sécurisée par JWT, support Google OAuth et vérification d'email par code OTP. |

---

## 🛠️ Stack Technique

### Frontend
- **Framework** : [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Style** : Tailwind CSS, Thème sombre moderne & animations fluides
- **Icônes & UI** : [Lucide React](https://lucide.dev/), React Hot Toast, Recharts
- **Routage** : React Router v6 avec Error Boundary intégré

### Backend
- **Framework** : [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+ / 3.13)
- **ORM & Migrations** : SQLAlchemy 2.0 + Alembic
- **Base de données** : PostgreSQL 16 (ou SQLite en local)
- **Sécurité** : Passlib (Bcrypt), Python-JOSE (JWT), SlowAPI (Rate limiting)

### Intelligence Artificielle
- **Moteur LLM** : OpenAI API (`gpt-4o-mini` / `gpt-4o`)
- **Génération structurée** : Prompts optimisés avec sorties JSON typées

---

## 🚀 Démarrage Rapide

### Prérequis
- **Python** 3.11+ (ou 3.13)
- **Node.js** 18+ & **npm**
- **Docker & Docker Compose** *(optionnel, recommandé pour PostgreSQL)*
- Une clé API OpenAI (`OPENAI_API_KEY`)

---

### Option 1 : Avec Docker Compose (Recommandé)

Lancez l'ensemble des services (Base de données, Backend, Frontend) en une seule commande :

```bash
# 1. Cloner le dépôt et se placer dans le projet
cd LearnAI

# 2. Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env et renseigner votre OPENAI_API_KEY

# 3. Lancer les conteneurs
docker-compose up --build
```

- 🌐 **Frontend** : [http://localhost:5173](http://localhost:5173)
- ⚙️ **Backend API** : [http://localhost:8000](http://localhost:8000)
- 📚 **Documentation Swagger** : [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2 : Installation Locale (Sans Docker)

#### 1. Base de données PostgreSQL
Démarrez rapidement une instance PostgreSQL avec Docker :
```bash
docker run -d \
  --name learnai_db \
  -e POSTGRES_USER=learnai \
  -e POSTGRES_PASSWORD=learnai \
  -e POSTGRES_DB=learnai \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Backend (FastAPI)
```bash
cd backend

# Configurer l'environnement
cp .env.example .env
# Renseigner au minimum OPENAI_API_KEY dans backend/.env

# Lancer le script automatisé (création venv, dépendances, migrations et démarrage)
chmod +x start.sh
./start.sh
```

#### 3. Frontend (React + Vite)
Dans un nouveau terminal :
```bash
cd frontend

# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```
Rendez-vous sur [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Configuration (.env)

Voici les variables d'environnement clés disponibles dans `backend/.env` :

| Variable | Description | Valeur par défaut / Exemple |
|---|---|---|
| `DATABASE_URL` | Chaîne de connexion à la base de données | `postgresql://learnai:learnai@localhost:5432/learnai` |
| `SECRET_KEY` | Clé secrète de signature des tokens JWT | Chaîne aléatoire de 32+ caractères |
| `OPENAI_API_KEY` | Clé d'API OpenAI | `sk-...` |
| `OPENAI_MODEL` | Modèle LLM utilisé pour la génération | `gpt-4o-mini` |
| `ALLOWED_ORIGINS` | Origines autorisées par CORS | `http://localhost:5173,http://localhost:3000` |
| `SMTP_ENABLED` | Activation de l'envoi d'e-mails réels (OTP) | `false` *(les codes s'affichent dans la console si false)* |
| `GOOGLE_CLIENT_ID` | Client ID pour Google OAuth (optionnel) | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Client Secret pour Google OAuth (optionnel) | `...` |

---

## 📁 Structure du Projet

```
LearnAI/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Endpoints (auth, goals, courses, lessons, quizzes, tutor, dashboard, skillmap...)
│   │   ├── core/            # Configuration, sécurité JWT, dépendances
│   │   ├── models/          # Modèles de données SQLAlchemy
│   │   ├── schemas/         # Schémas de validation Pydantic v2
│   │   └── services/        # Service IA (prompts, intégration OpenAI, parsing)
│   ├── alembic/             # Scripts de migrations de base de données
│   ├── requirements.txt     # Dépendances Python
│   └── start.sh             # Script de démarrage automatisé
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants réutilisables (Layout, UI, Tuteur IA, ErrorBoundary)
│   │   ├── pages/           # Pages (Dashboard, Apprentissage, Leçon, Quiz, SkillMap, Auth, Onboarding)
│   │   ├── context/         # AuthContext (gestion session utilisateur)
│   │   └── services/        # Client API Axios avec intercepteurs JWT
│   ├── package.json         # Dépendances Node.js
│   └── vite.config.js       # Configuration Vite
│
├── docker-compose.yml       # Orchestration des conteneurs
└── README.md                # Documentation du projet
```

---

## 🔒 Règles Pédagogiques Clés

1. **Déblocage Séquentiel** : Pour accéder au module suivant, l'apprenant doit terminer les leçons du module en cours et réussir le quiz de module avec un **score ≥ 50%**.
2. **Validation des Leçons** : Une leçon doit être lue et validée avant de pouvoir passer au quiz du module.
3. **Redirection Post-Quiz** : Après la soumission du quiz, l'utilisateur est automatiquement redirigé vers la vue d'ensemble du parcours ou la liste des modules pour continuer sa progression.
4. **Skill Map & Renforcement** : Les compétences ayant un score inférieur à 50% sont catégorisées comme *« À renforcer »*, permettant une remédiation ciblée.

---

## 📄 Licence

Ce projet est distribué sous licence MIT. Libre à vous de l'utiliser et de l'adapter selon vos besoins.
