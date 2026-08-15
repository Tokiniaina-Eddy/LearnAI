import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/api';
import OtpInput from '../../components/ui/OtpInput';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const RESEND_COOLDOWN = 60;

// Étapes du flux de réinitialisation
const STEP = {
  OTP: 'otp',          // Saisie du code OTP
  NEW_PASSWORD: 'new_password', // Saisie du nouveau mot de passe
  SUCCESS: 'success',  // Succès
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [step, setStep] = useState(STEP.OTP);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  // Si pas d'email, rediriger
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  // Compteur renvoi OTP
  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return; }
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Vérification OTP automatique à 6 chiffres
  useEffect(() => {
    if (otp.length === 6 && step === STEP.OTP && !loading) {
      handleVerifyOtp();
    }
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) { setError('Veuillez saisir les 6 chiffres.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.verifyResetOtp({ email, otp });
      setStep(STEP.NEW_PASSWORD);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Code incorrect. Veuillez réessayer.';
      setError(msg);
      if (err.response?.status === 429 || msg.includes('expiré')) setOtp('');
    } finally {
      setLoading(false);
    }
  }, [otp, email]);

  const handleResend = useCallback(async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      toast.success('Un nouveau code a été envoyé.');
      setOtp('');
      setCanResend(false);
      setCooldown(RESEND_COOLDOWN);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Impossible d\'envoyer le code. Réessayez.');
    } finally {
      setResending(false);
    }
  }, [canResend, resending, email]);

  const validatePassword = () => {
    const errs = {};
    if (!form.password) errs.password = 'Le mot de passe est requis';
    else if (form.password.length < 8) errs.password = '8 caractères minimum';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      setError(errs.password || errs.confirmPassword);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword({ email, otp, new_password: form.password });
      setStep(STEP.SUCCESS);
      toast.success('Mot de passe réinitialisé avec succès !');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Une erreur est survenue.';
      setError(msg);
      if (msg.includes('expiré') || msg.includes('invalide')) {
        setStep(STEP.OTP);
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Indicateur de force du mot de passe
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
  const strengthColor = ['', 'bg-red-500', 'bg-warning-500', 'bg-success-500', 'bg-primary-500'][strength];

  // ── Étape succès ──────────────────────────────────────────────────────────
  if (step === STEP.SUCCESS) {
    return (
      <div className="animate-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-success-500/10 border border-success-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">
          Mot de passe réinitialisé !
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
        </p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="btn-primary w-full btn-lg"
        >
          Se connecter
        </button>
      </div>
    );
  }

  // ── Étape nouveau mot de passe ────────────────────────────────────────────
  if (step === STEP.NEW_PASSWORD) {
    return (
      <div className="animate-in">
        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-50 mb-1">
          Créer un nouveau mot de passe
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>

        <form onSubmit={handleResetPassword} noValidate className="space-y-5">
          {/* Nouveau mot de passe */}
          <div>
            <label htmlFor="new-password" className="label">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input pl-10 pr-10"
                placeholder="8 caractères minimum"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Indicateur de force */}
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-surface-700'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label htmlFor="confirm-password" className="label">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pl-10 ${form.confirmPassword && form.password !== form.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="error-msg">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      </div>
    );
  }

  // ── Étape OTP ─────────────────────────────────────────────────────────────
  return (
    <div className="animate-in">
      <Link
        to="/forgot-password"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-primary-400" />
      </div>

      <h2 className="text-2xl font-bold text-slate-50 mb-1">
        Vérification du code
      </h2>
      <p className="text-slate-400 text-sm mb-2">
        Nous avons envoyé un code à 6 chiffres à{' '}
        <span className="text-slate-200 font-medium">{email}</span>.
      </p>
      <p className="text-slate-500 text-xs mb-8">
        Vous n'avez pas reçu le code ? Vérifiez votre dossier spam.
      </p>

      <div className="mb-6">
        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={loading}
          error={!!error}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-5 text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleVerifyOtp}
        disabled={loading || otp.length !== 6}
        className="btn-primary w-full btn-lg mb-4"
      >
        {loading ? <Spinner size="sm" /> : 'Vérifier'}
      </button>

      <div className="text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {resending ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            Renvoyer le code
          </button>
        ) : (
          <p className="text-slate-500 text-sm">
            Renvoyer le code dans{' '}
            <span className="text-slate-400 font-medium tabular-nums">{cooldown}s</span>
          </p>
        )}
      </div>
    </div>
  );
}
