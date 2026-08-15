import clsx from 'clsx';
import { Check } from 'lucide-react';

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  done && 'bg-primary-600 text-white',
                  active && 'bg-primary-600 text-white ring-4 ring-primary-600/30',
                  !done && !active && 'bg-surface-800 text-slate-500 border border-surface-700'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
              </div>
              <span
                className={clsx(
                  'text-xs mt-1 font-medium',
                  active ? 'text-primary-400' : done ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  'h-0.5 w-12 mx-1 mb-5 transition-all duration-500',
                  done ? 'bg-primary-600' : 'bg-surface-800'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
