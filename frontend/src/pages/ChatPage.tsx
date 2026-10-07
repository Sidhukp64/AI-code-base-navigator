import React, { useState } from 'react';
import { MessageSquare, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import AIChatPanel from '../components/AIChatPanel';
import { projectsApi } from '../api/client';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAppStore();

  const handleCitationClick = async (filePath: string, startLine: number, endLine: number) => {
    if (!currentProject) return;
    try {
      const file = await projectsApi.getFile(currentProject.id, filePath);
      useAppStore.getState().setSelectedFile(file);
      useAppStore.getState().setHighlightLines({ start: startLine, end: endLine });
      navigate('/explorer');
    } catch {
      navigate(`/explorer?file=${encodeURIComponent(filePath)}&line=${startLine}`);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <FolderOpen size={48} className="text-gray-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-1">No project loaded</h2>
          <p className="text-sm text-gray-500 mb-4">Load a project from the Dashboard to start chatting with the AI</p>
          <button onClick={() => navigate('/')} className="btn-primary mx-auto">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      <AIChatPanel
        projectId={currentProject.id}
        onCitationClick={handleCitationClick}
      />
    </div>
  );
};

export default ChatPage;
