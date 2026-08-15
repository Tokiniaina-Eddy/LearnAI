import clsx from 'clsx';

export default function ProgressBar({ value = 0, max = 100, height = 'h-2', className, showLabel = false, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClass = color || 'from-primary-600 to-primary-400';

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progression</span>
          <span className="font-medium text-slate-200">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={clsx('progress-track', height)}>
        <div
          className={clsx('progress-bar bg-gradient-to-r', colorClass, height)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
