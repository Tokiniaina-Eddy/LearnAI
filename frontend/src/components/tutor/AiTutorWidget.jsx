import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, User, RotateCcw, ChevronDown } from 'lucide-react';
import { tutorService } from '../../services/api';
import Spinner from '../ui/Spinner';
import clsx from 'clsx';

const QUICK_PROMPTS = [
  'Explique ce concept simplement',
  'Donne-moi un exemple concret',
  'Pourquoi c\'est important ?',
  'J\'ai une erreur dans mon code',
];

// ── Markdown renderer léger ────────────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bloc de code ```
    if (line.trimStart().startsWith('```')) {
      const lang = line.replace(/```/, '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-2 p-3 bg-slate-900 border border-slate-700 rounded-xl overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed whitespace-pre">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Liste numérotée : "1. texte" ou "1) texte"
    if (/^\d+[\.\)]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+[\.\)]\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\d+[\.\)]\s+/, '');
        listItems.push(
          <li key={i} className="flex gap-2 items-start">
            <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-xs flex items-center justify-center mt-0.5 font-semibold">
              {lines[i].match(/^(\d+)/)[1]}
            </span>
            <span>{inlineMarkdown(content)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="space-y-1.5 my-2 text-sm">{listItems}</ol>);
      continue;
    }

    // Liste à puces : "- texte" ou "* texte" ou "• texte"
    if (/^[-\*•]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-\*•]\s+/.test(lines[i])) {
        const content = lines[i].replace(/^[-\*•]\s+/, '');
        listItems.push(
          <li key={i} className="flex gap-2 items-start">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
            <span>{inlineMarkdown(content)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="space-y-1.5 my-2 text-sm">{listItems}</ul>);
      continue;
    }

    // Titre ## ou ###
    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      const content = line.replace(/^#+\s+/, '');
      const cls = level === 1
        ? 'text-base font-bold text-slate-100 mt-3 mb-1'
        : level === 2
        ? 'text-sm font-semibold text-slate-200 mt-2 mb-1'
        : 'text-sm font-medium text-slate-300 mt-1';
      elements.push(<p key={i} className={cls}>{inlineMarkdown(content)}</p>);
      i++;
      continue;
    }

    // Ligne vide → espacement
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Paragraphe normal
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Inline markdown: **bold**, *italic*, `code`
function inlineMarkdown(text) {
  const parts = [];
  // Split on **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-100">{match[2]}</strong>);
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={match.index} className="italic text-slate-300">{match[3]}</em>);
    } else if (match[0].startsWith('`')) {
      parts.push(
        <code key={match.index} className="bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length > 0 ? parts : text;
}
// ─────────────────────────────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-orange-400'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Sparkles className="w-3.5 h-3.5 text-white" />
        }
      </div>
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-4 py-3',
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm text-sm leading-relaxed'
          : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
      )}>
        {isUser
          ? msg.content
          : <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
        }
      </div>
    </div>
  );
}

export default function AiTutorWidget({ context, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: `Bonjour ! Je suis ton tuteur IA 👋\n\nJe suis là pour t'aider à comprendre "${context?.lesson_titre || 'ce sujet'}". Pose-moi une question, demande une explication ou partage ton code !`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  };

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await tutorService.sendMessage({
        message: content,
        context,
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || data.message,
      }]);
    } catch {
      // Fallback mock response
      const mockResponses = [
        `Bonne question ! Pour "${content.toLowerCase().slice(0, 30)}…", voici ce qu'il faut retenir :\n\nEn FastAPI, tout est basé sur les annotations de type Python. Cela permet au framework de faire la validation et la documentation automatiquement.`,
        `Je comprends ta question. Pour clarifier ce point :\n\n1. FastAPI utilise Pydantic pour la validation\n2. Les types Python servent de contrat\n3. La documentation Swagger est générée automatiquement\n\nTu veux que je développe un point en particulier ?`,
        `C'est un concept clé ! L'idée principale est de laisser FastAPI gérer la conversion et validation des données pour toi, grâce aux annotations de type. Ça évite d'écrire du code répétitif.`,
      ];
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([{
      id: 0,
      role: 'assistant',
      content: `Conversation réinitialisée. Comment puis-je t'aider avec "${context?.lesson_titre || 'ce sujet'}" ?`,
    }]);
  };

  return (
    <div className="flex flex-col h-full card border-primary-700/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800 bg-gradient-to-r from-surface-900 to-primary-950/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Tuteur IA</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              <p className="text-xs text-slate-500">En ligne</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleReset} className="btn-icon btn-ghost" title="Réinitialiser">
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Fermer le tuteur">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Context badge */}
      {context?.lesson_titre && (
        <div className="px-4 py-2 bg-surface-800/50 border-b border-surface-800 shrink-0">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Contexte : <span className="text-primary-400 font-medium">{context.lesson_titre}</span>
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-surface-800 border border-surface-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <div className="absolute bottom-24 right-6">
          <button
            onClick={scrollToBottom}
            className="w-8 h-8 bg-surface-700 border border-surface-600 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-surface-600 transition-all shadow-lg"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick prompts */}
      <div className="px-3 py-2 border-t border-surface-800 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="shrink-0 text-xs px-3 py-1.5 bg-surface-800 border border-surface-700 rounded-full text-slate-400 hover:border-primary-600 hover:text-primary-300 transition-all disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question…"
            className="flex-1 bg-surface-800 border border-surface-700 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all max-h-28 overflow-y-auto"
            disabled={loading}
            aria-label="Message pour le tuteur IA"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-icon bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Envoyer"
          >
            {loading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-center">Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne</p>
      </div>
    </div>
  );
}
