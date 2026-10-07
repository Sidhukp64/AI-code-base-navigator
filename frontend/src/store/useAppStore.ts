import { create } from 'zustand';
import type { Project, FileContent, ChatMessage, AppMode } from '../types';

interface AppStore {
  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // All projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;

  // File viewer
  selectedFile: FileContent | null;
  setSelectedFile: (file: FileContent | null) => void;
  highlightLines: { start: number; end: number } | null;
  setHighlightLines: (lines: { start: number; end: number } | null) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  chatLoading: boolean;
  setChatLoading: (loading: boolean) => void;

  // Mode toggle
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project, chatMessages: [], selectedFile: null }),

  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
  highlightLines: null,
  setHighlightLines: (lines) => set({ highlightLines: lines }),

  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),
  chatLoading: false,
  setChatLoading: (loading) => set({ chatLoading: loading }),

  appMode: 'developer',
  setAppMode: (mode) => set({ appMode: mode }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));
