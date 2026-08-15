import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// Identifiants de démo (synchronisés avec MOCK_USER dans AuthContext)
const DEMO_EMAIL = 'demo@learnai.dev';
const DEMO_PASSWORD = 'demo1234';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide';
    if (!form.password) errs.password = 'Le mot de passe est requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      toast.success('Connexion réussie !');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Email ou mot de passe incorrect';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-bold text-slate-50 mb-1">Bon retour 👋</h2>
      <p className="text-slate-400 text-sm mb-6">Connecte-toi pour reprendre ton apprentissage</p>

      {/* ── Encart compte de démo ── */}
      <div className="mb-6 p-4 rounded-xl border border-indigo-700/40 bg-indigo-600/10">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Compte de test</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-slate-800 rounded-lg px-3 py-2">
            <p className="text-slate-500 mb-0.5">Email</p>
            <p className="text-slate-200 font-mono">{DEMO_EMAIL}</p>
          </div>
          <div className="bg-slate-800 rounded-lg px-3 py-2">
            <p className="text-slate-500 mb-0.5">Mot de passe</p>
            <p className="text-slate-200 font-mono">{DEMO_PASSWORD}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setForm({ email: DEMO_EMAIL, password: DEMO_PASSWORD })}
          className="w-full text-xs py-2 rounded-lg bg-indigo-600/20 border border-indigo-600/30 text-indigo-300 hover:bg-indigo-600/30 transition-all font-medium"
        >
          Remplir automatiquement
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="label mb-0">Mot de passe</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="error-msg">{errors.password}</p>}
        </div>

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {errors.general}
          </div>
        )}

        <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
