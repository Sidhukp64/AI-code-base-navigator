import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileCode, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { searchApi } from '../api/client';
import type { SearchResult } from '../types';

const LANG_BADGE_COLORS: Record<string, string> = {
  Python: 'bg-blue-900/50 text-blue-300',
  JavaScript: 'bg-yellow-900/50 text-yellow-300',
  TypeScript: 'bg-blue-800/50 text-blue-200',
  Java: 'bg-orange-900/50 text-orange-300',
  'C++': 'bg-purple-900/50 text-purple-300',
  'C#': 'bg-green-900/50 text-green-300',
  SQL: 'bg-teal-900/50 text-teal-300',
  HTML: 'bg-red-900/50 text-red-300',
  CSS: 'bg-pink-900/50 text-pink-300',
};

const AppHeader: React.FC = () => {
  const { currentProject, appMode, setAppMode } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim() || !currentProject) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchApi.search(currentProject.id, query);
        setResults(r.slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentProject]);

  const openFile = (result: SearchResult) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/explorer?file=${encodeURIComponent(result.file_path)}&line=${result.line_number}`);
  };

  return (
    <>
      <header className="h-12 bg-dark-800 border-b border-dark-700 flex items-center px-4 gap-4 flex-shrink-0">
        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-all flex-1 max-w-md"
        >
          <Search size={14} />
          <span>Search code...</span>
          {currentProject && (
            <span className="ml-auto text-xs bg-dark-600 px-1.5 py-0.5 rounded font-mono">Ctrl K</span>
          )}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Mode toggle */}
          <div className="flex items-center bg-dark-700 rounded-lg p-0.5 border border-dark-600">
            <button
              onClick={() => setAppMode('simple')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                appMode === 'simple'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setAppMode('developer')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                appMode === 'developer'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Developer
            </button>
          </div>

          {/* Status dot */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:inline">API Ready</span>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative bg-dark-800 border border-dark-600 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-slide-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700">
              <Search size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={currentProject ? `Search in ${currentProject.name}...` : 'Load a project first'}
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm"
                disabled={!currentProject}
              />
              {loading && <Loader2 size={15} className="text-gray-400 animate-spin" />}
              <button onClick={() => setSearchOpen(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!currentProject && (
                <p className="text-center text-gray-500 text-sm py-8">
                  Load a project from the Dashboard first
                </p>
              )}
              {query && results.length === 0 && !loading && currentProject && (
                <p className="text-center text-gray-500 text-sm py-8">No results for "{query}"</p>
              )}
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => openFile(r)}
                  className="w-full text-left px-4 py-3 hover:bg-dark-700 border-b border-dark-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode size={13} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200 font-mono truncate">{r.file_path}</span>
                    <span className="ml-auto text-xs text-gray-500">:{r.line_number}</span>
                    {r.language && (
                      <span className={`badge ${LANG_BADGE_COLORS[r.language] || 'bg-dark-600 text-gray-400'}`}>
                        {r.language}
                      </span>
                    )}
                  </div>
                  <code className="text-xs text-gray-400 font-mono block truncate pl-5">
                    {r.line_content.trim()}
                  </code>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
