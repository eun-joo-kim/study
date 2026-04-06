import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NoteList from '@/components/NoteList';
import Editor from '@/components/Editor';
import ReportViewer from '@/components/ReportViewer';
import { useProjects } from '@/hooks/useProjects';
import { springPresets } from '@/lib/motion';

export default function Home() {
  const {
    projects, createProject, updateProject, deleteProject,
    createNote, updateNote, deleteNote, reorderNote,
    getProject, getSortedNotes,
  } = useProjects();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  function toggleDark() {
    setDarkMode(p => {
      document.documentElement.classList.toggle('dark', !p);
      return !p;
    });
  }

  // Derive current project + notes
  const activeProject = activeProjectId ? getProject(activeProjectId) : null;
  const notes = useMemo(
    () => (activeProjectId ? getSortedNotes(activeProjectId) : []),
    [activeProjectId, getSortedNotes]
  );
  const selectedNote = notes.find(n => n.id === selectedNoteId) ?? null;

  function handleSelectProject(id: string) {
    setActiveProjectId(id);
    setSelectedNoteId(null);
    setShowReport(false);
  }

  function handleNewNote() {
    if (!activeProjectId) return;
    const note = createNote(activeProjectId);
    setSelectedNoteId(note.id);
    setShowReport(false);
  }

  function handleDeleteProject(id: string) {
    deleteProject(id);
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setActiveProjectId(remaining[0]?.id ?? null);
      setSelectedNoteId(null);
    }
  }

  function handleDeleteNote(noteId: string) {
    if (!activeProjectId) return;
    deleteNote(activeProjectId, noteId);
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelect={handleSelectProject}
        onCreate={createProject}
        onUpdate={updateProject}
        onDelete={handleDeleteProject}
        darkMode={darkMode}
        onToggleDark={toggleDark}
      />

      {/* Project not selected */}
      {!activeProject ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <FolderOpen size={48} className="text-muted-foreground/30 mb-4" />
          <h2 className="text-base font-semibold text-foreground mb-1">프로젝트를 선택하세요</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            왼쪽 사이드바에서 프로젝트를 선택하거나<br />새 프로젝트를 만들어보세요.
          </p>
        </div>
      ) : (
        <>
          {/* Note List Panel */}
          <NoteList
            project={activeProject}
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelect={id => { setSelectedNoteId(id); setShowReport(false); }}
            onNew={handleNewNote}
            onDelete={handleDeleteNote}
            onReorder={(id, dir) => activeProjectId && reorderNote(activeProjectId, id, dir)}
            onExport={() => setShowReport(true)}
          />

          {/* Editor / Empty */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedNote ? (
                <Editor
                  key={selectedNote.id}
                  note={selectedNote}
                  onUpdate={(noteId, changes) => activeProjectId && updateNote(activeProjectId, noteId, changes)}
                  onDelete={handleDeleteNote}
                  onClose={() => setSelectedNoteId(null)}
                />
              ) : (
                <motion.div
                  key="empty-editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springPresets.gentle}
                  className="h-full flex flex-col items-center justify-center text-center px-8"
                >
                  <div className="text-5xl mb-4 select-none">{activeProject.emoji}</div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">{activeProject.name}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
                    {notes.length === 0
                      ? '첫 번째 메모를 작성하면\n보고서로 출력할 수 있습니다.'
                      : '왼쪽에서 메모를 선택하거나 새 메모를 추가하세요.'}
                  </p>
                  <button
                    onClick={handleNewNote}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    + 새 메모 작성
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Report Viewer (full-screen overlay) */}
          <AnimatePresence>
            {showReport && activeProject && (
              <ReportViewer
                project={activeProject}
                notes={notes}
                onClose={() => setShowReport(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
