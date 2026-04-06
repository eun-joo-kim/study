import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronRight, FolderOpen, MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/lib/index';
import { PROJECT_EMOJIS, formatDate } from '@/lib/index';
import { springPresets } from '@/lib/motion';

interface Props {
  projects: Project[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, emoji: string, desc: string) => void;
  onUpdate: (id: string, changes: Partial<Pick<Project, 'name' | 'emoji' | 'description'>>) => void;
  onDelete: (id: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Sidebar({
  projects, activeProjectId, onSelect, onCreate, onUpdate, onDelete, darkMode, onToggleDark,
}: Props) {
  const [showNew, setShowNew] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">N</div>
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">memozzang</span>
        </div>
      </div>

      {/* New Project */}
      <div className="px-3 mb-2">
        <Button onClick={() => setShowNew(true)} variant="ghost" size="sm"
          className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground">
          <Plus size={13} /> 새 프로젝트
        </Button>
      </div>

      {/* Project List */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          프로젝트 ({projects.length})
        </p>
        <AnimatePresence initial={false}>
          {projects.map(p => (
            <motion.div key={p.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              transition={springPresets.snappy}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                activeProjectId === p.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
              onClick={() => onSelect(p.id)}
            >
              <span className="text-base shrink-0">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.notes.length}개 메모</p>
              </div>
              {activeProjectId === p.id && <ChevronRight size={12} className="text-primary shrink-0" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity hover:bg-muted">
                    <MoreHorizontal size={13} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs w-36">
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditingProject(p); }} className="gap-2">
                    <Pencil size={12} /> 이름 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                    className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 size={12} /> 삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
        </AnimatePresence>

        {projects.length === 0 && (
          <div className="px-3 py-6 text-center">
            <FolderOpen size={24} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">프로젝트가 없습니다</p>
          </div>
        )}
      </nav>

      {/* Dark Mode */}
      <div className="p-3 border-t border-sidebar-border">
        <button onClick={onToggleDark}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <span>{darkMode ? '☀️' : '🌙'}</span>
          <span>{darkMode ? '라이트 모드' : '다크 모드'}</span>
        </button>
      </div>

      {/* New Project Dialog */}
      <ProjectDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onConfirm={(name, emoji, desc) => { onCreate(name, emoji, desc); setShowNew(false); }}
      />

      {/* Edit Project Dialog */}
      <ProjectDialog
        open={!!editingProject}
        initial={editingProject ?? undefined}
        onClose={() => setEditingProject(null)}
        onConfirm={(name, emoji, desc) => {
          if (editingProject) onUpdate(editingProject.id, { name, emoji, description: desc });
          setEditingProject(null);
        }}
      />
    </aside>
  );
}

// ── Project Create/Edit Dialog ──────────────────────────────────────────────
interface DialogProps {
  open: boolean;
  initial?: Project;
  onClose: () => void;
  onConfirm: (name: string, emoji: string, desc: string) => void;
}
function ProjectDialog({ open, initial, onClose, onConfirm }: DialogProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🤖');
  const [desc, setDesc] = useState(initial?.description ?? '');

  function handleOpen(v: boolean) {
    if (v) { setName(initial?.name ?? ''); setEmoji(initial?.emoji ?? '🤖'); setDesc(initial?.description ?? ''); }
    if (!v) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{initial ? '프로젝트 수정' : '새 프로젝트 만들기'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Emoji */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">아이콘</p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-8 h-8 text-lg rounded-lg transition-all ${emoji === e ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          {/* Name */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">프로젝트 이름 *</p>
            <div className="flex gap-2 items-center">
              <span className="text-xl">{emoji}</span>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="예: AI 에이전트 설계"
                className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim(), emoji, desc)} />
            </div>
          </div>
          {/* Desc */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">설명 (선택)</p>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="프로젝트에 대한 간략한 설명"
              className="h-8 text-sm" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">취소</Button>
          <Button size="sm" onClick={() => name.trim() && onConfirm(name.trim(), emoji, desc)} disabled={!name.trim()} className="text-xs">
            {initial ? '저장' : '만들기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
