import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode, FolderOpen, Code2, Database, Settings,
  Globe, Zap, BarChart3, Loader2, ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { overviewApi, projectsApi } from '../api/client';
import type { ModuleInfo } from '../types';
import clsx from 'clsx';

const LANG_COLORS: Record<string, string> = {
  Python: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  JavaScript: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  TypeScript: 'bg-sky-900/50 text-sky-300 border-sky-700/50',
  Java: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'C++': 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  'C#': 'bg-green-900/50 text-green-300 border-green-700/50',
  HTML: 'bg-red-900/50 text-red-300 border-red-700/50',
  CSS: 'bg-pink-900/50 text-pink-300 border-pink-700/50',
  SQL: 'bg-teal-900/50 text-teal-300 border-teal-700/50',
  JSON: 'bg-yellow-900/30 text-yellow-200 border-yellow-700/30',
};

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAppStore();
  const [overviewData, setOverviewData] = useState<{
    modules: ModuleInfo[];
    ai_summary: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    overviewApi.get(currentProject.id)
      .then((data) => setOverviewData({ modules: data.modules, ai_summary: data.ai_summary }))
      .catch(() => setError('Failed to load overview'))
      .finally(() => setLoading(false));
  }, [currentProject]);

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

  const stats = currentProject.stats;

  const statCards = [
    { label: 'Total Files', value: stats.total_files, icon: FileCode, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { label: 'Functions', value: stats.functions, icon: Code2, color: 'text-purple-400', bg: 'bg-purple-900/20' },
    { label: 'Classes', value: stats.classes, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    { label: 'API Endpoints', value: stats.api_endpoints, icon: Globe, color: 'text-green-400', bg: 'bg-green-900/20' },
    { label: 'Database Files', value: stats.database_files, icon: Database, color: 'text-teal-400', bg: 'bg-teal-900/20' },
    { label: 'Config Files', value: stats.config_files, icon: Settings, color: 'text-gray-400', bg: 'bg-gray-900/20' },
    { label: 'Total Lines', value: stats.total_lines.toLocaleString(), icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
    { label: 'Languages', value: stats.languages.length, icon: Globe, color: 'text-orange-400', bg: 'bg-orange-900/20' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>Projects</span>
          <ChevronRight size={12} />
          <span className="text-gray-300">{currentProject.name}</span>
          <ChevronRight size={12} />
          <span className="text-blue-400">Overview</span>
        </div>
        <h1 className="text-xl font-bold text-white">{currentProject.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Project Analysis Overview</p>
      </div>

      {/* AI Summary */}
      {loading ? (
        <div className="card flex items-center gap-3 mb-6">
          <Loader2 size={18} className="text-blue-400 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-400">Generating project summary...</p>
        </div>
      ) : overviewData?.ai_summary ? (
        <div className="card mb-6 border-blue-700/30 bg-gradient-to-br from-blue-950/30 to-dark-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">AI Summary</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{overviewData.ai_summary}</p>
        </div>
      ) : null}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mb-3', bg)}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Languages</h2>
          <div className="space-y-3">
            {stats.languages.map((lang) => (
              <div key={lang.language}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={clsx(
                    'badge border',
                    LANG_COLORS[lang.language] || 'bg-dark-600 text-gray-400 border-dark-500'
                  )}>
                    {lang.language}
                  </span>
                  <span className="text-gray-400">
                    {lang.file_count} files · {lang.percentage}%
                  </span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Main Modules</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Detecting modules...
            </div>
          ) : overviewData?.modules?.length ? (
            <div className="space-y-2">
              {overviewData.modules.map((mod) => (
                <div key={mod.name} className="bg-dark-700 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{mod.icon}</span>
                    <span className="text-sm font-medium text-white">{mod.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{mod.file_count} files</span>
                  </div>
                  <p className="text-xs text-gray-400 pl-7">{mod.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5 pl-7">
                    {mod.files.slice(0, 3).map((f) => (
                      <span key={f} className="text-xs font-mono text-blue-400/80 bg-dark-800 px-1.5 py-0.5 rounded">
                        {f.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No modules detected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
