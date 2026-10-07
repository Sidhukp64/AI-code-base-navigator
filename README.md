# 🧭 AI Codebase Navigator

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?logo=vite&logoColor=white)

**An intelligent, developer-focused code intelligence tool to explore, understand, and question any codebase using natural language.**

[Key Features](#-core-features) • [Architecture](#-architecture--rag-pipeline) • [Quick Start](#-quick-start) • [Usage Guide](#-usage-guide) • [API Reference](#-api-endpoints)

</div>

---

## 🎯 Overview

Understanding unfamiliar or large codebases typically requires tedious manual file exploration and grep searches. **AI Codebase Navigator** solves this by combining local repository scanning, AST and keyword-based Retrieval-Augmented Generation (RAG), and an interactive developer workbench.

Unlike generic chat wrappers, this is built specifically as a **developer tool**:
- Strict **Source Citations** directly mapped to file paths and line ranges.
- **Click-to-navigate** code viewer that jumps straight to the cited source lines with syntax highlighting.
- **Visual Code Flow diagrams** depicting control flow from frontend trigger to backend and database layers.
- **Dual Mode (Simple vs. Developer)** for both junior learners and senior software engineers.
- **Built-in Demo Repository** for instant evaluation without uploading external code.
- **Zero-Configuration Fallback** that provides realistic responses even without an OpenAI API key.

---

## ✨ Core Features

### 1. 📊 Project Dashboard
- View recently loaded projects, analyzed file totals, language breakdowns, functions, and API endpoints.
- Quick action launchers: **Upload ZIP**, **Connect GitHub**, and **Try Demo**.

### 2. 🗂️ Safe ZIP Codebase Extraction & Scanning
- Secure ZIP unpacker with built-in path-traversal protection.
- Automatically ignores noise: `node_modules`, `.git`, `__pycache__`, `.venv`, `dist`, `build`, and binary formats.
- Language classification supporting Python, TypeScript, JavaScript, Java, C/C++, C#, SQL, HTML, CSS, and Markdown.

### 3. 🌲 Codebase Explorer & Code Viewer
- Expandable directory tree with real-time file search/filtering.
- Code viewer with line numbering, syntax highlighting, and copy-to-clipboard.
- Interactive citation jumping: clicking any AI reference highlights target line ranges and scrolls into view.

### 4. 💬 AI Codebase Chat with Exact Citations
- Natural-language Q&A powered by RAG chunking and relevance ranking.
- Explicit source citations formatted as `file_path: lines X–Y`.
- Honest negative detection: responds with *"I could not find this information in the analyzed codebase"* when code is not present.

### 5. ⚡ Code Flow Explainer
- Automatically constructs connected node diagrams (`Component → Route → Service → Database → Token`) explaining architectural execution flow.

### 6. 📈 Project Architecture Overview
- Auto-detects primary architectural modules (Authentication, Database, API, User Management, Frontend, Configuration).
- Generates high-level summaries derived from detected source patterns.

### 7. 🎯 Quick "Find Where" & Global Code Search
- One-click shortcuts to locate **Authentication**, **Database**, **API Endpoints**, **Payment Logic**, **File Uploads**, **Email Services**, and **Configuration**.
- Full-text fuzzy code search with line previews and a global `Ctrl + K` modal.

### 8. 🔄 Beginner vs. Developer Mode
- **Developer Mode**: technical architecture terms, design patterns, and exact function interfaces.
- **Simple Mode**: plain-English explanations tailored for students and beginner developers.

### 9. 🐙 Public GitHub Repository Import
- Fetch and analyze public repositories directly by entering GitHub URLs (e.g., `https://github.com/owner/repo`).

### 10. 🎮 Built-in Demo Project
- Ships with a realistic full-stack **Student Management System** (Flask, SQLAlchemy, SQLite, React, and TypeScript) ready for instant exploration.

---

## 🏗️ Architecture & RAG Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│    Dashboard │ Explorer │ AI Chat │ Code Flow │ Search       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Core                     │
│  /projects        /chat        /search       /overview      │
├─────────────────────────────────────────────────────────────┤
│  File Scanner        RAG Indexer       AI / Mock Engine     │
│  (Tree & Langs)   (Chunks & Lines)    (Prompt & Citations)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
     Uploaded / Git Files                 OpenAI GPT-4o-mini
     (Read-Only Data)                     (or Built-In Mock)
```

### The RAG Pipeline
1. **Source Ingestion & Chunking**: Files are scanned and partitioned into chunks with exact `file_path`, `start_line`, and `end_line` metadata.
2. **Relevance Retrieval**: User queries trigger semantic keyword and path matching against the chunk index to retrieve the top 8 relevant blocks.
3. **Prompt Composition**: Chunks are injected into a structured system prompt instructing the LLM to only cite verified code lines.
4. **Interactive Output**: Citations returned from the API are rendered as interactive links in the UI that open the code viewer and scroll to the exact cited lines.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (tested up to Python 3.14)
- **Node.js 18+**

### 1. Clone the Repository
```bash
git clone https://github.com/Sidhukp64/AI-code-base-navigator.git
cd AI-code-base-navigator
```

### 2. Configure Environment (Optional)
Copy the template in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your API key if you want to use live OpenAI models:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
DEMO_MODE=false
```
> **Note**: If you don't supply an OpenAI key, the app runs in **Demo Mode** using its built-in code analysis engine.

### 3. Launch the Application

#### Windows (One-Click)
Double-click `start_all.bat` or run:
```cmd
start_all.bat
```

#### Manual Start
**Terminal 1 — Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Backend runs on `http://localhost:8000` (docs at `http://localhost:8000/docs`).*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📖 Usage Guide

1. **Open the Dashboard**: Navigate to `http://localhost:5173`.
2. **Load a Codebase**:
   - Click **Try Demo** to load the pre-configured Student Management System immediately.
   - Click **Upload Repository** to drag-and-drop any `.zip` codebase.
   - Click **Connect GitHub** to paste a public repository URL.
3. **Explore the Files**: In the **Explorer** tab, browse files, view syntax highlighting, and copy code snippets.
4. **Ask the AI**:
   - *"Where is user authentication implemented?"*
   - *"Which file connects to the database?"*
   - *"Explain the login process."*
   - *"Where are API endpoints defined?"*
   - *"Explain this project in simple terms."*
5. **Inspect Citations**: Click any cited file pill in the chat to open the file and highlight cited lines.
6. **Generate Code Flow**: Go to **Code Flow**, select a quick flow or type *"Explain the login flow"* to see visual nodes.
7. **Find Modules**: Use the **Search** tab to search keywords or click a **Find Where** category.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/projects/` | List all loaded projects |
| `GET` | `/api/projects/demo` | Load the built-in demo repository |
| `POST` | `/api/projects/upload` | Upload and analyze a ZIP repository |
| `GET` | `/api/projects/{id}` | Retrieve project stats and file tree |
| `GET` | `/api/projects/{id}/file` | Fetch content and syntax info for a file |
| `POST` | `/api/chat/{id}` | Ask questions with RAG retrieval and citations |
| `GET` | `/api/chat/{id}/suggestions` | Get contextual question suggestions |
| `GET` | `/api/search/{id}?q={query}` | Global text search across codebase files |
| `GET` | `/api/search/{id}/find/{category}`| Locate code for auth, database, api, etc. |
| `POST` | `/api/github/import` | Clone and analyze a public GitHub repo |
| `GET` | `/api/overview/{id}` | Architectural overview and module analysis |

---

## 🛡️ Security & Privacy

- **Data-Only Execution**: Uploaded source code is treated strictly as read-only plain text and is **never executed**.
- **Archive Extraction Guard**: ZIP decompression validates canonical file destinations to eliminate path-traversal vulnerabilities.
- **Upload Size Bounds**: Strict upload file limits prevent denial-of-service from oversized archives.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).