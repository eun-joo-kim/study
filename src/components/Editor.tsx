import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Note } from '@/lib/index';
import { formatDate } from '@/lib/index';
import { springPresets } from '@/lib/motion';

interface Props {
  note: Note;
  onUpdate: (noteId: string, changes: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
  onClose: () => void;
}

export default function Editor({ note, onUpdate, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saved, setSaved] = useState(false);

  // Reset when switching notes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setSaved(false);
  }, [note.id]);

  // Auto-save debounce
  useEffect(() => {
    if (title === note.title && content === note.content) return;
    const t = setTimeout(() => {
      onUpdate(note.id, { title, content });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 500);
    return () => clearTimeout(t);
  }, [title, content, note.id, note.title, note.content, onUpdate]);

  return (
    <motion.div
      key={note.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springPresets.gentle}
      className="flex flex-col h-screen bg-background"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <Check size={11} className="text-green-500" /> 저장됨
            </motion.span>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => { onDelete(note.id); onClose(); }}>
            <Trash2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
            onClick={onClose}>
            <X size={13} />
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full text-[22px] font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 mb-5 leading-snug"
        />

        {/* Divider */}
        <div className="h-px bg-border mb-5" />

        {/* Content */}
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`내용을 작성하세요...\n\n마크다운 문법을 지원합니다.\n## 제목   **굵게**   - 목록   \`코드\``}
          className="min-h-[calc(100vh-240px)] text-[14px] leading-[1.85] border-none bg-transparent resize-none focus-visible:ring-0 p-0 text-foreground placeholder:text-muted-foreground/30"
        />
      </div>

      {/* Footer */}
      <div className="px-8 py-2.5 border-t border-border shrink-0 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>생성 {formatDate(note.createdAt)}</span>
        <span>·</span>
        <span>수정 {formatDate(note.updatedAt)}</span>
        <span>·</span>
        <span>{content.length.toLocaleString()}자</span>
      </div>
    </motion.div>
  );
}
