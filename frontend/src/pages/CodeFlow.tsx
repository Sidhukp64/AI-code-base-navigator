import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Loader2, ArrowDown, FileCode, Zap, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { chatApi, projectsApi } from '../api/client';
import toast from 'react-hot-toast';

interface FlowNode {
  id: string;
  label: string;
  path: string;
  type: string;
}

interface FlowEdge {
  from: string;
  to: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const QUICK_FLOWS = [
  { label: 'Login Flow', query: 'Explain the login flow step by step' },
  { label: 'Data Flow', query: 'Explain how data flows from request to database' },
  { label: 'Auth Flow', query: 'Explain the authentication and authorization flow' },
  { label: 'API Request', query: 'Explain the API request handling flow' },
  { label: 'Registration', query: 'Explain the user registration flow' },
  { label: 'File Upload', query: 'Explain the file upload process flow' },
];

const CodeFlow: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAppStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [explanation, setExplanation] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const generateFlow = async (q?: string) => {
    const question = q || query;
    if (!question.trim() || !currentProject) return;
    setLoading(true);
    setFlow(null);
    setExplanation('');
    try {
      const response = await chatApi.send(currentProject.id, question, 'developer');
      setExplanation(response.answer);
      if (response.flow_diagram) {
        setFlow(response.flow_diagram);
      } else {
        // Build a simple flow from citations
        if (response.citations.length > 0) {
          const nodes = response.citations.map((c, i) => ({
            id: String(i),
            label: c.file_path.split('/').pop() || c.file_path,
            path: c.file_path,
            type: 'file',
            description: c.preview,
            lines: `${c.start_line}–${c.end_line}`,
          }));
          setFlow({
            nodes,
            edges: nodes.slice(0, -1).map((_, i) => ({ from: String(i), to: String(i + 1) })),
          });
        } else {
          toast('No flow detected. Try asking about a specific process.', { icon: 'ℹ️' });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate flow');
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (path: string) => {
    if (!currentProject) return;
    try {
      const file = await projectsApi.getFile(currentProject.id, path);
      useAppStore.getState().setSelectedFile(file);
      navigate('/explorer');
    } catch {
      navigate('/explorer');
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
          <h1 className="text-xl font-bold text-white mb-1">Code Flow Explainer</h1>
          <p className="text-sm text-gray-400">
            Visualize how different parts of the codebase connect to each other
          </p>
        </div>

        {/* Query input */}
        <div className="card mb-5">
          <label className="text-xs text-gray-400 font-medium mb-2 block">
            Describe a flow or process to visualize
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateFlow()}
              placeholder="e.g. Explain the login flow, How does data get saved to database..."
              className="input flex-1"
            />
            <button
              onClick={() => generateFlow()}
              disabled={!query.trim() || loading}
              className="btn-primary flex-shrink-0"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Generate
            </button>
          </div>

          {/* Quick flow buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_FLOWS.map((f) => (
              <button
                key={f.label}
                onClick={() => { setQuery(f.query); generateFlow(f.query); }}
                className="px-3 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-blue-500/50 text-gray-400 hover:text-white rounded-lg transition-all"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="card flex flex-col items-center gap-3 py-12">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
            <p className="text-sm text-gray-400">Analyzing code relationships...</p>
          </div>
        )}

        {/* Flow diagram */}
        {!loading && flow && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual flow */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                Code Flow Diagram
              </h2>
              <div className="flex flex-col items-center gap-0 py-4">
                {flow.nodes.map((node, i) => (
                  <React.Fragment key={node.id}>
                    <button
                      onClick={() => { setSelectedNode(node.id); openFile(node.path); }}
                      className={`
                        w-full max-w-56 px-4 py-3 rounded-xl border text-sm text-center transition-all
                        ${selectedNode === node.id
                          ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                          : 'border-dark-600 bg-dark-700 text-gray-200 hover:border-blue-500/50 hover:bg-dark-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileCode size={13} className="text-blue-400 flex-shrink-0" />
                        <span className="font-mono font-medium truncate">{node.label}</span>
                      </div>
                      {(node as any).lines && (
                        <p className="text-xs text-gray-500 mt-1">Lines {(node as any).lines}</p>
                      )}
                    </button>
                    {i < flow.nodes.length - 1 && (
                      <div className="flex flex-col items-center my-1 text-gray-600">
                        <div className="w-px h-3 bg-dark-600" />
                        <ArrowDown size={14} className="text-blue-500/60" />
                        <div className="w-px h-3 bg-dark-600" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click a node to open the file
              </p>
            </div>

            {/* Explanation */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={14} className="text-purple-400" />
                AI Explanation
              </h2>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </div>
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-xs text-gray-500 font-medium mb-2">Files Involved:</p>
                <div className="space-y-1">
                  {flow.nodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openFile(n.path)}
                      className="flex items-center gap-2 w-full text-left text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <FileCode size={11} />
                      <span className="font-mono">{n.path}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !flow && (
          <div className="text-center py-16 border border-dashed border-dark-700 rounded-xl">
            <div className="flex flex-col items-center gap-2 mb-3">
              {['Login.jsx', '↓', 'auth.py', '↓', 'database.py', '↓', 'JWT Token'].map((item, i) => (
                <div key={i} className={item === '↓' ? 'text-gray-600 text-sm' : 'px-4 py-1.5 bg-dark-700 border border-dark-600 rounded-lg text-xs text-gray-400 font-mono'}>
                  {item}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Ask about a flow or process to generate a visual diagram
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeFlow;
