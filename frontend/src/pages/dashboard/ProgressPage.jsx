import { useEffect, useState } from 'react';
import { BarChart2, Clock, CheckCircle, Target, Calendar } from 'lucide-react';
import { progressService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import clsx from 'clsx';

// ── Mock ──────────────────────────────────────────────────────────────────────
const MOCK = {
  progression_globale: 38,
  lessons_completees: 4,
  lessons_total: 21,
  quizzes_passes: 1,
  score_moyen: 72,
  temps_total_minutes: 145,
  streak_actuel: 5,
  streak_max: 7,
  historique_scores: [
    { date: '08/10', score: 60 },
    { date: '08/11', score: 75 },
    { date: '08/12', score: 90 },
    { date: '08/13', score: 65 },
    { date: '08/14', score: 80 },
    { date: '08/15', score: 72 },
  ],
  activite_hebdo: [
    { jour: 'Lun', minutes: 45 },
    { jour: 'Mar', minutes: 30 },
    { jour: 'Mer', minutes: 0 },
    { jour: 'Jeu', minutes: 60 },
    { jour: 'Ven', minutes: 25 },
    { jour: 'Sam', minutes: 45 },
    { jour: 'Dim', minutes: 0 },
  ],
  modules: [
    { titre: 'Introduction à FastAPI', progression: 100, statut: 'complete' },
    { titre: 'Routing & Paramètres', progression: 50, statut: 'en_cours' },
    { titre: 'Validation des données', progression: 0, statut: 'verrouille' },
    { titre: 'Base de données', progression: 0, statut: 'verrouille' },
    { titre: 'Authentification JWT', progression: 0, statut: 'verrouille' },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressService.get()
      .then((res) => setData(res.data))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  }

  const d = data || MOCK;

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary-400" /> Ma Progression
        </h1>
        <p className="page-subtitle">Suivi détaillé de ton parcours d'apprentissage</p>
      </div>

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
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
                <Area type="monotone" dataKey="score" stroke="#5570f5" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#5570f5', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly activity */}
        <div className="card card-body">
          <h3 className="font-semibold text-slate-200 mb-4">Activité cette semaine</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.activite_hebdo} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="jour" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}m`} />
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
            <p className="text-slate-500 text-sm">Continue comme ça !</p>
          </div>
        </div>
        {/* Calendar dots last 14 days */}
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {Array.from({ length: 14 }).map((_, i) => {
            const active = i >= 14 - d.streak_actuel;
            return (
              <div
                key={i}
                className={clsx('w-7 h-7 rounded-lg', active ? 'bg-accent-500/70' : 'bg-surface-800')}
                title={active ? 'Actif' : 'Inactif'}
              />
            );
          })}
        </div>
      </div>

      {/* Module breakdown */}
      <div className="card card-body">
        <h3 className="font-semibold text-slate-200 mb-5">Progression par module</h3>
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
                color={m.progression === 100 ? 'from-success-500 to-success-500' : m.statut === 'verrouille' ? 'from-surface-700 to-surface-700' : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
