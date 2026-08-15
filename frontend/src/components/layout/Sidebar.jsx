import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Map, BarChart2, MessageSquare,
  Settings, LogOut, Zap, ChevronLeft, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/learning',    icon: BookOpen,         label: 'Apprentissage' },
  { to: '/skillmap',    icon: Map,              label: 'Skill Map' },
  { to: '/progress',    icon: BarChart2,        label: 'Progression' },
  { to: '/tutor',       icon: MessageSquare,    label: 'Tuteur IA' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'relative flex flex-col bg-surface-900 border-r border-surface-800 transition-all duration-300 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-800 min-h-[68px]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg gradient-text">LearnAI</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-600 transition-all duration-200 z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Navigation principale">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-surface-800 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive ? 'bg-surface-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800'
            )
          }
          title={collapsed ? 'Paramètres' : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </NavLink>

        {/* User */}
        <div className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl', !collapsed && 'border border-surface-800 mt-2')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user?.nom?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.nom || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-danger-400 rounded-lg hover:bg-danger-500/10 transition-all"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 shrink-0" />
          </button>
        )}
      </div>
    </aside>
  );
}
