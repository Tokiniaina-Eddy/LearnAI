import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart2, Clock, CheckCircle, Target, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { progressService, goalService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar,
} from 'recharts';
import clsx from 'clsx';

const DEFAULT_DAYS = [
  { jour: 'Lun', minutes: 0 },
  { jour: 'Mar', minutes: 0 },
  { jour: 'Mer', minutes: 0 },
  { jour: 'Jeu', minutes: 0 },
  { jour: 'Ven', minutes: 0 },
  { jour: 'Sam', minutes: 0 },
  { jour: 'Dim', minutes: 0 },
];

const EMPTY_DATA = {
  progression_globale: 0,
  lessons_completees: 0,
  lessons_total: 0,
  quizzes_passes: 0,
  score_moyen: 0,
  temps_total_minutes: 0,
  streak_actuel: 0,
  streak_max: 0,
  historique_scores: [],
  activite_hebdo: DEFAULT_DAYS,
  modules: [],
};

export default function ProgressPage() {
  const { goalId } = useParams();
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available goals
  useEffect(() => {
    goalService.list()
      .then((res) => {
        const gList = res.data || [];
        setGoals(gList);
        if (goalId) {
          const match = gList.find((g) => String(g.id) === String(goalId));
          if (match) setSelectedGoal(match.id);
          else if (gList.length > 0) setSelectedGoal(gList[0].id);
        } else if (gList.length > 0) {
          const active = gList.find((g) => g.statut === 'actif') || gList[0];
          setSelectedGoal(active.id);
        }
      })
      .catch(() => {
        setGoals([]);
      });
  }, [goalId]);

  // Fetch progress for selected goal
  useEffect(() => {
    setLoading(true);
    setError(null);
    progressService.get(selectedGoal)
      .then((res) => {
        setData(res.data || EMPTY_DATA);
      })
      .catch((err) => {
        // En cas d'erreur réseau, afficher l'état vide avec un message
        setData(EMPTY_DATA);
        if (err.response?.status !== 404) {
          setError(err.response?.data?.detail || null);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedGoal]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  }

  const d = data || EMPTY_DATA;
  const currentGoalObj = goals.find((g) => g.id === selectedGoal);

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary-400" /> Ma Progression
          </h1>
          <p className="page-subtitle">Suivi détaillé de ton parcours d'apprentissage</p>
        </div>

        {/* Goal selector */}
        {goals.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Objectif :</span>
            <select
              value={selectedGoal || ''}
              onChange={(e) => setSelectedGoal(+e.target.value)}
              className="select w-auto text-sm"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.technologie ? `${g.technologie} — ${g.objectif}` : g.objectif}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-center gap-3 text-danger-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Progression', value: `${d.progression_globale}%`, color: 'text-primary-400', bg: 'bg-primary-600/10 border-primary-600/20' },
          { icon: CheckCircle, label: 'Leçons complétées', value: `${d.lessons_completees}/${d.lessons_total}`, color: 'text-success-500', bg: 'bg-success-500/10 border-success-500/20' },
          { icon: BarChart2, label: 'Score moyen', value: `${d.score_moyen}%`, color: 'text-warning-500', bg: 'bg-warning-500/10 border-warning-500/20' },
          { icon: Clock, label: 'Temps total', value: `${Math.floor(d.temps_total_minutes / 60)}h ${d.temps_total_minutes % 60}m`, color: 'text-accent-400', bg: 'bg-accent-500/10 border-accent-500/20' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card card-body flex items-center gap-4">
            <div className={clsx('w-11 h-11 rounded-xl border flex items-center justify-center shrink-0', bg)}>
              <Icon className={clsx('w-5 h-5', color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-50">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score over time */}
        <div className="card card-body">
          <h3 className="font-semibold text-slate-200 mb-4">Évolution des scores</h3>
          {d.historique_scores && d.historique_scores.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.historique_scores}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5570f5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5570f5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(v) => [`${v}%`, 'Score']}
                  />
                  <Area type="monotone" dataKey="score" stroke="#5570f5" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#5570f5', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-center p-4 bg-surface-800/30 rounded-xl">
              <BarChart2 className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">Aucun historique de score disponible</p>
              <p className="text-xs text-slate-500 mt-1">Complète des quiz pour visualiser ton évolution.</p>
            </div>
          )}
        </div>

        {/* Weekly activity */}
        <div className="card card-body">
          <h3 className="font-semibold text-slate-200 mb-4">Activité cette semaine</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.activite_hebdo?.length ? d.activite_hebdo : DEFAULT_DAYS} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="jour" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}m`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v) => [`${v} min`, 'Temps']}
                />
                <Bar dataKey="minutes" fill="#5570f5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-400" /> Série d'apprentissage
          </h3>
          <div className="text-sm text-slate-400">
            Record : <span className="text-accent-400 font-bold">{d.streak_max} jours</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-accent-400">{d.streak_actuel}</div>
          <div>
            <p className="text-slate-200 font-medium">jours consécutifs</p>
            <p className="text-slate-500 text-sm">
              {d.streak_actuel > 0 ? 'Continue comme ça !' : 'Apprends aujourd\'hui pour démarrer ta série !'}
            </p>
          </div>
        </div>
        {/* Calendar dots last 14 days */}
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {Array.from({ length: 14 }).map((_, i) => {
            const active = i >= 14 - d.streak_actuel && d.streak_actuel > 0;
            return (
              <div
                key={i}
                className={clsx('w-7 h-7 rounded-lg transition-all', active ? 'bg-accent-500/70 shadow-sm' : 'bg-surface-800')}
                title={active ? 'Actif' : 'Inactif'}
              />
            );
          })}
        </div>
      </div>

      {/* Module breakdown */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-200">Progression par module</h3>
          {currentGoalObj && (
            <Link to={`/learning/${currentGoalObj.id}`} className="text-xs text-primary-400 hover:text-primary-300">
              Accéder au cours →
            </Link>
          )}
        </div>

        {d.modules && d.modules.length > 0 ? (
          <div className="space-y-4">
            {d.modules.map((m, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={clsx('text-sm', m.statut === 'verrouille' ? 'text-slate-500' : 'text-slate-300')}>
                    {m.titre}
                  </span>
                  <span className={clsx('text-xs font-semibold', m.progression === 100 ? 'text-success-500' : m.progression > 0 ? 'text-primary-400' : 'text-slate-600')}>
                    {m.progression}%
                  </span>
                </div>
                <ProgressBar
                  value={m.progression}
                  height="h-2"
                  variant={m.progression === 100 ? 'success' : m.statut === 'verrouille' ? 'muted' : 'primary'}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">Aucun module disponible pour le moment</p>
            <p className="text-xs text-slate-500 mb-4">Génère ton parcours pour commencer à suivre ta progression.</p>
            {currentGoalObj && (
              <Link to={`/learning/${currentGoalObj.id}`} className="btn-secondary btn-sm">
                Voir mon parcours
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
