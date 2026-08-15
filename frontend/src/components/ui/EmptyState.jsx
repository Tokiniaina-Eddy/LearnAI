export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
