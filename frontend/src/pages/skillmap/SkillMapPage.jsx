import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { skillService, goalService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell,
} from 'recharts';
import clsx from 'clsx';

const getTendanceIcon = (t) => {
  if (t === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (t === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
};

const getScoreLabel = (score) => {
  if (score >= 80) return { label: 'Maîtrisé', color: 'badge-success' };
  if (score >= 65) return { label: 'Bien', color: 'badge-primary' };
  if (score >= 50) return { label: 'En cours', color: 'badge-warning' };
  return { label: 'À renforcer', color: 'badge-danger' };
};

const barColor = (score) => {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

export default function SkillMapPage() {
  const { goalId } = useParams();
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('bars'); // bars | radar | cards

  useEffect(() => {
    goalService.list()
      .then((res) => {
        const g = res.data || [];
        setGoals(g);
        if (goalId) {
          const match = g.find((x) => String(x.id) === String(goalId));
          if (match) setSelectedGoal(match.id);
          else if (g.length > 0) setSelectedGoal(g[0]?.id);
        } else if (g.length > 0) {
          const active = g.find((x) => x.statut === 'actif') || g[0];
          setSelectedGoal(active.id);
        }
      })
      .catch(() => {
        // backend offline — liste vide
        setGoals([]);
      });
  }, [goalId]);

  useEffect(() => {
    if (!selectedGoal) return;
    setLoading(true);
    skillService.getByGoal(selectedGoal)
      .then((res) => {
        // Backend retourne SkillMapOut: { goal_id, skills: [...], score_global }
        const data = res.data;
        const skillsArray = Array.isArray(data) ? data : (data?.skills ?? []);
        setSkills(skillsArray);
      })
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, [selectedGoal]);

  const globalScore = skills.length
    ? Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length)
    : 0;

  const strong = skills.filter(s => s.score >= 70);
  const weak = skills.filter(s => s.score < 50);
  const inProgress = skills.filter(s => s.score >= 50 && s.score < 70);

  const radarData = skills.map(s => ({ sujet: s.nom, score: s.score }));

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Map className="w-6 h-6 text-primary-400" /> Skill Map
          </h1>
          <p className="page-subtitle">Visualise tes compétences et identifie tes axes de progrès</p>
        </div>

        {/* Goal selector */}
        {goals.length > 1 && (
          <select
            value={selectedGoal || ''}
            onChange={(e) => setSelectedGoal(+e.target.value)}
            className="select w-auto"
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.technologie || g.objectif}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Aucune compétence pour l'instant"
          description="Passe l'évaluation initiale et génère ton parcours pour voir ta carte de compétences."
        />
      ) : (
        <>
          {/* Global score */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 card card-body flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke={globalScore >= 70 ? '#22c55e' : globalScore >= 40 ? '#eab308' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray={`${(globalScore / 100) * 201} 201`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-100">{globalScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">Score global</p>
                <p className="text-sm text-slate-400">
                  {goals.find(g => g.id === selectedGoal)?.objectif}
                </p>
              </div>
            </div>
            <div className="card card-body text-center">
              <div className="text-2xl font-bold text-success-500 mb-1">{strong.length}</div>
              <div className="text-xs text-slate-400">Compétences<br />maîtrisées</div>
            </div>
            <div className="card card-body text-center">
              <div className="text-2xl font-bold text-danger-500 mb-1">{weak.length}</div>
              <div className="text-xs text-slate-400">À<br />renforcer</div>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            {[
              { key: 'bars', label: 'Barres' },
              { key: 'radar', label: 'Radar' },
              { key: 'cards', label: 'Cartes' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={clsx('btn-sm', view === key ? 'btn-primary' : 'btn-secondary')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          {view === 'bars' && (
            <div className="card card-body">
              <h3 className="font-semibold text-slate-200 mb-6">Niveau par compétence</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skills} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="nom" tick={{ fill: '#94a3b8', fontSize: 12 }} width={130} />
                    <Tooltip
                      cursor={{ fill: 'rgba(85,112,245,0.05)' }}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      formatter={(v) => [`${v}%`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                      {skills.map((s, i) => (
                        <Cell key={i} fill={barColor(s.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Radar */}
          {view === 'radar' && (
            <div className="card card-body">
              <h3 className="font-semibold text-slate-200 mb-4">Vue radar</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="sujet" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Radar dataKey="score" stroke="#5570f5" fill="#5570f5" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      formatter={(v) => [`${v}%`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cards */}
          {view === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill) => {
                const { label, color } = getScoreLabel(skill.score);
                return (
                  <div key={skill.id} className="card card-body space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-100">{skill.nom}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{skill.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {getTendanceIcon(skill.tendance)}
                        <span className={clsx('badge', color)}>{label}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Niveau</span>
                        <span className="font-semibold text-slate-200">{skill.score}%</span>
                      </div>
                      <ProgressBar
                        value={skill.score}
                        height="h-2.5"
                        variant={skill.score >= 70 ? 'success' : skill.score >= 40 ? 'warning' : 'danger'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations */}
          {weak.length > 0 && (
            <div className="card card-body">
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" />
                Recommandations de l'IA
              </h3>
              <div className="space-y-3">
                {weak.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 p-4 bg-surface-800 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-danger-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{s.nom}</p>
                      <p className="text-xs text-slate-500">{s.description}</p>
                    </div>
                    <span className="text-sm font-bold text-danger-400">{s.score}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Le parcours sera ajusté automatiquement pour couvrir ces lacunes.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
