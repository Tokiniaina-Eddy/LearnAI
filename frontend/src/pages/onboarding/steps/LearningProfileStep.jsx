import { useState } from 'react';
import { Clock, Brain, Calendar } from 'lucide-react';
import { profileService } from '../../../services/api';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const LEVELS = [
  { value: 'debutant', label: 'Débutant', desc: 'Je commence depuis zéro', emoji: '🌱' },
  { value: 'intermediaire', label: 'Intermédiaire', desc: 'J\'ai quelques bases', emoji: '🚀' },
  { value: 'avance', label: 'Avancé', desc: 'Je maîtrise les fondamentaux', emoji: '⚡' },
];

const TIME_OPTIONS = [
  { value: 15, label: '15 min / jour' },
  { value: 30, label: '30 min / jour' },
  { value: 60, label: '1h / jour' },
  { value: 120, label: '2h / jour' },
  { value: 180, label: '3h+ / jour' },
];

const PREFERENCES = [
  { value: 'visual', label: '👁️ Visuel', desc: 'Schémas et exemples' },
  { value: 'pratique', label: '🛠️ Pratique', desc: 'Exercices et projets' },
  { value: 'theorique', label: '📚 Théorique', desc: 'Explications détaillées' },
  { value: 'mixte', label: '🔀 Mixte', desc: 'Un peu de tout' },
];

export default function LearningProfileStep({ onDone }) {
  const [form, setForm] = useState({
    niveau: '',
    temps_disponible: 30,
    preferences: 'mixte',
    duree_souhaitee: 4,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.niveau) errs.niveau = 'Choisis ton niveau';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await profileService.create(form);
      toast.success('Profil enregistré !');
      onDone(data);
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-slate-50 mb-1">Ton profil d'apprentissage</h2>
        <p className="text-slate-400 text-sm">Ces informations nous permettent d'adapter ton parcours.</p>
      </div>

      {/* Niveau */}
      <div>
        <label className="label flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary-400" /> Ton niveau actuel
        </label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setForm({ ...form, niveau: l.value })}
              className={clsx(
                'flex flex-col items-center gap-1 p-4 rounded-xl border text-center transition-all duration-200',
                form.niveau === l.value
                  ? 'border-primary-500 bg-primary-600/20 text-slate-100'
                  : 'border-surface-700 bg-surface-800 text-slate-400 hover:border-surface-600 hover:text-slate-200'
              )}
            >
              <span className="text-2xl">{l.emoji}</span>
              <span className="text-sm font-medium">{l.label}</span>
              <span className="text-xs text-slate-500">{l.desc}</span>
            </button>
          ))}
        </div>
        {errors.niveau && <p className="error-msg mt-2">{errors.niveau}</p>}
      </div>

      {/* Temps disponible */}
      <div>
        <label className="label flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-400" /> Temps disponible par jour
        </label>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm({ ...form, temps_disponible: t.value })}
              className={clsx(
                'py-2 px-1 rounded-xl border text-center text-xs font-medium transition-all duration-200',
                form.temps_disponible === t.value
                  ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                  : 'border-surface-700 bg-surface-800 text-slate-400 hover:border-surface-600'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Préférences */}
      <div>
        <label className="label">Style d'apprentissage préféré</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {PREFERENCES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm({ ...form, preferences: p.value })}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                form.preferences === p.value
                  ? 'border-primary-500 bg-primary-600/20 text-slate-100'
                  : 'border-surface-700 bg-surface-800 text-slate-400 hover:border-surface-600'
              )}
            >
              <span className="text-lg">{p.label.split(' ')[0]}</span>
              <div>
                <p className="text-sm font-medium">{p.label.split(' ').slice(1).join(' ')}</p>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Durée */}
      <div>
        <label htmlFor="duree" className="label flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-400" /> Durée souhaitée (semaines)
        </label>
        <div className="flex items-center gap-4 mt-2">
          <input
            id="duree"
            type="range"
            min={1}
            max={24}
            value={form.duree_souhaitee}
            onChange={(e) => setForm({ ...form, duree_souhaitee: +e.target.value })}
            className="flex-1 accent-primary-500"
          />
          <span className="text-slate-200 font-semibold w-24 text-right">
            {form.duree_souhaitee} semaine{form.duree_souhaitee > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Continuer →'}
      </button>
    </form>
  );
}
