import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1e1e1e',
          color: '#e5e7eb',
          border: '1px solid #404040',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#1e1e1e' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1e1e1e' } },
      }}
    />
  </React.StrictMode>,
)
