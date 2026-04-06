import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronUp, ChevronDown, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Note, Project } from '@/lib/index';
import { formatDate, countChars } from '@/lib/index';
import { springPresets } from '@/lib/motion';

interface Props {
  project: Project;
  notes: Note[];
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onExport: () => void;
}

export default function NoteList({ project, notes, selectedNoteId, onSelect, onNew, onDelete, onReorder, onExport }: Props) {
  return (
    <div className="w-64 shrink-0 flex flex-col h-screen border-r border-border bg-background">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xl">{project.emoji}</span>
          <h2 className="text-sm font-semibold text-foreground truncate flex-1">{project.name}</h2>
        </div>
        {project.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 pl-7">{project.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 pl-7">
          <span className="text-[10px] text-muted-foreground">{notes.length}개 메모</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">{countChars(notes).toLocaleString()}자</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 px-3 py-2 shrink-0">
        <Button onClick={onNew} size="sm" className="flex-1 h-7 text-xs gap-1.5">
          <Plus size={12} /> 새 메모
        </Button>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onExport} variant="outline" size="icon" className="h-7 w-7 shrink-0" disabled={notes.length === 0}>
                <FileDown size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">보고서 PDF 출력</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Note Items */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        <AnimatePresence initial={false}>
          {notes.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="pt-10 text-center px-4">
              <FileText size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">메모가 없습니다.</p>
              <button onClick={onNew} className="mt-2 text-xs text-primary hover:underline">첫 메모 작성 →</button>
            </motion.div>
          )}
          {notes.map((note, idx) => (
            <motion.div key={note.id}
              layout
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={springPresets.snappy}
              onClick={() => onSelect(note.id)}
              className={`group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                selectedNoteId === note.id
                  ? 'bg-primary/8 border border-primary/20'
                  : 'border border-transparent hover:bg-muted/60'
              }`}
            >
              {/* Order badge */}
              <span className={`text-[10px] font-mono mt-0.5 w-4 shrink-0 ${selectedNoteId === note.id ? 'text-primary' : 'text-muted-foreground/50'}`}>
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${selectedNoteId === note.id ? 'text-primary' : 'text-foreground'}`}>
                  {note.title || '제목 없음'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(note.updatedAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={e => { e.stopPropagation(); onReorder(note.id, 'up'); }}
                  disabled={idx === 0}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                  <ChevronUp size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); onReorder(note.id, 'down'); }}
                  disabled={idx === notes.length - 1}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                  <ChevronDown size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(note.id); }}
                  className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
