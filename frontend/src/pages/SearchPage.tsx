import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileCode, Loader2, FolderOpen, ChevronRight,
  Shield, Database, Globe, CreditCard, Mail, Upload,
  Settings as SettingsIcon, Zap
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { searchApi, projectsApi } from '../api/client';
import type { SearchResult, FindResult } from '../types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const FIND_CATEGORIES = [
  { id: 'auth', label: 'Authentication', icon: Shield, color: 'text-blue-400' },
  { id: 'database', label: 'Database', icon: Database, color: 'text-teal-400' },
  { id: 'api', label: 'API Endpoints', icon: Globe, color: 'text-green-400' },
  { id: 'payment', label: 'Payment Logic', icon: CreditCard, color: 'text-yellow-400' },
  { id: 'email', label: 'Email Service', icon: Mail, color: 'text-purple-400' },
  { id: 'upload', label: 'File Upload', icon: Upload, color: 'text-orange-400' },
  { id: 'config', label: 'Configuration', icon: SettingsIcon, color: 'text-gray-400' },
];

const LANG_COLORS: Record<string, string> = {
  Python: 'bg-blue-900/50 text-blue-300',
  JavaScript: 'bg-yellow-900/50 text-yellow-300',
  TypeScript: 'bg-sky-900/50 text-sky-300',
  Java: 'bg-orange-900/50 text-orange-300',
  HTML: 'bg-red-900/50 text-red-300',
  CSS: 'bg-pink-900/50 text-pink-300',
  SQL: 'bg-teal-900/50 text-teal-300',
};

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAppStore();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [findResults, setFindResults] = useState<FindResult[]>([]);
  const [findCategory, setFindCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'find'>('search');

  const handleSearch = async () => {
    if (!query.trim() || !currentProject) return;
    setLoading(true);
    setSearchResults([]);
    try {
      const results = await searchApi.search(currentProject.id, query);
      setSearchResults(results);
      if (results.length === 0) toast('No results found for this query', { icon: 'ℹ️' });
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFind = async (category: string) => {
    if (!currentProject) return;
    setLoading(true);
    setFindResults([]);
    setFindCategory(category);
    setActiveTab('find');
    try {
      const res = await searchApi.findCategory(currentProject.id, category);
      setFindResults(res.results);
      if (res.results.length === 0) toast(`No ${category} code found in this project`, { icon: 'ℹ️' });
    } catch {
      toast.error('Find failed');
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (path: string, line?: number) => {
    if (!currentProject) return;
    try {
      const file = await projectsApi.getFile(currentProject.id, path);
      useAppStore.getState().setSelectedFile(file);
      if (line) useAppStore.getState().setHighlightLines({ start: line, end: line });
      navigate('/explorer');
    } catch {
      navigate(`/explorer?file=${encodeURIComponent(path)}&line=${line || 1}`);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <FolderOpen size={48} className="text-gray-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-1">No project loaded</h2>
          <p className="text-sm text-gray-500 mb-4">Load a project from the Dashboard first</p>
          <button onClick={() => navigate('/')} className="btn-primary mx-auto">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Code Search</h1>
          <p className="text-sm text-gray-400">
            Search across {currentProject.stats.total_files} files in <span className="text-blue-400">{currentProject.name}</span>
          </p>
        </div>

        {/* Search bar */}
        <div className="card mb-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for keywords, function names, class names..."
                className="input pl-9 pr-4"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="btn-primary flex-shrink-0"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {searchResults.length} result{searchResults.length > 1 ? 's' : ''} for "{query}"
            </p>
          )}
        </div>

        {/* Find Where section */}
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Find Where</h2>
            <span className="text-xs text-gray-500">— quickly locate code categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FIND_CATEGORIES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleFind(id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                  findCategory === id && activeTab === 'find'
                    ? 'border-blue-500 bg-blue-900/20 text-white'
                    : 'border-dark-600 bg-dark-700 text-gray-400 hover:border-dark-500 hover:text-white'
                )}
              >
                <Icon size={13} className={color} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex items-center gap-3 text-sm text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin text-blue-400" />
            Searching codebase...
          </div>
        )}

        {/* Code Search Results */}
        {!loading && activeTab === 'search' && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((result, i) => (
              <button
                key={i}
                onClick={() => openFile(result.file_path, result.line_number)}
                className="w-full text-left card hover:border-blue-500/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileCode size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-mono text-gray-200 group-hover:text-white transition-colors truncate flex-1">
                    {result.file_path}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">Line {result.line_number}</span>
                  {result.language && (
                    <span className={`badge text-xs flex-shrink-0 ${LANG_COLORS[result.language] || 'bg-dark-600 text-gray-400'}`}>
                      {result.language}
                    </span>
                  )}
                  <ChevronRight size={13} className="text-gray-600 flex-shrink-0" />
                </div>
                <code className="text-xs font-mono text-gray-300 bg-dark-700 px-3 py-2 rounded block whitespace-pre-wrap break-all">
                  {result.line_content.trim()}
                </code>
                {result.explanation && (
                  <p className="text-xs text-gray-500 mt-1.5">{result.explanation}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Find Results */}
        {!loading && activeTab === 'find' && findResults.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Find {findCategory.toUpperCase()} — {findResults.length} locations
            </h3>
            <div className="space-y-2">
              {findResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => openFile(result.file_path, result.start_line)}
                  className="w-full text-left card hover:border-blue-500/40 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode size={13} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-mono text-gray-200 group-hover:text-white flex-1 truncate">
                      {result.file_path}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      Lines {result.start_line}–{result.end_line}
                    </span>
                    <span className="text-xs text-green-400 flex-shrink-0">
                      {Math.round(result.relevance * 100)}% match
                    </span>
                    <ChevronRight size={13} className="text-gray-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-400">{result.description}</p>
                  {result.preview && (
                    <code className="text-xs font-mono text-gray-500 bg-dark-700 px-3 py-2 rounded block mt-2 whitespace-pre-wrap break-all line-clamp-3">
                      {result.preview.trim()}
                    </code>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && searchResults.length === 0 && findResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm">Search for code or use "Find Where" to locate specific features</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
