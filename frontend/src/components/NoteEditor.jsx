// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – NoteEditor
// Full-featured note editor in a Modal: Text (TipTap) | Code (Monaco) | Quiz
// Dependencies: @tiptap/react @tiptap/starter-kit @tiptap/extension-underline
//               @tiptap/extension-placeholder @monaco-editor/react
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import Modal   from './ui/Modal.jsx';
import Button  from './ui/Button.jsx';
import toast   from './ui/Toast.jsx';
import { cn }  from '../lib/utils.js';
import { post, patch } from '../lib/api.js';
import { useTheme } from '../context/ThemeContext.jsx';

// ── TipTap (lazy import for code-splitting) ───────────────────────────────────
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit   from '@tiptap/starter-kit';
import Underline    from '@tiptap/extension-underline';
import Placeholder  from '@tiptap/extension-placeholder';

// ── Monaco (lazy) ─────────────────────────────────────────────────────────────
import MonacoEditor from '@monaco-editor/react';

// ── Languages list ─────────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: 'JavaScript',   monaco: 'javascript'    },
  { label: 'TypeScript',   monaco: 'typescript'    },
  { label: 'Python',       monaco: 'python'        },
  { label: 'Java',         monaco: 'java'          },
  { label: 'C',            monaco: 'c'             },
  { label: 'C++',          monaco: 'cpp'           },
  { label: 'C#',           monaco: 'csharp'        },
  { label: 'Go',           monaco: 'go'            },
  { label: 'Rust',         monaco: 'rust'          },
  { label: 'PHP',          monaco: 'php'           },
  { label: 'Ruby',         monaco: 'ruby'          },
  { label: 'Swift',        monaco: 'swift'         },
  { label: 'Kotlin',       monaco: 'kotlin'        },
  { label: 'Dart',         monaco: 'dart'          },
  { label: 'SQL',          monaco: 'sql'           },
  { label: 'HTML',         monaco: 'html'          },
  { label: 'CSS',          monaco: 'css'           },
  { label: 'SCSS',         monaco: 'scss'          },
  { label: 'Bash/Shell',   monaco: 'shell'         },
  { label: 'PowerShell',   monaco: 'powershell'    },
  { label: 'JSON',         monaco: 'json'          },
  { label: 'YAML',         monaco: 'yaml'          },
  { label: 'XML',          monaco: 'xml'           },
  { label: 'Markdown',     monaco: 'markdown'      },
  { label: 'R',            monaco: 'r'             },
  { label: 'MATLAB',       monaco: 'matlab'        },
  { label: 'Scala',        monaco: 'scala'         },
  { label: 'Perl',         monaco: 'perl'          },
  { label: 'Lua',          monaco: 'lua'           },
  { label: 'Haskell',      monaco: 'haskell'       },
  { label: 'Elixir',       monaco: 'elixir'        },
  { label: 'Clojure',      monaco: 'clojure'       },
  { label: 'F#',           monaco: 'fsharp'        },
  { label: 'OCaml',        monaco: 'ocaml'         },
  { label: 'Julia',        monaco: 'julia'         },
  { label: 'Assembly',     monaco: 'asm'           },
  { label: 'Prolog',       monaco: 'prolog'        },
  { label: 'Groovy',       monaco: 'groovy'        },
  { label: 'Erlang',       monaco: 'erlang'        },
  { label: 'COBOL',        monaco: 'cobol'         },
  { label: 'Fortran',      monaco: 'fortran'       },
  { label: 'Objective-C',  monaco: 'objective-c'   },
  { label: 'VB.NET',       monaco: 'vb'            },
  { label: 'VBA',          monaco: 'vba'           },
];

// ── TipTap toolbar button ─────────────────────────────────────────────────────
function ToolbarBtn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        'px-2 py-1 rounded text-sm font-medium transition-colors duration-100',
        active
          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700',
      )}
    >
      {children}
    </button>
  );
}

