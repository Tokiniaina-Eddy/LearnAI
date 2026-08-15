import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight, Menu, X, Target, Brain, BarChart2, MessageSquare,
  BookOpen, FileQuestion, Code2, Map, TrendingUp, RefreshCw, Award,
  ChevronRight, Check, Sparkles, User, Send,
  GraduationCap, Briefcase, Repeat, Sprout,
  Globe, Server, Database, Cpu, Rocket, Smartphone, Shield, Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ── Intersection Observer hook for scroll reveal ──────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">LearnAI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {[
            { label: 'Fonctionnalités', id: 'features' },
            { label: 'Comment ça marche', id: 'how' },
            { label: 'Pour qui ?', id: 'for-who' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60 transition-all duration-200"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary btn-sm">
              Mon dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">Se connecter</Link>
              <Link to="/register" className="btn-primary btn-sm">
                Commencer gratuitement
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden btn-icon btn-ghost"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 pb-4 space-y-1">
          {[
            { label: 'Fonctionnalités', id: 'features' },
            { label: 'Comment ça marche', id: 'how' },
            { label: 'Pour qui ?', id: 'for-who' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="block w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              {label}
            </button>
          ))}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link to="/login" className="btn-secondary w-full justify-center">Se connecter</Link>
            <Link to="/register" className="btn-primary w-full justify-center">Commencer gratuitement</Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Dashboard Mockup ───────────────────────────────────────────────────────
function DashboardMockup() {
  const skills = [
    { name: 'Python', pct: 90, color: '#5570f5' },
    { name: 'FastAPI', pct: 72, color: '#5570f5' },
    { name: 'REST API', pct: 65, color: '#5570f5' },
    { name: 'SQL', pct: 58, color: '#eab308' },
    { name: 'Testing', pct: 35, color: '#ef4444' },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow background */}
      <div className="absolute inset-0 bg-primary-600/10 rounded-3xl blur-3xl scale-110 pointer-events-none" />

      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
        {/* Window bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-slate-400 font-medium">LearnAI · Dashboard</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Greeting */}
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" /> Bonjour Eddy
            </h3>
            <p className="text-xs text-slate-500">Continuez votre parcours — vous progressez bien !</p>
          </div>

          {/* Goal card */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500">Objectif actuel</span>
              <span className="badge badge-primary text-xs">Actif</span>
            </div>
            <p className="text-sm font-medium text-slate-200 mb-2.5">Devenir développeur FastAPI</p>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Progression globale</span>
              <span className="font-semibold text-primary-400">72%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: '72%', background: 'linear-gradient(to right, #3d4eea, #7a97fa)' }}
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2.5">Compétences</p>
            <div className="space-y-2.5">
              {skills.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{s.name}</span>
                    <span className="font-medium" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color, opacity: s.pct < 50 ? 0.7 : 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next activity */}
          <div className="flex items-center justify-between p-3 bg-primary-600/10 border border-primary-600/20 rounded-xl">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Prochaine activité</p>
              <p className="text-xs font-medium text-slate-200">Authentication avec JWT</p>
            </div>
            <button className="btn-primary btn-sm shrink-0">
              Continuer <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs font-medium text-slate-200">IA active</span>
        </div>
      </div>
      <div className="absolute -bottom-3 -left-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium text-slate-200">+12% cette semaine</span>
        </div>
      </div>
    </div>
  );
}

