import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ChevronRight, Sparkles, Target, CheckCircle, PlayCircle } from 'lucide-react';
import { goalService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import clsx from 'clsx';

const DOMAIN_EMOJI = {
  web_backend: '⚙️',
  web_frontend: '🎨',
  data_science: '📊',
  machine_learning: '🤖',
  devops: '🚀',
  mobile: '📱',
  securite: '🔒',
  autre: '✨',
};

const NIVEAU_LABEL = {
  debutant: '🌱 Débutant',
  intermediaire: '🚀 Intermédiaire',
  avance: '⚡ Avancé',
};

export default function LearningIndexPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    goalService.list()
      .then((res) => setGoals(res.data || []))
      .catch((err) => {
        // Réseau inaccessible — afficher un message, pas de faux contenu
        setError(err.response?.data?.detail || 'Impossible de charger tes objectifs. Vérifie que le backend est démarré.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="card card-body max-w-md text-center">
          <p className="text-red-400 font-medium mb-2">Erreur de connexion</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary mt-4 mx-auto">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-400" /> Apprentissage
          </h1>
          <p className="page-subtitle">Tes parcours d'apprentissage personnalisés</p>
        </div>
        <Link to="/onboarding/profile" className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Nouvel objectif
        </Link>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aucun objectif pour l'instant"
          description="Crée ton premier objectif d'apprentissage et laisse l'IA générer ton parcours personnalisé."
          action={
            <Link to="/onboarding/profile" className="btn-primary btn-lg">
              <Sparkles className="w-4 h-4" /> Créer mon premier objectif
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="card card-body hover:border-indigo-700/50 hover:shadow-card-hover transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Domain icon */}
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                  {DOMAIN_EMOJI[goal.domaine] || '📚'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {goal.technologie && (
                      <span className="badge badge-primary">{goal.technologie}</span>
                    )}
                    <span className="badge badge-surface">{NIVEAU_LABEL[goal.niveau]}</span>
                    {goal.statut === 'actif' && (
                      <span className="badge badge-success">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Actif
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-slate-100 mb-3">{goal.objectif}</h2>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>{goal.modules_completes}/{goal.modules_total} modules complétés</span>
                      <span className="font-semibold text-indigo-400">{goal.progression}%</span>
                    </div>
                    <ProgressBar value={goal.progression} height="h-2" />
                  </div>

                  {/* Next lesson */}
                  {goal.prochaine_lecon && (
                    <p className="text-xs text-slate-500">
                      Prochaine leçon : <span className="text-slate-300">{goal.prochaine_lecon}</span>
                    </p>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    to={`/learning/${goal.id}`}
                    className="btn-primary"
                  >
                    Continuer <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/skillmap/${goal.id}`}
                    className="btn-secondary text-xs justify-center"
                  >
                    Skill Map
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Objectifs actifs', value: goals.filter(g => g.statut === 'actif').length, icon: Target },
            { label: 'Modules complétés', value: goals.reduce((a, g) => a + (g.modules_completes || 0), 0), icon: CheckCircle },
            { label: 'En cours', value: goals.filter(g => g.progression > 0 && g.progression < 100).length, icon: PlayCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card card-body text-center">
              <Icon className="w-5 h-5 text-primary-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-100">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
