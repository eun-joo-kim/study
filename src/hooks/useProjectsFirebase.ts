import { useState, useEffect, useCallback } from 'react';
import type { Project, Note } from '@/lib/index';
import { generateId, SAMPLE_PROJECT } from '@/lib/index';
import { db, auth, initializeAuth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

const STORAGE_KEY = 'notepad_projects_v2';
const FIRESTORE_COLLECTION = 'projects';

// Fallback localStorage functions
function loadFromStorage(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Project[];
    }
  } catch (_e) { /* ignore */ }
  const initial = [SAMPLE_PROJECT];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function persistToStorage(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadFromStorage);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Initialize Firebase auth and sync with Firestore
  useEffect(() => {
    const setupFirebase = async () => {
      try {
        setIsLoading(true);
        await initializeAuth();

        // Subscribe to projects collection for current user
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const q = query(
          collection(db, FIRESTORE_COLLECTION),
          where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const firestoreProjects: Project[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as any;
              firestoreProjects.push({
                id: data.id,
                name: data.name,
                emoji: data.emoji,
                description: data.description,
                notes: data.notes || [],
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              });
            });
            setProjects(firestoreProjects);
            persistToStorage(firestoreProjects);
            setSyncError(null);
            setIsLoading(false);
          },
          (error) => {
            console.error('Firestore sync error:', error);
            setSyncError('Failed to sync with Firebase');
            setIsLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Firebase setup error:', error);
        setSyncError('Failed to initialize Firebase');
        setIsLoading(false);
      }
    };

    const unsubscribePromise = setupFirebase();
    return () => {
      unsubscribePromise.then((unsub) => unsub?.());
    };
  }, []);

  // Persist changes to Firestore
  const syncToFirestore = useCallback(async (updatedProjects: Project[]) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      for (const project of updatedProjects) {
        const docRef = doc(db, FIRESTORE_COLLECTION, project.id);
        await updateDoc(docRef, {
          id: project.id,
          name: project.name,
          emoji: project.emoji,
          description: project.description,
          notes: project.notes,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          userId,
        });
      }
      setSyncError(null);
    } catch (error) {
      console.error('Firestore sync error:', error);
      setSyncError('Failed to save to Firebase');
    }
  }, []);

  // ── Project CRUD ────────────────────────────────────────────────
  const createProject = useCallback((name: string, emoji: string, description: string): Project => {
    const now = Date.now();
    const p: Project = { id: generateId(), name, emoji, description, notes: [], createdAt: now, updatedAt: now };

    setProjects((prev) => {
      const updated = [p, ...prev];
      persistToStorage(updated);
      return updated;
    });

    // Add to Firestore
    const userId = auth.currentUser?.uid;
    if (userId) {
      addDoc(collection(db, FIRESTORE_COLLECTION), {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        description: p.description,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        userId,
      }).catch((error) => {
        console.error('Error creating project in Firestore:', error);
        setSyncError('Failed to create project');
      });
    }

    return p;
  }, []);

  const updateProject = useCallback((id: string, changes: Partial<Pick<Project, 'name' | 'emoji' | 'description'>>) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...changes, updatedAt: Date.now() } : p
      );
      persistToStorage(updated);
      syncToFirestore(updated);
      return updated;
    });
  }, [syncToFirestore]);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistToStorage(updated);
      return updated;
    });

    // Delete from Firestore
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    deleteDoc(docRef).catch((error) => {
      console.error('Error deleting project from Firestore:', error);
      setSyncError('Failed to delete project');
    });
  }, []);

  // ── Note CRUD (within a project) ────────────────────────────────
  const createNote = useCallback((projectId: string, title?: string): Note => {
    const now = Date.now();
    const note: Note = { id: generateId(), title: title ?? '새 메모', content: '', order: 9999, createdAt: now, updatedAt: now };

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const notes = [...p.notes, { ...note, order: p.notes.length }];
        return { ...p, notes, updatedAt: now };
      });
      persistToStorage(updated);
      syncToFirestore(updated);
      return updated;
    });

    return note;
  }, [syncToFirestore]);

  const updateNote = useCallback((projectId: string, noteId: string, changes: Partial<Note>) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          updatedAt: Date.now(),
          notes: p.notes.map((n) => (n.id === noteId ? { ...n, ...changes, updatedAt: Date.now() } : n)),
        };
      });
      persistToStorage(updated);
      syncToFirestore(updated);
      return updated;
    });
  }, [syncToFirestore]);

  const deleteNote = useCallback((projectId: string, noteId: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const notes = p.notes.filter((n) => n.id !== noteId).map((n, i) => ({ ...n, order: i }));
        return { ...p, notes, updatedAt: Date.now() };
      });
      persistToStorage(updated);
      syncToFirestore(updated);
      return updated;
    });
  }, [syncToFirestore]);

  const reorderNote = useCallback((projectId: string, noteId: string, direction: 'up' | 'down') => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const sorted = [...p.notes].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((n) => n.id === noteId);
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= sorted.length) return p;
        const notes = sorted.map((n, i) => {
          if (i === idx) return { ...n, order: swap };
          if (i === swap) return { ...n, order: idx };
          return n;
        });
        return { ...p, notes, updatedAt: Date.now() };
      });
      persistToStorage(updated);
      syncToFirestore(updated);
      return updated;
    });
  }, [syncToFirestore]);

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  const getSortedNotes = useCallback((projectId: string): Note[] => {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return [];
    return [...p.notes].sort((a, b) => a.order - b.order);
  }, [projects]);

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
    createNote,
    updateNote,
    deleteNote,
    reorderNote,
    getProject,
    getSortedNotes,
    isLoading,
    syncError,
  };
}
