import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import GoogleButton from '../../components/ui/GoogleButton';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nom: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Le nom est requis';
    if (!form.email) errs.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide';
    if (!form.password) errs.password = 'Le mot de passe est requis';
    else if (form.password.length < 8) errs.password = '8 caractères minimum';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register({ nom: form.nom, email: form.email, password: form.password });
      toast.success('Compte créé ! Vérifiez votre email.');
      // Rediriger vers la page de vérification en passant l'email
      navigate('/verify-email', { state: { email: result?.email || form.email } });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Une erreur est survenue';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bien', 'Fort'][strength];
  const strengthColor = ['', 'bg-danger-500', 'bg-warning-500', 'bg-success-500', 'bg-primary-500'][strength];

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-bold text-slate-50 mb-1">Créer un compte</h2>
      <p className="text-slate-400 text-sm mb-8">Commence ton parcours d'apprentissage personnalisé</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Nom */}
        <div>
          <label htmlFor="nom" className="label">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="nom"
              type="text"
              autoComplete="name"
              className={`input pl-10 ${errors.nom ? 'input-error' : ''}`}
              placeholder="Jean Dupont"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </div>
          {errors.nom && <p className="error-msg">{errors.nom}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              placeholder="toi@exemple.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          {errors.email && <p className="error-msg">{errors.email}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="password" className="label">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="8 caractères minimum"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Afficher le mot de passe"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-surface-700'} transition-all`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">{strengthLabel}</p>
            </div>
          )}
          {errors.password && <p className="error-msg">{errors.password}</p>}
        </div>

        {/* Confirmer mot de passe */}
        <div>
          <label htmlFor="confirmPassword" className="label">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
          {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}
        </div>

        {errors.general && (
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3 text-danger-400 text-sm">
            {errors.general}
          </div>
        )}

        <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Créer mon compte'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-surface-700" />
        <span className="text-slate-500 text-xs font-medium">ou</span>
        <div className="flex-1 h-px bg-surface-700" />
      </div>

      {/* Bouton Google */}
      <GoogleButton label="Continuer avec Google" />

      <p className="text-center text-slate-400 text-sm mt-6">
        Déjà un compte ?{' '}
        <Link
          to="/login"
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
