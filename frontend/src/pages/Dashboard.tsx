import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Upload, Github, FolderOpen, Clock, FileCode,
  Loader2, Zap, Trash2, Code2, ExternalLink, ChevronRight
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/useAppStore';
import { projectsApi, githubApi } from '../api/client';
import type { Project } from '../types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const LANG_COLORS: Record<string, string> = {
  Python: '#3b82f6',
  JavaScript: '#f59e0b',
  TypeScript: '#60a5fa',
  Java: '#f97316',
  'C++': '#a855f7',
  HTML: '#ef4444',
  CSS: '#ec4899',
  SQL: '#14b8a6',
};

// ── Upload Modal ─────────────────────────────────────────────────────────────

const UploadModal: React.FC<{ onClose: () => void; onSuccess: (p: Project) => void }> = ({ onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [projectName, setProjectName] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const project = await projectsApi.upload(file, projectName || file.name.replace('.zip', ''));
      toast.success(`"${project.name}" analyzed successfully!`);
      onSuccess(project);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [projectName, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in">
        <h2 className="text-lg font-bold text-white mb-1">Upload Repository</h2>
        <p className="text-sm text-gray-400 mb-5">Upload a ZIP file containing your project</p>

        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">Project Name (optional)</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Awesome Project"
            className="input"
          />
        </div>

        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-dark-600 hover:border-dark-500 hover:bg-dark-700'
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-blue-400 animate-spin" />
              <p className="text-sm text-gray-300">Analyzing codebase...</p>
              <p className="text-xs text-gray-500">Scanning files, detecting languages...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload size={32} className="text-gray-500" />
              <p className="text-sm text-gray-300">
                {isDragActive ? 'Drop the ZIP here' : 'Drag & drop a ZIP file, or click to browse'}
              </p>
              <p className="text-xs text-gray-500">Max 50MB • ZIP files only</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 bg-dark-700 rounded-lg p-3">
          <p className="font-medium text-gray-400 mb-1">✓ Automatically ignored:</p>
          <p>node_modules • .git • __pycache__ • dist • build • binary files</p>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── GitHub Modal ─────────────────────────────────────────────────────────────

const GitHubModal: React.FC<{ onClose: () => void; onSuccess: (p: Project) => void }> = ({ onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; owner?: string; repo?: string; error?: string } | null>(null);

  const handleValidate = async () => {
    if (!url.trim()) return;
    try {
      const res = await githubApi.validate(url);
      setValidation(res);
    } catch {
      setValidation({ valid: false, error: 'Validation failed' });
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const project = await projectsApi.upload ? undefined : undefined;
      const p = await githubApi.import(url);
      toast.success(`"${p.name}" imported from GitHub!`);
      onSuccess(p);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'GitHub import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in">
        <div className="flex items-center gap-2 mb-1">
          <Github size={20} className="text-white" />
          <h2 className="text-lg font-bold text-white">Connect GitHub Repository</h2>
        </div>
        <p className="text-sm text-gray-400 mb-5">Import a public GitHub repository by URL</p>

        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">Repository URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setValidation(null); }}
              placeholder="https://github.com/owner/repo"
              className="input flex-1"
            />
            <button onClick={handleValidate} className="btn-secondary flex-shrink-0">
              Validate
            </button>
          </div>
        </div>

        {validation && (
          <div className={clsx(
            'px-3 py-2.5 rounded-lg text-sm mb-4',
            validation.valid ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-red-900/30 border border-red-700 text-red-300'
          )}>
            {validation.valid
              ? `✓ Valid: ${validation.owner}/${validation.repo}`
              : `✗ ${validation.error || 'Invalid URL'}`}
          </div>
        )}

        <div className="bg-dark-700 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 mb-2 font-medium">Try these public repos:</p>
          {[
            'https://github.com/tiangolo/fastapi',
            'https://github.com/pallets/flask',
            'https://github.com/django/django',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setUrl(example)}
              className="w-full text-left text-xs text-blue-400 hover:text-blue-300 py-0.5 font-mono truncate"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleImport}
            disabled={!url.trim() || loading}
            className="btn-primary"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
            {loading ? 'Importing...' : 'Import Repository'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Project Card ─────────────────────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ project, onOpen, onDelete }) => {
  const topLangs = project.stats.languages.slice(0, 3);

  return (
    <div className="card group hover:border-dark-500 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-lg flex items-center justify-center">
            <Code2 size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate max-w-40">{project.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={clsx(
                'badge text-xs',
                project.source === 'demo' ? 'bg-yellow-900/50 text-yellow-300' :
                project.source === 'github' ? 'bg-green-900/50 text-green-300' :
                'bg-blue-900/50 text-blue-300'
              )}>
                {project.source === 'demo' ? '🎮 Demo' : project.source === 'github' ? '⚡ GitHub' : '📦 Upload'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Files', value: project.stats.total_files },
          { label: 'Functions', value: project.stats.functions },
          { label: 'API Endpoints', value: project.stats.api_endpoints },
        ].map(({ label, value }) => (
          <div key={label} className="bg-dark-700 rounded-lg px-2 py-1.5 text-center">
            <p className="text-sm font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Languages */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {topLangs.map((l) => (
          <span
            key={l.language}
            className="flex items-center gap-1 px-2 py-0.5 bg-dark-700 rounded text-xs text-gray-400"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: LANG_COLORS[l.language] || '#666' }}
            />
            {l.language}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} />
          <span>{formatDistanceToNow(new Date(project.last_analyzed), { addSuffix: true })}</span>
        </div>
        <button onClick={onOpen} className="btn-primary py-1.5 text-xs">
          Open Project <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Dashboard Page ────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setProjects, addProject, removeProject, setCurrentProject } = useAppStore();
  const [showUpload, setShowUpload] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => {});
  }, [setProjects]);

  const openProject = (project: Project) => {
    setCurrentProject(project);
    navigate('/explorer');
  };

  const handleDelete = async (id: string) => {
    try {
      await projectsApi.delete(id);
      removeProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDemo = async () => {
    setLoadingDemo(true);
    try {
      const project = await projectsApi.loadDemo();
      addProject(project);
      setCurrentProject(project);
      toast.success('Demo project loaded!');
      navigate('/explorer');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load demo');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleProjectLoaded = (project: Project) => {
    addProject(project);
    setShowUpload(false);
    setShowGitHub(false);
    setCurrentProject(project);
    navigate('/explorer');
  };

  const totalFiles = projects.reduce((s, p) => s + p.stats.total_files, 0);
  const totalLangs = new Set(projects.flatMap((p) => p.stats.languages.map((l) => l.language))).size;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Code2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Codebase Navigator</h1>
            <p className="text-sm text-gray-400">Understand any codebase with AI-powered insights</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Projects Loaded', value: projects.length, icon: FolderOpen, color: 'text-blue-400' },
          { label: 'Files Analyzed', value: totalFiles, icon: FileCode, color: 'text-green-400' },
          { label: 'Languages', value: totalLangs, icon: Code2, color: 'text-purple-400' },
          { label: 'AI Ready', value: '✓', icon: Zap, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <Icon size={20} className={clsx(color, 'mb-2')} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button onClick={() => setShowUpload(true)} className="btn-primary">
          <Upload size={15} /> Upload Repository
        </button>
        <button onClick={() => setShowGitHub(true)} className="btn-secondary">
          <Github size={15} /> Connect GitHub
        </button>
        <button
          onClick={handleDemo}
          disabled={loadingDemo}
          className="btn-secondary border-yellow-700/50 text-yellow-400 hover:border-yellow-600 hover:text-yellow-300"
        >
          {loadingDemo ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
          Try Demo
        </button>
      </div>

      {/* Projects grid */}
      {projects.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Recent Projects</h2>
            <span className="text-xs text-gray-500">{projects.length} project{projects.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => openProject(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-dark-700 rounded-2xl">
          <Code2 size={40} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-400 mb-2">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload a ZIP file, connect a GitHub repo, or try the built-in demo
          </p>
          <button onClick={handleDemo} className="btn-primary mx-auto">
            <Zap size={14} /> Load Demo Project
          </button>
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleProjectLoaded} />}
      {showGitHub && <GitHubModal onClose={() => setShowGitHub(false)} onSuccess={handleProjectLoaded} />}
    </div>
  );
};

export default Dashboard;
