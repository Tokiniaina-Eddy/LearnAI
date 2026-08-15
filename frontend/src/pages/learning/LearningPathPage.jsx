import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronRight, CheckCircle, Lock, PlayCircle,
  FileQuestion, Code2, Sparkles, RefreshCw, AlertCircle,
} from 'lucide-react';
import { courseService } from '../../services/api';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_COURSE = {
  id: 1,
  titre: 'Maîtriser FastAPI',
  description: 'Un parcours complet pour créer des APIs REST performantes avec FastAPI et Python.',
  niveau: 'debutant',
  progression: 38,
  modules: [
    {
      id: 1, ordre: 1, titre: 'Introduction à FastAPI', statut: 'complete',
      description: 'Découverte du framework, installation et premier endpoint.',
      lessons: [
        { id: 1, titre: 'Qu\'est-ce que FastAPI ?', statut: 'complete', duree: 10 },
        { id: 2, titre: 'Installation et configuration', statut: 'complete', duree: 15 },
        { id: 3, titre: 'Ton premier endpoint', statut: 'complete', duree: 20 },
      ],
      has_quiz: true, quiz_statut: 'complete', quiz_score: 80,
    },
    {
      id: 2, ordre: 2, titre: 'Routing & Paramètres', statut: 'en_cours',
      description: 'Path parameters, query parameters, corps de requête.',
      lessons: [
        { id: 4, titre: 'Path parameters', statut: 'complete', duree: 15 },
        { id: 5, titre: 'Query parameters', statut: 'en_cours', duree: 15 },
        { id: 6, titre: 'Request body avec Pydantic', statut: 'verrouille', duree: 20 },
        { id: 7, titre: 'Headers & Cookies', statut: 'verrouille', duree: 15 },
      ],
      has_quiz: true, quiz_statut: 'disponible', quiz_score: null,
    },
    {
      id: 3, ordre: 3, titre: 'Validation des données', statut: 'verrouille',
      description: 'Pydantic models, validation automatique, gestion des erreurs.',
      lessons: [
        { id: 8, titre: 'Modèles Pydantic', statut: 'verrouille', duree: 20 },
        { id: 9, titre: 'Validation avancée', statut: 'verrouille', duree: 20 },
        { id: 10, titre: 'Gestion des erreurs HTTP', statut: 'verrouille', duree: 15 },
      ],
      has_quiz: true, quiz_statut: 'verrouille', quiz_score: null,
    },
    {
      id: 4, ordre: 4, titre: 'Base de données avec SQLAlchemy', statut: 'verrouille',
      description: 'Connexion PostgreSQL, ORM, migrations avec Alembic.',
      lessons: [
        { id: 11, titre: 'Configuration SQLAlchemy', statut: 'verrouille', duree: 25 },
        { id: 12, titre: 'Modèles & relations', statut: 'verrouille', duree: 30 },
        { id: 13, titre: 'CRUD complet', statut: 'verrouille', duree: 30 },
      ],
      has_quiz: false,
    },
    {
      id: 5, ordre: 5, titre: 'Authentification JWT', statut: 'verrouille',
      description: 'OAuth2, JWT tokens, protection des routes.',
      lessons: [
        { id: 14, titre: 'OAuth2 avec Password Flow', statut: 'verrouille', duree: 25 },
        { id: 15, titre: 'Générer & vérifier les JWT', statut: 'verrouille', duree: 25 },
        { id: 16, titre: 'Protéger les endpoints', statut: 'verrouille', duree: 20 },
      ],
      has_quiz: true, quiz_statut: 'verrouille', quiz_score: null,
    },
    {
      id: 6, ordre: 6, titre: 'Tests & Documentation', statut: 'verrouille',
      description: 'TestClient, pytest, Swagger UI, ReDoc.',
      lessons: [
        { id: 17, titre: 'Écrire des tests avec pytest', statut: 'verrouille', duree: 25 },
        { id: 18, titre: 'Documentation automatique', statut: 'verrouille', duree: 15 },
      ],
      has_quiz: false,
    },
    {
      id: 7, ordre: 7, titre: 'Projet final : API complète', statut: 'verrouille',
      description: 'Construire une API REST complète de bout en bout.',
      lessons: [
        { id: 19, titre: 'Architecture du projet', statut: 'verrouille', duree: 30 },
        { id: 20, titre: 'Implémentation', statut: 'verrouille', duree: 60 },
        { id: 21, titre: 'Déploiement', statut: 'verrouille', duree: 30 },
      ],
      has_quiz: false,
      is_projet: true,
    },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

const statutIcon = {
  complete:   <CheckCircle className="w-5 h-5 text-success-500" />,
  en_cours:   <PlayCircle className="w-5 h-5 text-primary-400" />,
  disponible: <PlayCircle className="w-5 h-5 text-slate-400" />,
  verrouille: <Lock className="w-4 h-4 text-slate-600" />,
};

const niveauLabel = { debutant: '🌱 Débutant', intermediaire: '🚀 Intermédiaire', avance: '⚡ Avancé' };

export default function LearningPathPage() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  useEffect(() => {
    courseService.get(goalId)
      .then((res) => {
        setCourse(res.data);
        // Auto-expand active module
        const active = res.data.modules?.find(m => m.statut === 'en_cours');
        if (active) setExpandedModule(active.id);
      })
      .catch(() => {
        setCourse(MOCK_COURSE);
        const active = MOCK_COURSE.modules.find(m => m.statut === 'en_cours');
        if (active) setExpandedModule(active.id);
      })
      .finally(() => setLoading(false));
  }, [goalId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await courseService.generate(goalId);
      setCourse(data);
      toast.success('Parcours généré !');
    } catch {
      toast.error('Erreur lors de la génération du parcours');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  }

  if (!course) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Aucun parcours trouvé"
        description="Génère ton parcours personnalisé avec l'IA."
        action={
          <button onClick={handleGenerate} className="btn-primary btn-lg" disabled={generating}>
            {generating ? <Spinner size="sm" /> : <><Sparkles className="w-4 h-4" /> Générer mon parcours</>}
          </button>
        }
      />
    );
  }

  const completedModules = course.modules.filter(m => m.statut === 'complete').length;

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">{niveauLabel[course.niveau]}</span>
            <span className="badge badge-surface">{completedModules}/{course.modules.length} modules</span>
          </div>
          <h1 className="page-title">{course.titre}</h1>
          <p className="page-subtitle">{course.description}</p>
        </div>
        <button onClick={handleGenerate} className="btn-secondary shrink-0" disabled={generating}>
          {generating ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          Regénérer
        </button>
      </div>

      {/* Global progress */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Progression globale</span>
          <span className="text-sm font-bold text-primary-400">{course.progression}%</span>
        </div>
        <ProgressBar value={course.progression} height="h-3" />
        <div className="flex justify-between text-xs text-slate-600 mt-2">
          <span>Début</span>
          <span>Projet final</span>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-3">
        {course.modules.map((module) => {
          const isExpanded = expandedModule === module.id;
          const completedLessons = module.lessons.filter(l => l.statut === 'complete').length;
          const isLocked = module.statut === 'verrouille';

          return (
            <div
              key={module.id}
              className={clsx(
                'card border transition-all duration-200',
                module.statut === 'en_cours' && 'border-primary-700/50',
                module.statut === 'complete' && 'border-success-500/20',
                isLocked && 'opacity-60',
              )}
            >
              {/* Module header */}
              <button
                className="w-full flex items-center gap-4 p-5 text-left"
                onClick={() => !isLocked && setExpandedModule(isExpanded ? null : module.id)}
                disabled={isLocked}
                aria-expanded={isExpanded}
              >
                {/* Ordre / status indicator */}
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm',
                  module.statut === 'complete' ? 'bg-success-500/10 border border-success-500/20 text-success-500' :
                  module.statut === 'en_cours' ? 'bg-primary-600/20 border border-primary-600/30 text-primary-400' :
                  module.is_projet ? 'bg-accent-500/10 border border-accent-500/20 text-accent-400' :
                  'bg-surface-800 border border-surface-700 text-slate-500'
                )}>
                  {module.statut === 'complete' ? <CheckCircle className="w-5 h-5" /> :
                   module.is_projet ? '🏆' : module.ordre}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {module.is_projet && <span className="badge badge-warning text-xs">Projet final</span>}
                    {module.statut === 'en_cours' && <span className="badge badge-primary text-xs">En cours</span>}
                  </div>
                  <h3 className={clsx('font-semibold', isLocked ? 'text-slate-500' : 'text-slate-100')}>
                    {module.titre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{module.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isLocked && (
                    <span className="text-xs text-slate-500">
                      {completedLessons}/{module.lessons.length}
                    </span>
                  )}
                  {isLocked
                    ? <Lock className="w-4 h-4 text-slate-600" />
                    : <ChevronRight className={clsx('w-4 h-4 text-slate-500 transition-transform', isExpanded && 'rotate-90')} />
                  }
                </div>
              </button>

              {/* Module progress bar */}
              {!isLocked && (
                <div className="px-5 pb-2">
                  <ProgressBar
                    value={completedLessons}
                    max={module.lessons.length}
                    height="h-1"
                    color={module.statut === 'complete' ? 'from-success-500 to-success-500' : undefined}
                  />
                </div>
              )}

              {/* Expanded lessons */}
              {isExpanded && !isLocked && (
                <div className="px-5 pb-5 space-y-2 border-t border-surface-800 mt-2 pt-4">
                  {module.lessons.map((lesson) => {
                    const locked = lesson.statut === 'verrouille';
                    return (
                      <div key={lesson.id}>
                        {locked ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 opacity-50">
                            <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                            <span className="text-sm text-slate-500">{lesson.titre}</span>
                            <span className="ml-auto text-xs text-slate-600">{lesson.duree} min</span>
                          </div>
                        ) : (
                          <Link
                            to={`/lesson/${lesson.id}`}
                            className={clsx(
                              'flex items-center gap-3 p-3 rounded-xl transition-all group',
                              lesson.statut === 'complete'
                                ? 'bg-success-500/5 border border-success-500/10 hover:border-success-500/30'
                                : 'bg-surface-800 hover:bg-surface-700 border border-transparent hover:border-surface-600'
                            )}
                          >
                            <span className="shrink-0">
                              {lesson.statut === 'complete'
                                ? <CheckCircle className="w-4 h-4 text-success-500" />
                                : lesson.statut === 'en_cours'
                                ? <PlayCircle className="w-4 h-4 text-primary-400" />
                                : <BookOpen className="w-4 h-4 text-slate-400" />}
                            </span>
                            <span className={clsx(
                              'text-sm flex-1',
                              lesson.statut === 'complete' ? 'text-slate-400 line-through' : 'text-slate-200'
                            )}>
                              {lesson.titre}
                            </span>
                            <span className="text-xs text-slate-600">{lesson.duree} min</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary-400 transition-colors" />
                          </Link>
                        )}
                      </div>
                    );
                  })}

                  {/* Quiz button */}
                  {module.has_quiz && (
                    <div className="pt-2 border-t border-surface-800">
                      {module.quiz_statut === 'verrouille' ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 opacity-50">
                          <Lock className="w-4 h-4 text-slate-600" />
                          <span className="text-sm text-slate-500">Quiz du module (verrouillé)</span>
                        </div>
                      ) : (
                        <Link
                          to={`/quiz/module/${module.id}`}
                          className={clsx(
                            'flex items-center gap-3 p-3 rounded-xl border transition-all group',
                            module.quiz_statut === 'complete'
                              ? 'bg-success-500/5 border-success-500/20'
                              : 'bg-warning-500/5 border-warning-500/20 hover:bg-warning-500/10'
                          )}
                        >
                          <FileQuestion className="w-4 h-4 text-warning-500 shrink-0" />
                          <span className="text-sm font-medium text-slate-200 flex-1">
                            Quiz — {module.titre}
                          </span>
                          {module.quiz_score !== null
                            ? <span className="text-xs font-semibold text-success-500">{module.quiz_score}%</span>
                            : <span className="badge badge-warning text-xs">À faire</span>
                          }
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-warning-500 transition-colors" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
