"""
Central AI service — all OpenAI calls go through here.
Uses structured outputs (response_format with Pydantic models) wherever
we need to persist data, so format errors are minimised.
"""
import json
from openai import OpenAI
from app.core.config import settings
from app.schemas.evaluation import EvaluationAI, EvalQuestionAI
from app.schemas.course import CourseAI
from app.schemas.quiz import QuizAI
from app.schemas.skill import SkillAI

client = OpenAI(api_key=settings.OPENAI_API_KEY)
MODEL = settings.OPENAI_MODEL


# ── Helpers ───────────────────────────────────────────────────────────────────

def _chat(messages: list[dict], temperature: float = 0.7, max_tokens: int = 4096) -> tuple[str, int]:
    """Returns (content, tokens_used)."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else 0
    return content, tokens


def _chat_json(messages: list[dict], temperature: float = 0.3, max_tokens: int = 4096) -> tuple[dict, int]:
    """Forces JSON mode. Returns (parsed_dict, tokens_used)."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content or "{}"
    tokens = response.usage.total_tokens if response.usage else 0
    return json.loads(content), tokens


# ── 1. Initial Evaluation ─────────────────────────────────────────────────────

def generate_evaluation(
    objectif: str,
    domaine: str,
    technologie: str | None,
    niveau: str,
) -> EvaluationAI:
    """Generate an adaptive initial evaluation (5-8 questions)."""
    tech = technologie or domaine
    prompt = f"""Tu es un expert pédagogique. Génère une évaluation initiale pour un apprenant.

Objectif : {objectif}
Domaine : {domaine}
Technologie : {tech}
Niveau déclaré : {niveau}

Génère 6 questions d'évaluation adaptées à ce domaine. Mix recommandé :
- 4-5 questions QCM (type "mcq")
- 1-2 questions ouvertes (type "open")

Retourne un JSON STRICTEMENT dans ce format :
{{
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": 1,
      "explication": "...",
      "placeholder": null
    }},
    {{
      "id": 2,
      "type": "open",
      "question": "...",
      "options": null,
      "answer": null,
      "explication": null,
      "placeholder": "Décris ta réponse ici..."
    }}
  ]
}}

Règles :
- Les QCM ont exactement 4 options et "answer" est l'index de la bonne réponse (0-3)
- Les questions ouvertes ont options=null et answer=null
- Adapte la difficulté au niveau déclaré
- Questions pertinentes pour {tech}
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.4)
    return EvaluationAI(questions=[EvalQuestionAI(**q) for q in data["questions"]])


def analyze_evaluation(
    objectif: str,
    technologie: str | None,
    questions: list[EvalQuestionAI],
    answers: dict[int, int | str],
) -> dict:
    """Analyze evaluation results, return score, niveau_estime, feedback, competences."""
    tech = technologie or objectif

    # Score MCQ locally
    mcq_questions = [q for q in questions if q.type == "mcq"]
    correct = sum(
        1 for q in mcq_questions
        if str(answers.get(q.id)) == str(q.answer)
    )
    mcq_score = round((correct / len(mcq_questions) * 100) if mcq_questions else 0)

    # Build context for AI analysis
    qa_text = "\n".join([
        f"Q{q.id}: {q.question}\n  Réponse: {answers.get(q.id, 'non répondu')}"
        for q in questions
    ])

    prompt = f"""Tu es un expert pédagogique. Analyse les résultats d'une évaluation initiale.

Objectif d'apprentissage : {objectif}
Technologie : {tech}
Score QCM brut : {mcq_score}%

Questions et réponses :
{qa_text}

Retourne un JSON avec :
{{
  "niveau_estime": "debutant|intermediaire|avance",
  "feedback": "Feedback personnalisé de 2-3 phrases sur les forces et axes d'amélioration",
  "competences": [
    {{"nom": "Nom compétence", "score": 0-100}},
    ...
  ]
}}

Génère 4-6 compétences spécifiques liées à {tech}.
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.3)
    data["score"] = mcq_score
    return data


# ── 2. Course Generation ──────────────────────────────────────────────────────