// ── Tutor Chat Mockup ──────────────────────────────────────────────────────
function TutorMockup() {
  const messages = [
    { role: 'user', content: 'Je ne comprends pas la différence entre PUT et PATCH.' },
    {
      role: 'ai',
      content: 'Imaginez que vous modifiez le profil d\'un utilisateur. **PUT** remplace l\'intégralité des données, même les champs non modifiés. **PATCH** ne met à jour que les champs fournis — c\'est plus efficace pour des modifications partielles.',
    },
    { role: 'user', content: 'Donne-moi un exemple concret en FastAPI.' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Tuteur IA</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-slate-500">En ligne</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-500 to-accent-400'}`}>
              {m.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Sparkles className="w-3 h-3 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-sm'}`}>
              {m.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith('**') ? (
                  <strong key={j} className="font-semibold text-slate-100">{part.replace(/\*\*/g, '')}</strong>
                ) : part
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-tl-sm px-3 py-2.5">
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {['Expliquer plus simplement', 'Donner un exemple', 'Créer un exercice'].map((a) => (
          <button key={a} className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:border-primary-600 hover:text-primary-300 transition-all">
            {a}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-500 flex-1">Pose ta question...</span>
          <div className="w-6 h-6 rounded-lg bg-primary-600 flex items-center justify-center">
            <Send className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main LandingPage ───────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users directly to the app
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const features = [
    { icon: Target,       title: 'Parcours personnalisés',     desc: 'Un programme adapté à votre objectif, votre niveau et votre tempo.' },
    { icon: Brain,        title: 'Intelligence adaptative',    desc: 'L\'IA analyse vos performances et réajuste votre parcours en continu.' },
    { icon: BarChart2,    title: 'Suivi des compétences',      desc: 'Visualisez précisément ce que vous maîtrisez et vos axes d\'amélioration.' },
    { icon: MessageSquare, title: 'Tuteur IA',                 desc: 'Posez vos questions. Des explications adaptées à votre niveau, instantanément.' },
    { icon: BookOpen,     title: 'Cours adaptés',              desc: 'Contenu généré selon votre niveau, avec exemples concrets et points clés.' },
    { icon: FileQuestion, title: 'Quiz intelligents',          desc: 'Des questions générées par l\'IA pour tester votre compréhension en profondeur.' },
    { icon: Code2,        title: 'Exercices pratiques',        desc: 'Mettez en pratique avec des exercices guidés et un feedback pédagogique.' },
    { icon: Map,          title: 'Skill Map',                  desc: 'Une carte visuelle de toutes vos compétences avec niveau détaillé.' },
    { icon: RefreshCw,    title: 'Adaptation automatique',     desc: 'Votre parcours évolue après chaque quiz pour toujours rester pertinent.' },
    { icon: Award,        title: 'Projet final',               desc: 'Terminez par un projet pratique concret pour consolider vos acquis.' },
  ];

  const steps = [
    { num: '01', icon: Target,    title: 'Définissez votre objectif',    desc: 'Indiquez ce que vous souhaitez apprendre et votre niveau actuel.' },
    { num: '02', icon: Brain,     title: 'Évaluez vos connaissances',    desc: 'Une évaluation rapide identifie vos compétences et vos lacunes.' },
    { num: '03', icon: Sparkles,  title: 'Recevez votre parcours',       desc: 'LearnAI génère un parcours structuré et adapté à votre profil.' },
    { num: '04', icon: TrendingUp, title: 'Progressez avec l\'IA',       desc: 'Vos résultats permettent à l\'IA d\'adapter continuellement votre apprentissage.' },
  ];

  const profiles = [
    { icon: GraduationCap, label: 'Étudiants',     desc: 'Apprenez de nouvelles compétences avec un parcours adapté à votre rythme.' },
    { icon: Code2,          label: 'Développeurs',  desc: 'Approfondissez une technologie et pratiquez avec des exercices ciblés.' },
    { icon: Briefcase,      label: 'Professionnels', desc: 'Développez rapidement de nouvelles compétences techniques ou transversales.' },
    { icon: Sprout,         label: 'Débutants',     desc: 'Commencez depuis votre niveau réel, sans programme trop difficile.' },
  ];

  const skillMapData = [
    { name: 'Python',   pct: 90 },
    { name: 'FastAPI',  pct: 72 },
    { name: 'REST API', pct: 65 },
    { name: 'SQL',      pct: 58 },
    { name: 'Testing',  pct: 35 },
    { name: 'Security', pct: 24 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-accent-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div className="animate-in">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-600/15 border border-primary-600/25 rounded-full text-primary-300 text-sm font-medium mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                Apprentissage personnalisé par l'IA
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-slate-50 leading-tight mb-6">
                Apprenez{' '}
                <span className="gradient-text">plus intelligemment.</span>
                <br />
                Progressez à votre rythme.
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
                LearnAI crée un parcours d'apprentissage personnalisé selon votre niveau, vos objectifs
                et votre progression. L'intelligence artificielle vous accompagne à chaque étape.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link to="/register" className="btn-primary btn-lg">
                  Commencer gratuitement <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary btn-lg"
                >
                  Découvrir la plateforme
                </button>
              </div>

              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Créez votre parcours personnalisé en quelques minutes.
              </p>
            </div>

            {/* Right — mockup */}
            <div className="animate-in" style={{ animationDelay: '150ms' }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY LEARNAI ───────────────────────────────────────────────── */}
      <section className="py-24 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-4">
                Un parcours qui s'adapte à vous
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Chaque apprenant est différent. LearnAI analyse votre niveau, vos résultats et vos
                lacunes pour vous proposer les contenus les plus pertinents au bon moment.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Target,      title: 'Parcours personnalisé',  desc: 'Un programme adapté à votre objectif, votre niveau et votre rythme.', delay: 0 },
              { icon: Brain,       title: 'Intelligence adaptative', desc: 'L\'IA analyse vos performances et ajuste votre parcours automatiquement.', delay: 80 },
              { icon: BarChart2,   title: 'Suivi des compétences',   desc: 'Visualisez vos progrès et identifiez facilement vos forces et lacunes.', delay: 160 },
              { icon: MessageSquare, title: 'Tuteur IA',             desc: 'Posez vos questions et obtenez des explications adaptées à votre niveau.', delay: 240 },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <Reveal key={title} delay={delay}>
                <div className="card card-body group hover:border-indigo-700/50 hover:shadow-card-hover transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-600/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-3 block">Processus</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50">
                Comment ça marche ?
              </h2>
            </div>
          </Reveal>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {steps.map(({ num, icon: Icon, title, desc }, i) => (
              <Reveal key={num} delay={i * 100}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className="relative mb-6 z-10">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-primary-600 transition-all shadow-card mx-auto">
                      <Icon className="w-8 h-8 text-primary-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{num}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADAPTIVE AI ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — visual */}
            <Reveal>
              <div className="relative">
                {/* Flow diagram */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
                  {[
                    { label: 'Résultats quiz & exercices', icon: FileQuestion, active: true },
                    { label: 'Analyse IA des performances', icon: Brain, active: true },
                    { label: 'Détection des lacunes', icon: Target, active: true },
                    { label: 'Exercices supplémentaires', icon: Code2, active: false },
                    { label: 'Parcours adapté',            icon: RefreshCw, active: false },
                  ].map(({ label, icon: Icon, active }, i) => (
                    <div key={i}>
                      <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${active ? 'bg-primary-600/10 border-primary-600/30 text-primary-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-400'}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{label}</span>
                        {active && <div className="ml-auto w-2 h-2 rounded-full bg-primary-400 animate-pulse" />}
                      </div>
                      {i < 4 && (
                        <div className="flex justify-center py-1">
                          <div className="w-px h-4 bg-slate-700" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Example alert */}
                <div className="absolute -bottom-4 -right-4 max-w-xs bg-slate-800 border border-slate-700 rounded-xl p-3.5 shadow-xl">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-600/30 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200 mb-0.5">Lacune détectée</p>
                      <p className="text-xs text-slate-400">Authentification JWT · Score 24%</p>
                      <p className="text-xs text-primary-400 mt-1">+3 exercices ajoutés au parcours</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right — copy */}
            <Reveal delay={150}>
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Adaptation intelligente</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-6">
                Votre parcours évolue avec vous
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                LearnAI ne se contente pas de vous donner un programme fixe. Après chaque quiz et
                exercice, l'IA analyse vos performances, identifie vos points faibles et adapte
                automatiquement la suite de votre parcours.
              </p>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-8">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="text-slate-500">Par exemple — </span>
                  Vous maîtrisez HTTP mais avez des difficultés avec l'authentification ?
                  LearnAI détecte cette lacune et vous propose automatiquement des ressources
                  et exercices supplémentaires sur ce point précis.
                </p>
              </div>

              <Link to="/register" className="btn-primary btn-lg inline-flex">
                Essayer maintenant <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-3 block">Fonctionnalités</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50">
                Tout ce dont vous avez besoin pour apprendre
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={Math.floor(i / 5) * 80 + (i % 5) * 50}>
                <div className="card p-5 group hover:border-indigo-700/50 hover:shadow-card-hover transition-all duration-300 h-full">
                  <div className="w-9 h-9 rounded-xl bg-primary-600/15 border border-primary-600/20 flex items-center justify-center mb-3 group-hover:bg-primary-600/25 transition-all">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILL MAP ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <Reveal>
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Skill Map</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-6">
                Visualisez votre progression
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Ne vous contentez pas de voir votre progression globale. Comprenez précisément ce que
                vous maîtrisez et ce que vous devez encore améliorer avec une carte détaillée de toutes
                vos compétences.
              </p>
              <ul className="space-y-3">
                {['Niveau détaillé par compétence', 'Identification des points faibles', 'Évolution dans le temps', 'Recommandations personnalisées'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-primary-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Right — skill bars */}
            <Reveal delay={150}>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-slate-100">Skill Map</h3>
                    <p className="text-xs text-slate-500">Objectif : Maîtriser FastAPI</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-50">57%</p>
                    <p className="text-xs text-slate-500">Score global</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {skillMapData.map(({ name, pct }) => {
                    const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#5570f5' : pct >= 35 ? '#eab308' : '#ef4444';
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-300 font-medium">{name}</span>
                          <span className="font-semibold" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Maîtrisé</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> En cours</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> À renforcer</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── AI TUTOR ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — mockup */}
            <Reveal className="order-2 lg:order-1">
              <TutorMockup />
            </Reveal>

            {/* Right — copy */}
            <Reveal delay={150} className="order-1 lg:order-2">
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Tuteur IA</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-6">
                Un tuteur disponible quand vous en avez besoin
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Posez vos questions à tout moment. Le Tuteur IA comprend où vous en êtes dans votre
                parcours et adapte ses explications à votre niveau — sans jamais vous donner directement
                la réponse pour vous faire progresser.
              </p>
              <div className="space-y-3">
                {[
                  'Explications adaptées à votre niveau',
                  'Reformulation à la demande',
                  'Exemples concrets et pratiques',
                  'Aide aux exercices sans spoiler',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-primary-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOR WHO ───────────────────────────────────────────────────── */}
      <section id="for-who" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-3 block">Pour qui ?</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-50">
                LearnAI s'adapte à tous les profils
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {profiles.map(({ icon: Icon, label, desc }, i) => (
              <Reveal key={label} delay={i * 80}>
                <div className="card card-body group hover:border-indigo-700/50 transition-all duration-300 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/15 border border-primary-600/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-600/25 transition-all">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{label}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/60 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-600/8 rounded-full blur-[80px] pointer-events-none" />

        <Reveal>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-600/15 border border-primary-600/25 rounded-full text-primary-300 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Prêt à commencer ?
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-50 mb-6">
              Prêt à apprendre autrement ?
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Définissez votre objectif. LearnAI s'occupe du parcours.
            </p>
            <Link to="/register" className="btn-primary btn-lg mx-auto inline-flex text-base px-8 py-4">
              Commencer gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-4">Parcours généré en quelques minutes.</p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg gradient-text">LearnAI</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Apprenez. Progressez. Évoluez.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">Produit</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Fonctionnalités', action: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Comment ça marche', action: () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }) },
                ].map(({ label, action }) => (
                  <li key={label}>
                    <button onClick={action} className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">Ressources</h4>
              <ul className="space-y-3">
                {['À propos', 'Contact', 'FAQ'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-slate-500 cursor-default">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compte */}
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">Compte</h4>
              <ul className="space-y-3">
                <li><Link to="/login" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">Connexion</Link></li>
                <li><Link to="/register" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">Inscription</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">© 2026 LearnAI. Tous droits réservés.</p>
            <p className="text-xs text-slate-700">Construit avec FastAPI + React + OpenAI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
