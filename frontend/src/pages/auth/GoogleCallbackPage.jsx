import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

/**
 * Page de callback Google OAuth.
 *
 * Le backend redirige vers /auth/google/callback?token=<jwt> après succès,
 * ou vers /login?error=<code> en cas d'échec.
 *
 * Cette page :
 *  1. Lit le token JWT depuis les query params
 *  2. Stocke le token et charge le profil utilisateur via AuthContext
 *  3. Redirige vers le dashboard (ou onboarding si nouveau compte)
 */
export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false); // Éviter le double traitement en Strict Mode

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      const errorMessages = {
        google_cancelled: 'Connexion avec Google annulée.',
        google_failed: 'Une erreur est survenue lors de la connexion avec Google.',
        google_no_email: 'Impossible de récupérer l\'adresse email depuis Google.',
        google_not_configured: 'La connexion Google n\'est pas disponible pour le moment.',
      };
      const msg = errorMessages[error] || 'Erreur lors de la connexion avec Google.';
      toast.error(msg);
      navigate('/login', { replace: true });
      return;
    }

    if (!token) {
      toast.error('Token manquant. Veuillez réessayer.');
      navigate('/login', { replace: true });
      return;
    }

    // Stocker le token et charger le profil
    loginWithToken(token)
      .then((user) => {
        toast.success(`Bienvenue, ${user.nom} !`);
        // Si l'utilisateur n'a pas de profil, rediriger vers l'onboarding
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        toast.error('Session invalide. Veuillez réessayer.');
        navigate('/login', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-6" />
        <p className="text-slate-400 text-sm">Connexion avec Google en cours…</p>
      </div>
    </div>
  );
}
