import React, { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode, ChevronRight, Maximize2 } from 'lucide-react';
import type { FileContent } from '../types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// Map our language names to prism language identifiers
const PRISM_LANG: Record<string, string> = {
  Python: 'python',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Java: 'java',
  'C++': 'cpp',
  C: 'c',
  'C#': 'csharp',
  HTML: 'html',
  CSS: 'css',
  SQL: 'sql',
  JSON: 'json',
  Markdown: 'markdown',
  YAML: 'yaml',
  Shell: 'bash',
  Go: 'go',
  Rust: 'rust',
  Ruby: 'ruby',
  PHP: 'php',
  Swift: 'swift',
  Kotlin: 'kotlin',
  Vue: 'markup',
};

const LANG_BADGE: Record<string, string> = {
  Python: 'bg-blue-900/60 text-blue-300',
  JavaScript: 'bg-yellow-900/60 text-yellow-300',
  TypeScript: 'bg-blue-800/60 text-blue-200',
  Java: 'bg-orange-900/60 text-orange-300',
  SQL: 'bg-teal-900/60 text-teal-300',
  HTML: 'bg-red-900/60 text-red-300',
  CSS: 'bg-pink-900/60 text-pink-300',
};

interface CodeViewerProps {
  file: FileContent;
  highlightLines?: { start: number; end: number } | null;
  onCitationClick?: (filePath: string, start: number, end: number) => void;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ file, highlightLines, onCitationClick }) => {
  const [copied, setCopied] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  const prismLang = PRISM_LANG[file.language] || 'text';
  const badgeClass = LANG_BADGE[file.language] || 'bg-dark-600 text-gray-400';

  useEffect(() => {
    if (highlightLines && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightLines, file.path]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Build breadcrumb from path
  const parts = file.path.split('/');

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* File header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border-b border-dark-700 flex-shrink-0">
        <FileCode size={14} className="text-blue-400 flex-shrink-0" />
        <nav className="flex items-center gap-1 text-xs text-gray-500 min-w-0 flex-1">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={10} className="text-gray-600 flex-shrink-0" />}
              <span className={clsx(
                'truncate',
                i === parts.length - 1 ? 'text-gray-200 font-medium font-mono' : 'text-gray-500'
              )}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge text-xs ${badgeClass}`}>{file.language}</span>
          <span className="text-xs text-gray-500">{file.lines} lines</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-dark-700 hover:bg-dark-600 rounded transition-all"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto relative">
        {highlightLines && (
          <div
            ref={highlightRef}
            style={{
              position: 'absolute',
              top: `${(highlightLines.start - 1) * 1.6 * 13}px`,
              left: 0,
              right: 0,
              height: `${(highlightLines.end - highlightLines.start + 1) * 1.6 * 13}px`,
              background: 'rgba(59, 130, 246, 0.12)',
              borderLeft: '3px solid #3b82f6',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
        <SyntaxHighlighter
          language={prismLang}
          style={vscDarkPlus}
          showLineNumbers
          wrapLines
          lineNumberStyle={{
            color: '#4a5568',
            minWidth: '3.5em',
            paddingRight: '1em',
            userSelect: 'none',
            fontSize: '0.75rem',
          }}
          customStyle={{
            margin: 0,
            padding: '16px 0',
            background: 'transparent',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
          lineProps={(lineNumber) => ({
            style: {
              display: 'block',
              background:
                highlightLines &&
                lineNumber >= highlightLines.start &&
                lineNumber <= highlightLines.end
                  ? 'rgba(59, 130, 246, 0.12)'
                  : 'transparent',
              cursor: 'default',
            },
          })}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeViewer;
