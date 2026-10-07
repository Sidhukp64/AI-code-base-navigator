import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, MessageSquare, BarChart3,
  GitBranch, Search, Settings, ChevronLeft, ChevronRight,
  Code2, Menu, X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import clsx from 'clsx';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: FolderOpen, label: 'Explorer', to: '/explorer' },
  { icon: MessageSquare, label: 'AI Assistant', to: '/chat' },
  { icon: BarChart3, label: 'Overview', to: '/overview' },
  { icon: GitBranch, label: 'Code Flow', to: '/flow' },
  { icon: Search, label: 'Search', to: '/search' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, currentProject } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-dark-700',
        sidebarCollapsed && 'justify-center px-2'
      )}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Code2 size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-none">AI Codebase</p>
            <p className="text-xs text-blue-400 font-medium">Navigator</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            title={sidebarCollapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
                sidebarCollapsed && 'justify-center px-2',
                isActive
                  ? 'bg-dark-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={clsx(isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300')} />
                {!sidebarCollapsed && <span className="font-medium">{label}</span>}
                {!sidebarCollapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Project pill */}
      {currentProject && !sidebarCollapsed && (
        <div className="p-3 border-t border-dark-700">
          <div className="bg-dark-700 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-500 mb-0.5">Active Project</p>
            <p className="text-sm text-white font-medium truncate">{currentProject.name}</p>
            <p className="text-xs text-blue-400 mt-0.5">{currentProject.stats.total_files} files</p>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex items-center justify-center px-4 py-3 text-gray-500 hover:text-white border-t border-dark-700 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-dark-800 border-r border-dark-700 transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-400 hover:text-white"
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 bg-dark-800 border-r border-dark-700 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default AppSidebar;
