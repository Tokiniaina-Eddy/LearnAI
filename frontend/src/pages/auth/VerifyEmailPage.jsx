import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../../components/ui/OtpInput';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const RESEND_COOLDOWN = 60; // secondes

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // L'email peut être transmis via state de navigation ou query param
  const emailFromState = location.state?.email || '';
  const [email] = useState(emailFromState);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Compteur de renvoi
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  // Démarrer le compteur au montage
  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return; }
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Si pas d'email, rediriger vers l'inscription
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyEmail({ email, otp });
      setSuccess(true);
      toast.success('Email vérifié ! Bienvenue sur LearnAI 🎉');
      setTimeout(() => navigate('/onboarding/profile', { replace: true }), 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Code incorrect. Veuillez réessayer.';
      setError(msg);
      // Réinitialiser l'OTP si blocage ou expiration
      if (err.response?.status === 429 || msg.includes('expiré')) {
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  }, [otp, email, verifyEmail, navigate]);

  // Vérifier automatiquement quand les 6 chiffres sont saisis
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerify();
    }
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = useCallback(async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');
    try {
      await resendVerification(email);
      toast.success('Un nouveau code a été envoyé à votre adresse email.');
      setOtp('');
      setCanResend(false);
      setCooldown(RESEND_COOLDOWN);
      // Redémarrer le compteur
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Impossible d\'envoyer le code.';
      toast.error(msg);
      setError(msg);
    } finally {
      setResending(false);
    }
  }, [canResend, resending, email, resendVerification]);

  if (success) {
    return (
      <div className="animate-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-success-500/10 border border-success-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">Email vérifié !</h2>
        <p className="text-slate-400 text-sm">Redirection en cours…</p>
        <div className="flex justify-center mt-6">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <Link
        to="/register"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Modifier mon adresse email
      </Link>

      {/* Icône */}
      <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
        <Mail className="w-7 h-7 text-primary-400" />
      </div>

      <h2 className="text-2xl font-bold text-slate-50 mb-1">
        Vérifiez votre adresse email
      </h2>
      <p className="text-slate-400 text-sm mb-2">
        Nous avons envoyé un code à 6 chiffres à{' '}
        <span className="text-slate-200 font-medium">{email}</span>.
      </p>
      <p className="text-slate-500 text-xs mb-8">
        Vous n'avez pas reçu le code ? Vérifiez votre dossier spam.
      </p>

      {/* Champs OTP */}
      <div className="mb-6">
        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={loading}
          error={!!error}
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-5 text-center">
          {error}
        </div>
      )}

      {/* Bouton Vérifier */}
      <button
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
        className="btn-primary w-full btn-lg mb-4"
      >
        {loading ? <Spinner size="sm" /> : 'Vérifier'}
      </button>

      {/* Renvoi du code */}
      <div className="text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {resending ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Renvoyer le code
          </button>
        ) : (
          <p className="text-slate-500 text-sm">
            Renvoyer le code dans{' '}
            <span className="text-slate-400 font-medium tabular-nums">
              {cooldown}s
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
