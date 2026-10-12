import { useState } from 'react';
import {
  User, Mail, Lock, Bell, Palette, Shield,
  Save, Eye, EyeOff, CheckCircle, LogOut, Moon, Sun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const SECTIONS = [
  { id: 'profil',        label: 'Profil',          icon: User },
  { id: 'securite',      label: 'Sécurité',         icon: Lock },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'apparence',     label: 'Apparence',        icon: Palette },
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('profil');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profil form state
  const [profil, setProfil] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });

  // Password form state
  const [passwords, setPasswords] = useState({
    actuel: '', nouveau: '', confirmation: '',
  });

  // Notifications state
  const [notifs, setNotifs] = useState({
    rappel_quotidien: true,
    resultats_quiz: true,
    nouvelles_lecons: false,
    progression_hebdo: true,
  });

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authService.updateMe({
        nom: profil.nom,
        email: profil.email,
      });
      updateUser({ ...user, ...data });
      toast.success('Profil mis à jour !');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwords.actuel) {
      toast.error('Renseigne ton mot de passe actuel');
      return;
    }
    if (passwords.nouveau !== passwords.confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwords.nouveau.length < 8) {
      toast.error('Le nouveau mot de passe doit faire au moins 8 caractères');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({
        current_password: passwords.actuel,
        new_password: passwords.nouveau,
      });
      toast.success('Mot de passe mis à jour !');
      setPasswords({ actuel: '', nouveau: '', confirmation: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Gère ton compte et tes préférences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-52 shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  section === id
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Danger zone */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profil ── */}
          {section === 'profil' && (
            <div className="card card-body space-y-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" /> Mon profil
              </h2>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.nom?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{user?.nom}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="badge badge-primary mt-1">
                    {user?.role || 'Apprenant'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveProfil} className="space-y-4">
                <div>
                  <label className="label">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      className="input pl-10"
                      value={profil.nom}
                      onChange={e => setProfil({ ...profil, nom: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      className="input pl-10"
                      value={profil.email}
                      onChange={e => setProfil({ ...profil, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Bio <span className="text-slate-500 font-normal">(optionnel)</span></label>
                  <textarea
                    rows={3}
                    className="textarea"
                    placeholder="Quelques mots sur toi…"
                    value={profil.bio}
                    onChange={e => setProfil({ ...profil, bio: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Enregistrer</>}
                </button>
              </form>
            </div>
          )}

          {/* ── Sécurité ── */}
          {section === 'securite' && (
            <div className="card card-body space-y-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-400" /> Sécurité
              </h2>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="label">Mot de passe actuel</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-10 pr-10"
                      placeholder="••••••••"
                      value={passwords.actuel}
                      onChange={e => setPasswords({ ...passwords, actuel: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-10"
                      placeholder="8 caractères minimum"
                      value={passwords.nouveau}
                      onChange={e => setPasswords({ ...passwords, nouveau: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-10"
                      placeholder="••••••••"
                      value={passwords.confirmation}
                      onChange={e => setPasswords({ ...passwords, confirmation: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : <><Shield className="w-4 h-4" /> Mettre à jour le mot de passe</>}
                </button>
              </form>

              {/* Session info */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Session active</h3>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-200">Session actuelle</p>
                    <p className="text-xs text-slate-500">Connecté en tant que {user?.email}</p>
                  </div>
                  <span className="badge badge-success">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {section === 'notifications' && (
            <div className="card card-body space-y-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-400" /> Notifications
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'rappel_quotidien', label: 'Rappel quotidien', desc: 'Un rappel pour maintenir ta série d\'apprentissage' },
                  { key: 'resultats_quiz', label: 'Résultats de quiz', desc: 'Reçois tes résultats et analyses dès qu\'un quiz est corrigé' },
                  { key: 'nouvelles_lecons', label: 'Nouvelles leçons disponibles', desc: 'Sois averti quand de nouvelles leçons sont ajoutées à ton parcours' },
                  { key: 'progression_hebdo', label: 'Rapport de progression hebdomadaire', desc: 'Un résumé de ta semaine d\'apprentissage tous les lundis' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 p-4 bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={clsx(
                        'w-11 h-6 rounded-full transition-all duration-200 relative shrink-0',
                        notifs[key] ? 'bg-indigo-600' : 'bg-slate-700'
                      )}
                      aria-checked={notifs[key]}
                      role="switch"
                      aria-label={label}
                    >
                      <span className={clsx(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
                        notifs[key] ? 'left-[22px]' : 'left-0.5'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.success('Préférences de notification enregistrées !')}
                className="btn-primary"
              >
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          )}

          {/* ── Apparence ── */}
          {section === 'apparence' && (
            <div className="card card-body space-y-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary-400" /> Apparence
              </h2>

              <div>
                <label className="label mb-3">Thème</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'dark',  label: 'Sombre', icon: Moon, active: true },
                    { key: 'light', label: 'Clair',  icon: Sun,  active: false, soon: true },
                  ].map(({ key, label, icon: ThemeIcon, active, soon }) => (
                    <button
                      key={key}
                      disabled={soon}
                      className={clsx(
                        'p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-2',
                        active
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <ThemeIcon className="w-4 h-4" />
                      {label}
                      {soon && <span className="ml-auto text-xs text-slate-600">(bientôt)</span>}
                      {active && <CheckCircle className="w-4 h-4 inline ml-auto text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label mb-3">Langue</label>
                <select className="select w-auto">
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English (bientôt)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-500">
                  D'autres options d'apparence (taille de police, espacement, couleur d'accent) seront disponibles dans une prochaine version.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
