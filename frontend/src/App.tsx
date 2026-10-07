import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Overview from './pages/Overview';
import CodeFlow from './pages/CodeFlow';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-dark-900 text-gray-100">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 flex min-h-0 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/flow" element={<CodeFlow />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