def generate_course(
    objectif: str,
    domaine: str,
    technologie: str | None,
    niveau: str,
    temps_disponible: int,
    duree_souhaitee: int,
    competences_faibles: list[str] | None = None,
) -> CourseAI:
    """Generate a full structured learning path."""
    tech = technologie or domaine
    faibles_text = (
        f"Points faibles identifiés à renforcer : {', '.join(competences_faibles)}"
        if competences_faibles else ""
    )

    prompt = f"""Tu es un expert pédagogique. Génère un parcours d'apprentissage complet et structuré.

Objectif : {objectif}
Technologie : {tech}
Niveau : {niveau}
Temps disponible : {temps_disponible} minutes par jour
Durée souhaitée : {duree_souhaitee} semaines
{faibles_text}

Retourne un JSON STRICTEMENT dans ce format :
{{
  "titre": "Titre du cours",
  "description": "Description courte du cours",
  "niveau": "{niveau}",
  "modules": [
    {{
      "titre": "Titre du module",
      "description": "Description du module",
      "ordre": 1,
      "objectifs": ["Objectif 1", "Objectif 2"],
      "lessons": [
        {{
          "titre": "Titre de la leçon",
          "description": "Description courte",
          "duree": 15,
          "ordre": 1
        }}
      ]
    }}
  ]
}}

Règles :
- 5-8 modules progressifs
- 2-4 leçons par module
- Le dernier module doit être un projet pratique
- Les durées des leçons en minutes (10-30 min)
- Progression logique du plus simple au plus complexe
- Adapté au niveau {niveau} pour {tech}
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.4, max_tokens=6000)
    return CourseAI(**data)


# ── 3. Lesson Content Generation ─────────────────────────────────────────────

def generate_lesson_content(
    lesson_titre: str,
    module_titre: str,
    cours_titre: str,
    niveau: str,
    technologie: str,
) -> list[dict]:
    """Generate rich content blocks for a lesson."""
    prompt = f"""Tu es un expert en {technologie} et en pédagogie. Génère le contenu détaillé d'une leçon.

Cours : {cours_titre}
Module : {module_titre}
Leçon : {lesson_titre}
Niveau : {niveau}
Technologie : {technologie}

Retourne un JSON avec une liste de blocs de contenu :
{{
  "blocks": [
    {{"type": "intro", "texte": "Introduction en **markdown** avec `code inline`"}},
    {{"type": "code", "langage": "python", "titre": "Exemple", "code": "# code ici", "explication": "Explication du code"}},
    {{"type": "info", "titre": "💡 Astuce", "texte": "Conseil important"}},
    {{"type": "resume", "points": ["Point clé 1", "Point clé 2"]}}
  ]
}}

Règles :
- Commence par un bloc "intro"
- Inclus 1-3 blocs "code" avec des exemples pratiques réels
- Ajoute 1-2 blocs "info" pour les astuces
- Termine par un bloc "resume" avec 4-5 points clés
- Le code doit être fonctionnel et adapté à {niveau}
- Explications claires et pédagogiques
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.5, max_tokens=3000)
    return data.get("blocks", [])


# ── 4. Quiz Generation ────────────────────────────────────────────────────────

def generate_quiz(
    lesson_titre: str,
    module_titre: str,
    technologie: str,
    niveau: str,
    nb_questions: int = 5,
) -> QuizAI:
    """Generate a quiz for a lesson or module."""
    prompt = f"""Tu es un expert pédagogique. Génère un quiz de {nb_questions} questions.

Module : {module_titre}
Leçon/Sujet : {lesson_titre}
Technologie : {technologie}
Niveau : {niveau}

Retourne un JSON :
{{
  "titre": "Quiz — {lesson_titre}",
  "questions": [
    {{
      "question": "...",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "reponse": 0,
      "explication": "Explication de la bonne réponse"
    }}
  ]
}}

Règles :
- Exactement {nb_questions} questions QCM
- 4 options par question
- "reponse" = index (0-3) de la bonne réponse
- Questions variées testant la compréhension, pas la mémorisation
- Explications claires et pédagogiques
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.4)
    return QuizAI(**data)


# ── 5. Exercise Feedback ──────────────────────────────────────────────────────

def analyze_exercise(
    enonce: str,
    solution_attendue: str | None,
    reponse_utilisateur: str,
    technologie: str,
    niveau: str,
) -> dict:
    """Analyze a code/text exercise submission and return feedback."""
    solution_text = f"Solution de référence :\n{solution_attendue}" if solution_attendue else ""
    prompt = f"""Tu es un tuteur expert en {technologie}. Évalue la réponse d'un apprenant de niveau {niveau}.

