import { useState } from 'react';
import { Target, ArrowLeft, Sparkles, Globe, Server, BarChart2, Cpu, Rocket, Smartphone, Shield, Star } from 'lucide-react';
import { goalService } from '../../../services/api';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DOMAINS = [
  { value: 'web_frontend',     label: 'Frontend Web',        icon: Globe,      color: 'text-orange-400' },
  { value: 'web_backend',      label: 'Backend Web',         icon: Server,     color: 'text-indigo-400' },
  { value: 'data_science',     label: 'Data Science',        icon: BarChart2,  color: 'text-green-400'  },
  { value: 'machine_learning', label: 'Machine Learning',    icon: Cpu,        color: 'text-purple-400' },
  { value: 'devops',           label: 'DevOps',              icon: Rocket,     color: 'text-blue-400'   },
  { value: 'mobile',           label: 'Développement Mobile',icon: Smartphone, color: 'text-cyan-400'   },
  { value: 'securite',         label: 'Cybersécurité',       icon: Shield,     color: 'text-red-400'    },
  { value: 'autre',            label: 'Autre',               icon: Star,       color: 'text-yellow-400' },
];

const SUGGESTIONS = [
  'Apprendre FastAPI depuis zéro',
  'Maîtriser React.js',
  'Créer une API REST avec Django',
  'Apprendre Python pour la data science',
  'Comprendre Docker et Kubernetes',
];

export default function LearningGoalStep({ onDone, onBack }) {
  const [form, setForm] = useState({
    domaine: '',
    objectif: '',
    technologie: '',
    statut: 'actif',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.domaine) errs.domaine = 'Choisis un domaine';
    if (!form.objectif.trim()) errs.objectif = 'Décris ton objectif';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await goalService.create(form);
      toast.success('Objectif défini !');
      onDone(data.id);
    } catch (err) {
      toast.error('Erreur lors de la création de l\'objectif');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-slate-50 mb-1">Ton objectif d'apprentissage</h2>
        <p className="text-slate-400 text-sm">Qu'est-ce que tu veux apprendre ? Sois précis !</p>
      </div>

      {/* Domaine */}
      <div>
        <label className="label">Domaine</label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {DOMAINS.map((d) => {
              const DomIcon = d.icon;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm({ ...form, domaine: d.value })}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-xs font-medium transition-all duration-200',
                    form.domaine === d.value
                      ? 'border-primary-500 bg-primary-600/20 text-slate-100'
                      : 'border-surface-700 bg-surface-800 text-slate-400 hover:border-surface-600 hover:text-slate-200'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center">
                    <DomIcon className={clsx('w-4 h-4', d.color)} />
                  </div>
                  <span>{d.label}</span>
                </button>
              );
            })}
        </div>
        {errors.domaine && <p className="error-msg mt-1">{errors.domaine}</p>}
      </div>

      {/* Technologie */}
      <div>
        <label htmlFor="technologie" className="label">Technologie / Langage spécifique <span className="text-slate-500 font-normal">(optionnel)</span></label>
        <input
          id="technologie"
          type="text"
          className="input"
          placeholder="ex: FastAPI, React, Python, TypeScript…"
          value={form.technologie}
          onChange={(e) => setForm({ ...form, technologie: e.target.value })}
        />
      </div>

      {/* Objectif */}
      <div>
        <label htmlFor="objectif" className="label flex items-center gap-2">
          <Target className="w-4 h-4 text-primary-400" /> Décris ton objectif
        </label>
        <textarea
          id="objectif"
          rows={3}
          className={`textarea ${errors.objectif ? 'input-error' : ''}`}
          placeholder="ex: Je veux apprendre FastAPI pour créer des APIs REST performantes…"
          value={form.objectif}
          onChange={(e) => setForm({ ...form, objectif: e.target.value })}
        />
        {errors.objectif && <p className="error-msg">{errors.objectif}</p>}

        {/* Suggestions */}
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, objectif: s })}
                className="text-xs px-3 py-1.5 bg-surface-800 border border-surface-700 rounded-full text-slate-400 hover:border-primary-600 hover:text-primary-300 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <button type="submit" className="btn-primary flex-1 btn-lg" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Continuer →'}
        </button>
      </div>
    </form>
  );
}
