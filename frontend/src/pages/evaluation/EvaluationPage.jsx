import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { evaluationService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── Mock data used while backend is not connected ──────────────────────────
const MOCK_QUESTIONS = [
  {
    id: 1,
    type: 'mcq',
    question: 'Qu\'est-ce qu\'une API REST ?',
    options: [
      'Un protocole de communication entre serveurs uniquement',
      'Un style architectural pour les services web utilisant HTTP',
      'Un langage de programmation côté serveur',
      'Un type de base de données relationnelle',
    ],
    answer: 1,
    explication: 'REST (Representational State Transfer) est un style architectural qui utilise les méthodes HTTP standard pour créer des services web.',
  },
  {
    id: 2,
    type: 'mcq',
    question: 'Quel code HTTP indique une ressource créée avec succès ?',
    options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
    answer: 1,
    explication: 'Le code 201 Created est retourné lorsqu\'une ressource est créée avec succès via une requête POST.',
  },
  {
    id: 3,
    type: 'mcq',
    question: 'Quelle méthode HTTP est idempotente ?',
    options: ['POST', 'PATCH', 'PUT', 'CONNECT'],
    answer: 2,
    explication: 'PUT est idempotente : appeler la même requête plusieurs fois produit toujours le même résultat.',
  },
  {
    id: 4,
    type: 'open',
    question: 'Explique brièvement la différence entre authentification et autorisation.',
    placeholder: 'Tape ta réponse ici…',
  },
  {
    id: 5,
    type: 'mcq',
    question: 'Dans FastAPI, comment définit-on un paramètre de chemin ?',
    options: [
      '@app.get("/items?id={item_id}")',
      '@app.get("/items/{item_id}")',
      '@app.get("/items/[item_id]")',
      '@app.get("/items/:item_id")',
    ],
    answer: 1,
    explication: 'FastAPI utilise la syntaxe {param} dans le chemin pour déclarer des path parameters.',
  },
];
// ───────────────────────────────────────────────────────────────────────────

export default function EvaluationPage() {
  const { goalId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | intro | questions | submitting | results
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());

  // Generate / fetch evaluation
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await evaluationService.generate(goalId);
        setQuestions(data.questions || MOCK_QUESTIONS);
      } catch {
        // Fallback to mock when backend not connected
        setQuestions(MOCK_QUESTIONS);
      } finally {
        setPhase('intro');
      }
    };
    load();
  }, [goalId]);

  // Timer (10 min)
  useEffect(() => {
    if (phase !== 'questions') return;
    setTimeLeft(600);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [questions[current].id]: value }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };
  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    setPhase('submitting');
    try {
      const { data } = await evaluationService.submit(goalId, answers);
      setResults(data);
    } catch {
      // Mock results
      const scored = questions.filter(q => q.type === 'mcq' && answers[q.id] === q.answer).length;
      const total = questions.filter(q => q.type === 'mcq').length;
      setResults({
        score: Math.round((scored / total) * 100),
        niveau_estime: scored >= total * 0.8 ? 'avance' : scored >= total * 0.5 ? 'intermediaire' : 'debutant',
        feedback: 'Bonne tentative ! Ton parcours a été personnalisé en fonction de tes réponses.',
        competences: [
          { nom: 'HTTP & REST', score: 75 },
          { nom: 'Authentification', score: 45 },
          { nom: 'Routing', score: 60 },
          { nom: 'Base de données', score: 30 },
        ],
        duree_secondes: Math.round((Date.now() - startTime) / 1000),
      });
    } finally {
      setPhase('results');
    }
  };

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = questions.length ? (answered / questions.length) * 100 : 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary-600/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary-400 animate-pulse-slow" />
        </div>
        <div className="text-center">
          <p className="text-slate-200 font-semibold mb-1">Génération de l'évaluation…</p>
          <p className="text-slate-500 text-sm">L'IA prépare des questions adaptées à ton objectif</p>
        </div>
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-in">
          <div className="card card-body text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 mb-3">Évaluation initiale</h1>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Cette évaluation permet à LearnAI de mesurer ton niveau réel et de générer un parcours
              parfaitement adapté. Il n'y a pas de mauvaises réponses — sois honnête !
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Questions', value: questions.length, icon: '📝' },
                { label: 'Durée estimée', value: '5-10 min', icon: '⏱️' },
                { label: 'Types', value: 'QCM + Ouvertes', icon: '🎯' },
              ].map((item) => (
                <div key={item.label} className="bg-surface-800 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-slate-200 font-semibold text-sm">{item.value}</div>
                  <div className="text-slate-500 text-xs">{item.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setPhase('questions')} className="btn-primary btn-lg w-full">
              Commencer l'évaluation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6">
        <Spinner size="xl" />
        <div className="text-center">
          <p className="text-slate-200 font-semibold mb-1">Analyse de tes réponses…</p>
          <p className="text-slate-500 text-sm">L'IA construit ton profil de compétences</p>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    const levelLabels = { debutant: '🌱 Débutant', intermediaire: '🚀 Intermédiaire', avance: '⚡ Avancé' };
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl animate-in">
          <div className="card card-body">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-50 mb-2">Évaluation terminée !</h1>
              <p className="text-slate-400">Voici ton profil de compétences initial</p>
            </div>

            {/* Score + Niveau */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-surface-800 rounded-2xl p-6 text-center">
                <div className="text-5xl font-bold gradient-text mb-1">{results.score}%</div>
                <div className="text-slate-400 text-sm">Score global</div>
              </div>
              <div className="bg-surface-800 rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold text-slate-100 mb-1">{levelLabels[results.niveau_estime]}</div>
                <div className="text-slate-400 text-sm">Niveau estimé</div>
              </div>
            </div>

            {/* Compétences */}
            {results.competences?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-slate-200 font-semibold mb-4">Première carte de compétences</h3>
                <div className="space-y-3">
                  {results.competences.map((c) => (
                    <div key={c.nom}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{c.nom}</span>
                        <span className={clsx('font-medium', c.score >= 70 ? 'text-success-500' : c.score >= 40 ? 'text-warning-500' : 'text-danger-500')}>
                          {c.score}%
                        </span>
                      </div>
                      <ProgressBar
                        value={c.score}
                        height="h-2"
                        color={c.score >= 70 ? 'from-success-500 to-success-500' : c.score >= 40 ? 'from-warning-500 to-warning-500' : 'from-danger-500 to-danger-500'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="bg-primary-600/10 border border-primary-600/20 rounded-xl p-4 mb-8">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-sm leading-relaxed">{results.feedback}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/learning/${goalId}`)}
              className="btn-primary btn-lg w-full"
            >
              Voir mon parcours personnalisé →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <div className="bg-surface-900 border-b border-surface-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-primary-400" />
            <span className="font-semibold text-slate-200">Évaluation initiale</span>
          </div>
          {timeLeft !== null && (
            <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium', timeLeft < 60 ? 'bg-danger-500/10 text-danger-400' : 'bg-surface-800 text-slate-300')}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
          <span className="text-sm text-slate-400">{answered}/{questions.length} répondues</span>
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <ProgressBar value={progress} showLabel={false} height="h-1.5" />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl animate-in">
          {/* Question counter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-all border',
                  i === current
                    ? 'bg-primary-600 text-white border-primary-500'
                    : answers[questions[i]?.id] !== undefined
                    ? 'bg-success-500/10 text-success-500 border-success-500/30'
                    : 'bg-surface-800 text-slate-500 border-surface-700 hover:border-surface-600'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="card card-body">
            {/* Question type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={clsx('badge', q?.type === 'mcq' ? 'badge-primary' : 'badge-warning')}>
                {q?.type === 'mcq' ? 'QCM' : 'Question ouverte'}
              </span>
              <span className="text-slate-500 text-sm">Question {current + 1} sur {questions.length}</span>
            </div>

            {/* Question text */}
            <h2 className="text-lg font-semibold text-slate-100 mb-6 leading-relaxed">{q?.question}</h2>

            {/* MCQ options */}
            {q?.type === 'mcq' && (
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className={clsx(
                        'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                        selected
                          ? 'border-primary-500 bg-primary-600/20 text-slate-100'
                          : 'border-surface-700 bg-surface-800/50 text-slate-300 hover:border-surface-600 hover:bg-surface-800'
                      )}
                    >
                      <div className={clsx('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all', selected ? 'border-primary-400 bg-primary-500' : 'border-surface-600')}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Open question */}
            {q?.type === 'open' && (
              <textarea
                rows={5}
                className="textarea"
                placeholder={q.placeholder || 'Ta réponse…'}
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={current === 0}
              className="btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>

            {current === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="btn-primary btn-lg"
                disabled={answered < questions.filter(q => q.type === 'mcq').length}
              >
                Terminer l'évaluation <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary">
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
