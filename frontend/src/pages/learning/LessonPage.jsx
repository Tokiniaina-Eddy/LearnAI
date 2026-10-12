import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, BookOpen,
  MessageSquare, FileQuestion, Lightbulb, Code2, Copy, Check, AlertCircle, Sparkles, Lock,
} from 'lucide-react';
import { courseService, progressService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import AiTutorWidget from '../../components/tutor/AiTutorWidget';
import clsx from 'clsx';
import toast from 'react-hot-toast';

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
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-700 text-primary-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    courseService.getLesson(lessonId)
      .then((res) => {
        setLesson(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Impossible de charger la leçon. Vérifie que le backend est actif.');
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await courseService.getLesson(lessonId, { regenerate: true });
      setLesson(res.data);
      toast.success('Leçon enrichie et complétée avec l\'IA !');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la régénération');
    } finally {
      setRegenerating(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await progressService.markLesson(lessonId);
      setCompleted(true);
      toast.success('Leçon complétée !');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la validation');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 animate-in">
        <div className="card card-body max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-danger-400 mx-auto mb-3" />
          <p className="text-slate-100 font-semibold mb-1">Erreur</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => window.location.reload()} className="btn-secondary">
              Réessayer
            </button>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  const rawContenu = lesson.contenu_blocks || lesson.contenu;
  let blocks = [];
  if (Array.isArray(rawContenu)) {
    blocks = rawContenu;
  } else if (typeof rawContenu === 'string') {
    try {
      const parsed = JSON.parse(rawContenu);
      blocks = Array.isArray(parsed) ? parsed : (parsed.blocks || []);
    } catch {
      blocks = [{ type: 'intro', texte: rawContenu }];
    }
  }

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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="btn btn-secondary flex items-center gap-1.5 text-sm"
              title="Régénérer et enrichir le contenu complet de la leçon avec l'IA"
            >
              {regenerating ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4 text-warning-400" />}
              <span className="hidden sm:inline">Enrichir avec l'IA</span>
            </button>
            <button
              onClick={() => setShowTutor(!showTutor)}
              className={clsx('btn shrink-0', showTutor ? 'btn-primary' : 'btn-secondary')}
              aria-pressed={showTutor}
            >
              <MessageSquare className="w-4 h-4" />
              Tuteur IA
            </button>
          </div>
        </div>

        {/* Content blocks */}
        <div ref={contentRef} className="space-y-6">
          {blocks.map((block, i) => {
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
          {/* Complete button & Quiz CTAs */}
          {(!completed && lesson.statut !== 'complete') ? (
            <div className="space-y-3 mb-6">
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-primary btn-lg w-full"
              >
                {completing ? <Spinner size="sm" /> : <><CheckCircle className="w-5 h-5" /> Marquer comme complétée</>}
              </button>
              {(!lesson.lesson_suivante && lesson.module?.id) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-800/80 border border-surface-700 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-warning-400 shrink-0" />
                  <span>Marque d'abord cette leçon comme terminée pour débloquer le Quiz du module.</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Module quiz CTA — shown on last lesson of the module ONLY after completion! */}
              {!lesson.lesson_suivante && lesson.module?.id && (
                <Link
                  to={`/quiz/module/${lesson.module.id}`}
                  className="group relative w-full mb-6 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-base transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-600/25 hover:shadow-primary-500/40 hover:scale-[1.02]"
                >
                  <FileQuestion className="w-5 h-5" />
                  Passer au Quiz du module
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              )}

              {/* Per-lesson quiz CTA — shown only after completion */}
              {lesson.quiz_id && (
                <Link to={`/quiz/${lesson.quiz_id}`} className="btn-secondary w-full mb-4 justify-center">
                  <FileQuestion className="w-4 h-4 text-warning-500" />
                  Faire le quiz de cette leçon
                </Link>
              )}
            </>
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
