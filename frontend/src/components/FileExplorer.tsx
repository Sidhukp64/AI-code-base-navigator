import React, { useState } from 'react';
import {
  Folder, FolderOpen, FileCode, FileText, File,
  ChevronRight, ChevronDown
} from 'lucide-react';
import type { FileNode } from '../types';
import clsx from 'clsx';

const LANG_COLORS: Record<string, string> = {
  Python: 'text-blue-400',
  JavaScript: 'text-yellow-400',
  TypeScript: 'text-blue-300',
  Java: 'text-orange-400',
  'C++': 'text-purple-400',
  'C#': 'text-green-400',
  HTML: 'text-red-400',
  CSS: 'text-pink-400',
  SQL: 'text-teal-400',
  Markdown: 'text-gray-400',
  JSON: 'text-yellow-300',
  YAML: 'text-yellow-300',
};

const EXT_ICON: Record<string, string> = {
  Python: '🐍',
  JavaScript: '🟨',
  TypeScript: '🔷',
  Java: '☕',
  HTML: '🌐',
  CSS: '🎨',
  SQL: '🗄️',
  Markdown: '📝',
  JSON: '{ }',
};

interface FileExplorerProps {
  tree: FileNode;
  selectedPath?: string;
  onSelectFile: (path: string) => void;
  searchFilter?: string;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedPath?: string;
  onSelect: (path: string) => void;
  searchFilter?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, selectedPath, onSelect, searchFilter }) => {
  const [expanded, setExpanded] = useState(depth < 2);

  const isSelected = node.path === selectedPath;

  const matchesFilter = !searchFilter ||
    node.name.toLowerCase().includes(searchFilter.toLowerCase());

  const hasMatchingChildren = (n: FileNode): boolean => {
    if (!searchFilter) return true;
    if (n.name.toLowerCase().includes(searchFilter.toLowerCase())) return true;
    return n.children?.some(hasMatchingChildren) ?? false;
  };

  if (searchFilter && !hasMatchingChildren(node)) return null;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            'w-full flex items-center gap-1.5 px-2 py-1 text-left rounded hover:bg-dark-700 transition-colors group',
            'text-xs text-gray-400 hover:text-gray-200'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="w-3 flex-shrink-0 text-gray-600">
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
          {expanded ? (
            <FolderOpen size={13} className="text-yellow-500/80 flex-shrink-0" />
          ) : (
            <Folder size={13} className="text-yellow-600/70 flex-shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                searchFilter={searchFilter}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const langColor = node.language ? LANG_COLORS[node.language] || 'text-gray-400' : 'text-gray-400';

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={clsx(
        'w-full flex items-center gap-1.5 px-2 py-1 text-left rounded transition-all text-xs',
        isSelected
          ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
          : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      title={node.path}
    >
      <span className="w-3 flex-shrink-0" />
      <FileCode size={12} className={clsx('flex-shrink-0', langColor)} />
      <span className="truncate font-mono">{node.name}</span>
    </button>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({
  tree, selectedPath, onSelectFile, searchFilter
}) => {
  return (
    <div className="overflow-y-auto h-full py-2">
      {tree.children?.map((node) => (
        <TreeNode
          key={node.path || node.name}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelectFile}
          searchFilter={searchFilter}
        />
      )) ?? (
        <p className="text-xs text-gray-500 text-center mt-8">No files</p>
      )}
    </div>
  );
};

export default FileExplorer;
