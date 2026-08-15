# LearnAI — Plateforme d'apprentissage personnalisée

## Démarrage rapide

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (ou Docker)

---

### 1. Base de données (PostgreSQL)

```bash
# Avec Docker (le plus simple)
docker run -d \
  --name learnai_db \
  -e POSTGRES_USER=learnai \
  -e POSTGRES_PASSWORD=learnai \
  -e POSTGRES_DB=learnai \
  -p 5432:5432 \
  postgres:16-alpine
```

---

### 2. Backend (FastAPI)

```bash
cd backend

# Configurer les variables d'environnement
cp .env.example .env
# Ouvrir .env et renseigner OPENAI_API_KEY

# Démarrer
chmod +x start.sh
./start.sh
```

L'API sera disponible sur :
- `http://localhost:8000` — API
- `http://localhost:8000/docs` — Swagger UI

---

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`

---

### 4. Tout en même temps (Docker Compose)

```bash
# Configurer le .env
cp backend/.env.example backend/.env
# → Renseigner OPENAI_API_KEY dans backend/.env

docker-compose up --build
```

---

## Variables d'environnement importantes

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL |
| `SECRET_KEY` | Clé secrète JWT (32+ chars) |
| `OPENAI_API_KEY` | Clé API OpenAI |
| `OPENAI_MODEL` | Modèle OpenAI (défaut: gpt-4o-mini) |

---

## Architecture

```
LearnAI/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── pages/     # 12 pages
│       ├── components/# Layout, UI, Tutor
│       ├── context/   # AuthContext
│       └── services/  # api.js (axios)
│
├── backend/           # FastAPI + SQLAlchemy
│   └── app/
│       ├── api/routes/ # 11 routers
│       ├── models/    # 9 modèles SQLAlchemy
│       ├── schemas/   # Pydantic v2
│       ├── services/  # ai_service.py
│       └── core/      # config, security, deps
│
└── docker-compose.yml
```
