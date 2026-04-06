import { useState, useEffect, useCallback } from 'react';
import type { Project, Note } from '@/lib/index';
import { generateId, SAMPLE_PROJECT } from '@/lib/index';

const STORAGE_KEY = 'notepad_projects_v2';

function load(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch (_e) { /* ignore */ }
  const initial = [SAMPLE_PROJECT];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function persist(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(load);

  useEffect(() => { persist(projects); }, [projects]);

  // ── Project CRUD ────────────────────────────────────────────────
  const createProject = useCallback((name: string, emoji: string, description: string): Project => {
    const now = Date.now();
    const p: Project = { id: generateId(), name, emoji, description, notes: [], createdAt: now, updatedAt: now };
    setProjects(prev => [p, ...prev]);
    return p;
  }, []);

  const updateProject = useCallback((id: string, changes: Partial<Pick<Project, 'name' | 'emoji' | 'description'>>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...changes, updatedAt: Date.now() } : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Note CRUD (within a project) ────────────────────────────────
  const createNote = useCallback((projectId: string, title?: string): Note => {
    const now = Date.now();
    const note: Note = { id: generateId(), title: title ?? '새 메모', content: '', order: 9999, createdAt: now, updatedAt: now };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const notes = [...p.notes, { ...note, order: p.notes.length }];
        return { ...p, notes, updatedAt: now };
      })
    );
    return note;
  }, []);

  const updateNote = useCallback((projectId: string, noteId: string, changes: Partial<Note>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          updatedAt: Date.now(),
          notes: p.notes.map(n => n.id === noteId ? { ...n, ...changes, updatedAt: Date.now() } : n),
        };
      })
    );
  }, []);

  const deleteNote = useCallback((projectId: string, noteId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const notes = p.notes.filter(n => n.id !== noteId).map((n, i) => ({ ...n, order: i }));
        return { ...p, notes, updatedAt: Date.now() };
      })
    );
  }, []);

  const reorderNote = useCallback((projectId: string, noteId: string, direction: 'up' | 'down') => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const sorted = [...p.notes].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(n => n.id === noteId);
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= sorted.length) return p;
        const notes = sorted.map((n, i) => {
          if (i === idx) return { ...n, order: swap };
          if (i === swap) return { ...n, order: idx };
          return n;
        });
        return { ...p, notes, updatedAt: Date.now() };
      })
    );
  }, []);

  const getProject = useCallback((id: string) => projects.find(p => p.id === id), [projects]);

  const getSortedNotes = useCallback((projectId: string): Note[] => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return [];
    return [...p.notes].sort((a, b) => a.order - b.order);
  }, [projects]);

  return { projects, createProject, updateProject, deleteProject, createNote, updateNote, deleteNote, reorderNote, getProject, getSortedNotes };
}
