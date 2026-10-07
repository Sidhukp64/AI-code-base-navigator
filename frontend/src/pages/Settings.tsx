import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Palette, Code2, Info, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { appMode, setAppMode } = useAppStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setSaved(true);
    toast.success('API key saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm text-gray-400">Configure AI Codebase Navigator</p>
        </div>

        {/* AI Configuration */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">AI Configuration</h2>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-1.5 block">OpenAI API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input pr-9"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={handleSaveKey} className="btn-primary flex-shrink-0">
                {saved ? <Check size={14} className="text-green-400" /> : null}
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Without an API key, the app runs in demo mode with mock AI responses.{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                Get an API key <ExternalLink size={10} />
              </a>
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">AI Model</label>
            <select className="input">
              <option value="gpt-4o-mini">GPT-4o Mini (Fast, Recommended)</option>
              <option value="gpt-4o">GPT-4o (More Capable)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
            </select>
          </div>
        </div>

        {/* Mode */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Display Mode</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'developer',
                label: 'Developer Mode',
                desc: 'Technical explanations with implementation details, patterns, and architecture terms',
                color: 'border-blue-500 bg-blue-900/10',
                badge: 'bg-blue-900/50 text-blue-300',
              },
              {
                id: 'simple',
                label: 'Simple Mode',
                desc: 'Beginner-friendly language, plain English explanations without jargon',
                color: 'border-purple-500 bg-purple-900/10',
                badge: 'bg-purple-900/50 text-purple-300',
              },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setAppMode(m.id as any)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  appMode === m.id ? m.color : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge text-xs ${m.badge}`}>{m.label}</span>
                  {appMode === m.id && <Check size={12} className="text-green-400 ml-auto" />}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upload limits */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Code2 size={16} className="text-green-400" />
            <h2 className="text-sm font-semibold text-white">Analysis Settings</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Max Upload Size</label>
              <select className="input">
                <option>50 MB (Default)</option>
                <option>100 MB</option>
                <option>200 MB</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">GitHub Import Max Files</label>
              <select className="input">
                <option>300 files (Default)</option>
                <option>500 files</option>
                <option>1000 files</option>
              </select>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-white">About</h2>
          </div>
          <div className="space-y-1.5 text-xs text-gray-400">
            <p><span className="text-gray-300 font-medium">AI Codebase Navigator</span> v1.0.0</p>
            <p>An AI-powered developer tool for understanding codebases using natural language.</p>
            <p className="text-gray-500">
              Built with React, TypeScript, FastAPI, and Tailwind CSS.
              AI powered by OpenAI GPT with RAG (Retrieval-Augmented Generation).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
