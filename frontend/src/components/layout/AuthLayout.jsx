import { Outlet, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-surface-900 via-primary-950 to-surface-950 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">LearnAI</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h1 className="text-4xl font-bold text-slate-50 leading-tight mb-4">
            Apprends à ton rythme,<br />
            <span className="gradient-text">guidé par l'IA</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Un parcours entièrement personnalisé selon ton niveau, tes objectifs et ton temps disponible.
          </p>
          <ul className="space-y-3">
            {[
              'Parcours généré automatiquement par l\'IA',
              'Cours, quiz et exercices adaptés à ton niveau',
              'Tuteur IA disponible à tout moment',
              'Suivi de progression et carte de compétences',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-primary-600/20 border border-primary-600/40 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-slate-600 text-sm relative z-10">© 2026 LearnAI. Tous droits réservés.</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">LearnAI</span>
          </div>
          <Outlet />
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}