// ── TipTap editor component ───────────────────────────────────────────────────
function TextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Write your notes here...' }),
    ],
    content: (() => {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return parsed?.html ?? parsed?.text ?? '';
      } catch {
        return String(content ?? '');
      }
    })(),
    onUpdate: ({ editor: e }) => {
      onChange({ html: e.getHTML(), text: e.getText() });
    },
  });

  if (!editor) return null;

  const toolbarGroups = [
    [
      { label: 'B',  title: 'Bold',          active: editor.isActive('bold'),          action: () => editor.chain().focus().toggleBold().run() },
      { label: 'I',  title: 'Italic',        active: editor.isActive('italic'),        action: () => editor.chain().focus().toggleItalic().run() },
      { label: 'U',  title: 'Underline',     active: editor.isActive('underline'),     action: () => editor.chain().focus().toggleUnderline().run() },
    ],
    [
      { label: 'H1', title: 'Heading 1',     active: editor.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: 'H2', title: 'Heading 2',     active: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    ],
    [
      { label: '• List',  title: 'Bullet List',  active: editor.isActive('bulletList'),  action: () => editor.chain().focus().toggleBulletList().run() },
      { label: '1. List', title: 'Ordered List', active: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
    ],
    [
      { label: '" "', title: 'Blockquote',   active: editor.isActive('blockquote'),    action: () => editor.chain().focus().toggleBlockquote().run() },
      { label: '</>',  title: 'Code Block',  active: editor.isActive('codeBlock'),     action: () => editor.chain().focus().toggleCodeBlock().run() },
    ],
    [
      { label: '✕ Clear', title: 'Clear formatting', active: false, action: () => editor.chain().focus().clearNodes().unsetAllMarks().run() },
    ],
  ];

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {toolbarGroups.map((group, gi) => (
          <span key={gi} className="flex items-center gap-0.5 pr-1.5 mr-1 border-r border-slate-200 dark:border-slate-700 last:border-0 last:pr-0 last:mr-0">
            {group.map((btn) => (
              <ToolbarBtn key={btn.label} active={btn.active} onClick={btn.action} title={btn.title}>
                {btn.label}
              </ToolbarBtn>
            ))}
          </span>
        ))}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[300px] px-4 py-3',
          'prose prose-sm dark:prose-invert max-w-none',
          'text-slate-900 dark:text-slate-100',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
        )}
      />
    </div>
  );
}

