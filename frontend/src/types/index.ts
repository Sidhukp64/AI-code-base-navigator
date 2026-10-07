// Global TypeScript types for AI Codebase Navigator

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  language?: string;
  size?: number;
  children?: FileNode[];
}

export interface LanguageStat {
  language: string;
  file_count: number;
  percentage: number;
}

export interface ProjectStats {
  total_files: number;
  total_lines: number;
  languages: LanguageStat[];
  functions: number;
  classes: number;
  api_endpoints: number;
  database_files: number;
  config_files: number;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
  last_analyzed: string;
  stats: ProjectStats;
  ai_summary?: string;
  source: 'upload' | 'github' | 'demo';
  github_url?: string;
  file_tree: FileNode;
  chunks_indexed: number;
}

export interface FileContent {
  path: string;
  language: string;
  content: string;
  lines: number;
  size: number;
}

export interface Citation {
  file_path: string;
  start_line: number;
  end_line: number;
  preview: string;
}

export interface FlowNode {
  id: string;
  label: string;
  path: string;
  type: string;
}

export interface FlowEdge {
  from: string;
  to: string;
}

export interface FlowDiagram {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  flow_diagram?: FlowDiagram;
  timestamp: string;
  mode: string;
}

export interface SearchResult {
  file_path: string;
  line_number: number;
  line_content: string;
  context: string;
  language: string;
  explanation?: string;
}

export interface FindResult {
  file_path: string;
  start_line: number;
  end_line: number;
  description: string;
  relevance: number;
  preview?: string;
}

export interface ModuleInfo {
  name: string;
  icon: string;
  files: string[];
  file_count: number;
  description: string;
}

export type AppMode = 'simple' | 'developer';
