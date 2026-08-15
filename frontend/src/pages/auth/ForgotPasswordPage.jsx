import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('L\'email est requis'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Email invalide'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Une erreur est survenue';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-success-500/10 border border-success-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">Email envoyé !</h2>
        <p className="text-slate-400 text-sm mb-8">
          Un lien de réinitialisation a été envoyé à <span className="text-slate-200 font-medium">{email}</span>.
          Vérifie ta boîte mail.
        </p>
        <Link to="/login" className="btn-primary w-full btn-lg justify-center">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à la connexion
      </Link>

      <h2 className="text-2xl font-bold text-slate-50 mb-1">Mot de passe oublié ?</h2>
      <p className="text-slate-400 text-sm mb-8">
        Renseigne ton email et nous t'enverrons un lien de réinitialisation.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input pl-10 ${error ? 'input-error' : ''}`}
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Envoyer le lien'}
        </button>
      </form>
    </div>
  );
}
