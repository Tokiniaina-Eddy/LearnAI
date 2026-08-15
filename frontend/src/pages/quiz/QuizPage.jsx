import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, XCircle, ChevronRight, ChevronLeft,
  Trophy, RotateCcw, FileQuestion, AlertCircle, Lightbulb,
} from 'lucide-react';
import { quizService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── Mock quiz ─────────────────────────────────────────────────────────────────
const MOCK_QUIZ = {
  id: 1,
  titre: 'Quiz — Routing & Paramètres',
  lesson_id: 5,
  questions: [
    {
      id: 1,
      question: 'Comment déclare-t-on un path parameter dans FastAPI ?',
      options: [
        '@app.get("/items?id={item_id}")',
        '@app.get("/items/{item_id}")',
        '@app.get("/items/[item_id]")',
        '@app.get("/items/:item_id")',
      ],
      reponse: 1,
      explication: 'FastAPI utilise les accolades {param} dans le chemin pour déclarer des path parameters, similaire à la notation des f-strings Python.',
    },
    {
      id: 2,
      question: 'Qu\'est-ce qu\'un query parameter optionnel en FastAPI ?',
      options: [
        'Un paramètre sans type déclaré',
        'Un paramètre avec une valeur par défaut',
        'Un paramètre préfixé par `?`',
        'Un paramètre défini avec `@query`',
      ],
      reponse: 1,
      explication: 'En FastAPI, un paramètre de fonction avec une valeur par défaut devient automatiquement un query parameter optionnel.',
    },
    {
      id: 3,
      question: 'Laquelle de ces URLs appelle correctement `GET /items/{id}?active=true` ?',
      options: [
        '/items/42?active=true',
        '/items?id=42&active=true',
        '/items/42/active/true',
        '/items/[42]?active=true',
      ],
      reponse: 0,
      explication: 'Le path parameter `id` est passé dans le chemin (/items/42) et le query parameter `active` est passé dans la query string (?active=true).',
    },
    {
      id: 4,
      question: 'Comment rendre un query parameter obligatoire dans FastAPI ?',
      options: [
        'En le préfixant par `required=True`',
        'En utilisant le décorateur `@required`',
        'En ne lui donnant aucune valeur par défaut',
        'En le déclarant dans `@app.get()` directement',
      ],
      reponse: 2,
      explication: 'Sans valeur par défaut, FastAPI considère automatiquement le paramètre comme obligatoire et retourne une erreur 422 s\'il est absent.',
    },
    {
      id: 5,
      question: 'Quel type Python utilise-t-on pour un query parameter optionnel nullable ?',
      options: [
        'nullable[str]',
        'str | None avec = None',
        'Optional(str)',
        'Maybe[str]',
      ],
      reponse: 1,
      explication: '`str | None = None` (ou `Optional[str] = None` pour Python < 3.10) indique un paramètre optionnel qui peut valoir None.',
    },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('questions'); // questions | results
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});   // { questionId: answerIndex }
  const [revealed, setRevealed] = useState({});   // { questionId: true } — show explanation
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    quizService.get(quizId)
      .then((res) => setQuiz(res.data))
      .catch(() => setQuiz(MOCK_QUIZ))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="xl" /></div>;
  if (!quiz) return null;

  const q = quiz.questions[current];
  const totalQ = quiz.questions.length;
  const answered = Object.keys(selected).length;

  const handleSelect = (idx) => {
    if (revealed[q.id]) return;
    setSelected((prev) => ({ ...prev, [q.id]: idx }));
  };

  const handleReveal = () => {
    if (selected[q.id] === undefined) {
      toast.error('Choisis une réponse d\'abord');
      return;
    }
    setRevealed((prev) => ({ ...prev, [q.id]: true }));
  };

  const handleNext = () => {
    if (current < totalQ - 1) setCurrent(current + 1);
  };
  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    if (answered < totalQ) {
      toast.error('Réponds à toutes les questions d\'abord');
      return;
    }
    setSubmitting(true);
    try {
      await quizService.submit(quiz.id, selected);
    } catch {
      // continue with local scoring
    } finally {
      setSubmitting(false);
      setPhase('results');
    }
  };

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const correct = quiz.questions.filter(
      (q) => selected[q.id] === q.reponse
    ).length;
    const score = Math.round((correct / totalQ) * 100);
    const passed = score >= 70;

    return (
      <div className="max-w-2xl mx-auto animate-in">
        <div className="card card-body text-center mb-6">
          <div className={clsx(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow',
            passed ? 'bg-gradient-to-br from-success-500 to-primary-600' : 'bg-gradient-to-br from-warning-500 to-danger-500'
          )}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-50 mb-1">
            {passed ? 'Bravo ! 🎉' : 'Continue comme ça !'}
          </h1>
          <p className="text-slate-400 mb-6">
            {passed
              ? 'Tu maîtrises bien ce sujet. Passe à la suite !'
              : 'Revois les points difficiles et réessaie quand tu veux.'}
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-surface-800 rounded-xl p-4">
              <div className={clsx('text-3xl font-bold mb-1', passed ? 'text-success-500' : 'text-warning-500')}>{score}%</div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
            <div className="bg-surface-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-slate-100 mb-1">{correct}/{totalQ}</div>
              <div className="text-xs text-slate-500">Correctes</div>
            </div>
            <div className="bg-surface-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-slate-100 mb-1">{totalQ - correct}</div>
              <div className="text-xs text-slate-500">Erreurs</div>
            </div>
          </div>
          <ProgressBar value={score} height="h-3" className="mb-6" />
        </div>

        {/* Per-question review */}
        <div className="space-y-3 mb-6">
          {quiz.questions.map((q, i) => {
            const isCorrect = selected[q.id] === q.reponse;
            return (
              <div key={q.id} className={clsx(
                'card card-body',
                isCorrect ? 'border-success-500/20' : 'border-danger-500/20'
              )}>
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect
                    ? <CheckCircle className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-danger-500 shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-medium text-slate-200">{q.question}</p>
                </div>
                {!isCorrect && (
                  <div className="ml-8 space-y-1 text-sm mb-3">
                    <p className="text-danger-400">
                      Ta réponse : <span className="font-medium">{q.options[selected[q.id]]}</span>
                    </p>
                    <p className="text-success-500">
                      Bonne réponse : <span className="font-medium">{q.options[q.reponse]}</span>
                    </p>
                  </div>
                )}
                <div className="ml-8 flex items-start gap-2 bg-surface-800 rounded-xl p-3">
                  <Lightbulb className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">{q.explication}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setPhase('questions'); setCurrent(0); setSelected({}); setRevealed({}); }}
            className="btn-secondary flex-1"
          >
            <RotateCcw className="w-4 h-4" /> Réessayer
          </button>
          <button onClick={() => navigate(-1)} className="btn-primary flex-1">
            Continuer l'apprentissage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  const isRevealed = !!revealed[q.id];
  const selectedAnswer = selected[q.id];
  const isCorrect = selectedAnswer === q.reponse;

  return (
    <div className="max-w-2xl mx-auto animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileQuestion className="w-5 h-5 text-warning-500" />
            <h1 className="text-lg font-bold text-slate-100">{quiz.titre}</h1>
          </div>
          <p className="text-sm text-slate-500">{answered}/{totalQ} questions répondues</p>
        </div>
        <span className="text-sm font-medium text-primary-400">
          {current + 1} / {totalQ}
        </span>
      </div>

      {/* Progress */}
      <ProgressBar value={answered} max={totalQ} height="h-1.5" className="mb-6" />

      {/* Question dots */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {quiz.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={clsx(
              'w-8 h-8 rounded-lg text-xs font-medium border transition-all',
              i === current
                ? 'bg-primary-600 text-white border-primary-500'
                : selected[quiz.questions[i]?.id] !== undefined
                ? revealed[quiz.questions[i]?.id]
                  ? selected[quiz.questions[i].id] === quiz.questions[i].reponse
                    ? 'bg-success-500/10 text-success-500 border-success-500/30'
                    : 'bg-danger-500/10 text-danger-500 border-danger-500/30'
                  : 'bg-primary-600/20 text-primary-300 border-primary-600/30'
                : 'bg-surface-800 text-slate-500 border-surface-700'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="card card-body mb-4">
        <p className="text-base font-semibold text-slate-100 mb-6 leading-relaxed">{q.question}</p>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let style = 'border-surface-700 bg-surface-800/50 text-slate-300 hover:border-surface-600 hover:bg-surface-800';
            if (selectedAnswer === i && !isRevealed) {
              style = 'border-primary-500 bg-primary-600/20 text-slate-100';
            }
            if (isRevealed) {
              if (i === q.reponse) {
                style = 'border-success-500 bg-success-500/10 text-success-400';
              } else if (selectedAnswer === i && i !== q.reponse) {
                style = 'border-danger-500 bg-danger-500/10 text-danger-400';
              } else {
                style = 'border-surface-700 bg-surface-800/30 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={isRevealed}
                className={clsx('w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200', style)}
              >
                <div className={clsx(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all',
                  isRevealed && i === q.reponse ? 'border-success-400 bg-success-500 text-white' :
                  isRevealed && selectedAnswer === i ? 'border-danger-400 bg-danger-500 text-white' :
                  selectedAnswer === i ? 'border-primary-400 bg-primary-500 text-white' :
                  'border-surface-600 text-slate-500'
                )}>
                  {isRevealed && i === q.reponse ? <CheckCircle className="w-3 h-3" /> :
                   isRevealed && selectedAnswer === i ? <XCircle className="w-3 h-3" /> :
                   String.fromCharCode(65 + i)}
                </div>
                <span className="text-sm">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isRevealed && (
          <div className={clsx(
            'mt-4 p-4 rounded-xl border flex gap-3',
            isCorrect ? 'bg-success-500/5 border-success-500/20' : 'bg-warning-500/5 border-warning-500/20'
          )}>
            <Lightbulb className={clsx('w-5 h-5 shrink-0 mt-0.5', isCorrect ? 'text-success-500' : 'text-warning-500')} />
            <div>
              <p className={clsx('font-semibold text-sm mb-1', isCorrect ? 'text-success-400' : 'text-warning-400')}>
                {isCorrect ? '✓ Bonne réponse !' : '✗ Pas tout à fait…'}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{q.explication}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={handlePrev} disabled={current === 0} className="btn-secondary">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>

        <div className="flex gap-2">
          {!isRevealed && selectedAnswer !== undefined && (
            <button onClick={handleReveal} className="btn-secondary">
              <AlertCircle className="w-4 h-4" /> Vérifier
            </button>
          )}

          {current === totalQ - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || answered < totalQ}
              className="btn-primary"
            >
              {submitting ? <Spinner size="sm" /> : <><Trophy className="w-4 h-4" /> Terminer le quiz</>}
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
