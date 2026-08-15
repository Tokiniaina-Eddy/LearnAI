import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, BookOpen,
  MessageSquare, FileQuestion, Lightbulb, Code2, Copy, Check,
} from 'lucide-react';
import { courseService, progressService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import AiTutorWidget from '../../components/tutor/AiTutorWidget';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── Mock lesson ───────────────────────────────────────────────────────────────
const MOCK_LESSON = {
  id: 5,
  titre: 'Query Parameters',
  module: { id: 2, titre: 'Routing & Paramètres', cours_id: 1 },
  ordre: 2,
  duree: 15,
  statut: 'en_cours',
  contenu: [
    {
      type: 'intro',
      texte: 'Les **query parameters** sont des paramètres optionnels passés dans l\'URL après le `?`. FastAPI les détecte automatiquement depuis la signature de la fonction.',
    },
    {
      type: 'code',
      langage: 'python',
      titre: 'Exemple basique',
      code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}`,
      explication: 'Ici `skip` et `limit` sont des query parameters. FastAPI les convertit automatiquement vers les types Python déclarés.',
    },
    {
      type: 'info',
      titre: '💡 Astuce',
      texte: 'Si un query parameter n\'a pas de valeur par défaut, il devient **obligatoire**. Avec une valeur par défaut, il devient optionnel.',
    },
    {
      type: 'code',
      langage: 'python',
      titre: 'Paramètre obligatoire vs optionnel',
      code: `from typing import Optional

@app.get("/users/")
async def get_users(
    active: bool,             # Obligatoire
    name: Optional[str] = None  # Optionnel
):
    return {"active": active, "name": name}`,
    },
    {
      type: 'resume',
      points: [
        'Les query parameters se déclarent dans la signature de fonction',
        'FastAPI gère la conversion de type automatiquement',
        'Sans valeur par défaut = paramètre obligatoire',
        'Avec valeur par défaut = paramètre optionnel',
        'On peut utiliser `Optional[type]` pour les valeurs nullables',
      ],
    },
  ],
  lesson_precedente: { id: 4, titre: 'Path parameters' },
  lesson_suivante: { id: 6, titre: 'Request body avec Pydantic' },
  quiz_id: null,
};
// ─────────────────────────────────────────────────────────────────────────────

function CodeBlock({ code, langage, titre }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-surface-700 bg-surface-900">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-800 border-b border-surface-700">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-400">{titre || langage}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMarkdown(text) {
  // Very lightweight inline markdown: **bold** and `code`
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-700 text-primary-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    courseService.getLesson(lessonId)
      .then((res) => setLesson(res.data))
      .catch(() => setLesson(MOCK_LESSON))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await progressService.markLesson(lessonId);
      setCompleted(true);
      toast.success('Leçon complétée ! 🎉');
    } catch {
      setCompleted(true); // optimistic in dev
      toast.success('Leçon complétée ! 🎉');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  }

  if (!lesson) return null;

  return (
    <div className="flex gap-6 animate-in">
      {/* Main content */}
      <div className={clsx('flex-1 min-w-0 transition-all', showTutor ? 'max-w-3xl' : '')}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Fil d'ariane">
          <Link to={`/learning/${lesson.module?.cours_id}`} className="hover:text-slate-300 transition-colors">
            {lesson.module?.titre}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{lesson.titre}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-primary">Leçon {lesson.ordre}</span>
              <span className="badge badge-surface">{lesson.duree} min</span>
              {(lesson.statut === 'complete' || completed) && (
                <span className="badge badge-success"><CheckCircle className="w-3 h-3" /> Complétée</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-50">{lesson.titre}</h1>
          </div>
          <button
            onClick={() => setShowTutor(!showTutor)}
            className={clsx('btn shrink-0', showTutor ? 'btn-primary' : 'btn-secondary')}
            aria-pressed={showTutor}
          >
            <MessageSquare className="w-4 h-4" />
            Tuteur IA
          </button>
        </div>

        {/* Content blocks */}
        <div ref={contentRef} className="space-y-6">
          {lesson.contenu.map((block, i) => {
            if (block.type === 'intro') {
              return (
                <div key={i} className="text-slate-300 leading-relaxed text-base"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(block.texte) }}
                />
              );
            }

            if (block.type === 'code') {
              return (
                <div key={i} className="space-y-3">
                  <CodeBlock code={block.code} langage={block.langage} titre={block.titre} />
                  {block.explication && (
                    <p className="text-sm text-slate-400 leading-relaxed pl-2 border-l-2 border-surface-700"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(block.explication) }}
                    />
                  )}
                </div>
              );
            }

            if (block.type === 'info') {
              return (
                <div key={i} className="bg-primary-600/10 border border-primary-600/20 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                    <div>
                      {block.titre && (
                        <p className="font-semibold text-primary-300 mb-1">{block.titre}</p>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(block.texte) }}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (block.type === 'resume') {
              return (
                <div key={i} className="card card-body bg-surface-800/50">
                  <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-400" />
                    Points clés
                  </h3>
                  <ul className="space-y-2">
                    {block.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                        <span dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Actions */}
        <div className="mt-10 pt-6 border-t border-surface-800">
          {/* Complete button */}
          {!completed && lesson.statut !== 'complete' && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="btn-primary btn-lg w-full mb-4"
            >
              {completing ? <Spinner size="sm" /> : <><CheckCircle className="w-5 h-5" /> Marquer comme complétée</>}
            </button>
          )}

          {/* Quiz CTA */}
          {lesson.quiz_id && (
            <Link to={`/quiz/${lesson.quiz_id}`} className="btn-secondary w-full mb-4 justify-center">
              <FileQuestion className="w-4 h-4 text-warning-500" />
              Faire le quiz de cette leçon
            </Link>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between gap-4">
            {lesson.lesson_precedente ? (
              <Link
                to={`/lesson/${lesson.lesson_precedente.id}`}
                className="btn-ghost flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm truncate max-w-xs">{lesson.lesson_precedente.titre}</span>
              </Link>
            ) : <div />}

            {lesson.lesson_suivante && (
              <Link
                to={`/lesson/${lesson.lesson_suivante.id}`}
                className="btn-secondary flex items-center gap-2"
              >
                <span className="text-sm truncate max-w-xs">{lesson.lesson_suivante.titre}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* AI Tutor panel */}
      {showTutor && (
        <div className="w-96 shrink-0 sticky top-6 h-[calc(100vh-3rem)]">
          <AiTutorWidget
            context={{ lesson_id: lessonId, lesson_titre: lesson.titre }}
            onClose={() => setShowTutor(false)}
          />
        </div>
      )}
    </div>
  );
}
