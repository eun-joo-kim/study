import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Note, Project } from '@/lib/index';
import { formatFullDate } from '@/lib/index';
import { springPresets } from '@/lib/motion';

interface Props {
  project: Project;
  notes: Note[];
  onClose: () => void;
}

/** Minimal Markdown → HTML renderer (headings, bold, italic, code, lists, hr) */
function renderMarkdown(raw: string): string {
  let html = raw
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Checkboxes
    .replace(/^- \[x\] (.+)$/gm, '<li class="checked">✅ $1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="unchecked">☐ $1</li>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs: split by double newlines, wrap non-block elements
  const blocks = html.split(/\n\n+/);
  html = blocks.map(b => {
    const trimmed = b.trim();
    if (!trimmed) return '';
    if (/^<(h[1-6]|ul|ol|li|blockquote|hr|pre|code)/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');

  return html;
}

export default function ReportViewer({ project, notes, onClose }: Props) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  const totalChars = notes.reduce((s, n) => s + n.content.length, 0);

  return (
    <>
      {/* ── Screen View ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springPresets.gentle}
        className="fixed inset-0 z-50 bg-background/90 flex flex-col print:hidden"
      >
        {/* Topbar */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-muted-foreground" />
            <span className="text-sm font-semibold">{project.emoji} {project.name}</span>
            <Badge variant="secondary" className="text-[10px]">{notes.length}개 섹션 · {totalChars.toLocaleString()}자</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} size="sm" className="gap-1.5 text-xs h-8">
              <Printer size={13} /> PDF 출력
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Scrollable Report Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30 py-10 px-6">
          <ReportBody ref={printAreaRef} project={project} notes={notes} />
        </div>
      </motion.div>

      {/* ── Print-only styles ──────────────────────────────────── */}
      <style>{`
        @media print {
          body > *:not(.print-only) { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>

      {/* Print area (hidden on screen, shown on print) */}
      <div className="print-only hidden">
        <ReportBody project={project} notes={notes} />
      </div>
    </>
  );
}

// ── Report Body (shared between screen preview and print) ──────────────────
import React from 'react';

const ReportBody = React.forwardRef<HTMLDivElement, { project: Project; notes: Note[] }>(
  ({ project, notes }, ref) => {
    const today = formatFullDate(Date.now());

    return (
      <div
        ref={ref}
        className="report-body mx-auto max-w-[720px] bg-background rounded-2xl shadow-sm border border-border p-12 text-sm leading-relaxed"
        style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
      >
        {/* ── Cover ── */}
        <div className="mb-12 pb-10 border-b-2 border-foreground/10">
          <div className="text-4xl mb-3">{project.emoji}</div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-base text-muted-foreground mb-4">{project.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{today} 기준 · {notes.length}개 섹션</p>
        </div>

        {/* ── Table of Contents ── */}
        {notes.length > 1 && (
          <div className="mb-10 p-5 bg-muted/50 rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">목차</p>
            <ol className="space-y-1.5">
              {notes.map((n, i) => (
                <li key={n.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-mono text-xs w-5">{i + 1}.</span>
                  <span className="text-foreground">{n.title || '제목 없음'}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Note Sections ── */}
        <div className="space-y-10">
          {notes.map((note, idx) => (
            <section key={note.id}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xl font-bold text-foreground">{note.title || '제목 없음'}</h2>
              </div>

              {/* Markdown Content */}
              <div
                className="prose-report"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
              />

              {/* Section Footer */}
              {idx < notes.length - 1 && (
                <div className="mt-10 border-b border-border/60" />
              )}
            </section>
          ))}
        </div>

        {/* ── Document Footer ── */}
        <div className="mt-14 pt-6 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{project.emoji} {project.name}</span>
          <span>{today}</span>
        </div>
      </div>
    );
  }
);
ReportBody.displayName = 'ReportBody';
