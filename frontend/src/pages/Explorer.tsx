import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, AlertCircle, Loader2, FolderOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { projectsApi } from '../api/client';
import FileExplorer from '../components/FileExplorer';
import CodeViewer from '../components/CodeViewer';
import AIChatPanel from '../components/AIChatPanel';
import type { FileContent } from '../types';
import toast from 'react-hot-toast';

const Explorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    currentProject, setCurrentProject,
    selectedFile, setSelectedFile,
    highlightLines, setHighlightLines,
  } = useAppStore();

  const [fileFilter, setFileFilter] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [activePanel, setActivePanel] = useState<'code' | 'chat'>('code');

  // Load file from URL params (e.g. from search results)
  useEffect(() => {
    const filePath = searchParams.get('file');
    const lineStr = searchParams.get('line');
    if (filePath && currentProject) {
      handleSelectFile(filePath);
      if (lineStr) {
        const line = parseInt(lineStr, 10);
        setHighlightLines({ start: line, end: line });
      }
    }
  }, [searchParams, currentProject]);

  // Auto-load first project if none selected
  useEffect(() => {
    if (!currentProject) {
      import('../api/client').then(({ projectsApi }) => {
        projectsApi.list().then((projects) => {
          if (projects.length > 0) setCurrentProject(projects[0]);
        }).catch(() => {});
      });
    }
  }, []);

  const handleSelectFile = useCallback(async (path: string) => {
    if (!currentProject) return;
    setLoadingFile(true);
    setHighlightLines(null);
    try {
      const file = await projectsApi.getFile(currentProject.id, path);
      setSelectedFile(file);
      setActivePanel('code');
    } catch {
      toast.error('Failed to load file');
    } finally {
      setLoadingFile(false);
    }
  }, [currentProject, setSelectedFile, setHighlightLines]);

  const handleCitationClick = useCallback((filePath: string, startLine: number, endLine: number) => {
    handleSelectFile(filePath);
    setHighlightLines({ start: startLine, end: endLine });
    setActivePanel('code');
  }, [handleSelectFile, setHighlightLines]);

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <FolderOpen size={48} className="text-gray-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-1">No project loaded</h2>
          <p className="text-sm text-gray-500 mb-4">Go to the Dashboard to upload or select a project</p>
          <button onClick={() => navigate('/')} className="btn-primary mx-auto">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* File Explorer Panel */}
      <div className="w-56 flex-shrink-0 flex flex-col bg-dark-800 border-r border-dark-700">
        <div className="px-3 py-2.5 border-b border-dark-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {currentProject.name}
          </p>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="Filter files..."
              className="input py-1.5 pl-7 text-xs"
            />
          </div>
        </div>
        <FileExplorer
          tree={currentProject.file_tree}
          selectedPath={selectedFile?.path}
          onSelectFile={handleSelectFile}
          searchFilter={fileFilter}
        />
      </div>

      {/* Code View Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar for mobile */}
        <div className="flex border-b border-dark-700 bg-dark-800 lg:hidden">
          <button
            onClick={() => setActivePanel('code')}
            className={activePanel === 'code' ? 'tab-active' : 'tab'}
          >
            Code View
          </button>
          <button
            onClick={() => setActivePanel('chat')}
            className={activePanel === 'chat' ? 'tab-active' : 'tab'}
          >
            AI Assistant
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Code viewer */}
          <div className={`flex-1 flex flex-col min-w-0 ${activePanel === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
            {loadingFile ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
              </div>
            ) : selectedFile ? (
              <CodeViewer
                file={selectedFile}
                highlightLines={highlightLines}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-dark-700 border border-dark-600 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle size={28} className="text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-400 mb-1">No file selected</h3>
                <p className="text-sm text-gray-500">
                  Click a file in the explorer, or ask the AI to show you relevant code
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-dark-700 flex-shrink-0" />

          {/* AI Chat panel */}
          <div className={`w-80 xl:w-96 flex-shrink-0 flex flex-col ${activePanel === 'code' ? 'hidden lg:flex' : 'flex'}`}>
            <AIChatPanel
              projectId={currentProject.id}
              onCitationClick={handleCitationClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explorer;
