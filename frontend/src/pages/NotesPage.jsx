import { useEffect, useMemo, useState } from 'react';
import NoteCard from '../components/NoteCard.jsx';
import NoteEditor from '../components/NoteEditor.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import toast from '../components/ui/Toast.jsx';
import useNotes from '../hooks/useNotes.js';

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const NotesIllustration = () => (
  <div className="relative flex h-28 w-28 items-center justify-center">
    <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-amber-100 via-pink-100 to-white dark:from-amber-950 dark:via-pink-950 dark:to-slate-950" />
    <div className="relative rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-lg dark:border-slate-700 dark:bg-slate-900/90">
      <div className="space-y-2">
        <div className="h-3 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-20 rounded-full bg-amber-200 dark:bg-amber-900" />
        <div className="h-3 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  </div>
);

function NoteSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-3 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="ml-auto h-5 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
        <Skeleton variant="text" height={14} width="100%" />
        <Skeleton variant="text" height={14} width="82%" />
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { notes, isLoading, fetchNotes, deleteNote } = useNotes({}, false);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteNoteId, setDeleteNoteId] = useState(null);

  useEffect(() => {
    fetchNotes().catch(() => {
      toast.error('Failed to load notes.');
    });
  }, [fetchNotes]);

  const counts = useMemo(() => ({
    all: notes.length,
    text: notes.filter((note) => note.type === 'TEXT').length,
    code: notes.filter((note) => note.type === 'CODE').length,
    quiz: notes.filter((note) => note.type === 'QUIZ').length,
  }), [notes]);

  const filteredNotes = useMemo(() => {
    let nextNotes = [...notes];

    if (activeTab !== 'all') {
      const typeByTab = {
        text: 'TEXT',
        code: 'CODE',
        quiz: 'QUIZ',
      };
      nextNotes = nextNotes.filter((note) => note.type === typeByTab[activeTab]);
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      nextNotes = nextNotes.filter((note) => {
        const title = note.title?.toLowerCase() ?? '';
        const tags = (note.tags ?? []).join(' ').toLowerCase();
        const rawContent = typeof note.content === 'string' ? note.content.toLowerCase() : JSON.stringify(note.content ?? {}).toLowerCase();
        return title.includes(normalizedQuery) || tags.includes(normalizedQuery) || rawContent.includes(normalizedQuery);
      });
    }

    return nextNotes.sort((left, right) => new Date(right.updatedAt ?? right.createdAt ?? 0) - new Date(left.updatedAt ?? left.createdAt ?? 0));
  }, [activeTab, notes, searchQuery]);

  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'text', label: 'Text', count: counts.text },
    { id: 'code', label: 'Code', count: counts.code },
    { id: 'quiz', label: 'Quiz', count: counts.quiz },
  ];

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;

    try {
      await deleteNote(deleteNoteId);
      toast.success('Note deleted.');
    } catch {
      toast.error('Failed to delete note.');
    } finally {
      setDeleteNoteId(null);
    }
  };

  return (
    <>
      <NoteEditor
        isOpen={isEditorOpen}
        note={editingNote}
        defaults={{}}
        onSave={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
          fetchNotes().catch(() => {});
        }}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        title="Delete note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteNote}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Notes</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Capture text notes, code snippets, and quick self-check quizzes.
            </p>
          </div>

          <Button leftIcon={<PlusIcon />} onClick={() => setIsEditorOpen(true)}>New Note</Button>
        </div>

        <div className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-5 relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <SearchIcon />
            </span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search notes by title, tag, or content"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {Array.from({ length: 8 }).map((_, index) => <NoteSkeleton key={index} />)}
          </div>
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            icon={<NotesIllustration />}
            title={searchQuery ? 'No matching notes' : 'No notes yet'}
            description={
              searchQuery
                ? 'Try a different search term or switch filters.'
                : 'Create your first note to start building a searchable study archive.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Create Note'}
            onAction={searchQuery ? () => setSearchQuery('') : () => setIsEditorOpen(true)}
            className="rounded-[28px] border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
          />
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="mb-4 break-inside-avoid">
                <NoteCard
                  note={note}
                  onEdit={() => {
                    setEditingNote(note);
                    setIsEditorOpen(true);
                  }}
                  onDelete={() => setDeleteNoteId(note.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