Énoncé : {enonce}
{solution_text}

Réponse de l'apprenant :
{reponse_utilisateur}

Retourne un JSON :
{{
  "correct": true/false,
  "score": 0-100,
  "feedback": "Feedback pédagogique bienveillant et précis",
  "suggestion": "Suggestion d'amélioration si nécessaire ou null"
}}

Règles :
- Score entre 0 et 100
- Feedback constructif et encourageant
- Pointe les erreurs sans donner directement la solution
- Si la réponse est partiellement correcte, le dire clairement
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.3)
    return data


# ── 6. Course Adaptation ──────────────────────────────────────────────────────

def suggest_adaptation(
    objectif: str,
    technologie: str,
    competences: list[dict],
    progression: float,
) -> dict:
    """Suggest course adaptations based on skill scores."""
    comp_text = "\n".join([f"- {c['nom']}: {c['score']}%" for c in competences])
    prompt = f"""Tu es un système d'adaptation pédagogique. Analyse les compétences d'un apprenant.

Objectif : {objectif}
Technologie : {technologie}
Progression globale : {progression}%

Compétences actuelles :
{comp_text}

Retourne un JSON avec des recommandations d'adaptation :
{{
  "actions": [
    {{
      "type": "revision|exercice_supplementaire|ralentir|accelerer|module_bonus",
      "competence": "Nom de la compétence concernée",
      "description": "Description de l'action recommandée"
    }}
  ],
  "message": "Message d'encouragement personnalisé pour l'apprenant"
}}

Recommande 2-4 actions concrètes basées sur les lacunes identifiées (score < 60%).
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.4)
    return data


# ── 7. AI Tutor ───────────────────────────────────────────────────────────────

def tutor_chat(
    message: str,
    history: list[dict],
    context: dict | None,
    niveau: str = "debutant",
    technologie: str = "",
) -> tuple[str, int]:
    """AI tutor conversational response."""
    context_text = ""
    if context:
        lesson_titre = context.get("lesson_titre", "")
        if lesson_titre:
            context_text = f"L'apprenant est en train d'étudier la leçon : '{lesson_titre}'.\n"

    system_prompt = f"""Tu es un tuteur IA bienveillant et expert en {technologie or 'programmation'}.
Tu accompagnes un apprenant de niveau {niveau}.

{context_text}
Règles :
- Réponds en français, de manière claire et pédagogique
- Adapte ton niveau d'explication au niveau de l'apprenant ({niveau})
- Pour les exercices, guide sans donner directement la solution complète
- Propose des exemples concrets quand c'est utile
- Encourage et motive l'apprenant
- Si tu donnes du code, utilise des blocs markdown
- Sois concis : 2-4 paragraphes maximum sauf si une explication longue est nécessaire
"""
    messages = [{"role": "system", "content": system_prompt}]
    # Add history (last 8 messages max to save tokens)
    for h in history[-8:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    return _chat(messages, temperature=0.7, max_tokens=1500)


# ── 8. Skills Extraction ──────────────────────────────────────────────────────

def extract_skills(objectif: str, technologie: str, modules: list[str]) -> list[dict]:
    """Extract key skills from a learning path."""
    modules_text = "\n".join([f"- {m}" for m in modules])
    prompt = f"""Identifie les compétences clés d'un parcours d'apprentissage.

Objectif : {objectif}
Technologie : {technologie}
Modules du parcours :
{modules_text}

Retourne un JSON :
{{
  "skills": [
    {{"nom": "Nom de la compétence", "description": "Description courte"}}
  ]
}}

Génère 5-8 compétences mesurables et spécifiques à {technologie}.
"""
    data, _ = _chat_json([{"role": "user", "content": prompt}], temperature=0.3)
    return data.get("skills", [])
