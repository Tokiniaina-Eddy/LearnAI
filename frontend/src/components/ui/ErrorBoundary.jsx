import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="card card-body max-w-lg text-center border-red-500/30 bg-red-500/5 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Une erreur inattendue est survenue</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              La page n'a pas pu se charger correctement. Vous pouvez recharger la page ou revenir au tableau de bord.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="btn-primary"
              >
                <RefreshCw className="w-4 h-4" /> Recharger la page
              </button>
              <a
                href="/dashboard"
                className="btn-secondary"
              >
                Tableau de bord
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
