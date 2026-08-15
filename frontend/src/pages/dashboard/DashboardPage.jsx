import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Target, Zap, Clock, TrendingUp, ChevronRight,
  Flame, Star, Award, PlayCircle, BarChart2, FileQuestion, Code2,
} from 'lucide-react';
import { dashboardService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';

// ── Mock data ─────────────────────────────────────────────────────────────────
// Utilisé uniquement si DEV_MODE=true dans AuthContext
const MOCK = {
  objectif_actuel: null,
  progression_globale: 0,
  module_actuel: null,
  prochaine_activite: null,
  score_moyen: 0,
  temps_total_minutes: 0,
  streak_jours: 0,
  xp: 0,
  niveau_xp: 'Débutant',
  modules_completes: 0,
  modules_total: 0,
  competences_radar: [],
  points_faibles: [],
  historique_recent: [],
};
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-600/10 text-primary-400 border-primary-600/20',
    warning: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
    success: 'bg-success-500/10 text-success-500 border-success-500/20',
    accent: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
  };
  return (
    <div className="card card-body flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-xl border flex items-center justify-center shrink-0', colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-50">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const TYPE_ICON = {
  lesson:   <BookOpen className="w-4 h-4 text-primary-400" />,
  quiz:     <FileQuestion className="w-4 h-4 text-warning-500" />,
  exercise: <Code2 className="w-4 h-4 text-accent-400" />,
};
const typeLabel = { lesson: 'Leçon', quiz: 'Quiz', exercise: 'Exercice' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSummary()
      .then((res) => setData(res.data))
      .catch(() => {
        // Backend inaccessible — afficher un dashboard vide propre
        setData(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  const d = data || MOCK;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Afficher un CTA si l'utilisateur n'a aucun objectif actif
  const hasGoal = !!d.objectif_actuel;

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            {greeting}, {user?.nom?.split(' ')[0] || 'là'}
          </h1>
          <p className="page-subtitle">Voici où tu en es dans ton apprentissage</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-xl border border-surface-700">
            <Flame className="w-4 h-4 text-accent-400" />
            <span className="text-slate-200 font-semibold text-sm">{d.streak_jours} jours</span>
            <span className="text-slate-500 text-xs">de suite</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-xl border border-surface-700">
            <Star className="w-4 h-4 text-warning-500" />
            <span className="text-slate-200 font-semibold text-sm">{d.xp} XP</span>
            <span className="text-xs text-slate-500">{d.niveau_xp}</span>
          </div>
        </div>
      </div>

      {/* CTA si pas d'objectif */}
      {!hasGoal && (
        <div className="card card-body bg-gradient-to-br from-indigo-950/40 to-surface-900 border-indigo-700/30 text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-50 mb-2">Prêt à commencer ?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Définis ton premier objectif d'apprentissage et laisse l'IA générer un parcours entièrement personnalisé.
          </p>
          <a href="/onboarding/profile" className="btn-primary btn-lg mx-auto">
            <Zap className="w-4 h-4" /> Créer mon premier objectif
          </a>
        </div>
      )}

      {/* Objectif actuel + progression */}
      {d.objectif_actuel && (
        <div className="card card-body bg-gradient-to-br from-surface-900 to-primary-950/30 border-primary-800/30">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-primary">Objectif actuel</span>
                <span className="badge badge-surface">{d.objectif_actuel.technologie}</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mb-3">{d.objectif_actuel.objectif}</h2>
              <ProgressBar value={d.progression_globale} showLabel height="h-2.5" />
              <p className="text-xs text-slate-500 mt-2">
                {d.modules_completes} / {d.modules_total} modules complétés
              </p>
            </div>
            <Link
              to={`/learning/${d.objectif_actuel.id}`}
              className="btn-primary shrink-0"
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Progression" value={`${d.progression_globale}%`} color="primary" />
        <StatCard icon={BarChart2} label="Score moyen" value={`${d.score_moyen}%`} color="success" />
        <StatCard icon={Clock} label="Temps total" value={`${Math.floor(d.temps_total_minutes / 60)}h${d.temps_total_minutes % 60}m`} color="accent" />
        <StatCard icon={Award} label="Modules" value={`${d.modules_completes}/${d.modules_total}`} sub="complétés" color="warning" />
      </div>

      {/* Module actuel + Prochaine activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module */}
        <div className="card card-body">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-slate-200">Module en cours</h3>
          </div>
          <div className="bg-surface-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-500 mb-1">Module {d.module_actuel?.ordre}</p>
            <p className="font-semibold text-slate-100">{d.module_actuel?.titre}</p>
          </div>
          {d.prochaine_activite && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Prochaine activité</p>
              <Link
                to={`/learning/${d.objectif_actuel?.id}`}
                className="flex items-center gap-3 p-3 bg-primary-600/10 border border-primary-600/20 rounded-xl hover:bg-primary-600/20 transition-all group"
              >
                <PlayCircle className="w-5 h-5 text-primary-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{d.prochaine_activite.titre}</p>
                  <p className="text-xs text-slate-500">{d.prochaine_activite.module}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
              </Link>
            </div>
          )}
        </div>

        {/* Radar des compétences */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold text-slate-200">Compétences</h3>
            </div>
            <Link to="/skillmap" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={d.competences_radar}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="sujet" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar
                  dataKey="score"
                  stroke="#5570f5"
                  fill="#5570f5"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Points faibles + Historique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points faibles */}
        <div className="card card-body">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger-500" /> Points à renforcer
          </h3>
          <div className="space-y-2">
            {d.points_faibles.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-danger-500/10 border border-danger-500/20 flex items-center justify-center shrink-0">
                  <span className="text-danger-400 text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-sm text-slate-300">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historique */}
        <div className="card card-body">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Activité récente
          </h3>
          <div className="space-y-3">
            {d.historique_recent.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                  {TYPE_ICON[h.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{h.activite}</p>
                  <p className="text-xs text-slate-600">{h.date}</p>
                </div>
                {h.score !== null && (
                  <span className={clsx('text-xs font-semibold', h.score >= 70 ? 'text-success-500' : 'text-warning-500')}>
                    {h.score}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
