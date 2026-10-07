import axios from 'axios';
import type {
  Project, FileContent, ChatMessage, SearchResult,
  FindResult, ModuleInfo, FlowDiagram, Citation
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const res = await api.get('/projects/');
    return res.data.projects;
  },

  loadDemo: async (): Promise<Project> => {
    const res = await api.get('/projects/demo');
    return res.data.project;
  },

  upload: async (file: File, name?: string): Promise<Project> => {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const res = await api.post('/projects/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.project;
  },

  get: async (id: string): Promise<Project> => {
    const res = await api.get(`/projects/${id}`);
    return res.data.project;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getFile: async (projectId: string, filePath: string): Promise<FileContent> => {
    const res = await api.get(`/projects/${projectId}/file`, {
      params: { path: filePath },
    });
    return res.data.file;
  },
};

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  flow_diagram?: FlowDiagram;
  mode: string;
  timestamp: string;
}

export const chatApi = {
  send: async (
    projectId: string,
    message: string,
    mode: string = 'developer',
    history?: Array<{ role: string; content: string }>
  ): Promise<ChatResponse> => {
    const res = await api.post(`/chat/${projectId}`, { message, mode, history });
    return res.data;
  },

  getSuggestions: async (projectId: string): Promise<string[]> => {
    const res = await api.get(`/chat/${projectId}/suggestions`);
    return res.data.suggestions;
  },
};

// ── Search ────────────────────────────────────────────────────────────────────

export const searchApi = {
  search: async (projectId: string, query: string): Promise<SearchResult[]> => {
    const res = await api.get(`/search/${projectId}`, { params: { q: query } });
    return res.data.results;
  },

  findCategory: async (projectId: string, category: string): Promise<{
    category: string;
    description: string;
    results: FindResult[];
  }> => {
    const res = await api.get(`/search/${projectId}/find/${category}`);
    return res.data;
  },
};

// ── GitHub ────────────────────────────────────────────────────────────────────

export const githubApi = {
  validate: async (url: string): Promise<{ valid: boolean; owner?: string; repo?: string; error?: string }> => {
    const res = await api.get('/github/validate', { params: { url } });
    return res.data;
  },

  import: async (url: string): Promise<Project> => {
    const res = await api.post('/github/import', { url });
    return res.data.project;
  },
};

// ── Overview ──────────────────────────────────────────────────────────────────

export const overviewApi = {
  get: async (projectId: string): Promise<{
    project: Project;
    modules: ModuleInfo[];
    ai_summary: string;
  }> => {
    const res = await api.get(`/overview/${projectId}`);
    return res.data;
  },
};

export default api;
