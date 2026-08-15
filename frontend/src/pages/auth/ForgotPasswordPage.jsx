import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("L'email est requis"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Email invalide'); return; }

    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      // Toujours afficher le succès (le backend ne révèle pas si l'email existe)
      toast.success('Code de vérification envoyé !');
      // Rediriger vers la page de réinitialisation en passant l'email
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Une erreur est survenue. Veuillez réessayer.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la connexion
      </Link>

      <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
        <Mail className="w-7 h-7 text-primary-400" />
      </div>

      <h2 className="text-2xl font-bold text-slate-50 mb-1">Réinitialiser votre mot de passe</h2>
      <p className="text-slate-400 text-sm mb-8">
        Entrez votre adresse email et nous vous enverrons un code de vérification.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Adresse email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input pl-10 ${error ? 'input-error' : ''}`}
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Envoyer le code'}
        </button>
      </form>
    </div>
  );
}
