import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Loader2, FileCode, ChevronDown,
  ChevronUp, Sparkles, RotateCcw, Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store/useAppStore';
import { chatApi } from '../api/client';
import type { ChatMessage, Citation } from '../types';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AIChatPanelProps {
  projectId: string;
  onCitationClick?: (filePath: string, startLine: number, endLine: number) => void;
}

const CitationCard: React.FC<{
  citation: Citation;
  onClick: () => void;
}> = ({ citation, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-start gap-2 w-full text-left px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-blue-500/50 rounded-lg transition-all group"
  >
    <FileCode size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-xs font-mono text-blue-300 group-hover:text-blue-200 truncate">
        {citation.file_path}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">
        Lines {citation.start_line}–{citation.end_line}
      </p>
      {citation.preview && (
        <p className="text-xs text-gray-400 mt-0.5 truncate">{citation.preview}</p>
      )}
    </div>
  </button>
);

const FlowDiagramView: React.FC<{ flow: any; onNodeClick?: (path: string) => void }> = ({
  flow, onNodeClick
}) => {
  if (!flow?.nodes?.length) return null;
  return (
    <div className="mt-3 p-3 bg-dark-700 border border-dark-600 rounded-lg">
      <p className="text-xs text-gray-500 mb-3 font-medium flex items-center gap-1.5">
        <span>⚡</span> Code Flow
      </p>
      <div className="flex flex-col items-center gap-0">
        {flow.nodes.map((node: any, i: number) => (
          <React.Fragment key={node.id}>
            <button
              onClick={() => onNodeClick?.(node.path)}
              className="flow-node w-full max-w-48 text-xs"
            >
              {node.label}
            </button>
            {i < flow.nodes.length - 1 && (
              <div className="flow-arrow">↓</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  message: ChatMessage;
  onCitationClick?: (filePath: string, startLine: number, endLine: number) => void;
  onFlowNodeClick?: (path: string) => void;
}> = ({ message, onCitationClick, onFlowNodeClick }) => {
  const [citationsOpen, setCitationsOpen] = useState(true);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied');
  };

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-600 to-blue-600'
      )}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      <div className={clsx('flex flex-col gap-1.5 max-w-[85%]', isUser && 'items-end')}>
        {/* Role label */}
        <div className={clsx('flex items-center gap-2', isUser && 'flex-row-reverse')}>
          <span className="text-xs text-gray-500 font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
          {message.mode && !isUser && (
            <span className={`badge text-xs ${message.mode === 'simple' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
              {message.mode}
            </span>
          )}
          <span className="text-xs text-gray-600">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>

        {/* Message content */}
        <div className={clsx(
          'px-4 py-3 rounded-xl text-sm leading-relaxed relative group',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-dark-700 border border-dark-600 text-gray-200 rounded-tl-sm'
        )}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return (
                        <code
                          className={clsx(
                            'text-xs rounded px-1 py-0.5',
                            match ? 'block bg-dark-800 p-2 rounded-lg my-1 font-mono' : 'bg-dark-800 font-mono'
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-gray-300 transition-all"
              >
                <Copy size={12} />
              </button>
            </>
          )}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setCitationsOpen(!citationsOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-1.5 transition-colors"
            >
              <FileCode size={11} />
              <span>{message.citations.length} Source{message.citations.length > 1 ? 's' : ''}</span>
              {citationsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {citationsOpen && (
              <div className="space-y-1.5 animate-fade-in">
                {message.citations.map((c, i) => (
                  <CitationCard
                    key={i}
                    citation={c}
                    onClick={() => onCitationClick?.(c.file_path, c.start_line, c.end_line)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flow diagram */}
        {!isUser && message.flow_diagram && (
          <FlowDiagramView
            flow={message.flow_diagram}
            onNodeClick={(path) => onCitationClick?.(path, 1, 10)}
          />
        )}
      </div>
    </div>
  );
};

const SUGGESTIONS = [
  'Explain this project in simple terms',
  'Where is user authentication implemented?',
  'Which file connects to the database?',
  'Where are the API endpoints defined?',
  'Explain the login flow',
];

const AIChatPanel: React.FC<AIChatPanelProps> = ({ projectId, onCitationClick }) => {
  const { chatMessages, addChatMessage, clearChat, chatLoading, setChatLoading, appMode } = useAppStore();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    chatApi.getSuggestions(projectId).then(setSuggestions).catch(() => {});
  }, [projectId]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || chatLoading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
      mode: appMode,
    };
    addChatMessage(userMsg);
    setChatLoading(true);

    try {
      const history = chatMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chatApi.send(projectId, msg, appMode, history);

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        flow_diagram: response.flow_diagram,
        timestamp: response.timestamp,
        mode: response.mode,
      };
      addChatMessage(aiMsg);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error**: ${err.response?.data?.detail || 'Failed to get AI response. Please try again.'}`,
        timestamp: new Date().toISOString(),
        mode: appMode,
      };
      addChatMessage(errMsg);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">AI Assistant</span>
          <span className={`badge text-xs ${appMode === 'simple' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
            {appMode} mode
          </span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          title="Clear chat"
        >
          <RotateCcw size={12} />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Ask about the codebase</h3>
            <p className="text-xs text-gray-500 mb-5 max-w-xs">
              Ask any question about the code structure, specific files, or how things work.
            </p>
            <div className="space-y-2 w-full max-w-sm">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left px-3 py-2.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-blue-500/40 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onCitationClick={onCitationClick}
          />
        ))}

        {chatLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-dark-700 border border-dark-600 rounded-xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-dark-700 bg-dark-800 flex-shrink-0">
        <div className="flex gap-2 items-end bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 focus-within:border-blue-500/60 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the codebase..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 outline-none resize-none leading-relaxed max-h-32 min-h-[20px]"
            rows={1}
            style={{ height: 'auto', minHeight: '20px' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatLoading}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          >
            {chatLoading ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">
          Enter to send • Shift+Enter for new line • Citations are clickable
        </p>
      </div>
    </div>
  );
};

export default AIChatPanel;
