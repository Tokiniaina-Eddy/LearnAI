import clsx from 'clsx';

// Couleurs prédéfinies sûres — pas de classes dynamiques Tailwind
const COLORS = {
  primary:  { from: '#3d4eea', to: '#7a97fa' },
  success:  { from: '#16a34a', to: '#4ade80' },
  warning:  { from: '#ca8a04', to: '#facc15' },
  danger:   { from: '#dc2626', to: '#f87171' },
  muted:    { from: '#334155', to: '#475569' },
};

/**
 * ProgressBar
 * @param {number}  value      - valeur actuelle
 * @param {number}  max        - valeur maximale (défaut 100)
 * @param {string}  height     - classe Tailwind de hauteur (défaut 'h-2')
 * @param {string}  variant    - 'primary' | 'success' | 'warning' | 'danger' | 'muted'
 * @param {boolean} showLabel  - afficher le label % à droite
 * @param {string}  label      - texte à gauche du label (défaut 'Progression')
 * @param {string}  className  - classes supplémentaires sur le wrapper
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  height = 'h-2',
  variant = 'primary',
  showLabel = false,
  label = 'Progression',
  className,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const { from, to } = COLORS[variant] ?? COLORS.primary;

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label}</span>
          <span className="font-medium text-slate-200">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-slate-800 rounded-full overflow-hidden', height)}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', height)}
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${from}, ${to})`,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
