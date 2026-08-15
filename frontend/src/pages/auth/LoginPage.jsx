import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

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
      <p className="text-slate-400 text-sm mb-8">Connecte-toi pour reprendre ton apprentissage</p>

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
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3 text-danger-400 text-sm">
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