// ── Quiz editor ───────────────────────────────────────────────────────────────
function QuizEditor({ questions, onChange }) {
  const [expanded, setExpanded] = useState(null);

  const addQuestion = () => {
    if (questions.length >= 20) return;
    onChange([...questions, { question: '', answer: '' }]);
  };

  const updateQ = (idx, field, value) => {
    const updated = questions.map((q, i) => i === idx ? { ...q, [field]: value } : q);
    onChange(updated);
  };

  const removeQ = (idx) => {
    if (questions.length <= 1) return;
    onChange(questions.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Input pairs */}
      {questions.map((q, idx) => (
        <div key={idx} className="flex flex-col gap-2 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Question {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeQ(idx)}
              disabled={questions.length <= 1}
              className="text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none"
              aria-label="Remove question"
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={q.question}
            onChange={(e) => updateQ(idx, 'question', e.target.value)}
            placeholder="Enter question..."
            className="w-full text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
          <textarea
            value={q.answer}
            onChange={(e) => updateQ(idx, 'answer', e.target.value)}
            placeholder="Enter answer..."
            rows={2}
            className="w-full text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
        </div>
      ))}

      {/* Add question */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addQuestion}
        disabled={questions.length >= 20}
      >
        + Add Question ({questions.length}/20)
      </Button>

      {/* Preview accordion */}
      {questions.some((q) => q.question) && (
        <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Preview
          </p>
          {questions.filter((q) => q.question).map((q, idx) => (
            <div key={idx} className="mb-2 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Q: {q.question}</span>
                <span className="text-slate-400">{expanded === idx ? '▲' : '▼'}</span>
              </button>
              {expanded === idx && q.answer && (
                <div className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/30 border-t border-slate-200 dark:border-slate-700">
                  A: {q.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 10 || trimmed.length > 30) {
      setInput('');
      return;
    }
    onChange([...tags, trimmed]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 items-center min-h-[36px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-400/50">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            #{tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors leading-none">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length < 10 ? 'Add tag + Enter' : 'Max 10 tags'}
          disabled={tags.length >= 10}
          className="flex-1 min-w-[100px] text-xs outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>
      <p className="text-[10px] text-slate-400">{tags.length}/10 tags · max 30 chars each</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NoteEditor (main component)
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'TEXT', label: '📝 Text'  },
  { id: 'CODE', label: '💻 Code'  },
  { id: 'QUIZ', label: '🧠 Quiz'  },
];

function getInitialContent(note) {
  if (!note) return { TEXT: { html: '', text: '' }, CODE: { code: '', language: 'JavaScript' }, QUIZ: { questions: [{ question: '', answer: '' }] } };
  try {
    const parsed = typeof note.content === 'string' ? JSON.parse(note.content) : (note.content ?? {});
    if (note.type === 'CODE') return { TEXT: { html: '', text: '' }, CODE: { code: parsed.code ?? '', language: note.language ?? 'JavaScript' }, QUIZ: { questions: [{ question: '', answer: '' }] } };
    if (note.type === 'QUIZ') return { TEXT: { html: '', text: '' }, CODE: { code: '', language: 'JavaScript' }, QUIZ: { questions: parsed.questions ?? [{ question: '', answer: '' }] } };
    return { TEXT: parsed, CODE: { code: '', language: 'JavaScript' }, QUIZ: { questions: [{ question: '', answer: '' }] } };
  } catch {
    return { TEXT: { html: '', text: '' }, CODE: { code: '', language: 'JavaScript' }, QUIZ: { questions: [{ question: '', answer: '' }] } };
  }
}

export default function NoteEditor({ note, defaults = {}, onSave, onClose, isOpen }) {
  const { isDark } = useTheme();

  const [activeTab,   setActiveTab]   = useState(note?.type ?? defaults?.type ?? 'TEXT');
  const [title,       setTitle]       = useState(note?.title ?? '');
  const [content,     setContent]     = useState(() => getInitialContent(note));
  const [tags,        setTags]        = useState(note?.tags ?? []);
  const [linkVideo,   setLinkVideo]   = useState(!!(note?.linkedVideoId));
  const [videoId,     setVideoId]     = useState(note?.linkedVideoId ?? defaults?.videoId ?? '');
  const [isLoading,   setIsLoading]   = useState(false);
  const [isDirty,     setIsDirty]     = useState(false);

  useEffect(() => { setIsDirty(true); }, [title, content, tags, activeTab, linkVideo, videoId]);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required.'); return; }

    let contentPayload;
    if (activeTab === 'TEXT') {
      contentPayload = JSON.stringify(content.TEXT);
    } else if (activeTab === 'CODE') {
      contentPayload = JSON.stringify({ code: content.CODE.code });
    } else {
      contentPayload = JSON.stringify({ questions: content.QUIZ.questions });
    }

    const body = {
      type:         activeTab,
      title:        title.trim(),
      content:      contentPayload,
      language:     activeTab === 'CODE' ? content.CODE.language : undefined,
      tags,
      linkedVideoId: linkVideo && videoId ? videoId : undefined,
      playlistId:   defaults?.playlistId,
    };

    setIsLoading(true);
    try {
      if (note?.id) {
        await patch(`/notes/${note.id}`, body);
        toast.success('Note updated.');
      } else {
        await post('/notes', body);
        toast.success('Note saved!');
      }
      setIsDirty(false);
      onSave?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save note.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isDirty && title) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    onClose?.();
  };

  const monacoLang = LANGUAGES.find((l) => l.label === content.CODE.language)?.monaco ?? 'javascript';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={note ? 'Edit Note' : 'New Note'} size="xl" closeOnBackdrop={false}>
      <div className="flex flex-col gap-4">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 text-sm font-medium py-1.5 rounded-lg transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Note title..."
            className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
          <p className="text-[10px] text-slate-400 text-right">{title.length}/200</p>
        </div>

        {/* Content area */}
        {activeTab === 'TEXT' && (
          <TextEditor
            content={note?.type === 'TEXT' ? note.content : ''}
            onChange={(val) => setContent((p) => ({ ...p, TEXT: val }))}
          />
        )}

        {activeTab === 'CODE' && (
          <div className="flex flex-col gap-3">
            {/* Language dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
              <select
                value={content.CODE.language}
                onChange={(e) => setContent((p) => ({ ...p, CODE: { ...p.CODE, language: e.target.value } }))}
                className="w-full sm:w-48 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.label} value={l.label}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Monaco */}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <MonacoEditor
                height="400px"
                language={monacoLang}
                theme={isDark ? 'vs-dark' : 'vs'}
                value={content.CODE.code}
                onChange={(val) => setContent((p) => ({ ...p, CODE: { ...p.CODE, code: val ?? '' } }))}
                options={{
                  minimap:          { enabled: false },
                  fontSize:         13,
                  lineNumbers:      'on',
                  scrollBeyondLastLine: false,
                  wordWrap:         'on',
                  tabSize:          2,
                  automaticLayout:  true,
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'QUIZ' && (
          <QuizEditor
            questions={content.QUIZ.questions}
            onChange={(qs) => setContent((p) => ({ ...p, QUIZ: { questions: qs } }))}
          />
        )}

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        {/* Link to video */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={linkVideo}
              onChange={(e) => setLinkVideo(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Link to a YouTube video
            </span>
          </label>
          {linkVideo && (
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="YouTube video ID (e.g. dQw4w9WgXcQ)"
              className="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isLoading}>
            {note ? 'Save Changes' : 'Save Note'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
