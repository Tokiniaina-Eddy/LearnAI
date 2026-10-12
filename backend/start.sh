#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════╗"
echo "║      LearnAI Backend             ║"
echo "╚══════════════════════════════════╝"
echo ""

# Choose suitable python binary (prefer stable python3.13)
PYTHON_BIN="python3"
if command -v python3.13 &> /dev/null; then
  PYTHON_BIN="python3.13"
fi

# Create venv if not exists or broken
if [ ! -d ".venv" ] || [ ! -f ".venv/bin/pip" ]; then
  echo "▶ Création du virtualenv avec $PYTHON_BIN..."
  rm -rf .venv
  $PYTHON_BIN -m venv .venv
fi

# Activate
source .venv/bin/activate

echo "▶ Installation des dépendances..."
python -m pip install -r requirements.txt -q

# Check .env
if [ ! -f ".env" ]; then
  echo "⚠  Fichier .env manquant, copie de .env.example..."
  cp .env.example .env
  echo "✏  Configure DATABASE_URL et OPENAI_API_KEY dans backend/.env"
  exit 1
fi

echo "▶ Migrations Alembic..."
alembic upgrade head

echo ""
echo "✅ Backend prêt sur http://localhost:8000"
echo "   Swagger UI : http://localhost:8000/docs"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
