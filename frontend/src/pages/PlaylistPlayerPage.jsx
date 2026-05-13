import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer.jsx';
import NoteEditor from '../components/NoteEditor.jsx';
import NoteCard from '../components/NoteCard.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import toast from '../components/ui/Toast.jsx';
import usePlaylist from '../hooks/usePlaylist.js';
import useNotes from '../hooks/useNotes.js';
import { cn, formatDuration, formatViewCount, truncate } from '../lib/utils.js';

const GripIcon = () => (
  <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="6" r="1.4" />
    <circle cx="15" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" />
    <circle cx="15" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" />
    <circle cx="15" cy="18" r="1.4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CircleIcon = () => (
  <svg className="h-4 w-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  </svg>
);

function toPlayerVideo(video) {
  if (!video) return null;

  return {
    ...video,
    youtubeId: video.youtubeId ?? video.youtubeVideoId,
    playlistVideoId: video.id,
  };
}

function normalizeVideos(playlist) {
  return [...(playlist?.videos ?? [])]
    .map((video, index) => ({
      ...video,
      youtubeVideoId: video.youtubeVideoId ?? video.youtubeId,
      thumbnailUrl: video.thumbnailUrl ?? video.thumbnail,
      sortOrder: video.sortOrder ?? index,
    }))
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

function VideoQueueItem({
  video,
  index,
  isActive,
  onSelect,
  dragIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}) {
  return (
    <button
      type="button"
      draggable
      onClick={onSelect}
      onDragStart={(event) => onDragStart(event, index)}
      onDragOver={(event) => onDragOver(event, index)}
      onDrop={(event) => onDrop(event, index)}
      onDragEnd={onDragEnd}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition',
        isActive
          ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
          : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60',
        dragIndex === index && 'opacity-40',
        dragOverIndex === index && dragIndex !== index && 'border-indigo-400',
      )}
    >
      <span className="cursor-grab active:cursor-grabbing">
        <GripIcon />
      </span>

      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-11 w-16 rounded-lg object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
          ▶
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className={cn('line-clamp-2 text-xs font-semibold', isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100')}>
          {video.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{formatDuration(video.durationSeconds ?? 0)}</span>
          {video.channelTitle && <span className="truncate">{truncate(video.channelTitle, 26)}</span>}
        </div>
      </div>

      <span className="shrink-0">{video.isCompleted ? <CheckCircleIcon /> : <CircleIcon />}</span>
    </button>
  );
}

export default function PlaylistPlayerPage() {
  const { id: playlistId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchPlaylists, reorderVideos } = usePlaylist(false);
  const { notes, fetchNotes, deleteNote } = useNotes({}, false);

  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideoId, setCurrentVideoId] = useState(() => searchParams.get('video') ?? '');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteDefaults, setNoteDefaults] = useState({});
  const [deleteNoteId, setDeleteNoteId] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const saveOrderRef = useRef(false);

  const loadPlaylist = useCallback(async () => {
    try {
      setIsLoading(true);
      const allPlaylists = await fetchPlaylists();
      const selectedPlaylist = allPlaylists.find((entry) => entry.id === playlistId);

      if (!selectedPlaylist) {
        toast.error('Playlist not found.');
        setPlaylist(null);
        setVideos([]);
        return;
      }

      const sortedVideos = normalizeVideos(selectedPlaylist);
      const requestedVideoId = searchParams.get('video');
      const initialVideo = sortedVideos.find((video) => video.youtubeVideoId === requestedVideoId) ?? sortedVideos[0] ?? null;

      setPlaylist(selectedPlaylist);
      setVideos(sortedVideos);
      setCurrentVideoId(initialVideo?.youtubeVideoId ?? '');
    } catch {
      toast.error('Failed to load playlist.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlaylists, playlistId, searchParams]);

  const loadNotes = useCallback(async () => {
    if (!playlistId) return;

    try {
      setNotesLoading(true);
      await fetchNotes({ playlistId });
    } catch {
      toast.error('Failed to load notes.');
    } finally {
      setNotesLoading(false);
    }
  }, [fetchNotes, playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const currentVideo = useMemo(
    () => videos.find((video) => video.youtubeVideoId === currentVideoId) ?? videos[0] ?? null,
    [currentVideoId, videos],
  );

  useEffect(() => {
    if (!currentVideo?.youtubeVideoId) return;

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('video', currentVideo.youtubeVideoId);
      return next;
    }, { replace: true });
  }, [currentVideo?.youtubeVideoId, setSearchParams]);

  const currentIndex = videos.findIndex((video) => video.id === currentVideo?.id);
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex >= 0 ? videos[currentIndex + 1] ?? null : null;

  const playlistNotes = useMemo(
    () => notes.filter((note) => !note.linkedVideoId),
    [notes],
  );

  const videoNotes = useMemo(
    () => notes.filter((note) => note.linkedVideoId === currentVideo?.id),
    [currentVideo?.id, notes],
  );

  const completionPercent = playlist?.progressPercent ?? 0;
  const completedVideos = playlist?.completedCount ?? videos.filter((video) => video.isCompleted).length;

  const infoTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes', count: videoNotes.length },
    { id: 'transcript', label: 'Transcript' },
  ];

  const openEditor = ({ note = null, linkedToCurrentVideo = false } = {}) => {
    setEditingNote(note);
    setNoteDefaults({
      playlistId,
      ...(linkedToCurrentVideo && currentVideo ? { videoId: currentVideo.id } : {}),
    });
    setIsNoteEditorOpen(true);
  };

  const handleVideoComplete = useCallback((completedVideo) => {
    // Guard: null is passed when marking incomplete — skip
    if (!completedVideo) return;

    setVideos((previous) => previous.map((video) => (
      video.id === completedVideo.id ? { ...video, isCompleted: true } : video
    )));

    setPlaylist((previous) => {
      if (!previous) return previous;

      const uniqueCompleted = new Set([
        ...(videos.filter((video) => video.isCompleted).map((video) => video.id)),
        completedVideo.id,
      ]);
      const nextCompletedCount = uniqueCompleted.size;
      const totalVideos = previous.totalVideos || videos.length || 1;
      const nextPercent = Math.min(100, Math.round((nextCompletedCount / totalVideos) * 100));

      if (nextPercent === 100) {
        setShowCompletionModal(true);
      }

      return {
        ...previous,
        completedCount: nextCompletedCount,
        progressPercent: nextPercent,
      };
    });
  }, [videos]);

  const handleVideoIncomplete = useCallback((videoId) => {
    if (!videoId) return;
    setVideos((previous) => previous.map((video) => (
      video.id === videoId ? { ...video, isCompleted: false, completedAt: null } : video
    )));
    setPlaylist((previous) => {
      if (!previous) return previous;
      const newCompleted = videos.filter((v) => v.isCompleted && v.id !== videoId).length;
      const totalVideos = previous.totalVideos || videos.length || 1;
      const nextPercent = Math.min(100, Math.round((newCompleted / totalVideos) * 100));
      return { ...previous, completedCount: newCompleted, progressPercent: nextPercent };
    });
  }, [videos]);

  const handleDragStart = (_event, index) => {
    setDragIndex(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (event, dropIndex) => {
    event.preventDefault();

    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const reordered = [...videos];
    const [dragged] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, dragged);
    const nextVideos = reordered.map((video, index) => ({ ...video, sortOrder: index }));

    setVideos(nextVideos);
    handleDragEnd();

    if (saveOrderRef.current) return;

    saveOrderRef.current = true;
    try {
      await reorderVideos(playlistId, nextVideos.map((video) => video.id));
      toast.success('Playlist order updated.');
    } catch {
      toast.error('Failed to save new order.');
      await loadPlaylist();
    } finally {
      saveOrderRef.current = false;
    }
  };

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

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 xl:flex-row">
        <div className="space-y-4 xl:basis-[65%]">
          <Skeleton variant="rectangular" height={420} />
          <Skeleton variant="rectangular" height={260} />
        </div>
        <div className="space-y-4 xl:basis-[35%]">
          <Skeleton variant="rectangular" height={160} />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={72} />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  return (
    <>
      <NoteEditor
        isOpen={isNoteEditorOpen}
        note={editingNote}
        defaults={noteDefaults}
        onSave={() => {
          setIsNoteEditorOpen(false);
          setEditingNote(null);
          loadNotes();
        }}
        onClose={() => {
          setIsNoteEditorOpen(false);
          setEditingNote(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        title="Delete note?"
        description="This note will be removed permanently."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteNote}
      />

      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="Playlist completed"
        size="md"
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <SparkleIcon />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">You finished {playlist.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Every video in this playlist is marked complete. Keep the momentum going with another playlist.
            </p>
          </div>
          <Button className="w-full" onClick={() => setShowCompletionModal(false)}>Continue</Button>
        </div>
      </Modal>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/playlists" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Playlists</Link>
          <span>/</span>
          <span className="truncate font-medium text-slate-700 dark:text-slate-200">{playlist.name}</span>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <section className="min-w-0 xl:basis-[65%] xl:max-w-[65%]">
            <div className="space-y-5">
              {currentVideo && (
                <VideoPlayer
                  video={toPlayerVideo(currentVideo)}
                  prevVideo={toPlayerVideo(prevVideo)}
                  nextVideo={toPlayerVideo(nextVideo)}
                  isCompleted={currentVideo.isCompleted ?? false}
                  onComplete={handleVideoComplete}
                  onIncomplete={handleVideoIncomplete}
                  onPrev={() => prevVideo && setCurrentVideoId(prevVideo.youtubeVideoId)}
                  onNext={() => nextVideo && setCurrentVideoId(nextVideo.youtubeVideoId)}
                />
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <Tabs tabs={infoTabs} activeTab={activeTab} onChange={setActiveTab} className="px-4" />

                <div className="p-5">
                  {activeTab === 'overview' && currentVideo && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{currentVideo.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          {currentVideo.channelTitle && <span>{currentVideo.channelTitle}</span>}
                          {currentVideo.viewCount != null && <span>{formatViewCount(currentVideo.viewCount)} views</span>}
                          <span>{formatDuration(currentVideo.durationSeconds ?? 0)}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {currentVideo.description || 'No description is available for this video yet.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Video Notes</h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Capture notes tied to this video while you watch.
                          </p>
                        </div>
                        <Button size="sm" leftIcon={<PlusIcon />} onClick={() => openEditor({ linkedToCurrentVideo: true })}>
                          Add Note
                        </Button>
                      </div>

                      {notesLoading ? (
                        <div className="space-y-3">
                          <Skeleton variant="rectangular" height={110} />
                          <Skeleton variant="rectangular" height={110} />
                        </div>
                      ) : videoNotes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          No notes for this video yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {videoNotes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onEdit={() => openEditor({ note })}
                              onDelete={() => setDeleteNoteId(note.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'transcript' && (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Transcript stub</p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Auto-generated transcript support can plug in here later without changing the page layout.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="min-w-0 xl:basis-[35%] xl:max-w-[35%]">
            <div className="space-y-4 xl:sticky xl:top-20">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Playlist Progress</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{playlist.name}</h2>
                  </div>

                  <ProgressBar percent={completionPercent} size="md" showLabel showPercent />

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span>{completedVideos}/{playlist.totalVideos ?? videos.length} videos complete</span>
                    {playlist.category?.name && <span>{playlist.category.icon} {playlist.category.name}</span>}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Playlist Queue</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drag to reorder or click to switch videos.</p>
                </div>

                <div className="max-h-[440px] space-y-2 overflow-y-auto p-3">
                  {videos.map((video, index) => (
                    <VideoQueueItem
                      key={video.id}
                      video={video}
                      index={index}
                      isActive={video.id === currentVideo?.id}
                      onSelect={() => setCurrentVideoId(video.youtubeVideoId)}
                      dragIndex={dragIndex}
                      dragOverIndex={dragOverIndex}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Playlist Notes</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Reusable notes for the whole playlist.</p>
                  </div>
                  <Button size="sm" variant="outline" leftIcon={<PlusIcon />} onClick={() => openEditor()}>
                    Add Note
                  </Button>
                </div>

                <div className="space-y-3 p-4">
                  {notesLoading ? (
                    <>
                      <Skeleton variant="rectangular" height={96} />
                      <Skeleton variant="rectangular" height={96} />
                    </>
                  ) : playlistNotes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No playlist-level notes yet.
                    </div>
                  ) : (
                    playlistNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={() => openEditor({ note })}
                        onDelete={() => setDeleteNoteId(note.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
